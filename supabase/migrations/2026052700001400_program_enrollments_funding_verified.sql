-- Add funding_verified column referenced by the enrollment state trigger.
-- The trigger in 20260503000013 references NEW.funding_verified but the column
-- was never added, causing every UPDATE on program_enrollments to crash with
-- "record new has no field funding_verified".

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS funding_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: enrollments in active/onboarding state are considered verified.
UPDATE public.program_enrollments
SET funding_verified = TRUE
WHERE enrollment_state IN ('active', 'onboarding', 'completed')
  AND funding_verified = FALSE;
