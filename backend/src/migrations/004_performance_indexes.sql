-- Performance Indexes for YELO
-- These indexes address specific slow query patterns identified in the audit

-- ============================================================
-- FEED / SOCIAL POSTS
-- ============================================================

-- Feed sorts by created_at DESC — critical for home page performance
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);

-- Feed checks liked/saved status in batch — need efficient lookup
-- social_likes and social_saves already have (post_id, user_id) unique constraints

-- ============================================================
-- RENTAL LISTINGS
-- ============================================================

-- Rental search sorts by created_at, price, and views
CREATE INDEX IF NOT EXISTS idx_rental_listings_created_at ON rental_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rental_listings_price ON rental_listings(price_per_day);
CREATE INDEX IF NOT EXISTS idx_rental_listings_views ON rental_listings(views DESC);

-- Composite index for active listings search (status + created_at)
CREATE INDEX IF NOT EXISTS idx_rental_listings_active ON rental_listings(status, created_at DESC);

-- Spatial index for radius search on rental listings
CREATE INDEX IF NOT EXISTS idx_rental_listings_location ON rental_listings USING GIST (location_point);

-- ============================================================
-- BUDDY PROFILES
-- ============================================================

-- Buddy search sorts by rating, price, and created_at
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_rating ON buddy_profiles(avg_rating DESC, total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_price ON buddy_profiles(price_per_hour);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_created_at ON buddy_profiles(created_at DESC);

-- Composite index for active buddy search
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_active ON buddy_profiles(status, avg_rating DESC);

-- GIN index for activities array search (contains operator)
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_activities ON buddy_profiles USING GIN (activities);

-- GIN index for availability_days array search
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_availability ON buddy_profiles USING GIN (availability_days);

-- Spatial index for radius search on buddy profiles
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_location ON buddy_profiles USING GIST (location_point);

-- ============================================================
-- MESSAGES
-- ============================================================

-- Messages query: WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE
-- Current index only covers conversation_id + created_at
-- Add composite index for unread message count
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);

-- ============================================================
-- FORUM POSTS
-- ============================================================

-- Forum posts filter by status frequently
CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status, created_at DESC);

-- Forum posts sort by upvotes for trending
CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes ON forum_posts(upvotes DESC, created_at DESC);

-- Forum comments lookup by post_id
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id, created_at ASC);

-- ============================================================
-- BLOCKS (for feed/buddy exclusion queries)
-- ============================================================

-- Blocks lookup: WHERE blocker_id = $1 — already has unique constraint
-- Blocks lookup: WHERE blocked_id = $1 — needs reverse index
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- ============================================================
-- RENTAL REQUESTS
-- ============================================================

-- Requests lookup by listing + status
CREATE INDEX IF NOT EXISTS idx_rental_requests_listing ON rental_requests(listing_id, status);

-- Requests lookup by requester
CREATE INDEX IF NOT EXISTS idx_rental_requests_requester ON rental_requests(requester_id, created_at DESC);

-- Requests lookup by owner
CREATE INDEX IF NOT EXISTS idx_rental_requests_owner ON rental_requests(owner_id, created_at DESC);

-- ============================================================
-- BUDDY REQUESTS
-- ============================================================

-- Requests lookup by provider (incoming requests)
CREATE INDEX IF NOT EXISTS idx_buddy_requests_provider ON buddy_requests(provider_id, status, created_at DESC);

-- Requests lookup by requester (outgoing requests)
CREATE INDEX IF NOT EXISTS idx_buddy_requests_requester ON buddy_requests(requester_id, created_at DESC);

-- ============================================================
-- CONVERSATION MEMBERS
-- ============================================================

-- Conversation members lookup by user_id (find user's conversations)
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);

-- ============================================================
-- REVIEWS
-- ============================================================

-- Reviews lookup by reviewer
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Notifications already has good index: (user_id, is_read, created_at DESC)

-- ============================================================
-- ADMIN ACTIONS
-- ============================================================

-- Admin actions lookup by admin
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);

-- Admin actions lookup by target types
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_listing ON admin_actions(target_listing_id);
