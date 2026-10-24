import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { CreatePostInput, FeedQuery } from './validators';

export async function createPost(userId: string, data: CreatePostInput) {
  const result = await query(
    `INSERT INTO social_posts (user_id, category, title, content, image_urls, location_lat, location_lng, location_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, data.category, data.title || null, data.content, data.imageUrls || [], data.locationLat || null, data.locationLng || null, data.locationName || null]
  );
  return result.rows[0];
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
    `SELECT sp.*, 
            p.name as author_name, p.avatar_url as author_avatar, p.city as author_city, p.college as author_college
     FROM social_posts sp
     JOIN profiles p ON p.user_id = sp.user_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...values, params.limit, offset]
  );

  const posts = result.rows;

  // Check if user liked/saved these posts
  if (posts.length > 0) {
    const postIds = posts.map((p: Record<string, unknown>) => p.id);
    const [likesResult, savesResult] = await Promise.all([
      query(`SELECT post_id FROM social_likes WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
      query(`SELECT post_id FROM social_saves WHERE post_id = ANY($1) AND user_id = $2`, [postIds, userId]),
    ]);
    const likedIds = new Set(likesResult.rows.map((r: Record<string, unknown>) => r.post_id));
    const savedIds = new Set(savesResult.rows.map((r: Record<string, unknown>) => r.post_id));

    for (const post of posts) {
      const p = post as Record<string, unknown>;
      p.isLiked = likedIds.has(p.id);
      p.isSaved = savedIds.has(p.id);
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
    `SELECT sp.*, 
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
      `SELECT sc.*, p.name as author_name, p.avatar_url as author_avatar
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

  return post;
}

export async function likePost(userId: string, postId: string) {
  const postCheck = await query('SELECT id FROM social_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const existing = await query('SELECT id FROM social_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  if (existing.rows.length > 0) {
    // Unlike
    await query('DELETE FROM social_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    await query('UPDATE social_posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
    return { liked: false };
  } else {
    // Like
    await query('INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    await query('UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
    return { liked: true };
  }
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
    'INSERT INTO social_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
    [postId, userId, content]
  );
  await query('UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);
  return result.rows[0];
}

export async function deletePost(userId: string, postId: string) {
  const result = await query('DELETE FROM social_posts WHERE id = $1 AND user_id = $2 RETURNING id', [postId, userId]);
  if (result.rows.length === 0) throw new AppError(404, 'Post not found or not authorized');
}

export async function getComments(postId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT sc.*, p.name as author_name, p.avatar_url as author_avatar
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
    `SELECT sp.*, p.name as author_name, p.avatar_url as author_avatar, p.city as author_city
     FROM social_posts sp
     JOIN profiles p ON p.user_id = sp.user_id
     WHERE sp.user_id = $1
     ORDER BY sp.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}
