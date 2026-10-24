import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as userService from './service';
import { updateProfileSchema } from '../auth/validators';

// Internal bridge type used only here to keep `AuthRequest` callable through
// `asyncHandler` in routes.ts without a full Express `Request` compat chain.
type RP = Response<any, Record<string, any>>;
type PR = Promise<RP | undefined>;

export async function getProfile(req: AuthRequest, res: Response): PR {
  const profile = await userService.getProfile(req.user!.id);
  return res.json({ profile });
}

export async function updateProfile(req: AuthRequest, res: Response): PR {
  const data = updateProfileSchema.parse(req.body);
  const profile = await userService.updateProfile(req.user!.id, data);
  return res.json({ profile });
}

export async function uploadAvatar(req: AuthRequest, res: Response): PR {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  const profile = await userService.updateProfile(req.user!.id, { avatarUrl: imageUrl });
  return res.json({ profile, imageUrl });
}

export async function blockUser(req: AuthRequest, res: Response): PR {
  const userId = req.params.userId as string;
  const result = await userService.blockUser(req.user!.id, userId);
  return res.json(result);
}

export async function unblockUser(req: AuthRequest, res: Response): PR {
  const userId = req.params.userId as string;
  const result = await userService.unblockUser(req.user!.id, userId);
  return res.json(result);
}

export async function getPublicProfile(req: AuthRequest, res: Response): PR {
  const userId = req.params.userId as string;
  const profile = await userService.getPublicProfile(userId);
  return res.json({ profile });
}
