-- Restore the verification timestamp declared in the original canonical
-- enrollment_requirements migration. The October 24 live-schema mutation audit
-- confirms that this nullable column is missing in production, while the
-- learner document upload route clears it when evidence is resubmitted.
-- Additive and idempotent: no data backfill, RLS or policy changes.
ALTER TABLE public.enrollment_requirements
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.enrollment_requirements.verified_at IS
  'Time when enrollment requirement evidence was verified; cleared when learner submits replacement evidence for review.';
