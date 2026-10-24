-- Add buddy_type column to buddy_profiles if missing
-- This is idempotent: safe to run multiple times
DO $$ BEGIN
  ALTER TABLE buddy_profiles ADD COLUMN buddy_type VARCHAR(20) DEFAULT 'buddy';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add index for buddy_type filtering
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_type ON buddy_profiles(buddy_type);
