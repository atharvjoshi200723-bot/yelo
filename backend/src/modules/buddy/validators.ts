import { z } from 'zod';

export const createBuddyProfileSchema = z.object({
  buddyType: z.enum(['boyfriend', 'girlfriend', 'buddy']).default('buddy'),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  activities: z.array(z.string()).min(1, 'At least one activity required').max(10),
  pricePerHour: z.number().min(1).max(10000),
  negotiable: z.boolean().default(true),
  availabilityDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  availabilityTimes: z.string().max(100),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationName: z.string().max(255),
  gender: z.string().max(20).optional(),
  minAgePreference: z.number().int().min(18).default(18),
  maxAgePreference: z.number().int().min(18).optional(),
  imageUrls: z.array(z.string().max(500)).max(5).optional(),
});

export const searchBuddySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  activity: z.string().optional(),
  buddyType: z.enum(['boyfriend', 'girlfriend', 'buddy']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.1).max(50).default(50),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  gender: z.string().optional(),
  day: z.string().optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc', 'distance', 'rating']).default('rating'),
});

export const createBuddyRequestSchema = z.object({
  activity: z.string().min(1).max(100),
  message: z.string().max(1000).optional(),
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proposedTime: z.string().regex(/^\d{2}:\d{2}$/),
  proposedDurationHours: z.number().min(0.5).max(24),
  proposedLocation: z.string().max(255).optional(),
});

export type CreateBuddyProfileInput = z.infer<typeof createBuddyProfileSchema>;
export type SearchBuddyQuery = z.infer<typeof searchBuddySchema>;
export type CreateBuddyRequestInput = z.infer<typeof createBuddyRequestSchema>;
