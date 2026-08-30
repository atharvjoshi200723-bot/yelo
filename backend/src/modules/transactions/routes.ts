import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/commission-config', authenticate, asyncHandler(controller.getCommissionConfig));
router.post('/calculate', authenticate, asyncHandler(controller.calculateCommission));

export default router;
