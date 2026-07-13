-- Adds columns the /api/wioa/iep route writes that are absent from the
-- baseline stub. The live table uses text[] arrays; we add the JSONB/text
-- columns the API expects alongside the existing ones.

ALTER TABLE public.individual_employment_plans
  -- API writes user_id (not participant_id) — add as alias FK
  ADD COLUMN IF NOT EXISTS user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- API column names that differ from baseline stub
  ADD COLUMN IF NOT EXISTS career_goal          text,
  ADD COLUMN IF NOT EXISTS employment_goal      text,
  ADD COLUMN IF NOT EXISTS education_level      text,
  ADD COLUMN IF NOT EXISTS work_experience      jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS skills               jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS barriers             jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS strengths            jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS training_needs       jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS support_services_needed jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS target_occupation    text,
  ADD COLUMN IF NOT EXISTS target_industry      text,
  ADD COLUMN IF NOT EXISTS target_wage          numeric(8,2),
  ADD COLUMN IF NOT EXISTS target_completion_date date,
  ADD COLUMN IF NOT EXISTS milestones           jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status               text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','completed','cancelled')),
  ADD COLUMN IF NOT EXISTS notes                text,

  -- Case manager / reviewer
  ADD COLUMN IF NOT EXISTS case_manager_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes         text,

  -- Linked WIOA participant record
  ADD COLUMN IF NOT EXISTS wioa_participant_id  uuid REFERENCES public.wioa_participants(id) ON DELETE SET NULL;

-- Backfill user_id from participant_id where possible
UPDATE public.individual_employment_plans iep
  SET user_id = wp.user_id
  FROM public.wioa_participants wp
  WHERE iep.participant_id = wp.id
    AND iep.user_id IS NULL;

-- Primary key guard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.individual_employment_plans'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.individual_employment_plans ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_iep_user_id
  ON public.individual_employment_plans(user_id);

CREATE INDEX IF NOT EXISTS idx_iep_participant_id
  ON public.individual_employment_plans(participant_id);

CREATE INDEX IF NOT EXISTS idx_iep_status
  ON public.individual_employment_plans(status);

CREATE INDEX IF NOT EXISTS idx_iep_case_manager_id
  ON public.individual_employment_plans(case_manager_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_iep_updated_at ON public.individual_employment_plans;
CREATE TRIGGER trg_iep_updated_at
  BEFORE UPDATE ON public.individual_employment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.individual_employment_plans ENABLE ROW LEVEL SECURITY;

-- Admin / staff: full access
DROP POLICY IF EXISTS "iep_admin_all" ON public.individual_employment_plans;
DO $$ BEGIN CREATE POLICY "iep_admin_all" ON public.individual_employment_plans FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff','advisor')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Participant: read own IEPs only
DROP POLICY IF EXISTS "iep_own_read" ON public.individual_employment_plans;
DO $$ BEGIN CREATE POLICY "iep_own_read" ON public.individual_employment_plans FOR SELECT TO authenticated
  USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
