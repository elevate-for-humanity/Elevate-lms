-- Add missing columns to payroll_profiles so W9 uploads and rates are tracked

ALTER TABLE public.payroll_profiles
  ADD COLUMN IF NOT EXISTS tax_id_uploaded     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS w9_file_url         TEXT,
  ADD COLUMN IF NOT EXISTS w9_uploaded_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rate                NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_type        TEXT,   -- hourly | salary | contractor
  ADD COLUMN IF NOT EXISTS payout_method       TEXT,   -- direct_deposit | check | zelle
  ADD COLUMN IF NOT EXISTS payroll_provider    TEXT,   -- QuickBooks, ADP, Gusto, etc.
  ADD COLUMN IF NOT EXISTS employee_count      INTEGER,
  ADD COLUMN IF NOT EXISTS quickbooks_employee_id TEXT;

-- Index for fast W9 status lookups
CREATE INDEX IF NOT EXISTS idx_payroll_profiles_user_id
  ON public.payroll_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_payroll_profiles_w9
  ON public.payroll_profiles(tax_id_uploaded, w9_uploaded_at);

-- Add employee_count to payroll_runs if missing
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

-- W9 submissions audit log — every W9 upload creates a row here
CREATE TABLE IF NOT EXISTS public.w9_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_app_id   UUID REFERENCES public.provider_applications(id) ON DELETE SET NULL,
  file_url          TEXT NOT NULL,
  ein               TEXT,
  legal_name        TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified          BOOLEAN DEFAULT false,
  verified_at       TIMESTAMPTZ,
  verified_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payroll_profile_id UUID REFERENCES public.payroll_profiles(id) ON DELETE SET NULL,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_w9_submissions_user_id
  ON public.w9_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_w9_submissions_provider_app
  ON public.w9_submissions(provider_app_id);

ALTER TABLE public.w9_submissions ENABLE ROW LEVEL SECURITY;

-- Admins can read all W9 submissions
CREATE POLICY "admins_read_w9_submissions"
  ON public.w9_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role can insert
CREATE POLICY "service_insert_w9_submissions"
  ON public.w9_submissions FOR INSERT
  WITH CHECK (true);

-- Admins can update (verify)
CREATE POLICY "admins_update_w9_submissions"
  ON public.w9_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
