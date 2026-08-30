-- Add buddy_type enum and column
DO $$ BEGIN
  CREATE TYPE buddy_type AS ENUM ('boyfriend', 'girlfriend', 'buddy');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE buddy_profiles ADD COLUMN IF NOT EXISTS buddy_type buddy_type DEFAULT 'buddy';

-- Create index for filtering by buddy_type
CREATE INDEX IF NOT EXISTS idx_buddy_profiles_type ON buddy_profiles(buddy_type);
