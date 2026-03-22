-- Migration: expanded lesson types
--
-- Extends the canonical lesson_type enum used by course_lessons with all
-- instructional unit types required for accreditation-aligned programs.
-- Also aligns step_type_enum (curriculum_lessons legacy table) to match.
--
-- New types added:
--   reading      — replaces old 'lesson' (backfilled below)
--   video        — first-class video module (no longer inferred from video_url)
--   simulation   — scenario/interactive simulation
--   practicum    — supervised practical with hours/attempts
--   externship   — externship block with hour tracking
--   clinical     — clinical shift with hour tracking
--   observation  — observation log
--   final_exam   — replaces old 'exam' (backfilled below)
--   capstone     — capstone project with rubric + evaluator review
--
-- Existing types retained unchanged:
--   quiz, checkpoint, lab, assignment, certification
--
-- Backfill:
--   lesson → reading
--   exam   → final_exam
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. Add new values to lesson_type enum ────────────────────────────────────
-- PostgreSQL requires ALTER TYPE ... ADD VALUE for each new value.
-- These are idempotent-safe via DO $$ blocks.

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'reading';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'video';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'simulation';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'practicum';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'externship';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'clinical';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'observation';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'final_exam';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'capstone';
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 2. Add new values to step_type_enum (curriculum_lessons legacy) ──────────

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'reading';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'video';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'simulation';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'practicum';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'externship';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'clinical';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'observation';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'final_exam';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.step_type_enum ADD VALUE IF NOT EXISTS 'capstone';
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 3. Backfill course_lessons: lesson → reading, exam → final_exam ──────────
-- Must run AFTER enum values are committed (separate transaction in PG14+).
-- Wrapped in a DO block so it is safe to re-run.

DO $$
BEGIN
  UPDATE public.course_lessons
  SET lesson_type = 'reading'::public.lesson_type
  WHERE lesson_type = 'lesson'::public.lesson_type;

  UPDATE public.course_lessons
  SET lesson_type = 'final_exam'::public.lesson_type
  WHERE lesson_type = 'exam'::public.lesson_type;
END $$;

-- ── 4. Backfill curriculum_lessons: lesson → reading, exam → final_exam ──────

DO $$
BEGIN
  UPDATE public.curriculum_lessons
  SET step_type = 'reading'::public.step_type_enum
  WHERE step_type::text = 'lesson';

  UPDATE public.curriculum_lessons
  SET step_type = 'final_exam'::public.step_type_enum
  WHERE step_type::text = 'exam';
END $$;

-- ── 5. Add structured content columns to course_lessons ──────────────────────
-- content_structured: canonical structured lesson content (LessonContent JSON)
-- video_file, video_transcript, video_runtime_seconds: first-class video fields
-- min_duration_minutes: minimum seat-time enforcement

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS content_structured   JSONB,
  ADD COLUMN IF NOT EXISTS video_file            TEXT,
  ADD COLUMN IF NOT EXISTS video_transcript      TEXT,
  ADD COLUMN IF NOT EXISTS video_runtime_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_duration_minutes  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_evidence     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_signoff      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_evaluator    BOOLEAN NOT NULL DEFAULT false;

-- ── 6. Update publish_course() to reject new practical types without evidence config ──

CREATE OR REPLACE FUNCTION public.publish_course(p_course_id UUID)
RETURNS public.courses LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course        public.courses;
  v_module_count  INTEGER;
  v_null_ct_count INTEGER;
  v_gating_count  INTEGER;
  v_mod           RECORD;
  v_lesson_count  INTEGER;
  v_video_count   INTEGER;
  v_practical_count INTEGER;
BEGIN
  IF NOT public.course_is_publishable(p_course_id) THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % needs title, slug, at least one module, and at least one lesson', p_course_id;
  END IF;

  SELECT COUNT(*) INTO v_null_ct_count
  FROM public.course_lessons
  WHERE course_id = p_course_id AND lesson_type IS NULL;

  IF v_null_ct_count > 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: % lesson(s) have NULL lesson_type', v_null_ct_count;
  END IF;

  FOR v_mod IN
    SELECT cm.id, cm.title FROM public.course_modules cm WHERE cm.course_id = p_course_id
  LOOP
    SELECT COUNT(*) INTO v_lesson_count FROM public.course_lessons WHERE module_id = v_mod.id;
    IF v_lesson_count = 0 THEN
      RAISE EXCEPTION 'PUBLISH_BLOCKED: module "%" has no lessons', v_mod.title;
    END IF;
  END LOOP;

  -- Video lessons must have video_file + transcript + runtime
  SELECT COUNT(*) INTO v_video_count
  FROM public.course_lessons
  WHERE course_id = p_course_id
    AND lesson_type = 'video'::public.lesson_type
    AND (
      video_file IS NULL OR TRIM(video_file) = '' OR
      video_transcript IS NULL OR TRIM(video_transcript) = '' OR
      video_runtime_seconds = 0
    );

  IF v_video_count > 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: % video lesson(s) missing video_file, transcript, or runtime', v_video_count;
  END IF;

  -- Practical lesson types must have requires_evidence = true
  SELECT COUNT(*) INTO v_practical_count
  FROM public.course_lessons
  WHERE course_id = p_course_id
    AND lesson_type::text IN ('lab','simulation','practicum','externship','clinical','observation','capstone')
    AND requires_evidence = false;

  IF v_practical_count > 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: % practical lesson(s) have requires_evidence=false — configure evidence before publishing', v_practical_count;
  END IF;

  SELECT COUNT(*) INTO v_gating_count FROM public.module_completion_rules WHERE course_id = p_course_id;
  SELECT COUNT(*) INTO v_module_count  FROM public.course_modules WHERE course_id = p_course_id;

  IF v_module_count > 1 AND v_gating_count = 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % has % modules but no module_completion_rules', p_course_id, v_module_count;
  END IF;

  UPDATE public.courses
  SET status = 'published', published_at = now(), updated_at = now()
  WHERE id = p_course_id
  RETURNING * INTO v_course;

  RETURN v_course;
END;
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT unnest(enum_range(NULL::public.lesson_type));
-- Should include: reading, video, quiz, checkpoint, lab, assignment,
--   simulation, practicum, externship, clinical, observation,
--   final_exam, capstone, certification
