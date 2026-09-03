-- ============================================================================
-- ENROLLMENT NOTIFICATIONS VERIFICATION
-- ============================================================================
-- Verifies that notifications are created for enrollment events

-- 1. Recent notifications for enrollment events
SELECT 
  'Recent Enrollment Notifications' as section,
  n.id,
  n.user_id,
  p.role as recipient_role,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.title LIKE '%Enrollment%' 
   OR n.title LIKE '%Student%'
ORDER BY n.created_at DESC
LIMIT 20;

-- 2. Admin notifications for pending enrollments
SELECT 
  'Admin Notifications (Pending Enrollments)' as section,
  n.id,
  p.email as admin_email,
  n.title,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE p.role IN ('admin', 'super_admin')
  AND n.title = 'New Enrollment Pending Approval'
ORDER BY n.created_at DESC
LIMIT 10;

-- 3. Student notifications for approved enrollments
SELECT 
  'Student Notifications (Approved)' as section,
  n.id,
  p.email as student_email,
  n.title,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE p.role = 'student'
  AND n.title = 'Enrollment Approved'
ORDER BY n.created_at DESC
LIMIT 10;

-- 4. Program holder notifications for student assignments
SELECT 
  'Program Holder Notifications (Assignments)' as section,
  n.id,
  p.email as program_holder_email,
  n.title,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE p.role = 'program_holder'
  AND n.title = 'New Approved Student Assigned'
ORDER BY n.created_at DESC
LIMIT 10;

-- 5. Notification counts by type and title
SELECT 
  'Notification Summary' as section,
  n.title,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE n.read = true) as read_count,
  COUNT(*) FILTER (WHERE n.read = false) as unread_count,
  MAX(n.created_at) as most_recent
FROM notifications n
WHERE n.title LIKE '%Enrollment%' 
   OR n.title LIKE '%Student%'
GROUP BY n.title
ORDER BY count DESC;

-- 6. Verify notification targets are correct
SELECT 
  'Notification Target Verification' as section,
  n.title,
  p.role as recipient_role,
  COUNT(*) as count,
  CASE 
    WHEN n.title = 'New Enrollment Pending Approval' AND p.role IN ('admin', 'super_admin') THEN '✅ Correct'
    WHEN n.title = 'Enrollment Approved' AND p.role = 'student' THEN '✅ Correct'
    WHEN n.title = 'New Approved Student Assigned' AND p.role = 'program_holder' THEN '✅ Correct'
    ELSE '❌ Incorrect Target'
  END as validation
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.title IN (
  'New Enrollment Pending Approval',
  'Enrollment Approved',
  'New Approved Student Assigned'
)
GROUP BY n.title, p.role
ORDER BY n.title, p.role;
