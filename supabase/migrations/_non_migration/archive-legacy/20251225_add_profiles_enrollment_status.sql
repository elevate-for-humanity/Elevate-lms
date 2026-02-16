-- Add enrollment_status to profiles table for access gating
-- This field controls whether a user can access the student portal
-- It is separate from enrollments.status which tracks enrollment lifecycle

-- Step 1: Add column with default
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'pending';

-- Step 2: Add named constraint separately (safer for Postgres)
ALTER TABLE profiles
ADD CONSTRAINT profiles_enrollment_status_check 
CHECK (enrollment_status IN ('pending', 'approved', 'active', 'suspended', 'completed', 'rejected'));

-- Step 3: Create index for faster access checks
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_status ON profiles(enrollment_status);

-- Backfill existing profiles to 'pending' (default handles this)
-- Any profiles with active enrollments should be updated separately via admin action

COMMENT ON COLUMN profiles.enrollment_status IS 'Access gate for student portal. Only active allows full access. Separate from enrollments.status.';
