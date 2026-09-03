-- CF-2: Add employer counter-signature columns to apprentice_hours.
-- DOL 29 CFR Part 29 requires employer verification of OJT hour logs.
-- The barber_hour_ledger is a denormalized summary — the source-of-truth
-- fix lives here on the per-entry table.

ALTER TABLE public.apprentice_hours
  ADD COLUMN IF NOT EXISTS employer_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employer_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS employer_notes       text;

COMMENT ON COLUMN public.apprentice_hours.employer_id          IS 'User ID of the employer/shop owner who counter-signed this hour entry (DOL 29 CFR Part 29)';
COMMENT ON COLUMN public.apprentice_hours.employer_approved_at IS 'Timestamp when the employer counter-signed this entry';
COMMENT ON COLUMN public.apprentice_hours.employer_notes       IS 'Optional employer notes on this hour entry';

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_employer_id
  ON public.apprentice_hours (employer_id)
  WHERE employer_id IS NOT NULL;
