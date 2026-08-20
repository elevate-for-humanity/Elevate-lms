-- Government-audit MFA control: privileged identities must present an AAL2 JWT
-- for access to authenticated RLS-protected application data. Role bootstrap tables
-- are excluded so middleware can identify the user and route them to /mfa.
CREATE SCHEMA IF NOT EXISTS security_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA security_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA security_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION security_private.privileged_session_mfa_satisfied()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_aal text := coalesce(auth.jwt()->>'aal', 'aal1');
  v_privileged boolean := false;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_uid
      AND lower(coalesce(p.role,'')) IN (
        'super_admin','admin','org_admin','provider_admin','workforce_board_admin'
      )
    UNION ALL
    SELECT 1
    FROM public.user_roles ur
    LEFT JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_uid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND lower(coalesce(r.name, ur.role, '')) IN (
        'super_admin','admin','org_admin','provider_admin','workforce_board_admin'
      )
  ) INTO v_privileged;

  RETURN (NOT v_privileged) OR v_aal = 'aal2';
END;
$$;

REVOKE ALL ON FUNCTION security_private.privileged_session_mfa_satisfied() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION security_private.privileged_session_mfa_satisfied() TO authenticated, service_role;

DO $policies$
DECLARE
  r record;
  policy_name text;
BEGIN
  FOR r IN
    SELECT DISTINCT p.tablename
    FROM pg_policies p
    JOIN pg_class c ON c.relname = p.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
    WHERE p.schemaname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND p.roles @> ARRAY['authenticated'::name]
      AND p.tablename NOT IN ('profiles','user_roles','roles')
  LOOP
    policy_name := 'require_privileged_aal2';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (security_private.privileged_session_mfa_satisfied()) WITH CHECK (security_private.privileged_session_mfa_satisfied())',
      policy_name,
      r.tablename
    );
  END LOOP;
END
$policies$;
