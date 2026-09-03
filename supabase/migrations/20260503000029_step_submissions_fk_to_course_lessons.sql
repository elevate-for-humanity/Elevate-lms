-- Migration: 20260503000020_step_submissions_fk_to_course_lessons.sql
--
-- Migrates step_submissions.lesson_id FK from curriculum_lessons to course_lessons.
-- course_lessons is the canonical lesson table. curriculum_lessons is legacy.
--
-- Steps:
--   1. Add legacy_curriculum_id mapping column to course_lessons
--   2. Backfill mapping via slug + course_id match
--   3. Add course_lesson_id column to step_submissions
--   4. Backfill course_lesson_id via the mapping
--   5. Add FK constraint course_lesson_id -> course_lessons
--   6. Drop old lesson_id FK, make course_lesson_id NOT NULL
--   7. Revoke writes on curriculum_lessons
--
-- Reversibility: curriculum_lessons is NOT dropped. legacy_curriculum_id
-- mapping column is retained for reference. Rollback = re-add old FK,
-- drop new FK, grant writes back on curriculum_lessons.

-- 1. Mapping column
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS legacy_curriculum_id uuid;

-- 2. Backfill mapping (slug + course_id are the stable join keys)
UPDATE public.course_lessons cl
SET legacy_curriculum_id = cur.id
FROM public.curriculum_lessons cur
WHERE cl.slug = cur.lesson_slug
  AND cl.course_id = cur.course_id;

-- 3. New column on step_submissions
ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS course_lesson_id uuid;

-- 4. Backfill course_lesson_id
UPDATE public.step_submissions ss
SET course_lesson_id = cl.id
FROM public.course_lessons cl
WHERE ss.lesson_id = cl.legacy_curriculum_id;

-- 5. Add FK
ALTER TABLE public.step_submissions
  ADD CONSTRAINT fk_step_submissions_course_lesson
  FOREIGN KEY (course_lesson_id)
  REFERENCES public.course_lessons(id)
  ON DELETE CASCADE;

-- 6. Drop old FK, enforce NOT NULL on new column
ALTER TABLE public.step_submissions
  DROP CONSTRAINT IF EXISTS step_submissions_lesson_id_fkey;

ALTER TABLE public.step_submissions
  ALTER COLUMN course_lesson_id SET NOT NULL;

-- 7. Lock curriculum_lessons from further writes
REVOKE INSERT, UPDATE, DELETE ON public.curriculum_lessons FROM public;

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.step_submissions'::regclass
  AND contype = 'f';
