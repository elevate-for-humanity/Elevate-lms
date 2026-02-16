-- Program Holder Verification System
-- Creates tables for identity verification, document uploads, and banking information

-- Add verification_status column to program_holders if not exists
ALTER TABLE program_holders 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

COMMENT ON COLUMN program_holders.verification_status IS 'Verification status: pending, verified, rejected, failed';

-- Create program_holder_documents table
CREATE TABLE IF NOT EXISTS program_holder_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE program_holder_documents IS 'Stores uploaded verification documents';
COMMENT ON COLUMN program_holder_documents.document_type IS 'Type: id, ssn, credentials, syllabus, bank_document';
COMMENT ON COLUMN program_holder_documents.status IS 'Status: pending, approved, rejected';

CREATE INDEX IF NOT EXISTS idx_program_holder_documents_holder_id 
ON program_holder_documents(program_holder_id);

CREATE INDEX IF NOT EXISTS idx_program_holder_documents_status 
ON program_holder_documents(status);

-- Create program_holder_banking table
CREATE TABLE IF NOT EXISTS program_holder_banking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  routing_number TEXT NOT NULL,
  account_number TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE program_holder_banking IS 'Stores banking information for payments';
COMMENT ON COLUMN program_holder_banking.account_type IS 'Type: checking, savings';
COMMENT ON COLUMN program_holder_banking.routing_number IS 'Should be encrypted at application level';
COMMENT ON COLUMN program_holder_banking.account_number IS 'Should be encrypted at application level';

CREATE INDEX IF NOT EXISTS idx_program_holder_banking_holder_id 
ON program_holder_banking(program_holder_id);

-- Create program_holder_verification table
CREATE TABLE IF NOT EXISTS program_holder_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_verification_session_id TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE program_holder_verification IS 'Tracks verification attempts and results';
COMMENT ON COLUMN program_holder_verification.verification_type IS 'Type: manual, stripe_identity';
COMMENT ON COLUMN program_holder_verification.status IS 'Status: pending, verified, failed';

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_holder_id 
ON program_holder_verification(program_holder_id);

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_status 
ON program_holder_verification(status);

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_stripe_session 
ON program_holder_verification(stripe_verification_session_id);

-- RLS Policies for program_holder_documents
ALTER TABLE program_holder_documents ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own documents
CREATE POLICY "program_holders_view_own_documents"
ON program_holder_documents
FOR SELECT
USING (
  auth.uid() = program_holder_id
);

-- Program holders can insert their own documents
CREATE POLICY "program_holders_insert_own_documents"
ON program_holder_documents
FOR INSERT
WITH CHECK (
  auth.uid() = program_holder_id
);

-- Admins can view all documents
CREATE POLICY "admins_view_all_documents"
ON program_holder_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can update documents (for verification)
CREATE POLICY "admins_update_documents"
ON program_holder_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for program_holder_banking
ALTER TABLE program_holder_banking ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own banking info
CREATE POLICY "program_holders_view_own_banking"
ON program_holder_banking
FOR SELECT
USING (
  auth.uid() = program_holder_id
);

-- Program holders can insert their own banking info
CREATE POLICY "program_holders_insert_own_banking"
ON program_holder_banking
FOR INSERT
WITH CHECK (
  auth.uid() = program_holder_id
);

-- Program holders can update their own banking info
CREATE POLICY "program_holders_update_own_banking"
ON program_holder_banking
FOR UPDATE
USING (
  auth.uid() = program_holder_id
);

-- Admins can view all banking info
CREATE POLICY "admins_view_all_banking"
ON program_holder_banking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can update banking info (for verification)
CREATE POLICY "admins_update_banking"
ON program_holder_banking
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for program_holder_verification
ALTER TABLE program_holder_verification ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own verification records
CREATE POLICY "program_holders_view_own_verification"
ON program_holder_verification
FOR SELECT
USING (
  auth.uid() = program_holder_id
);

-- Program holders can insert their own verification records
CREATE POLICY "program_holders_insert_own_verification"
ON program_holder_verification
FOR INSERT
WITH CHECK (
  auth.uid() = program_holder_id
);

-- Admins can view all verification records
CREATE POLICY "admins_view_all_verification"
ON program_holder_verification
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can update verification records
CREATE POLICY "admins_update_verification"
ON program_holder_verification
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can insert verification records (for manual verification)
CREATE POLICY "admins_insert_verification"
ON program_holder_verification
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create storage bucket for program holder documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-holder-documents', 'program-holder-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for program-holder-documents bucket
CREATE POLICY "program_holders_upload_own_documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'program-holder-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "program_holders_view_own_documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'program-holder-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "admins_view_all_documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'program-holder-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "admins_delete_documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'program-holder-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
