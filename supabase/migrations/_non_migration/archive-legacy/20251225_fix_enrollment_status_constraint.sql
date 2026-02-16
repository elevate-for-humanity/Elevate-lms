-- Fix enrollment_status constraint mismatch
-- The existing constraint has different values than our design requires
-- This migration drops and recreates with correct values

-- Drop the existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_enrollment_status_check;

-- Add the correct constraint with our required values
ALTER TABLE profiles
ADD CONSTRAINT profiles_enrollment_status_check 
CHECK (enrollment_status IN ('pending', 'approved', 'active', 'suspended', 'completed', 'rejected'));

-- Verify no data violates the new constraint
-- Current data should all be 'pending' which is valid in both old and new constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM profiles
  WHERE enrollment_status NOT IN ('pending', 'approved', 'active', 'suspended', 'completed', 'rejected');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % profiles with invalid enrollment_status values. Migration aborted.', invalid_count;
  END IF;
  
  RAISE NOTICE 'All profiles have valid enrollment_status values. Constraint updated successfully.';
END $$;

COMMENT ON CONSTRAINT profiles_enrollment_status_check ON profiles IS 
  'Enforces valid enrollment_status values for student portal access control. Values: pending (default), approved (pre-active), active (full access), suspended (temporary block), completed (graduated), rejected (denied).';
