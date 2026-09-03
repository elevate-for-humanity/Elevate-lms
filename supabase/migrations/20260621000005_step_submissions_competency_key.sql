-- Add competency_key to step_submissions so each submission can be tied
-- to a specific competency_check entry on the lesson.
-- This enables the completion gate to verify each required check individually.

ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS competency_key text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_step_submissions_competency_key
  ON public.step_submissions (user_id, lesson_id, competency_key)
  WHERE competency_key IS NOT NULL;

COMMENT ON COLUMN public.step_submissions.competency_key IS
  'Matches a key in course_lessons.competency_checks[].key. When set, this submission represents instructor sign-off for that specific competency check.';
