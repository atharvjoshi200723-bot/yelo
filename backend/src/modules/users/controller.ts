import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as userService from './service';
import { updateProfileSchema } from '../auth/validators';

export async function getProfile(req: AuthRequest, res: Response) {
  const profile = await userService.getProfile(req.user!.id);
  res.json({ profile });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const profile = await userService.updateProfile(req.user!.id, data);
  res.json({ profile });
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  const profile = await userService.updateProfile(req.user!.id, { avatarUrl: imageUrl });
  res.json({ profile, imageUrl });
}

export async function blockUser(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const result = await userService.blockUser(req.user!.id, userId);
  res.json(result);
}

export async function unblockUser(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const result = await userService.unblockUser(req.user!.id, userId);
  res.json(result);
}

export async function getPublicProfile(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const profile = await userService.getPublicProfile(userId);
  res.json({ profile });
}
