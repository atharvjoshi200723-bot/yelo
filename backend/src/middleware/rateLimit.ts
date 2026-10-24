import rateLimit from 'express-rate-limit';
import { config } from '../lib/config';

// Helper to create rate limiters with custom key generators
function createLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message || 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req: any) => req.ip || req.connection.remoteAddress || 'unknown'),
    skip: options.skip,
  });
}

// ============================================================
// AUTH ENDPOINTS — Strict limits to prevent brute force
// ============================================================

// Login: 5 attempts per 15 minutes per IP
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Registration: 10 attempts per hour per IP (configurable)
export const registerLimiter = createLimiter({
  windowMs: config.registerRateLimit.windowMs,
  max: config.registerRateLimit.max,
  message: 'Too many accounts created. Please try again later.',
});

// Refresh token: 10 per hour per IP
export const refreshLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many token refresh attempts.',
});

// ============================================================
// MESSAGING — Prevent spam while allowing normal conversation
// ============================================================

// Send message: 30 per minute per user
export const messageLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'You are sending messages too quickly. Please slow down.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Create conversation: 10 per hour per user
export const conversationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many conversations created. Please try again later.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// FORUM — Prevent spam posting
// ============================================================

// Create forum post: 5 per hour per user
export const forumPostLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'You are posting too frequently. Please wait before creating another post.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Create forum comment: 20 per hour per user
export const forumCommentLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'You are commenting too frequently. Please slow down.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Upvote: 50 per hour per user
export const upvoteLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many upvotes. Please slow down.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// FEED — Prevent spam posting
// ============================================================

// Create feed post: 5 per hour per user
export const feedPostLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'You are posting too frequently. Please wait before creating another post.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Like/Save: 100 per hour per user
export const socialActionLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many actions. Please slow down.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// BUDDY — Prevent request spam
// ============================================================

// Send buddy request: 10 per hour per user
export const buddyRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many buddy requests. Please wait before sending more.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Create/update buddy profile: 5 per hour per user
export const buddyProfileLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many profile updates. Please wait before trying again.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// RENTALS — Prevent listing spam
// ============================================================

// Create listing: 5 per hour per user
export const rentalCreateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many listings created. Please wait before creating another.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Rental request: 10 per hour per user
export const rentalRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many rental requests. Please wait before sending more.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// MODERATION — Prevent report spam
// ============================================================

// Submit report: 5 per hour per user
export const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many reports submitted. Please wait before submitting another.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// UPLOADS — Prevent upload spam
// ============================================================

// Upload image: 20 per hour per user
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many uploads. Please wait before uploading more.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// SEARCH — Prevent scraping/abuse
// ============================================================

// Search: 60 per minute per IP
export const searchLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many search requests. Please slow down.',
});

// ============================================================
// ADMIN — Less restrictive for admin operations
// ============================================================

// Admin actions: 100 per hour per admin
export const adminLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many admin actions.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// ============================================================
// GENERAL — Stricter than global for sensitive operations
// ============================================================

// Password reset: 3 per hour per IP
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts. Please try again later.',
});

// Profile update: 10 per hour per user
export const profileUpdateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many profile updates. Please wait before trying again.',
  keyGenerator: (req: any) => req.user?.id || req.ip,
});
