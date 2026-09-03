-- Add Elevate support fee fields to program_external_courses
--
-- elevate_fee_cents  — what Elevate charges the learner for guided support
--                      (NOT the cost of the external course itself)
-- fee_label          — human-readable label shown at checkout
--                      e.g. "Elevate Guided Support Fee"
-- support_included   — JSONB array of support services included in the fee
--                      e.g. ["Weekly coaching", "Resume support", ...]
-- payer_rule default — existing column; default 'always_student' for support fees
--                      (learner pays Elevate for support; Elevate does not pay
--                       the external provider on the learner's behalf)

ALTER TABLE public.program_external_courses
  ADD COLUMN IF NOT EXISTS elevate_fee_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_label          text    NOT NULL DEFAULT 'Elevate Program Support Fee',
  ADD COLUMN IF NOT EXISTS support_included   jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- Index for admin fee reporting
CREATE INDEX IF NOT EXISTS idx_pec_fee
  ON public.program_external_courses(elevate_fee_cents)
  WHERE elevate_fee_cents > 0;

COMMENT ON COLUMN public.program_external_courses.elevate_fee_cents IS
  'Fee Elevate charges for guided support services (coaching, tracking, job readiness). NOT the external course cost.';

COMMENT ON COLUMN public.program_external_courses.fee_label IS
  'Label shown to learner at checkout, e.g. "Elevate Guided Support Fee".';

COMMENT ON COLUMN public.program_external_courses.support_included IS
  'JSON array of support services included, e.g. ["Weekly coaching","Resume support"].';
