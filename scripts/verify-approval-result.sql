-- VERIFY APPROVAL RESULT
-- Run this AFTER calling the approval endpoint

-- 1) Enrollment should be READY_TO_START
SELECT 
  id, 
  status, 
  student_id,
  program_id,
  program_holder_id,
  updated_at
FROM public.program_enrollments
WHERE id = '6bec5482-60ae-48d1-bfbf-3145779700b3';
-- Expected: status = 'READY_TO_START'

-- 2) Profile gate should be active
SELECT 
  p.id, 
  p.email,
  p.enrollment_status, 
  p.updated_at
FROM public.profiles p
WHERE p.id = 'b2ecf623-2873-4680-8034-583c5081e7e9';
-- Expected: enrollment_status = 'active'

-- 3) Steps should be generated (>0) IF program_partner_lms rows exist for this program
SELECT 
  COUNT(*) AS steps_count,
  MIN(sequence_order) as first_step,
  MAX(sequence_order) as last_step
FROM public.enrollment_steps
WHERE enrollment_id = '6bec5482-60ae-48d1-bfbf-3145779700b3';
-- Expected: steps_count > 0 (if blueprint exists)

-- 4) Show all generated steps (if any)
SELECT 
  es.id,
  es.enrollment_id,
  es.sequence_order,
  es.status,
  plp.provider_name,
  es.started_at,
  es.completed_at,
  es.created_at
FROM public.enrollment_steps es
JOIN public.partner_lms_providers plp ON plp.id = es.provider_id
WHERE es.enrollment_id = '6bec5482-60ae-48d1-bfbf-3145779700b3'
ORDER BY es.sequence_order;
-- Expected: First step should have status = 'in_progress'

-- 5) Check notifications sent
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at
FROM public.notifications n
WHERE n.user_id IN (
  'b2ecf623-2873-4680-8034-583c5081e7e9',  -- Student
  (SELECT user_id FROM program_holders WHERE id = 'f4e8c5d6-7890-4321-abcd-ef1234567890')  -- Program holder if exists
)
ORDER BY n.created_at DESC
LIMIT 5;
-- Expected: At least one notification for student about approval
