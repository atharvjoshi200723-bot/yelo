import { query } from '../../lib/db';
import { emitToUser } from '../../lib/realtime';

export async function createNotification(userId: string, type: string, title: string, message: string, data?: unknown) {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  const row = result.rows[0];
  emitToUser(userId, 'notification', row);
  return row;
}

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
