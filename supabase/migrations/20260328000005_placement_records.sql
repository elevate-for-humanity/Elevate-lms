-- placement_records: tracks employment outcomes for program completers.
-- Used by case manager portal and WIOA reporting.

CREATE TABLE IF NOT EXISTS public.placement_records (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid        REFERENCES programs(id) ON DELETE SET NULL,
  case_manager_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  employer_name       text,
  job_title           text,
  employment_type     text        CHECK (employment_type IN (
                                    'full_time','part_time','contract','apprenticeship','self_employed'
                                  )),
  hourly_wage         numeric(8,2),
  start_date          date,
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','verified','rejected','lost')),
  verified_at         timestamptz,
  verified_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method text        CHECK (verification_method IN (
                                    'employer_contact','pay_stub','offer_letter','self_report'
                                  )),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_placement_records_learner      ON public.placement_records (learner_id);
CREATE INDEX IF NOT EXISTS idx_placement_records_case_manager ON public.placement_records (case_manager_id);
CREATE INDEX IF NOT EXISTS idx_placement_records_status       ON public.placement_records (status);

-- Case managers can read/write placements for their assigned learners.
-- Admins and staff have full access.
CREATE POLICY "case_manager_select" ON public.placement_records
  FOR SELECT USING (
    auth.uid() = case_manager_id
    OR auth.uid() = learner_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "case_manager_insert" ON public.placement_records
  FOR INSERT WITH CHECK (
    auth.uid() = case_manager_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "case_manager_update" ON public.placement_records
  FOR UPDATE USING (
    auth.uid() = case_manager_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "service_role_all" ON public.placement_records
  USING (auth.role() = 'service_role');
