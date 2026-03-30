-- RLS policies for forms, form_submissions, webinars, webinar_registrations,
-- and provider_* tables. These tables existed without policies, causing
-- authenticated non-service-role reads to return empty results.
--
-- Access model:
--   forms                      — public read; admin write
--   form_submissions           — anon insert (unauthenticated form posts); admin read
--   webinars                   — public read (is_public rows); admin write
--   webinar_registrations      — user owns their row; admin read all
--   provider_applications      — anon insert (public apply form); owner read own; admin manage
--   provider_compliance_artifacts — provider_admin reads/writes own tenant; admin read all
--   provider_onboarding_steps  — provider_admin reads own tenant; admin read all
--   provider_program_approvals — provider_admin reads own tenant; admin read all

-- ─── helpers ────────────────────────────────────────────────────────────────

-- Returns true when the caller's profile role is one of the admin tiers.
-- Used in USING / WITH CHECK clauses below.
CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
  )
$$;

-- Returns the tenant_id from the caller's profile.
CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── forms ──────────────────────────────────────────────────────────────────

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can look up a form by id — needed for the submit route
-- which verifies the form exists before inserting a submission.
CREATE POLICY "forms_public_read"
  ON public.forms
  FOR SELECT
  USING (true);

CREATE POLICY "forms_admin_insert"
  ON public.forms
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "forms_admin_update"
  ON public.forms
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "forms_admin_delete"
  ON public.forms
  FOR DELETE
  USING (public.is_admin_role());

-- ─── form_submissions ───────────────────────────────────────────────────────

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- The /api/forms/submit route uses createClient() without requiring auth,
-- so submissions must be insertable by anon callers.
CREATE POLICY "form_submissions_anon_insert"
  ON public.form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own submissions (user_id may be null for anon).
CREATE POLICY "form_submissions_owner_read"
  ON public.form_submissions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin_role()
  );

CREATE POLICY "form_submissions_admin_delete"
  ON public.form_submissions
  FOR DELETE
  USING (public.is_admin_role());

-- ─── webinars ───────────────────────────────────────────────────────────────

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- Public page reads only is_public=true rows; the policy mirrors that filter
-- so even a direct query without the filter returns only public rows for anon.
CREATE POLICY "webinars_public_read"
  ON public.webinars
  FOR SELECT
  USING (is_public = true OR public.is_admin_role());

CREATE POLICY "webinars_admin_insert"
  ON public.webinars
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "webinars_admin_update"
  ON public.webinars
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "webinars_admin_delete"
  ON public.webinars
  FOR DELETE
  USING (public.is_admin_role());

-- ─── webinar_registrations ──────────────────────────────────────────────────

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webinar_registrations_owner_read"
  ON public.webinar_registrations
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "webinar_registrations_owner_insert"
  ON public.webinar_registrations
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "webinar_registrations_owner_update"
  ON public.webinar_registrations
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "webinar_registrations_admin_delete"
  ON public.webinar_registrations
  FOR DELETE
  USING (public.is_admin_role());

-- ─── provider_applications ──────────────────────────────────────────────────

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

-- Public apply form: anon insert allowed (no auth required to submit an application).
CREATE POLICY "provider_applications_anon_insert"
  ON public.provider_applications
  FOR INSERT
  WITH CHECK (true);

-- Applicant can read their own application by matching contact_email.
-- Admin can read all.
CREATE POLICY "provider_applications_read"
  ON public.provider_applications
  FOR SELECT
  USING (
    public.is_admin_role()
    OR (
      auth.uid() IS NOT NULL
      AND contact_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "provider_applications_admin_update"
  ON public.provider_applications
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "provider_applications_admin_delete"
  ON public.provider_applications
  FOR DELETE
  USING (public.is_admin_role());

-- ─── provider_compliance_artifacts ──────────────────────────────────────────

ALTER TABLE public.provider_compliance_artifacts ENABLE ROW LEVEL SECURITY;

-- provider_admin reads/writes rows belonging to their own tenant.
-- Admin reads all.
CREATE POLICY "provider_compliance_artifacts_tenant_read"
  ON public.provider_compliance_artifacts
  FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    OR public.is_admin_role()
  );

CREATE POLICY "provider_compliance_artifacts_tenant_insert"
  ON public.provider_compliance_artifacts
  FOR INSERT
  WITH CHECK (
    tenant_id = public.my_tenant_id()
    OR public.is_admin_role()
  );

CREATE POLICY "provider_compliance_artifacts_tenant_update"
  ON public.provider_compliance_artifacts
  FOR UPDATE
  USING (
    tenant_id = public.my_tenant_id()
    OR public.is_admin_role()
  );

CREATE POLICY "provider_compliance_artifacts_admin_delete"
  ON public.provider_compliance_artifacts
  FOR DELETE
  USING (public.is_admin_role());

-- ─── provider_onboarding_steps ──────────────────────────────────────────────

ALTER TABLE public.provider_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_onboarding_steps_tenant_read"
  ON public.provider_onboarding_steps
  FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    OR public.is_admin_role()
  );

-- Steps are written by admin/staff only (system-managed).
CREATE POLICY "provider_onboarding_steps_admin_write"
  ON public.provider_onboarding_steps
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "provider_onboarding_steps_admin_update"
  ON public.provider_onboarding_steps
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "provider_onboarding_steps_admin_delete"
  ON public.provider_onboarding_steps
  FOR DELETE
  USING (public.is_admin_role());

-- ─── provider_program_approvals ─────────────────────────────────────────────

ALTER TABLE public.provider_program_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_program_approvals_tenant_read"
  ON public.provider_program_approvals
  FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    OR public.is_admin_role()
  );

CREATE POLICY "provider_program_approvals_admin_write"
  ON public.provider_program_approvals
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "provider_program_approvals_admin_update"
  ON public.provider_program_approvals
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "provider_program_approvals_admin_delete"
  ON public.provider_program_approvals
  FOR DELETE
  USING (public.is_admin_role());
