-- Consolidated fix for 81 failed migrations.
-- Covers: inline UNIQUE syntax → CREATE UNIQUE INDEX, missing tables,
-- missing columns, content type fixes, and seed data gaps.

-- ============================================================
-- 1. FSSA SNAP-ET system (fssa_snap_et_system failed on inline UNIQUE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fssa_participants (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name            TEXT        NOT NULL,
  last_name             TEXT        NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  date_of_birth         DATE,
  ssn_last4             TEXT,
  case_number           TEXT,
  county                TEXT,
  snap_eligible         BOOLEAN     NOT NULL DEFAULT true,
  snap_et_enrolled_at   TIMESTAMPTZ,
  snap_et_exited_at     TIMESTAMPTZ,
  exit_reason           TEXT        CHECK (exit_reason IN ('employed','training_complete','voluntary_exit','non_compliance','ineligible','other')),
  program_id            UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  cohort_id             UUID,
  enrollment_status     TEXT        NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('pending','active','completed','exited')),
  employed_at_exit      BOOLEAN,
  employer_name         TEXT,
  hourly_wage           NUMERIC(8,2),
  hours_per_week        INT,
  job_title             TEXT,
  employment_start_date DATE,
  barriers              JSONB       DEFAULT '[]',
  support_services      JSONB       DEFAULT '[]',
  case_notes            TEXT,
  intake_completed_at   TIMESTAMPTZ,
  intake_staff_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_participants_program    ON public.fssa_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_status     ON public.fssa_participants(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_county     ON public.fssa_participants(county);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_created_at ON public.fssa_participants(created_at DESC);

CREATE TABLE IF NOT EXISTS public.fssa_attendance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  session_date    DATE        NOT NULL,
  session_type    TEXT        NOT NULL DEFAULT 'training' CHECK (session_type IN ('orientation','training','lab','job_search','support','other')),
  hours_attended  NUMERIC(4,2) NOT NULL DEFAULT 0,
  present         BOOLEAN     NOT NULL DEFAULT true,
  excused         BOOLEAN     NOT NULL DEFAULT false,
  notes           TEXT,
  recorded_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fssa_attendance_unique ON public.fssa_attendance(participant_id, session_date, session_type);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_participant ON public.fssa_attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_date       ON public.fssa_attendance(session_date DESC);

CREATE TABLE IF NOT EXISTS public.fssa_budget (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fiscal_year     TEXT        NOT NULL,
  quarter         TEXT        CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  category        TEXT        NOT NULL,
  line_item       TEXT        NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expended_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  encumbered      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  entered_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.fssa_program_components (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  component_type  TEXT        NOT NULL CHECK (component_type IN ('job_search','job_search_training','vocational_training','work_experience','community_service','education','self_employment','job_retention','other')),
  start_date      DATE        NOT NULL,
  end_date        DATE,
  hours_required  NUMERIC(6,2),
  hours_completed NUMERIC(6,2) DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','withdrawn')),
  notes           TEXT
);

-- ============================================================
-- 2. fssa_participants exit columns (depends on table above)
-- ============================================================
ALTER TABLE public.fssa_participants
  ADD COLUMN IF NOT EXISTS credential_attained        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS credential_type            text,
  ADD COLUMN IF NOT EXISTS credential_issued_at       timestamptz,
  ADD COLUMN IF NOT EXISTS abawd_exempt               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS abawd_exemption_reason     text,
  ADD COLUMN IF NOT EXISTS abawd_work_hours_met       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS exit_interview_completed   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS exit_interview_at          timestamptz,
  ADD COLUMN IF NOT EXISTS exit_interview_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exit_notes                 text,
  ADD COLUMN IF NOT EXISTS q2_followup_date           date,
  ADD COLUMN IF NOT EXISTS q2_followup_completed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS q2_employed                boolean,
  ADD COLUMN IF NOT EXISTS q2_wage                    numeric(8,2),
  ADD COLUMN IF NOT EXISTS q4_followup_date           date,
  ADD COLUMN IF NOT EXISTS q4_followup_completed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS q4_employed                boolean,
  ADD COLUMN IF NOT EXISTS q4_wage                    numeric(8,2);

-- ============================================================
-- 3. Barber tables (inline UNIQUE → CREATE UNIQUE INDEX)
-- ============================================================

-- barber_hour_ledger already exists but may be missing created_at
ALTER TABLE public.barber_hour_ledger
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_hour_ledger_user_program
  ON public.barber_hour_ledger(user_id, program_id);

-- barber_training_sessions (barber_session_tracking — generation expression fix)
CREATE TABLE IF NOT EXISTS public.barber_training_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  shop_id         UUID,
  session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  clock_in        TIMESTAMPTZ,
  clock_out       TIMESTAMPTZ,
  duration_hours  NUMERIC(5,2),
  session_type    TEXT        NOT NULL DEFAULT 'ojt' CHECK (session_type IN ('ojt','theory','practical','observation')),
  supervisor_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  verified        BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_user    ON public.barber_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_date    ON public.barber_training_sessions(session_date DESC);

-- barber_practical_categories + barber_student_practicals
CREATE TABLE IF NOT EXISTS public.barber_practical_categories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    TEXT        NOT NULL,
  label           TEXT        NOT NULL,
  description     TEXT,
  required_count  INT         NOT NULL DEFAULT 1,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_practical_cat_key
  ON public.barber_practical_categories(category_key);

CREATE TABLE IF NOT EXISTS public.barber_student_practicals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  category_key    TEXT        NOT NULL,
  completed_count INT         NOT NULL DEFAULT 0,
  required_count  INT         NOT NULL DEFAULT 1,
  last_completed  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_student_practicals_unique
  ON public.barber_student_practicals(user_id, program_id, category_key);

CREATE TABLE IF NOT EXISTS public.barber_practical_submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key    TEXT        NOT NULL,
  session_id      UUID        REFERENCES public.barber_training_sessions(id) ON DELETE SET NULL,
  instructor_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  score           INT,
  passed          BOOLEAN,
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- barber_completions
CREATE TABLE IF NOT EXISTS public.barber_completions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_hours     NUMERIC(7,2),
  theory_hours    NUMERIC(7,2),
  practical_hours NUMERIC(7,2),
  checkpoints_passed INT,
  practicals_passed  INT,
  certificate_id  UUID,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_completions_unique
  ON public.barber_completions(user_id, program_id);

-- barber_competency_mappings
CREATE TABLE IF NOT EXISTS public.barber_competency_mappings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID        REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  competency_id   TEXT        NOT NULL,
  competency_label TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_competency_mapping_unique
  ON public.barber_competency_mappings(lesson_id, competency_id);

-- ============================================================
-- 4. Missing tables from other failed migrations
-- ============================================================

-- program_exam_ready_rules (exam_ready_system)
CREATE TABLE IF NOT EXISTS public.program_exam_ready_rules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  min_lesson_pct  NUMERIC(5,2) NOT NULL DEFAULT 100,
  min_checkpoint_score INT    NOT NULL DEFAULT 70,
  require_all_checkpoints BOOLEAN NOT NULL DEFAULT true,
  require_lab_signoff BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_exam_ready_rules_program
  ON public.program_exam_ready_rules(program_id);

CREATE TABLE IF NOT EXISTS public.program_competency_domains (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  domain_key      TEXT        NOT NULL,
  label           TEXT        NOT NULL,
  weight          NUMERIC(5,2) DEFAULT 1.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_competency_domains_unique
  ON public.program_competency_domains(program_id, domain_key);

-- exam_fee_payments (certification_pipeline)
CREATE TABLE IF NOT EXISTS public.exam_fee_payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  credential_id   UUID,
  amount_cents    INT         NOT NULL,
  currency        TEXT        NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','waived')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_fee_payments_unique
  ON public.exam_fee_payments(user_id, program_id, credential_id);

-- program_instructors already exists — just ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_instructors_unique
  ON public.program_instructors(instructor_id, program_id);

-- course_lesson_versions already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_lesson_versions_unique
  ON public.course_lesson_versions(lesson_id, version);

-- program_course_links already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_course_links_unique
  ON public.program_course_links(org_id, program_id, course_id);

-- program_course_versions
CREATE TABLE IF NOT EXISTS public.program_course_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  version         INT         NOT NULL DEFAULT 1,
  label           TEXT,
  notes           TEXT,
  published_at    TIMESTAMPTZ,
  published_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_course_versions_unique
  ON public.program_course_versions(program_id, version);

-- occupation_standards already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_occupation_standards_unique
  ON public.occupation_standards(soc_code, source);

-- sfc_leads
CREATE TABLE IF NOT EXISTS public.sfc_leads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  source          TEXT,
  status          TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_email  ON public.sfc_leads(email);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_status ON public.sfc_leads(status);

-- priority_scores
CREATE TABLE IF NOT EXISTS public.priority_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL,
  entity_id       UUID        NOT NULL,
  score           NUMERIC(8,2) NOT NULL DEFAULT 0,
  factors         JSONB       DEFAULT '{}',
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_priority_scores_entity ON public.priority_scores(entity_type, entity_id);

-- integration_configs
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key TEXT        NOT NULL,
  config          JSONB       NOT NULL DEFAULT '{}',
  enabled         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_key
  ON public.integration_configs(integration_key);

-- curriculum_compiler_jobs
CREATE TABLE IF NOT EXISTS public.curriculum_compiler_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  input           JSONB       DEFAULT '{}',
  output          JSONB       DEFAULT '{}',
  error           TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- store_orders
CREATE TABLE IF NOT EXISTS public.store_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  total_cents     INT         NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  items           JSONB       NOT NULL DEFAULT '[]',
  shipping_address JSONB      DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_orders_user   ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);

-- school_application_followups already exists — add missing columns
ALTER TABLE public.school_application_followups
  ADD COLUMN IF NOT EXISTS followup_type TEXT,
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS staff_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- parent_student_links already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_links_unique
  ON public.parent_student_links(parent_id, student_id);

-- ============================================================
-- 5. Missing columns on existing tables
-- ============================================================

-- tutorials: add is_published (tutorials_table failed on this)
ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS content     TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_index INT      NOT NULL DEFAULT 0;

-- app_secrets: add description as alias for note column
ALTER TABLE public.app_secrets
  ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE public.app_secrets SET description = note WHERE description IS NULL AND note IS NOT NULL;

-- stripe_webhook_events: add retry columns
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS retry_count   INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error    TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- direct_messages: add user_id (backfill from sender_id)
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.direct_messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- ============================================================
-- 6. mou_default_template — insert default if none exists
-- ============================================================
ALTER TABLE public.mou_templates
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.mou_templates (name, version, content, is_default, created_at)
SELECT
  'Standard Training Provider MOU',
  '2',
  'This Memorandum of Understanding is entered into between Elevate for Humanity and the Training Provider named herein.',
  true,
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.mou_templates WHERE is_default = true);

-- ============================================================
-- 7. workforce_referrals — applicant_email column
-- ============================================================
ALTER TABLE public.workforce_referrals
  ADD COLUMN IF NOT EXISTS applicant_email TEXT,
  ADD COLUMN IF NOT EXISTS applicant_name  TEXT,
  ADD COLUMN IF NOT EXISTS applicant_phone TEXT;

-- ============================================================
-- 8. publish_hvac_program — set category to avoid NOT NULL fail
-- ============================================================
UPDATE public.programs
SET category = 'trades'
WHERE slug = 'hvac-technician' AND (category IS NULL OR category = '');

-- ============================================================
-- 9. applications_payment_columns — fix text=uuid cast
-- ============================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- ============================================================
-- 10. sync_hvac_course_lessons — fix lesson_type/step_type cast
-- ============================================================
-- Ensure step_type_enum includes all lesson_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'step_type_enum'::regtype
    AND enumlabel = 'lesson'
  ) THEN
    ALTER TYPE step_type_enum ADD VALUE IF NOT EXISTS 'lesson';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 11. RLS policies for tables that need them (policy-exists errors
--     mean the table IS live and policies ARE correct — skip)
-- ============================================================

-- ============================================================
-- 12. CMI tables — inline UNIQUE fix
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_cmi_attendance_unique
  ON public.cmi_attendance(student_id, date);

-- ============================================================
-- 13. Accreditation system
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accreditation_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  body            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked')),
  issued_at       DATE,
  expires_at      DATE,
  certificate_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. automation_triggers table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_triggers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key     TEXT        NOT NULL,
  event_type      TEXT        NOT NULL,
  conditions      JSONB       DEFAULT '{}',
  actions         JSONB       DEFAULT '[]',
  enabled         BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_triggers_key
  ON public.automation_triggers(trigger_key);

-- ============================================================
-- 15. video_jobs — ensure provider column exists
-- ============================================================
ALTER TABLE public.video_jobs
  ADD COLUMN IF NOT EXISTS provider    TEXT NOT NULL DEFAULT 'heygen',
  ADD COLUMN IF NOT EXISTS provider_job_id TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT;

