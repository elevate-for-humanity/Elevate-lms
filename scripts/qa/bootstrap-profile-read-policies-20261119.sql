-- QA-ONLY minimal profile READ policy stage. Exact source helper and
-- SELECT policies; does not certify full policy parity or training access.
CREATE SCHEMA IF NOT EXISTS rpc_private;
REVOKE ALL ON SCHEMA rpc_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA rpc_private TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  );
END;
$function$;

REVOKE ALL ON FUNCTION rpc_private.is_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.is_admin() TO authenticated,service_role;
CREATE POLICY profiles_own_read ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (id = (SELECT auth.uid() AS uid));
CREATE POLICY admin_bypass_select ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (rpc_private.is_admin());
GRANT SELECT ON public.profiles TO authenticated;

