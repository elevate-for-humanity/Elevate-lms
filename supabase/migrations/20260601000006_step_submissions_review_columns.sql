-- Add instructor review columns to step_submissions.
-- Required for the instructor sign-off UI on lab/assignment step types.

ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS reviewed_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS instructor_status   text CHECK (instructor_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS instructor_feedback text;

-- Default existing rows to pending
UPDATE public.step_submissions
SET instructor_status = 'pending'
WHERE instructor_status IS NULL;

-- Index for instructor dashboard queries (all pending submissions)
CREATE INDEX IF NOT EXISTS idx_step_submissions_instructor_status
  ON public.step_submissions (instructor_status, created_at DESC);

-- Index for per-course instructor queries
CREATE INDEX IF NOT EXISTS idx_step_submissions_course_status
  ON public.step_submissions (course_id, instructor_status);
