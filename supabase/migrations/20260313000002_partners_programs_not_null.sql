-- Enforce partners.programs as NOT NULL with empty-array default.
--
-- Currently nullable on all rows, which causes every enrollment filter using
-- .contains('programs', ['X']) to return zero results against NULL values.
--
-- Steps:
--   1. Backfill any remaining NULLs to [] before applying constraint
--      (the separate backfill script sets real values; this is a safety net)
--   2. Set column default to '[]'::jsonb
--   3. Add NOT NULL constraint
--
-- Safe to re-run: all statements are idempotent.

-- Step 1: Backfill any NULLs that weren't covered by the backfill script
UPDATE public.partners
SET programs = '[]'::jsonb
WHERE programs IS NULL;

-- Step 2: Set default so future inserts without programs get [] not NULL
ALTER TABLE public.partners
  ALTER COLUMN programs SET DEFAULT '[]'::jsonb;

-- Step 3: Enforce NOT NULL
ALTER TABLE public.partners
  ALTER COLUMN programs SET NOT NULL;

-- Index for JSONB containment queries (@> operator used by /api/partners filter)
CREATE INDEX IF NOT EXISTS idx_partners_programs_gin
  ON public.partners USING GIN (programs);
