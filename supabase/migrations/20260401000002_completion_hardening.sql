-- =============================================================================
-- Completion hardening: eligibility function, certificate auto-issuance,
-- certificate uniqueness constraint, and performance indexes.
--
-- Schema facts verified before writing:
--   lesson_progress:  completed (boolean), completed_at (timestamptz)
--                     NO status column — all status checks removed
--   modules:          order_index (NOT NULL) — NOT module_order
--   program_completion_certificates:
--                     certificate_number (text NOT NULL)
--                     completion_date (date NOT NULL)
--                     verification_url (text NOT NULL)
--                     checkpoints_passed (integer NOT NULL)
--                     total_checkpoints (integer NOT NULL)
--                     issued_at (timestamptz NOT NULL)
--                     created_at (timestamptz NOT NULL)
--                     NO updated_at column
--   curriculum_lessons.step_type: USER-DEFINED enum — cast to text for IN()
--   checkpoint_scores.passed: boolean NOT NULL (generated column)
--
-- The DB-level checkpoint gate trigger was installed in migration
-- 20260401000001. This migration adds the eligibility layer on top.
-- =============================================================================

BEGIN;

-- ============================================================
-- 1) Certificate eligibility function
--    Returns true only when:
--      A) every lesson/lab/assignment step is completed
--      B) every checkpoint/exam has at least one passing score
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_program_completion_eligible(
  p_user_id   uuid,
  p_program_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_missing_content  integer;
  v_missing_pass     integer;
BEGIN
  -- A) All instructional steps must be completed.
  --    lesson_progress has no status column — use completed + completed_at.
  SELECT COUNT(*)
  INTO v_missing_content
  FROM public.curriculum_lessons cl
  WHERE cl.program_id = p_program_id
    AND cl.step_type::text IN ('lesson', 'lab', 'assignment', 'certification')
    AND NOT EXISTS (
      SELECT 1
      FROM public.lesson_progress lp
      WHERE lp.user_id   = p_user_id
        AND lp.lesson_id = cl.id
        AND (
              COALESCE(lp.completed, false) = true
           OR lp.completed_at IS NOT NULL
        )
    );

  IF v_missing_content > 0 THEN
    RETURN false;
  END IF;

  -- B) Every checkpoint/exam must have at least one passing score.
  SELECT COUNT(*)
  INTO v_missing_pass
  FROM public.curriculum_lessons cl
  WHERE cl.program_id = p_program_id
    AND cl.step_type::text IN ('checkpoint', 'exam')
    AND NOT EXISTS (
      SELECT 1
      FROM public.checkpoint_scores cs
      WHERE cs.user_id   = p_user_id
        AND cs.lesson_id = cl.id
        AND cs.passed    = true
    );

  IF v_missing_pass > 0 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;


-- ============================================================
-- 2) Idempotent certificate issuance function
--    Issues exactly one certificate row per (user_id, program_id).
--    Populates all NOT NULL columns on program_completion_certificates.
-- ============================================================

CREATE OR REPLACE FUNCTION public.issue_program_completion_certificate_if_eligible(
  p_user_id    uuid,
  p_program_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eligible           boolean;
  v_existing_id        uuid;
  v_certificate_number text;
  v_checkpoints_passed integer;
  v_total_checkpoints  integer;
  v_verification_url   text;
BEGIN
  SELECT public.is_program_completion_eligible(p_user_id, p_program_id)
  INTO v_eligible;

  IF NOT v_eligible THEN
    RETURN false;
  END IF;

  -- Idempotency: one cert per (user, program).
  SELECT id INTO v_existing_id
  FROM public.program_completion_certificates
  WHERE user_id = p_user_id AND program_id = p_program_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Count checkpoints for the certificate record.
  SELECT
    COUNT(*) FILTER (WHERE cs.passed = true),
    COUNT(*)
  INTO v_checkpoints_passed, v_total_checkpoints
  FROM public.curriculum_lessons cl
  LEFT JOIN public.checkpoint_scores cs
    ON cs.lesson_id = cl.id AND cs.user_id = p_user_id AND cs.passed = true
  WHERE cl.program_id  = p_program_id
    AND cl.step_type::text IN ('checkpoint', 'exam');

  v_certificate_number :=
    'CERT-' ||
    UPPER(SUBSTRING(REPLACE(p_program_id::text, '-', ''), 1, 8)) || '-' ||
    UPPER(SUBSTRING(REPLACE(p_user_id::text,    '-', ''), 1, 8)) || '-' ||
    TO_CHAR(NOW(), 'YYYYMMDD');

  v_verification_url :=
    'https://www.elevateforhumanity.org/verify/' ||
    REPLACE(gen_random_uuid()::text, '-', '');

  INSERT INTO public.program_completion_certificates (
    id,
    user_id,
    program_id,
    certificate_number,
    completion_date,
    verification_url,
    checkpoints_passed,
    total_checkpoints,
    issued_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_program_id,
    v_certificate_number,
    CURRENT_DATE,
    v_verification_url,
    COALESCE(v_checkpoints_passed, 0),
    COALESCE(v_total_checkpoints,  0),
    NOW(),
    NOW()
  );

  RETURN true;
END;
$$;


-- ============================================================
-- 3) Trigger: auto-issue certificate after lesson completion
-- ============================================================

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate_after_lesson_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id         uuid;
  v_is_completion_write boolean;
BEGIN
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

  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maybe_issue_certificate_after_lesson_progress
  ON public.lesson_progress;

CREATE TRIGGER trg_maybe_issue_certificate_after_lesson_progress
  AFTER INSERT OR UPDATE
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_issue_certificate_after_lesson_progress();


-- ============================================================
-- 4) Trigger: auto-issue certificate after checkpoint/exam pass
-- ============================================================

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

  -- Only act when transitioning to passed for the first time.
  IF v_now_passed = false THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_passed = true THEN RETURN NEW; END IF;

  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maybe_issue_certificate_after_checkpoint_score
  ON public.checkpoint_scores;

CREATE TRIGGER trg_maybe_issue_certificate_after_checkpoint_score
  AFTER INSERT OR UPDATE
  ON public.checkpoint_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_issue_certificate_after_checkpoint_score();


-- ============================================================
-- 5) Unique constraint: one certificate per (user_id, program_id)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'program_completion_certificates_user_program_key'
  ) THEN
    ALTER TABLE public.program_completion_certificates
      ADD CONSTRAINT program_completion_certificates_user_program_key
      UNIQUE (user_id, program_id);
  END IF;
END $$;


-- ============================================================
-- 6) Performance indexes
--    modules uses order_index — not module_order.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson
  ON public.lesson_progress (user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_checkpoint_scores_user_lesson_passed
  ON public.checkpoint_scores (user_id, lesson_id, passed);

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_program_step
  ON public.curriculum_lessons (program_id, step_type);

CREATE INDEX IF NOT EXISTS idx_modules_program_order_index
  ON public.modules (program_id, order_index);

COMMIT;
