-- =============================================================================
-- Audit logging for checkpoint passes and certificate issuance.
--
-- Writes to public.audit_logs (pre-existing table) on:
--   1) checkpoint_scores INSERT/UPDATE where passed transitions to true
--   2) program_completion_certificates INSERT (new certificate issued)
--
-- Uses action values:
--   'checkpoint_passed'       — learner passed a checkpoint or exam
--   'certificate_issued'      — completion certificate auto-issued
--
-- All functions are SECURITY DEFINER so they can write to audit_logs
-- regardless of the calling role's RLS posture.
-- =============================================================================

BEGIN;

-- ============================================================
-- 1) Audit trigger: checkpoint/exam passed
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_checkpoint_passed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now_passed  boolean;
  v_prev_passed boolean;
  v_lesson_title text;
  v_step_type    text;
BEGIN
  v_now_passed  := COALESCE(NEW.passed, false);
  v_prev_passed := CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.passed, false) ELSE false END;

  -- Only log the first time a row transitions to passed.
  IF v_now_passed = false THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_passed = true THEN RETURN NEW; END IF;

  SELECT lesson_title, step_type::text
  INTO v_lesson_title, v_step_type
  FROM public.curriculum_lessons
  WHERE id = NEW.lesson_id;

  INSERT INTO public.audit_logs (
    action,
    actor_id,
    target_type,
    target_id,
    metadata,
    created_at
  ) VALUES (
    'checkpoint_passed',
    NEW.user_id,
    'checkpoint_scores',
    NEW.id::text,
    jsonb_build_object(
      'lesson_id',     NEW.lesson_id,
      'lesson_title',  v_lesson_title,
      'step_type',     v_step_type,
      'score',         NEW.score,
      'passing_score', NEW.passing_score,
      'attempt',       NEW.attempt_number,
      'course_id',     NEW.course_id,
      'module_order',  NEW.module_order
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_checkpoint_passed ON public.checkpoint_scores;

CREATE TRIGGER trg_audit_checkpoint_passed
  AFTER INSERT OR UPDATE
  ON public.checkpoint_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_checkpoint_passed();


-- ============================================================
-- 2) Audit trigger: certificate issued
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_certificate_issued()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    actor_id,
    target_type,
    target_id,
    metadata,
    created_at
  ) VALUES (
    'certificate_issued',
    NEW.user_id,
    'program_completion_certificates',
    NEW.id::text,
    jsonb_build_object(
      'certificate_number',  NEW.certificate_number,
      'program_id',          NEW.program_id,
      'course_id',           NEW.course_id,
      'checkpoints_passed',  NEW.checkpoints_passed,
      'total_checkpoints',   NEW.total_checkpoints,
      'issued_at',           NEW.issued_at
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_certificate_issued ON public.program_completion_certificates;

CREATE TRIGGER trg_audit_certificate_issued
  AFTER INSERT
  ON public.program_completion_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_certificate_issued();


-- ============================================================
-- 3) Index: fast lookup of audit events by actor and action
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action
  ON public.audit_logs (actor_id, action, created_at DESC);

COMMIT;
