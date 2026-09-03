-- Fix interviews table: add proper FK columns, enable RLS, add employer isolation.
-- The existing table stores candidate/jobs as text — add UUID FK columns alongside.

-- 1. Add proper FK columns (nullable to avoid breaking existing rows)
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS candidate_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_id        uuid,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS meeting_url   text,
  ADD COLUMN IF NOT EXISTS duration_mins integer DEFAULT 30;

-- 2. Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies before recreating
DROP POLICY IF EXISTS "employers_own_interviews"  ON public.interviews;
DROP POLICY IF EXISTS "candidates_own_interviews" ON public.interviews;
DROP POLICY IF EXISTS "admins_all_interviews"     ON public.interviews;

-- 4. Employers see only their interviews
CREATE POLICY "employers_own_interviews"
  ON public.interviews
  FOR ALL
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Candidates see their own interviews
CREATE POLICY "candidates_own_interviews"
  ON public.interviews
  FOR SELECT
  USING (candidate_id = auth.uid());

-- 6. Admins/staff see all
CREATE POLICY "admins_all_interviews"
  ON public.interviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
    )
  );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS interviews_employer_idx   ON public.interviews (employer_id);
CREATE INDEX IF NOT EXISTS interviews_candidate_idx  ON public.interviews (candidate_id);
CREATE INDEX IF NOT EXISTS interviews_scheduled_idx  ON public.interviews (scheduled_at);

COMMENT ON TABLE public.interviews IS
  'Employer-scheduled candidate interviews. RLS enforces employer/candidate isolation.';
