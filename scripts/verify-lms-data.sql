-- LMS Data Verification Script
-- Run this to verify all tables and data are properly set up

-- ============================================================================
-- 1. CHECK TABLES EXIST
-- ============================================================================
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'student_requirements',
  'student_risk_status',
  'requirement_templates',
  'verification_actions'
);

-- ============================================================================
-- 2. CHECK FUNCTIONS EXIST
-- ============================================================================
SELECT 
  'Functions Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Functions exist'
    ELSE '❌ Missing functions'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'calculate_student_risk_status',
  'create_requirements_from_templates'
);

-- ============================================================================
-- 3. CHECK EXISTING DATA
-- ============================================================================

-- Enrollments
SELECT 
  'Enrollments' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM enrollments;

-- Student Requirements
SELECT 
  'Student Requirements' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'verified') as verified_count
FROM student_requirements;

-- Risk Status
SELECT 
  'Risk Status' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'on_track') as on_track_count,
  COUNT(*) FILTER (WHERE status = 'needs_action') as needs_action_count,
  COUNT(*) FILTER (WHERE status = 'at_risk') as at_risk_count
FROM student_risk_status;

-- Requirement Templates
SELECT 
  'Requirement Templates' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM requirement_templates;

-- ============================================================================
-- 4. CHECK SAMPLE ENROLLMENT WITH FULL DATA
-- ============================================================================
SELECT 
  e.id as enrollment_id,
  p.first_name || ' ' || p.last_name as student_name,
  prog.name as program_name,
  e.status as enrollment_status,
  (SELECT COUNT(*) FROM student_requirements WHERE enrollment_id = e.id) as requirements_count,
  (SELECT status FROM student_risk_status WHERE enrollment_id = e.id) as risk_status,
  (SELECT progress_percentage FROM student_risk_status WHERE enrollment_id = e.id) as progress
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN programs prog ON e.program_id = prog.id
WHERE e.status = 'active'
LIMIT 5;

-- ============================================================================
-- 5. CHECK FUNDING ASSIGNMENTS
-- ============================================================================
SELECT 
  e.id as enrollment_id,
  p.first_name || ' ' || p.last_name as student_name,
  prog.name as program_name,
  fs.code as funding_source,
  fs.name as funding_name
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN programs prog ON e.program_id = prog.id
LEFT JOIN student_funding_assignments sfa ON sfa.enrollment_id = e.id
LEFT JOIN funding_sources fs ON fs.id = sfa.funding_source_id
WHERE e.status = 'active'
LIMIT 10;

-- ============================================================================
-- 6. CHECK REQUIREMENTS BY TYPE
-- ============================================================================
SELECT 
  requirement_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'verified') as verified
FROM student_requirements
GROUP BY requirement_type
ORDER BY count DESC;

-- ============================================================================
-- 7. CHECK OVERDUE REQUIREMENTS
-- ============================================================================
SELECT 
  COUNT(*) as overdue_count,
  COUNT(DISTINCT enrollment_id) as students_affected
FROM student_requirements
WHERE status IN ('pending', 'in_progress')
AND due_date < CURRENT_DATE;

-- ============================================================================
-- 8. CHECK TRIGGERS ARE WORKING
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('student_requirements', 'enrollments');

-- ============================================================================
-- 9. CHECK ROW LEVEL SECURITY
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'student_requirements',
  'student_risk_status',
  'requirement_templates',
  'verification_actions'
);

-- ============================================================================
-- 10. SAMPLE QUERY - STUDENT DASHBOARD DATA
-- ============================================================================
-- This is what the student dashboard queries
WITH active_enrollment AS (
  SELECT e.*
  FROM enrollments e
  WHERE e.student_id = (SELECT id FROM profiles WHERE role = 'student' LIMIT 1)
  AND e.status = 'active'
  LIMIT 1
)
SELECT 
  'Dashboard Data' as data_type,
  ae.id as enrollment_id,
  prog.name as program_name,
  srs.status as risk_status,
  srs.progress_percentage,
  srs.overdue_count,
  (SELECT COUNT(*) FROM student_requirements WHERE enrollment_id = ae.id) as total_requirements,
  (SELECT COUNT(*) FROM student_requirements WHERE enrollment_id = ae.id AND status IN ('completed', 'verified')) as completed_requirements
FROM active_enrollment ae
JOIN programs prog ON ae.program_id = prog.id
LEFT JOIN student_risk_status srs ON srs.enrollment_id = ae.id;

-- ============================================================================
-- 11. SAMPLE QUERY - PROGRAM HOLDER DASHBOARD DATA
-- ============================================================================
-- This is what program holder dashboard queries
SELECT 
  'Program Holder Data' as data_type,
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE srs.status = 'at_risk') as at_risk_students,
  COUNT(*) FILTER (WHERE srs.status = 'needs_action') as needs_action_students,
  COUNT(*) FILTER (WHERE srs.status = 'on_track') as on_track_students
FROM enrollments e
LEFT JOIN student_risk_status srs ON srs.enrollment_id = e.id
WHERE e.status = 'active';

-- ============================================================================
-- 12. SAMPLE QUERY - ADMIN AT-RISK DASHBOARD DATA
-- ============================================================================
-- This is what admin at-risk dashboard queries
SELECT 
  'Admin At-Risk Data' as data_type,
  COUNT(*) as at_risk_count,
  AVG(srs.overdue_count) as avg_overdue_count,
  AVG(srs.days_since_activity) as avg_days_inactive
FROM student_risk_status srs
WHERE srs.status = 'at_risk';

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '=== LMS DATA VERIFICATION COMPLETE ===' as summary,
  'Check results above for any ❌ marks' as action_needed;
