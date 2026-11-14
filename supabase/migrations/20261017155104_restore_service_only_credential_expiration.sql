CREATE OR REPLACE FUNCTION public.expire_stale_credentials()
RETURNS TABLE(expired_count integer, credential_ids uuid[])
LANGUAGE sql SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
  WITH expired AS (
    UPDATE public.learner_credentials
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < now()
    RETURNING id, learner_id, credential_id, expires_at
  ), audited AS (
    INSERT INTO public.audit_logs
      (user_id, action, resource_type, resource_id, details, created_at)
    SELECT learner_id, 'credential_expired', 'learner_credential', id::text,
      jsonb_build_object('credential_id', credential_id, 'expired_at', expires_at, 'processed_at', now()), now()
    FROM expired
    RETURNING id
  )
  SELECT count(*)::integer, coalesce(array_agg(id), ARRAY[]::uuid[]) FROM expired;
$function$;
REVOKE ALL ON FUNCTION public.expire_stale_credentials() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_credentials() TO service_role;
NOTIFY pgrst, 'reload schema';
