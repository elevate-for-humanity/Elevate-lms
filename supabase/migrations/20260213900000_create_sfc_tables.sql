-- Create sfc_tax_returns and sfc_tax_documents tables.
-- Used by: lib/integrations/supersonic-tax.ts (Phase A provider)
-- Referenced by: sfc_tax_return_public_status view (20260213_sfc_public_status_view.sql)
--
-- Run this BEFORE the public status view migration.

-- ============================================================
-- sfc_tax_returns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_returns (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tracking_id           text UNIQUE NOT NULL,
  tracking_id  text UNIQUE,

  -- Source metadata (jotform, manual, system_test, etc.)
  source_system         text,
  source_submission_id  text,

  -- Client info
  taxpayer_name         text,
  client_first_name     text,
  client_last_name      text,
  client_email          text,

  -- Return details
  filing_status         text,
  tax_year              integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  status                text NOT NULL DEFAULT 'draft',

  -- E-file pipeline
  efile_submission_id   text,
  last_error            text,

  -- Full return payload (JSON blob from intake)
  payload               jsonb,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate tracking_id from tracking_id if not set
CREATE OR REPLACE FUNCTION sfc_set_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_id IS NULL THEN
    NEW.tracking_id := NEW.tracking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sfc_set_tracking_id ON public.sfc_tax_returns;
CREATE TRIGGER trg_sfc_set_tracking_id
  BEFORE INSERT ON public.sfc_tax_returns
  FOR EACH ROW
  EXECUTE FUNCTION sfc_set_tracking_id();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_tracking_id
  ON public.sfc_tax_returns (tracking_id);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_tracking_id
  ON public.sfc_tax_returns (tracking_id);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_status
  ON public.sfc_tax_returns (status);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_efile_submission_id
  ON public.sfc_tax_returns (efile_submission_id);

-- RLS
ALTER TABLE public.sfc_tax_returns ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes with service key)
DROP POLICY IF EXISTS "sfc_tax_returns_service_all" ON public.sfc_tax_returns;
CREATE POLICY sfc_tax_returns_service_all ON public.sfc_tax_returns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon can only read via the view (no direct table access)
-- The view (sfc_tax_return_public_status) has its own GRANT SELECT.

-- ============================================================
-- sfc_tax_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_documents (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id           text UNIQUE NOT NULL,
  tax_return_id    text NOT NULL REFERENCES public.sfc_tax_returns(tracking_id),
  document_type         text NOT NULL,
  status                text NOT NULL DEFAULT 'uploaded',
  file_path             text,
  metadata              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfc_tax_documents_tax_return_id
  ON public.sfc_tax_documents (tax_return_id);

-- RLS
ALTER TABLE public.sfc_tax_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sfc_tax_documents_service_all" ON public.sfc_tax_documents;
CREATE POLICY sfc_tax_documents_service_all ON public.sfc_tax_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
