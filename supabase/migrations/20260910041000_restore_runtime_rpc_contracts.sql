ALTER TABLE public.provisioning_jobs ADD COLUMN IF NOT EXISTS last_error text;
CREATE OR REPLACE FUNCTION public.claim_provisioning_jobs(p_limit integer DEFAULT 25)
 RETURNS SETOF provisioning_jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'p_limit must be between 1 and 100';
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM public.provisioning_jobs
    WHERE status = 'queued' AND COALESCE(run_at, now()) <= now()
    ORDER BY COALESCE(run_at, created_at), created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.provisioning_jobs jobs
  SET status = 'processing',
      attempts = jobs.attempts + 1,
      started_at = now(),
      updated_at = now()
  FROM claimed
  WHERE jobs.id = claimed.id
  RETURNING jobs.*;
END;
$function$

CREATE OR REPLACE FUNCTION public.complete_provisioning_job(p_job_id uuid, p_success boolean, p_error text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE public.provisioning_jobs
  SET status = CASE
        WHEN p_success THEN 'completed'
        WHEN attempts >= max_attempts THEN 'dead'
        ELSE 'queued'
      END,
      last_error = CASE WHEN p_success THEN NULL ELSE left(p_error, 4000) END,
      completed_at = CASE WHEN p_success THEN now() ELSE NULL END,
      started_at = NULL,
      run_at = CASE WHEN p_success OR attempts >= max_attempts THEN run_at ELSE now() + interval '5 minutes' END,
      updated_at = now()
  WHERE id = p_job_id AND status = 'processing';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$function$

CREATE OR REPLACE FUNCTION public.retry_dead_letter_job(p_job_id uuid, p_admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  affected integer;
BEGIN
  IF p_admin_user_id IS DISTINCT FROM auth.uid()
     OR NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
     ) THEN
    RAISE EXCEPTION 'admin authorization required';
  END IF;

  UPDATE public.provisioning_jobs
  SET status = 'queued', attempts = 0, last_error = NULL,
      started_at = NULL, completed_at = NULL, run_at = now(), updated_at = now()
  WHERE id = p_job_id AND status = 'dead';
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 1 THEN
    INSERT INTO public.audit_logs(action, actor_id, target_type, target_id, metadata)
    VALUES ('admin:provisioning-job:retry', p_admin_user_id, 'provisioning_jobs', p_job_id::text,
            jsonb_build_object('transactional', true));
  END IF;
  RETURN affected = 1;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_org_invite_by_token(p_token text)
 RETURNS TABLE(id uuid, organization_id uuid, organization_name text, inviter_name text, email text, role text, expires_at timestamp with time zone, accepted_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT invite.id, invite.organization_id, organization.name,
         creator.full_name, invite.email, invite.role,
         invite.expires_at, invite.accepted_at
  FROM public.org_invites invite
  JOIN public.organizations organization ON organization.id = invite.organization_id
  LEFT JOIN public.profiles creator ON creator.id = invite.created_by
  WHERE invite.token = p_token
    AND invite.expires_at > now()
  LIMIT 1
$function$

CREATE OR REPLACE FUNCTION public.increment_search_count(search_query text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  INSERT INTO public.search_logs(user_id, action, query, results_count, details)
  SELECT auth.uid(), 'global_search', left(search_query, 500), 0, '{}'::jsonb
  WHERE auth.uid() IS NOT NULL
$function$

CREATE OR REPLACE FUNCTION public.log_admin_access(p_target_tenant_id uuid, p_action text, p_table_accessed text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'admin authorization required';
  END IF;

  INSERT INTO public.audit_logs(
    action, actor_id, target_type, target_id, metadata, tenant_id
  ) VALUES (
    p_action, auth.uid(), p_table_accessed, p_target_tenant_id::text,
    jsonb_build_object('reason', p_reason, 'cross_tenant', true),
    p_target_tenant_id
  );
END;
$function$

REVOKE ALL ON FUNCTION public.claim_provisioning_jobs(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_provisioning_jobs(integer) TO service_role;
REVOKE ALL ON FUNCTION public.complete_provisioning_job(uuid,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_provisioning_job(uuid,boolean,text) TO service_role;
