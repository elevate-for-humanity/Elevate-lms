-- =============================================================================
-- Fix lesson_progress checkpoint gate trigger
--
-- The previous trigger (20260401000001) read curriculum_lessons + modules.
-- HVAC lessons are in course_lessons + course_modules (canonical tables).
-- curriculum_lessons has 0 HVAC rows, so every HVAC lesson completion was
-- blocked with "no curriculum/module binding".
--
-- This replacement reads course_lessons + course_modules first, then falls
-- back to curriculum_lessons + modules for any legacy programs still using
-- those tables.
--
-- checkpoint_scores.passed is a generated column (score >= passing_score).
-- The gate checks it directly — no insert of passed is needed.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_lesson_progress_checkpoint_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id           uuid;
  v_module_order        integer;
  v_prior_module_id     uuid;
  v_has_passing_cp      boolean;
  v_is_completion_write boolean;
BEGIN
  -- Only enforce when this write is marking a lesson complete.
  v_is_completion_write :=
       (TG_OP = 'INSERT' AND (
           COALESCE(NEW.completed, false) = true
           OR NEW.completed_at IS NOT NULL
       ))
    OR (TG_OP = 'UPDATE' AND (
           (COALESCE(OLD.completed, false) = false AND COALESCE(NEW.completed, false) = true)
        OR (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
       ));

  IF NOT v_is_completion_write THEN
    RETURN NEW;
  END IF;

  -- ── Canonical path: course_lessons + course_modules ──────────────────────
  SELECT cl.module_id, cm.order_index
  INTO   v_module_id, v_module_order
  FROM   public.course_lessons cl
  JOIN   public.course_modules cm ON cm.id = cl.module_id
  WHERE  cl.id = NEW.lesson_id;

  IF v_module_id IS NOT NULL THEN
    -- Module 1 is always accessible.
    IF v_module_order <= 1 THEN
      RETURN NEW;
    END IF;

    -- Find the prior module.
    SELECT id INTO v_prior_module_id
    FROM   public.course_modules
    WHERE  course_id    = (SELECT course_id FROM public.course_lessons WHERE id = NEW.lesson_id)
      AND  order_index  = v_module_order - 1;

    -- If no prior module found, allow through.
    IF v_prior_module_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Check for a passing checkpoint in the prior module.
    -- checkpoint_scores.passed is a generated column (score >= passing_score).
    SELECT EXISTS (
      SELECT 1
      FROM   public.checkpoint_scores cs
      JOIN   public.course_lessons    cl_prev ON cl_prev.id = cs.lesson_id
      WHERE  cs.user_id        = NEW.user_id
        AND  cs.passed         = true
        AND  cl_prev.module_id = v_prior_module_id
        AND  cl_prev.lesson_type IN ('checkpoint', 'exam')
    ) INTO v_has_passing_cp;

    -- If prior module has no checkpoint defined, allow through.
    IF NOT EXISTS (
      SELECT 1 FROM public.course_lessons
      WHERE module_id   = v_prior_module_id
        AND lesson_type IN ('checkpoint', 'exam')
    ) THEN
      RETURN NEW;
    END IF;

    IF NOT v_has_passing_cp THEN
      RAISE EXCEPTION
        'Checkpoint gate blocked: user % cannot complete lesson % (module order %) — no passing checkpoint for prior module',
        NEW.user_id, NEW.lesson_id, v_module_order
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  -- ── Legacy fallback: curriculum_lessons + modules ─────────────────────────
  DECLARE
    v_program_id         uuid;
    v_legacy_mod_order   integer;
  BEGIN
    SELECT cl.program_id, m.order_index
    INTO   v_program_id, v_legacy_mod_order
    FROM   public.curriculum_lessons cl
    JOIN   public.modules m ON m.id = cl.module_id
    WHERE  cl.id = NEW.lesson_id;

    -- Not found in either table — allow through (don't block unknown lessons).
    IF v_program_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF v_legacy_mod_order <= 1 THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM   public.checkpoint_scores cs
      JOIN   public.curriculum_lessons cl_prev ON cl_prev.id = cs.lesson_id
      JOIN   public.modules            m_prev  ON m_prev.id  = cl_prev.module_id
      WHERE  cs.user_id         = NEW.user_id
        AND  cs.passed          = true
        AND  cl_prev.program_id = v_program_id
        AND  m_prev.order_index = v_legacy_mod_order - 1
        AND  cl_prev.step_type  = 'checkpoint'
    ) INTO v_has_passing_cp;

    IF NOT EXISTS (
      SELECT 1 FROM public.curriculum_lessons cl2
      JOIN public.modules m2 ON m2.id = cl2.module_id
      WHERE cl2.program_id = v_program_id
        AND m2.order_index = v_legacy_mod_order - 1
        AND cl2.step_type  = 'checkpoint'
    ) THEN
      RETURN NEW;
    END IF;

    IF NOT v_has_passing_cp THEN
      RAISE EXCEPTION
        'Checkpoint gate blocked: user % cannot complete lesson % (module %) — no passing checkpoint for module %',
        NEW.user_id, NEW.lesson_id, v_legacy_mod_order, v_legacy_mod_order - 1
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END;
END;
$$;

-- Replace trigger
DROP TRIGGER IF EXISTS trg_enforce_lesson_progress_checkpoint_gate
  ON public.lesson_progress;

CREATE TRIGGER trg_enforce_lesson_progress_checkpoint_gate
  BEFORE INSERT OR UPDATE
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_lesson_progress_checkpoint_gate();

COMMIT;
