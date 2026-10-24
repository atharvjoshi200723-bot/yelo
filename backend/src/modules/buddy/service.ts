import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { CreateBuddyProfileInput, SearchBuddyQuery, CreateBuddyRequestInput } from './validators';

export async function createOrUpdateProfile(userId: string, data: CreateBuddyProfileInput) {

  const existing = await query('SELECT id FROM buddy_profiles WHERE user_id = $1', [userId]);
  
  if (existing.rows.length > 0) {
    const result = await query(
      `UPDATE buddy_profiles SET buddy_type=$1, title=$2, description=$3, activities=$4, price_per_hour=$5, negotiable=$6,
       availability_days=$7, availability_times=$8, location_lat=$9, location_lng=$10,
       location_name=$11, gender=$12,
       min_age_preference=$13, max_age_preference=$14, image_urls=$15, updated_at=NOW()
       WHERE user_id=$16
       RETURNING id, user_id, buddy_type, title, description, activities, price_per_hour, negotiable,
                availability_days, availability_times, location_name, gender, min_age_preference,
                max_age_preference, image_urls, avg_rating, total_reviews, total_sessions, status, created_at, updated_at`,
      [data.buddyType, data.title, data.description, data.activities, data.pricePerHour, data.negotiable,
       data.availabilityDays, data.availabilityTimes, data.locationLat, data.locationLng,
       data.locationName, data.gender || null, data.minAgePreference, data.maxAgePreference || null,
       data.imageUrls || [], userId]
    );
    // Update geography point separately to avoid type conflicts
    if (data.locationLat && data.locationLng) {
      await query(
        'UPDATE buddy_profiles SET location_point = ST_MakePoint($1, $2)::geography WHERE user_id = $3',
        [data.locationLng, data.locationLat, userId]
      );
    }
    return result.rows[0];
  } else {
    const result = await query(
      `INSERT INTO buddy_profiles (user_id, buddy_type, title, description, activities, price_per_hour, negotiable,
       availability_days, availability_times, location_lat, location_lng, location_name,
       gender, min_age_preference, max_age_preference, image_urls)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, user_id, buddy_type, title, description, activities, price_per_hour, negotiable,
                availability_days, availability_times, location_name, gender, min_age_preference,
                max_age_preference, image_urls, avg_rating, total_reviews, total_sessions, status, created_at, updated_at`,
      [userId, data.buddyType, data.title, data.description, data.activities, data.pricePerHour, data.negotiable,
       data.availabilityDays, data.availabilityTimes, data.locationLat, data.locationLng,
       data.locationName, data.gender || null, data.minAgePreference, data.maxAgePreference || null,
       data.imageUrls || []]
    );
    // Update geography point separately to avoid type conflicts
    if (data.locationLat && data.locationLng) {
      await query(
        'UPDATE buddy_profiles SET location_point = ST_MakePoint($1, $2)::geography WHERE user_id = $3',
        [data.locationLng, data.locationLat, userId]
      );
    }
    return result.rows[0];
  }
}

export async function updateMyProfile(userId: string, data: Record<string, unknown>) {
  const allowed = ['title', 'description', 'activities', 'price_per_hour', 'negotiable',
    'availability_days', 'availability_times', 'location_lat', 'location_lng', 'location_name',
    'gender', 'buddy_type', 'min_age_preference', 'max_age_preference'];
  
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowed.includes(dbKey) && value !== undefined) {
      updates.push(`${dbKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    const result = await query('SELECT * FROM buddy_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  // Update geography point if lat/lng changed
  if (data.locationLat !== undefined || data.locationLng !== undefined) {
    // Get current lat/lng for the point update
    const current = await query('SELECT location_lat, location_lng FROM buddy_profiles WHERE user_id = $1', [userId]);
    const row = current.rows[0] as { location_lat: number; location_lng: number } | undefined;
    if (row) {
      const lat = (data.locationLat as number) ?? row.location_lat;
      const lng = (data.locationLng as number) ?? row.location_lng;
      if (lat && lng) {
        updates.push(`location_point = ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography`);
        values.push(lng, lat);
        paramIndex += 2;
      }
    }
  }

  updates.push('updated_at = NOW()');
  values.push(userId);

  await query(
    `UPDATE buddy_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
    values
  );

  const result = await query('SELECT * FROM buddy_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

export async function deleteMyProfile(userId: string) {
  const result = await query(
    `UPDATE buddy_profiles SET status = 'removed', updated_at = NOW() WHERE user_id = $1 AND status != 'removed' RETURNING id`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'No active buddy profile found');
}

export async function togglePauseProfile(userId: string) {
  const result = await query(
    `UPDATE buddy_profiles SET 
       status = CASE WHEN status = 'active' THEN 'paused'::buddy_status ELSE 'active'::buddy_status END,
       updated_at = NOW()
     WHERE user_id = $1 AND status IN ('active', 'paused')
     RETURNING *`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'No buddy profile found');
  return result.rows[0];
}

export async function addBuddyImage(userId: string, imageUrl: string) {
  const result = await query(
    `UPDATE buddy_profiles SET image_urls = array_append(COALESCE(image_urls, '{}'), $1), updated_at = NOW()
     WHERE user_id = $2 RETURNING *`,
    [imageUrl, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'No buddy profile found');
  return result.rows[0];
}

export async function removeBuddyImage(userId: string, imageUrl: string) {
  const result = await query(
    `UPDATE buddy_profiles SET image_urls = array_remove(COALESCE(image_urls, '{}'), $1), updated_at = NOW()
     WHERE user_id = $2 RETURNING *`,
    [imageUrl, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'No buddy profile found');
  return result.rows[0];
}

export async function searchBuddies(userId: string, params: SearchBuddyQuery) {
  const conditions: string[] = ["bp.status = 'active'"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.activity) {
    conditions.push(`$${paramIndex++} = ANY(bp.activities)`);
    values.push(params.activity);
  }

  if (params.buddyType) {
    conditions.push(`bp.buddy_type = $${paramIndex++}`);
    values.push(params.buddyType);
  }

  if (params.minPrice) {
    conditions.push(`bp.price_per_hour >= $${paramIndex++}`);
    values.push(params.minPrice);
  }

  if (params.maxPrice) {
    conditions.push(`bp.price_per_hour <= $${paramIndex++}`);
    values.push(params.maxPrice);
  }

  if (params.gender) {
    conditions.push(`bp.gender = $${paramIndex++}`);
    values.push(params.gender);
  }

  if (params.day) {
    conditions.push(`$${paramIndex++} = ANY(bp.availability_days)`);
    values.push(params.day);
  }

  // Exclude self and blocked users
  conditions.push(`bp.user_id != $${paramIndex++}`);
  values.push(userId);
  conditions.push(`bp.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $${paramIndex++})`);
  values.push(userId);
  conditions.push(`bp.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $${paramIndex++})`);
  values.push(userId);

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderBy = 'bp.avg_rating DESC, bp.total_reviews DESC';
  if (params.sort === 'recent') orderBy = 'bp.created_at DESC';
  else if (params.sort === 'price_asc') orderBy = 'bp.price_per_hour ASC';
  else if (params.sort === 'price_desc') orderBy = 'bp.price_per_hour DESC';
  else if (params.sort === 'distance' && params.lat && params.lng) {
    orderBy = `ST_Distance(bp.location_point, ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography) ASC`;
    values.push(params.lng, params.lat);
    paramIndex += 2;
  }

  const countResult = await query(`SELECT COUNT(*) as total FROM buddy_profiles bp ${whereClause}`, values);
  const total = parseInt((countResult.rows[0] as { total: string }).total, 10);

  const offset = (params.page - 1) * params.limit;
  const result = await query(
    `SELECT bp.id, bp.user_id, bp.buddy_type, bp.title, bp.description, bp.activities,
            bp.price_per_hour, bp.negotiable, bp.availability_days, bp.availability_times,
            bp.location_name, bp.gender, bp.image_urls, bp.avg_rating, bp.total_reviews,
            bp.total_sessions, bp.status, bp.created_at, bp.updated_at,
            p.name, p.avatar_url, p.city, p.college, p.gender as profile_gender, p.date_of_birth
     FROM buddy_profiles bp
     JOIN profiles p ON p.user_id = bp.user_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, params.limit, offset]
  );

  return {
    buddies: result.rows,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
}

export async function getBuddyById(id: string) {
  const result = await query(
    `SELECT bp.id, bp.user_id, bp.buddy_type, bp.title, bp.description, bp.activities,
            bp.price_per_hour, bp.negotiable, bp.availability_days, bp.availability_times,
            bp.location_name, bp.gender, bp.image_urls, bp.avg_rating, bp.total_reviews,
            bp.total_sessions, bp.status, bp.created_at, bp.updated_at,
            p.name, p.avatar_url, p.city, p.college, p.bio, p.gender, p.date_of_birth
     FROM buddy_profiles bp
     JOIN profiles p ON p.user_id = bp.user_id
     WHERE bp.id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Buddy profile not found');
  return result.rows[0];
}

export async function createRequest(userId: string, buddyProfileId: string, data: CreateBuddyRequestInput) {
  const profile = await query('SELECT user_id, status FROM buddy_profiles WHERE id = $1', [buddyProfileId]);
  if (profile.rows.length === 0) throw new AppError(404, 'Buddy profile not found');
  const prof = profile.rows[0] as { user_id: string; status: string };
  if (prof.status !== 'active') throw new AppError(400, 'This buddy profile is not available');
  if (prof.user_id === userId) throw new AppError(400, 'Cannot send request to yourself');

  // Check if blocked
  const blockCheck = await query(
    `SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [userId, prof.user_id]
  );
  if (blockCheck.rows.length > 0) throw new AppError(403, 'Cannot send request to this user');

  const result = await query(
    `INSERT INTO buddy_requests (buddy_profile_id, requester_id, provider_id, activity, message, proposed_date, proposed_time, proposed_duration_hours, proposed_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [buddyProfileId, userId, prof.user_id, data.activity, data.message || null, data.proposedDate, data.proposedTime, data.proposedDurationHours, data.proposedLocation || null]
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, 'buddy_request', 'New buddy request', 'Someone wants to hang out with you!', $2)`,
    [prof.user_id, JSON.stringify({ buddyProfileId, requestId: result.rows[0].id })]
  );

  return result.rows[0];
}

export async function respondToRequest(userId: string, requestId: string, status: 'accepted' | 'rejected', agreedPrice?: number) {
  const request = await query('SELECT provider_id, status FROM buddy_requests WHERE id = $1', [requestId]);
  if (request.rows.length === 0) throw new AppError(404, 'Request not found');
  const req = request.rows[0] as { provider_id: string; status: string };
  if (req.provider_id !== userId) throw new AppError(403, 'Not authorized');
  if (req.status !== 'pending') throw new AppError(400, 'Request is no longer pending');

  await query(
    'UPDATE buddy_requests SET status = $1, agreed_price = $2, updated_at = NOW() WHERE id = $3',
    [status, agreedPrice || null, requestId]
  );

  let conversationId: string | null = null;

  if (status === 'accepted') {
    const requestData = (await query('SELECT * FROM buddy_requests WHERE id = $1', [requestId])).rows[0] as Record<string, unknown>;
    const convResult = await query(
      `INSERT INTO conversations (type, related_buddy_profile_id, title)
       VALUES ('buddy', $1, 'Buddy Request') RETURNING id`,
      [requestData.buddy_profile_id]
    );
    conversationId = (convResult.rows[0] as { id: string }).id;
    await query(
      'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
      [conversationId, userId, requestData.requester_id]
    );

    // Create session
    await query(
      `INSERT INTO buddy_sessions (request_id, buddy_profile_id, requester_id, provider_id, activity, scheduled_date, scheduled_time, duration_hours, agreed_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'requested')`,
      [requestId, requestData.buddy_profile_id, requestData.requester_id, requestData.provider_id,
       requestData.activity, requestData.proposed_date, requestData.proposed_time,
       requestData.proposed_duration_hours, agreedPrice]
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'buddy_accepted', 'Buddy request accepted!', 'Your buddy request was accepted', $2)`,
      [requestData.requester_id as string, JSON.stringify({ requestId })]
    );
  }

  return { status, conversationId };
}

export async function getMyProfile(userId: string) {
  const result = await query('SELECT * FROM buddy_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

export async function getMyRequests(userId: string) {
  const result = await query(
    `SELECT br.*, bp.title as buddy_title, bp.activities, p.name as provider_name, p.avatar_url as provider_avatar
     FROM buddy_requests br
     JOIN buddy_profiles bp ON bp.id = br.buddy_profile_id
     JOIN profiles p ON p.user_id = br.provider_id
     WHERE br.requester_id = $1
     ORDER BY br.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getIncomingRequests(userId: string) {
  const result = await query(
    `SELECT br.*, bp.title as buddy_title, bp.activities, p.name as requester_name, p.avatar_url as requester_avatar
     FROM buddy_requests br
     JOIN buddy_profiles bp ON bp.id = br.buddy_profile_id
     JOIN profiles p ON p.user_id = br.requester_id
     WHERE br.provider_id = $1
     ORDER BY br.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getRequestById(userId: string, requestId: string) {
  const result = await query(
    `SELECT br.*, bp.title as buddy_title, bp.activities, bp.buddy_type,
            rp.name as requester_name, rp.avatar_url as requester_avatar, rp.city as requester_city,
            pp.name as provider_name, pp.avatar_url as provider_avatar
     FROM buddy_requests br
     JOIN buddy_profiles bp ON bp.id = br.buddy_profile_id
     JOIN profiles rp ON rp.user_id = br.requester_id
     JOIN profiles pp ON pp.user_id = br.provider_id
     WHERE br.id = $1 AND (br.requester_id = $2 OR br.provider_id = $2)`,
    [requestId, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Request not found');
  return result.rows[0];
}

export async function getActivities() {
  return [
    'Coffee', 'Movies', 'Walking', 'College Events', 'Studying',
    'Exploring Dehradun', 'Sports', 'Shopping', 'Social Events',
    'Photography', 'Music', 'Food', 'Hiking', 'Gaming', 'Other'
  ];
}
