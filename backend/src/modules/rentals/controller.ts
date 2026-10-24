import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as rentalService from './service';
import { createListingSchema, searchListingsSchema, createRequestSchema, respondRequestSchema } from './validators';

export async function createListing(req: AuthRequest, res: Response) {
  const data = createListingSchema.parse(req.body);
  const listing = await rentalService.createListing(req.user!.id, data);
  res.status(201).json({ listing });
}

export async function searchListings(req: AuthRequest, res: Response) {
  const params = searchListingsSchema.parse(req.query);
  const result = await rentalService.searchListings(req.user!.id, params);
  res.json(result);
}

export async function getListing(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const listing = await rentalService.getListingById(id);
  res.json({ listing });
}

export async function updateListing(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const data = createListingSchema.partial().parse(req.body);
  const listing = await rentalService.updateListing(req.user!.id, id, data);
  res.json({ listing });
}

export async function deleteListing(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await rentalService.deleteListing(req.user!.id, id);
  res.json({ message: 'Listing removed' });
}

export async function createRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const data = createRequestSchema.parse(req.body);
  const request = await rentalService.createRequest(req.user!.id, id, data);
  res.status(201).json({ request });
}

export async function respondToRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const data = respondRequestSchema.parse(req.body);
  const result = await rentalService.respondToRequest(req.user!.id, id, data.status, data.agreedPrice);
  res.json(result);
}

export async function getMyListings(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) || '1', 10);
  const listings = await rentalService.getMyListings(req.user!.id, page);
  res.json({ listings });
}

export async function getMyRequests(req: AuthRequest, res: Response) {
  const requests = await rentalService.getMyRequests(req.user!.id);
  res.json({ requests });
}

export async function getRequestsForMyListings(req: AuthRequest, res: Response) {
  const requests = await rentalService.getRequestsForMyListings(req.user!.id);
  res.json({ requests });
}

export async function getCategories(_req: AuthRequest, res: Response) {
  const categories = await rentalService.getCategories();
  res.json({ categories });
}

export async function getRental(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const rental = await rentalService.getRentalById(req.user!.id, id);
  res.json({ rental });
}
