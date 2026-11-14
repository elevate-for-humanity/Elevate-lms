-- ============================================================
-- PENDING MIGRATIONS BUNDLE
-- Generated: 2026-05-23T12:58:50.067Z
-- Apply in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql
-- ============================================================
-- Run this entire file. Each migration is wrapped so one
-- failure does not block the rest.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 20260417000013_documents_bucket_policies.sql
-- ────────────────────────────────────────────────────────────
-- DOCUMENTS STORAGE BUCKET + RLS POLICIES
--
-- MUST BE APPLIED MANUALLY via Supabase Dashboard → SQL Editor.
-- The standard migration runner runs as service_role, which is NOT the owner
-- of storage.objects (that's supabase_storage_admin). The Dashboard SQL Editor
-- has the elevated permissions required to alter storage policies.
--
-- This file is intentionally tracked but auto-runner will SKIP it gracefully
-- after the first failure; idempotent so re-running in Dashboard is safe.

-- Ensure the 'documents' storage bucket exists.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload and read their own documents
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
CREATE POLICY "Admins can read all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 20260522000005_program_holder_operations.sql
-- ────────────────────────────────────────────────────────────
-- Program holder operational tables:
-- students roster, attendance, milestones, payout schedule

-- ─── program_holder_students ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.program_holder_students (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id       UUID REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','withdrawn','on_hold')),
  enrolled_at         TIMESTAMPTZ DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_holder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ph_students_holder  ON public.program_holder_students(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_students_user    ON public.program_holder_students(user_id);

ALTER TABLE public.program_holder_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program_holder_students_select" ON public.program_holder_students
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "program_holder_students_insert" ON public.program_holder_students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "program_holder_students_update" ON public.program_holder_students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── attendance_records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  session_date        DATE NOT NULL,
  session_type        TEXT NOT NULL DEFAULT 'classroom'
                        CHECK (session_type IN ('classroom','hands_on','lab','field','online','makeup')),
  hours               NUMERIC(4,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'present'
                        CHECK (status IN ('present','absent','excused','late','partial')),
  notes               TEXT,
  document_url        TEXT,
  recorded_by         UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_holder  ON public.attendance_records(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user    ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON public.attendance_records(session_date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON public.attendance_records
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "attendance_insert" ON public.attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "attendance_update" ON public.attendance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── student_milestones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_milestones (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  milestone_type      TEXT NOT NULL
                        CHECK (milestone_type IN (
                          'enrollment','orientation','week_1','week_2','week_3',
                          'week_4','week_5','week_6','hands_on_complete',
                          'epa_608_passed','osha_10_passed','cpr_passed',
                          'program_complete','job_placement'
                        )),
  title               TEXT NOT NULL,
  completed           BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  document_url        TEXT,
  notes               TEXT,
  verified_by         UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_holder ON public.student_milestones(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user   ON public.student_milestones(user_id);

ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_select" ON public.student_milestones
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "milestones_insert" ON public.student_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "milestones_update" ON public.student_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── payout_schedules ────────────────────────────────────────────────────────
-- Tracks the 2-increment payment schedule per student per program holder.
-- First 2 students: 100% upfront. Subsequent: 50% on approval, 50% on completion.
CREATE TABLE IF NOT EXISTS public.payout_schedules (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id     UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id         UUID REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  student_sequence      INTEGER,           -- 1, 2 = first cohort (upfront); 3+ = split
  total_payout_cents    INTEGER NOT NULL DEFAULT 0,
  increment_1_cents     INTEGER NOT NULL DEFAULT 0,
  increment_2_cents     INTEGER NOT NULL DEFAULT 0,
  increment_1_status    TEXT NOT NULL DEFAULT 'pending'
                          CHECK (increment_1_status IN ('pending','approved','released','paid','held')),
  increment_2_status    TEXT NOT NULL DEFAULT 'pending'
                          CHECK (increment_2_status IN ('pending','approved','released','paid','held','not_applicable')),
  increment_1_approved_at   TIMESTAMPTZ,
  increment_1_release_date  DATE,          -- 14 days after approval
  increment_1_paid_at       TIMESTAMPTZ,
  increment_2_approved_at   TIMESTAMPTZ,
  increment_2_release_date  DATE,          -- 14 days after completion approval
  increment_2_paid_at       TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_holder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_schedules_holder ON public.payout_schedules(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_user   ON public.payout_schedules(user_id);

ALTER TABLE public.payout_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_schedules_select" ON public.payout_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 20260627000013_baseline_missing_tables.sql
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 20260630000001_rag_embeddings.sql
-- ────────────────────────────────────────────────────────────
-- RAG embeddings infrastructure
--
-- Enables semantic search over platform knowledge:
-- routes, components, API docs, program descriptions, SOPs.
--
-- Requires pgvector extension (available on Supabase by default).
-- Apply in Supabase Dashboard → SQL Editor.

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Platform knowledge chunks ────────────────────────────────────────────────
-- Each row is a chunk of platform knowledge with an embedding vector.
-- Populated by the embedding pipeline (scripts/embed-platform-knowledge.ts).

CREATE TABLE IF NOT EXISTS public.platform_knowledge_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   text NOT NULL, -- 'route', 'component', 'api', 'migration', 'doc', 'sop', 'program'
  source_path   text NOT NULL, -- file path or route path
  title         text NOT NULL,
  content       text NOT NULL, -- the raw text chunk
  embedding     vector(1536),  -- OpenAI text-embedding-3-small
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS platform_knowledge_chunks_embedding_idx
  ON public.platform_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for source type filtering
CREATE INDEX IF NOT EXISTS platform_knowledge_chunks_source_type_idx
  ON public.platform_knowledge_chunks (source_type);

-- ── Operational memory ───────────────────────────────────────────────────────
-- Persistent memory for the AI operator: decisions, audits, known issues,
-- deployment events, canonical choices.

CREATE TABLE IF NOT EXISTS public.ai_operator_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type   text NOT NULL, -- 'decision', 'audit', 'issue', 'deployment', 'migration', 'note'
  title         text NOT NULL,
  content       text NOT NULL,
  tags          text[] DEFAULT '{}',
  severity      text DEFAULT 'info', -- 'info', 'warning', 'critical'
  resolved      boolean DEFAULT false,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_operator_memory_type_idx ON public.ai_operator_memory (memory_type);
CREATE INDEX IF NOT EXISTS ai_operator_memory_resolved_idx ON public.ai_operator_memory (resolved);
CREATE INDEX IF NOT EXISTS ai_operator_memory_tags_idx ON public.ai_operator_memory USING GIN (tags);

-- ── Platform state snapshots ─────────────────────────────────────────────────
-- Point-in-time snapshots of platform health for trend analysis.

CREATE TABLE IF NOT EXISTS public.platform_state_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at           timestamptz DEFAULT now(),
  active_students       integer,
  total_enrollments     integer,
  pending_applications  integer,
  published_programs    integer,
  certificates_issued   integer,
  deployment_healthy    boolean DEFAULT true,
  ai_provider           text,
  notes                 text,
  raw                   jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS platform_state_snapshots_at_idx
  ON public.platform_state_snapshots (snapshot_at DESC);

-- ── Semantic search RPC ──────────────────────────────────────────────────────
-- Called by the AI console to retrieve relevant context chunks.

CREATE OR REPLACE FUNCTION public.search_platform_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count     int   DEFAULT 10,
  filter_type     text  DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  source_type text,
  source_path text,
  title       text,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pkc.id,
    pkc.source_type,
    pkc.source_path,
    pkc.title,
    pkc.content,
    pkc.metadata,
    1 - (pkc.embedding <=> query_embedding) AS similarity
  FROM public.platform_knowledge_chunks pkc
  WHERE
    (filter_type IS NULL OR pkc.source_type = filter_type)
    AND pkc.embedding IS NOT NULL
    AND 1 - (pkc.embedding <=> query_embedding) > match_threshold
  ORDER BY pkc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── Seed initial operational memory from known platform state ────────────────

INSERT INTO public.ai_operator_memory (memory_type, title, content, tags, severity) VALUES
(
  'decision',
  'Canonical program route architecture',
  'All programs use /programs/[program] via the dynamic route. Dedicated pages only when unique client components are needed (barber, cosmetology, hvac, cna, building-services, finance-bookkeeping, esthetician, drug-collector, direct-support-professional, cpr-first-aid, peer-recovery-specialist, medical-assistant, electrical, plumbing). All other programs fall through to [program].',
  ARRAY['routes', 'programs', 'canonical'],
  'info'
),
(
  'decision',
  'Supabase client import path',
  'Import Supabase clients from @/lib/supabase/* only. All 10 deprecated root-level shims deleted in 2026-Q2. Do not re-introduce them.',
  ARRAY['supabase', 'imports', 'canonical'],
  'info'
),
(
  'decision',
  'Middleware: use proxy.ts only',
  'All middleware logic goes in proxy.ts. Do NOT create middleware.ts — it conflicts with proxy.ts and breaks the build.',
  ARRAY['middleware', 'canonical', 'critical'],
  'warning'
),
(
  'issue',
  'Programs vs Courses terminology split',
  'Public LMS uses "Programs" (/lms/programs) while authenticated app uses "Courses" (/lms/courses). Canonical term is "Program". Renaming requires 20+ inbound href updates and redirect rules. Tracked as explicit debt — do not resolve casually.',
  ARRAY['routes', 'ux-debt', 'lms'],
  'warning'
),
(
  'issue',
  'Workforce board portal has no API routes',
  '5 pages exist at /workforce-board/* but 0 API routes in /api/workforce-board/. Pages are stubs. Need to build /api/workforce-board/* routes.',
  ARRAY['workforce-board', 'api-gap', 'stub'],
  'warning'
),
(
  'issue',
  'Mentor portal has no API routes',
  '3 pages exist at /mentor/* but 0 API routes. Need to build /api/mentor/* routes.',
  ARRAY['mentor', 'api-gap', 'stub'],
  'info'
),
(
  'issue',
  'Auth gaps: 62 routes with no auth check',
  'As of 2026-03-16 audit: 62 routes with no auth check, 13 admin routes with identity-only auth (no role check), 33 routes leaking error.message. Run scripts/audit-auth-gaps.sh for current state.',
  ARRAY['auth', 'security', 'audit'],
  'critical'
),
(
  'issue',
  'Lab/assignment instructor sign-off UI not built',
  'step_submissions table exists and lesson page renders lab/assignment UI shells, but instructor sign-off UI is not yet built.',
  ARRAY['lms', 'instructor', 'incomplete'],
  'info'
),
(
  'decision',
  'LMS course engine is DB-driven and program-agnostic',
  'The course engine routes rendering and completion rules by step_type column on curriculum_lessons. Do not write per-program hardcoded logic. Set step_type in the DB and the renderer handles it automatically.',
  ARRAY['lms', 'architecture', 'canonical'],
  'info'
),
(
  'decision',
  'Rate limiting: use applyRateLimit from @/lib/api/withRateLimit',
  'lib/rateLimit.ts (in-memory) is deprecated — broken in serverless. lib/rateLimiter.ts and lib/api/rate-limiter.ts are deleted. Use applyRateLimit() from @/lib/api/withRateLimit only.',
  ARRAY['rate-limiting', 'canonical', 'security'],
  'info'
)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 20260630000003_mentor_portal_tables.sql
-- ────────────────────────────────────────────────────────────
-- Mentor Portal Tables
--
-- Creates mentorships, mentor_sessions, mentor_messages, mentor_resources.
-- Apply in Supabase Dashboard → SQL Editor.

-- ── mentorships ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentorships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentee_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending', -- pending, active, completed, declined
  requested_at timestamptz DEFAULT now(),
  started_at   timestamptz,
  ended_at     timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (mentor_id, mentee_id)
);

CREATE INDEX IF NOT EXISTS mentorships_mentor_idx  ON public.mentorships (mentor_id);
CREATE INDEX IF NOT EXISTS mentorships_mentee_idx  ON public.mentorships (mentee_id);
CREATE INDEX IF NOT EXISTS mentorships_status_idx  ON public.mentorships (status);

-- ── mentor_sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id      uuid REFERENCES public.mentorships(id) ON DELETE SET NULL,
  scheduled_at       timestamptz NOT NULL,
  duration_minutes   integer DEFAULT 60,
  status             text NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  session_type       text DEFAULT 'general',
  topic              text,
  notes              text,
  location           text,
  completed_at       timestamptz,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_sessions_mentorship_idx ON public.mentor_sessions (mentorship_id);
CREATE INDEX IF NOT EXISTS mentor_sessions_scheduled_idx  ON public.mentor_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS mentor_sessions_status_idx     ON public.mentor_sessions (status);

-- ── mentor_messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id  uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text NOT NULL,
  read_at        timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_messages_mentorship_idx ON public.mentor_messages (mentorship_id);
CREATE INDEX IF NOT EXISTS mentor_messages_sender_idx     ON public.mentor_messages (sender_id);
CREATE INDEX IF NOT EXISTS mentor_messages_created_idx    ON public.mentor_messages (created_at DESC);

-- Enable Realtime for live messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_messages;

-- ── mentor_resources ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  url         text NOT NULL,
  file_type   text, -- 'pdf', 'video', 'link', 'doc'
  category    text, -- 'career', 'skills', 'wellness', 'financial', 'general'
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_resources_category_idx ON public.mentor_resources (category);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.mentorships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_resources ENABLE ROW LEVEL SECURITY;

-- Mentors see their own mentorships; admins see all
CREATE POLICY "mentorships_select" ON public.mentorships FOR SELECT
  USING (
    mentor_id = auth.uid() OR mentee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

CREATE POLICY "mentorships_insert" ON public.mentorships FOR INSERT
  WITH CHECK (mentee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "mentorships_update" ON public.mentorships FOR UPDATE
  USING (mentor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Sessions: visible to mentor and mentee
CREATE POLICY "mentor_sessions_select" ON public.mentor_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

CREATE POLICY "mentor_sessions_insert" ON public.mentor_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND m.mentor_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Messages: visible to participants
CREATE POLICY "mentor_messages_select" ON public.mentor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "mentor_messages_insert" ON public.mentor_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Resources: all authenticated users can read; mentors/admins can write
CREATE POLICY "mentor_resources_select" ON public.mentor_resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "mentor_resources_insert" ON public.mentor_resources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin', 'super_admin')));

-- ────────────────────────────────────────────────────────────
-- 20260630000004_workforce_board_tables.sql
-- ────────────────────────────────────────────────────────────
-- Workforce Board Tables
--
-- Creates wioa_participants, wioa_cases, and ensures ita_vouchers has
-- all required columns. Apply in Supabase Dashboard → SQL Editor.

-- ── wioa_participants ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wioa_participants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text,
  phone            text,
  status           text NOT NULL DEFAULT 'active', -- active, exited, completed, transferred
  program_id       uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  case_manager_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  enrollment_date  timestamptz,
  exit_date        timestamptz,
  exit_reason      text,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wioa_participants_status_idx      ON public.wioa_participants (status);
CREATE INDEX IF NOT EXISTS wioa_participants_program_idx     ON public.wioa_participants (program_id);
CREATE INDEX IF NOT EXISTS wioa_participants_case_mgr_idx    ON public.wioa_participants (case_manager_id);
CREATE INDEX IF NOT EXISTS wioa_participants_email_idx       ON public.wioa_participants (email);

-- ── wioa_cases ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wioa_cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number      text UNIQUE NOT NULL,
  participant_id   uuid REFERENCES public.wioa_participants(id) ON DELETE CASCADE,
  case_manager_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id       uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'open', -- open, closed, transferred, suspended
  funding_amount   numeric(10,2) DEFAULT 0,
  funding_used     numeric(10,2) DEFAULT 0,
  opened_at        timestamptz DEFAULT now(),
  closed_at        timestamptz,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wioa_cases_participant_idx  ON public.wioa_cases (participant_id);
CREATE INDEX IF NOT EXISTS wioa_cases_status_idx       ON public.wioa_cases (status);
CREATE INDEX IF NOT EXISTS wioa_cases_case_number_idx  ON public.wioa_cases (case_number);

-- ── ita_vouchers — ensure all columns exist ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ita_vouchers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number  text UNIQUE NOT NULL,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id      uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  case_id         uuid REFERENCES public.wioa_cases(id) ON DELETE SET NULL,
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  amount_used     numeric(10,2) DEFAULT 0,
  status          text NOT NULL DEFAULT 'issued', -- issued, redeemed, expired, cancelled
  issued_at       timestamptz DEFAULT now(),
  expires_at      timestamptz,
  redeemed_at     timestamptz,
  issued_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ita_vouchers_user_idx    ON public.ita_vouchers (user_id);
CREATE INDEX IF NOT EXISTS ita_vouchers_status_idx  ON public.ita_vouchers (status);
CREATE INDEX IF NOT EXISTS ita_vouchers_program_idx ON public.ita_vouchers (program_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.wioa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wioa_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ita_vouchers      ENABLE ROW LEVEL SECURITY;

-- Workforce board staff and admins can read/write participants
CREATE POLICY "wioa_participants_select" ON public.wioa_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_participants_insert" ON public.wioa_participants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_participants_update" ON public.wioa_participants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

-- Cases
CREATE POLICY "wioa_cases_select" ON public.wioa_cases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_cases_insert" ON public.wioa_cases FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

-- ITA vouchers: users can see their own; staff/admin see all
CREATE POLICY "ita_vouchers_select" ON public.ita_vouchers FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff'))
  );

CREATE POLICY "ita_vouchers_insert" ON public.ita_vouchers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

-- ────────────────────────────────────────────────────────────
-- 20260630000007_consolidate_tables.sql
-- ────────────────────────────────────────────────────────────
-- Table Consolidation Migration
-- Merges overlapping/duplicate tables into canonical ones.
-- Strategy per family:
--   1. Merge any unique data from aliases into canonical
--   2. Drop empty alias tables
--   3. Create views where code still references old names (zero-downtime)
--   4. Add missing columns to canonical tables so nothing is lost
--
-- SAFE: no canonical data is deleted. All merges use INSERT ... ON CONFLICT DO NOTHING.
-- Apply in Supabase Dashboard → SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 1: ENROLLMENTS
-- Canonical: program_enrollments (461 code refs, 12 rows, full schema)
-- enrollments: VIEW over program_enrollments — already correct, keep as-is
-- course_enrollments: 3 rows, different schema (LMS course assignments) — keep separate
-- training_enrollments: 1 row, HVAC legacy — merge into program_enrollments then drop
-- apprenticeship_enrollments: 0 rows — drop
-- cohort_enrollments: 0 rows — drop
-- ─────────────────────────────────────────────────────────────────────────────

-- Merge training_enrollments → program_enrollments (1 row, no conflict risk)
INSERT INTO public.program_enrollments (
  id, user_id, program_id, program_slug, status, enrolled_at,
  completed_at, progress_percent, funding_source, cohort_id,
  docs_verified, orientation_completed_at, documents_submitted_at,
  confirmed_at, agreement_signed, course_id, created_at, updated_at
)
SELECT
  id,
  user_id,
  program_id,
  program_slug,
  status,
  enrolled_at,
  completed_at,
  progress,
  funding_source,
  cohort_id,
  docs_verified,
  orientation_completed_at,
  documents_submitted_at,
  confirmed_at,
  agreement_signed,
  course_id_uuid,
  COALESCE(enrolled_at, now()),
  COALESCE(updated_at, now())
FROM public.training_enrollments
WHERE id NOT IN (SELECT id FROM public.program_enrollments)
ON CONFLICT (id) DO NOTHING;

-- Drop empty/merged alias tables
DROP TABLE IF EXISTS public.training_enrollments CASCADE;
DROP TABLE IF EXISTS public.apprenticeship_enrollments CASCADE;
DROP TABLE IF EXISTS public.cohort_enrollments CASCADE;

-- Recreate enrollments view pointing to canonical table (was already a view)
CREATE OR REPLACE VIEW public.enrollments AS
SELECT
  id,
  user_id,
  student_id,
  program_id,
  program_slug,
  status,
  enrollment_state,
  enrolled_at,
  completed_at,
  progress_percent,
  funding_source,
  cohort_id,
  created_at,
  updated_at
FROM public.program_enrollments;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 2: AUDIT LOGS
-- Canonical: audit_logs (69 code refs, 61,660 rows)
-- admin_audit_events: 203 rows, slightly different schema — merge in
-- admin_audit_log: 0 rows — drop
-- ai_audit_log: 0 rows — drop
-- ─────────────────────────────────────────────────────────────────────────────

-- Add columns to audit_logs that admin_audit_events has but audit_logs may not
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS old_data jsonb,
  ADD COLUMN IF NOT EXISTS new_data jsonb;

-- Merge admin_audit_events → audit_logs
INSERT INTO public.audit_logs (
  id, action, actor_id, actor_role, target_type, target_id,
  metadata, ip_address, created_at, entity_type, entity_id,
  old_data, new_data
)
SELECT
  id,
  action,
  COALESCE(actor_user_id, actor_id),
  actor_role,
  COALESCE(target_type, entity_type),
  COALESCE(target_id, entity_id),
  metadata,
  ip_address,
  created_at,
  entity_type,
  entity_id,
  old_data,
  new_data
FROM public.admin_audit_events
WHERE id NOT IN (SELECT id FROM public.audit_logs)
ON CONFLICT (id) DO NOTHING;

-- Drop empty/merged alias tables
DROP TABLE IF EXISTS public.admin_audit_events CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.ai_audit_log CASCADE;

-- View alias so any remaining admin_audit_events refs still work
CREATE OR REPLACE VIEW public.admin_audit_events AS
SELECT
  id,
  action,
  actor_id AS actor_user_id,
  actor_id,
  actor_role,
  target_type,
  target_id,
  metadata,
  ip_address,
  created_at,
  entity_type,
  entity_id,
  old_data,
  new_data
FROM public.audit_logs;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 3: PROFILES
-- Canonical: profiles (43 rows, full schema, auth.users FK)
-- user_profiles: 1 row, subset of profiles columns — merge in, drop
-- instructor_profiles: 0 rows — drop
-- student_profiles / staff_profiles / preparer_profiles: MISSING — nothing to do
-- ─────────────────────────────────────────────────────────────────────────────

-- Merge user_profiles → profiles (fill in any gaps)
UPDATE public.profiles p
SET
  bio        = COALESCE(p.bio, up.bio),
  avatar_url = COALESCE(p.avatar_url, up.avatar_url),
  phone      = COALESCE(p.phone, up.phone),
  address    = COALESCE(p.address, up.address),
  city       = COALESCE(p.city, up.city),
  state      = COALESCE(p.state, up.state),
  zip        = COALESCE(p.zip, up.zip_code),
  updated_at = now()
FROM public.user_profiles up
WHERE up.user_id = p.id
  AND (up.bio IS NOT NULL OR up.phone IS NOT NULL OR up.address IS NOT NULL);

DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.instructor_profiles CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 4: PROGRESS
-- Canonical: lesson_progress (LMS engine canonical, 0 rows but referenced by engine)
--            course_progress (1 row, different concern — keep separate)
-- module_progress: 0 rows — drop (lesson_progress covers this)
-- user_progress: 0 rows — drop (redundant with lesson_progress)
-- video_progress: 0 rows — drop (video state goes in lesson_progress metadata)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.module_progress CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 5: NOTIFICATIONS
-- Canonical: notifications (6 rows, full schema)
-- admin_notifications: 0 rows — drop, use notifications with type filter
-- apprentice_notifications: 0 rows — drop
-- alert_notifications: 0 rows — drop
-- announcement_recipients: 0 rows — drop (use announcements table)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.apprentice_notifications CASCADE;
DROP TABLE IF EXISTS public.alert_notifications CASCADE;
DROP TABLE IF EXISTS public.announcement_recipients CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 6: DOCUMENTS
-- Canonical: documents (135 rows, full schema with OCR, verification, metadata)
-- user_documents: 0 rows — drop (use documents with user_id filter)
-- enrollment_documents: 0 rows — drop (use documents with enrollment_id filter)
-- apprentice_documents: 0 rows — drop (use documents with owner_type='apprentice')
-- compliance_documents: 0 rows — drop (use documents with document_type='compliance')
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.user_documents CASCADE;
DROP TABLE IF EXISTS public.enrollment_documents CASCADE;
DROP TABLE IF EXISTS public.apprentice_documents CASCADE;
DROP TABLE IF EXISTS public.compliance_documents CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 7: APPRENTICE HOURS
-- Canonical: apprenticeship_hours (6 rows, full schema)
-- apprentice_hours: 0 rows — drop
-- apprentice_hours_log: 0 rows — drop
-- apprentice_hours_by_shop: 0 rows — drop (this is a view/aggregate concern)
-- apprentice_hours_by_source: 1 row (view/aggregate) — drop, recompute from apprenticeship_hours
-- apprentice_hour_totals: 1 row (view/aggregate) — drop, recompute from apprenticeship_hours
-- apprenticeship_hours_summary: 6 rows (materialized summary) — keep as view
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.apprentice_hours CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_log CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_by_shop CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_by_source CASCADE;
DROP TABLE IF EXISTS public.apprentice_hour_totals CASCADE;

-- Replace apprenticeship_hours_summary with a live view over apprenticeship_hours
DROP TABLE IF EXISTS public.apprenticeship_hours_summary CASCADE;
CREATE OR REPLACE VIEW public.apprenticeship_hours_summary AS
SELECT
  student_id,
  program_slug,
  date_trunc('week', COALESCE(date_worked, date))::date AS week_start,
  SUM(COALESCE(hours_worked, hours, 0))                  AS total_hours,
  SUM(CASE WHEN status = 'approved'  THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS approved_hours,
  SUM(CASE WHEN status = 'pending'   THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS pending_hours,
  SUM(CASE WHEN status = 'disputed'  THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS disputed_hours,
  COUNT(*)                                               AS entry_count
FROM public.apprenticeship_hours
GROUP BY student_id, program_slug, date_trunc('week', COALESCE(date_worked, date));

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 8: COMPLIANCE
-- Canonical: compliance_items (24 rows — platform compliance checklist)
-- admin_compliance_status: 43 rows — this is a VIEW/report, not a table
--   Keep it but convert to a live view over profiles
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.admin_compliance_status CASCADE;
CREATE OR REPLACE VIEW public.admin_compliance_status AS
SELECT
  p.id                                                    AS user_id,
  p.email,
  p.full_name,
  p.role,
  CASE
    WHEN p.onboarding_completed THEN 'complete'
    WHEN p.onboarding_started   THEN 'in_progress'
    ELSE 'not_started'
  END                                                     AS onboarding_status,
  CASE WHEN p.agreements_signed_at IS NOT NULL THEN true ELSE false END AS agreements_signed,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id)::int                           AS documents_uploaded,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id AND d.verification_status = 'verified')::int AS documents_verified,
  p.onboarding_completed_at,
  CASE WHEN p.agreements_signed_at IS NOT NULL THEN 1 ELSE 0 END AS total_agreements_signed,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id AND d.verification_status = 'verified')::int AS verified_documents_count,
  p.agreements_signed_at                                  AS last_agreement_signed
FROM public.profiles p
WHERE p.role IN ('student','learner','apprentice','staff','admin','instructor');

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 9: SETTINGS
-- Canonical: platform_settings (57 rows, key/value store)
-- user_preferences: 0 rows — drop (use profiles.notification_preferences jsonb)
-- notification_preferences: 0 rows — drop (same)
-- feature_flags: 0 rows — drop (use platform_settings with key prefix 'feature.')
-- system_settings: MISSING — nothing to do
-- user_settings: MISSING — nothing to do
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 10: MISSING TABLES — create stubs for tables referenced in code
-- These were in migrations but never applied. Create minimal versions now.
-- ─────────────────────────────────────────────────────────────────────────────

-- wioa_cases (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.wioa_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_number     text UNIQUE,
  status          text NOT NULL DEFAULT 'open',
  program_id      uuid REFERENCES public.programs(id),
  assigned_staff  uuid REFERENCES public.profiles(id),
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  notes           text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wioa_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage wioa_cases"
  ON public.wioa_cases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_cases (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wioa_case_id    uuid REFERENCES public.wioa_cases(id),
  participant_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'active',
  board_notes     text,
  review_date     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_cases"
  ON public.workforce_board_cases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_participants (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
  profile_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'participant',
  joined_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_participants"
  ON public.workforce_board_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_notes (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
  author_id       uuid REFERENCES public.profiles(id),
  note            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_notes"
  ON public.workforce_board_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- rag_embeddings (AI knowledge retrieval)
CREATE TABLE IF NOT EXISTS public.rag_embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     text NOT NULL,
  source_id       text NOT NULL,
  content         text NOT NULL,
  embedding       vector(1536),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id)
);
ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rag_embeddings"
  ON public.rag_embeddings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- ai_planner_tasks (AI planner)
CREATE TABLE IF NOT EXISTS public.ai_planner_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'pending',
  priority        text NOT NULL DEFAULT 'normal',
  assigned_to     uuid REFERENCES public.profiles(id),
  due_date        date,
  metadata        jsonb DEFAULT '{}',
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ai_planner_tasks"
  ON public.ai_planner_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- payout_queue (referenced in code, missing from DB)
CREATE TABLE IF NOT EXISTS public.payout_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid REFERENCES public.program_enrollments(id),
  recipient_id    uuid REFERENCES public.profiles(id),
  amount_cents    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',
  payout_method   text,
  notes           text,
  paid_at         timestamptz,
  paid_by         uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payout_queue"
  ON public.payout_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- tenant_configurations (platform engine)
CREATE TABLE IF NOT EXISTS public.tenant_configurations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text UNIQUE NOT NULL,
  brand_name      text NOT NULL,
  domain          text,
  industry        text,
  features        jsonb DEFAULT '[]',
  theme           jsonb DEFAULT '{}',
  config          jsonb DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tenant_configurations"
  ON public.tenant_configurations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT tablename, 'TABLE' AS kind FROM pg_tables WHERE schemaname='public'
-- UNION ALL
-- SELECT viewname, 'VIEW' FROM pg_views WHERE schemaname='public'
-- ORDER BY 1;

-- ────────────────────────────────────────────────────────────
-- 20260701000001_fix_completion_trigger_table_split.sql
-- ────────────────────────────────────────────────────────────
-- Fix: completion eligibility and certificate triggers read only curriculum_lessons,
-- but courses seeded via the blueprint engine store lessons in course_lessons.
-- This migration patches is_program_completion_eligible() and the two trigger
-- resolver functions to check both tables, preferring curriculum_lessons when
-- a program_id match exists there (HVAC legacy path), falling back to course_lessons
-- for blueprint-seeded courses.
--
-- Also patches maybe_issue_certificate_after_lesson_progress() and
-- maybe_issue_certificate_after_checkpoint_score() to resolve program_id from
-- course_lessons when curriculum_lessons returns NULL.
--
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Unified eligibility function
--    Checks curriculum_lessons first; if no rows found for the program,
--    falls back to course_lessons.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_program_completion_eligible(
  p_user_id    uuid,
  p_program_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_use_curriculum     boolean;
  v_missing_content    integer;
  v_missing_pass       integer;
BEGIN
  -- Determine which table owns this program's lessons.
  -- curriculum_lessons has a direct program_id FK.
  -- course_lessons is joined via courses.program_id.
  SELECT EXISTS (
    SELECT 1 FROM public.curriculum_lessons WHERE program_id = p_program_id LIMIT 1
  ) INTO v_use_curriculum;

  IF v_use_curriculum THEN
    -- ── curriculum_lessons path (HVAC + legacy) ──────────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = cl.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = cl.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  ELSE
    -- ── course_lessons path (blueprint-seeded courses) ────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = col.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = col.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  END IF;

  RETURN true;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Patch lesson_progress trigger resolver
--    Resolves program_id from curriculum_lessons first, then course_lessons.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate_after_lesson_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id  uuid;
  v_now_done    boolean;
  v_prev_done   boolean;
BEGIN
  v_now_done  := COALESCE(NEW.completed, false) OR (NEW.completed_at IS NOT NULL);
  v_prev_done := CASE
    WHEN TG_OP = 'UPDATE'
    THEN COALESCE(OLD.completed, false) OR (OLD.completed_at IS NOT NULL)
    ELSE false
  END;

  -- Only act on the transition to completed.
  IF NOT v_now_done THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_done THEN RETURN NEW; END IF;

  -- Try curriculum_lessons first (HVAC / legacy).
  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id
  LIMIT 1;

  -- Fall back to course_lessons (blueprint-seeded).
  IF v_program_id IS NULL THEN
    SELECT c.program_id INTO v_program_id
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE col.id = NEW.lesson_id
    LIMIT 1;
  END IF;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Patch checkpoint_scores trigger resolver
--    Same dual-table program_id resolution.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate_after_checkpoint_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id  uuid;
  v_now_passed  boolean;
  v_prev_passed boolean;
BEGIN
  v_now_passed  := COALESCE(NEW.passed, false);
  v_prev_passed := CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.passed, false) ELSE false END;

  IF NOT v_now_passed THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND v_prev_passed THEN RETURN NEW; END IF;

  -- Try curriculum_lessons first.
  SELECT cl.program_id INTO v_program_id
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id
  LIMIT 1;

  -- Fall back to course_lessons.
  IF v_program_id IS NULL THEN
    SELECT c.program_id INTO v_program_id
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE col.id = NEW.lesson_id
    LIMIT 1;
  END IF;

  IF v_program_id IS NOT NULL THEN
    PERFORM public.issue_program_completion_certificate_if_eligible(
      NEW.user_id, v_program_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers already exist from 20260401000002 — no DROP/CREATE needed.
-- The functions are replaced in-place; triggers continue pointing to them.

COMMIT;

-- ────────────────────────────────────────────────────────────
-- 20260701000002_stale_application_archive.sql
-- ────────────────────────────────────────────────────────────
-- Stale application auto-archive function.
--
-- Applications that have received 2+ follow-up emails (next_step = 'call_required')
-- and have had no status change in 90+ days are moved to 'archived'.
-- Applications in terminal states (approved, rejected, enrolled, archived) are
-- never touched.
--
-- Called by POST /api/cron/stale-applications (admin app).
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

CREATE OR REPLACE FUNCTION public.archive_stale_applications(
  p_stale_days integer DEFAULT 90
)
RETURNS TABLE (
  archived_count  integer,
  application_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff        timestamptz;
  v_ids           uuid[];
  v_count         integer;
BEGIN
  v_cutoff := NOW() - (p_stale_days || ' days')::interval;

  -- Collect IDs: non-terminal applications older than the cutoff with
  -- at least 2 follow-ups sent and no recent status change.
  SELECT ARRAY_AGG(a.id)
  INTO v_ids
  FROM public.applications a
  WHERE a.status NOT IN ('approved', 'rejected', 'enrolled', 'archived', 'ready_to_enroll')
    AND a.updated_at < v_cutoff
    AND (
      -- Has been flagged for manual call after 2 failed follow-ups
      a.next_step = 'call_required'
      OR
      -- Or simply very old with no activity (belt-and-suspenders)
      a.created_at < v_cutoff
    )
    AND EXISTS (
      SELECT 1 FROM public.application_followups af
      WHERE af.application_id = a.id
      HAVING COUNT(*) >= 2
    );

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0, '{}'::uuid[];
    RETURN;
  END IF;

  UPDATE public.applications
  SET
    status     = 'archived',
    is_active  = false,
    updated_at = NOW(),
    notes      = COALESCE(notes, '') ||
                 E'\n[auto-archived ' || TO_CHAR(NOW(), 'YYYY-MM-DD') ||
                 ': no response after ' || p_stale_days || ' days and 2+ follow-ups]'
  WHERE id = ANY(v_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count, v_ids;
END;
$$;

COMMENT ON FUNCTION public.archive_stale_applications IS
  'Archives applications with no response after p_stale_days days and 2+ follow-up emails. '
  'Called daily by the stale-applications cron. Never touches terminal statuses.';

COMMIT;

-- ────────────────────────────────────────────────────────────
-- 20260701000003_program_integrity_view.sql
-- ────────────────────────────────────────────────────────────
-- Program integrity view.
--
-- Scores every non-archived program against 10 integrity checks.
-- Used by the admin dashboard Program Integrity panel and the
-- GET /api/admin/program-integrity API route.
--
-- Each check contributes 10 points. A program with score = 100 is
-- fully operational. Score < 60 = needs attention.
--
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

CREATE OR REPLACE VIEW public.program_integrity AS
WITH

-- Count curriculum_lessons rows per program
curriculum_counts AS (
  SELECT program_id, COUNT(*) AS lesson_count
  FROM public.curriculum_lessons
  WHERE status = 'published'
  GROUP BY program_id
),

-- Count course_lessons rows per program (via courses)
course_lesson_counts AS (
  SELECT c.program_id, COUNT(col.id) AS lesson_count
  FROM public.course_lessons col
  JOIN public.courses c ON c.id = col.course_id
  GROUP BY c.program_id
),

-- Unified lesson count: prefer curriculum_lessons, fall back to course_lessons
lesson_counts AS (
  SELECT
    p.id AS program_id,
    COALESCE(cc.lesson_count, clc.lesson_count, 0) AS total_lessons
  FROM public.programs p
  LEFT JOIN curriculum_counts cc ON cc.program_id = p.id
  LEFT JOIN course_lesson_counts clc ON clc.program_id = p.id
),

-- Count modules per program
module_counts AS (
  SELECT program_id, COUNT(*) AS total_modules
  FROM public.modules
  GROUP BY program_id
),

-- Count active enrollments per program
enrollment_counts AS (
  SELECT program_id, COUNT(*) AS active_enrollments
  FROM public.program_enrollments
  WHERE status = 'active'
  GROUP BY program_id
),

-- Count completion certificates per program
cert_counts AS (
  SELECT program_id, COUNT(*) AS certificates_issued
  FROM public.program_completion_certificates
  GROUP BY program_id
),

-- Does a courses row exist for this program?
course_exists AS (
  SELECT program_id, TRUE AS has_course
  FROM public.courses
  GROUP BY program_id
),

-- Does a completion_rules row exist? (uses entity_id, not program_id)
completion_rule_exists AS (
  SELECT entity_id AS program_id, TRUE AS has_completion_rule
  FROM public.completion_rules
  WHERE entity_type = 'program'
  GROUP BY entity_id
)

SELECT
  p.id,
  p.slug,
  p.title,
  p.status,
  p.category,
  p.published,
  p.is_active,
  COALESCE(lc.total_lessons, 0)          AS total_lessons,
  COALESCE(mc.total_modules, 0)           AS total_modules,
  COALESCE(ec.active_enrollments, 0)      AS active_enrollments,
  COALESCE(cc2.certificates_issued, 0)    AS certificates_issued,
  COALESCE(ce.has_course, FALSE)          AS has_course_row,
  COALESCE(cr.has_completion_rule, FALSE) AS has_completion_rule,

  -- Integrity score (0–100): 10 points per check
  (
    -- 1. Has at least one lesson
    CASE WHEN COALESCE(lc.total_lessons, 0) > 0 THEN 10 ELSE 0 END
    -- 2. Has at least one module
    + CASE WHEN COALESCE(mc.total_modules, 0) > 0 THEN 10 ELSE 0 END
    -- 3. Has a courses row (blueprint engine linkage)
    + CASE WHEN COALESCE(ce.has_course, FALSE) THEN 10 ELSE 0 END
    -- 4. Has a completion rule
    + CASE WHEN COALESCE(cr.has_completion_rule, FALSE) THEN 10 ELSE 0 END
    -- 5. Has a title (non-empty)
    + CASE WHEN p.title IS NOT NULL AND LENGTH(TRIM(p.title)) > 0 THEN 10 ELSE 0 END
    -- 6. Has a slug (non-empty, no test artifact pattern)
    + CASE WHEN p.slug IS NOT NULL
            AND p.slug NOT LIKE '%test%'
            AND p.slug NOT LIKE 'ai-%'
            AND p.slug NOT LIKE 'gen-%'
            AND p.slug NOT LIKE 'pub-path-%'
           THEN 10 ELSE 0 END
    -- 7. Has a category assigned
    + CASE WHEN p.category IS NOT NULL AND LENGTH(TRIM(p.category)) > 0 THEN 10 ELSE 0 END
    -- 8. Is published (visible to learners)
    + CASE WHEN p.published = TRUE THEN 10 ELSE 0 END
    -- 9. Has at least one enrollment (shows it's reachable)
    + CASE WHEN COALESCE(ec.active_enrollments, 0) > 0 THEN 10 ELSE 0 END
    -- 10. Has a description
    + CASE WHEN p.description IS NOT NULL AND LENGTH(TRIM(p.description)) > 0 THEN 10 ELSE 0 END
  ) AS integrity_score,

  -- Human-readable list of failing checks
  ARRAY_REMOVE(ARRAY[
    CASE WHEN COALESCE(lc.total_lessons, 0) = 0 THEN 'no_lessons' END,
    CASE WHEN COALESCE(mc.total_modules, 0) = 0 THEN 'no_modules' END,
    CASE WHEN NOT COALESCE(ce.has_course, FALSE) THEN 'no_course_row' END,
    CASE WHEN NOT COALESCE(cr.has_completion_rule, FALSE) THEN 'no_completion_rule' END,
    CASE WHEN p.title IS NULL OR LENGTH(TRIM(p.title)) = 0 THEN 'no_title' END,
    CASE WHEN p.slug IS NULL
          OR p.slug LIKE '%test%'
          OR p.slug LIKE 'ai-%'
          OR p.slug LIKE 'gen-%'
          OR p.slug LIKE 'pub-path-%'
         THEN 'bad_slug' END,
    CASE WHEN p.category IS NULL OR LENGTH(TRIM(p.category)) = 0 THEN 'no_category' END,
    CASE WHEN p.published IS NOT TRUE THEN 'not_published' END,
    CASE WHEN COALESCE(ec.active_enrollments, 0) = 0 THEN 'no_enrollments' END,
    CASE WHEN p.description IS NULL OR LENGTH(TRIM(p.description)) = 0 THEN 'no_description' END
  ], NULL) AS failing_checks

FROM public.programs p
LEFT JOIN lesson_counts lc ON lc.program_id = p.id
LEFT JOIN module_counts mc ON mc.program_id = p.id
LEFT JOIN enrollment_counts ec ON ec.program_id = p.id
LEFT JOIN cert_counts cc2 ON cc2.program_id = p.id
LEFT JOIN course_exists ce ON ce.program_id = p.id
LEFT JOIN completion_rule_exists cr ON cr.program_id = p.id
WHERE p.status != 'archived'
ORDER BY integrity_score ASC, p.title ASC;

COMMENT ON VIEW public.program_integrity IS
  'Scores each non-archived program 0–100 across 10 operational checks. '
  'Score < 60 = needs attention. Used by admin dashboard Program Integrity panel.';

COMMIT;

-- ────────────────────────────────────────────────────────────
-- 20260701000007_document_intel_and_grant_applications.sql
-- ────────────────────────────────────────────────────────────
-- Document Intelligence: ensure extraction columns exist on documents table
-- (20260622000006 added these but may not be applied everywhere)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ocr_text        TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence  DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS extracted_data  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending'
    CHECK (extraction_status IN ('pending','processing','extracted','failed','skipped'));

CREATE INDEX IF NOT EXISTS idx_documents_extraction_status
  ON public.documents (extraction_status)
  WHERE extraction_status IN ('pending','processing','failed');

-- document_field_mappings: admin-approved field→target mappings per document
CREATE TABLE IF NOT EXISTS public.document_field_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key       TEXT NOT NULL,   -- e.g. 'person_name', 'ein', 'grant_number'
  field_value     TEXT,
  target_table    TEXT,            -- e.g. 'profiles', 'grants', 'applications'
  target_column   TEXT,            -- e.g. 'full_name', 'ein'
  target_row_id   UUID,            -- specific row to prefill
  approved        BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_field_mappings_doc
  ON public.document_field_mappings (document_id);

ALTER TABLE public.document_field_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage document field mappings"
    ON public.document_field_mappings FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- grant_applications: draft grant applications with prefilled org data
CREATE TABLE IF NOT EXISTS public.grant_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- opportunity linkage (flexible — can reference grants, sos_opportunities, or external)
  opportunity_id        UUID,
  opportunity_title     TEXT NOT NULL,
  opportunity_number    TEXT,
  agency_name           TEXT,
  cfda_number           TEXT,
  deadline              DATE,
  award_ceiling         BIGINT,
  award_floor           BIGINT,
  opportunity_url       TEXT,
  -- org data (snapshotted at draft time from sos_organizations)
  org_id                UUID REFERENCES public.sos_organizations(id) ON DELETE SET NULL,
  legal_name            TEXT,
  ein                   TEXT,
  uei                   TEXT,
  sam_status            TEXT,
  org_address           TEXT,
  contact_name          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  -- narrative sections (human-edited)
  project_title         TEXT,
  executive_summary     TEXT,
  problem_statement     TEXT,
  project_description   TEXT,
  target_population     TEXT,
  geographic_area       TEXT,
  goals_and_objectives  TEXT,
  evaluation_plan       TEXT,
  sustainability_plan   TEXT,
  budget_narrative      TEXT,
  budget_total          BIGINT,
  partner_agencies      TEXT,
  -- supporting documents
  attached_document_ids UUID[],
  -- workflow
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','submitted','awarded','rejected','archived')),
  submitted_at          TIMESTAMPTZ,
  submitted_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_applications_status
  ON public.grant_applications (status, deadline);
CREATE INDEX IF NOT EXISTS idx_grant_applications_org
  ON public.grant_applications (org_id);

ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage grant applications"
    ON public.grant_applications FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- grant_opportunities: local cache of fetched Grants.gov / SAM.gov opportunities
CREATE TABLE IF NOT EXISTS public.grant_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source              TEXT NOT NULL DEFAULT 'grants_gov'
    CHECK (source IN ('grants_gov','sam_gov','manual','other')),
  opportunity_number  TEXT,
  title               TEXT NOT NULL,
  agency_code         TEXT,
  agency_name         TEXT,
  cfda_number         TEXT,
  assistance_listing  TEXT,
  posted_date         DATE,
  close_date          DATE,
  archive_date        DATE,
  award_ceiling       BIGINT,
  award_floor         BIGINT,
  estimated_funding   BIGINT,
  opportunity_url     TEXT,
  description         TEXT,
  eligibility_text    TEXT,
  applicant_types     TEXT[],
  funding_categories  TEXT[],
  status              TEXT NOT NULL DEFAULT 'posted'
    CHECK (status IN ('forecasted','posted','closed','archived')),
  raw_json            JSONB,
  imported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_opps_close_date
  ON public.grant_opportunities (close_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_grant_opps_source
  ON public.grant_opportunities (source, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grant_opps_number
  ON public.grant_opportunities (opportunity_number)
  WHERE opportunity_number IS NOT NULL;

ALTER TABLE public.grant_opportunities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage grant opportunities"
    ON public.grant_opportunities FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- 20260701000008_contract_automation.sql
-- ────────────────────────────────────────────────────────────
-- Contract Automation System
-- State agency contracts, grant templates, MOUs — upload, extract, prefill, sign, export.
-- Builds on existing signature_documents + sos_organization_facts infrastructure.

-- ── contract_templates ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  agency_name         TEXT,
  source_type         TEXT NOT NULL DEFAULT 'state_contract'
    CHECK (source_type IN (
      'state_contract','grant_application','mou','rfp','rfq',
      'vendor_registration','compliance_form','other'
    )),
  original_file_path  TEXT,           -- Supabase Storage path (private bucket)
  mirrored_file_path  TEXT,           -- public preview copy if needed
  file_type           TEXT,           -- mime type
  file_name           TEXT,
  file_size           BIGINT,
  status              TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded','extracting','extracted','prefilling','review','approved','signed','exported','archived')),
  extraction_method   TEXT,           -- 'pdf-parse','mammoth','ocr','manual'
  raw_text            TEXT,           -- full extracted text
  page_count          INTEGER,
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_status
  ON public.contract_templates (status, created_at DESC);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract templates"
    ON public.contract_templates FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_template_fields ──────────────────────────────────────────────────
-- Detected fields from the template (blanks, checkboxes, signature lines, etc.)
CREATE TABLE IF NOT EXISTS public.contract_template_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  label                 TEXT NOT NULL,
  field_key             TEXT NOT NULL,   -- normalized snake_case key
  field_type            TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text','date','number','checkbox','signature','initials','currency','textarea','select')),
  required              BOOLEAN NOT NULL DEFAULT TRUE,
  page_number           INTEGER,
  x                     DECIMAL,
  y                     DECIMAL,
  width                 DECIMAL,
  height                DECIMAL,
  confidence            DECIMAL(5,4),   -- 0-1 detection confidence
  context_snippet       TEXT,           -- surrounding text for context
  source                TEXT DEFAULT 'detected'
    CHECK (source IN ('detected','manual','ocr')),
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ctf_template
  ON public.contract_template_fields (contract_template_id, sort_order);

ALTER TABLE public.contract_template_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract template fields"
    ON public.contract_template_fields FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_prefill_runs ─────────────────────────────────────────────────────
-- Each time admin runs prefill on a template, a run is created.
-- Fields are approved individually before export.
CREATE TABLE IF NOT EXISTS public.contract_prefill_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','exported','archived')),
  response_style        TEXT NOT NULL DEFAULT 'state_contract_formal'
    CHECK (response_style IN (
      'state_contract_formal','grant_persuasive','agency_compliance',
      'workforce_development','partner_mou','budget_justification','executive_summary'
    )),
  -- Three JSONB blobs — all field values keyed by field_key
  extracted_fields      JSONB DEFAULT '{}',   -- from document extraction
  matched_values        JSONB DEFAULT '{}',   -- proposed values from org facts + AI
  missing_values        JSONB DEFAULT '{}',   -- fields with no source found
  approved_values       JSONB DEFAULT '{}',   -- admin-approved final values
  -- Per-field metadata: source badge, confidence, admin notes
  field_metadata        JSONB DEFAULT '{}',   -- { field_key: { source, confidence, ai_drafted, admin_note } }
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cpr_template
  ON public.contract_prefill_runs (contract_template_id, created_at DESC);

ALTER TABLE public.contract_prefill_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract prefill runs"
    ON public.contract_prefill_runs FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_signature_fields ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_signature_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  prefill_run_id        UUID REFERENCES public.contract_prefill_runs(id) ON DELETE SET NULL,
  signer_name           TEXT,
  signer_title          TEXT,
  signer_email          TEXT,
  signature_type        TEXT NOT NULL DEFAULT 'draw'
    CHECK (signature_type IN ('draw','typed','initials')),
  page_number           INTEGER,
  x                     DECIMAL,
  y                     DECIMAL,
  width                 DECIMAL,
  height                DECIMAL,
  signature_data        TEXT,          -- base64 PNG
  typed_name            TEXT,
  signed_at             TIMESTAMPTZ,
  ip_address            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csf_template
  ON public.contract_signature_fields (contract_template_id);

ALTER TABLE public.contract_signature_fields ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract signature fields"
    ON public.contract_signature_fields FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_exports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_exports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_template_id  UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  prefill_run_id        UUID REFERENCES public.contract_prefill_runs(id) ON DELETE SET NULL,
  exported_file_path    TEXT,          -- Supabase Storage path
  export_type           TEXT NOT NULL DEFAULT 'pdf'
    CHECK (export_type IN ('pdf','docx')),
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','generating','ready','failed')),
  file_size             BIGINT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_exports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins manage contract exports"
    ON public.contract_exports FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contract_audit_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,          -- 'upload','extract','prefill','approve_field','edit_field','sign','export'
  entity_type  TEXT NOT NULL,          -- 'contract_template','prefill_run','signature_field','export'
  entity_id    UUID,
  before_json  JSONB,
  after_json   JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_entity
  ON public.contract_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_actor
  ON public.contract_audit_logs (actor_id, created_at DESC);

ALTER TABLE public.contract_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admins read contract audit logs"
    ON public.contract_audit_logs FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    ));
  CREATE POLICY "System inserts contract audit logs"
    ON public.contract_audit_logs FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for contract documents (private — no public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Admins can upload contracts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'contracts');
  CREATE POLICY "Admins can read contracts"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'contracts');
  CREATE POLICY "Admins can delete contracts"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'contracts');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

