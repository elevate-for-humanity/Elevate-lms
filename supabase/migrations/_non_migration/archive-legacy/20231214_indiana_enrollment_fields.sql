-- Indiana Apprenticeship Enrollment Fields
-- Adds required tracking for RAPIDS, WIOA, and Indiana DWD compliance

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS state_code TEXT DEFAULT 'IN',
ADD COLUMN IF NOT EXISTS apprenticeship BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rapids_registered BOOLEAN DEFAULT true;

-- Index for state-based queries
CREATE INDEX IF NOT EXISTS idx_enrollments_state_code ON enrollments(state_code);

-- Comment for audit trail
COMMENT ON COLUMN enrollments.state_code IS 'State jurisdiction for compliance (locked to IN for Indiana)';
COMMENT ON COLUMN enrollments.apprenticeship IS 'DOL Registered Apprenticeship program flag';
COMMENT ON COLUMN enrollments.rapids_registered IS 'RAPIDS system registration status';
