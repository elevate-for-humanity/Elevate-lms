-- ============================================================================
-- DASHBOARD SCHEMA FIXES
-- ============================================================================
-- Date: 2025-12-23
-- Purpose: Add missing columns required by dashboard code
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE - Add missing columns
-- ============================================================================

-- Add name columns (some dashboards use first_name/last_name)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add verification and onboarding columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orientation_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eligibility_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Populate first_name and last_name from full_name if possible
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE 
    WHEN full_name LIKE '% %' THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL 
AND (first_name IS NULL OR last_name IS NULL);

-- ============================================================================
-- ENROLLMENTS TABLE - Add missing columns
-- ============================================================================

-- Add program holder relationship (use organization_id as source)
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS program_holder_id UUID REFERENCES profiles(id);

-- Add instructor relationship
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id);

-- Add at-risk flag for admin dashboard
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT false;

-- Add progress tracking
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Populate program_holder_id from organization_id
UPDATE enrollments 
SET program_holder_id = organization_id 
WHERE organization_id IS NOT NULL 
AND program_holder_id IS NULL;

-- Calculate initial progress_percentage based on status
UPDATE enrollments
SET progress_percentage = CASE
  WHEN status = 'completed' OR completed_at IS NOT NULL THEN 100
  WHEN status = 'active' AND started_at IS NOT NULL THEN 50
  ELSE 0
END
WHERE progress_percentage = 0;

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_holder_id ON enrollments(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_instructor_id ON enrollments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_at_risk ON enrollments(at_risk);
CREATE INDEX IF NOT EXISTS idx_enrollments_organization_id ON enrollments(organization_id);

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================

COMMENT ON COLUMN profiles.first_name IS 'First name extracted from full_name or entered separately';
COMMENT ON COLUMN profiles.last_name IS 'Last name extracted from full_name or entered separately';
COMMENT ON COLUMN profiles.verified IS 'Whether user has been verified (used by program holder and employer dashboards)';
COMMENT ON COLUMN profiles.orientation_completed IS 'Whether student has completed orientation (used by student state machine)';
COMMENT ON COLUMN profiles.eligibility_verified IS 'Whether student eligibility has been verified (used by student state machine)';
COMMENT ON COLUMN profiles.onboarding_complete IS 'Whether user has completed onboarding process';

COMMENT ON COLUMN enrollments.program_holder_id IS 'Program holder responsible for this enrollment (typically same as organization_id)';
COMMENT ON COLUMN enrollments.instructor_id IS 'Instructor assigned to this enrollment';
COMMENT ON COLUMN enrollments.at_risk IS 'Whether student is at risk of not completing (used by admin dashboard)';
COMMENT ON COLUMN enrollments.progress_percentage IS 'Percentage of course completed (0-100)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check profiles columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
    RAISE EXCEPTION 'Failed to add profiles.verified column';
  END IF;
  
  -- Check enrollments columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'at_risk') THEN
    RAISE EXCEPTION 'Failed to add enrollments.at_risk column';
  END IF;
  
  RAISE NOTICE 'Dashboard schema migration completed successfully';
END $$;
