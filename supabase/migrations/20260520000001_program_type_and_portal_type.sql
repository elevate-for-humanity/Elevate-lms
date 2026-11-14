-- Migration: program_type on programs + portal_type on profiles
--
-- program_type: the delivery model for a program. Used by the portal router
--   to decide which learner portal to send a student to after login.
--   Values: apprenticeship | classroom | certification | bootcamp
--
-- portal_type: cached on the profile at enrollment time so the login
--   redirect is a single-row lookup instead of a join chain.
--   Values match portal slugs: apprentice | healthcare | technology |
--   business | beauty | trades | social-services | (null = /learner/dashboard)

-- ── programs.program_type ─────────────────────────────────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS program_type TEXT
    CHECK (program_type IN ('apprenticeship', 'classroom', 'certification', 'bootcamp'));

COMMENT ON COLUMN public.programs.program_type IS
  'Delivery model: apprenticeship | classroom | certification | bootcamp. '
  'Drives portal routing — apprenticeship → /portal/apprentice, others → category portal.';

-- ── profiles.portal_type ──────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portal_type TEXT
    CHECK (portal_type IN ('apprentice', 'healthcare', 'technology', 'business', 'beauty', 'trades', 'social-services'));

COMMENT ON COLUMN public.profiles.portal_type IS
  'Cached portal destination set at enrollment. Drives post-login redirect. '
  'Null = fall back to /learner/dashboard.';

-- ── Seed program_type from is_apprenticeship flag ────────────────────────────
-- Apprenticeship programs (is_apprenticeship = true) → 'apprenticeship'
-- Everything else defaults to 'classroom' as the safe baseline.
-- Individual overrides (certification, bootcamp) can be applied after review.

UPDATE public.programs
SET program_type = 'apprenticeship'
WHERE is_apprenticeship = true
  AND program_type IS NULL;

UPDATE public.programs
SET program_type = 'classroom'
WHERE (is_apprenticeship IS NULL OR is_apprenticeship = false)
  AND program_type IS NULL;

-- ── Known certification programs ─────────────────────────────────────────────
UPDATE public.programs
SET program_type = 'certification'
WHERE slug IN (
  'cpr-first-aid',
  'forklift',
  'servsafe-food-handler',
  'servsafe-manager',
  'guest-service-gold',
  'nrf-riseup',
  'drug-alcohol-specimen-collector',
  'sanitation-infection-control',
  'jri-badge-1-mindsets',
  'jri-badge-2-self-management',
  'jri-badge-3-learning-strategies',
  'jri-badge-4-social-skills',
  'jri-badge-5-workplace-skills',
  'jri-badge-6-launch-a-career',
  'jri-introduction'
);

-- ── Bootcamp programs ─────────────────────────────────────────────────────────
UPDATE public.programs
SET program_type = 'bootcamp'
WHERE slug IN (
  'cybersecurity-analyst',
  'software-development',
  'web-development',
  'data-analytics'
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_programs_program_type ON public.programs (program_type);
CREATE INDEX IF NOT EXISTS idx_profiles_portal_type  ON public.profiles  (portal_type);
