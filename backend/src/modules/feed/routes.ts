import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { feedPostLimiter, socialActionLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/', authenticate, asyncHandler(controller.getFeed));
router.post('/', authenticate, feedPostLimiter, asyncHandler(controller.createPost));
router.get('/:id', authenticate, asyncHandler(controller.getPost));
router.delete('/:id', authenticate, asyncHandler(controller.deletePost));
router.post('/:id/like', authenticate, socialActionLimiter, asyncHandler(controller.likePost));
router.post('/:id/save', authenticate, socialActionLimiter, asyncHandler(controller.savePost));
router.post('/:id/join', authenticate, socialActionLimiter, asyncHandler(controller.requestJoin));
router.get('/:id/join-requests', authenticate, asyncHandler(controller.getJoinRequests));
router.post('/:id/join-requests/:userId/accept', authenticate, asyncHandler(controller.acceptJoinRequest));
router.post('/:id/join-requests/:userId/reject', authenticate, asyncHandler(controller.rejectJoinRequest));
router.post('/:id/comments', authenticate, asyncHandler(controller.addComment));
router.get('/:id/comments', authenticate, asyncHandler(controller.getComments));
router.delete('/:postId/comments/:commentId', authenticate, asyncHandler(controller.deleteComment));
router.get('/user/:userId', authenticate, asyncHandler(controller.getUserPosts));

export default router;
