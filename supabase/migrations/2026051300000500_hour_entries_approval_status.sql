-- Add approval_status, approval_notes columns and performance indexes to hour_entries.
-- The existing `status` column tracks lifecycle (pending/approved/rejected/locked).
-- `approval_status` is the canonical approval field for the hardened approval API.
-- Both are kept in sync by the approval route.

ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS funding_phase text;

-- Sync approval_status from existing status for already-decided rows
UPDATE public.hour_entries
SET approval_status = status
WHERE status IN ('approved', 'rejected')
  AND approval_status = 'pending';

ALTER TABLE public.hour_entries
  DROP CONSTRAINT IF EXISTS hour_entries_approval_status_check;

ALTER TABLE public.hour_entries
  ADD CONSTRAINT hour_entries_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_hour_entries_user_date_category
  ON public.hour_entries(user_id, work_date, category);

CREATE INDEX IF NOT EXISTS idx_hour_entries_approval_status
  ON public.hour_entries(approval_status);
