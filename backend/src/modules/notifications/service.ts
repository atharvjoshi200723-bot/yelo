import { query } from '../../lib/db';

export async function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  const countResult = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_read = FALSE) as unread FROM notifications WHERE user_id = $1', [userId]);
  return {
    notifications: result.rows,
    unreadCount: parseInt((countResult.rows[0] as { unread: string }).unread, 10),
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}

export async function markAllAsRead(userId: string) {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [userId]);
}
