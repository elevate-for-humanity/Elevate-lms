-- Add HVAC license upload fields to program_holders
-- Used by /api/program-holder/upload-license to store uploaded contractor license

ALTER TABLE public.program_holders
  ADD COLUMN IF NOT EXISTS hvac_license_url        TEXT,
  ADD COLUMN IF NOT EXISTS hvac_license_uploaded_at TIMESTAMPTZ;
