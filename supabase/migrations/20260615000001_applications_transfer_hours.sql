-- Transfer hour structured columns on applications
--
-- Replaces the previous pattern of burying transfer hours in support_notes free text.
--
-- transfer_hours_claimed  — student-reported at intake (unverified, always present for new rows)
-- transfer_hours_verified — staff-confirmed after document review (null until verified)
-- transfer_hours_verified_by — auth.users.id of the staff member who verified
-- transfer_hours_verified_at — timestamp of verification
--
-- PRICING POLICY (do not change without updating all checkout routes):
--   Transfer hours are progress credit only. They reduce program duration, NOT tuition.
--   Tuition is fixed at $4,980 regardless of transfer_hours_claimed or transfer_hours_verified.
--   These columns exist for auditability, staff review, scheduling, and dispute evidence only.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS transfer_hours_claimed   integer DEFAULT 0 CHECK (transfer_hours_claimed >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified  integer DEFAULT NULL CHECK (transfer_hours_verified >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_by uuid DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_at timestamptz DEFAULT NULL;

-- Backfill: parse "Transfer Hours (claimed): N" from support_notes for existing rows.
-- Only updates rows where the pattern is unambiguous and transfer_hours_claimed is still 0.
-- Rows without this pattern are left untouched (legacy rows remain as-is).
UPDATE public.applications
SET transfer_hours_claimed = (
  substring(support_notes FROM 'Transfer Hours \(claimed\): (\d+)')
)::integer
WHERE support_notes ~ 'Transfer Hours \(claimed\): \d+'
  AND (transfer_hours_claimed IS NULL OR transfer_hours_claimed = 0);

-- Index: staff review queue — find applications with claimed but unverified hours
CREATE INDEX IF NOT EXISTS idx_applications_transfer_hours_pending
  ON public.applications (transfer_hours_claimed, transfer_hours_verified)
  WHERE transfer_hours_claimed > 0 AND transfer_hours_verified IS NULL;

COMMENT ON COLUMN public.applications.transfer_hours_claimed
  IS 'Hours reported by student at intake — unverified. Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified
  IS 'Hours confirmed by staff after document review. Authoritative for scheduling only. Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_by
  IS 'Staff user who verified the transfer hours claim.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_at
  IS 'Timestamp when transfer hours were verified by staff.';
