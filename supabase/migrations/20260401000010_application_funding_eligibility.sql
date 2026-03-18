-- Application funding source and eligibility tracking
--
-- Students select a funding source on the application form and answer
-- eligibility screening questions. The system evaluates eligibility and
-- stores the result. WorkOne/WIOA applications are held at
-- 'pending_workone' until the student returns with external confirmation.
--
-- application_status values added:
--   pending_workone  — awaiting WorkOne eligibility confirmation
--   funding_review   — staff reviewing funding source before approval

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS requested_funding_source  text,
  ADD COLUMN IF NOT EXISTS household_size            integer,
  ADD COLUMN IF NOT EXISTS annual_income_usd         integer,
  ADD COLUMN IF NOT EXISTS justice_involved          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_employer_sponsor      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_workone_approval      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS workone_approval_ref      text,   -- letter/auth code from WorkOne
  ADD COLUMN IF NOT EXISTS eligibility_evaluated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS recommended_funding_source text;

-- Widen eligibility_status check to include new values
-- (existing check constraint dropped and recreated)
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_eligibility_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_eligibility_status_check
  CHECK (eligibility_status IN (
    'pending',
    'pending_workone',
    'funding_review',
    'verified',
    'denied'
  ));

-- Widen application status to include funding-hold states
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'submitted',
    'pending_workone',
    'funding_review',
    'under_review',
    'approved',
    'rejected',
    'withdrawn'
  ));

-- Index for admin funding review queue
CREATE INDEX IF NOT EXISTS idx_applications_pending_workone
  ON applications(status)
  WHERE status IN ('pending_workone', 'funding_review');
