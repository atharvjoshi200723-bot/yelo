import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as notifService from './service';

export async function getNotifications(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) || '1', 10);
  const result = await notifService.getNotifications(req.user!.id, page);
  res.json(result);
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await notifService.markAsRead(req.user!.id, id);
  res.json({ message: 'Marked as read' });
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  await notifService.markAllAsRead(req.user!.id);
  res.json({ message: 'All notifications marked as read' });
}
