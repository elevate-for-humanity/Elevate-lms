-- Enable RLS on 16 sensitive PII tables that had it disabled.
-- These tables store SSNs, drug tests, tax data, FERPA documents, payments,
-- identity verifications, case notes, and health records.
--
-- Pattern:
--   - Tables with user_id: user sees own rows; admin/staff see all
--   - Tables without user_id (stubs/admin-only): admin/staff only
--   - Service role retains full access (bypasses RLS)

ALTER TABLE public.ssn_verifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_tests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_test_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_information      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_return_drafts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferpa_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferpa_audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_management      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs          ENABLE ROW LEVEL SECURITY;

-- Admin-only tables (no user_id column)
DO $$ BEGIN CREATE POLICY admin_only ON public.ssn_verifications      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.drug_tests             FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.drug_test_history      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.tax_information        FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.tax_return_drafts      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.ferpa_documents        FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.id_verifications       FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.identity_verifications FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.case_notes             FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff','case_manager'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.case_management        FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff','case_manager'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.health_logs            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_only ON public.banking_services       FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User-scoped tables (have user_id column)
DO $$ BEGIN CREATE POLICY user_own ON public.learner_documents  FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.learner_documents  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY user_own ON public.payment_methods    FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY user_own ON public.student_payments   FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.student_payments   FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
