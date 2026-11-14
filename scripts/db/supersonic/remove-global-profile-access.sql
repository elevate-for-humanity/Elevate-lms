-- Target: jlqrfwxuhpzmuivdxvvz only. No primary data or document migration.
-- Remove global profile-role shortcuts; keep existing ownership expressions.
-- Operator access remains closed until tenant-scoped tax APIs are accepted.
DO $boundary$ BEGIN IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM public.profiles) THEN RAISE EXCEPTION 'Dedicated tax access cutover requires an empty destination auth inventory'; END IF; IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sfc_tax_returns' AND column_name='id' AND udt_name='int8') THEN RAISE EXCEPTION 'Dedicated tax schema boundary mismatch'; END IF; END $boundary$;
SET LOCAL lock_timeout='5s';
LOCK TABLE public."sfc_documents",public."sfc_leads",public."sfc_tax_returns",public."tax_1099_income",public."tax_audit_log",public."tax_calculations",public."tax_clients",public."tax_documents",public."tax_filing_authorizations",public."tax_intake",public."tax_interview_sessions",public."tax_itemized_deductions",public."tax_offices",public."tax_preparers",public."tax_return_drafts",public."tax_returns",public."tax_schedule_c",public."tax_transmissions",public."tax_w2_income" IN ACCESS EXCLUSIVE MODE;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."sfc_documents") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."sfc_leads") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."sfc_tax_returns") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_1099_income") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_audit_log") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_calculations") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_clients") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_documents") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_filing_authorizations") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_intake") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_interview_sessions") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_itemized_deductions") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_offices") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_preparers") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_return_drafts") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_returns") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_schedule_c") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_transmissions") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $empty$ BEGIN IF EXISTS(SELECT 1 FROM public."tax_w2_income") THEN RAISE EXCEPTION 'Destination tax records changed; reconcile before policy cutover'; END IF; END $empty$;
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sfc_documents' AND policyname='sfc_documents_admin_read' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''staff''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "sfc_documents_admin_read" ON public."sfc_documents" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sfc_leads' AND policyname='sfc_leads_admin_read' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''staff''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "sfc_leads_admin_read" ON public."sfc_leads" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sfc_leads' AND policyname='sfc_leads_admin_write' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''staff''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "sfc_leads_admin_write" ON public."sfc_leads" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sfc_tax_returns' AND policyname='Admins can manage sfc_tax_returns' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "Admins can manage sfc_tax_returns" ON public."sfc_tax_returns" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_1099_income' AND policyname='tax_1099_staff_access' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_1099_staff_access" ON public."tax_1099_income" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_audit_log' AND policyname='tax_audit_admin_read' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_audit_admin_read" ON public."tax_audit_log" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_calculations' AND policyname='tax_operations_staff_calculations' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_operations_staff_calculations" ON public."tax_calculations" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_clients' AND policyname='Admins can view all clients' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "Admins can view all clients" ON public."tax_clients" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_documents' AND policyname='tax_documents_owner_read' AND qual IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_documents_owner_read" ON public."tax_documents" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_filing_authorizations' AND policyname='tax_filing_authorizations_owner_staff' AND qual IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))' AND with_check IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_filing_authorizations_owner_staff" ON public."tax_filing_authorizations" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_intake' AND policyname='tax_intake_owner_read' AND qual IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_intake_owner_read" ON public."tax_intake" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_interview_sessions' AND policyname='tax_interview_owner_staff' AND qual IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))' AND with_check IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text]))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_interview_owner_staff" ON public."tax_interview_sessions" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_itemized_deductions' AND policyname='tax_itemized_staff_access' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_itemized_staff_access" ON public."tax_itemized_deductions" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_offices' AND policyname='tax_offices_admin_access' AND qual IS NOT DISTINCT FROM '((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text]))))))' AND with_check IS NOT DISTINCT FROM '((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text]))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_offices_admin_access" ON public."tax_offices" USING (((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))) WITH CHECK (((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_preparers' AND policyname='tax_preparers_self_admin_access' AND qual IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text]))))))' AND with_check IS NOT DISTINCT FROM '((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text]))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_preparers_self_admin_access" ON public."tax_preparers" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_return_drafts' AND policyname='tax_operations_staff_drafts' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_operations_staff_drafts" ON public."tax_return_drafts" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_returns' AND policyname='Admins can view all tax returns' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "Admins can view all tax returns" ON public."tax_returns" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND false))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_schedule_c' AND policyname='tax_schedule_c_staff_access' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_schedule_c_staff_access" ON public."tax_schedule_c" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_transmissions' AND policyname='tax_transmissions_owner_staff' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_transmissions.return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))' AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_transmissions_owner_staff" ON public."tax_transmissions" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_transmissions.return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))))));
DO $expected$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tax_w2_income' AND policyname='tax_w2_staff_access' AND qual IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))' AND with_check IS NOT DISTINCT FROM '(EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY[''admin''::text, ''super_admin''::text, ''tax_preparer''::text])))))))))') THEN RAISE EXCEPTION 'Tax policy changed; refusing to overwrite'; END IF; END $expected$;
ALTER POLICY "tax_w2_staff_access" ON public."tax_w2_income" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND false))))))));
