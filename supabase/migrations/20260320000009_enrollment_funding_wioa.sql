-- =============================================================================
-- Phase 9: Enrollment funding eligibility records + WIOA dependency verification
--
-- Adds:
--   1. enrollment_funding_records — structured funding record per enrollment
--   2. Verifies wioa_participants and wioa_participant_records exist
--   3. Repair: creates them if missing (safe, idempotent)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. enrollment_funding_records
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.enrollment_funding_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enrollment_id         UUID NOT NULL,  -- soft ref to program_enrollments
  learner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,

  funding_source        TEXT NOT NULL
    CHECK (funding_source IN (
      'wioa_title_i', 'wioa_title_ii', 'workforce_ready_grant', 'jri',
      'job_ready_indy', 'dol_apprenticeship', 'pell_grant', 'self_pay',
      'employer_sponsored', 'scholarship', 'other'
    )),

  amount_cents          INTEGER,        -- funding amount in cents (nullable if unknown)
  funding_period_start  DATE,
  funding_period_end    DATE,

  approved_by           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at           TIMESTAMPTZ,

  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'disbursed', 'reconciled', 'cancelled')),

  case_manager_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  workone_case_number   TEXT,           -- WorkOne/Indiana DWD case reference
  notes                 TEXT,

  tenant_id             UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_efr_enrollment ON public.enrollment_funding_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_efr_learner    ON public.enrollment_funding_records(learner_id);
CREATE INDEX IF NOT EXISTS idx_efr_program    ON public.enrollment_funding_records(program_id);
CREATE INDEX IF NOT EXISTS idx_efr_source     ON public.enrollment_funding_records(funding_source);
CREATE INDEX IF NOT EXISTS idx_efr_status     ON public.enrollment_funding_records(status);
CREATE INDEX IF NOT EXISTS idx_efr_tenant     ON public.enrollment_funding_records(tenant_id);

DROP TRIGGER IF EXISTS trg_efr_updated_at ON public.enrollment_funding_records;
CREATE TRIGGER trg_efr_updated_at
  BEFORE UPDATE ON public.enrollment_funding_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enrollment_funding_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "efr_admin_all" ON public.enrollment_funding_records;
CREATE POLICY "efr_admin_all" ON public.enrollment_funding_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

DROP POLICY IF EXISTS "efr_case_manager_read" ON public.enrollment_funding_records;
CREATE POLICY "efr_case_manager_read" ON public.enrollment_funding_records
  FOR SELECT USING (
    public.is_case_manager()
    AND learner_id = ANY(public.get_my_assigned_learner_ids())
  );

DROP POLICY IF EXISTS "efr_learner_read_own" ON public.enrollment_funding_records;
CREATE POLICY "efr_learner_read_own" ON public.enrollment_funding_records
  FOR SELECT USING (learner_id = auth.uid());

GRANT SELECT ON public.enrollment_funding_records TO authenticated;
GRANT ALL ON public.enrollment_funding_records TO service_role;

-- =============================================================================
-- 2. WIOA dependency verification + repair
--    The PIRL mapping migration references these tables. Ensure they exist.
-- =============================================================================

-- wioa_participants (canonical WIOA participant record)
CREATE TABLE IF NOT EXISTS public.wioa_participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,

  -- PIRL required fields
  funding_source        TEXT,
  wioa_title            TEXT CHECK (wioa_title IN ('title_i', 'title_ii', 'title_iii', 'title_iv')),
  date_of_participation DATE,
  date_of_exit          DATE,
  exit_reason           TEXT,

  -- Employment outcomes (PIRL quarters)
  employed_q2_after_exit    BOOLEAN,
  employed_q4_after_exit    BOOLEAN,
  median_earnings_q2        NUMERIC(12, 2),
  credential_attainment     BOOLEAN DEFAULT false,
  measurable_skill_gain     BOOLEAN DEFAULT false,

  -- Demographics (PIRL required)
  dob                   DATE,
  gender                TEXT,
  race_ethnicity        TEXT,
  veteran_status        BOOLEAN DEFAULT false,
  disability_status     BOOLEAN DEFAULT false,
  ex_offender           BOOLEAN DEFAULT false,
  low_income            BOOLEAN DEFAULT false,
  english_learner       BOOLEAN DEFAULT false,

  case_manager_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  workone_case_number   TEXT,
  tenant_id             UUID REFERENCES public.tenants(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wp_learner  ON public.wioa_participants(learner_id);
CREATE INDEX IF NOT EXISTS idx_wp_program  ON public.wioa_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_wp_tenant   ON public.wioa_participants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wp_exit     ON public.wioa_participants(date_of_exit);

-- wioa_participant_records (individual PIRL data points per participant)
CREATE TABLE IF NOT EXISTS public.wioa_participant_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id    UUID NOT NULL REFERENCES public.wioa_participants(id) ON DELETE CASCADE,
  field_name        TEXT NOT NULL,   -- PIRL element name
  field_value       TEXT,
  data_source       TEXT,            -- which table/column this was pulled from
  reporting_period  TEXT,            -- e.g. 'PY2025Q2'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wpr_participant ON public.wioa_participant_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_wpr_period      ON public.wioa_participant_records(reporting_period);

ALTER TABLE public.wioa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wioa_participant_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wp_admin_all" ON public.wioa_participants;
CREATE POLICY "wp_admin_all" ON public.wioa_participants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

DROP POLICY IF EXISTS "wpr_admin_all" ON public.wioa_participant_records;
CREATE POLICY "wpr_admin_all" ON public.wioa_participant_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

GRANT SELECT ON public.wioa_participants TO authenticated;
GRANT SELECT ON public.wioa_participant_records TO authenticated;
GRANT ALL ON public.wioa_participants TO service_role;
GRANT ALL ON public.wioa_participant_records TO service_role;

COMMIT;
