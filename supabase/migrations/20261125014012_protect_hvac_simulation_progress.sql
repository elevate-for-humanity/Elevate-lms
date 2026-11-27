-- Reserve visual-simulation evidence for the server-scored API. Restrictive
-- policies supplement every existing owner/admin/MFA policy; no records or
-- existing policies are replaced. Service-role writes already use BYPASSRLS.
CREATE POLICY interaction_progress_hvac_server_insert
  ON public.interaction_progress AS RESTRICTIVE
  FOR INSERT TO PUBLIC
  WITH CHECK (interaction_id NOT LIKE 'hvac-sim:%');

CREATE POLICY interaction_progress_hvac_server_update
  ON public.interaction_progress AS RESTRICTIVE
  FOR UPDATE TO PUBLIC
  USING (interaction_id NOT LIKE 'hvac-sim:%')
  WITH CHECK (interaction_id NOT LIKE 'hvac-sim:%');

CREATE POLICY interaction_progress_hvac_server_delete
  ON public.interaction_progress AS RESTRICTIVE
  FOR DELETE TO PUBLIC
  USING (interaction_id NOT LIKE 'hvac-sim:%');

-- Check the caller's actual JWT/MFA policy with an authenticated client before
-- the API performs a narrowly scoped privileged write. No identity is accepted
-- as an argument and this function does not change data or bypass RLS.
CREATE FUNCTION public.hvac_simulation_session_ready()
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND coalesce(security_private.privileged_session_mfa_satisfied(), false);
$$;

REVOKE ALL ON FUNCTION public.hvac_simulation_session_ready() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hvac_simulation_session_ready() TO authenticated;
COMMENT ON FUNCTION public.hvac_simulation_session_ready() IS
  'Authenticated caller-only readiness check for server-scored HVAC simulation progress; preserves the existing privileged-session MFA restriction.';
