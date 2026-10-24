import { query } from '../../lib/db';

interface BuddyHomeRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  activities: string[];
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  image_urls?: string[];
  avg_rating: number;
  status: string;
  name?: string;
  avatar_url?: string;
  city?: string;
  bio?: string;
  created_at: string;
}

export async function getActiveBuddies(limit = 20, offset = 0): Promise<BuddyHomeRow[]> {
  const result = await query(
    `SELECT
       bp.*,
       p.name,
       p.avatar_url,
       p.city,
       p.bio,
       p.created_at
     FROM buddy_profiles bp
     JOIN profiles p ON p.user_id = bp.user_id
     WHERE bp.status = 'active'
       AND bp.activities IS NOT NULL
     ORDER BY bp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows as BuddyHomeRow[];
}
