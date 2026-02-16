-- Fix program_holder_verification table to match code expectations
-- The TypeScript interface expects: decision, reviewed_at
-- The table has: verification_type, verified_at

-- Add missing columns that code expects
ALTER TABLE program_holder_verification 
ADD COLUMN IF NOT EXISTS decision TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add index for reviewed_at
CREATE INDEX IF NOT EXISTS idx_program_holder_verification_reviewed_at 
ON program_holder_verification(reviewed_at);

-- Update existing data to populate new columns from old ones
UPDATE program_holder_verification
SET 
  decision = CASE 
    WHEN status = 'verified' THEN 'approved'
    WHEN status = 'failed' THEN 'rejected'
    ELSE 'pending'
  END,
  reviewed_at = verified_at
WHERE decision IS NULL;

COMMENT ON COLUMN program_holder_verification.decision IS 'Decision: approved, rejected, pending (maps to status)';
COMMENT ON COLUMN program_holder_verification.reviewed_at IS 'When review was completed (same as verified_at)';

-- Fix program_holder_documents table
-- TypeScript expects: file_url
-- Table has: file_path

ALTER TABLE program_holder_documents
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Populate file_url from file_path for existing records
UPDATE program_holder_documents
SET file_url = file_path
WHERE file_url IS NULL;

COMMENT ON COLUMN program_holder_documents.file_url IS 'Public URL to access the file (same as file_path)';
