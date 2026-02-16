-- Tax Documents System
-- Secure document upload and management for tax filing

-- Tax Documents Table
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  virus_scan_status TEXT CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')) DEFAULT 'pending',
  encrypted BOOLEAN DEFAULT true,
  document_category TEXT CHECK (document_category IN (
    'w2',
    '1099',
    'id_verification',
    'social_security_card',
    'bank_statement',
    'other'
  )),
  tax_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_documents_user ON tax_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_documents_scan_status ON tax_documents(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_tax_documents_category ON tax_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_tax_documents_tax_year ON tax_documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_documents_upload_date ON tax_documents(upload_date);

-- RLS
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own tax documents"
  ON tax_documents FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own documents
CREATE POLICY "Users can insert own tax documents"
  ON tax_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own documents
CREATE POLICY "Users can delete own tax documents"
  ON tax_documents FOR DELETE
  USING (user_id = auth.uid());

-- Admin and tax preparers can view all documents
CREATE POLICY "Admin can view all tax documents"
  ON tax_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

-- Admin can manage all documents
CREATE POLICY "Admin can manage tax documents"
  ON tax_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE tax_documents IS 'Secure tax document storage with virus scanning';
