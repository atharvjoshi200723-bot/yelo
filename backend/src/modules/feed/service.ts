import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { CreatePostInput, FeedQuery } from './validators';

// A Linkup plan packs its limit into the content string as
// "👥 Max N participants". Returns null when the post has no such line
// (i.e. it is not a plan, or the plan is unlimited).
export function parseMaxParticipants(content: string | null | undefined): number | null {
  const match = (content || '').match(/Max\s+(\d+)\s+participants?/i);
  return match ? parseInt(match[1], 10) : null;
}

export async function createPost(userId: string, data: CreatePostInput) {
  const result = await query(
    `INSERT INTO social_posts (user_id, category, title, content, image_urls, location_lat, location_lng, location_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [userId, data.category, data.title || null, data.content, data.imageUrls || [], data.locationLat || null, data.locationLng || null, data.locationName || null]
  );
  return getPostById(result.rows[0].id, userId);
}

export async function getFeed(userId: string, params: FeedQuery) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.category) {
    conditions.push(`sp.category = $${paramIndex++}`);
    values.push(params.category);
  }

  // Exclude blocked users
  conditions.push(`sp.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $${paramIndex++})`);
  values.push(userId);

  conditions.push(`sp.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $${paramIndex++})`);
  values.push(userId);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Save WHERE clause values for count query (before ORDER BY params are added)
  const whereValues = [...values];

  let orderBy = 'sp.created_at DESC';
  if (params.sort === 'popular') {
    orderBy = 'sp.likes_count DESC, sp.created_at DESC';
  } else if (params.sort === 'nearby' && params.lat && params.lng) {
    orderBy = `ST_Distance(
      ST_MakePoint(sp.location_lng, sp.location_lat)::geography,
      ST_MakePoint($${paramIndex++}, $${paramIndex++})::geography
    ) ASC NULLS LAST, sp.created_at DESC`;
    values.push(params.lng, params.lat);
  }

  const offset = (params.page - 1) * params.limit;

  // Count query uses only WHERE clause params (not ORDER BY params)
  const countResult = await query(
    `SELECT COUNT(*) as total FROM social_posts sp ${whereClause}`,
    whereValues
  );
  const total = parseInt((countResult.rows[0] as { total: string }).total, 10);

  const limitParam = paramIndex++;
  const offsetParam = paramIndex++;

  const result = await query(
    `SELECT sp.*, sp.user_id as author_id,
            p.name as author_name, p.avatar_url as author_avatar, p.city as author_city, p.college as author_college
     FROM social_posts sp
     JOIN profiles p ON p.user_id = sp.user_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...values, params.limit, offset]
  );

  const posts = result.rows;

  // Check if user liked/saved/joined these posts
  if (posts.length > 0) {
    const postIds = posts.map((p: Record<string, unknown>) => p.id);
    const [likesResult, savesResult, joinCountsResult, joinsResult, requestsResult] = await Promise.all([
      query(`SELECT post_id FROM social_likes WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
      query(`SELECT post_id FROM social_saves WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
      query(`SELECT post_id, COUNT(*)::int as count FROM plan_participants WHERE post_id = ANY($1) GROUP BY post_id`, [postIds]),
      query(`SELECT post_id FROM plan_participants WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
      query(`SELECT post_id FROM plan_join_requests WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
    ]);
    const likedIds = new Set(likesResult.rows.map((r: Record<string, unknown>) => r.post_id));
    const savedIds = new Set(savesResult.rows.map((r: Record<string, unknown>) => r.post_id));
    const joinedIds = new Set(joinsResult.rows.map((r: Record<string, unknown>) => r.post_id));
    const requestedIds = new Set(requestsResult.rows.map((r: Record<string, unknown>) => r.post_id));
    const joinCounts = new Map<string, number>(
      joinCountsResult.rows.map((r: Record<string, unknown>) => [r.post_id as string, r.count as number])
    );

    for (const post of posts) {
      const p = post as Record<string, unknown>;
      p.isLiked = likedIds.has(p.id);
      p.isSaved = savedIds.has(p.id);
      p.participants_count = joinCounts.get(p.id as string) ?? 0;
      p.max_participants = parseMaxParticipants(p.content as string);
      p.is_participant = joinedIds.has(p.id);
      p.has_pending_request = requestedIds.has(p.id);
    }
  }

  return {
    posts,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getPostById(postId: string, userId: string) {
  const result = await query(
    `SELECT sp.*, sp.user_id as author_id,
            p.name as author_name, p.avatar_url as author_avatar, p.city as author_city, p.college as author_college
     FROM social_posts sp
     JOIN profiles p ON p.user_id = sp.user_id
     WHERE sp.id = $1`,
    [postId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Post not found');
  }

  const post = result.rows[0] as Record<string, unknown>;

  const [likesResult, savesResult, commentsResult] = await Promise.all([
    query(`SELECT * FROM social_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]),
    query(`SELECT * FROM social_saves WHERE post_id = $1 AND user_id = $2`, [postId, userId]),
    query(
      `SELECT sc.*, sc.user_id as author_id, p.name as author_name, p.avatar_url as author_avatar
       FROM social_comments sc
       JOIN profiles p ON p.user_id = sc.user_id
       WHERE sc.post_id = $1
       ORDER BY sc.created_at ASC`,
      [postId]
    ),
  ]);

  post.isLiked = likesResult.rows.length > 0;
  post.isSaved = savesResult.rows.length > 0;
  post.comments = commentsResult.rows;
  Object.assign(post, await getJoinState(userId, postId, parseMaxParticipants(post.content as string)));

  return post;
}

/**
 * Ask to join a Linkup plan (or withdraw).
 *
 * The plan's creator accepts requests, so this only ever creates/removes a
 * pending request — the participant count moves when the owner accepts.
 * Toggling: none → requested → none; a participant who calls this leaves.
 */
export async function requestJoin(userId: string, postId: string) {
  const postCheck = await query('SELECT id, user_id, content FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const post = postCheck.rows[0] as Record<string, unknown>;
  const max = parseMaxParticipants(post.content as string);

  const [participantRes, requestRes] = await Promise.all([
    query('SELECT 1 FROM plan_participants WHERE post_id = $1 AND user_id = $2', [postId, userId]),
    query('SELECT 1 FROM plan_join_requests WHERE post_id = $1 AND user_id = $2', [postId, userId]),
  ]);

  if (participantRes.rows.length > 0) {
    // Already accepted — this call leaves the plan
    await query('DELETE FROM plan_participants WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  } else if (requestRes.rows.length > 0) {
    // Pending request — withdraw it
    await query('DELETE FROM plan_join_requests WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  } else {
    if (post.user_id === userId) {
      throw new AppError(400, 'You are the creator of this plan');
    }
    if (max !== null) {
      const countRes = await query(
        'SELECT COUNT(*)::int as count FROM plan_participants WHERE post_id = $1',
        [postId]
      );
      const count = countRes.rows[0]?.count ?? 0;
      if (count >= max) {
        throw new AppError(400, `This plan is full (${max} participant${max === 1 ? '' : 's'} max)`);
      }
    }
    await query(
      'INSERT INTO plan_join_requests (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );
  }

  return getJoinState(userId, postId, max);
}

async function getJoinState(userId: string, postId: string, max: number | null) {
  const [countRes, joinedRes, pendingRes] = await Promise.all([
    query('SELECT COUNT(*)::int as count FROM plan_participants WHERE post_id = $1', [postId]),
    query('SELECT 1 FROM plan_participants WHERE post_id = $1 AND user_id = $2', [postId, userId]),
    query('SELECT 1 FROM plan_join_requests WHERE post_id = $1 AND user_id = $2', [postId, userId]),
  ]);
  return {
    is_participant: joinedRes.rows.length > 0,
    has_pending_request: pendingRes.rows.length > 0,
    participants_count: countRes.rows[0]?.count ?? 0,
    max_participants: max,
  };
}

async function requirePlanOwner(postId: string, userId: string) {
  const postCheck = await query('SELECT id, user_id, content FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');
  const post = postCheck.rows[0] as Record<string, unknown>;
  if (post.user_id !== userId) throw new AppError(403, 'Only the plan creator can manage join requests');
  return post;
}

/** Owner's view: pending join requests waiting for a decision. */
export async function getJoinRequests(ownerId: string, postId: string) {
  await requirePlanOwner(postId, ownerId);
  const result = await query(
    `SELECT pjr.user_id, pjr.requested_at, p.name, p.avatar_url, p.city
     FROM plan_join_requests pjr
     JOIN profiles p ON p.user_id = pjr.user_id
     WHERE pjr.post_id = $1
     ORDER BY pjr.requested_at ASC`,
    [postId]
  );
  return { requests: result.rows };
}

/** Owner accepts a request: the participant count (and spots) move now. */
export async function acceptJoinRequest(ownerId: string, postId: string, requesterId: string) {
  const post = await requirePlanOwner(postId, ownerId);
  const max = parseMaxParticipants(post.content as string);

  const requestRes = await query(
    'SELECT 1 FROM plan_join_requests WHERE post_id = $1 AND user_id = $2',
    [postId, requesterId]
  );
  if (requestRes.rows.length === 0) throw new AppError(404, 'Join request not found');

  if (max !== null) {
    const countRes = await query(
      'SELECT COUNT(*)::int as count FROM plan_participants WHERE post_id = $1',
      [postId]
    );
    const count = countRes.rows[0]?.count ?? 0;
    if (count >= max) {
      throw new AppError(400, `This plan is full (${max} participant${max === 1 ? '' : 's'} max)`);
    }
  }

  await query('INSERT INTO plan_participants (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, requesterId]);
  await query('DELETE FROM plan_join_requests WHERE post_id = $1 AND user_id = $2', [postId, requesterId]);

  return getJoinState(ownerId, postId, max);
}

/** Owner rejects (or withdraws) a pending request. */
export async function rejectJoinRequest(ownerId: string, postId: string, requesterId: string) {
  const post = await requirePlanOwner(postId, ownerId);
  const result = await query(
    'DELETE FROM plan_join_requests WHERE post_id = $1 AND user_id = $2 RETURNING 1',
    [postId, requesterId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Join request not found');
  return { removed: true, max_participants: parseMaxParticipants(post.content as string) };
}

export async function likePost(userId: string, postId: string) {
  const postCheck = await query('SELECT id FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const existing = await query('SELECT id FROM social_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  let liked = false;
  if (existing.rows.length > 0) {
    // Unlike
    await query('DELETE FROM social_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    liked = false;
  } else {
    // Like
    await query('INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, userId]);
    liked = true;
  }

  const countRes = await query('SELECT COUNT(*)::int as count FROM social_likes WHERE post_id = $1', [postId]);
  const likesCount = parseInt(countRes.rows[0]?.count ?? '0', 10) || 0;
  await query('UPDATE social_posts SET likes_count = $1 WHERE id = $2', [likesCount, postId]);

  return { liked, likes_count: likesCount };
}

export async function savePost(userId: string, postId: string) {
  const postCheck = await query('SELECT id FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const existing = await query('SELECT id FROM social_saves WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  if (existing.rows.length > 0) {
    await query('DELETE FROM social_saves WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    return { saved: false };
  } else {
    await query('INSERT INTO social_saves (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    return { saved: true };
  }
}

export async function addComment(userId: string, postId: string, content: string) {
  const postCheck = await query('SELECT id FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const result = await query(
    'INSERT INTO social_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *, user_id as author_id',
    [postId, userId, content]
  );
  await query('UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);
  return result.rows[0];
}

export async function deletePost(userId: string, postId: string, role: string) {
  if (role === 'admin') {
    // Admins can delete any post
    const result = await query('DELETE FROM social_posts WHERE id = $1 RETURNING id', [postId]);
    if (result.rows.length === 0) throw new AppError(404, 'Post not found');
    return;
  }
  // Non-admins can only delete their own posts
  const result = await query('DELETE FROM social_posts WHERE id = $1 AND user_id = $2 RETURNING id', [postId, userId]);
  if (result.rows.length === 0) throw new AppError(404, 'Post not found or not authorized');
}

export async function getComments(postId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT sc.*, sc.user_id as author_id, p.name as author_name, p.avatar_url as author_avatar
     FROM social_comments sc
     JOIN profiles p ON p.user_id = sc.user_id
     WHERE sc.post_id = $1
     ORDER BY sc.created_at ASC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  );
  return result.rows;
}

export async function deleteComment(userId: string, commentId: string) {
  const result = await query('DELETE FROM social_comments WHERE id = $1 AND user_id = $2 RETURNING id, post_id', [commentId, userId]);
  if (result.rows.length === 0) throw new AppError(404, 'Comment not found or not authorized');
  await query('UPDATE social_posts SET comments_count = comments_count - 1 WHERE id = $1', [(result.rows[0] as Record<string, unknown>).post_id]);
}

export async function getUserPosts(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT sp.*, sp.user_id as author_id, p.name as author_name, p.avatar_url as author_avatar, p.city as author_city
     FROM social_posts sp
     JOIN profiles p ON p.user_id = sp.user_id
     WHERE sp.user_id = $1
     ORDER BY sp.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}
