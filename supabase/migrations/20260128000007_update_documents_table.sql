-- Update documents table to support the document management system
-- Adds missing columns for user_id, file_url, status, metadata, verification_notes

-- Add user_id column (nullable for backward compatibility, references the uploading user)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add file_url column for public URL
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_size column (alias for file_size_bytes)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INT;

-- Add status column for verification workflow
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column if not exists (with default)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add metadata column for additional document info
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add verification_notes column for admin notes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add employment_verification to document_type check constraint
-- First drop the old constraint, then add new one
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (document_type IN (
  'photo_id',
  'school_transcript',
  'certificate',
  'out_of_state_license',
  'shop_license',
  'barber_license',
  'ce_certificate',
  'employment_verification',
  'ipla_packet',
  'other'
));

-- Create index on user_id for faster lookups
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Create index on status for verification queue
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Update existing records to set status based on verified column
UPDATE documents SET status = 'verified' WHERE verified = true AND status IS NULL;
UPDATE documents SET status = 'pending' WHERE verified = false AND status IS NULL;

-- Backfill user_id from uploaded_by (both are UUID type)
UPDATE documents 
SET user_id = uploaded_by 
WHERE user_id IS NULL 
  AND uploaded_by IS NOT NULL;

-- Add comment
COMMENT ON COLUMN documents.user_id IS 'User who uploaded the document (references auth.users)';
COMMENT ON COLUMN documents.status IS 'Verification status: pending, verified, rejected';
COMMENT ON COLUMN documents.verification_notes IS 'Admin notes when verifying/rejecting';

-- Add docs_verified columns to enrollments table for tracking verification status
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS docs_verified BOOLEAN DEFAULT false;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS docs_verified_at TIMESTAMPTZ;
