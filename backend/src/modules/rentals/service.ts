import { query, transaction } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';
import { CreateListingInput, SearchListingsQuery, CreateRequestInput } from './validators';

export async function createListing(userId: string, data: CreateListingInput) {
  const result = await query(
    `INSERT INTO rental_listings (owner_id, category_id, title, description, price_per_day, price_per_week, price_per_month, deposit, negotiable, condition, image_urls, location_lat, location_lng, location_name, available_from, available_until)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [userId, data.categoryId, data.title, data.description, data.pricePerDay, data.pricePerWeek || null, data.pricePerMonth || null, data.deposit || null, data.negotiable, data.condition, data.imageUrls || [], data.locationLat, data.locationLng, data.locationName, data.availableFrom, data.availableUntil || null]
  );

  // Set the PostGIS geography point
  const listing = result.rows[0];
  await query(
    'UPDATE rental_listings SET location_point = ST_MakePoint($1, $2)::geography WHERE id = $3',
    [data.locationLng, data.locationLat, listing.id]
  );

  return listing;
}

export async function searchListings(userId: string, params: SearchListingsQuery) {
  const conditions: string[] = ["rl.status = 'active'"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.q) {
    conditions.push(`(rl.title ILIKE $${paramIndex} OR rl.description ILIKE $${paramIndex})`);
    values.push(`%${params.q}%`);
    paramIndex++;
  }

  if (params.categoryId) {
    conditions.push(`rl.category_id = $${paramIndex++}`);
    values.push(params.categoryId);
  }

  if (params.minPrice) {
    conditions.push(`rl.price_per_day >= $${paramIndex++}`);
    values.push(params.minPrice);
  }

  if (params.maxPrice) {
    conditions.push(`rl.price_per_day <= $${paramIndex++}`);
    values.push(params.maxPrice);
  }

  if (params.condition) {
    conditions.push(`rl.condition = $${paramIndex++}`);
    values.push(params.condition);
  }

  // Exclude own listings
  conditions.push(`rl.owner_id != $${paramIndex++}`);
  values.push(userId);

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderBy = 'rl.created_at DESC';
  if (params.sort === 'price_asc') orderBy = 'rl.price_per_day ASC';
  else if (params.sort === 'price_desc') orderBy = 'rl.price_per_day DESC';
  else if (params.sort === 'distance' && params.lat && params.lng) {
    orderBy = `ST_Distance(rl.location_point, ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography) ASC`;
    values.push(params.lng, params.lat);
    paramIndex += 2;
  } else if (params.sort === 'popular') orderBy = 'rl.views DESC, rl.created_at DESC';

  const countResult = await query(
    `SELECT COUNT(*) as total FROM rental_listings rl ${whereClause}`,
    values.slice(0, paramIndex - (params.sort === 'distance' && params.lat && params.lng ? 2 : params.sort === 'distance' ? 0 : 0))
  );
  const total = parseInt((countResult.rows[0] as { total: string }).total, 10);

  const offset = (params.page - 1) * params.limit;
  const result = await query(
    `SELECT rl.id, rl.owner_id, rl.category_id, rl.title, rl.description,
            rl.price_per_day, rl.price_per_week, rl.price_per_month, rl.deposit,
            rl.negotiable, rl.condition, rl.image_urls, rl.location_name,
            rl.available_from, rl.available_until, rl.status, rl.views,
            rl.created_at, rl.updated_at,
            rc.name as category_name, rc.icon as category_icon,
            p.name as owner_name, p.avatar_url as owner_avatar
     FROM rental_listings rl
     JOIN rental_categories rc ON rc.id = rl.category_id
     JOIN profiles p ON p.user_id = rl.owner_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, params.limit, offset]
  );

  return {
    listings: result.rows,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getListingById(id: string) {
  const result = await query(
    `SELECT rl.id, rl.owner_id, rl.category_id, rl.title, rl.description,
            rl.price_per_day, rl.price_per_week, rl.price_per_month, rl.deposit,
            rl.negotiable, rl.condition, rl.image_urls, rl.location_name,
            rl.available_from, rl.available_until, rl.status, rl.views,
            rl.created_at, rl.updated_at,
            rc.name as category_name, rc.icon as category_icon,
            p.name as owner_name, p.avatar_url as owner_avatar, p.city as owner_city
     FROM rental_listings rl
     JOIN rental_categories rc ON rc.id = rl.category_id
     JOIN profiles p ON p.user_id = rl.owner_id
     WHERE rl.id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Listing not found');
  
  await query('UPDATE rental_listings SET views = views + 1 WHERE id = $1', [id]);
  
  return result.rows[0];
}

export async function updateListing(userId: string, listingId: string, data: Partial<CreateListingInput>) {
  const existing = await query('SELECT owner_id FROM rental_listings WHERE id = $1', [listingId]);
  if (existing.rows.length === 0) throw new AppError(404, 'Listing not found');
  if ((existing.rows[0] as Record<string, unknown>).owner_id !== userId) {
    throw new AppError(403, 'Not authorized to update this listing');
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (key === 'locationLat') {
        updates.push(`location_lat = $${paramIndex}`);
      } else if (key === 'locationLng') {
        updates.push(`location_lng = $${paramIndex}`);
      } else if (key === 'locationName') {
        updates.push(`location_name = $${paramIndex}`);
      } else {
        updates.push(`${dbKey} = $${paramIndex}`);
      }
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) return getListingById(listingId);

  updates.push(`updated_at = NOW()`);
  values.push(listingId);

  const result = await query(
    `UPDATE rental_listings SET ${updates.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, owner_id, category_id, title, description, price_per_day, price_per_week,
              price_per_month, deposit, negotiable, condition, image_urls, location_name,
              available_from, available_until, status, views, created_at, updated_at`,
    values
  );
  return result.rows[0];
}

export async function deleteListing(userId: string, listingId: string) {
  const result = await query(
    "UPDATE rental_listings SET status = 'removed' WHERE id = $1 AND owner_id = $2 RETURNING id",
    [listingId, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Listing not found or not authorized');
}

export async function createRequest(userId: string, listingId: string, data: CreateRequestInput) {
  const listing = await query('SELECT owner_id, status FROM rental_listings WHERE id = $1', [listingId]);
  if (listing.rows.length === 0) throw new AppError(404, 'Listing not found');
  const owner = listing.rows[0] as { owner_id: string; status: string };
  if (owner.status !== 'active') throw new AppError(400, 'This listing is no longer available');
  if (owner.owner_id === userId) throw new AppError(400, 'Cannot request your own listing');

  // Check for existing pending request
  const existing = await query(
    "SELECT id FROM rental_requests WHERE listing_id = $1 AND requester_id = $2 AND status = 'pending'",
    [listingId, userId]
  );
  if (existing.rows.length > 0) throw new AppError(409, 'You already have a pending request for this listing');

  const result = await query(
    `INSERT INTO rental_requests (listing_id, requester_id, owner_id, message, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [listingId, userId, owner.owner_id, data.message || null, data.startDate, data.endDate]
  );

  // Create notification
  const reqRow = result.rows[0] as { id: string };
  await query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, 'rental_request', 'New rental request', 'Someone wants to rent your item', $2)`,
    [owner.owner_id, JSON.stringify({ listingId, requestId: reqRow.id })]
  );

  return result.rows[0];
}

export async function respondToRequest(userId: string, requestId: string, status: 'accepted' | 'rejected', agreedPrice?: number) {
  const request = await query('SELECT owner_id, status, listing_id FROM rental_requests WHERE id = $1', [requestId]);
  if (request.rows.length === 0) throw new AppError(404, 'Request not found');
  const req = request.rows[0] as { owner_id: string; status: string; listing_id: string };
  if (req.owner_id !== userId) throw new AppError(403, 'Not authorized');
  if (req.status !== 'pending') throw new AppError(400, 'Request is no longer pending');

  await query(
    'UPDATE rental_requests SET status = $1, agreed_price = $2, updated_at = NOW() WHERE id = $3',
    [status, agreedPrice || null, requestId]
  );

  let conversationId: string | null = null;

  // Create conversation if accepted
  if (status === 'accepted') {
    const requesterResult = await query('SELECT requester_id FROM rental_requests WHERE id = $1', [requestId]);
    const requesterId = (requesterResult.rows[0] as { requester_id: string }).requester_id;

    const convResult = await query(
      `INSERT INTO conversations (type, related_listing_id, title)
       VALUES ('rental', $1, 'Rental Request') RETURNING id`,
      [req.listing_id]
    );
    conversationId = (convResult.rows[0] as { id: string }).id;
    await query(
      'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
      [conversationId, userId, requesterId]
    );

    // Create rental
    await query(
      `INSERT INTO rentals (request_id, listing_id, renter_id, owner_id, agreed_price, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
      [requestId, req.listing_id, requesterId, userId, agreedPrice]
    );

    // Notify requester
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'rental_accepted', 'Rental request accepted!', 'Your rental request has been accepted', $2)`,
      [requesterId, JSON.stringify({ requestId, listingId: req.listing_id, conversationId })]
    );
  }

  return { status, conversationId };
}

export async function getRequestById(userId: string, requestId: string) {
  const result = await query(
    `SELECT rr.*,
            rl.title as listing_title, rl.image_urls as listing_images, rl.price_per_day,
            rl.price_per_week, rl.price_per_month, rl.deposit, rl.location_name as listing_location,
            rp.name as requester_name, rp.avatar_url as requester_avatar, rp.city as requester_city,
            op.name as owner_name, op.avatar_url as owner_avatar, op.city as owner_city
     FROM rental_requests rr
     JOIN rental_listings rl ON rl.id = rr.listing_id
     JOIN profiles rp ON rp.user_id = rr.requester_id
     JOIN profiles op ON op.user_id = rr.owner_id
     WHERE rr.id = $1 AND (rr.owner_id = $2 OR rr.requester_id = $2)`,
    [requestId, userId]
  );

  if (result.rows.length === 0) throw new AppError(404, 'Rental request not found');

  const request = result.rows[0] as Record<string, unknown>;

  // Check if a conversation exists between owner and requester
  const conv = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
     JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
     WHERE (c.type = 'rental' AND c.related_listing_id = $3) OR c.type = 'general'
     ORDER BY c.created_at DESC
     LIMIT 1`,
    [request.owner_id, request.requester_id, request.listing_id]
  );

  request.conversation_id = conv.rows[0]?.id || null;
  return request;
}

export async function getMyListings(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT rl.id, rl.owner_id, rl.category_id, rl.title, rl.description,
            rl.price_per_day, rl.price_per_week, rl.price_per_month, rl.deposit,
            rl.negotiable, rl.condition, rl.image_urls, rl.location_name,
            rl.available_from, rl.available_until, rl.status, rl.views,
            rl.created_at, rl.updated_at,
            rc.name as category_name
     FROM rental_listings rl
     JOIN rental_categories rc ON rc.id = rl.category_id
     WHERE rl.owner_id = $1
     ORDER BY rl.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

export async function getMyRequests(userId: string) {
  const result = await query(
    `SELECT rr.*, rl.title as listing_title, rl.image_urls as listing_images, p.name as owner_name, p.avatar_url as owner_avatar
     FROM rental_requests rr
     JOIN rental_listings rl ON rl.id = rr.listing_id
     JOIN profiles p ON p.user_id = rr.owner_id
     WHERE rr.requester_id = $1
     ORDER BY rr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getRequestsForMyListings(userId: string) {
  const result = await query(
    `SELECT rr.*, rl.title as listing_title, rl.image_urls as listing_images, p.name as requester_name, p.avatar_url as requester_avatar
     FROM rental_requests rr
     JOIN rental_listings rl ON rl.id = rr.listing_id
     JOIN profiles p ON p.user_id = rr.requester_id
     WHERE rr.owner_id = $1
     ORDER BY rr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getCategories() {
  const result = await query('SELECT * FROM rental_categories ORDER BY sort_order, name');
  return result.rows;
}

export async function getRentalById(userId: string, rentalId: string) {
  const result = await query(
    `SELECT r.*, rl.title as listing_title, rl.image_urls as listing_images,
            op.name as owner_name, op.avatar_url as owner_avatar,
            rp.name as renter_name, rp.avatar_url as renter_avatar
     FROM rentals r
     JOIN rental_listings rl ON rl.id = r.listing_id
     JOIN profiles op ON op.user_id = r.owner_id
     JOIN profiles rp ON rp.user_id = r.renter_id
     WHERE r.id = $1 AND (r.owner_id = $2 OR r.renter_id = $2)`,
    [rentalId, userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Rental not found');
  return result.rows[0];
}
