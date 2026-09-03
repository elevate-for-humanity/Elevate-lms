-- FSSA SNAP Employment & Training (SNAP-ET) program management system.
-- Tracks participants, attendance, budget, and program components for
-- the Indiana FSSA SNAP-ET contract administered by Elevate for Humanity.
-- Apply in Supabase Dashboard → SQL Editor

-- ── SNAP-ET Participants ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_participants (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  first_name            TEXT        NOT NULL,
  last_name             TEXT        NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  date_of_birth         DATE,
  ssn_last4             TEXT,       -- last 4 digits only, for matching

  -- FSSA / SNAP eligibility
  case_number           TEXT,       -- FSSA case number
  county                TEXT,
  snap_eligible         BOOLEAN     NOT NULL DEFAULT true,
  snap_et_enrolled_at   TIMESTAMPTZ,
  snap_et_exited_at     TIMESTAMPTZ,
  exit_reason           TEXT        CHECK (exit_reason IN (
                          'employed', 'training_complete', 'voluntary_exit',
                          'non_compliance', 'ineligible', 'other'
                        )),

  -- Program placement
  program_id            UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  cohort_id             UUID,
  enrollment_status     TEXT        NOT NULL DEFAULT 'active'
                          CHECK (enrollment_status IN ('pending','active','completed','exited')),

  -- Employment outcomes
  employed_at_exit      BOOLEAN,
  employer_name         TEXT,
  hourly_wage           NUMERIC(8,2),
  hours_per_week        INT,
  job_title             TEXT,
  employment_start_date DATE,

  -- Barriers to employment (FSSA required fields)
  barriers              JSONB       DEFAULT '[]',  -- array of barrier codes
  support_services      JSONB       DEFAULT '[]',  -- array of services provided

  -- Notes
  case_notes            TEXT,
  intake_completed_at   TIMESTAMPTZ,
  intake_staff_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_participants_program    ON public.fssa_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_status     ON public.fssa_participants(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_county     ON public.fssa_participants(county);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_created_at ON public.fssa_participants(created_at DESC);

-- ── Attendance ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_attendance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  session_date    DATE        NOT NULL,
  session_type    TEXT        NOT NULL DEFAULT 'training'
                    CHECK (session_type IN ('orientation','training','lab','job_search','support','other')),
  hours_attended  NUMERIC(4,2) NOT NULL DEFAULT 0,
  present         BOOLEAN     NOT NULL DEFAULT true,
  excused         BOOLEAN     NOT NULL DEFAULT false,
  notes           TEXT,
  recorded_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_attendance_participant ON public.fssa_attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_date       ON public.fssa_attendance(session_date DESC);

-- ── Budget Tracking ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_budget (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  fiscal_year     TEXT        NOT NULL,   -- e.g. 'FY2026'
  quarter         TEXT        CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  category        TEXT        NOT NULL,   -- 'personnel','training','support_services','admin','other'
  line_item       TEXT        NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expended_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  encumbered      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  entered_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_budget_fiscal_year ON public.fssa_budget(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_fssa_budget_category    ON public.fssa_budget(category);

-- ── Program Components ────────────────────────────────────────────────────────
-- Tracks the required SNAP-ET program components (job search, training, etc.)
-- and participant assignments to each component.

CREATE TABLE IF NOT EXISTS public.fssa_program_components (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  component_type  TEXT        NOT NULL
                    CHECK (component_type IN (
                      'job_search','job_search_training','vocational_training',
                      'work_experience','community_service','education',
                      'self_employment','job_retention','other'
                    )),
  start_date      DATE        NOT NULL,
  end_date        DATE,
  required_hours  INT,
  completed_hours INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending','active','completed','exempted','sanctioned')),
  provider_name   TEXT,
  notes           TEXT,
  assigned_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_components_participant ON public.fssa_program_components(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_components_type        ON public.fssa_program_components(component_type);
CREATE INDEX IF NOT EXISTS idx_fssa_components_status      ON public.fssa_program_components(status);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.fssa_participants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_budget             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_program_components ENABLE ROW LEVEL SECURITY;

-- Admin/staff read all
DROP policy if exists fssa_participants_admin_read on public.fssa_participants;
CREATE policy fssa_participants_admin_read on public.fssa_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_participants_admin_write on public.fssa_participants;
CREATE policy fssa_participants_admin_write on public.fssa_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_attendance_admin_read on public.fssa_attendance;
CREATE policy fssa_attendance_admin_read on public.fssa_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_attendance_admin_write on public.fssa_attendance;
CREATE policy fssa_attendance_admin_write on public.fssa_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_budget_admin_read on public.fssa_budget;
CREATE policy fssa_budget_admin_read on public.fssa_budget
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_budget_admin_write on public.fssa_budget;
CREATE policy fssa_budget_admin_write on public.fssa_budget
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_components_admin_read on public.fssa_program_components;
CREATE policy fssa_components_admin_read on public.fssa_program_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_components_admin_write on public.fssa_program_components;
CREATE policy fssa_components_admin_write on public.fssa_program_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at_fssa()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fssa_participants_updated_at ON public.fssa_participants;
CREATE TRIGGER fssa_participants_updated_at
  BEFORE UPDATE ON public.fssa_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

DROP TRIGGER IF EXISTS fssa_budget_updated_at ON public.fssa_budget;
CREATE TRIGGER fssa_budget_updated_at
  BEFORE UPDATE ON public.fssa_budget
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

DROP TRIGGER IF EXISTS fssa_components_updated_at ON public.fssa_program_components;
CREATE TRIGGER fssa_components_updated_at
  BEFORE UPDATE ON public.fssa_program_components
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

