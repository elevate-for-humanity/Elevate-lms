-- Migration: course_lessons generator join fix
--
-- Fixes two issues that blocked the generator → lms_lessons → renderer path:
--
--   1. course_lessons had no status column. The lms_lessons view filtered
--      WHERE cl.status != 'archived', which would fail or return no rows.
--      Fix: add status column with default 'draft', add is_published column
--      if missing, rebuild lms_lessons view to filter on is_published.
--
--   2. course_modules had no unique constraint on (course_id, order_index),
--      which the generator's upsert requires. Add it if missing.
--
-- Apply order: this migration must run AFTER 20260503000020.
-- Apply in Supabase Dashboard SQL Editor before running seed-prs-curriculum.ts.

-- ── 1. Add status column to course_lessons ────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'course_lessons'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.course_lessons
      ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- ── 2. Add is_published column to course_lessons if missing ───────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'course_lessons'
      AND column_name  = 'is_published'
  ) THEN
    ALTER TABLE public.course_lessons
      ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ── 3. Add unique constraint on course_modules(course_id, order_index) ────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'course_modules_course_id_order_index_key'
      AND conrelid = 'public.course_modules'::regclass
  ) THEN
    ALTER TABLE public.course_modules
      ADD CONSTRAINT course_modules_course_id_order_index_key
        UNIQUE (course_id, order_index);
  END IF;
END $$;

-- ── 4. Add unique constraint on course_lessons(course_id, slug) ───────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'course_lessons_course_id_slug_key'
      AND conrelid = 'public.course_lessons'::regclass
  ) THEN
    ALTER TABLE public.course_lessons
      ADD CONSTRAINT course_lessons_course_id_slug_key
        UNIQUE (course_id, slug);
  END IF;
END $$;

-- ── 5. Add unique constraint on modules(program_id, order_index) ──────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'modules_program_id_order_index_key'
      AND conrelid = 'public.modules'::regclass
  ) THEN
    ALTER TABLE public.modules
      ADD CONSTRAINT modules_program_id_order_index_key
        UNIQUE (program_id, order_index);
  END IF;
END $$;

-- ── 6. Rebuild lms_lessons view ───────────────────────────────────────────────
-- Removes the broken WHERE cl.status != 'archived' filter (status column
-- did not exist). Replaces with is_published = true so only published lessons
-- are visible to learners. Seeded lessons (is_published=false) are invisible
-- until explicitly published via publish_course() or admin action.

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.module_id,
  cl.order_index                          AS lesson_number,
  cl.order_index,
  cl.title,
  cl.slug,
  cl.status,
  cl.is_published,
  cl.is_required,
  cl.duration_minutes,

  -- Canonical lesson type (single source of truth)
  cl.lesson_type,

  -- Legacy aliases — kept for backward compatibility with existing code
  cl.lesson_type::text                    AS step_type,
  cl.lesson_type::text                    AS content_type,

  -- Content fields
  (cl.content#>>'{}')                     AS content,
  cl.content_structured,
  cl.passing_score,
  cl.quiz_questions,

  -- Video fields (first-class, not inferred)
  cl.video_file,
  cl.video_transcript,
  cl.video_runtime_seconds,

  -- Practical/evidence flags
  cl.requires_evidence,
  cl.requires_signoff,
  cl.requires_evaluator,

  -- Legacy video_url alias (HVAC path reads this)
  cl.video_file                           AS video_url,

  -- Source tag — all rows from this view are canonical curriculum
  'curriculum'::text                      AS lesson_source,

  -- Timestamps
  cl.created_at,
  cl.updated_at

FROM public.course_lessons cl
WHERE cl.is_published = true
   OR cl.status = 'published';

-- Grant read access
GRANT SELECT ON public.lms_lessons TO authenticated;
GRANT SELECT ON public.lms_lessons TO service_role;

-- ── 7. Verify ─────────────────────────────────────────────────────────────────

SELECT
  'course_lessons.status'    AS check_name,
  COUNT(*)                   AS column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'course_lessons'
  AND column_name  = 'status';

SELECT
  'course_lessons.is_published' AS check_name,
  COUNT(*)                      AS column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'course_lessons'
  AND column_name  = 'is_published';

SELECT 'Migration 20260504000001 applied successfully' AS result;
