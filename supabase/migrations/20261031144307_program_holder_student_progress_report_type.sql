-- Match the existing student-progress API without changing report ownership,
-- review status, enrollment, attendance, credit, or payout rules.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.program_holder_reports
  DROP CONSTRAINT program_holder_reports_report_type_check;
ALTER TABLE public.program_holder_reports
  ADD CONSTRAINT program_holder_reports_report_type_check
  CHECK (report_type IN (
    'general', 'weekly', 'monthly', 'compliance', 'financial', 'incident',
    'student_progress'
  ));

COMMIT;
