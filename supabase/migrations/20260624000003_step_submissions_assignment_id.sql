-- Allow step_submissions to be linked to an assignment directly,
-- without requiring a curriculum_lessons row.
--
-- Before: lesson_id NOT NULL FK → curriculum_lessons (blocks standalone assignments)
-- After:  lesson_id nullable, assignment_id nullable FK → assignments,
--         CHECK (lesson_id IS NOT NULL OR assignment_id IS NOT NULL)

-- 1. Drop the NOT NULL constraint on lesson_id
ALTER TABLE public.step_submissions
  ALTER COLUMN lesson_id DROP NOT NULL;

-- 2. Add assignment_id column
ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE;

-- 3. Ensure at least one of lesson_id / assignment_id is always set
ALTER TABLE public.step_submissions
  DROP CONSTRAINT IF EXISTS step_submissions_requires_lesson_or_assignment;

ALTER TABLE public.step_submissions
  ADD CONSTRAINT step_submissions_requires_lesson_or_assignment
  CHECK (lesson_id IS NOT NULL OR assignment_id IS NOT NULL);

-- 4. Index for assignment-based lookups
CREATE INDEX IF NOT EXISTS idx_step_submissions_assignment_id
  ON public.step_submissions (assignment_id)
  WHERE assignment_id IS NOT NULL;
