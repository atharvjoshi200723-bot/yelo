import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.post('/', authenticate, asyncHandler(controller.createReview));
router.get('/user/:userId', authenticate, asyncHandler(controller.getUserReviews));

export default router;
