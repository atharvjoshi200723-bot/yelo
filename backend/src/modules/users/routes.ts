import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { upload } from '../../lib/upload';
import { uploadLimiter, profileUpdateLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

export const userRoutes = Router();

userRoutes.get('/me', authenticate, asyncHandler(controller.getProfile));
userRoutes.put('/me', authenticate, profileUpdateLimiter, asyncHandler(controller.updateProfile));
userRoutes.post('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), asyncHandler(controller.uploadAvatar));
userRoutes.get('/:userId', authenticate, asyncHandler(controller.getPublicProfile));
userRoutes.post('/:userId/block', authenticate, asyncHandler(controller.blockUser));
userRoutes.post('/:userId/unblock', authenticate, asyncHandler(controller.unblockUser));

export default userRoutes;
