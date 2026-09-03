-- Add EIN, shop address (adrenaline column), employer acceptance agreement,
-- and digital signature/date fields to barbershop_partner_applications.

ALTER TABLE barbershop_partner_applications
  -- EIN (Employer Identification Number)
  ADD COLUMN IF NOT EXISTS ein TEXT,
  ADD COLUMN IF NOT EXISTS ein_document_path TEXT,
  ADD COLUMN IF NOT EXISTS ein_qa_notes TEXT,

  -- Shop address (separate from mailing/contact address — "adrenaline of the shop")
  ADD COLUMN IF NOT EXISTS shop_physical_address TEXT,

  -- Employer Acceptance Agreement
  ADD COLUMN IF NOT EXISTS employer_acceptance_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signer_name TEXT,

  -- MOU digital signature + date (upgrade from checkbox-only)
  ADD COLUMN IF NOT EXISTS mou_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mou_signer_name TEXT,

  -- General consent/application signature + date
  ADD COLUMN IF NOT EXISTS consent_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS consent_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_signer_name TEXT;

-- Index for admin filtering on employer acceptance status
CREATE INDEX IF NOT EXISTS idx_bpa_employer_acceptance
  ON barbershop_partner_applications (employer_acceptance_acknowledged)
  WHERE employer_acceptance_acknowledged = TRUE;

COMMENT ON COLUMN barbershop_partner_applications.ein IS
  'Employer Identification Number (EIN) — required for DOL RAPIDS worksite registration';
COMMENT ON COLUMN barbershop_partner_applications.ein_document_path IS
  'Storage path to uploaded EIN paperwork (IRS CP-575 or 147C letter — full copy required)';
COMMENT ON COLUMN barbershop_partner_applications.ein_qa_notes IS
  'Admin QA notes on EIN verification (e.g., confirmed match, discrepancy notes)';
COMMENT ON COLUMN barbershop_partner_applications.shop_physical_address IS
  'Physical street address of the barbershop worksite (may differ from mailing address)';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_acknowledged IS
  'Employer has read and accepted the Employer Acceptance Agreement';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_signature_data IS
  'Base64 PNG of drawn signature on Employer Acceptance Agreement';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_signed_at IS
  'Timestamp when employer acceptance agreement was signed';
COMMENT ON COLUMN barbershop_partner_applications.mou_signature_data IS
  'Base64 PNG of drawn signature on MOU (replaces checkbox-only acknowledgment)';
COMMENT ON COLUMN barbershop_partner_applications.mou_signed_at IS
  'Timestamp when MOU was signed';
COMMENT ON COLUMN barbershop_partner_applications.consent_signature_data IS
  'Base64 PNG of drawn signature on general consent/application';
COMMENT ON COLUMN barbershop_partner_applications.consent_signed_at IS
  'Timestamp when consent was signed';
