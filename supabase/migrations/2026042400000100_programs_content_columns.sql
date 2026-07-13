-- Add content columns needed for the public course publishing pipeline.
--
-- Existing columns already cover: tuition, credential_name, requirements,
-- funding_eligible, delivery_mode, category, status, published, is_active,
-- short_description, description, review_status.
--
-- This migration adds the remaining fields identified in the side-by-side audit.
-- All additions use IF NOT EXISTS with safe defaults — no destructive changes.

ALTER TABLE public.programs
  -- Structured learning objectives (array of strings, e.g. ["Identify refrigerant types", ...])
  ADD COLUMN IF NOT EXISTS learning_objectives  JSONB,

  -- Structured outcomes (array of strings, e.g. ["EPA 608 certification", "Job placement support"])
  ADD COLUMN IF NOT EXISTS outcomes             JSONB,

  -- Human-readable credential awarded on completion (e.g. "EPA 608 Universal Certificate")
  -- Distinct from credential_name (which is the DB-normalized name used in catalog queries).
  -- certification_awarded is the display string shown on the public program page.
  ADD COLUMN IF NOT EXISTS certification_awarded TEXT,

  -- Timestamp when the program was first published (set by publish-direct route)
  ADD COLUMN IF NOT EXISTS published_at         TIMESTAMPTZ;

-- Backfill published_at for programs already live
UPDATE public.programs
SET published_at = updated_at
WHERE published = true
  AND published_at IS NULL
  AND updated_at IS NOT NULL;

-- Backfill certification_awarded from credential_name where not set
UPDATE public.programs
SET certification_awarded = credential_name
WHERE certification_awarded IS NULL
  AND credential_name IS NOT NULL
  AND credential_name != '';

-- Index for catalog queries that filter by published_at (e.g. "newest programs")
CREATE INDEX IF NOT EXISTS idx_programs_published_at
  ON public.programs(published_at DESC)
  WHERE published = true;

COMMENT ON COLUMN public.programs.learning_objectives IS
  'JSONB array of strings. What learners will be able to do after completing the program.';
COMMENT ON COLUMN public.programs.outcomes IS
  'JSONB array of strings. Employment and credential outcomes (e.g. job titles, salary range, certifications).';
COMMENT ON COLUMN public.programs.certification_awarded IS
  'Display name of the credential issued on completion. Shown on public program page.';
COMMENT ON COLUMN public.programs.published_at IS
  'Timestamp of first publish. Set by POST /api/admin/programs/[id]/publish-direct.';
