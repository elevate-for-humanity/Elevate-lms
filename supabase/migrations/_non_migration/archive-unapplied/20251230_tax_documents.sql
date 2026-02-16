-- Tax Documents Table for SupersonicFastCash
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public uploads)
CREATE POLICY "Anyone can upload documents"
  ON tax_documents
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view
CREATE POLICY "Authenticated users can view documents"
  ON tax_documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can update
CREATE POLICY "Admins can update documents"
  ON tax_documents
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Storage policies
CREATE POLICY "Anyone can upload to documents bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_tax_documents_email ON tax_documents(email);
CREATE INDEX idx_tax_documents_status ON tax_documents(status);
CREATE INDEX idx_tax_documents_created_at ON tax_documents(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_tax_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_documents_updated_at
  BEFORE UPDATE ON tax_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_documents_updated_at();
