-- Add funding verification fields to enrollments table

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS funding_source TEXT,
ADD COLUMN IF NOT EXISTS funding_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS funding_document_url TEXT,
ADD COLUMN IF NOT EXISTS funding_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS funding_verified_at TIMESTAMPTZ;

-- Add check constraint for funding source
ALTER TABLE enrollments
ADD CONSTRAINT enrollments_funding_source_check
CHECK (funding_source IN ('WIOA', 'Pell Grant', 'Scholarship', 'Self-Pay', 'Employer', 'Other'));

-- Create index for funding verification queries
CREATE INDEX IF NOT EXISTS idx_enrollments_funding_verified ON enrollments(funding_verified);

-- Comment
COMMENT ON COLUMN enrollments.funding_source IS 'Source of funding for the enrollment';
COMMENT ON COLUMN enrollments.funding_verified IS 'Whether funding has been verified by admin';
COMMENT ON COLUMN enrollments.funding_document_url IS 'URL to funding verification document';
