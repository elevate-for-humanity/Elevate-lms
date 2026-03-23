-- course_modules referential integrity
--
-- course_modules.course_id had no FK to courses.id.
-- PostgREST could not traverse courses → course_modules → course_lessons,
-- causing getPublishedCourseBySlug() to fail with "relationship not found".
--
-- This migration:
--   1. Removes orphaned course_modules rows (course_id not in courses)
--   2. Removes orphaned course_lessons rows (course_id not in courses)
--   3. Adds FK: course_modules.course_id → courses.id ON DELETE CASCADE
--
-- Applied live on 2026-05-04 during generator kill test.
-- This file codifies that change so the repo matches production.
--
-- Safe to re-apply: constraint uses IF NOT EXISTS guard.

-- 1. Remove orphaned course_lessons first (FK to course_modules would block module delete)
DELETE FROM public.course_lessons
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- 2. Remove orphaned course_modules
DELETE FROM public.course_modules
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- 3. Add FK (idempotent — skipped if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.course_modules'::regclass
      AND conname  = 'course_modules_course_id_fkey'
  ) THEN
    ALTER TABLE public.course_modules
      ADD CONSTRAINT course_modules_course_id_fkey
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Reload PostgREST schema cache so the new relationship is immediately traversable
NOTIFY pgrst, 'reload schema';
