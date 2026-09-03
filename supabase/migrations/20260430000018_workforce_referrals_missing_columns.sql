-- workforce_referrals was created with agency_name/agency_type but the API
-- route uses a single `agency` column, plus program_interest and notes.
ALTER TABLE public.workforce_referrals
  ADD COLUMN IF NOT EXISTS agency           text,
  ADD COLUMN IF NOT EXISTS program_interest text,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS referral_agency  text;

-- Also add referral_agency to applications so the route can tag the source
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS referral_agency text;

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency
  ON public.workforce_referrals(agency);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_status
  ON public.workforce_referrals(status);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_applicant_email
  ON public.workforce_referrals(applicant_email);
