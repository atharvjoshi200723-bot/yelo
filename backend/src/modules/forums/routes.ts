import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { forumPostLimiter, forumCommentLimiter, upvoteLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/colleges', authenticate, asyncHandler(controller.getColleges));
router.get('/colleges/:slug', authenticate, asyncHandler(controller.getCollege));
router.get('/categories/:categoryId/posts', authenticate, asyncHandler(controller.getForumPosts));
router.post('/categories/:categoryId/posts', authenticate, forumPostLimiter, asyncHandler(controller.createForumPost));
router.get('/posts/:id', authenticate, asyncHandler(controller.getForumPost));
router.delete('/posts/:id', authenticate, asyncHandler(controller.deletePost));
router.post('/posts/:id/upvote', authenticate, upvoteLimiter, asyncHandler(controller.upvotePost));
router.post('/posts/:id/comments', authenticate, forumCommentLimiter, asyncHandler(controller.addComment));
router.get('/posts/:id/comments', authenticate, asyncHandler(controller.getComments));
router.delete('/comments/:commentId', authenticate, asyncHandler(controller.deleteComment));

export default router;
