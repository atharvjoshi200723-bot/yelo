import { pool } from '../lib/db';

const migrationSQL = `
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'rented', 'paused', 'removed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rental_status AS ENUM ('confirmed', 'active', 'completed', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE buddy_status AS ENUM ('active', 'paused', 'removed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_category AS ENUM ('general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('rental', 'buddy', 'general');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  status user_status DEFAULT 'active',
  role VARCHAR(20) DEFAULT 'user',
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  gender VARCHAR(20) DEFAULT 'prefer_not_to_say',
  city VARCHAR(100) DEFAULT 'Dehradun',
  college VARCHAR(200),
  college_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  interests TEXT[],
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  location_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  city VARCHAR(100) DEFAULT 'Dehradun',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, slug)
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  upvotes INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);

CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES forum_comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category post_category DEFAULT 'general',
  title VARCHAR(300),
  content TEXT NOT NULL,
  image_urls TEXT[],
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  location_name VARCHAR(255),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_category ON social_posts(category);

CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS social_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS rental_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES rental_categories(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES rental_categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price_per_day DECIMAL(10,2),
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  deposit DECIMAL(10,2),
  negotiable BOOLEAN DEFAULT TRUE,
  condition VARCHAR(50),
  image_urls TEXT[],
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  location_name VARCHAR(255),
  location_point geography(POINT, 4326),
  available_from DATE,
  available_until DATE,
  status listing_status DEFAULT 'active',
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_listings_owner ON rental_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_category ON rental_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_status ON rental_listings(status);

CREATE TABLE IF NOT EXISTS rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES rental_listings(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  message TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status request_status DEFAULT 'pending',
  agreed_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES rental_requests(id),
  listing_id UUID NOT NULL REFERENCES rental_listings(id),
  renter_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  agreed_price DECIMAL(10,2),
  status rental_status DEFAULT 'confirmed',
  start_date DATE,
  end_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buddy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  buddy_type VARCHAR(20) DEFAULT 'buddy',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  activities TEXT[] NOT NULL,
  price_per_hour DECIMAL(10,2),
  negotiable BOOLEAN DEFAULT TRUE,
  availability_days TEXT[],
  availability_times VARCHAR(100),
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  location_point geography(POINT, 4326),
  location_name VARCHAR(255),
  gender VARCHAR(20),
  min_age_preference INT DEFAULT 18,
  max_age_preference INT,
  image_urls TEXT[],
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  status buddy_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buddy_profiles_type ON buddy_profiles(buddy_type);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_status ON buddy_profiles(status);

CREATE TABLE IF NOT EXISTS buddy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_profile_id UUID NOT NULL REFERENCES buddy_profiles(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  activity VARCHAR(100) NOT NULL,
  message TEXT,
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  proposed_duration_hours DECIMAL(4,1) NOT NULL,
  proposed_location VARCHAR(255),
  status request_status DEFAULT 'pending',
  agreed_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buddy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES buddy_requests(id),
  buddy_profile_id UUID NOT NULL REFERENCES buddy_profiles(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  activity VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_hours DECIMAL(4,1) NOT NULL,
  agreed_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'requested',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  title VARCHAR(200),
  related_buddy_profile_id UUID REFERENCES buddy_profiles(id),
  related_listing_id UUID REFERENCES rental_listings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewed_user_id UUID NOT NULL REFERENCES users(id),
  rental_id UUID REFERENCES rentals(id),
  buddy_session_id UUID REFERENCES buddy_sessions(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_user_id);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id),
  blocked_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id),
  buddy_session_id UUID REFERENCES buddy_sessions(id),
  payer_id UUID NOT NULL REFERENCES users(id),
  payee_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  target_listing_id UUID REFERENCES rental_listings(id),
  target_post_id UUID REFERENCES social_posts(id),
  target_forum_post_id UUID REFERENCES forum_posts(id),
  target_buddy_profile_id UUID REFERENCES buddy_profiles(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'percentage',
  value DECIMAL(10,2) DEFAULT 10.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (safe additive)
-- ============================================================

-- rental_listings: add location_point for PostGIS spatial queries
DO $$ BEGIN
  ALTER TABLE rental_listings ADD COLUMN location_point geography(POINT, 4326);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- conversations: add related_listing_id for rental conversations
DO $$ BEGIN
  ALTER TABLE conversations ADD COLUMN related_listing_id UUID REFERENCES rental_listings(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Backfill location_point for existing rental listings that have lat/lng but no geography point
UPDATE rental_listings SET location_point = ST_MakePoint(location_lng, location_lat)::geography
WHERE location_point IS NULL AND location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add spatial index for rental_listings if not exists
DO $$ BEGIN
  PERFORM 1 FROM pg_class WHERE relname = 'idx_rental_listings_location';
  IF NOT FOUND THEN
    CREATE INDEX idx_rental_listings_location ON rental_listings USING GIST (location_point);
  END IF;
EXCEPTION WHEN OTHERS THEN null;
END $$;
`;

import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  console.log('🔄 Running database migration...');
  try {
    // Run main schema migration
    await pool.query(migrationSQL);
    console.log('✅ Schema migration completed');

    // Run performance indexes migration
    try {
      const perfSql = readFileSync(join(__dirname, '004_performance_indexes.sql'), 'utf8');
      await pool.query(perfSql);
      console.log('✅ Performance indexes applied');
    } catch (err) {
      // Performance indexes may partially fail if columns don't exist — that's OK
      console.log('⚠️  Some performance indexes skipped:', (err as Error).message?.substring(0, 100));
    }

    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
