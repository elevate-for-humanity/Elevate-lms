-- Risk scoring must not treat missing lesson_progress as 999 days inactive.
-- Before a learner has tracked lesson activity, use the active enrollment's
-- start/enrolled/created timestamp as the activity baseline.

CREATE OR REPLACE FUNCTION public.calculate_student_risk_status(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_last_activity timestamptz;
  v_days_inactive integer := 0;
  v_progress numeric := 0;
  v_overdue integer := 0;
  v_risk_score numeric := 0;
  v_status text;
  v_factors jsonb := '[]'::jsonb;
BEGIN
  SELECT MAX(lp.created_at)
    INTO v_last_activity
  FROM public.lesson_progress lp
  WHERE lp.user_id = p_student_id;

  IF v_last_activity IS NULL THEN
    SELECT MAX(COALESCE(pe.started_at, pe.enrolled_at, pe.created_at))
      INTO v_last_activity
    FROM public.program_enrollments pe
    WHERE pe.user_id = p_student_id
      AND pe.status = 'active';
  END IF;

  v_days_inactive := GREATEST(
    0,
    COALESCE(EXTRACT(DAY FROM NOW() - v_last_activity)::int, 0)
  );

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
