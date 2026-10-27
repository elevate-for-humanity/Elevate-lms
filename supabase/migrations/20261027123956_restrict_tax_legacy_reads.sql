-- Primary Elevate runtime only. Preserve owner/tenant/admin policies and MFA.
-- These permissive blanket policies otherwise OR with scoped policies.
ALTER POLICY auth_read_tax_intake ON public.tax_intake USING (false);
ALTER POLICY auth_read_tax_payments ON public.tax_payments USING (false);
-- Legacy upload metadata has no authenticated owner column. Administrators
-- retain their existing scoped policies; ordinary accounts cannot list it.
ALTER POLICY auth_read_tax_document_uploads ON public.tax_document_uploads USING (false);
