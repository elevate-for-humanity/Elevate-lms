-- Add slug column to course_modules.
-- Required by the LiveCourseBuilder (quick-add route and page query).
-- Backfills existing rows from title; enforces uniqueness per course.

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill: slugify title + append short id suffix for uniqueness
UPDATE public.course_modules
SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')
        || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL;

-- Enforce non-null going forward
ALTER TABLE public.course_modules
  ALTER COLUMN slug SET NOT NULL;

-- Unique per course (same slug can appear in different courses)
CREATE UNIQUE INDEX IF NOT EXISTS course_modules_course_id_slug_idx
  ON public.course_modules (course_id, slug);
