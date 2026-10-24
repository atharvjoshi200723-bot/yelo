-- Add buddy_type column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE buddy_profiles ADD COLUMN buddy_type VARCHAR(20) DEFAULT 'buddy';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add index for buddy_type filtering
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_type ON buddy_profiles(buddy_type);
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_status ON buddy_profiles(status);
