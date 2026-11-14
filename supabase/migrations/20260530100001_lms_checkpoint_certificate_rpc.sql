-- =============================================================================
-- record_checkpoint_attempt RPC + certificate auto-issuance
--
-- Depends on: 20260327000003_checkpoint_gating.sql
--   (checkpoint_scores, step_submissions, program_completion_certificates tables)
--
-- Provides:
--   record_checkpoint_attempt(p_user_id, p_lesson_id, p_course_id,
--                              p_module_order, p_score, p_answers)
--     → inserts a checkpoint_scores row, increments attempt_number,
--       and auto-issues a program_completion_certificates row when all
--       checkpoints in the course have passing scores.
--
-- Apply manually via Supabase Dashboard SQL Editor.
-- Note: no BEGIN/COMMIT wrapper — exec_sql runs inside its own transaction.
-- =============================================================================

-- ─── record_checkpoint_attempt ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_checkpoint_attempt(
  p_user_id      uuid,
  p_lesson_id    uuid,
  p_course_id    uuid,
  p_module_order integer,
  p_score        integer,
  p_answers      jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passing_score  integer;
  v_attempt_number integer;
  v_passed         boolean;
  v_score_id       uuid;
  v_all_passed     boolean;
  v_cert_id        uuid;
BEGIN
  -- Resolve passing threshold from the lesson definition
  SELECT COALESCE(passing_score, 70)
    INTO v_passing_score
    FROM public.curriculum_lessons
   WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lesson_not_found');
  END IF;

  -- Determine next attempt number for this user+lesson
  SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt_number
    FROM public.checkpoint_scores
   WHERE user_id = p_user_id
     AND lesson_id = p_lesson_id;

  v_passed := p_score >= v_passing_score;

  INSERT INTO public.checkpoint_scores (
    user_id, lesson_id, course_id, module_order,
    score, passing_score, attempt_number, answers
  ) VALUES (
    p_user_id, p_lesson_id, p_course_id, p_module_order,
    p_score, v_passing_score, v_attempt_number, p_answers
  )
  RETURNING id INTO v_score_id;

  -- Auto-issue certificate when every checkpoint in the course has a passing row
  IF v_passed THEN
    SELECT NOT EXISTS (
      SELECT 1
        FROM public.curriculum_lessons cl
       WHERE cl.course_id = p_course_id
         AND cl.step_type IN ('checkpoint', 'exam')
         AND NOT EXISTS (
               SELECT 1
                 FROM public.checkpoint_scores cs
                WHERE cs.user_id  = p_user_id
                  AND cs.lesson_id = cl.id
                  AND cs.passed    = true
             )
    ) INTO v_all_passed;

    IF v_all_passed THEN
      INSERT INTO public.program_completion_certificates (
        user_id, course_id, issued_at
      )
      SELECT p_user_id, p_course_id, now()
      WHERE NOT EXISTS (
        SELECT 1
          FROM public.program_completion_certificates
         WHERE user_id  = p_user_id
           AND course_id = p_course_id
      )
      RETURNING id INTO v_cert_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok',             true,
    'score_id',       v_score_id,
    'passed',         v_passed,
    'attempt_number', v_attempt_number,
    'passing_score',  v_passing_score,
    'certificate_id', v_cert_id
  );
END;
$$;

-- Only the authenticated role and service_role may call this function.
-- Revoke public execute so anon callers cannot record scores.
REVOKE EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, uuid, integer, integer, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, uuid, integer, integer, jsonb)
  TO authenticated, service_role;
