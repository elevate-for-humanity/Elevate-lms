-- FIX ENROLLMENT STATUS INCONSISTENCY
-- This user has enrollment_status = 'active' but enrollment is still pre-approval
-- This is a data inconsistency that should be corrected

-- Show current state
SELECT 
  'BEFORE FIX' as state,
  p.id,
  p.email,
  p.enrollment_status as profile_status,
  pe.id as enrollment_id,
  pe.status as enrollment_status
FROM profiles p
LEFT JOIN program_enrollments pe ON pe.student_id = p.id
WHERE p.id = 'b2ecf623-2873-4680-8034-583c5081e7e9';

-- Fix: Set profile to pending until approval
UPDATE public.profiles
SET 
  enrollment_status = 'pending', 
  updated_at = now()
WHERE id = 'b2ecf623-2873-4680-8034-583c5081e7e9'
  AND enrollment_status = 'active';

-- Show fixed state
SELECT 
  'AFTER FIX' as state,
  p.id,
  p.email,
  p.enrollment_status as profile_status,
  pe.id as enrollment_id,
  pe.status as enrollment_status
FROM profiles p
LEFT JOIN program_enrollments pe ON pe.student_id = p.id
WHERE p.id = 'b2ecf623-2873-4680-8034-583c5081e7e9';

-- Explanation
SELECT 
  'EXPLANATION' as note,
  'Profile enrollment_status should be pending until admin approves enrollment' as reason,
  'After approval, it will be set to active by the approval endpoint' as expected_flow;
