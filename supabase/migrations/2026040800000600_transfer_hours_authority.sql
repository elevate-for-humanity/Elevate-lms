-- Transfer hour authority columns on applications
--
-- PRICING POLICY (immutable — do not change without updating all Stripe routes):
--   Transfer hours are progress credit only. They reduce program duration, NOT tuition.
--   Tuition is fixed at $4,980 (TUITION_CENTS = 498000) regardless of any transfer hour value.
--   These columns exist for auditability, staff review, scheduling, and dispute evidence ONLY.
--
-- transfer_hours_claimed  — student-reported at intake (unverified)
-- transfer_hours_verified — staff-confirmed after document review (null until verified)
-- transfer_hours_verified_by — auth.users.id of staff who verified
-- transfer_hours_verified_at — timestamp of verification

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS transfer_hours_claimed   integer CHECK (transfer_hours_claimed >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified  integer CHECK (transfer_hours_verified >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_at timestamptz;

COMMENT ON COLUMN public.applications.transfer_hours_claimed
  IS 'Student-submitted transfer hours (unverified). Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified
  IS 'Staff-verified transfer hours (authoritative for ops, not pricing). Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_by
  IS 'Staff user who verified the transfer hours claim.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_at
  IS 'Timestamp when transfer hours were verified by staff.';

-- Index: staff review queue — applications with claimed but unverified hours
CREATE INDEX IF NOT EXISTS idx_applications_transfer_hours_pending
  ON public.applications (transfer_hours_claimed, transfer_hours_verified)
  WHERE transfer_hours_claimed > 0 AND transfer_hours_verified IS NULL;
