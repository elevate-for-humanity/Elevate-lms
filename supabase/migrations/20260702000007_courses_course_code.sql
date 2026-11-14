-- Add course_code to public.courses
-- Used by the course builder pipeline to generate short enrollment codes
-- (e.g. "HVAC608", "BARB417") that are human-readable and deterministic.
--
-- Apply in Supabase Dashboard → SQL Editor before running the pipeline.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_code TEXT;

-- Unique constraint — one code per course, nulls allowed during migration window
DO $$ BEGIN
  ALTER TABLE public.courses ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing rows: first 4 alpha chars of slug (uppercase) + first 6 hex chars of id.
-- Using id suffix guarantees uniqueness across all rows regardless of slug collisions.
UPDATE public.courses
SET course_code = (
  UPPER(SUBSTRING(REGEXP_REPLACE(slug, '[^a-z]', '', 'gi'), 1, 4))
  || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
)
WHERE course_code IS NULL;
