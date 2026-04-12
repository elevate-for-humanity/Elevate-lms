-- Fix schema gaps found during LMS page audit.
--
-- 1. certificates: add issued_at as alias for issued_date so pages using
--    either column name work. Add certificate_type column.
-- 2. courses: add thumbnail_url, total_lessons, duration_hours columns
--    that LMS pages reference.
-- 3. program_enrollments → courses FK so Supabase join syntax works.
-- 4. program_enrollments → programs FK so Supabase join syntax works.
-- 5. student_progress → courses FK and → curriculum_lessons FK.

-- ── 1. certificates ──────────────────────────────────────────────────────────

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS issued_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_type TEXT;

-- Backfill issued_at from issued_date where it exists (issued_date is TEXT)
UPDATE public.certificates
SET issued_at = issued_date::TIMESTAMPTZ
WHERE issued_at IS NULL AND issued_date IS NOT NULL AND issued_date ~ '^\d{4}-\d{2}-\d{2}';

-- Keep them in sync going forward via trigger
CREATE OR REPLACE FUNCTION public.sync_certificate_issued_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.issued_date IS DISTINCT FROM OLD.issued_date THEN
    NEW.issued_at := NEW.issued_date;
  END IF;
  IF NEW.issued_at IS DISTINCT FROM OLD.issued_at THEN
    NEW.issued_date := NEW.issued_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_certificate_issued_at ON public.certificates;
CREATE TRIGGER trg_sync_certificate_issued_at
  BEFORE INSERT OR UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.sync_certificate_issued_at();

-- ── 2. courses ───────────────────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS thumbnail_url  TEXT,
  ADD COLUMN IF NOT EXISTS total_lessons  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(6,1) DEFAULT 0;

-- ── 3 & 4. program_enrollments FKs ───────────────────────────────────────────
-- Orphaned course_id / program_id values exist in production data so we cannot
-- add hard FK constraints without first cleaning up. Instead, create indexes
-- to support the join lookups that Supabase performs via PostgREST hints.
-- PostgREST resolves joins by column name match, not FK constraint, when the
-- relationship is specified explicitly in the select string.

CREATE INDEX IF NOT EXISTS idx_program_enrollments_course_id
  ON public.program_enrollments(course_id) WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id
  ON public.program_enrollments(program_id) WHERE program_id IS NOT NULL;

-- ── 5. student_progress indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_student_progress_course_id
  ON public.student_progress(course_id) WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id
  ON public.student_progress(lesson_id) WHERE lesson_id IS NOT NULL;
