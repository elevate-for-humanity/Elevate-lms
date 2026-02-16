-- Create tax-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tax-documents',
  'tax-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for tax-documents bucket
CREATE POLICY "Service role can upload tax documents"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'tax-documents');

CREATE POLICY "Service role can read tax documents"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'tax-documents');

CREATE POLICY "Service role can update tax documents"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'tax-documents');

CREATE POLICY "Service role can delete tax documents"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'tax-documents');

-- Create table to track uploads
CREATE TABLE IF NOT EXISTS tax_document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tax_uploads_email ON tax_document_uploads(email);
CREATE INDEX IF NOT EXISTS idx_tax_uploads_created ON tax_document_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE tax_document_uploads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to tax uploads"
ON tax_document_uploads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
