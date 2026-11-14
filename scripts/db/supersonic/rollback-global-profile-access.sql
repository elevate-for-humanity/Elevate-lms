-- Target: jlqrfwxuhpzmuivdxvvz only. Explicit rollback of this policy repair.
ALTER POLICY "sfc_documents_admin_read" ON public."sfc_documents" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'staff'::text]))))));
ALTER POLICY "sfc_leads_admin_read" ON public."sfc_leads" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'staff'::text]))))));
ALTER POLICY "sfc_leads_admin_write" ON public."sfc_leads" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'staff'::text]))))));
ALTER POLICY "Admins can manage sfc_tax_returns" ON public."sfc_tax_returns" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))));
ALTER POLICY "tax_1099_staff_access" ON public."tax_1099_income" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_1099_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))))));
ALTER POLICY "tax_audit_admin_read" ON public."tax_audit_log" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
ALTER POLICY "tax_operations_staff_calculations" ON public."tax_calculations" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))));
ALTER POLICY "Admins can view all clients" ON public."tax_clients" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))));
ALTER POLICY "tax_documents_owner_read" ON public."tax_documents" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))));
ALTER POLICY "tax_filing_authorizations_owner_staff" ON public."tax_filing_authorizations" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))));
ALTER POLICY "tax_intake_owner_read" ON public."tax_intake" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))));
ALTER POLICY "tax_interview_owner_staff" ON public."tax_interview_sessions" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))));
ALTER POLICY "tax_itemized_staff_access" ON public."tax_itemized_deductions" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_itemized_deductions.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))))));
ALTER POLICY "tax_offices_admin_access" ON public."tax_offices" USING (((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))) WITH CHECK (((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
ALTER POLICY "tax_preparers_self_admin_access" ON public."tax_preparers" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));
ALTER POLICY "tax_operations_staff_drafts" ON public."tax_return_drafts" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))));
ALTER POLICY "Admins can view all tax returns" ON public."tax_returns" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))));
ALTER POLICY "tax_schedule_c_staff_access" ON public."tax_schedule_c" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_schedule_c.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))))));
ALTER POLICY "tax_transmissions_owner_staff" ON public."tax_transmissions" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_transmissions.return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))))));
ALTER POLICY "tax_w2_staff_access" ON public."tax_w2_income" USING ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text])))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tax_returns r
  WHERE ((r.id = tax_w2_income.tax_return_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'tax_preparer'::text]))))))))));
