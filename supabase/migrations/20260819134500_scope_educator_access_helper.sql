-- Scope educator access to learners they actually serve. This shared helper is
-- used by progress, lesson-access, enrollment-access, and module-unlock RPCs.
CREATE OR REPLACE FUNCTION private.assert_self_or_educator(p_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN; END IF;
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING errcode='42501'; END IF;
  IF v_actor = p_target THEN RETURN; END IF;

  SELECT lower(coalesce(role,'')) INTO v_role FROM public.profiles WHERE id = v_actor;
  IF v_role IN ('admin','super_admin','staff') THEN RETURN; END IF;

  IF v_role = 'instructor' AND EXISTS (
    SELECT 1
    FROM public.program_instructors pi
    JOIN public.program_enrollments pe ON pe.program_id = pi.program_id
    WHERE pi.instructor_id = v_actor
      AND pe.user_id = p_target
      AND pe.status IN ('active','enrolled','in_progress','completed','confirmed')
  ) THEN RETURN; END IF;

  IF v_role IN ('org_admin','provider_admin') AND EXISTS (
    SELECT 1
    FROM public.organization_users ou
    JOIN public.program_enrollments pe ON pe.organization_id = ou.organization_id
    WHERE ou.user_id = v_actor
      AND ou.status = 'active'
      AND ou.role IN ('org_owner','org_admin')
      AND pe.user_id = p_target
  ) THEN RETURN; END IF;

  IF v_role = 'program_holder' AND EXISTS (
    SELECT 1
    FROM public.program_holders ph
    JOIN public.program_enrollments pe ON pe.program_holder_id = ph.id
    WHERE ph.user_id = v_actor
      AND ph.status = 'active'
      AND pe.user_id = p_target
  ) THEN RETURN; END IF;

  RAISE EXCEPTION 'Not authorized for requested user' USING errcode='42501';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_weekly_hours(p_apprentice_id uuid, p_week_ending date)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_total numeric;
BEGIN
  PERFORM private.assert_self_or_educator(p_apprentice_id);
  SELECT coalesce(sum(hours_worked), 0) INTO v_total
  FROM public.progress_entries
  WHERE apprentice_id = p_apprentice_id
    AND week_ending = p_week_ending
    AND clock_out_at IS NOT NULL;
  RETURN v_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_student_risk_status(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_last_activity timestamptz; v_days_inactive integer := 0; v_progress numeric := 0;
  v_overdue integer := 0; v_risk_score numeric := 0; v_status text; v_factors jsonb := '[]'::jsonb;
BEGIN
  PERFORM private.assert_self_or_educator(p_student_id);
  SELECT max(lp.created_at) INTO v_last_activity FROM public.lesson_progress lp WHERE lp.user_id = p_student_id;
  IF v_last_activity IS NULL THEN
    SELECT max(coalesce(pe.started_at, pe.enrolled_at, pe.created_at)) INTO v_last_activity
    FROM public.program_enrollments pe WHERE pe.user_id = p_student_id AND pe.status = 'active';
  END IF;
  v_days_inactive := greatest(0, coalesce(extract(day from now() - v_last_activity)::int, 0));
  SELECT coalesce(avg(pe.progress_percent), 0) INTO v_progress FROM public.program_enrollments pe WHERE pe.user_id = p_student_id AND pe.status = 'active';
  SELECT count(*)::int INTO v_overdue
  FROM public.enrollment_requirements er JOIN public.program_enrollments pe ON pe.id = er.enrollment_id
  WHERE pe.user_id = p_student_id AND pe.status = 'active' AND er.due_date IS NOT NULL
    AND er.due_date < current_date AND coalesce(er.status, 'pending') NOT IN ('completed', 'verified', 'waived');
  v_risk_score := least(100,
    (CASE WHEN v_days_inactive > 14 THEN 40 WHEN v_days_inactive > 7 THEN 20 WHEN v_days_inactive > 3 THEN 10 ELSE 0 END)
    + (CASE WHEN v_progress < 10 THEN 30 WHEN v_progress < 30 THEN 15 WHEN v_progress < 50 THEN 5 ELSE 0 END)
    + least(30, v_overdue * 5));
  v_status := CASE WHEN v_risk_score >= 70 THEN 'critical' WHEN v_risk_score >= 40 THEN 'at_risk' WHEN v_risk_score >= 20 THEN 'watch' ELSE 'on_track' END;
  IF v_days_inactive > 7 THEN v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor','inactivity','days',v_days_inactive)); END IF;
  IF v_progress < 30 THEN v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor','low_progress','pct',v_progress)); END IF;
  IF v_overdue > 0 THEN v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor','overdue_requirements','count',v_overdue)); END IF;
  INSERT INTO public.student_risk_status(user_id,status,days_since_activity,progress_percentage,overdue_count,risk_score,risk_factors,updated_at)
  VALUES(p_student_id,v_status,v_days_inactive,v_progress,v_overdue,v_risk_score,v_factors,now())
  ON CONFLICT(user_id) DO UPDATE SET status=excluded.status, days_since_activity=excluded.days_since_activity,
    progress_percentage=excluded.progress_percentage, overdue_count=excluded.overdue_count,
    risk_score=excluded.risk_score, risk_factors=excluded.risk_factors, updated_at=now();
  RETURN jsonb_build_object('status',v_status,'score',v_risk_score,'days',v_days_inactive,'progress',v_progress,'overdue',v_overdue,'factors',v_factors);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_document_requirements(p_user_id uuid)
RETURNS TABLE(document_type text, is_required boolean, description text, instructions text, has_uploaded boolean, upload_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE v_user_role text;
BEGIN
  PERFORM private.assert_self_or_educator(p_user_id);
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  RETURN QUERY
  SELECT dr.document_type, dr.is_required, dr.description, dr.instructions,
         d.id IS NOT NULL AS has_uploaded, d.status AS upload_status
  FROM public.document_requirements dr
  LEFT JOIN public.documents d ON d.user_id = p_user_id AND d.document_type = dr.document_type
  WHERE dr.role = v_user_role
  ORDER BY dr.is_required DESC, dr.document_type;
END;
$function$;
