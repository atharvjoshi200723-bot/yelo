import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { loginLimiter, registerLimiter, refreshLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.post('/register', registerLimiter, asyncHandler(controller.register));
router.post('/login', loginLimiter, asyncHandler(controller.login));
router.post('/refresh', refreshLimiter, asyncHandler(controller.refreshToken));
router.get('/me', authenticate, asyncHandler(controller.getMe));

export default router;
