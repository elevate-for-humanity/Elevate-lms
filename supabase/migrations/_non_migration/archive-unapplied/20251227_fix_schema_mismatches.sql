-- Fix schema mismatches between database and TypeScript code
-- Based on actual database schema analysis

-- ============================================
-- FIX 1: program_holder_documents
-- ============================================
-- TypeScript expects: uploaded_at
-- Database has: created_at
-- Solution: Add uploaded_at as alias/copy of created_at

ALTER TABLE program_holder_documents
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- Populate uploaded_at from created_at for existing records
UPDATE program_holder_documents
SET uploaded_at = created_at
WHERE uploaded_at IS NULL;

-- Set default for new records
ALTER TABLE program_holder_documents
ALTER COLUMN uploaded_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_program_holder_documents_uploaded_at
ON program_holder_documents(uploaded_at);

COMMENT ON COLUMN program_holder_documents.uploaded_at IS 'When document was uploaded (mirrors created_at for code compatibility)';

-- ============================================
-- FIX 2: program_holder_verification
-- ============================================
-- TypeScript expects: decision, reviewed_at, reviewed_by
-- Database has: status, verified_at, verified_by
-- Solution: Add missing columns

ALTER TABLE program_holder_verification
ADD COLUMN IF NOT EXISTS decision TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Populate new columns from existing data
UPDATE program_holder_verification
SET 
  decision = CASE 
    WHEN status = 'verified' THEN 'approved'
    WHEN status = 'failed' THEN 'rejected'
    WHEN status = 'pending' THEN 'pending'
    ELSE status
  END,
  reviewed_at = verified_at,
  reviewed_by = verified_by
WHERE decision IS NULL;

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_decision
ON program_holder_verification(decision);

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_reviewed_at
ON program_holder_verification(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_program_holder_verification_reviewed_by
ON program_holder_verification(reviewed_by);

COMMENT ON COLUMN program_holder_verification.decision IS 'Review decision: approved, rejected, pending (mirrors status for code compatibility)';
COMMENT ON COLUMN program_holder_verification.reviewed_at IS 'When review was completed (mirrors verified_at for code compatibility)';
COMMENT ON COLUMN program_holder_verification.reviewed_by IS 'Admin who reviewed (mirrors verified_by for code compatibility)';

-- ============================================
-- TRIGGER: Keep mirrored columns in sync
-- ============================================

-- Trigger for program_holder_documents
CREATE OR REPLACE FUNCTION sync_program_holder_documents_uploaded_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.uploaded_at = NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_program_holder_documents_uploaded_at ON program_holder_documents;
CREATE TRIGGER trigger_sync_program_holder_documents_uploaded_at
  BEFORE INSERT OR UPDATE ON program_holder_documents
  FOR EACH ROW
  EXECUTE FUNCTION sync_program_holder_documents_uploaded_at();

-- Trigger for program_holder_verification
CREATE OR REPLACE FUNCTION sync_program_holder_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync decision with status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.decision = CASE 
      WHEN NEW.status = 'verified' THEN 'approved'
      WHEN NEW.status = 'failed' THEN 'rejected'
      WHEN NEW.status = 'pending' THEN 'pending'
      ELSE NEW.status
    END;
  END IF;
  
  -- Sync reviewed_at with verified_at
  IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    NEW.reviewed_at = NEW.verified_at;
  END IF;
  
  -- Sync reviewed_by with verified_by
  IF NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    NEW.reviewed_by = NEW.verified_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_program_holder_verification_fields ON program_holder_verification;
CREATE TRIGGER trigger_sync_program_holder_verification_fields
  BEFORE INSERT OR UPDATE ON program_holder_verification
  FOR EACH ROW
  EXECUTE FUNCTION sync_program_holder_verification_fields();
