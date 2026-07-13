-- Baseline schema for tables referenced in code but missing from migrations.
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS).
-- Apply in Supabase Dashboard → SQL Editor.

-- ── Tax stack ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tax_firms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  ein         TEXT,
  phone       TEXT,
  address     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tax_return_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id      UUID NOT NULL,
  actor_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type     TEXT NOT NULL,
  from_status    TEXT,
  to_status      TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tax_return_events_return_id ON public.tax_return_events(return_id);

CREATE TABLE IF NOT EXISTS public.transmission_statuses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id       UUID NOT NULL,
  transmission_id TEXT NOT NULL UNIQUE,
  ack_status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (ack_status IN ('pending', 'accepted', 'rejected')),
  ack_code        TEXT,
  ack_message     TEXT,
  raw_response    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transmission_statuses_return_id ON public.transmission_statuses(return_id);

-- ── Apprenticeship intake ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.apprenticeship_intake (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            TEXT NOT NULL,
  email                TEXT NOT NULL,
  phone                TEXT,
  city                 TEXT,
  state                TEXT DEFAULT 'IN',
  county               TEXT,
  date_of_birth        DATE,
  program_interest     TEXT DEFAULT 'not-specified',
  employment_status    TEXT,
  funding_needed       BOOLEAN DEFAULT true,
  household_size       INTEGER,
  annual_income        TEXT,
  snap_recipient       BOOLEAN DEFAULT false,
  tanf_recipient       BOOLEAN DEFAULT false,
  barriers             JSONB,
  workforce_connection TEXT,
  referral_source      TEXT,
  probation_or_reentry BOOLEAN DEFAULT false,
  preferred_location   TEXT,
  notes                TEXT,
  funding_tag          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apprenticeship_intake_email ON public.apprenticeship_intake(email);

-- ── Barber program ────────────────────────────────────────────────────────────

-- Computed completion gate view — materialized as a table for RLS simplicity.
-- Populated/updated by the barber hour ledger trigger.
CREATE TABLE IF NOT EXISTS public.barber_completion_status (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id          UUID NOT NULL,
  is_complete         BOOLEAN NOT NULL DEFAULT false,
  total_hours         NUMERIC(7,2) NOT NULL DEFAULT 0,
  gate_total_hours    BOOLEAN NOT NULL DEFAULT false,
  gate_module_hours   BOOLEAN NOT NULL DEFAULT false,
  gate_practicals     BOOLEAN NOT NULL DEFAULT false,
  gate_signoffs       BOOLEAN NOT NULL DEFAULT false,
  gate_final_signoff  BOOLEAN NOT NULL DEFAULT false,
  gate_checkpoints    BOOLEAN NOT NULL DEFAULT false,
  gate_final_exam     BOOLEAN NOT NULL DEFAULT false,
  practicals_met      INTEGER NOT NULL DEFAULT 0,
  modules_signed_off  INTEGER NOT NULL DEFAULT 0,
  checkpoints_passed  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id)
);

-- ── Page builder ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.page_sections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL,
  component  TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  props      JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON public.page_sections(page_id);

-- ── Course builder / versioning ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID,
  program_id  UUID NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  snapshot    JSONB NOT NULL DEFAULT '{}',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, version)
);
CREATE INDEX IF NOT EXISTS idx_program_versions_program_id ON public.program_versions(program_id);

-- ── Course publish auditor ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_objectives (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  text      TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON public.course_objectives(course_id);

CREATE TABLE IF NOT EXISTS public.module_objectives (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  text      TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_module_objectives_module_id ON public.module_objectives(module_id);

CREATE TABLE IF NOT EXISTS public.lesson_objectives (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  text      TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lesson_objectives_lesson_id ON public.lesson_objectives(lesson_id);

CREATE TABLE IF NOT EXISTS public.module_competencies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL,
  competency_id UUID,
  text          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_module_competencies_module_id ON public.module_competencies(module_id);

CREATE TABLE IF NOT EXISTS public.lesson_competency_map (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL,
  competency_id UUID,
  text          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lesson_competency_map_lesson_id ON public.lesson_competency_map(lesson_id);

CREATE TABLE IF NOT EXISTS public.course_accreditation_metadata (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                       UUID NOT NULL UNIQUE,
  requires_final_exam             BOOLEAN NOT NULL DEFAULT false,
  requires_practical              BOOLEAN NOT NULL DEFAULT false,
  certificate_requires_practical  BOOLEAN NOT NULL DEFAULT false,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_publish_audits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL,
  publishable BOOLEAN NOT NULL DEFAULT false,
  issues_json JSONB NOT NULL DEFAULT '[]',
  audited_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_publish_audits_course_id ON public.course_publish_audits(course_id);

-- ── Forms ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.forms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  schema     JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id    UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);

-- ── LMS interactive video ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.interactive_video_quiz_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       UUID,
  question        TEXT NOT NULL,
  selected_answer TEXT,
  correct_answer  TEXT,
  is_correct      BOOLEAN,
  timestamp_sec   NUMERIC(8,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id, question)
);
CREATE INDEX IF NOT EXISTS idx_ivqa_user_lesson ON public.interactive_video_quiz_answers(user_id, lesson_id);

-- ── Skill sign-offs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_skill_signoffs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL,
  lesson_id   UUID NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  signed_off_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signed_off_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_student_skill_signoffs_user ON public.student_skill_signoffs(user_id, course_id);

-- ── Participant report view ───────────────────────────────────────────────────
-- Derived from program_enrollments + profiles + programs.
-- Referenced by lib/admin/get-admin-dashboard-data.ts.

CREATE OR REPLACE VIEW public.participant_report AS
SELECT
  pe.id                                                    AS enrollment_id,
  p.full_name,
  p.email,
  pr.title                                                 AS program_title,
  pe.funding_source,
  -- pe.outcome column does not exist on program_enrollments; fall back to status.
  -- Original:
  --   CASE WHEN pe.status = 'completed' AND pe.outcome IS NULL THEN 'none'
  --        ELSE COALESCE(pe.outcome, pe.status) END AS outcome_type,
  pe.status                                                AS outcome_type,
  pe.enrolled_at,
  pe.completed_at,
  pe.status
FROM public.program_enrollments pe
LEFT JOIN public.profiles p  ON p.id  = pe.user_id
LEFT JOIN public.programs  pr ON pr.id = pe.program_id;

GRANT SELECT ON public.participant_report TO authenticated;

-- ── RLS: enable on new tables that hold user data ─────────────────────────────

ALTER TABLE public.tax_return_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeship_intake      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_completion_status   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_video_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_signoffs     ENABLE ROW LEVEL SECURITY;

-- Admins can read everything; users can read their own rows.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_all_tax_return_events' AND tablename = 'tax_return_events') THEN
    CREATE POLICY "admin_all_tax_return_events" ON public.tax_return_events FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_all_apprenticeship_intake' AND tablename = 'apprenticeship_intake') THEN
    CREATE POLICY "admin_all_apprenticeship_intake" ON public.apprenticeship_intake FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','case_manager')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'own_barber_completion_status' AND tablename = 'barber_completion_status') THEN
    CREATE POLICY "own_barber_completion_status" ON public.barber_completion_status FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_barber_completion_status' AND tablename = 'barber_completion_status') THEN
    CREATE POLICY "admin_barber_completion_status" ON public.barber_completion_status FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'own_interactive_video_quiz_answers' AND tablename = 'interactive_video_quiz_answers') THEN
    CREATE POLICY "own_interactive_video_quiz_answers" ON public.interactive_video_quiz_answers FOR ALL TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'own_student_skill_signoffs' AND tablename = 'student_skill_signoffs') THEN
    CREATE POLICY "own_student_skill_signoffs" ON public.student_skill_signoffs FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_student_skill_signoffs' AND tablename = 'student_skill_signoffs') THEN
    CREATE POLICY "admin_student_skill_signoffs" ON public.student_skill_signoffs FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','instructor')));
  END IF;
END $$;
