-- Add WIOA-required fields to apprenticeship_intake
-- Required for eligibility auto-determination, WIOA reporting, and Indiana DWD regional reporting.

ALTER TABLE public.apprenticeship_intake
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS county            TEXT,
  ADD COLUMN IF NOT EXISTS household_size    INTEGER,
  ADD COLUMN IF NOT EXISTS annual_income     TEXT,
  ADD COLUMN IF NOT EXISTS snap_recipient    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tanf_recipient    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS barriers          TEXT[]  NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.apprenticeship_intake.date_of_birth  IS 'Required for WIOA age eligibility gate (Adult ≥18, Youth 14-24)';
COMMENT ON COLUMN public.apprenticeship_intake.county         IS 'Indiana county of residence — maps to Local Workforce Development Area for DWD reporting';
COMMENT ON COLUMN public.apprenticeship_intake.household_size IS 'Number of people in household — used for WIOA income threshold calculation';
COMMENT ON COLUMN public.apprenticeship_intake.annual_income  IS 'Annual household income range — used for WIOA income eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.snap_recipient IS 'SNAP receipt = categorical WIOA eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.tanf_recipient IS 'TANF receipt = categorical WIOA eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.barriers       IS 'WIOA barrier categories: homeless, ex-offender, veteran, disability, basic-skills, english-learner, single-parent, foster-youth';
