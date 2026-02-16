-- Seed QA Checklists
-- Daily and weekly quality assurance tasks for staff

INSERT INTO qa_checklists (title, frequency, tasks, assignee_role, is_active) VALUES
(
  'Daily Opening Checklist',
  'daily',
  '[
    {"task": "Check all systems are online (LMS, email, phone)", "completed": false},
    {"task": "Review overnight student inquiries and respond", "completed": false},
    {"task": "Check for urgent tickets or issues", "completed": false},
    {"task": "Verify scheduled appointments for the day", "completed": false},
    {"task": "Review student attendance for previous day", "completed": false}
  ]'::jsonb,
  'staff',
  true
),
(
  'Daily Closing Checklist',
  'daily',
  '[
    {"task": "Complete all open tickets or document status", "completed": false},
    {"task": "Update student records with today activity", "completed": false},
    {"task": "Respond to all pending emails", "completed": false},
    {"task": "Schedule follow-ups for next day", "completed": false},
    {"task": "Lock sensitive documents and secure workspace", "completed": false}
  ]'::jsonb,
  'staff',
  true
),
(
  'Weekly Enrollment Review',
  'weekly',
  '[
    {"task": "Review all pending applications", "completed": false},
    {"task": "Follow up on incomplete enrollments", "completed": false},
    {"task": "Verify funding applications submitted", "completed": false},
    {"task": "Update enrollment pipeline report", "completed": false},
    {"task": "Schedule orientations for approved students", "completed": false}
  ]'::jsonb,
  'advisor',
  true
),
(
  'Weekly Student Success Check',
  'weekly',
  '[
    {"task": "Identify at-risk students (low attendance/grades)", "completed": false},
    {"task": "Reach out to students who missed classes", "completed": false},
    {"task": "Review course completion rates", "completed": false},
    {"task": "Schedule check-ins with struggling students", "completed": false},
    {"task": "Update student success metrics", "completed": false}
  ]'::jsonb,
  'advisor',
  true
),
(
  'Weekly Data Quality Audit',
  'weekly',
  '[
    {"task": "Verify all student records are complete", "completed": false},
    {"task": "Check for duplicate entries", "completed": false},
    {"task": "Validate contact information is current", "completed": false},
    {"task": "Ensure all required documents are uploaded", "completed": false},
    {"task": "Run data integrity reports", "completed": false}
  ]'::jsonb,
  'admin',
  true
),
(
  'Monthly Compliance Review',
  'monthly',
  '[
    {"task": "Review FERPA compliance logs", "completed": false},
    {"task": "Audit RLS policies and permissions", "completed": false},
    {"task": "Verify grant reporting requirements met", "completed": false},
    {"task": "Check certification expiration dates", "completed": false},
    {"task": "Review and update policies as needed", "completed": false},
    {"task": "Conduct staff training on any policy changes", "completed": false}
  ]'::jsonb,
  'admin',
  true
),
(
  'Daily Customer Service Quality',
  'daily',
  '[
    {"task": "Review customer service tickets for quality", "completed": false},
    {"task": "Check response times meet SLA", "completed": false},
    {"task": "Verify all tickets have proper documentation", "completed": false},
    {"task": "Identify training needs based on ticket patterns", "completed": false},
    {"task": "Recognize staff for excellent service", "completed": false}
  ]'::jsonb,
  'super_admin',
  true
),
(
  'Weekly Technology Check',
  'weekly',
  '[
    {"task": "Test all critical system functions", "completed": false},
    {"task": "Review system performance metrics", "completed": false},
    {"task": "Check for software updates", "completed": false},
    {"task": "Verify backups completed successfully", "completed": false},
    {"task": "Test disaster recovery procedures", "completed": false}
  ]'::jsonb,
  'admin',
  true
);

COMMENT ON TABLE qa_checklists IS 'Seeded with 8 QA checklists covering daily, weekly, and monthly tasks';
