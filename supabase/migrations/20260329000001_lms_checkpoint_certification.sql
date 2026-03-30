-- =============================================================================
-- PENDING MIGRATIONS — LMS / Checkpoint / Certification Workflow
-- Run this entire file in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql
--
-- SAFETY CHECKS run first. If any check fails the transaction aborts
-- before touching any data.
--
-- Migration 006 (phc_credential_not_null) is intentionally excluded.
-- Run it separately AFTER verifying:
--   SELECT COUNT(*) FROM program_holder_courses WHERE credential_id IS NULL;
-- returns 0.
--
-- Order:
--   1. 20260323000001 — curriculum_lesson_plans + competency_exam_profiles
--   2. 20260324000001 — curriculum_lessons summary_text + reflection_prompt
--   3. 20260325000001 — program_holder_courses
--   4. 20260325000002 — program_holder_courses v2 (term dates + sync trigger)
--   5. 20260325000003 — syllabus separation
--   6. 20260325000004 — syllabus path storage
--   7. 20260325000005 — phc credential_id FK
--   8. 20260325000007 — content review status
--   9. 20260325000008 — review rejection constraints
--  10. 20260325000009 — CPR credential seed
--  11. 20260326000001 — certification pipeline
--  12. 20260326000002 — certification pathways
--  13. 20260327000001 — step_type column
--  14. 20260327000002 — PRS module alignment + lms_lessons view rebuild
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- SAFETY CHECKS
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- curriculum_lessons must exist before we can alter it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'curriculum_lessons'
  ) THEN
    RAISE EXCEPTION 'ABORT: curriculum_lessons table does not exist. Check earlier migrations.';
  END IF;

  -- programs must exist (FK dependency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'programs'
  ) THEN
    RAISE EXCEPTION 'ABORT: programs table does not exist. Check earlier migrations.';
  END IF;

  -- training_courses must exist (FK dependency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'training_courses'
  ) THEN
    RAISE EXCEPTION 'ABORT: training_courses table does not exist. Check earlier migrations.';
  END IF;

  RAISE NOTICE 'Safety checks passed.';
END $$;

-- =============================================================================
-- 1. 20260323000001 — curriculum_lesson_plans + competency_exam_profiles
-- =============================================================================

CREATE TABLE IF NOT EXISTS curriculum_lesson_plans (
  id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                 uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lesson_slug                text        NOT NULL,
  lesson_title               text        NOT NULL,
  learning_objective         text        NOT NULL,
  cognitive_level            text        NOT NULL,
    CHECK (cognitive_level IN ('remember','understand','apply','analyze','evaluate','create')),
  primary_competency_key     text        NOT NULL,
  supporting_competency_keys text[]      NOT NULL DEFAULT '{}',
  key_concepts               text[]      NOT NULL DEFAULT '{}',
  required_distinctions      text[]      NOT NULL DEFAULT '{}',
  avoided_misconceptions     text[]      NOT NULL DEFAULT '{}',
  exam_domain                text,
  exam_subdomain             text,
  estimated_minutes          int         NOT NULL DEFAULT 15,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_program_id
  ON curriculum_lesson_plans (program_id);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_primary_competency
  ON curriculum_lesson_plans (primary_competency_key);

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS competency_keys text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lesson_plan_id  uuid   REFERENCES curriculum_lesson_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_competency_keys
  ON curriculum_lessons USING GIN (competency_keys);

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_lesson_plan_id
  ON curriculum_lessons (lesson_plan_id)
  WHERE lesson_plan_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS competency_exam_profiles (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_key         text        NOT NULL UNIQUE,
  competency_name        text        NOT NULL,
  program_slug           text        NOT NULL,
  must_assess            boolean     NOT NULL DEFAULT true,
  exam_domain            text        NOT NULL,
  exam_subdomain         text,
  required_phrases       text[]      NOT NULL,
  CONSTRAINT chk_required_phrases_min CHECK (array_length(required_phrases, 1) >= 2),
  requires_distinction   boolean     NOT NULL DEFAULT false,
  distinction_side_a     text[]      NOT NULL DEFAULT '{}',
  distinction_side_b     text[]      NOT NULL DEFAULT '{}',
  distinction_label      text,
  distractor_phrases     text[]      NOT NULL DEFAULT '{}',
  distractor_explanation text        NOT NULL DEFAULT '',
  cognitive_operation    text        NOT NULL,
  response_depth         text        NOT NULL,
    CHECK (response_depth IN ('surface','conceptual','applied','analytical')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_profiles_program_slug
  ON competency_exam_profiles (program_slug);

CREATE INDEX IF NOT EXISTS idx_exam_profiles_must_assess
  ON competency_exam_profiles (program_slug, must_assess)
  WHERE must_assess = true;

ALTER TABLE curriculum_lesson_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_exam_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='curriculum_lesson_plans' AND policyname='authenticated read lesson plans') THEN
    CREATE POLICY "authenticated read lesson plans" ON curriculum_lesson_plans FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competency_exam_profiles' AND policyname='authenticated read exam profiles') THEN
    CREATE POLICY "authenticated read exam profiles" ON competency_exam_profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_plans_updated_at  ON curriculum_lesson_plans;
DROP TRIGGER IF EXISTS trg_exam_profiles_updated_at ON competency_exam_profiles;

CREATE TRIGGER trg_lesson_plans_updated_at
  BEFORE UPDATE ON curriculum_lesson_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_exam_profiles_updated_at
  BEFORE UPDATE ON competency_exam_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

RAISE NOTICE 'Migration 1/14 complete: curriculum_lesson_plans + competency_exam_profiles';

-- =============================================================================
-- 2. 20260324000001 — curriculum_lessons summary_text + reflection_prompt
-- =============================================================================

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS summary_text       text,
  ADD COLUMN IF NOT EXISTS reflection_prompt  text;

RAISE NOTICE 'Migration 2/14 complete: summary_text + reflection_prompt';

-- =============================================================================
-- 3. 20260325000001 — program_holder_courses
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_holder_courses (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id         uuid        NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  program_id        uuid        REFERENCES programs(id) ON DELETE SET NULL,
  syllabus_path     text,
  syllabus_bucket   text,
  status            text        NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending','active','inactive','suspended')),
  assigned_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_holder_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_phc_program_holder_id ON program_holder_courses (program_holder_id);
CREATE INDEX IF NOT EXISTS idx_phc_course_id         ON program_holder_courses (course_id);
CREATE INDEX IF NOT EXISTS idx_phc_program_id        ON program_holder_courses (program_id);

ALTER TABLE program_holder_courses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_holder_courses' AND policyname='program holder reads own courses') THEN
    CREATE POLICY "program holder reads own courses" ON program_holder_courses
      FOR SELECT TO authenticated
      USING (program_holder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_holder_courses' AND policyname='admin manages program holder courses') THEN
    CREATE POLICY "admin manages program holder courses" ON program_holder_courses
      FOR ALL TO authenticated
      USING (get_my_role() IN ('admin','super_admin','staff'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_phc_updated_at ON program_holder_courses;
CREATE TRIGGER trg_phc_updated_at
  BEFORE UPDATE ON program_holder_courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

RAISE NOTICE 'Migration 3/14 complete: program_holder_courses';

-- =============================================================================
-- 4. 20260325000002 — program_holder_courses v2 (term dates + sync trigger)
-- =============================================================================

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS term_start_date date,
  ADD COLUMN IF NOT EXISTS term_end_date   date,
  ADD COLUMN IF NOT EXISTS cohort_label    text;

CREATE OR REPLACE FUNCTION sync_phc_program_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_id IS NULL THEN
    SELECT program_id INTO NEW.program_id
    FROM training_courses WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_phc_sync_program_id ON program_holder_courses;
CREATE TRIGGER trg_phc_sync_program_id
  BEFORE INSERT OR UPDATE ON program_holder_courses
  FOR EACH ROW EXECUTE FUNCTION sync_phc_program_id();

RAISE NOTICE 'Migration 4/14 complete: program_holder_courses v2';

-- =============================================================================
-- 5. 20260325000003 — syllabus separation
-- =============================================================================

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS default_syllabus_path   text,
  ADD COLUMN IF NOT EXISTS default_syllabus_bucket text;

RAISE NOTICE 'Migration 5/14 complete: syllabus separation';

-- =============================================================================
-- 6. 20260325000004 — syllabus path storage
-- =============================================================================

CREATE OR REPLACE FUNCTION get_syllabus_url(p_bucket text, p_path text)
RETURNS text LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF p_bucket IS NULL OR p_path IS NULL THEN RETURN NULL; END IF;
  RETURN 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/sign/' || p_bucket || '/' || p_path;
END;
$$;

RAISE NOTICE 'Migration 6/14 complete: syllabus path storage';

-- =============================================================================
-- 7. 20260325000005 — phc credential_id FK
-- =============================================================================

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS credential_id uuid REFERENCES credentials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_phc_credential_id
  ON program_holder_courses (credential_id)
  WHERE credential_id IS NOT NULL;

RAISE NOTICE 'Migration 7/14 complete: phc credential_id FK';

-- =============================================================================
-- 8. 20260325000007 — content review status
-- =============================================================================

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft';
ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft';

RAISE NOTICE 'Migration 8/14 complete: content review status';

-- =============================================================================
-- 9. 20260325000008 — review rejection constraints
-- =============================================================================

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS review_rejected_reason text,
  ADD COLUMN IF NOT EXISTS review_rejected_at     timestamptz,
  ADD COLUMN IF NOT EXISTS review_approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS review_rejected_reason text,
  ADD COLUMN IF NOT EXISTS review_rejected_at     timestamptz,
  ADD COLUMN IF NOT EXISTS review_approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL;

RAISE NOTICE 'Migration 9/14 complete: review rejection constraints';

-- =============================================================================
-- 10. 20260325000009 — CPR credential seed
-- =============================================================================

INSERT INTO credentials (
  id, name, issuer, credential_type, field, description, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'CPR/First Aid/AED',
  'CareerSafe',
  'certification',
  'Healthcare / Safety',
  'CareerSafe CPR, First Aid, and AED certification. Hybrid delivery — online coursework completed on CareerSafe platform, hands-on skills verified by instructor.',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

RAISE NOTICE 'Migration 10/14 complete: CPR credential seed';

-- =============================================================================
-- 11. 20260326000001 — certification pipeline
-- =============================================================================

CREATE TABLE IF NOT EXISTS exam_authorizations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id       uuid        NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  program_id          uuid        REFERENCES programs(id) ON DELETE SET NULL,
  enrollment_id       uuid        REFERENCES program_enrollments(id) ON DELETE SET NULL,
  status              text        NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending','fee_charged','authorized','scheduled','passed','failed','expired','revoked')),
  authorized_at       timestamptz,
  expires_at          timestamptz,
  exam_date           date,
  exam_site           text,
  attempt_number      int         NOT NULL DEFAULT 1,
  fee_amount_cents    int,
  fee_charged_at      timestamptz,
  stripe_payment_id   text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_auth_user_id       ON exam_authorizations (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_auth_credential_id ON exam_authorizations (credential_id);
CREATE INDEX IF NOT EXISTS idx_exam_auth_status        ON exam_authorizations (status);

CREATE TABLE IF NOT EXISTS exam_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id    uuid        NOT NULL REFERENCES exam_authorizations(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id       uuid        NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  passed              boolean     NOT NULL,
  score               numeric(5,2),
  passing_score       numeric(5,2),
  exam_date           date        NOT NULL,
  certificate_number  text,
  issued_at           timestamptz,
  expires_at          timestamptz,
  recorded_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_results_user_id       ON exam_results (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_credential_id ON exam_results (credential_id);

CREATE TABLE IF NOT EXISTS exam_fee_charges (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id    uuid        NOT NULL REFERENCES exam_authorizations(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents        int         NOT NULL,
  currency            text        NOT NULL DEFAULT 'usd',
  stripe_payment_id   text,
  stripe_invoice_id   text,
  status              text        NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending','charged','refunded','waived','failed')),
  charged_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exam_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_fee_charges    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exam_authorizations' AND policyname='learner reads own exam authorizations') THEN
    CREATE POLICY "learner reads own exam authorizations" ON exam_authorizations
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exam_authorizations' AND policyname='admin manages exam authorizations') THEN
    CREATE POLICY "admin manages exam authorizations" ON exam_authorizations
      FOR ALL TO authenticated USING (get_my_role() IN ('admin','super_admin','staff'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exam_results' AND policyname='learner reads own exam results') THEN
    CREATE POLICY "learner reads own exam results" ON exam_results
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exam_results' AND policyname='admin manages exam results') THEN
    CREATE POLICY "admin manages exam results" ON exam_results
      FOR ALL TO authenticated USING (get_my_role() IN ('admin','super_admin','staff'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_exam_auth_updated_at    ON exam_authorizations;
DROP TRIGGER IF EXISTS trg_exam_results_updated_at ON exam_results;

CREATE TRIGGER trg_exam_auth_updated_at
  BEFORE UPDATE ON exam_authorizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_exam_results_updated_at
  BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

RAISE NOTICE 'Migration 11/14 complete: certification pipeline';

-- =============================================================================
-- 12. 20260326000002 — certification pathways
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_certification_pathways (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  credential_id           uuid        NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  certification_body      text        NOT NULL,
  pathway_name            text        NOT NULL,
  is_primary              boolean     NOT NULL DEFAULT false,
  exam_fee_cents          int,
  exam_site_type          text        CHECK (exam_site_type IN ('on_site','testing_center','online','hybrid')),
  eligibility_notes       text,
  state_specific          text,
  active                  boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id, credential_id, certification_body)
);

CREATE INDEX IF NOT EXISTS idx_pcp_program_id    ON program_certification_pathways (program_id);
CREATE INDEX IF NOT EXISTS idx_pcp_credential_id ON program_certification_pathways (credential_id);

ALTER TABLE exam_authorizations
  ADD COLUMN IF NOT EXISTS pathway_id uuid REFERENCES program_certification_pathways(id) ON DELETE SET NULL;

ALTER TABLE program_certification_pathways ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_certification_pathways' AND policyname='authenticated read pathways') THEN
    CREATE POLICY "authenticated read pathways" ON program_certification_pathways
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_pcp_updated_at ON program_certification_pathways;
CREATE TRIGGER trg_pcp_updated_at
  BEFORE UPDATE ON program_certification_pathways
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

RAISE NOTICE 'Migration 12/14 complete: certification pathways';

-- =============================================================================
-- 13. 20260327000001 — step_type column on curriculum_lessons
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_step_type') THEN
    CREATE TYPE lesson_step_type AS ENUM (
      'lesson',
      'quiz',
      'assignment',
      'checkpoint',
      'reflection',
      'lab',
      'video',
      'reading'
    );
  END IF;
END $$;

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS step_type lesson_step_type NOT NULL DEFAULT 'lesson';

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_step_type
  ON curriculum_lessons (step_type);

RAISE NOTICE 'Migration 13/14 complete: step_type';

-- =============================================================================
-- 14. 20260327000002 — PRS module alignment + lms_lessons view rebuild
-- =============================================================================

UPDATE public.curriculum_lessons cl
SET module_id = m.id
FROM public.modules m
WHERE m.program_id = cl.program_id
  AND m.slug = 'peer-mod-' || cl.module_order::text
  AND cl.program_id = (SELECT id FROM public.programs WHERE slug = 'peer-recovery-specialist-jri');

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
  SELECT
    cl.id, cl.course_id,
    (cl.module_order * 1000 + cl.lesson_order) AS lesson_number,
    cl.lesson_title AS title,
    cl.script_text  AS content,
    cl.video_file   AS video_url,
    cl.duration_minutes,
    NULL::text[]    AS topics,
    NULL::jsonb     AS quiz_questions,
    cl.created_at,
    cl.updated_at,
    cl.course_id    AS course_id_uuid,
    (cl.module_order * 1000 + cl.lesson_order) AS order_index,
    true            AS is_required,
    (cl.status = 'published') AS is_published,
    cl.step_type::text AS content_type,
    NULL::uuid      AS quiz_id,
    NULL::integer   AS passing_score,
    NULL::text      AS description,
    NULL::uuid      AS tenant_id,
    NULL::text      AS html,
    cl.lesson_slug  AS idx,
    (cl.module_order * 1000 + cl.lesson_order)::text AS order_number,
    cl.module_id,
    cl.program_id,
    'curriculum'::text AS lesson_source,
    cl.credential_domain_id,
    cl.step_type::text AS step_type,
    m.title         AS module_title,
    cl.module_order,
    cl.lesson_order
  FROM curriculum_lessons cl
  LEFT JOIN modules m ON m.id = cl.module_id
  WHERE cl.course_id IS NOT NULL
    AND cl.lesson_slug NOT LIKE '%-smoke-%'

UNION ALL

  SELECT
    tl.id, tl.course_id, tl.lesson_number, tl.title, tl.content, tl.video_url,
    tl.duration_minutes, tl.topics, tl.quiz_questions, tl.created_at, tl.updated_at,
    tl.course_id_uuid, tl.order_index, tl.is_required, tl.is_published, tl.content_type,
    tl.quiz_id, tl.passing_score, tl.description, tl.tenant_id, tl.html,
    tl.idx, tl.order_number, tl.module_id, tl.program_id,
    'training'::text AS lesson_source,
    NULL::uuid       AS credential_domain_id,
    'lesson'::text   AS step_type,
    NULL::text       AS module_title,
    NULL::integer    AS module_order,
    NULL::integer    AS lesson_order
  FROM training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl2
    WHERE cl2.course_id = tl.course_id
      AND cl2.status = 'published'
      AND cl2.lesson_slug NOT LIKE '%-smoke-%'
  );

GRANT SELECT ON public.lms_lessons TO authenticated, service_role, anon;

RAISE NOTICE 'Migration 14/14 complete: PRS module alignment + lms_lessons view';

-- =============================================================================
-- DONE
-- =============================================================================

RAISE NOTICE 'All 14 migrations applied successfully.';

COMMIT;

-- =============================================================================
-- POST-RUN: migration 006 (phc_credential_not_null) — run separately
-- First verify: SELECT COUNT(*) FROM program_holder_courses WHERE credential_id IS NULL;
-- If result is 0, run:
--
-- ALTER TABLE program_holder_courses ALTER COLUMN credential_id SET NOT NULL;
-- =============================================================================
