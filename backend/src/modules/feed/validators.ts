import { z } from 'zod';

export const createPostSchema = z.object({
  category: z.enum(['general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion']),
  title: z.string().max(300).optional(),
  content: z.string().min(1, 'Content is required').max(5000),
  imageUrls: z.array(z.string().url()).max(5).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(255).optional(),
});

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(['general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.1).max(50).default(50), // km
  sort: z.enum(['recent', 'popular', 'nearby']).default('recent'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
