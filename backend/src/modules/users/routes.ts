import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../lib/upload';
import { uploadLimiter, profileUpdateLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/me', authenticate, asyncHandler(controller.getProfile));
router.put('/me', authenticate, profileUpdateLimiter, asyncHandler(controller.updateProfile));
router.post('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), asyncHandler(controller.uploadAvatar));
router.get('/:userId', authenticate, asyncHandler(controller.getPublicProfile));
router.post('/:userId/block', authenticate, asyncHandler(controller.blockUser));
router.post('/:userId/unblock', authenticate, asyncHandler(controller.unblockUser));

export default router;
