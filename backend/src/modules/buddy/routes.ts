import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../lib/upload';
import { buddyRequestLimiter, buddyProfileLimiter, uploadLimiter, searchLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/activities', authenticate, asyncHandler(controller.getActivities));
router.post('/profile', authenticate, buddyProfileLimiter, asyncHandler(controller.createProfile));
router.get('/profile', authenticate, asyncHandler(controller.getMyProfile));
router.patch('/profile', authenticate, buddyProfileLimiter, asyncHandler(controller.updateProfile));
router.delete('/profile', authenticate, asyncHandler(controller.deleteProfile));
router.post('/profile/pause', authenticate, asyncHandler(controller.togglePause));
router.post('/profile/image', authenticate, uploadLimiter, upload.single('buddyImage'), asyncHandler(controller.uploadBuddyImage));
router.delete('/profile/image', authenticate, asyncHandler(controller.removeBuddyImage));
router.get('/search', authenticate, searchLimiter, asyncHandler(controller.searchBuddies));
router.get('/my-requests', authenticate, asyncHandler(controller.getMyRequests));
router.get('/incoming-requests', authenticate, asyncHandler(controller.getIncomingRequests));
router.get('/:id', authenticate, asyncHandler(controller.getBuddy));
router.post('/:id/requests', authenticate, buddyRequestLimiter, asyncHandler(controller.createRequest));
router.put('/requests/:id/respond', authenticate, asyncHandler(controller.respondToRequest));

export default router;
