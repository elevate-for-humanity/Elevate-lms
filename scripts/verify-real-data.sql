-- Verify Real Data in Database
-- Run this to confirm all real data is loaded correctly

\echo '🔍 VERIFYING REAL DATA...'
\echo ''

-- Check Organizations
\echo '📊 ORGANIZATIONS:'
SELECT 
  name,
  contact_phone,
  contact_email,
  city || ', ' || state as location
FROM organizations
WHERE slug = 'elevate-for-humanity';

\echo ''
\echo '📚 PROGRAMS:'
SELECT 
  name,
  duration_weeks || ' weeks' as duration,
  status
FROM programs
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY name;

\echo ''
\echo '💰 FUNDING SOURCES:'
SELECT 
  code,
  name,
  type,
  state
FROM funding_sources
ORDER BY code;

\echo ''
\echo '👥 DEMO STUDENTS:'
SELECT 
  first_name || ' ' || last_name as name,
  phone,
  role
FROM profiles
WHERE id IN (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000005'
)
ORDER BY first_name;

\echo ''
\echo '📝 ENROLLMENTS:'
SELECT 
  p.first_name || ' ' || p.last_name as student,
  pr.name as program,
  e.status,
  CASE 
    WHEN e.status = 'completed' THEN '100%'
    ELSE COALESCE(sr.progress_percentage::text || '%', '0%')
  END as progress
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN programs pr ON e.program_id = pr.id
LEFT JOIN student_risk_status sr ON e.id = sr.enrollment_id
ORDER BY p.first_name;

\echo ''
\echo '📋 REQUIREMENTS SUMMARY:'
SELECT 
  p.first_name || ' ' || p.last_name as student,
  COUNT(*) as total_requirements,
  COUNT(*) FILTER (WHERE sr.status = 'verified') as completed,
  COUNT(*) FILTER (WHERE sr.status IN ('pending', 'in_progress')) as pending,
  COUNT(*) FILTER (WHERE sr.due_date < CURRENT_DATE AND sr.status NOT IN ('verified', 'completed')) as overdue
FROM student_requirements sr
JOIN enrollments e ON sr.enrollment_id = e.id
JOIN profiles p ON e.student_id = p.id
GROUP BY p.first_name, p.last_name
ORDER BY p.first_name;

\echo ''
\echo '✅ VERIFICATION COMPLETE'
\echo ''
\echo '🔐 Contact: (317) 314-3757 | elevate4humanityedu@gmail.com'
\echo '📍 Address: 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240'

