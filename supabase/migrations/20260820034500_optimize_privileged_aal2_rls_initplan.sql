-- Evaluate the privileged MFA gate once per statement through a SELECT initplan
-- instead of once per candidate row on large RLS-protected tables.
DO $policies$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'require_privileged_aal2'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS require_privileged_aal2 ON public.%I', r.tablename);
    EXECUTE format(
      'CREATE POLICY require_privileged_aal2 ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT security_private.privileged_session_mfa_satisfied())) WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()))',
      r.tablename
    );
  END LOOP;
END
$policies$;
