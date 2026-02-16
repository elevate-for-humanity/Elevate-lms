-- Enforce NOT NULL on profiles.enrollment_status
-- This is a follow-up to ensure the column is NOT NULL
-- (IF NOT EXISTS may have skipped NOT NULL if column already existed)

-- First, backfill any NULL values to 'pending'
UPDATE profiles 
SET enrollment_status = 'pending' 
WHERE enrollment_status IS NULL;

-- Then enforce NOT NULL
ALTER TABLE profiles 
ALTER COLUMN enrollment_status SET NOT NULL;

-- Verify constraint exists (should already exist from previous migration)
-- If not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_enrollment_status_check' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_enrollment_status_check 
    CHECK (enrollment_status IN ('pending', 'approved', 'active', 'suspended', 'completed', 'rejected'));
  END IF;
END $$;
