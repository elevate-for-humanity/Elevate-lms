-- =============================================================================
-- Checkpoint gating, step submissions, and certificate auto-issuance support
--
-- 1. passing_score column on curriculum_lessons (default 70 for checkpoints)
-- 2. checkpoint_scores — records a learner's score on a checkpoint/quiz/exam step
-- 3. step_submissions — lab/assignment submissions with instructor sign-off
-- 4. Rebuild lms_lessons view to expose passing_score
-- 5. program_completion_certificates — canonical completion + cert record
--
-- Apply manually via Supabase Dashboard SQL Editor.
-- =============================================================================

BEGIN;

-- ─── 1. passing_score on curriculum_lessons ───────────────────────────────────

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS passing_score integer NOT NULL DEFAULT 70
  CHECK (passing_score BETWEEN 1 AND 100);

-- ─── 2. checkpoint_scores ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checkpoint_scores (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       uuid        NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  course_id       uuid        NOT NULL,
  module_order    integer     NOT NULL,
  score           integer     NOT NULL CHECK (score BETWEEN 0 AND 100),
  passing_score   integer     NOT NULL DEFAULT 70,
  passed          boolean     NOT NULL GENERATED ALWAYS AS (score >= passing_score) STORED,
  attempt_number  integer     NOT NULL DEFAULT 1,
  answers         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
  UNIQUE (user_id, lesson_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_scores_user_course
  ON public.checkpoint_scores (user_id, course_id, module_order);

CREATE INDEX IF NOT EXISTS idx_checkpoint_scores_user_lesson
  ON public.checkpoint_scores (user_id, lesson_id);

ALTER TABLE public.checkpoint_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_checkpoint_scores"
  ON public.checkpoint_scores FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "service_role_checkpoint_scores"
  ON public.checkpoint_scores FOR ALL
  TO service_role USING (true);

GRANT SELECT, INSERT ON public.checkpoint_scores TO authenticated;
GRANT ALL ON public.checkpoint_scores TO service_role;

-- ─── 3. step_submissions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.step_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       uuid        NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  course_id       uuid        NOT NULL,
  step_type       public.step_type_enum NOT NULL,
  submission_text text,
  file_urls       text[]      DEFAULT '{}',
  status          text        NOT NULL DEFAULT 'submitted',
                  CHECK (status IN ('submitted','under_review','approved','rejected','revision_requested')),
  instructor_id   uuid        REFERENCES auth.users(id),
  instructor_note text,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_step_submissions_user_course
  ON public.step_submissions (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_step_submissions_instructor_pending
  ON public.step_submissions (instructor_id, status)
  WHERE status IN ('submitted','under_review');

ALTER TABLE public.step_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_step_submissions"
  ON public.step_submissions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "service_role_step_submissions"
  ON public.step_submissions FOR ALL
  TO service_role USING (true);

GRANT SELECT, INSERT, UPDATE ON public.step_submissions TO authenticated;
GRANT ALL ON public.step_submissions TO service_role;

-- ─── 4. program_completion_certificates ───────────────────────────────────────
-- Canonical record written when a learner completes all required steps and
-- all checkpoints are passed. Used by /verify/[certificateId] page.

CREATE TABLE IF NOT EXISTS public.program_completion_certificates (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid        NOT NULL REFERENCES public.programs(id),
  course_id           uuid,
  enrollment_id       uuid,
  certificate_number  text        NOT NULL UNIQUE,
  issued_at           timestamptz NOT NULL DEFAULT now(),
  course_version      text,
  completion_date     date        NOT NULL DEFAULT CURRENT_DATE,
  pdf_url             text,
  verification_url    text,
  checkpoints_passed  integer     NOT NULL DEFAULT 0,
  total_checkpoints   integer     NOT NULL DEFAULT 0,
  seat_time_seconds   integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcc_user_program
  ON public.program_completion_certificates (user_id, program_id);

CREATE INDEX IF NOT EXISTS idx_pcc_certificate_number
  ON public.program_completion_certificates (certificate_number);

ALTER TABLE public.program_completion_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_completion_certs"
  ON public.program_completion_certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "public_verify_completion_certs"
  ON public.program_completion_certificates FOR SELECT
  TO anon USING (true);

CREATE POLICY "service_role_completion_certs"
  ON public.program_completion_certificates FOR ALL
  TO service_role USING (true);

GRANT SELECT ON public.program_completion_certificates TO authenticated, anon;
GRANT ALL ON public.program_completion_certificates TO service_role;

-- ─── 5. Rebuild lms_lessons view to expose passing_score ──────────────────────

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS

  -- Curriculum-seeded lessons (new source of truth)
  SELECT
    cl.id,
    cl.course_id,
    (cl.module_order * 1000 + cl.lesson_order)   AS lesson_number,
    cl.lesson_title                               AS title,
    cl.script_text                                AS content,
    cl.video_file                                 AS video_url,
    cl.duration_minutes,
    NULL::text[]                                  AS topics,
    NULL::jsonb                                   AS quiz_questions,
    cl.created_at,
    cl.updated_at,
    cl.course_id                                  AS course_id_uuid,
    (cl.module_order * 1000 + cl.lesson_order)   AS order_index,
    true                                          AS is_required,
    (cl.status = 'published')                     AS is_published,
    cl.step_type::text                            AS content_type,
    NULL::uuid                                    AS quiz_id,
    cl.passing_score                              AS passing_score,
    NULL::text                                    AS description,
    NULL::uuid                                    AS tenant_id,
    NULL::text                                    AS html,
    cl.lesson_slug                                AS idx,
    (cl.module_order * 1000 + cl.lesson_order)::text AS order_number,
    cl.module_id,
    cl.program_id,
    'curriculum'::text                            AS lesson_source,
    cl.credential_domain_id,
    cl.step_type::text                            AS step_type,
    m.title                                       AS module_title,
    cl.module_order,
    cl.lesson_order
  FROM public.curriculum_lessons cl
  LEFT JOIN public.modules m ON m.id = cl.module_id
  WHERE cl.course_id IS NOT NULL
    AND cl.lesson_slug NOT LIKE '%-smoke-%'
    AND cl.status = 'published'

  UNION ALL

  -- Legacy training_lessons (HVAC and other pre-curriculum courses)
  SELECT
    tl.id,
    tl.course_id,
    tl.lesson_number,
    tl.title,
    tl.content,
    tl.video_url,
    tl.duration_minutes,
    tl.topics,
    tl.quiz_questions,
    tl.created_at,
    tl.updated_at,
    tl.course_id                                  AS course_id_uuid,
    tl.lesson_number                              AS order_index,
    tl.is_required,
    tl.is_published,
    tl.content_type,
    tl.quiz_id,
    tl.passing_score,
    tl.description,
    tl.tenant_id,
    tl.html,
    tl.idx,
    tl.order_number,
    NULL::uuid                                    AS module_id,
    NULL::uuid                                    AS program_id,
    'training'::text                              AS lesson_source,
    NULL::uuid                                    AS credential_domain_id,
    tl.content_type                               AS step_type,
    NULL::text                                    AS module_title,
    NULL::integer                                 AS module_order,
    tl.lesson_number                              AS lesson_order
  FROM public.training_lessons tl
  WHERE tl.is_published = true
    AND NOT EXISTS (
      SELECT 1 FROM public.curriculum_lessons cl2
      WHERE cl2.course_id = tl.course_id
        AND cl2.status = 'published'
    );

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

COMMIT;
