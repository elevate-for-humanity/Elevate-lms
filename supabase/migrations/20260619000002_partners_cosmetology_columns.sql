-- Add columns required by the cosmetology salon partner application.
-- The partners table was originally built for barbershops; these columns
-- support salon-specific fields (supervisor credentials, insurance, compensation).

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS program_type TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_license_number TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_years_licensed INTEGER,
  ADD COLUMN IF NOT EXISTS compensation_model TEXT,
  ADD COLUMN IF NOT EXISTS number_of_employees INTEGER,
  ADD COLUMN IF NOT EXISTS workers_comp_status TEXT,
  ADD COLUMN IF NOT EXISTS has_general_liability BOOLEAN,
  ADD COLUMN IF NOT EXISTS can_supervise_and_verify BOOLEAN,
  ADD COLUMN IF NOT EXISTS mou_acknowledged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
