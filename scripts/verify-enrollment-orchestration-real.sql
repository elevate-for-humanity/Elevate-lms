-- REAL ENROLLMENT ORCHESTRATION VERIFICATION
-- Uses actual pending enrollments, no fake data

-- Step 1: Show current schema state
SELECT 'SCHEMA STATE' as check_type;

SELECT 
  column_name, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name='profiles' 
  AND column_name='enrollment_status';

SELECT 
  conname, 
  pg_get_constraintdef(oid) AS def 
FROM pg_constraint 
WHERE conrelid='profiles'::regclass 
  AND conname='profiles_enrollment_status_check';

-- Step 2: Show enrollment_status distribution
SELECT 'ENROLLMENT STATUS DISTRIBUTION' as check_type;

SELECT 
  enrollment_status, 
  COUNT(*) as count 
FROM profiles 
GROUP BY enrollment_status 
ORDER BY count DESC;

-- Step 3: Show real pending enrollments
SELECT 'PENDING ENROLLMENTS' as check_type;

SELECT 
  pe.id as enrollment_id,
  pe.student_id as user_id,
  pe.program_id,
  pe.program_holder_id,
  pe.status,
  pe.created_at,
  p.enrollment_status as profile_status,
  p.email
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.student_id
WHERE pe.status IN ('INTAKE', 'AWAITING_FUNDING', 'AWAITING_SEATS')
ORDER BY pe.created_at DESC
LIMIT 5;

-- Step 4: Check if enrollment_steps exist for any enrollments
SELECT 'ENROLLMENT STEPS STATUS' as check_type;

SELECT 
  pe.id as enrollment_id,
  pe.status as enrollment_status,
  COUNT(es.id) as step_count,
  COUNT(CASE WHEN es.status = 'completed' THEN 1 END) as completed_steps,
  COUNT(CASE WHEN es.status = 'in_progress' THEN 1 END) as in_progress_steps,
  COUNT(CASE WHEN es.status = 'pending' THEN 1 END) as pending_steps
FROM program_enrollments pe
LEFT JOIN enrollment_steps es ON es.enrollment_id = pe.id
GROUP BY pe.id, pe.status
HAVING COUNT(es.id) > 0
ORDER BY pe.created_at DESC
LIMIT 10;

-- Step 5: Check program_holder authorization data
SELECT 'PROGRAM HOLDER AUTHORIZATION' as check_type;

SELECT 
  ph.id as program_holder_id,
  ph.organization_name,
  ph.user_id as program_holder_user_id,
  p.email as program_holder_email,
  COUNT(pe.id) as enrollment_count
FROM program_holders ph
JOIN profiles p ON p.id = ph.user_id
LEFT JOIN program_enrollments pe ON pe.program_holder_id = ph.id
GROUP BY ph.id, ph.organization_name, ph.user_id, p.email
ORDER BY enrollment_count DESC
LIMIT 5;

-- Step 6: Check if program_holder_students junction table exists
SELECT 'JUNCTION TABLE CHECK' as check_type;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'program_holder_students'
) as junction_table_exists;

-- Step 7: Show program_enrollments schema
SELECT 'PROGRAM_ENROLLMENTS SCHEMA' as check_type;

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name='program_enrollments' 
  AND column_name IN ('id', 'student_id', 'program_id', 'program_holder_id', 'status', 'created_at')
ORDER BY ordinal_position;

-- Step 8: Instructions for manual approval test
SELECT 'MANUAL TEST INSTRUCTIONS' as check_type;

SELECT 
  'To test approval flow:' as step,
  '1. Pick an enrollment_id from PENDING ENROLLMENTS above' as instruction
UNION ALL
SELECT 
  '2. Call POST /api/enroll/approve with that enrollment_id',
  '   (Must be authenticated as admin or program_holder who owns it)'
UNION ALL
SELECT 
  '3. After approval, run these queries:',
  '   SELECT status FROM program_enrollments WHERE id = ''<enrollment_id>'';'
UNION ALL
SELECT 
  '   SELECT enrollment_status FROM profiles WHERE id = (SELECT student_id FROM program_enrollments WHERE id = ''<enrollment_id>'');',
  '   SELECT COUNT(*) FROM enrollment_steps WHERE enrollment_id = ''<enrollment_id>'';'
UNION ALL
SELECT 
  '4. Expected results:',
  '   - program_enrollments.status should be ''READY_TO_START'' or ''IN_PROGRESS'''
UNION ALL
SELECT 
  '   - profiles.enrollment_status should be ''active''',
  '   - enrollment_steps.COUNT should be > 0';
