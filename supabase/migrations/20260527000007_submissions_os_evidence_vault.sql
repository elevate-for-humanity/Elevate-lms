-- External Submissions OS — Phase 1: Evidence Vault
-- Past performance, rate sheets, compliance records, partner entities.
-- These feed contract bids, RFPs, and vendor registrations — not just grants.

-- ─────────────────────────────────────────────────────────────────────────────
-- past_performance_records
-- Approved project history used in capability statements and past-performance
-- sections of RFPs, contracts, and grant applications.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_past_performance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  client_name      TEXT NOT NULL,
  project_name     TEXT NOT NULL,
  project_type     TEXT NOT NULL CHECK (project_type IN (
                     'grant','contract','workforce_program','training_program',
                     'apprenticeship','consulting','vendor_service',
                     'partnership','other'
                   )),
  start_date       DATE,
  end_date         DATE,
  contract_value   NUMERIC(14,2),
  description      TEXT NOT NULL,
  outcomes_json    JSONB,              -- { participants: 120, placement_rate: 0.82, ... }
  contact_name     TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','approved','archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_pp_org_status
  ON public.sos_past_performance (organization_id, status);

ALTER TABLE public.sos_past_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_pp_admin" ON public.sos_past_performance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- rate_sheets
-- Approved labor and service rates. Required for contract bids and RFPs.
-- Blocked from auto-submission — must be explicitly approved per packet.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_rate_sheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  rate_type        TEXT NOT NULL CHECK (rate_type IN (
                     'labor_hourly','labor_daily','service_unit',
                     'indirect_cost','fringe_benefit','overhead','other'
                   )),
  title            TEXT NOT NULL,
  effective_date   DATE NOT NULL,
  expiration_date  DATE,
  rates_json       JSONB NOT NULL,    -- [{ role: "Instructor", rate: 65.00, unit: "hour" }, ...]
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','approved','expired','superseded')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_rates_org_status
  ON public.sos_rate_sheets (organization_id, status);

ALTER TABLE public.sos_rate_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_rates_admin" ON public.sos_rate_sheets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_rate_sheets IS
  'Approved rate sheets for contract bids. review_class=blocked — never auto-submitted. Must be explicitly approved per submission packet.';

-- ─────────────────────────────────────────────────────────────────────────────
-- compliance_records
-- Active licenses, certifications, registrations, and renewals.
-- Expiration tracking drives review tasks.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_compliance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  record_type      TEXT NOT NULL CHECK (record_type IN (
                     'state_license','federal_registration','sam_registration',
                     'nonprofit_status','insurance','bonding','certification',
                     'dbe_certification','mbe_certification','wbe_certification',
                     'sbe_certification','etpl_listing','wioa_approval',
                     'dol_registration','state_vendor_registration','other'
                   )),
  title            TEXT NOT NULL,
  issuing_authority TEXT,
  reference_number TEXT,
  file_url         TEXT,
  file_path        TEXT,
  effective_date   DATE,
  expiration_date  DATE,
  status           TEXT NOT NULL DEFAULT 'active',
                   CHECK (status IN ('active','expired','pending_renewal','revoked','unknown')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_compliance_org_type
  ON public.sos_compliance_records (organization_id, record_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_compliance_expiry
  ON public.sos_compliance_records (expiration_date)
  WHERE expiration_date IS NOT NULL;

ALTER TABLE public.sos_compliance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_compliance_admin" ON public.sos_compliance_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_entities
-- Approved partners, subcontractors, and MOU signatories.
-- Used in partnership applications, subcontractor packets, and letters of support.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_partner_entities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  legal_name        TEXT NOT NULL,
  dba_name          TEXT,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
                      'subcontractor','mou_partner','referral_partner',
                      'employer_partner','fiscal_agent','co_applicant',
                      'letter_of_support_provider','vendor','other'
                    )),
  ein               TEXT,
  approved_for_use  BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_partners_org
  ON public.sos_partner_entities (organization_id, approved_for_use);

ALTER TABLE public.sos_partner_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_partners_admin" ON public.sos_partner_entities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));
