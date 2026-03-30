-- External Submissions OS — Phase 3: Link Ingestion + Opportunity Profiling
-- Covers grants, contracts, bids, RFPs, RFQs, vendor registrations, and all
-- external submission types.

-- ─────────────────────────────────────────────────────────────────────────────
-- source_links
-- Every opportunity starts with a URL paste. This table is the entry point.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  submitted_by     UUID REFERENCES auth.users(id),
  original_url     TEXT NOT NULL,
  final_url        TEXT,               -- after redirects
  source_domain    TEXT,
  content_type     TEXT CHECK (content_type IN ('html','pdf','docx','xlsx','unknown')),
  fetch_status     TEXT NOT NULL DEFAULT 'pending',
                   CHECK (fetch_status IN ('pending','fetching','success','failed','blocked')),
  fetched_at       TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_links_org
  ON public.sos_source_links (organization_id, fetch_status);

ALTER TABLE public.sos_source_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_links_admin" ON public.sos_source_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- source_documents
-- Raw extracted content from a fetched link.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_link_id   UUID NOT NULL REFERENCES public.sos_source_links(id) ON DELETE CASCADE,
  title            TEXT,
  raw_text         TEXT,               -- full extracted text
  extracted_text   TEXT,               -- cleaned / normalized
  metadata_json    JSONB,              -- page count, author, dates found, etc.
  hash             TEXT,               -- SHA-256 of raw_text for dedup
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_source_docs_link
  ON public.sos_source_documents (source_link_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_source_docs_hash
  ON public.sos_source_documents (hash)
  WHERE hash IS NOT NULL;

ALTER TABLE public.sos_source_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_source_docs_admin" ON public.sos_source_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- source_document_sections
-- Parsed sections of a source document (eligibility, requirements, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_document_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id  UUID NOT NULL REFERENCES public.sos_source_documents(id) ON DELETE CASCADE,
  section_type        TEXT CHECK (section_type IN (
                        'overview','eligibility','requirements','attachments',
                        'budget','timeline','evaluation','submission_instructions',
                        'contact','other'
                      )),
  heading             TEXT,
  body_text           TEXT NOT NULL,
  page_number         INTEGER,
  confidence          NUMERIC(3,2),    -- 0.00–1.00 extraction confidence
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_sections_doc
  ON public.sos_source_document_sections (source_document_id, section_type);

ALTER TABLE public.sos_source_document_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_sections_admin" ON public.sos_source_document_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- opportunities
-- Universal opportunity record — grants, contracts, bids, registrations, all.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  source_link_id      UUID REFERENCES public.sos_source_links(id),
  opportunity_type    TEXT NOT NULL CHECK (opportunity_type IN (
                        'grant','contract','bid','rfp','rfq','rfi',
                        'vendor_registration','supplier_onboarding',
                        'state_agency_application','workforce_provider_application',
                        'partnership_application','license_renewal',
                        'compliance_submission','employer_agreement_packet','other'
                      )),
  issuer_name         TEXT NOT NULL,
  title               TEXT NOT NULL,
  reference_number    TEXT,            -- CFDA, solicitation #, RFP #, etc.
  status              TEXT NOT NULL DEFAULT 'profiling',
                      CHECK (status IN (
                        'profiling','requirements_extracted','mapping',
                        'packet_building','review','ready','submitted',
                        'awarded','not_awarded','withdrawn','archived'
                      )),
  submission_method   TEXT CHECK (submission_method IN (
                        'online_portal','email','mail','hand_delivery',
                        'grants_gov','sam_gov','state_portal','other'
                      )),
  portal_url          TEXT,
  issue_date          DATE,
  due_date            TIMESTAMPTZ,
  questions_deadline  TIMESTAMPTZ,
  estimated_value     NUMERIC(14,2),
  eligibility_text    TEXT,
  scope_summary       TEXT,
  profiled_by         UUID REFERENCES auth.users(id),
  profiled_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_opps_org_status
  ON public.sos_opportunities (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_opps_due_date
  ON public.sos_opportunities (due_date)
  WHERE due_date IS NOT NULL;

ALTER TABLE public.sos_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_opps_admin" ON public.sos_opportunities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- opportunity_requirements
-- Every item the issuer requires in the submission.
-- review_class is set during extraction and drives the classification engine.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_opportunity_requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id      UUID NOT NULL REFERENCES public.sos_opportunities(id) ON DELETE CASCADE,
  requirement_category TEXT NOT NULL CHECK (requirement_category IN (
                         'organization_fact','form_field','narrative',
                         'attachment','budget','pricing',
                         'compliance_document','insurance_document',
                         'certification','signature','reference',
                         'partner_document','staff_document',
                         'work_sample','scope_response','other'
                       )),
  requirement_name    TEXT NOT NULL,
  description         TEXT,
  required            BOOLEAN NOT NULL DEFAULT TRUE,
  source_section_id   UUID REFERENCES public.sos_source_document_sections(id),
  response_format     TEXT,            -- e.g. 'pdf', 'form_field', 'narrative_text'
  word_limit          INTEGER,
  attachment_type     TEXT,            -- e.g. 'w9', 'insurance_certificate'
  due_date            TIMESTAMPTZ,
  -- Classification — the backbone of the submission safety system
  review_class        TEXT NOT NULL DEFAULT 'review_required',
                      CHECK (review_class IN (
                        'auto_safe',        -- legal name, EIN, address, pre-approved attachments
                        'ask_if_missing',   -- service area, counts, program list
                        'review_required',  -- narratives, budgets, tech approach
                        'blocked'           -- signatures, legal attestations, pricing commitments
                      )),
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_reqs_opp
  ON public.sos_opportunity_requirements (opportunity_id, review_class);

ALTER TABLE public.sos_opportunity_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_reqs_admin" ON public.sos_opportunity_requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON COLUMN public.sos_opportunity_requirements.review_class IS
  'auto_safe: legal name/EIN/address/pre-approved attachments. ask_if_missing: service area/counts/programs. review_required: narratives/budgets/plans. blocked: signatures/legal attestations/pricing commitments. System halts on any blocked or unresolved review_required item.';

-- ─────────────────────────────────────────────────────────────────────────────
-- requirement_mappings
-- Links each requirement to the approved data source that will satisfy it.
-- This is the classification engine output.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_requirement_mappings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_requirement_id UUID NOT NULL REFERENCES public.sos_opportunity_requirements(id) ON DELETE CASCADE,
  mapped_source_type       TEXT NOT NULL CHECK (mapped_source_type IN (
                             'org_field','org_fact','content_block',
                             'attachment','past_performance','rate_sheet',
                             'compliance_record','partner_entity',
                             'manual_input','template_generated','none'
                           )),
  mapped_source_id         UUID,        -- FK to the relevant table row
  mapping_confidence       NUMERIC(3,2) DEFAULT 1.00,  -- 0.00–1.00
  submission_class         TEXT NOT NULL DEFAULT 'review_required',
                           CHECK (submission_class IN (
                             'auto_safe','ask_if_missing',
                             'review_required','blocked'
                           )),
  resolution_status        TEXT NOT NULL DEFAULT 'unresolved',
                           CHECK (resolution_status IN (
                             'unresolved','resolved','approved',
                             'blocked','waived'
                           )),
  resolved_by              UUID REFERENCES auth.users(id),
  resolved_at              TIMESTAMPTZ,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_mappings_req
  ON public.sos_requirement_mappings (opportunity_requirement_id, resolution_status);

ALTER TABLE public.sos_requirement_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_mappings_admin" ON public.sos_requirement_mappings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));
