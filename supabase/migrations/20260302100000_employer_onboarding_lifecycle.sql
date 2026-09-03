-- Employer onboarding lifecycle enforcement
-- APPLIED TO PRODUCTION: 2026-03-02
--
-- Adds structured status lifecycle and compliance fields to employer_onboarding.
-- Status flow: pending_review → approved → onboarding_in_progress → active → suspended
-- Employers cannot access the portal until status = 'active'.

-- Add missing columns to employer_onboarding
ALTER TABLE employer_onboarding
  ADD COLUMN IF NOT EXISTS hiring_needs jsonb,
  ADD COLUMN IF NOT EXISTS mou_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS mou_signer_name text,
  ADD COLUMN IF NOT EXISTS mou_signer_title text,
  ADD COLUMN IF NOT EXISTS coi_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS coi_expiry_date date,
  ADD COLUMN IF NOT EXISTS workers_comp_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS workers_comp_expiry_date date,
  ADD COLUMN IF NOT EXISTS business_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS ein text,
  ADD COLUMN IF NOT EXISTS worksite_address text,
  ADD COLUMN IF NOT EXISTS supervisor_name text,
  ADD COLUMN IF NOT EXISTS supervisor_title text,
  ADD COLUMN IF NOT EXISTS supervisor_email text,
  ADD COLUMN IF NOT EXISTS supervisor_phone text,
  ADD COLUMN IF NOT EXISTS compliance_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Update status constraint to support full lifecycle
-- First drop existing constraint if any, then add new one
DO $$
BEGIN
  -- Try to drop existing check constraint on status
  ALTER TABLE employer_onboarding DROP CONSTRAINT IF EXISTS employer_onboarding_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE employer_onboarding
  ADD CONSTRAINT employer_onboarding_status_check
  CHECK (status IN (
    'submitted',        -- legacy: treat as pending_review
    'pending_review',   -- application submitted, awaiting admin review
    'approved',         -- approved to begin onboarding
    'onboarding_in_progress', -- actively completing requirements
    'active',           -- fully onboarded, portal unlocked
    'restricted',       -- missing documents or expired insurance
    'suspended',        -- non-compliance or policy issue
    'rejected'          -- application denied
  ));

-- Index for quick lookups by employer and status
CREATE INDEX IF NOT EXISTS idx_employer_onboarding_employer_id
  ON employer_onboarding(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_onboarding_status
  ON employer_onboarding(status);

-- Add employer-specific document types to document_requirements if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_requirements') THEN
    INSERT INTO document_requirements (role, document_type, name, description, required)
    VALUES
      ('employer', 'coi_general_liability', 'General Liability COI', 'Certificate of Insurance — minimum $1M per occurrence / $2M aggregate', true),
      ('employer', 'coi_workers_comp', 'Workers Compensation', 'Workers Compensation insurance proof as required by Indiana Code IC 22-3', true),
      ('employer', 'business_license', 'Business License', 'Current business license or registration', true),
      ('employer', 'ein_verification', 'Tax ID (EIN)', 'IRS EIN verification letter or W-9', true),
      ('employer', 'supervisor_designation', 'Supervisor Designation', 'Designated supervisor/mentor for apprentices and trainees', true),
      ('employer', 'employer_mou', 'Employer Partnership Agreement', 'Signed Memorandum of Understanding', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
