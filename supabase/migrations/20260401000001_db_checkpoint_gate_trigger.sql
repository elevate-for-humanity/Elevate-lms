-- =============================================================================
-- DB-level checkpoint gate on lesson_progress
--
-- Problem: application-layer gate (enforceCheckpointGate) is the only thing
-- preventing a learner from bypassing module progression. Any direct write to
-- lesson_progress — from another route, a future tool, or a bug — bypasses it.
--
-- This trigger enforces the same rule at the DB layer:
--   A learner cannot mark a lesson complete in module N unless they have at
--   least one passing checkpoint_scores row for a checkpoint in module N-1.
--
-- Scope:
--   - Only fires when a row is being marked complete (completed=true or
--     completed_at set for the first time).
--   - Module 1 (order_index=1) is exempt — no prior module exists.
--   - Lessons with no curriculum_lessons binding are rejected (fail closed).
--   - Lessons whose module has no checkpoint defined are allowed through
--     (no checkpoint = no gate to enforce).
--   - Uses order_index (not module_order) to match the modules table schema.
--
-- Gate semantics: "any passing attempt keeps the gate open permanently."
-- This matches the application-layer semantics in enforceCheckpointGate.
-- If "latest attempt controls access" is ever required, this function must
-- be updated alongside the application layer.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_lesson_progress_checkpoint_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id          uuid;
  v_module_order        integer;
  v_prior_module_order  integer;
  v_has_passing_cp      boolean;
  v_is_completion_write boolean;
BEGIN
  -- Only enforce when this write is marking a lesson complete.
  -- lesson_progress has: completed (boolean), completed_at (timestamptz).
  -- No status column exists on this table.
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

  -- Resolve program_id and module order_index from curriculum_lessons + modules.
  -- modules uses order_index, not module_order.
  SELECT
    cl.program_id,
    m.order_index
  INTO
    v_program_id,
    v_module_order
  FROM public.curriculum_lessons cl
  JOIN public.modules m ON m.id = cl.module_id
  WHERE cl.id = NEW.lesson_id;

  -- Lesson has no curriculum_lessons binding — fail closed.
  -- This prevents unbound lesson_progress rows from silently bypassing the gate.
  IF v_program_id IS NULL OR v_module_order IS NULL THEN
    RAISE EXCEPTION
      'Checkpoint gate: no curriculum/module binding for lesson_id %. Cannot mark complete.',
      NEW.lesson_id
      USING ERRCODE = '23514';
  END IF;

  -- Module 1 has no prior module — gate does not apply.
  IF v_module_order <= 1 THEN
    RETURN NEW;
  END IF;

  v_prior_module_order := v_module_order - 1;

  -- Check for any passing checkpoint in the prior module.
  -- Uses order_index on modules to match the prior module.
  SELECT EXISTS (
    SELECT 1
    FROM public.checkpoint_scores cs
    JOIN public.curriculum_lessons cl_prev ON cl_prev.id = cs.lesson_id
    JOIN public.modules m_prev ON m_prev.id = cl_prev.module_id
    WHERE cs.user_id        = NEW.user_id
      AND cs.passed         = true
      AND cl_prev.program_id = v_program_id
      AND m_prev.order_index = v_prior_module_order
      AND cl_prev.step_type  = 'checkpoint'
  )
  INTO v_has_passing_cp;

  IF NOT v_has_passing_cp THEN
    RAISE EXCEPTION
      'Checkpoint gate blocked: user % cannot complete lesson % (module %) — no passing checkpoint for module %',
      NEW.user_id, NEW.lesson_id, v_module_order, v_prior_module_order
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- Replace cleanly if trigger already exists.
DROP TRIGGER IF EXISTS trg_enforce_lesson_progress_checkpoint_gate
  ON public.lesson_progress;

CREATE TRIGGER trg_enforce_lesson_progress_checkpoint_gate
  BEFORE INSERT OR UPDATE
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_lesson_progress_checkpoint_gate();

-- =============================================================================
-- Fix Final Skills Assessment (HVAC mod10)
--
-- lesson_title = 'Final Skills Assessment', step_type = 'lesson', passing_score = 70
-- mod10 is the terminal module. This lesson is the graded end-of-course
-- assessment. Leaving it as step_type='lesson' means it has no pass threshold
-- and completion is a single click. Correcting to exam with passing_score=80.
-- =============================================================================

UPDATE public.curriculum_lessons
SET
  step_type     = 'exam',
  passing_score = 80,
  updated_at    = NOW()
WHERE lesson_title ILIKE '%Final Skills Assessment%'
  AND step_type = 'lesson';

COMMIT;
