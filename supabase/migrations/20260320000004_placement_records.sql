-- =============================================================================
-- Phase 2.1: placement_records — first-class employment outcome record
--
-- This is the missing link between training completion and verified employment.
-- Required for WIOA outcome reporting and employer pipeline credibility.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.placement_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationships
  learner_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id         UUID REFERENCES public.employers(id) ON DELETE SET NULL,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  enrollment_id       UUID,  -- soft ref to program_enrollments; no FK to avoid cross-table dep

  -- Employment details
  hire_date           DATE NOT NULL,
  job_title           TEXT NOT NULL,
  employment_type     TEXT NOT NULL DEFAULT 'full_time',
    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'apprenticeship', 'ojt', 'other')),
  hourly_wage         NUMERIC(8, 2),
  annual_salary       NUMERIC(12, 2),

  -- Verification
  verified_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_source TEXT NOT NULL DEFAULT 'self_report',
    CHECK (verification_source IN ('employer', 'case_manager', 'self_report', 'system_import', 'third_party')),
  verified_at         TIMESTAMPTZ,

  status              TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'verified', 'rejected', 'superseded')),

  -- Outcome tracking (WIOA quarters)
  employed_q2         BOOLEAN,   -- employed 2nd quarter after exit
  employed_q4         BOOLEAN,   -- employed 4th quarter after exit
  median_earnings_q2  NUMERIC(12, 2),

  -- Tenant scoping
  tenant_id           UUID REFERENCES public.tenants(id) ON DELETE SET NULL,

  notes               TEXT,
  metadata            JSONB DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pr_learner    ON public.placement_records(learner_id);
CREATE INDEX IF NOT EXISTS idx_pr_employer   ON public.placement_records(employer_id);
CREATE INDEX IF NOT EXISTS idx_pr_program    ON public.placement_records(program_id);
CREATE INDEX IF NOT EXISTS idx_pr_hire_date  ON public.placement_records(hire_date DESC);
CREATE INDEX IF NOT EXISTS idx_pr_tenant     ON public.placement_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pr_status     ON public.placement_records(status);
CREATE INDEX IF NOT EXISTS idx_pr_verified   ON public.placement_records(verification_source, verified_at);

-- updated_at trigger (reuse function from Phase 1.3 if exists)
DROP TRIGGER IF EXISTS trg_pr_updated_at ON public.placement_records;
CREATE TRIGGER trg_pr_updated_at
  BEFORE UPDATE ON public.placement_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;

-- Learners read their own records
DROP POLICY IF EXISTS "pr_learner_read" ON public.placement_records;
CREATE POLICY "pr_learner_read" ON public.placement_records
  FOR SELECT TO authenticated USING (learner_id = auth.uid());

-- Admins/staff manage all
DROP POLICY IF EXISTS "pr_admin_all" ON public.placement_records;
CREATE POLICY "pr_admin_all" ON public.placement_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- provider_admin reads placements for their tenant's learners
DROP POLICY IF EXISTS "pr_provider_admin_read" ON public.placement_records;
CREATE POLICY "pr_provider_admin_read" ON public.placement_records
  FOR SELECT USING (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  );

-- case_manager reads placements for assigned participants
DROP POLICY IF EXISTS "pr_case_manager_read" ON public.placement_records;
CREATE POLICY "pr_case_manager_read" ON public.placement_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'case_manager'
    )
    AND learner_id IN (
      SELECT learner_id FROM public.case_manager_assignments
      WHERE case_manager_id = auth.uid()
    )
  );

-- Employers read placements where they are the employer
DROP POLICY IF EXISTS "pr_employer_read" ON public.placement_records;
CREATE POLICY "pr_employer_read" ON public.placement_records
  FOR SELECT USING (
    employer_id IN (
      SELECT id FROM public.employers WHERE owner_user_id = auth.uid()
    )
  );

GRANT SELECT ON public.placement_records TO authenticated;
GRANT ALL ON public.placement_records TO service_role;

COMMIT;
