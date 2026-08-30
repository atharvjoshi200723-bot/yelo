import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { adminLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.use(authenticate, requireAdmin, adminLimiter);

router.get('/stats', asyncHandler(controller.getDashboardStats));
router.get('/users', asyncHandler(controller.getUsers));
router.put('/users/:id/status', asyncHandler(controller.updateUserStatus));
router.get('/listings', asyncHandler(controller.getListings));
router.put('/listings/:id/remove', asyncHandler(controller.removeListing));
router.put('/forum-posts/:id/remove', asyncHandler(controller.removeForumPost));
router.post('/colleges', asyncHandler(controller.createCollege));
router.post('/forum-categories', asyncHandler(controller.createForumCategory));
router.get('/buddy-profiles', asyncHandler(controller.getBuddyProfiles));
router.put('/buddy-profiles/:id/suspend', asyncHandler(controller.suspendBuddyProfile));

export default router;
