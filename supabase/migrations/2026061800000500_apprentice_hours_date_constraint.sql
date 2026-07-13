-- Enforce one-entry-per-day-per-discipline integrity at the DB level.
--
-- The application layer enforces a 10h/day cap by summing existing rows,
-- but without a DB constraint a race condition (two concurrent submissions)
-- could still produce two rows that together exceed the cap.
--
-- This partial unique index prevents duplicate (user_id, discipline, date)
-- combinations in the pending/approved states. Rejected entries are excluded
-- so a student can re-submit after a rejection without hitting the constraint.

CREATE UNIQUE INDEX IF NOT EXISTS idx_apprentice_hours_one_active_per_day
  ON public.apprentice_hours (user_id, discipline, date)
  WHERE status IN ('pending', 'approved');

-- Ensure the date column stores only the date part (no time component).
-- Existing rows with timestamps are normalized to their date.
UPDATE public.apprentice_hours
SET date = date::date
WHERE date IS NOT NULL;

-- Add a check constraint: date cannot be in the future.
-- Uses CURRENT_DATE (UTC on Supabase/Postgres) as the boundary.
ALTER TABLE public.apprentice_hours
  DROP CONSTRAINT IF EXISTS chk_apprentice_hours_no_future_date;

ALTER TABLE public.apprentice_hours
  ADD CONSTRAINT chk_apprentice_hours_no_future_date
  CHECK (date <= CURRENT_DATE);

-- Add a check constraint: hours must be positive and ≤ 10.
ALTER TABLE public.apprentice_hours
  DROP CONSTRAINT IF EXISTS chk_apprentice_hours_range;

ALTER TABLE public.apprentice_hours
  ADD CONSTRAINT chk_apprentice_hours_range
  CHECK (hours > 0 AND hours <= 10);
