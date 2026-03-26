-- External Submissions OS — Phase 1: Asset Vault
-- Brand assets, document styles (letterhead), and the attachment library.

-- ─────────────────────────────────────────────────────────────────────────────
-- brand_assets
-- Logos, letterhead images, signature images, etc.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_brand_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  asset_type       TEXT NOT NULL CHECK (asset_type IN (
                     'logo','logo_dark','logo_light','letterhead_image',
                     'signature_image','favicon','banner','other'
                   )),
  file_url         TEXT NOT NULL,
  file_path        TEXT,               -- Supabase Storage path
  label            TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_brand_assets_org
  ON public.sos_brand_assets (organization_id, asset_type, active);

ALTER TABLE public.sos_brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_brand_assets_admin" ON public.sos_brand_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- document_styles
-- Letterhead / branded layout definitions.
-- Each generated document references one style.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_styles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  style_name       TEXT NOT NULL,
  logo_asset_id    UUID REFERENCES public.sos_brand_assets(id),
  header_html      TEXT,               -- HTML injected at top of every page
  footer_html      TEXT,               -- HTML injected at bottom of every page
  font_family      TEXT DEFAULT 'Inter, sans-serif',
  primary_color    TEXT DEFAULT '#1e3a5f',
  secondary_color  TEXT DEFAULT '#4a90d9',
  margin_top       INTEGER DEFAULT 72, -- points
  margin_right     INTEGER DEFAULT 72,
  margin_bottom    INTEGER DEFAULT 72,
  margin_left      INTEGER DEFAULT 72,
  signatory_name   TEXT,
  signatory_title  TEXT,
  is_default       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one default style per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_doc_styles_default
  ON public.sos_document_styles (organization_id)
  WHERE is_default = TRUE;

ALTER TABLE public.sos_document_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_doc_styles_admin" ON public.sos_document_styles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- attachment_library
-- Pre-approved files ready to attach to any submission packet.
-- Examples: W-9, insurance cert, audit, board list, staff resumes,
--           UEI letter, SAM proof, capability statement.
--
-- Rule: only status='approved' attachments may be included in packets.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_attachment_library (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'w9','insurance_certificate','general_liability_cert',
                     'workers_comp_cert','audit_report','board_list',
                     'staff_resume','uei_letter','sam_proof',
                     'capability_statement','past_performance_summary',
                     'financial_statement','tax_return','nonprofit_determination',
                     'articles_of_incorporation','bylaws','mou','employer_agreement',
                     'license','certification','other'
                   )),
  title            TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_path        TEXT,
  effective_date   DATE,
  expiration_date  DATE,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_attachments_org_type
  ON public.sos_attachment_library (organization_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_attachments_expiry
  ON public.sos_attachment_library (expiration_date)
  WHERE expiration_date IS NOT NULL;

ALTER TABLE public.sos_attachment_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_attachments_admin" ON public.sos_attachment_library FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_attachment_library IS
  'Pre-approved files for inclusion in submission packets. Only status=approved rows may be attached. Expiration_date triggers a review task when within 30 days.';
