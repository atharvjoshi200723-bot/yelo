import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export function setSocketIO(socketIO: SocketServer) {
  io = socketIO;
}

export async function getConversations(userId: string) {
  const result = await query(
    `SELECT c.*, cm.last_read_at,
            (SELECT json_build_object('id', p.user_id, 'name', p.name, 'avatar_url', p.avatar_url)
             FROM conversation_members cm2
             JOIN profiles p ON p.user_id = cm2.user_id
             WHERE cm2.conversation_id = c.id AND cm2.user_id != $1
             LIMIT 1) as other_user,
            (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
            (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = FALSE) as unread_count
     FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
     ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );
  return result.rows;
}

export async function getConversation(conversationId: string, userId: string) {
  const memberCheck = await query(
    'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (memberCheck.rows.length === 0) throw new AppError(403, 'Not a member of this conversation');

  const conv = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  if (conv.rows.length === 0) throw new AppError(404, 'Conversation not found');

  const members = await query(
    `SELECT cm.user_id, p.name, p.avatar_url
     FROM conversation_members cm
     JOIN profiles p ON p.user_id = cm.user_id
     WHERE cm.conversation_id = $1`,
    [conversationId]
  );

  // Mark messages as read
  await query(
    'UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE',
    [conversationId, userId]
  );
  await query(
    'UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  return { ...conv.rows[0], members: members.rows };
}

export async function getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50) {
  const memberCheck = await query(
    'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (memberCheck.rows.length === 0) throw new AppError(403, 'Not a member of this conversation');

  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT m.*, p.name as sender_name, p.avatar_url as sender_avatar
     FROM messages m
     JOIN profiles p ON p.user_id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  // Mark as read
  await query(
    'UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE',
    [conversationId, userId]
  );

  return result.rows.reverse();
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const memberCheck = await query(
    'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, senderId]
  );
  if (memberCheck.rows.length === 0) throw new AppError(403, 'Not a member of this conversation');

  // Check if blocked by any other member
  const convMembers = await query(
    'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2',
    [conversationId, senderId]
  );
  for (const member of convMembers.rows) {
    const memberId = (member as { user_id: string }).user_id;
    const blockCheck = await query(
      `SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [senderId, memberId]
    );
    if (blockCheck.rows.length > 0) {
      throw new AppError(403, 'Cannot send messages to this user');
    }
  }

  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderId, content]
  );

  const message = result.rows[0];

  // Update conversation timestamp
  await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

  // Get other members for notification
  const otherMembers = await query(
    'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2',
    [conversationId, senderId]
  );

  const senderProfile = await query('SELECT name, avatar_url FROM profiles WHERE user_id = $1', [senderId]);
  const sender = senderProfile.rows[0] as { name: string; avatar_url: string };

  // Emit via Socket.IO
  if (io) {
    for (const member of otherMembers.rows) {
      const memberId = (member as { user_id: string }).user_id;
      io.to(`user:${memberId}`).emit('new_message', {
        ...message,
        sender_name: sender.name,
        sender_avatar: sender.avatar_url,
      });
    }
  }

  // Create notifications
  for (const member of otherMembers.rows) {
    const memberId = (member as { user_id: string }).user_id;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'message', 'New message', $2, $3)`,
      [memberId, `${sender.name}: ${content.substring(0, 100)}`, JSON.stringify({ conversationId })]
    );
  }

  return { ...message, sender_name: sender.name, sender_avatar: sender.avatar_url };
}

export async function createConversation(userId: string, otherUserId: string, type: string = 'general', title?: string) {
  if (userId === otherUserId) {
    throw new AppError(400, 'You cannot start a chat with yourself');
  }

  // Check if blocked
  const blockCheck = await query(
    `SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [userId, otherUserId]
  );
  if (blockCheck.rows.length > 0) {
    throw new AppError(403, 'Cannot create conversation with this user');
  }

  // Check if conversation already exists between these two users
  const existing = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
     JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
     WHERE c.type = $3`,
    [userId, otherUserId, type]
  );

  if (existing.rows.length > 0) {
    return { id: (existing.rows[0] as { id: string }).id, isNew: false };
  }

  const result = await query(
    `INSERT INTO conversations (type, title) VALUES ($1, $2) RETURNING id`,
    [type, title || null]
  );
  const convId = (result.rows[0] as { id: string }).id;
  await query(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)
     ON CONFLICT (conversation_id, user_id) DO NOTHING`,
    [convId, userId, otherUserId]
  );
  return { id: convId, isNew: true };
}

export async function findConversation(userId: string, otherUserId: string, type: string = 'buddy') {
  const result = await query(
    `SELECT c.id, c.type, c.title, c.created_at
     FROM conversations c
     JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
     JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
     WHERE c.type = $3
     LIMIT 1`,
    [userId, otherUserId, type]
  );

  if (result.rows.length === 0) {
    return { conversationId: null };
  }

  return { conversationId: (result.rows[0] as { id: string }).id };
}
