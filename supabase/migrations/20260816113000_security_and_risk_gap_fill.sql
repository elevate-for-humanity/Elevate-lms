-- Security + risk-scoring gap fill
-- Forward-only migration. Preserves existing public application flows and
-- the existing calculate_student_risk_status(uuid) JSON contract.

-- The existing risk RPC referenced lesson_progress.due_date, but that column
-- does not exist. Enrollment requirements are the canonical dated obligations.
CREATE OR REPLACE FUNCTION public.calculate_student_risk_status(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_days_inactive integer := 0;
  v_progress numeric := 0;
  v_overdue integer := 0;
  v_risk_score numeric := 0;
  v_status text;
  v_factors jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(EXTRACT(DAY FROM NOW() - MAX(lp.created_at))::int, 999)
    INTO v_days_inactive
  FROM public.lesson_progress lp
  WHERE lp.user_id = p_student_id;

  SELECT COALESCE(AVG(pe.progress_percent), 0)
    INTO v_progress
  FROM public.program_enrollments pe
  WHERE pe.user_id = p_student_id
    AND pe.status = 'active';

  SELECT COUNT(*)::int
    INTO v_overdue
  FROM public.enrollment_requirements er
  JOIN public.program_enrollments pe ON pe.id = er.enrollment_id
  WHERE pe.user_id = p_student_id
    AND pe.status = 'active'
    AND er.due_date IS NOT NULL
    AND er.due_date < CURRENT_DATE
    AND COALESCE(er.status, 'pending') NOT IN ('completed', 'verified', 'waived');

  v_risk_score := LEAST(
    100,
    (CASE
      WHEN v_days_inactive > 14 THEN 40
      WHEN v_days_inactive > 7 THEN 20
      WHEN v_days_inactive > 3 THEN 10
      ELSE 0
    END)
    + (CASE
      WHEN v_progress < 10 THEN 30
      WHEN v_progress < 30 THEN 15
      WHEN v_progress < 50 THEN 5
      ELSE 0
    END)
    + LEAST(30, v_overdue * 5)
  );

  v_status := CASE
    WHEN v_risk_score >= 70 THEN 'critical'
    WHEN v_risk_score >= 40 THEN 'at_risk'
    WHEN v_risk_score >= 20 THEN 'watch'
    ELSE 'on_track'
  END;

  IF v_days_inactive > 7 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'inactivity', 'days', v_days_inactive)
    );
  END IF;

  IF v_progress < 30 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'low_progress', 'pct', v_progress)
    );
  END IF;

  IF v_overdue > 0 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'overdue_requirements', 'count', v_overdue)
    );
  END IF;

  INSERT INTO public.student_risk_status (
    user_id,
    status,
    days_since_activity,
    progress_percentage,
    overdue_count,
    risk_score,
    risk_factors,
    updated_at
  )
  VALUES (
    p_student_id,
    v_status,
    v_days_inactive,
    v_progress,
    v_overdue,
    v_risk_score,
    v_factors,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    days_since_activity = EXCLUDED.days_since_activity,
    progress_percentage = EXCLUDED.progress_percentage,
    overdue_count = EXCLUDED.overdue_count,
    risk_score = EXCLUDED.risk_score,
    risk_factors = EXCLUDED.risk_factors,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'status', v_status,
    'score', v_risk_score,
    'days', v_days_inactive,
    'progress', v_progress,
    'overdue', v_overdue,
    'factors', v_factors
  );
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_student_risk_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_student_risk_status(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_student_risk_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_student_risk_status(uuid) TO service_role;

-- claim_application_by_token already rejects auth.uid() IS NULL. Remove an
-- unnecessary anonymous EXECUTE grant so the database privilege matches the
-- function's own contract without changing authenticated behavior.
REVOKE EXECUTE ON FUNCTION public.claim_application_by_token(uuid) FROM anon;

-- This function only constructs a storage path and does not need definer rights.
ALTER FUNCTION public.get_course_asset_path(text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_course_asset_path(text, text, text)
  SET search_path TO pg_catalog, public;

-- Lock search_path on retrieval functions flagged by the database advisor.
ALTER FUNCTION public.search_course_embeddings(vector, uuid, text[], integer, double precision)
  SET search_path TO pg_catalog, public;
ALTER FUNCTION public.search_platform_knowledge(vector, double precision, integer, text)
  SET search_path TO pg_catalog, public;
ALTER FUNCTION public.update_course_embeddings_updated_at()
  SET search_path TO pg_catalog, public;

-- Intentionally not revoked here:
--   start_application(...), submit_application(...), get_tenant_by_domain(...),
--   use_notification_token(...), get_latest_published_version(...)
-- Those functions participate in public/pre-auth flows and must be reviewed
-- against their callers before privilege changes are made.
