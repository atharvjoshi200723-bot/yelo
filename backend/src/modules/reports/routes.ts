import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { reportLimiter, adminLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.post('/', authenticate, reportLimiter, asyncHandler(controller.createReport));
router.get('/', authenticate, requireAdmin, adminLimiter, asyncHandler(controller.getReports));
router.put('/:id/resolve', authenticate, requireAdmin, adminLimiter, asyncHandler(controller.resolveReport));

export default router;
