-- Holder dashboards use server-side, scoped projections. Prevent direct raw-row
-- access from Enchanted Hearts sessions, where permissive legacy policies could
-- otherwise expose contact columns. Admin and service-role workflows remain available.
CREATE POLICY enchanted_hearts_no_raw_applicant_access
ON public.program_holder_students AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT EXISTS (
  SELECT 1 FROM public.program_holders ph
  WHERE ph.user_id = (SELECT auth.uid())
    AND concat_ws(' ', ph.organization_name, ph.name) ILIKE '%enchanted hearts%'
));
