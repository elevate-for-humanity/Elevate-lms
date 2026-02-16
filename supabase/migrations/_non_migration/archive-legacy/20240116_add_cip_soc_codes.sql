-- Add CIP and SOC code columns to programs table
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS cip_code TEXT,
ADD COLUMN IF NOT EXISTS soc_code TEXT,
ADD COLUMN IF NOT EXISTS funding_eligibility TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN programs.cip_code IS 'Classification of Instructional Programs (CIP) code for workforce alignment';
COMMENT ON COLUMN programs.soc_code IS 'Standard Occupational Classification (SOC) code for workforce alignment';
COMMENT ON COLUMN programs.funding_eligibility IS 'Array of eligible funding types (WIOA, WRG, JRI, Apprenticeship, SEAL, etc.)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_programs_cip_code ON programs(cip_code);
CREATE INDEX IF NOT EXISTS idx_programs_soc_code ON programs(soc_code);
