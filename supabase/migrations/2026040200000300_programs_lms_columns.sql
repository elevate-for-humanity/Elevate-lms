-- Add LMS-facing columns to programs table.
-- These normalize the existing scattered columns into a consistent shape
-- used by lib/lms/api.ts and the public /lms/programs catalog.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Backfill short_description from excerpt (preferred) or first 200 chars of description
UPDATE public.programs
SET short_description = COALESCE(
  NULLIF(TRIM(excerpt), ''),
  LEFT(description, 200)
)
WHERE short_description IS NULL
  AND (excerpt IS NOT NULL OR description IS NOT NULL);

-- is_published: normalize from the existing published/status/is_active columns
-- A program is published if published=true AND status != 'archived' AND is_active=true
-- We don't add a new column — we use a generated expression so it stays in sync.
-- The API query will use: .eq('published', true).neq('status', 'archived').eq('is_active', true)
-- No new column needed.

-- display_order: default to NULL (API falls back to title sort)
-- Admins can set this manually per program.
