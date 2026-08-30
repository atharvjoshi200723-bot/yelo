import { z } from 'zod';

export const createListingSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  pricePerDay: z.number().min(1).max(100000),
  pricePerWeek: z.number().min(1).max(100000).optional(),
  pricePerMonth: z.number().min(1).max(100000).optional(),
  deposit: z.number().min(0).max(100000).optional(),
  negotiable: z.boolean().default(true),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationName: z.string().max(255),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.1).max(50).default(50),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']).optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc', 'distance', 'popular']).default('recent'),
});

export const createRequestSchema = z.object({
  message: z.string().max(1000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const respondRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  agreedPrice: z.number().min(1).optional(),
});

export const completeRentalSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type SearchListingsQuery = z.infer<typeof searchListingsSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
