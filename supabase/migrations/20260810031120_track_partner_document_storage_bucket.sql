ALTER TABLE public.partner_documents
ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'partner-documents';
