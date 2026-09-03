-- Document Intelligence: ensure extraction columns exist on documents table
-- (20260622000006 added these but may not be applied everywhere)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ocr_text        TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence  DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS extracted_data  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending'
    CHECK (extraction_status IN ('pending','processing','extracted','failed','skipped'));

CREATE INDEX IF NOT EXISTS idx_documents_extraction_status
  ON public.documents (extraction_status)
  WHERE extraction_status IN ('pending','processing','failed');

-- document_field_mappings: admin-approved field→target mappings per document
CREATE TABLE IF NOT EXISTS public.document_field_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key       TEXT NOT NULL,   -- e.g. 'person_name', 'ein', 'grant_number'
  field_value     TEXT,
  target_table    TEXT,            -- e.g. 'profiles', 'grants', 'applications'
  target_column   TEXT,            -- e.g. 'full_name', 'ein'
  target_row_id   UUID,            -- specific row to prefill
  approved        BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_field_mappings_doc
  ON public.document_field_mappings (document_id);

ALTER TABLE public.document_field_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage document field mappings"
    ON public.document_field_mappings FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- grant_applications: draft grant applications with prefilled org data
CREATE TABLE IF NOT EXISTS public.grant_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- opportunity linkage (flexible — can reference grants, sos_opportunities, or external)
  opportunity_id        UUID,
  opportunity_title     TEXT NOT NULL,
  opportunity_number    TEXT,
  agency_name           TEXT,
  cfda_number           TEXT,
  deadline              DATE,
  award_ceiling         BIGINT,
  award_floor           BIGINT,
  opportunity_url       TEXT,
  -- org data (snapshotted at draft time from sos_organizations)
  org_id                UUID REFERENCES public.sos_organizations(id) ON DELETE SET NULL,
  legal_name            TEXT,
  ein                   TEXT,
  uei                   TEXT,
  sam_status            TEXT,
  org_address           TEXT,
  contact_name          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  -- narrative sections (human-edited)
  project_title         TEXT,
  executive_summary     TEXT,
  problem_statement     TEXT,
  project_description   TEXT,
  target_population     TEXT,
  geographic_area       TEXT,
  goals_and_objectives  TEXT,
  evaluation_plan       TEXT,
  sustainability_plan   TEXT,
  budget_narrative      TEXT,
  budget_total          BIGINT,
  partner_agencies      TEXT,
  -- supporting documents
  attached_document_ids UUID[],
  -- workflow
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','submitted','awarded','rejected','archived')),
  submitted_at          TIMESTAMPTZ,
  submitted_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_applications_status
  ON public.grant_applications (status, deadline);
CREATE INDEX IF NOT EXISTS idx_grant_applications_org
  ON public.grant_applications (org_id);

ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage grant applications"
    ON public.grant_applications FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- grant_opportunities: local cache of fetched Grants.gov / SAM.gov opportunities
CREATE TABLE IF NOT EXISTS public.grant_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source              TEXT NOT NULL DEFAULT 'grants_gov'
    CHECK (source IN ('grants_gov','sam_gov','manual','other')),
  opportunity_number  TEXT,
  title               TEXT NOT NULL,
  agency_code         TEXT,
  agency_name         TEXT,
  cfda_number         TEXT,
  assistance_listing  TEXT,
  posted_date         DATE,
  close_date          DATE,
  archive_date        DATE,
  award_ceiling       BIGINT,
  award_floor         BIGINT,
  estimated_funding   BIGINT,
  opportunity_url     TEXT,
  description         TEXT,
  eligibility_text    TEXT,
  applicant_types     TEXT[],
  funding_categories  TEXT[],
  status              TEXT NOT NULL DEFAULT 'posted'
    CHECK (status IN ('forecasted','posted','closed','archived')),
  raw_json            JSONB,
  imported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_opps_close_date
  ON public.grant_opportunities (close_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_grant_opps_source
  ON public.grant_opportunities (source, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grant_opps_number
  ON public.grant_opportunities (opportunity_number)
  WHERE opportunity_number IS NOT NULL;

ALTER TABLE public.grant_opportunities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage grant opportunities"
    ON public.grant_opportunities FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
