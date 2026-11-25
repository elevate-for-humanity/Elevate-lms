-- Instructor curriculum IP license (Elevate HVAC/R Virtual Training Academy).
--
-- A licensed instructor holds TWO linked records before touching proprietary
-- instructor content:
--   1. A signed acceptance of the current proprietary-curriculum IP agreement
--      in license_agreement_acceptances (agreement_type
--      'instructor_curriculum_ip', versioned, hashed).
--   2. An active row in instructor_curriculum_licenses (status 'active',
--      version-scoped, revocable).
-- The older general 'instructor_services' acceptance does NOT satisfy either
-- record. Revocation and stale versions fail closed: the server must re-check
-- both records on every protected access, and a revoked or outdated license
-- requires a fresh signature.
--
-- The agreement text is canonical in
-- docs/legal/instructor-curriculum-ip-agreement-v1.md (version 1.0, DRAFT
-- pending legal review). Its SHA-256 is pinned below and in
-- lib/legal/instructorCurriculumLicense.ts; a hash change under the same
-- version is a hard migration failure and must be published as a new version.

-- 1. Publish agreement version 1.0.
INSERT INTO public.agreement_versions (
  agreement_type, version, current_version, document_url, document_hash,
  effective_date, requires_re_acceptance
) VALUES (
  'instructor_curriculum_ip', '1.0', '1.0',
  '/legal/instructor-curriculum-ip-agreement',
  '46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889',
  CURRENT_DATE, true
)
ON CONFLICT (agreement_type, version) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.agreement_versions
    WHERE agreement_type = 'instructor_curriculum_ip'
      AND version = '1.0'
      AND document_hash IS DISTINCT FROM
        '46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889'
  ) THEN
    RAISE EXCEPTION
      'instructor_curriculum_ip v1.0 hash changed; publish a new agreement version instead';
  END IF;
END $$;

-- 2. Version-scoped, revocable instructor licenses.
CREATE TABLE IF NOT EXISTS public.instructor_curriculum_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL DEFAULT 'instructor_curriculum_ip',
  agreement_version TEXT NOT NULL,
  agreement_hash TEXT NOT NULL,
  -- Snapshot of the teaching scope at issuance, e.g.
  -- {"course_ids": ["<uuid>"], "program_ids": ["<uuid>"]}.
  -- Live instructor_assignments rows remain the authority for course scope.
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Pseudonymous reference shown on instructor views (never a name or email).
  license_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT instructor_curriculum_licenses_reference_unique
    UNIQUE (license_reference)
);

-- At most one active license per instructor, agreement type and version.
CREATE UNIQUE INDEX IF NOT EXISTS instructor_curriculum_licenses_one_active
  ON public.instructor_curriculum_licenses (user_id, agreement_type, agreement_version)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS instructor_curriculum_licenses_user_idx
  ON public.instructor_curriculum_licenses (user_id);

ALTER TABLE public.instructor_curriculum_licenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY instructor_curriculum_licenses_owner_read
    ON public.instructor_curriculum_licenses FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY instructor_curriculum_licenses_admin_read
    ON public.instructor_curriculum_licenses FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No INSERT / UPDATE / DELETE policy for authenticated users: licenses are
-- issued and revoked server-side only (service role). RLS denies the rest.
