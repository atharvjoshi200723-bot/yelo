-- Keep buddy_type column for existing data, but the only valid value is now 'buddy'
-- No enum type change needed - we keep the column as-is for backward compatibility
-- The app no longer filters by buddy_type and no longer accepts boyfriend/girlfriend values

-- Update any existing boyfriend/girlfriend profiles to buddy (optional, data preservation)
-- Uncomment the following if you want to migrate existing data:
-- UPDATE buddy_profiles SET buddy_type = 'buddy' WHERE buddy_type IN ('boyfriend', 'girlfriend');

-- Note: The column remains for backward compatibility. Existing data is preserved.
-- The frontend and backend now only support 'buddy' type.
