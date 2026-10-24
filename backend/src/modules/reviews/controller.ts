import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as reviewService from './service';

export async function createReview(req: AuthRequest, res: Response) {
  const { reviewedUserId, rating, comment, rentalId, buddySessionId } = req.body;
  if (!reviewedUserId || !rating) return res.status(400).json({ error: 'reviewedUserId and rating are required' });
  const review = await reviewService.createReview(req.user!.id, reviewedUserId, rating, comment || '', rentalId, buddySessionId);
  res.status(201).json({ review });
}

export async function getUserReviews(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const reviews = await reviewService.getUserReviews(userId, page);
  res.json({ reviews });
}
