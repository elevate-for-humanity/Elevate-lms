-- Public inquiries are written through the rate-limited server contact route.
-- A permissive authenticated read policy and tenant policies must not expose
-- client phone numbers or messages to students and other signed-in users.
-- Preserve the existing staff/MFA policies and all records. A restrictive policy
-- is ANDed with every permissive policy; the service role still bypasses RLS.
BEGIN;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketing_contacts_staff_only ON public.marketing_contacts;
CREATE POLICY marketing_contacts_staff_only
  ON public.marketing_contacts AS RESTRICTIVE
  FOR ALL TO public
  USING (rpc_private.is_admin())
  WITH CHECK (rpc_private.is_admin());
-- The Admin CRM uses the signed-in session. Restore its missing read grant
-- only after the restrictive policy protects the table from non-staff users.
GRANT SELECT ON public.marketing_contacts TO authenticated;
COMMIT;
