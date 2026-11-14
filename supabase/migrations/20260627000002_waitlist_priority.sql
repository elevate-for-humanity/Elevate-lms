-- Waitlist Priority Queue
-- Adds priority_tag, cohort_id, and rank to the waitlist table.
-- priority_tag drives ordering: wioa > employer > self_pay > unknown

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS priority_tag  text
    CHECK (priority_tag IN ('wioa', 'employer', 'self_pay', 'unknown')),
  ADD COLUMN IF NOT EXISTS cohort_id     uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rank          int;

-- Backfill priority_tag from existing funding_interest values
UPDATE public.waitlist
  SET priority_tag = funding_interest
  WHERE funding_interest IN ('wioa', 'employer', 'self_pay');

UPDATE public.waitlist
  SET priority_tag = 'unknown'
  WHERE priority_tag IS NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_program_priority
  ON public.waitlist(program_slug, priority_tag, created_at);
