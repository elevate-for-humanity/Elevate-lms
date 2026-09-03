-- Add competency-based learning columns to course_lessons
-- Required for Milady-aligned, state-board-credible modules.
--
-- learning_objectives  — JSONB array of outcome strings (what the student will be able to do)
-- competency_checks    — JSONB array of { key, label, description, isCritical, requiresInstructorSignoff }
-- instructor_notes     — plain text guidance for the instructor during sign-off
-- practical_required   — boolean gate: lesson cannot be marked complete until all competency_checks are signed off

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS learning_objectives   jsonb    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competency_checks     jsonb    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instructor_notes      text     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS practical_required    boolean  NOT NULL DEFAULT false;

-- Index for querying lessons that require practical sign-off
CREATE INDEX IF NOT EXISTS idx_course_lessons_practical_required
  ON public.course_lessons (practical_required)
  WHERE practical_required = true;

COMMENT ON COLUMN public.course_lessons.learning_objectives IS
  'Array of outcome strings — what the student will be able to do after this lesson. Drives state-board compliance reporting.';

COMMENT ON COLUMN public.course_lessons.competency_checks IS
  'Array of { key, label, description, isCritical, requiresInstructorSignoff }. Each check maps to a step_submissions row that must be instructor-approved before lesson completion.';

COMMENT ON COLUMN public.course_lessons.instructor_notes IS
  'Plain text guidance for the instructor during in-person competency sign-off. Not shown to students.';

COMMENT ON COLUMN public.course_lessons.practical_required IS
  'When true, all competency_checks with requiresInstructorSignoff=true must have an approved step_submissions row before lesson_progress can be marked complete.';
