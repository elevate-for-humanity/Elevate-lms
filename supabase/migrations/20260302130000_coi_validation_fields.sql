-- Add COI (Certificate of Insurance) validation fields to barbershop_partner_applications.
-- Stores the automated scan result, reason codes, and review metadata.

ALTER TABLE barbershop_partner_applications
  ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'pending'
    CHECK (insurance_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS insurance_validation_json JSONB,
  ADD COLUMN IF NOT EXISTS insurance_reason_codes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS insurance_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS insurance_review_method TEXT
    CHECK (insurance_review_method IN ('PDF_TEXT', 'OCR', 'NONE', 'MANUAL')),
  ADD COLUMN IF NOT EXISTS insurance_coi_file_path TEXT,
  ADD COLUMN IF NOT EXISTS worker_relationship TEXT DEFAULT 'not_sure'
    CHECK (worker_relationship IN ('w2_employees', '1099_contractors_only', 'owner_only', 'not_sure'));

-- Index for filtering by insurance status in admin views
CREATE INDEX IF NOT EXISTS idx_bpa_insurance_status
  ON barbershop_partner_applications (insurance_status)
  WHERE insurance_status IS NOT NULL;

COMMENT ON COLUMN barbershop_partner_applications.insurance_status IS
  'COI validation gate: pending → approved/rejected by automated scan or manual review';
COMMENT ON COLUMN barbershop_partner_applications.insurance_validation_json IS
  'Full JSON output from scanApproveStrict() for audit trail';
COMMENT ON COLUMN barbershop_partner_applications.insurance_reason_codes IS
  'Machine-stable reason codes (MISSING:...) for UI display and reporting';
COMMENT ON COLUMN barbershop_partner_applications.insurance_review_method IS
  'How text was extracted: PDF_TEXT, OCR, NONE (unreadable), or MANUAL (human override)';
COMMENT ON COLUMN barbershop_partner_applications.worker_relationship IS
  'Drives conditional WC gate: w2_employees requires verified WC, 1099/owner_only requires attestation';
