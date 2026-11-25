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

-- Commit before inserting an acceptance using this enum value.
ALTER TYPE public.agreement_type ADD VALUE IF NOT EXISTS 'instructor_curriculum_ip';

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
  -- New immutable signing evidence for this issuance; the original ledger stays intact.
  signature_receipt JSONB NOT NULL,
  CHECK (jsonb_typeof(signature_receipt) = 'object'
    AND signature_receipt ?& ARRAY['acceptanceId','signedAt','signerName','signerEmail','method','signature','ipAddress','userAgent']),
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
GRANT SELECT ON public.instructor_curriculum_licenses TO authenticated;
GRANT ALL ON public.instructor_curriculum_licenses TO service_role;

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

-- Defense in depth: application routes and direct authenticated reads must
-- agree on teaching capacity. Enrollment/purchase branches remain unchanged.
CREATE OR REPLACE FUNCTION rpc_private.assigned_educator_course_read(p_course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.instructor_assignments a JOIN public.profiles p ON p.id=a.instructor_id
  WHERE a.instructor_id=(SELECT auth.uid()) AND a.course_id=p_course AND a.active
   AND p.role IN ('instructor','program_holder') AND p.is_active IS TRUE
   AND NOT coalesce(p.suspended,false)
   AND (p_course <> 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201'::uuid OR EXISTS (
    SELECT 1 FROM public.instructor_curriculum_licenses lic
    JOIN public.agreement_versions v ON v.agreement_type=lic.agreement_type
      AND coalesce(v.current_version,v.version)=lic.agreement_version AND v.is_current
    JOIN public.license_agreement_acceptances acc ON acc.user_id=lic.user_id
      AND acc.agreement_type::text=lic.agreement_type AND acc.document_version=lic.agreement_version
    WHERE lic.user_id=(SELECT auth.uid()) AND lic.status='active'
      AND lic.agreement_type='instructor_curriculum_ip'
      AND lic.agreement_version='1.0'
      AND lic.agreement_hash='46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889'
      AND v.document_hash=lic.agreement_hash
   ))
 )
$$;
REVOKE ALL ON FUNCTION rpc_private.assigned_educator_course_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.assigned_educator_course_read(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION rpc_private.assigned_educator_lesson_read(p_lesson uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id=l.course_id
  WHERE l.id=p_lesson AND l.is_published AND l.status='published'
    AND c.is_active AND c.status='published'
    AND rpc_private.assigned_educator_course_read(c.id)
 )
$$;
REVOKE ALL ON FUNCTION rpc_private.assigned_educator_lesson_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.assigned_educator_lesson_read(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION rpc_private.preserve_instructor_signature_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.signature_receipt IS DISTINCT FROM OLD.signature_receipt THEN
   RAISE EXCEPTION 'Instructor signature receipts are immutable';
 END IF;
 IF TG_OP='INSERT' AND EXISTS (
   SELECT 1 FROM public.instructor_curriculum_licenses prior
   WHERE prior.user_id=NEW.user_id AND prior.agreement_type=NEW.agreement_type
     AND prior.agreement_version=NEW.agreement_version AND prior.status='revoked'
 ) AND (NEW.signature_receipt->>'renewalLicenseId') IS DISTINCT FROM (
   SELECT prior.id::text FROM public.instructor_curriculum_licenses prior
   WHERE prior.user_id=NEW.user_id AND prior.agreement_type=NEW.agreement_type
     AND prior.agreement_version=NEW.agreement_version AND prior.status='revoked'
   ORDER BY prior.created_at DESC LIMIT 1
 ) THEN
   RAISE EXCEPTION 'Signature must acknowledge the current revoked license';
 END IF;
 IF TG_OP='INSERT' AND EXISTS (
   SELECT 1 FROM public.instructor_curriculum_licenses prior
   WHERE prior.user_id=NEW.user_id AND prior.agreement_type=NEW.agreement_type
     AND prior.agreement_version=NEW.agreement_version AND prior.status='revoked'
     AND (prior.revoked_at IS NULL OR
       (NEW.signature_receipt->>'signedAt')::timestamptz <= prior.revoked_at)
 ) THEN
   RAISE EXCEPTION 'Signature receipt must postdate revocation';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION rpc_private.preserve_instructor_signature_receipt() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS instructor_signature_receipt_immutable ON public.instructor_curriculum_licenses;
CREATE TRIGGER instructor_signature_receipt_immutable
 BEFORE INSERT OR UPDATE ON public.instructor_curriculum_licenses
 FOR EACH ROW EXECUTE FUNCTION rpc_private.preserve_instructor_signature_receipt();

-- SELECT only; grading, attendance and certification remain separate systems.
CREATE OR REPLACE FUNCTION rpc_private.can_review_hvac_simulation(p_learner uuid, p_course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL
   AND p_course='d48c61c4-8880-4d9d-9ab5-fab4dd51b201'::uuid
   AND rpc_private.assigned_educator_course_read(p_course)
   AND EXISTS (
     SELECT 1 FROM public.instructor_assignments a
     WHERE a.instructor_id=(SELECT auth.uid()) AND a.course_id=p_course AND a.active
       AND (a.cohort_id IS NULL OR EXISTS (
         SELECT 1 FROM public.program_enrollments e
         WHERE coalesce(e.user_id,e.student_id)=p_learner
           AND e.cohort_id=a.cohort_id AND e.revoked_at IS NULL
           AND e.status IN ('active','enrolled','in_progress','confirmed','completed')
       ))
   )
$$;
REVOKE ALL ON FUNCTION rpc_private.can_review_hvac_simulation(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.can_review_hvac_simulation(uuid,uuid) TO authenticated,service_role;
DROP POLICY IF EXISTS interaction_progress_hvac_instructor_review ON public.interaction_progress;
CREATE POLICY interaction_progress_hvac_instructor_review ON public.interaction_progress
 FOR SELECT TO authenticated USING (
  interaction_type='simulation' AND interaction_id LIKE 'hvac-sim:%'
  AND rpc_private.can_review_hvac_simulation(learner_id,course_id)
 );
