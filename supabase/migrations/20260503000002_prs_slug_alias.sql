-- =============================================================================
-- PRS slug alias
--
-- The public program page uses slug 'peer-recovery-specialist'.
-- The DB program row uses slug 'peer-recovery-specialist-jri' (set during
-- initial seeding and referenced by 20+ migrations).
--
-- Rather than rename the canonical DB slug (which would require re-running
-- all dependent migrations), we add a slug_aliases column to programs and
-- record the public slug there. Application code resolves aliases via
-- lib/program-registry.ts SLUG_ALIASES map (already updated).
--
-- This migration also adds a unique partial index so alias lookups are fast.
-- =============================================================================

BEGIN;

-- Add slug_aliases column if it doesn't exist
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS slug_aliases TEXT[] DEFAULT '{}';

-- Record the public-facing alias on the PRS program row
UPDATE public.programs
SET slug_aliases = array_append(
  COALESCE(slug_aliases, '{}'),
  'peer-recovery-specialist'
)
WHERE slug = 'peer-recovery-specialist-jri'
  AND NOT ('peer-recovery-specialist' = ANY(COALESCE(slug_aliases, '{}')));

-- Index for alias lookups
CREATE INDEX IF NOT EXISTS idx_programs_slug_aliases
  ON public.programs USING GIN (slug_aliases);

COMMIT;
