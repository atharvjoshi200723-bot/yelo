import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/', authenticate, asyncHandler(controller.getNotifications));
router.post('/read-all', authenticate, asyncHandler(controller.markAllAsRead));
router.post('/:id/read', authenticate, asyncHandler(controller.markAsRead));

export default router;
