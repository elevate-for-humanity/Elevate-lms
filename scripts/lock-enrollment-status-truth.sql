-- LOCK ENROLLMENT STATUS TRUTH
-- Run this to see the ACTUAL current state before any fixes

-- Step 1: Column nullability + default
SELECT 
  column_name, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name='profiles' 
  AND column_name='enrollment_status';

-- Step 2: Actual allowed values
SELECT 
  conname, 
  pg_get_constraintdef(oid) AS def 
FROM pg_constraint 
WHERE conrelid='profiles'::regclass 
  AND conname='profiles_enrollment_status_check';

-- Step 3: Current enrollment_status distribution
SELECT 
  enrollment_status, 
  COUNT(*) as count 
FROM profiles 
WHERE enrollment_status IS NOT NULL 
GROUP BY enrollment_status 
ORDER BY count DESC;

-- Step 4: NULL enrollment_status count
SELECT COUNT(*) as null_count 
FROM profiles 
WHERE enrollment_status IS NULL;

-- Step 5: Real pending enrollments (for testing)
SELECT 
  id, 
  user_id, 
  program_id, 
  program_holder_id, 
  status,
  created_at
FROM enrollments 
WHERE status='pending' 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 6: Enrollments table schema check
SELECT 
  column_name, 
  data_type,
  is_nullable 
FROM information_schema.columns 
WHERE table_name='enrollments' 
  AND column_name IN ('user_id', 'student_id', 'program_holder_id', 'status')
ORDER BY column_name;

-- Step 7: Check if program_holder_students junction exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'program_holder_students'
) as junction_table_exists;
