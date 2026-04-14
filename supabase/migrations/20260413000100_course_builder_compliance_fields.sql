-- Course builder compliance fields
-- Adds regulatory metadata columns to course_lessons and course_modules,
-- and a compliance_profiles reference table.

-- ─── compliance_profiles ─────────────────────────────────────────────────────
-- Stores the canonical compliance profile definitions used by the builder audit.
-- Rows are seeded below; the builder reads them via GET /api/admin/course-builder/profiles.

CREATE TABLE IF NOT EXISTS public.compliance_profiles (
  key                              text PRIMARY KEY,
  label                            text NOT NULL,
  credential_target                text NOT NULL,
  minimum_program_hours            numeric NOT NULL DEFAULT 0,
  requires_final_exam              boolean NOT NULL DEFAULT false,
  require_passing_scores           boolean NOT NULL DEFAULT false,
  require_instructor_signoff       boolean NOT NULL DEFAULT false,
  require_evidence_for_practicals  boolean NOT NULL DEFAULT false,
  require_domain_mapping           boolean NOT NULL DEFAULT false,
  require_competency_mapping       boolean NOT NULL DEFAULT false,
  require_hour_category            boolean NOT NULL DEFAULT false,
  require_delivery_method          boolean NOT NULL DEFAULT false,
  require_fieldwork_tracking       boolean NOT NULL DEFAULT false,
  require_instructor_requirements  boolean NOT NULL DEFAULT false,
  require_certificate_verification boolean NOT NULL DEFAULT false,
  domain_requirements              jsonb,
  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.compliance_profiles (key, label, credential_target, minimum_program_hours, requires_final_exam, require_passing_scores, require_instructor_signoff, require_evidence_for_practicals, require_domain_mapping, require_competency_mapping, require_hour_category, require_delivery_method, require_fieldwork_tracking, require_instructor_requirements, require_certificate_verification)
VALUES
  ('internal_basic',     'Internal Basic',          'INTERNAL',          0,   false, false, false, false, false, false, false, false, false, false, false),
  ('state_board_strict', 'State Board Strict',       'STATE_BOARD',       1500, true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('dol_apprenticeship', 'DOL Apprenticeship',       'DOL_APPRENTICESHIP',2000, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true),
  ('icrc_peer_recovery', 'IC&RC Peer Recovery',      'IC&RC',             46,   true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('naadac_peer_support','NAADAC Peer Support',      'NAADAC',            30,   true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('custom_regulated',   'Custom Regulated',         'CUSTOM',            0,   false, true,  true,  true,  true,  true,  true,  true,  false, true,  false)
ON CONFLICT (key) DO NOTHING;

-- ─── course_lessons compliance columns ───────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS domain_key                  text,
  ADD COLUMN IF NOT EXISTS hour_category               text
    CHECK (hour_category IN ('didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam')),
  ADD COLUMN IF NOT EXISTS evidence_type               text
    CHECK (evidence_type IN ('quiz','upload','video','audio','checklist','observation','attestation','exam','reflection')),
  ADD COLUMN IF NOT EXISTS delivery_method             text
    CHECK (delivery_method IN ('online_async','online_live','in_person','hybrid','field_based')),
  ADD COLUMN IF NOT EXISTS requires_instructor_signoff boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instructor_requirement      jsonb,
  ADD COLUMN IF NOT EXISTS minimum_seat_time_minutes   integer,
  ADD COLUMN IF NOT EXISTS fieldwork_eligible          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_artifacts          jsonb,
  ADD COLUMN IF NOT EXISTS compliance_profile_key      text REFERENCES public.compliance_profiles(key);

-- ─── course_modules compliance columns ───────────────────────────────────────

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS domain_key    text,
  ADD COLUMN IF NOT EXISTS target_hours  numeric;

-- ─── courses regulatory columns ──────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS compliance_profile_key      text REFERENCES public.compliance_profiles(key),
  ADD COLUMN IF NOT EXISTS governing_body              text,
  ADD COLUMN IF NOT EXISTS governing_region            text,
  ADD COLUMN IF NOT EXISTS governing_standard_version  text,
  ADD COLUMN IF NOT EXISTS retention_policy_days       integer,
  ADD COLUMN IF NOT EXISTS audit_notes                 text;

-- ─── indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_course_lessons_domain_key
  ON public.course_lessons (domain_key)
  WHERE domain_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_hour_category
  ON public.course_lessons (hour_category)
  WHERE hour_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_compliance_profile
  ON public.course_lessons (compliance_profile_key)
  WHERE compliance_profile_key IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;

-- Public read — profiles are reference data
CREATE POLICY "compliance_profiles_public_read"
  ON public.compliance_profiles FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "compliance_profiles_admin_write"
  ON public.compliance_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );
