-- Contract Automation System
-- State agency contracts, grant templates, MOUs — upload, extract, prefill, sign, export.
-- Builds on existing signature_documents + sos_organization_facts infrastructure.

-- ── contract_templates ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  agency_name         TEXT,
  source_type         TEXT NOT NULL DEFAULT 'state_contract'
    CHECK (source_type IN (
      'state_contract','grant_application','mou','rfp','rfq',
      'vendor_registration','compliance_form','other'
    )),
  original_file_path  TEXT,           -- Supabase Storage path (private bucket)
  mirrored_file_path  TEXT,           -- public preview copy if needed
  file_type           TEXT,           -- mime type
  file_name           TEXT,
  file_size           BIGINT,
  status              TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded','extracting','extracted','prefilling','review','approved','signed','exported','archived')),
  extraction_method   TEXT,           -- 'pdf-parse','mammoth','ocr','manual'
  raw_text            TEXT,           -- full extracted text
  page_count          INTEGER,
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_status
  ON public.contract_templates (status, created_at DESC);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract templates"
    ON public.contract_templates FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_template_fields ──────────────────────────────────────────────────
-- Detected fields from the template (blanks, checkboxes, signature lines, etc.)
CREATE TABLE IF NOT EXISTS public.contract_template_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  label                 TEXT NOT NULL,
  field_key             TEXT NOT NULL,   -- normalized snake_case key
  field_type            TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text','date','number','checkbox','signature','initials','currency','textarea','select')),
  required              BOOLEAN NOT NULL DEFAULT TRUE,
  page_number           INTEGER,
  x                     DECIMAL,
  y                     DECIMAL,
  width                 DECIMAL,
  height                DECIMAL,
  confidence            DECIMAL(5,4),   -- 0-1 detection confidence
  context_snippet       TEXT,           -- surrounding text for context
  source                TEXT DEFAULT 'detected'
    CHECK (source IN ('detected','manual','ocr')),
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ctf_template
  ON public.contract_template_fields (contract_template_id, sort_order);

ALTER TABLE public.contract_template_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract template fields"
    ON public.contract_template_fields FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_prefill_runs ─────────────────────────────────────────────────────
-- Each time admin runs prefill on a template, a run is created.
-- Fields are approved individually before export.
CREATE TABLE IF NOT EXISTS public.contract_prefill_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','exported','archived')),
  response_style        TEXT NOT NULL DEFAULT 'state_contract_formal'
    CHECK (response_style IN (
      'state_contract_formal','grant_persuasive','agency_compliance',
      'workforce_development','partner_mou','budget_justification','executive_summary'
    )),
  -- Three JSONB blobs — all field values keyed by field_key
  extracted_fields      JSONB DEFAULT '{}',   -- from document extraction
  matched_values        JSONB DEFAULT '{}',   -- proposed values from org facts + AI
  missing_values        JSONB DEFAULT '{}',   -- fields with no source found
  approved_values       JSONB DEFAULT '{}',   -- admin-approved final values
  -- Per-field metadata: source badge, confidence, admin notes
  field_metadata        JSONB DEFAULT '{}',   -- { field_key: { source, confidence, ai_drafted, admin_note } }
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cpr_template
  ON public.contract_prefill_runs (contract_template_id, created_at DESC);

ALTER TABLE public.contract_prefill_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract prefill runs"
    ON public.contract_prefill_runs FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_signature_fields ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_signature_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  prefill_run_id        UUID REFERENCES public.contract_prefill_runs(id) ON DELETE SET NULL,
  signer_name           TEXT,
  signer_title          TEXT,
  signer_email          TEXT,
  signature_type        TEXT NOT NULL DEFAULT 'draw'
    CHECK (signature_type IN ('draw','typed','initials')),
  page_number           INTEGER,
  x                     DECIMAL,
  y                     DECIMAL,
  width                 DECIMAL,
  height                DECIMAL,
  signature_data        TEXT,          -- base64 PNG
  typed_name            TEXT,
  signed_at             TIMESTAMPTZ,
  ip_address            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csf_template
  ON public.contract_signature_fields (contract_template_id);

ALTER TABLE public.contract_signature_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract signature fields"
    ON public.contract_signature_fields FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_exports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_exports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  prefill_run_id        UUID REFERENCES public.contract_prefill_runs(id) ON DELETE SET NULL,
  exported_file_path    TEXT,          -- Supabase Storage path
  export_type           TEXT NOT NULL DEFAULT 'pdf'
    CHECK (export_type IN ('pdf','docx')),
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','generating','ready','failed')),
  file_size             BIGINT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_exports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract exports"
    ON public.contract_exports FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_audit_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,          -- 'upload','extract','prefill','approve_field','edit_field','sign','export'
  entity_type  TEXT NOT NULL,          -- 'contract_template','prefill_run','signature_field','export'
  entity_id    UUID,
  before_json  JSONB,
  after_json   JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_entity
  ON public.contract_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_actor
  ON public.contract_audit_logs (actor_id, created_at DESC);

ALTER TABLE public.contract_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins read contract audit logs"
    ON public.contract_audit_logs FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
  CREATE POLICY "System inserts contract audit logs"
    ON public.contract_audit_logs FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for contract documents (private — no public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Admins can upload contracts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'contracts');
  CREATE POLICY "Admins can read contracts"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'contracts');
  CREATE POLICY "Admins can delete contracts"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'contracts');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
