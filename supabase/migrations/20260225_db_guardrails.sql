-- DB guardrails: prevent the class of bugs found in onboarding audit.
--
-- INVARIANTS ESTABLISHED:
--
-- 1. profiles.onboarding_completed is NOT NULL boolean (default false).
--    Login redirect and auto-enrollment check `=== true`. NULL would cause
--    students to loop between login and onboarding indefinitely.
--
-- 2. programs(slug) is unique among active rows (partial unique index).
--    Application submission resolves program by slug. If two active programs
--    share a slug, enrollment targets the wrong one. Inactive duplicates are
--    allowed for historical record-keeping (credential/compliance audits).
--
-- 3. programs.slug must be lowercase alphanumeric with hyphens only.
--    Prevents garbage slugs from admin UI or API that would break URL routing
--    and slug-based lookups.
--
-- 4. training_courses.program_id FK → programs(id) already exists (verified).

BEGIN;

-- 1. Eliminate tri-state onboarding_completed (true | false | NULL → true | false)
UPDATE profiles SET onboarding_completed = false WHERE onboarding_completed IS NULL;
ALTER TABLE profiles ALTER COLUMN onboarding_completed SET DEFAULT false;
ALTER TABLE profiles ALTER COLUMN onboarding_completed SET NOT NULL;

-- 2. One active program per slug
CREATE UNIQUE INDEX IF NOT EXISTS programs_unique_active_slug
  ON programs (slug) WHERE is_active = true;

-- 3. Slug format constraint: lowercase letters, digits, hyphens only
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_slug_format;
ALTER TABLE programs ADD CONSTRAINT programs_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

COMMIT;
