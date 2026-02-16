-- Add funding verification fields to enrollments
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_verified_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_verified_by UUID REFERENCES auth.users(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_documentation_url TEXT;

-- Add check constraint to prevent enrollment without funding verification
ALTER TABLE enrollments ADD CONSTRAINT funding_verified_check 
  CHECK (status != 'active' OR funding_verified = TRUE);

COMMENT ON COLUMN enrollments.funding_source IS 'WIOA, WRG, JRI, employer, self-pay';
COMMENT ON COLUMN enrollments.funding_verified IS 'Must be true before enrollment can be activated';
