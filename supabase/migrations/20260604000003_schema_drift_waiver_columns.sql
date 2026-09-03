-- Resolves expired column-mismatch waivers W005–W015.
-- Each statement adds the column the admin UI already queries for.
-- All columns are nullable so existing rows are unaffected.

-- W005: transfer_hours.status
ALTER TABLE public.transfer_hours
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- W006: signatures.status
ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- W007: external_modules.status + approval_status
ALTER TABLE public.external_modules
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';

-- W010: jri_participants.status
ALTER TABLE public.jri_participants
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- W011: assignment_submissions.course_id
ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- W012: quiz_attempts.course_id
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- W014: grades.enrollment_id
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL;

-- W015: attendance_records.enrollment_id
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL;
