CREATE OR REPLACE FUNCTION public.audited_mutation(p_table text, p_operation text, p_row_data jsonb, p_filter jsonb DEFAULT NULL::jsonb, p_conflict_on text[] DEFAULT NULL::text[], p_audit_action text DEFAULT NULL::text, p_audit_actor_id uuid DEFAULT NULL::uuid, p_audit_target_type text DEFAULT NULL::text, p_audit_target_id text DEFAULT NULL::text, p_audit_metadata jsonb DEFAULT '{}'::jsonb, p_audit_ip inet DEFAULT NULL::inet, p_audit_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result jsonb; target_id uuid;
  support_row public.supportive_services%rowtype;
  iep_row public.individual_employment_plans%rowtype;
  certification_row public.user_certifications%rowtype;
  verification_row public.id_verifications%rowtype;
BEGIN
  IF p_audit_action IS NULL OR btrim(p_audit_action)='' THEN RAISE EXCEPTION 'audit action required'; END IF;
  IF p_operation='update' THEN
    target_id:=NULLIF(p_filter->>'id','')::uuid;
    IF target_id IS NULL THEN RAISE EXCEPTION 'id filter required'; END IF;
  END IF;

  CASE p_table
  WHEN 'rapids_tracking' THEN
    IF p_operation<>'upsert' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    INSERT INTO public.rapids_tracking(apprentice_id,rapids_id,status,registration_date,completion_date)
    VALUES ((p_row_data->>'apprentice_id')::uuid,p_row_data->>'rapids_id',p_row_data->>'status',
            (p_row_data->>'registration_date')::date,(p_row_data->>'completion_date')::date)
    ON CONFLICT (apprentice_id) DO UPDATE SET
      rapids_id=COALESCE(EXCLUDED.rapids_id,public.rapids_tracking.rapids_id),
      status=COALESCE(EXCLUDED.status,public.rapids_tracking.status),
      registration_date=COALESCE(EXCLUDED.registration_date,public.rapids_tracking.registration_date),
      completion_date=COALESCE(EXCLUDED.completion_date,public.rapids_tracking.completion_date)
    RETURNING to_jsonb(public.rapids_tracking.*) INTO result;

  WHEN 'supportive_services' THEN
    IF p_operation<>'update' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    SELECT * INTO support_row FROM public.supportive_services WHERE id=target_id FOR UPDATE;
    IF support_row.id IS NULL THEN RAISE EXCEPTION 'supportive service not found'; END IF;
    support_row:=jsonb_populate_record(support_row,p_row_data);
    UPDATE public.supportive_services SET amount_approved=support_row.amount_approved,
      request_status=support_row.request_status,approved_by=support_row.approved_by,
      approved_date=support_row.approved_date,denial_reason=support_row.denial_reason,
      updated_at=support_row.updated_at WHERE id=target_id
    RETURNING to_jsonb(public.supportive_services.*) INTO result;

  WHEN 'individual_employment_plans' THEN
    IF p_operation<>'update' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    SELECT * INTO iep_row FROM public.individual_employment_plans WHERE id=target_id FOR UPDATE;
    IF iep_row.id IS NULL THEN RAISE EXCEPTION 'employment plan not found'; END IF;
    iep_row:=jsonb_populate_record(iep_row,p_row_data);
    UPDATE public.individual_employment_plans SET
      primary_career_goal=iep_row.primary_career_goal,secondary_career_goal=iep_row.secondary_career_goal,
      target_occupation_soc_code=iep_row.target_occupation_soc_code,target_wage_goal=iep_row.target_wage_goal,
      identified_barriers=iep_row.identified_barriers,barrier_mitigation_strategies=iep_row.barrier_mitigation_strategies,
      training_services_needed=iep_row.training_services_needed,supportive_services_needed=iep_row.supportive_services_needed,
      short_term_goals=iep_row.short_term_goals,long_term_goals=iep_row.long_term_goals,status=iep_row.status,
      notes=iep_row.notes,plan_approved_by=iep_row.plan_approved_by,plan_approved_date=iep_row.plan_approved_date,
      review_notes=iep_row.review_notes,updated_at=iep_row.updated_at WHERE id=target_id
    RETURNING to_jsonb(public.individual_employment_plans.*) INTO result;

  WHEN 'transfer_hour_requests' THEN
    IF p_operation<>'insert' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    INSERT INTO public.transfer_hour_requests(student_id,enrollment_id,hours_requested,previous_school_name,
      previous_school_address,previous_school_phone,completion_date,documentation_url,notes,status)
    VALUES ((p_row_data->>'student_id')::uuid,(p_row_data->>'enrollment_id')::uuid,
      (p_row_data->>'hours_requested')::numeric,p_row_data->>'previous_school_name',p_row_data->>'previous_school_address',
      p_row_data->>'previous_school_phone',(p_row_data->>'completion_date')::date,p_row_data->>'documentation_url',
      p_row_data->>'notes',COALESCE(p_row_data->>'status','pending'))
    RETURNING to_jsonb(public.transfer_hour_requests.*) INTO result;

  WHEN 'email_templates' THEN
    IF p_operation<>'insert' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    INSERT INTO public.email_templates(tenant_id,key,subject,body,html)
    VALUES ((p_row_data->>'tenant_id')::uuid,p_row_data->>'key',p_row_data->>'subject',p_row_data->>'body',p_row_data->>'html')
    RETURNING to_jsonb(public.email_templates.*) INTO result;

  WHEN 'user_certifications' THEN
    IF p_operation<>'update' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    SELECT * INTO certification_row FROM public.user_certifications WHERE id=target_id FOR UPDATE;
    IF certification_row.id IS NULL THEN RAISE EXCEPTION 'certification not found'; END IF;
    certification_row:=jsonb_populate_record(certification_row,p_row_data);
    UPDATE public.user_certifications SET status=certification_row.status,updated_at=certification_row.updated_at
    WHERE id=target_id RETURNING to_jsonb(public.user_certifications.*) INTO result;

  WHEN 'id_verifications' THEN
    IF p_operation<>'update' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    SELECT * INTO verification_row FROM public.id_verifications WHERE id=target_id FOR UPDATE;
    IF verification_row.id IS NULL THEN RAISE EXCEPTION 'verification not found'; END IF;
    verification_row:=jsonb_populate_record(verification_row,p_row_data);
    UPDATE public.id_verifications SET status=verification_row.status,verified_by=verification_row.verified_by,
      verified_at=verification_row.verified_at,rejection_reason=verification_row.rejection_reason,updated_at=now()
    WHERE id=target_id RETURNING to_jsonb(public.id_verifications.*) INTO result;

  WHEN 'participants' THEN
    IF p_operation<>'insert' THEN RAISE EXCEPTION 'unsupported operation'; END IF;
    INSERT INTO public.participants(name,email,program_id,status,enrollment_date,case_worker_id)
    VALUES (p_row_data->>'name',p_row_data->>'email',(p_row_data->>'program_id')::uuid,
      COALESCE(p_row_data->>'status','active'),(p_row_data->>'enrollment_date')::date,
      (p_row_data->>'case_worker_id')::uuid)
    RETURNING to_jsonb(public.participants.*) INTO result;
  ELSE RAISE EXCEPTION 'unsupported audited mutation target';
  END CASE;

  IF result IS NULL THEN RAISE EXCEPTION 'mutation affected no row'; END IF;
  INSERT INTO public.audit_logs(action,actor_id,target_type,target_id,metadata,ip_address,user_agent)
  VALUES (p_audit_action,p_audit_actor_id,COALESCE(p_audit_target_type,p_table),COALESCE(p_audit_target_id,result->>'id'),
    COALESCE(p_audit_metadata,'{}'::jsonb)||jsonb_build_object('transactional',true,'operation',p_operation,'table',p_table),
    p_audit_ip,p_audit_user_agent);
  RETURN result;
END; $function$

REVOKE ALL ON FUNCTION public.audited_mutation(text,text,jsonb,jsonb,text[],text,uuid,text,text,jsonb,inet,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audited_mutation(text,text,jsonb,jsonb,text[],text,uuid,text,text,jsonb,inet,text) TO service_role;
