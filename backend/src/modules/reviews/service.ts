import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';

export async function createReview(
  reviewerId: string,
  reviewedUserId: string,
  rating: number,
  comment: string,
  rentalId?: string,
  buddySessionId?: string
) {
  if (reviewerId === reviewedUserId) throw new AppError(400, 'Cannot review yourself');
  if (!rentalId && !buddySessionId) throw new AppError(400, 'Must be tied to a rental or buddy session');

  // Verify interaction
  if (rentalId) {
    const rental = await query(
      'SELECT id FROM rentals WHERE id = $1 AND (owner_id = $2 OR renter_id = $2) AND status = $3',
      [rentalId, reviewerId, 'completed']
    );
    if (rental.rows.length === 0) throw new AppError(400, 'No completed rental found for this review');
  }

  if (buddySessionId) {
    const session = await query(
      'SELECT id FROM buddy_sessions WHERE id = $1 AND (requester_id = $2 OR provider_id = $2) AND status = $3',
      [buddySessionId, reviewerId, 'completed']
    );
    if (session.rows.length === 0) throw new AppError(400, 'No completed buddy session found for this review');
  }

  // Check for existing review
  const existing = await query(
    'SELECT id FROM reviews WHERE reviewer_id = $1 AND (rental_id = $2 OR buddy_session_id = $3)',
    [reviewerId, rentalId || null, buddySessionId || null]
  );
  if (existing.rows.length > 0) throw new AppError(409, 'You have already reviewed this interaction');

  const result = await query(
    `INSERT INTO reviews (reviewer_id, reviewed_user_id, rental_id, buddy_session_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [reviewerId, reviewedUserId, rentalId || null, buddySessionId || null, rating, comment]
  );

  // Update user average rating (if buddy profile)
  const avgResult = await query(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_user_id = $1',
    [reviewedUserId]
  );
  const avg = avgResult.rows[0] as { avg_rating: number; count: number };
  await query(
    'UPDATE buddy_profiles SET avg_rating = $1, total_reviews = $2 WHERE user_id = $3',
    [avg.avg_rating, avg.count, reviewedUserId]
  );

  // Notify
  await query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, 'review', 'New review', 'You received a new review', $2)`,
    [reviewedUserId, JSON.stringify({ reviewId: result.rows[0] })]
  );

  return result.rows[0];
}

export async function getUserReviews(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT r.*, p.name as reviewer_name, p.avatar_url as reviewer_avatar
     FROM reviews r
     JOIN profiles p ON p.user_id = r.reviewer_id
     WHERE r.reviewed_user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}
