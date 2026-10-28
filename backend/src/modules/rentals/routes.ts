import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rentalCreateLimiter, rentalRequestLimiter, searchLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';

const router = Router();

router.get('/categories', authenticate, asyncHandler(controller.getCategories));
router.post('/', authenticate, rentalCreateLimiter, asyncHandler(controller.createListing));
router.get('/search', authenticate, searchLimiter, asyncHandler(controller.searchListings));
router.get('/my-listings', authenticate, asyncHandler(controller.getMyListings));
router.get('/my-requests', authenticate, asyncHandler(controller.getMyRequests));
router.get('/incoming-requests', authenticate, asyncHandler(controller.getRequestsForMyListings));
router.get('/requests/:id', authenticate, asyncHandler(controller.getRequestById));
router.put('/requests/:id/respond', authenticate, asyncHandler(controller.respondToRequest));
router.get('/:id', authenticate, asyncHandler(controller.getListing));
router.put('/:id', authenticate, asyncHandler(controller.updateListing));
router.delete('/:id', authenticate, asyncHandler(controller.deleteListing));
router.post('/:id/requests', authenticate, rentalRequestLimiter, asyncHandler(controller.createRequest));
router.get('/rentals/:id', authenticate, asyncHandler(controller.getRental));

export default router;
