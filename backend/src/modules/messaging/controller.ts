import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as messagingService from './service';

export async function getConversations(req: AuthRequest, res: Response) {
  const conversations = await messagingService.getConversations(req.user!.id);
  res.json({ conversations });
}

export async function getConversation(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const conversation = await messagingService.getConversation(id, req.user!.id);
  res.json({ conversation });
}

export async function getMessages(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const messages = await messagingService.getMessages(id, req.user!.id, page, limit);
  res.json({ messages });
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { content } = req.body as { content: string };
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  const message = await messagingService.sendMessage(id, req.user!.id, content);
  res.status(201).json({ message });
}

export async function createConversation(req: AuthRequest, res: Response) {
  const { otherUserId, type, title } = req.body as { otherUserId: string; type?: string; title?: string };
  if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required' });
  const result = await messagingService.createConversation(req.user!.id, otherUserId, type, title);
  res.status(201).json(result);
}

export async function findConversation(req: AuthRequest, res: Response) {
  const otherUserId = req.query.userId as string;
  const type = (req.query.type as string) || 'buddy';
  if (!otherUserId) return res.status(400).json({ error: 'userId query parameter is required' });
  const result = await messagingService.findConversation(req.user!.id, otherUserId, type);
  res.json(result);
}
