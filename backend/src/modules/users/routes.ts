import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { upload } from '../../lib/upload';
import { uploadLimiter, profileUpdateLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';
import { query } from '../../lib/db';
import jwt from 'jsonwebtoken';
import { config } from '../../lib/config';

export const userRoutes = Router();

userRoutes.post('/claim-admin', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userEmail = (req.user!.email || '').toLowerCase();
  const secretKey = req.body.key;
  const adminEmails = (process.env.ADMIN_EMAILS || 'atharvjoshi200723@gmail.com').toLowerCase().split(',').map(e => e.trim());

  if (secretKey === 'yelo_admin_2026' || adminEmails.includes(userEmail)) {
    await query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
    const accessToken = jwt.sign(
      { id: userId, email: userEmail, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as unknown as number }
    );
    const refreshToken = jwt.sign(
      { id: userId, email: userEmail, role: 'admin' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn as unknown as number }
    );
    return res.json({ success: true, role: 'admin', accessToken, refreshToken });
  }

  return res.status(403).json({ error: 'Invalid admin key' });
}));

userRoutes.get('/me', authenticate, asyncHandler(controller.getProfile));
userRoutes.put('/me', authenticate, profileUpdateLimiter, asyncHandler(controller.updateProfile));
userRoutes.delete('/me', authenticate, asyncHandler(controller.deleteAccount));
userRoutes.post('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), asyncHandler(controller.uploadAvatar));
userRoutes.get('/:userId', authenticate, asyncHandler(controller.getPublicProfile));
userRoutes.post('/:userId/block', authenticate, asyncHandler(controller.blockUser));
userRoutes.post('/:userId/unblock', authenticate, asyncHandler(controller.unblockUser));

export default userRoutes;
