-- Migration: fix lms_lessons view + pre-constraint audit + backfill
--
-- MUST be applied BEFORE 20260503000019 (the CHECK constraints).
-- Applying constraints before this backfill will fail if bad rows exist.
--
-- This migration:
--   1. Audits existing rows that would violate the new constraints.
--   2. Backfills safe defaults so the constraint migration can land cleanly.
--   3. Rebuilds lms_lessons view to expose all fields the renderer needs.
--
-- Apply in Supabase Dashboard → SQL Editor.
-- Order: 000020 first, then 000019.

-- ── 1. Pre-constraint audit — surface violations before constraining ──────────
-- Run this SELECT manually to see what would fail before applying 000019:
--
-- SELECT id, title, lesson_type, video_file, video_transcript, video_runtime_seconds
-- FROM public.course_lessons
-- WHERE lesson_type::text = 'video'
--   AND (
--     video_file IS NULL OR TRIM(video_file) = ''
--     OR video_transcript IS NULL OR TRIM(video_transcript) = ''
--     OR video_runtime_seconds IS NULL OR video_runtime_seconds = 0
--   );
--
-- SELECT id, title, lesson_type, passing_score
-- FROM public.course_lessons
-- WHERE lesson_type::text IN ('quiz','checkpoint','final_exam')
--   AND (passing_score IS NULL OR passing_score <= 0);
--
-- SELECT id, title, lesson_type, requires_evidence
-- FROM public.course_lessons
-- WHERE lesson_type::text IN ('lab','simulation','practicum','externship','clinical','observation','capstone')
--   AND requires_evidence = false;

-- ── 2. Backfill: set requires_evidence = true for practical lessons that lack it ──
-- These rows would fail the practical_lessons_require_evidence_flag constraint.
-- Backfilling to true is safe — it enables evidence submission without forcing
-- a submission on existing learners.

UPDATE public.course_lessons
SET requires_evidence = true
WHERE lesson_type::text IN (
  'lab', 'simulation', 'practicum', 'externship',
  'clinical', 'observation', 'capstone'
)
AND requires_evidence = false;

-- ── 3. Backfill: set passing_score = 70 for assessment lessons with no score ──
-- 70% is the platform default (EPA 608 standard). Adjust per-course after migration.

UPDATE public.course_lessons
SET passing_score = 70
WHERE lesson_type::text IN ('quiz', 'checkpoint', 'final_exam')
AND (passing_score IS NULL OR passing_score <= 0);

-- ── 4. Backfill: set video_runtime_seconds = 1 for video lessons with 0 runtime ──
-- This is a sentinel value — it satisfies the constraint without claiming a real runtime.
-- Admins must update these rows with real runtime values via the builder.
-- We do NOT backfill video_file or video_transcript — those require real content.

UPDATE public.course_lessons
SET video_runtime_seconds = 1
WHERE lesson_type::text = 'video'
AND (video_runtime_seconds IS NULL OR video_runtime_seconds = 0)
AND video_file IS NOT NULL AND TRIM(video_file) != ''
AND video_transcript IS NOT NULL AND TRIM(video_transcript) != '';

-- ── 5. Rebuild lms_lessons view ───────────────────────────────────────────────
-- Exposes all fields the renderer needs. Previous version was missing:
--   video_file, video_transcript, video_runtime_seconds,
--   requires_evidence, requires_signoff, requires_evaluator,
--   content_structured, lesson_type (canonical)
--
-- lesson_type is exposed as both lesson_type (canonical) and step_type/content_type
-- (legacy aliases) so existing code that reads those aliases continues to work.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

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

  -- Timestamps
  cl.created_at,
  cl.updated_at

FROM public.course_lessons cl
WHERE cl.status != 'archived';

-- Grant read access
GRANT SELECT ON public.lms_lessons TO authenticated;
GRANT SELECT ON public.lms_lessons TO service_role;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'lms_lessons'
-- ORDER BY ordinal_position;
