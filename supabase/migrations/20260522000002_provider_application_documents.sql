-- Document metadata table for provider applications
-- Stores file URLs and labels so admin dashboard can display uploaded docs

CREATE TABLE IF NOT EXISTS public.provider_application_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES public.provider_applications(id) ON DELETE CASCADE,
  document_type     TEXT NOT NULL,  -- w9, ein_doc, certificate, resume
  label             TEXT,
  file_url          TEXT NOT NULL,
  org_name          TEXT,
  contact_email     TEXT,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ocr_text          TEXT,           -- populated by background OCR job
  ocr_extracted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_app_docs_application_id
  ON public.provider_application_documents(application_id);

-- RLS: only admins can read
ALTER TABLE public.provider_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_provider_docs"
  ON public.provider_application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role (admin client) can insert
CREATE POLICY "service_insert_provider_docs"
  ON public.provider_application_documents
  FOR INSERT
  WITH CHECK (true);
