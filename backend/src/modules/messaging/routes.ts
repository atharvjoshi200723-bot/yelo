import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { messageLimiter, conversationLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/', authenticate, asyncHandler(controller.getConversations));
router.post('/', authenticate, conversationLimiter, asyncHandler(controller.createConversation));
router.get('/find', authenticate, asyncHandler(controller.findConversation));
router.get('/:id', authenticate, asyncHandler(controller.getConversation));
router.get('/:id/messages', authenticate, asyncHandler(controller.getMessages));
router.post('/:id/messages', authenticate, messageLimiter, asyncHandler(controller.sendMessage));

export default router;
