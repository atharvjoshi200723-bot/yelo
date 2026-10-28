import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { getRealtimeIO } from '../../lib/realtime';

export async function getColleges() {
  const result = await query('SELECT * FROM colleges ORDER BY sort_order, name');
  return result.rows;
}

export async function getCollegeBySlug(slug: string) {
  const result = await query('SELECT * FROM colleges WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'College not found');
  return result.rows[0];
}

export async function getCategories(collegeId: string) {
  const result = await query(
    'SELECT * FROM forum_categories WHERE college_id = $1 ORDER BY sort_order, name',
    [collegeId]
  );
  return result.rows;
}

export async function getForumPosts(categoryId: string, page: number = 1, limit: number = 20, userId: string) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT fp.*, p.name as author_name, p.avatar_url as author_avatar
     FROM forum_posts fp
     LEFT JOIN profiles p ON p.user_id = fp.user_id AND fp.is_anonymous = FALSE
     WHERE fp.category_id = $1 AND fp.status = 'active'
     ORDER BY fp.is_pinned DESC, fp.created_at DESC
     LIMIT $2 OFFSET $3`,
    [categoryId, limit, offset]
  );

  const countResult = await query(
    "SELECT COUNT(*) as total FROM forum_posts WHERE category_id = $1 AND status = 'active'",
    [categoryId]
  );

  // Check upvotes
  if (result.rows.length > 0) {
    const postIds = result.rows.map((r: Record<string, unknown>) => r.id);
    const upvotes = await query(
      'SELECT post_id FROM forum_upvotes WHERE post_id = ANY($1) AND user_id = $2',
      [postIds, userId]
    );
    const upvotedIds = new Set(upvotes.rows.map((r: Record<string, unknown>) => r.post_id));
    for (const row of result.rows) {
      (row as Record<string, unknown>).isUpvoted = upvotedIds.has((row as Record<string, unknown>).id);
    }
  }

  return {
    posts: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt((countResult.rows[0] as { total: string }).total, 10),
    },
  };
}

export async function createForumPost(userId: string, categoryId: string, title: string, content: string, isAnonymous: boolean, imageUrls?: string[]) {
  const catCheck = await query('SELECT id FROM forum_categories WHERE id = $1', [categoryId]);
  if (catCheck.rows.length === 0) throw new AppError(404, 'Category not found');

  const result = await query(
    `INSERT INTO forum_posts (category_id, user_id, title, content, is_anonymous, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [categoryId, userId, title, content, isAnonymous, imageUrls || []]
  );
  const post = result.rows[0];

  // Enrich with author fields so every client can render the card without a refetch
  const author = await query(
    `SELECT p.name as author_name, p.avatar_url as author_avatar
     FROM profiles p WHERE p.user_id = $1`,
    [userId]
  );
  const enriched = {
    ...post,
    author_name: isAnonymous ? null : (author.rows[0] as { author_name: string } | undefined)?.author_name ?? null,
    author_avatar: isAnonymous ? null : (author.rows[0] as { author_avatar: string } | undefined)?.author_avatar ?? null,
    isUpvoted: false,
  };

  // Push to everyone watching this category so new posts appear without a reload
  getRealtimeIO()?.to(`category:${categoryId}`).emit('forum_post', enriched);

  return enriched;
}

export async function getForumPostById(postId: string, userId: string) {
  const result = await query(
    `SELECT fp.*, p.name as author_name, p.avatar_url as author_avatar, fc.name as category_name, c.name as college_name, c.slug as college_slug
     FROM forum_posts fp
     LEFT JOIN profiles p ON p.user_id = fp.user_id AND fp.is_anonymous = FALSE
     JOIN forum_categories fc ON fc.id = fp.category_id
     JOIN colleges c ON c.id = fc.college_id
     WHERE fp.id = $1`,
    [postId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Post not found');

  const post = result.rows[0] as Record<string, unknown>;

  const upvoteCheck = await query('SELECT id FROM forum_upvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  post.isUpvoted = upvoteCheck.rows.length > 0;

  return post;
}

export async function upvotePost(userId: string, postId: string) {
  const existing = await query('SELECT id FROM forum_upvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  if (existing.rows.length > 0) {
    await query('DELETE FROM forum_upvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    await query('UPDATE forum_posts SET upvotes = upvotes - 1 WHERE id = $1', [postId]);
    return { upvoted: false };
  } else {
    await query('INSERT INTO forum_upvotes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    await query('UPDATE forum_posts SET upvotes = upvotes + 1 WHERE id = $1', [postId]);
    return { upvoted: true };
  }
}

export async function addComment(userId: string, postId: string, content: string, isAnonymous: boolean, imageUrls?: string[]) {
  const postCheck = await query('SELECT id FROM forum_posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) throw new AppError(404, 'Post not found');

  const result = await query(
    `INSERT INTO forum_comments (post_id, user_id, content, is_anonymous, image_urls)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [postId, userId, content, isAnonymous, imageUrls || []]
  );
  const countResult = await query(
    'UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = $1 RETURNING comment_count, category_id',
    [postId]
  );

  // Enrich with author fields (hidden when anonymous), same shape as getComments
  const comment = result.rows[0];
  const author = await query(
    `SELECT p.name as author_name, p.avatar_url as author_avatar
     FROM profiles p WHERE p.user_id = $1`,
    [userId]
  );
  const enriched = {
    ...comment,
    author_name: isAnonymous ? null : (author.rows[0] as { author_name: string } | undefined)?.author_name ?? null,
    author_avatar: isAnonymous ? null : (author.rows[0] as { author_avatar: string } | undefined)?.author_avatar ?? null,
  };

  // Push to everyone viewing this post so comments appear without a reload,
  // and bump the count on the category list for anyone watching it.
  const io = getRealtimeIO();
  const { comment_count, category_id } = countResult.rows[0] as { comment_count: number; category_id: string };
  io?.to(`post:${postId}`).emit('forum_comment', enriched);
  io?.to(`category:${category_id}`).emit('forum_comment_count', { postId, comment_count });

  // Notify post author
  const post = (await query('SELECT user_id FROM forum_posts WHERE id = $1', [postId])).rows[0] as { user_id: string };
  if (post.user_id !== userId) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'forum_reply', 'New reply', 'Someone replied to your post', $2)`,
      [post.user_id, JSON.stringify({ postId })]
    );
  }

  // Return the enriched row: the socket event may beat this HTTP response, so the
  // sender's own UI needs the same author fields either way.
  return enriched;
}

export async function getComments(postId: string, userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT fc.*, p.name as author_name, p.avatar_url as author_avatar
     FROM forum_comments fc
     LEFT JOIN profiles p ON p.user_id = fc.user_id AND fc.is_anonymous = FALSE
     WHERE fc.post_id = $1
     ORDER BY fc.created_at ASC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  );
  return result.rows;
}

export async function deletePost(userId: string, postId: string) {
  const result = await query(
    "UPDATE forum_posts SET status = 'removed' WHERE id = $1 AND user_id = $2 RETURNING id",
    [postId, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Post not found or not authorized');
}

export async function deleteComment(userId: string, commentId: string) {
  const result = await query(
    'DELETE FROM forum_comments WHERE id = $1 AND user_id = $2 RETURNING id, post_id',
    [commentId, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Comment not found or not authorized');
  await query('UPDATE forum_posts SET comment_count = comment_count - 1 WHERE id = $1', [(result.rows[0] as Record<string, unknown>).post_id]);
}
