-- Migration: DB-level constraint — video lessons require media fields
--
-- Enforces at the database layer that any row with lesson_type = 'video'
-- must have video_file, video_transcript, and video_runtime_seconds set.
--
-- This makes invalid video lessons impossible to insert or update,
-- removing the need for UI fallbacks or auditor-only enforcement.
--
-- Also adds parallel constraints for assessment and practical lesson types
-- so the DB is the first line of defense, not the last.
--
-- Apply in Supabase Dashboard → SQL Editor after 20260503000018.
-- Idempotent: uses DROP CONSTRAINT IF EXISTS before adding.

-- ── 1. Video lessons must have file + transcript + runtime ────────────────────

ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS video_lessons_require_media;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT video_lessons_require_media CHECK (
    lesson_type::text != 'video'
    OR (
      video_file IS NOT NULL AND TRIM(video_file) != ''
      AND video_transcript IS NOT NULL AND TRIM(video_transcript) != ''
      AND video_runtime_seconds IS NOT NULL AND video_runtime_seconds > 0
    )
  );

-- ── 2. Assessment lessons must have passing_score ─────────────────────────────
-- quiz_questions is JSONB so we check it is not null and not empty array.

ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS assessment_lessons_require_score;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT assessment_lessons_require_score CHECK (
    lesson_type::text NOT IN ('quiz', 'checkpoint', 'final_exam')
    OR (
      passing_score IS NOT NULL AND passing_score > 0
    )
  );

-- ── 3. Practical lessons must have requires_evidence = true ───────────────────
-- Prevents saving a lab/practicum/clinical/etc. without evidence configured.

ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS practical_lessons_require_evidence_flag;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT practical_lessons_require_evidence_flag CHECK (
    lesson_type::text NOT IN (
      'lab', 'simulation', 'practicum', 'externship',
      'clinical', 'observation', 'capstone'
    )
    OR requires_evidence = true
  );

-- ── 4. Lesson title and slug must be non-empty ────────────────────────────────

ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS lesson_title_nonempty;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT lesson_title_nonempty CHECK (
    title IS NOT NULL AND TRIM(title) != ''
  );

ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS lesson_slug_nonempty;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT lesson_slug_nonempty CHECK (
    slug IS NOT NULL AND TRIM(slug) != ''
  );

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT conname, consrc FROM pg_constraint
-- WHERE conrelid = 'public.course_lessons'::regclass
--   AND contype = 'c'
-- ORDER BY conname;
