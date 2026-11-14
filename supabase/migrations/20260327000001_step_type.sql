-- =============================================================================
-- Add step_type to curriculum_lessons
--
-- Replaces the implicit "everything is a lesson" assumption with an explicit
-- step type that the course engine uses to route rendering and completion rules.
--
-- step_type values:
--   lesson      — instructional reading / video (default, existing rows)
--   quiz        — graded assessment with pass threshold
--   checkpoint  — module-boundary gate (must pass to unlock next module)
--   lab         — hands-on task, may require instructor sign-off
--   assignment  — written reflection or upload
--   exam        — final program exam (one per course)
--   certification — credential application / exam prep step (final step)
-- =============================================================================

BEGIN;

-- 1. Create the enum
DO $$ BEGIN
  CREATE TYPE public.step_type_enum AS ENUM (
    'lesson',
    'quiz',
    'checkpoint',
    'lab',
    'assignment',
    'exam',
    'certification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add column with default so existing rows are non-null
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS step_type public.step_type_enum NOT NULL DEFAULT 'lesson';

-- 3. Back-fill: lessons whose slug ends in -X-5 are checkpoints
--    (PRS pattern: peer-mod-N-peer-N-5 = module checkpoint)
UPDATE public.curriculum_lessons
SET step_type = 'checkpoint'
WHERE lesson_slug ~ '-\d+-\d+$'
  AND lesson_slug LIKE '%-5'
  AND step_type = 'lesson';

-- 4. Index for renderer queries that filter by step_type
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_step_type
  ON public.curriculum_lessons (step_type);

-- 5. Index for module grouping queries
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_module_order
  ON public.curriculum_lessons (course_id, module_order, lesson_order);

COMMIT;
