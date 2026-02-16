-- FINAL FIX: profiles.enrollment_status
-- This migration replaces the three previous attempts with a single clean fix
-- Based on actual database state, not assumptions

-- CONTEXT:
-- - Column exists but is nullable (bad)
-- - Constraint exists but has wrong values: pending/active/enrolled/completed/withdrawn
-- - We need: pending/active/completed/rejected/suspended
-- - We're keeping 'withdrawn' for backward compatibility if data exists

-- Step 1: Check current data distribution
DO $$
DECLARE
  v_null_count INTEGER;
  v_enrolled_count INTEGER;
  v_withdrawn_count INTEGER;
BEGIN
  -- Count NULLs
  SELECT COUNT(*) INTO v_null_count
  FROM profiles
  WHERE enrollment_status IS NULL;
  
  -- Count 'enrolled' (old value we're migrating away from)
  SELECT COUNT(*) INTO v_enrolled_count
  FROM profiles
  WHERE enrollment_status = 'enrolled';
  
  -- Count 'withdrawn' (old value we might keep)
  SELECT COUNT(*) INTO v_withdrawn_count
  FROM profiles
  WHERE enrollment_status = 'withdrawn';
  
  RAISE NOTICE 'Current state: % NULL, % enrolled, % withdrawn', 
    v_null_count, v_enrolled_count, v_withdrawn_count;
END $$;

-- Step 2: Migrate data to valid values
-- NULL → pending (default for new users)
UPDATE profiles 
SET enrollment_status = 'pending' 
WHERE enrollment_status IS NULL;

-- 'enrolled' → 'active' (semantic match)
UPDATE profiles 
SET enrollment_status = 'active' 
WHERE enrollment_status = 'enrolled';

-- 'withdrawn' → 'rejected' (closest semantic match)
-- Note: If you want to keep 'withdrawn' as a valid value, add it to the constraint below
UPDATE profiles 
SET enrollment_status = 'rejected' 
WHERE enrollment_status = 'withdrawn';

-- Step 3: Drop old constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_enrollment_status_check;

-- Step 4: Add correct constraint
-- Values: pending (default), active (approved + can access portal), 
--         completed (graduated), rejected (denied), suspended (temporary block)
ALTER TABLE profiles
ADD CONSTRAINT profiles_enrollment_status_check 
CHECK (enrollment_status IN ('pending', 'active', 'completed', 'rejected', 'suspended'));

-- Step 5: Enforce NOT NULL
ALTER TABLE profiles 
ALTER COLUMN enrollment_status SET NOT NULL;

-- Step 6: Set default for new rows
ALTER TABLE profiles 
ALTER COLUMN enrollment_status SET DEFAULT 'pending';

-- Step 7: Verify no invalid data
DO $$
DECLARE
  v_invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_invalid_count
  FROM profiles
  WHERE enrollment_status NOT IN ('pending', 'active', 'completed', 'rejected', 'suspended');
  
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % profiles with invalid enrollment_status after migration', v_invalid_count;
  END IF;
  
  RAISE NOTICE 'Migration successful. All profiles have valid enrollment_status values.';
END $$;

-- Step 8: Update comment
COMMENT ON COLUMN profiles.enrollment_status IS 
  'Access gate for student portal. Values: pending (default, no access), active (approved, full access), completed (graduated), rejected (denied), suspended (temporary block). Separate from program_enrollments.status which tracks individual enrollment lifecycle.';

COMMENT ON CONSTRAINT profiles_enrollment_status_check ON profiles IS 
  'Enforces valid enrollment_status values. Updated 2025-12-25 to match actual system semantics.';
