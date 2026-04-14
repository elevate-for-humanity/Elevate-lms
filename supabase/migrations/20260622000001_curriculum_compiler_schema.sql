-- Migration: curriculum compiler schema
--
-- Adds the tables and columns required by the full curriculum compiler spec.
-- Apply in Supabase Dashboard → SQL Editor.
--
-- Tables added:
--   assessment_questions  — first-class question storage (replaces jsonb blobs)
--   rubrics               — lab/assignment grading rubrics
--   field_hours_logs      — documented field/OJT time for DOL compliance
--   competency_results    — explicit per-learner competency achievement records
--
-- Columns added to course_lessons:
--   unlock_rule           — jsonb gate rule for progression engine
--   required_artifacts    — text[] artifact types learner must submit
--   rubric_id             — FK to rubrics table
--   script_text           — video/audio generation source
--   duration_minutes      — instructional time (never null after compiler runs)
--   generation_status     — lifecycle: draft → structure_seeded → ... → published
--
-- Columns added to program_completion_certificates:
--   hours_completed       — numeric hours at time of issue
--   competencies_achieved — jsonb array of achieved competency keys
--   instructor_verified   — boolean flag
--   verification_summary  — jsonb evidence payload

-- ─── assessment_questions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  question_type   text        NOT NULL CHECK (question_type IN ('multiple_choice','true_false','short_answer','scenario')),
  prompt          text        NOT NULL,
  choices         jsonb,
  correct_answer  jsonb,
  explanation     text,
  competency_key  text,
  difficulty      text        CHECK (difficulty IN ('easy','medium','hard')),
  domain_key      text,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_lesson
  ON public.assessment_questions (lesson_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_competency
  ON public.assessment_questions (competency_key)
  WHERE competency_key IS NOT NULL;

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructors_read_questions" ON public.assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

CREATE POLICY "admins_manage_questions" ON public.assessment_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

COMMENT ON TABLE public.assessment_questions IS
  'First-class question storage. Replaces quiz_questions jsonb blobs on course_lessons for programs using the compiler pipeline.';

-- ─── rubrics ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rubrics (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  program_slug      text,
  criteria          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  passing_threshold integer     CHECK (passing_threshold BETWEEN 0 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructors_read_rubrics" ON public.rubrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

CREATE POLICY "admins_manage_rubrics" ON public.rubrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

COMMENT ON TABLE public.rubrics IS
  'Grading rubrics for lab and assignment lessons. criteria is a jsonb array of { criterion, description, maxPoints }.';

-- ─── field_hours_logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.field_hours_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id        uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id        uuid        REFERENCES public.course_modules(id) ON DELETE SET NULL,
  activity_date    date        NOT NULL,
  minutes          integer     NOT NULL CHECK (minutes > 0),
  description      text,
  supervisor_name  text,
  supervisor_email text,
  verified         boolean     NOT NULL DEFAULT false,
  verified_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_hours_logs_user_course
  ON public.field_hours_logs (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_field_hours_logs_unverified
  ON public.field_hours_logs (course_id, verified)
  WHERE verified = false;

ALTER TABLE public.field_hours_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_manage_own_hours" ON public.field_hours_logs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "instructors_read_hours" ON public.field_hours_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

CREATE POLICY "instructors_verify_hours" ON public.field_hours_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

COMMENT ON TABLE public.field_hours_logs IS
  'Documented OJT/field hours for DOL apprenticeship compliance. Each row is one work session. Supervisor verification required for DOL reporting.';

-- ─── competency_results ───────────────────────────────────────────────────────
-- Named competency_results (spec) — distinct from competency_audit_log (immutable audit trail).
-- competency_audit_log = every action taken. competency_results = current achievement state.

CREATE TABLE IF NOT EXISTS public.competency_results (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id             uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  competency_key        text        NOT NULL,
  status                text        NOT NULL DEFAULT 'not_started'
                                    CHECK (status IN ('not_started','in_progress','achieved','failed')),
  achieved_at           timestamptz,
  achieved_via          text        CHECK (achieved_via IN ('quiz','lab','exam','observation','assignment')),
  verified_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  lesson_id             uuid        REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  evidence_submission_id uuid       REFERENCES public.step_submissions(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, competency_key)
);

CREATE INDEX IF NOT EXISTS idx_competency_results_user_course
  ON public.competency_results (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_competency_results_key
  ON public.competency_results (competency_key, status);

ALTER TABLE public.competency_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_read_own_results" ON public.competency_results
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "instructors_read_results" ON public.competency_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

CREATE POLICY "instructors_manage_results" ON public.competency_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

COMMENT ON TABLE public.competency_results IS
  'Current competency achievement state per learner. One row per (user, course, competency_key). Updated when a competency is achieved via quiz, lab, exam, or instructor observation.';

-- ─── course_lessons additions ─────────────────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS unlock_rule        jsonb,
  ADD COLUMN IF NOT EXISTS required_artifacts text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rubric_id          uuid        REFERENCES public.rubrics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS script_text        text,
  ADD COLUMN IF NOT EXISTS duration_minutes   integer,
  ADD COLUMN IF NOT EXISTS generation_status  text        NOT NULL DEFAULT 'draft'
                                              CHECK (generation_status IN (
                                                'draft','structure_seeded','content_hydrated',
                                                'assessment_ready','verification_ready',
                                                'certificate_ready','published'
                                              ));

CREATE INDEX IF NOT EXISTS idx_course_lessons_generation_status
  ON public.course_lessons (generation_status)
  WHERE generation_status != 'published';

COMMENT ON COLUMN public.course_lessons.unlock_rule IS
  'JSONB gate rule consumed by lib/lms/progression-gate.ts. Shape: { type: "pass_assessment"|"approved_submission"|"complete_previous_module"|"achieve_competency", ... }';

COMMENT ON COLUMN public.course_lessons.required_artifacts IS
  'Artifact types the learner must submit: text, video, audio, checklist, document.';

COMMENT ON COLUMN public.course_lessons.rubric_id IS
  'FK to rubrics table. Required for lab and assignment lessons that use structured grading.';

COMMENT ON COLUMN public.course_lessons.script_text IS
  'Source text for video/audio generation. Written by the hydrator, consumed by the video pipeline.';

COMMENT ON COLUMN public.course_lessons.duration_minutes IS
  'Instructional time in minutes. The hours engine sets this; the compiler hard-fails if null after generation.';

COMMENT ON COLUMN public.course_lessons.generation_status IS
  'Lifecycle status: draft → structure_seeded → content_hydrated → assessment_ready → verification_ready → certificate_ready → published. The publish route requires published status.';

-- ─── program_completion_certificates additions ────────────────────────────────

ALTER TABLE public.program_completion_certificates
  ADD COLUMN IF NOT EXISTS hours_completed       numeric,
  ADD COLUMN IF NOT EXISTS competencies_achieved jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructor_verified   boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_summary  jsonb    DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.program_completion_certificates.hours_completed IS
  'Total instructional hours at time of certificate issue. Sourced from field_hours_logs + lesson duration_minutes.';

COMMENT ON COLUMN public.program_completion_certificates.competencies_achieved IS
  'JSONB array of { key, label, achievedAt, achievedVia } for all competencies achieved during the program.';

COMMENT ON COLUMN public.program_completion_certificates.instructor_verified IS
  'True when at least one instructor has verified a practical competency for this learner.';

COMMENT ON COLUMN public.program_completion_certificates.verification_summary IS
  'Full CertificateEvidence payload: hoursCompleted, competenciesAchieved, criticalCompetenciesAchieved, finalExamScore, completionDate.';
