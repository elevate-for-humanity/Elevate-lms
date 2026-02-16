-- Program Holder Documents Table
-- Handles all document uploads for program holders

CREATE TABLE IF NOT EXISTS program_holder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, 
  -- Types: syllabus | license | insurance | accreditation | 
  --        instructor_credentials | facility_photos | mou | other
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_program_holder_docs_user ON program_holder_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_program_holder_docs_org ON program_holder_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_holder_docs_type ON program_holder_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_program_holder_docs_approved ON program_holder_documents(approved);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_program_holder_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_program_holder_documents_updated_at
  BEFORE UPDATE ON program_holder_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_program_holder_documents_updated_at();

-- RLS Policies
ALTER TABLE program_holder_documents ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own documents
CREATE POLICY "Program holders can view own documents"
  ON program_holder_documents FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = uploaded_by
  );

-- Program holders can upload documents
CREATE POLICY "Program holders can upload documents"
  ON program_holder_documents FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'program_holder'
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON program_holder_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can approve documents
CREATE POLICY "Admins can approve documents"
  ON program_holder_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comments
COMMENT ON TABLE program_holder_documents IS 'Document uploads for program holders (syllabus, licenses, credentials, etc)';
COMMENT ON COLUMN program_holder_documents.document_type IS 'syllabus | license | insurance | accreditation | instructor_credentials | facility_photos | mou | other';
COMMENT ON COLUMN program_holder_documents.approved IS 'Admin approval status';
