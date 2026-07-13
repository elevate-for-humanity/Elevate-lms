-- employer_agreements: written by /api/partners/barbershop/employer-agreement
-- Columns match the insert payload in that route.
ALTER TABLE IF EXISTS public.employer_agreements
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS signed_at timestamptz DEFAULT now();
-- Table already exists; skip CREATE, just ensure columns and indexes
/*SKIP_CREATE
CREATE TABLE IF NOT EXISTS public.employer_agreements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  shop_name            text NOT NULL,
  owner_name           text NOT NULL,
  contact_email        text,
  phone                text,
  address_line1        text,
  city                 text,
  state                text DEFAULT 'Indiana',
  zip                  text,
  ein                  text,
  license_number       text,
  license_state        text DEFAULT 'Indiana',
  license_expiry       text,
  mentor_name          text,
  mentor_license       text,
  mentor_license_expiry text,
  wage_year1           text,
  wage_year2           text,
  wage_year3           text,
  ojl_hours_year       text DEFAULT '2000',
  status               text NOT NULL DEFAULT 'pending',
                         CHECK (status IN ('pending','active','expired','terminated')),
  signed_at            timestamptz DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
*/

CREATE INDEX IF NOT EXISTS idx_employer_agreements_partner
  ON public.employer_agreements (partner_id);
CREATE INDEX IF NOT EXISTS idx_employer_agreements_status
  ON public.employer_agreements (status);
CREATE INDEX IF NOT EXISTS idx_employer_agreements_created
  ON public.employer_agreements (created_at DESC);

ALTER TABLE public.employer_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.employer_agreements;
CREATE POLICY "service_role_all" ON public.employer_agreements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read" ON public.employer_agreements;
CREATE POLICY "admin_read" ON public.employer_agreements
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- wioa_report_runs: tracks generated WIOA reports for the admin/wioa/reports page
CREATE TABLE IF NOT EXISTS public.wioa_report_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type    text NOT NULL,
                   CHECK (report_type IN ('quarterly','enrollment','outcomes','expenditure','compliance')),
  period         text,                    -- e.g. 'Q1 2026'
  generated_at   timestamptz NOT NULL DEFAULT now(),
  generated_by   text,                   -- admin email or 'system'
  status         text NOT NULL DEFAULT 'complete',
                   CHECK (status IN ('pending','complete','failed')),
  file_url       text,                   -- Supabase storage URL for the PDF/CSV
  row_count      integer,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wioa_report_runs_type
  ON public.wioa_report_runs (report_type, generated_at DESC);

ALTER TABLE public.wioa_report_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.wioa_report_runs;
CREATE POLICY "service_role_all" ON public.wioa_report_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read" ON public.wioa_report_runs;
CREATE POLICY "admin_read" ON public.wioa_report_runs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );
