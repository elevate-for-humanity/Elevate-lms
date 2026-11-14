-- claim_application_by_token requires auth.uid() and has no legitimate anonymous
-- caller. PostgreSQL functions are executable by PUBLIC by default, so revoking
-- only anon is insufficient.
REVOKE EXECUTE ON FUNCTION public.claim_application_by_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_application_by_token(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_application_by_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_application_by_token(uuid) TO service_role;
