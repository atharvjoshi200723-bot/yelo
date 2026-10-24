import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { UpdateProfileInput } from '../auth/validators';

export async function getProfile(userId: string) {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.phone_verified, u.email_verified, u.role, u.status, u.created_at,
            p.name, p.avatar_url, p.bio, p.gender, p.city, p.college, p.college_verified,
            p.interests, p.location_name
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');
  return result.rows[0];
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates.push(`${dbKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) return getProfile(userId);

  updates.push('updated_at = NOW()');
  values.push(userId);

  await query(
    `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
    values
  );

  return getProfile(userId);
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new AppError(400, 'Cannot block yourself');
  await query(
    'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [blockerId, blockedId]
  );
  return { blocked: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, blockedId]);
  return { unblocked: true };
}

export async function getPublicProfile(userId: string) {
  const result = await query(
    `SELECT u.id, p.name, p.avatar_url, p.bio, p.city, p.college,
            p.interests, bp.avg_rating, bp.total_reviews, bp.total_sessions, bp.title as buddy_title
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN buddy_profiles bp ON bp.user_id = u.id
     WHERE u.id = $1 AND u.status = 'active'`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');
  return result.rows[0];
}
