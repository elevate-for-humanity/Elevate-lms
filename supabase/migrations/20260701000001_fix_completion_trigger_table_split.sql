-- Fix: completion eligibility and certificate triggers read only curriculum_lessons,
-- but courses seeded via the blueprint engine store lessons in course_lessons.
-- This migration patches is_program_completion_eligible() and the two trigger
-- resolver functions to check both tables, preferring curriculum_lessons when
-- a program_id match exists there (HVAC legacy path), falling back to course_lessons
-- for blueprint-seeded courses.
--
-- Also patches maybe_issue_certificate_after_lesson_progress() and
-- maybe_issue_certificate_after_checkpoint_score() to resolve program_id from
-- course_lessons when curriculum_lessons returns NULL.
--
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Unified eligibility function
--    Checks curriculum_lessons first; if no rows found for the program,
--    falls back to course_lessons.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_program_completion_eligible(
  p_user_id    uuid,
  p_program_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_use_curriculum     boolean;
  v_missing_content    integer;
  v_missing_pass       integer;
BEGIN
  -- Determine which table owns this program's lessons.
  -- curriculum_lessons has a direct program_id FK.
  -- course_lessons is joined via courses.program_id.
  SELECT EXISTS (
    SELECT 1 FROM public.curriculum_lessons WHERE program_id = p_program_id LIMIT 1
  ) INTO v_use_curriculum;

  IF v_use_curriculum THEN
    -- ── curriculum_lessons path (HVAC + legacy) ──────────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = cl.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = cl.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  ELSE
    -- ── course_lessons path (blueprint-seeded courses) ────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = col.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = col.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  END IF;

  RETURN true;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Patch lesson_progress trigger resolver
--    Resolves program_id from curriculum_lessons first, then course_lessons.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate_after_lesson_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id  uuid;
  v_now_done    boolean;
  v_prev_done   boolean;
BEGIN
  v_now_done  := COALESCE(NEW.completed, false) OR (NEW.completed_at IS NOT NULL);
  v_prev_done := CASE
    WHEN TG_OP = 'UPDATE'
    THEN COALESCE(OLD.completed, false) OR (OLD.completed_at IS NOT NULL)
    ELSE false
  END;

  -- Only act on the transition to completed.
  IF NOT v_now_done THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_done THEN RETURN NEW; END IF;

  -- Try curriculum_lessons first (HVAC / legacy).
  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id
  LIMIT 1;

  -- Fall back to course_lessons (blueprint-seeded).
  IF v_program_id IS NULL THEN
    SELECT c.program_id INTO v_program_id
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE col.id = NEW.lesson_id
    LIMIT 1;
  END IF;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Patch checkpoint_scores trigger resolver
--    Same dual-table program_id resolution.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate_after_checkpoint_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id  uuid;
  v_now_passed  boolean;
  v_prev_passed boolean;
BEGIN
  v_now_passed  := COALESCE(NEW.passed, false);
  v_prev_passed := CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.passed, false) ELSE false END;

  IF NOT v_now_passed THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_passed THEN RETURN NEW; END IF;

  -- Try curriculum_lessons first.
  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id
  LIMIT 1;

  -- Fall back to course_lessons.
  IF v_program_id IS NULL THEN
    SELECT c.program_id INTO v_program_id
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE col.id = NEW.lesson_id
    LIMIT 1;
  END IF;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers already exist from 20260401000002 — no DROP/CREATE needed.
-- The functions are replaced in-place; triggers continue pointing to them.

COMMIT;
