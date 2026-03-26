-- External Submissions OS — Phase 1: Organization Vault
-- Covers grants, contracts, bids, vendor registrations, and all external submissions.
-- All tables are multi-tenant via organization_id.

-- ─────────────────────────────────────────────────────────────────────────────
-- organizations
-- The legal entity that submits. One row per org.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organizations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name                TEXT NOT NULL,
  dba_name                  TEXT,
  ein                       TEXT,
  uei                       TEXT,                    -- SAM.gov Unique Entity ID
  sam_status                TEXT CHECK (sam_status IN ('active','inactive','pending','unknown')) DEFAULT 'unknown',
  sam_expiration            DATE,
  website                   TEXT,
  phone                     TEXT,
  general_email             TEXT,
  address_line_1            TEXT,
  address_line_2            TEXT,
  city                      TEXT,
  state                     TEXT,
  zip                       TEXT,
  authorized_signatory_name  TEXT,
  authorized_signatory_title TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_orgs_ein ON public.sos_organizations (ein);
CREATE INDEX IF NOT EXISTS idx_sos_orgs_uei ON public.sos_organizations (uei);

ALTER TABLE public.sos_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_orgs_admin" ON public.sos_organizations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_profiles
-- Narrative identity — mission, populations, geography, capacity.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organization_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  mission_statement     TEXT,
  org_overview          TEXT,
  target_populations    TEXT,
  counties_served       TEXT[],
  service_area_notes    TEXT,
  years_in_operation    INTEGER,
  staff_count           INTEGER,
  board_count           INTEGER,
  insurance_status      TEXT CHECK (insurance_status IN ('current','expired','none','unknown')) DEFAULT 'unknown',
  audit_status          TEXT CHECK (audit_status IN ('current','overdue','not_required','unknown')) DEFAULT 'unknown',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id)
);

ALTER TABLE public.sos_organization_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_org_profiles_admin" ON public.sos_organization_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_facts
-- Atomic, versioned, approved facts. The single source of truth for
-- any value inserted into a generated document.
--
-- Rule: no fact is used in a submission unless status = 'approved'.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organization_facts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  fact_key         TEXT NOT NULL,
  fact_value_json  JSONB NOT NULL,
  source_type      TEXT NOT NULL CHECK (source_type IN (
                     'manual_entry','document_upload','api_pull',
                     'extracted','imported','calculated'
                   )),
  source_reference TEXT,                -- file name, URL, or note
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','pending_review','approved','rejected','expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_facts_org_key
  ON public.sos_organization_facts (organization_id, fact_key);
CREATE INDEX IF NOT EXISTS idx_sos_facts_status
  ON public.sos_organization_facts (organization_id, status);

ALTER TABLE public.sos_organization_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_facts_admin" ON public.sos_organization_facts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_organization_facts IS
  'Atomic approved facts used as merge-field sources in generated documents. Only status=approved facts may be inserted into submission packets.';
COMMENT ON COLUMN public.sos_organization_facts.fact_key IS
  'Dot-notation key, e.g. counties_served, annual_participants_served, job_placement_rate, completion_rate, wioa_eligible_programs, insured, staff_count';
COMMENT ON COLUMN public.sos_organization_facts.fact_value_json IS
  'Value stored as JSONB to support scalars, arrays, and objects. Scalar example: "1200". Array example: ["Marion","Hamilton","Hendricks"].';
