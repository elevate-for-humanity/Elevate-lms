-- External Submissions OS — Phase 2: Content Blocks + Document Templates
-- Approved reusable prose and branded document layouts.

-- ─────────────────────────────────────────────────────────────────────────────
-- content_blocks
-- Pre-approved prose fragments. The system pulls from these instead of
-- generating from scratch. Only status='approved' blocks may be inserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_content_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  block_type       TEXT NOT NULL CHECK (block_type IN (
                     'mission','org_history','org_overview',
                     'program_summary','workforce_development_approach',
                     'equity_statement','employer_engagement',
                     'apprenticeship_model','past_performance_narrative',
                     'rural_access','youth_services','reentry_services',
                     'technical_approach','quality_assurance',
                     'staffing_approach','budget_justification',
                     'evaluation_plan','sustainability_plan',
                     'partnership_narrative','compliance_statement','other'
                   )),
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,      -- approved prose, may contain {{merge_fields}}
  tags             TEXT[],             -- e.g. ['workforce','indiana','youth']
  word_count       INTEGER GENERATED ALWAYS AS (
                     array_length(string_to_array(trim(content), ' '), 1)
                   ) STORED,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','pending_review','approved','archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_content_org_type
  ON public.sos_content_blocks (organization_id, block_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_content_tags
  ON public.sos_content_blocks USING GIN (tags);

ALTER TABLE public.sos_content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_content_admin" ON public.sos_content_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_content_blocks IS
  'Approved prose building blocks. Only status=approved blocks may be inserted into generated documents. Merge fields use {{fact.key}} and {{org.field}} syntax.';

-- ─────────────────────────────────────────────────────────────────────────────
-- document_templates
-- Defines the structure of a generated document.
-- body_template uses merge fields:
--   {{org.legal_name}}  {{org.ein}}  {{org.website}}
--   {{fact.counties_served}}  {{fact.annual_participants_served}}
--   {{content.mission}}  {{content.org_overview}}
--   {{opportunity.title}}  {{opportunity.issuer_name}}  {{opportunity.due_date}}
--   {{style.signatory_name}}  {{style.signatory_title}}
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  template_name    TEXT NOT NULL,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'cover_letter','capability_statement','vendor_profile',
                     'org_overview','past_performance_sheet',
                     'pricing_narrative','budget_narrative',
                     'technical_approach','scope_of_work_response',
                     'implementation_plan','staffing_plan',
                     'quality_assurance_plan','partnership_letter',
                     'letter_of_support','compliance_statement',
                     'transmittal_letter','mou_draft',
                     'employer_agreement','subcontractor_response',
                     'letter_of_interest','other'
                   )),
  style_id         UUID REFERENCES public.sos_document_styles(id),
  body_template    TEXT NOT NULL,      -- HTML with {{merge_fields}}
  output_format    TEXT NOT NULL DEFAULT 'pdf',
                   CHECK (output_format IN ('pdf','docx','html')),
  requires_review  BOOLEAN NOT NULL DEFAULT TRUE,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  version          INTEGER NOT NULL DEFAULT 1,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_templates_org_type
  ON public.sos_document_templates (organization_id, document_type, active);

ALTER TABLE public.sos_document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_templates_admin" ON public.sos_document_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_document_templates IS
  'Branded document layouts with merge fields. body_template is HTML. The generation engine resolves {{org.*}}, {{fact.*}}, {{content.*}}, {{opportunity.*}}, and {{style.*}} tokens against approved data only.';
