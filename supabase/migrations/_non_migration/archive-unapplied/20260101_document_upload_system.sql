-- Document Upload System
-- Unified document management for all user roles

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'id_verification', 'proof_of_income', 'resume', 'certificate', 'license', 'insurance', 'background_check', 'tax_document', 'other'
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  uploaded_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expiration_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can upload own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending documents
CREATE POLICY "Users can update own pending documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update any document (for review)
CREATE POLICY "Admins can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create document_requirements table
CREATE TABLE IF NOT EXISTS document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL, -- 'student', 'program_holder', 'employer', 'instructor'
  document_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  instructions TEXT,
  accepted_formats TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, document_type)
);

-- Enable RLS
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

-- Anyone can view requirements
CREATE POLICY "Anyone can view document requirements"
  ON document_requirements FOR SELECT
  USING (true);

-- Only admins can modify requirements
CREATE POLICY "Admins can modify requirements"
  ON document_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert default requirements
INSERT INTO document_requirements (role, document_type, is_required, description, instructions) VALUES
  ('student', 'id_verification', true, 'Government-issued photo ID', 'Upload a clear photo of your driver''s license, state ID, or passport'),
  ('student', 'proof_of_income', false, 'Income verification document', 'Upload pay stubs, tax returns, or benefit letters'),
  ('student', 'resume', false, 'Current resume', 'Upload your most recent resume'),
  ('program_holder', 'license', true, 'Business license', 'Upload your current business license'),
  ('program_holder', 'insurance', true, 'Liability insurance', 'Upload proof of liability insurance'),
  ('program_holder', 'background_check', true, 'Background check results', 'Upload background check from approved provider'),
  ('employer', 'business_license', true, 'Business license', 'Upload your current business license'),
  ('employer', 'ein_letter', false, 'EIN confirmation letter', 'Upload IRS EIN confirmation letter')
ON CONFLICT (role, document_type) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_requirements_updated_at
  BEFORE UPDATE ON document_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
