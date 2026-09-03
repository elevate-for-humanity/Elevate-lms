-- ============================================================================
-- VERIFICATION SCRIPT: Auto-Enrollment Orchestration
-- ============================================================================
-- This script verifies that enrollment orchestration is working correctly:
-- 1. Enrollments are created with status='pending'
-- 2. Profile enrollment_status gates portal access
-- 3. Approval endpoint activates enrollment and generates steps
-- 4. Steps are created from program_partner_lms blueprint
-- ============================================================================

-- Check 1: Recent enrollments and their status
SELECT 
  'RECENT ENROLLMENTS' as check_name,
  e.id as enrollment_id,
  e.student_id,
  e.program_id,
  e.status as enrollment_status,
  p.enrollment_status as profile_enrollment_status,
  e.created_at,
  e.updated_at
FROM enrollments e
JOIN profiles p ON p.id = e.student_id
ORDER BY e.created_at DESC
LIMIT 5;

-- Check 2: Enrollment steps for recent enrollments
SELECT 
  'ENROLLMENT STEPS' as check_name,
  es.enrollment_id,
  COUNT(*) as steps_count,
  COUNT(*) FILTER (WHERE es.status = 'pending') as pending_steps,
  COUNT(*) FILTER (WHERE es.status = 'in_progress') as in_progress_steps,
  COUNT(*) FILTER (WHERE es.status = 'completed') as completed_steps
FROM enrollment_steps es
WHERE es.enrollment_id IN (
  SELECT id FROM enrollments ORDER BY created_at DESC LIMIT 5
)
GROUP BY es.enrollment_id;

-- Check 3: Detailed steps for most recent enrollment
SELECT 
  'DETAILED STEPS FOR LATEST ENROLLMENT' as check_name,
  es.id as step_id,
  es.enrollment_id,
  plp.provider_name,
  es.sequence_order,
  es.status,
  es.started_at,
  es.completed_at
FROM enrollment_steps es
JOIN partner_lms_providers plp ON plp.id = es.provider_id
WHERE es.enrollment_id = (
  SELECT id FROM enrollments ORDER BY created_at DESC LIMIT 1
)
ORDER BY es.sequence_order;

-- Check 4: Program partner LMS configuration (blueprint source)
SELECT 
  'PROGRAM PARTNER LMS BLUEPRINT' as check_name,
  ppl.program_id,
  p.name as program_name,
  plp.provider_name,
  ppl.sequence_order,
  ppl.is_required,
  ppl.auto_enroll_on_program_start
FROM program_partner_lms ppl
JOIN programs p ON p.id = ppl.program_id
JOIN partner_lms_providers plp ON plp.id = ppl.provider_id
WHERE ppl.is_required = true
ORDER BY ppl.program_id, ppl.sequence_order
LIMIT 10;

-- Check 5: Profiles with pending vs active enrollment_status
SELECT 
  'PROFILE ENROLLMENT STATUS DISTRIBUTION' as check_name,
  enrollment_status,
  COUNT(*) as count
FROM profiles
GROUP BY enrollment_status
ORDER BY count DESC;

-- Check 6: Audit log of recent approvals
SELECT 
  'RECENT APPROVAL ACTIONS' as check_name,
  al.id,
  al.user_id as approver_id,
  al.action,
  al.resource_type,
  al.resource_id as enrollment_id,
  al.metadata,
  al.created_at
FROM audit_logs al
WHERE al.action = 'enrollment_approved'
ORDER BY al.created_at DESC
LIMIT 5;
