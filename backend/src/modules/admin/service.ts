import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';

export async function getDashboardStats() {
  const [users, listings, buddyProfiles, forumPosts, reports, rentals, transactions] = await Promise.all([
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM users'),
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM rental_listings'),
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM buddy_profiles'),
    query('SELECT COUNT(*) as total FROM forum_posts WHERE status = \'active\''),
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'pending\') as pending FROM reports'),
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'completed\') as completed FROM rentals'),
    query('SELECT COALESCE(SUM(platform_fee), 0) as total_commission FROM transactions WHERE status = \'completed\''),
  ]);

  return {
    totalUsers: parseInt((users.rows[0] as { total: string }).total, 10),
    activeUsers: parseInt((users.rows[0] as { active: string }).active, 10),
    totalListings: parseInt((listings.rows[0] as { total: string }).total, 10),
    activeListings: parseInt((listings.rows[0] as { active: string }).active, 10),
    buddyProfiles: parseInt((buddyProfiles.rows[0] as { total: string }).total, 10),
    activeBuddyProfiles: parseInt((buddyProfiles.rows[0] as { active: string }).active, 10),
    forumPosts: parseInt((forumPosts.rows[0] as { total: string }).total, 10),
    totalReports: parseInt((reports.rows[0] as { total: string }).total, 10),
    pendingReports: parseInt((reports.rows[0] as { pending: string }).pending, 10),
    totalRentals: parseInt((rentals.rows[0] as { total: string }).total, 10),
    completedRentals: parseInt((rentals.rows[0] as { completed: string }).completed, 10),
    totalCommission: parseFloat((transactions.rows[0] as { total_commission: string }).total_commission),
  };
}

export async function getUsers(page: number = 1, limit: number = 20, search?: string) {
  const offset = (page - 1) * limit;
  let queryStr = `
    SELECT u.id, u.email, u.phone, u.phone_verified, u.email_verified, u.status, u.role, u.created_at,
           p.name, p.avatar_url, p.city, p.college
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id`;
  const values: unknown[] = [];

  if (search) {
    queryStr += ` WHERE u.email ILIKE $1 OR p.name ILIKE $1`;
    values.push(`%${search}%`);
  }

  queryStr += ` ORDER BY u.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const result = await query(queryStr, values);
  return result.rows;
}

export async function updateUserStatus(userId: string, status: string, adminId: string, reason: string) {
  if (!['active', 'suspended', 'banned'].includes(status)) {
    throw new AppError(400, 'Invalid status');
  }
  await query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
  await query(
    'INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason) VALUES ($1, $2, $3, $4)',
    [adminId, `suspend_user`, userId, reason]
  );
  return { status };
}

export async function getListings(page: number = 1, limit: number = 20, search?: string) {
  const offset = (page - 1) * limit;
  let queryStr = `
    SELECT rl.id, rl.owner_id, rl.category_id, rl.title, rl.description,
           rl.price_per_day, rl.price_per_week, rl.price_per_month, rl.deposit,
           rl.negotiable, rl.condition, rl.image_urls, rl.location_name,
           rl.available_from, rl.available_until, rl.status, rl.views,
           rl.created_at, rl.updated_at,
           rc.name as category_name, p.name as owner_name
    FROM rental_listings rl
    JOIN rental_categories rc ON rc.id = rl.category_id
    JOIN profiles p ON p.user_id = rl.owner_id`;
  const values: unknown[] = [];

  if (search) {
    queryStr += ` WHERE rl.title ILIKE $1`;
    values.push(`%${search}%`);
  }

  queryStr += ` ORDER BY rl.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const result = await query(queryStr, values);
  return result.rows;
}

export async function removeListing(listingId: string, adminId: string, reason: string) {
  await query("UPDATE rental_listings SET status = 'removed' WHERE id = $1", [listingId]);
  await query(
    'INSERT INTO admin_actions (admin_id, action_type, target_listing_id, reason) VALUES ($1, $2, $3, $4)',
    [adminId, 'remove_listing', listingId, reason]
  );
}

export async function removeForumPost(postId: string, adminId: string, reason: string) {
  await query("UPDATE forum_posts SET status = 'removed' WHERE id = $1", [postId]);
  await query(
    'INSERT INTO admin_actions (admin_id, action_type, target_forum_post_id, reason) VALUES ($1, $2, $3, $4)',
    [adminId, 'remove_post', postId, reason]
  );
}

export async function createCollege(name: string, slug: string, city: string = 'Dehradun', description?: string) {
  const result = await query(
    'INSERT INTO colleges (name, slug, city, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, slug, city, description || null]
  );
  return result.rows[0];
}

export async function createForumCategory(collegeId: string, name: string, slug: string, description?: string) {
  const result = await query(
    'INSERT INTO forum_categories (college_id, name, slug, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [collegeId, name, slug, description || null]
  );
  return result.rows[0];
}

export async function getBuddyProfiles(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT bp.id, bp.user_id, bp.buddy_type, bp.title, bp.description, bp.activities,
           bp.price_per_hour, bp.negotiable, bp.availability_days, bp.availability_times,
           bp.location_name, bp.gender, bp.image_urls, bp.avg_rating, bp.total_reviews,
           bp.total_sessions, bp.status, bp.created_at, bp.updated_at,
           p.name, p.avatar_url, p.city
     FROM buddy_profiles bp
     JOIN profiles p ON p.user_id = bp.user_id
     ORDER BY bp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function suspendBuddyProfile(profileId: string, adminId: string, reason: string) {
  await query("UPDATE buddy_profiles SET status = 'removed' WHERE id = $1", [profileId]);
  await query(
    'INSERT INTO admin_actions (admin_id, action_type, target_buddy_profile_id, reason) VALUES ($1, $2, $3, $4)',
    [adminId, 'suspend_buddy', profileId, reason]
  );
}
