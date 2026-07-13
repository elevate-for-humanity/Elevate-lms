-- Fix RLS on job_postings and job_applications.
--
-- Previous policies allowed any authenticated user to read all rows
-- (auth_read_job_postings / auth_read_job_applications with qual=true).
-- Replaced with employer-scoped policies so each employer only sees their own data.

-- job_postings: employers own their postings; public sees active only
DROP POLICY IF EXISTS auth_read_job_postings  ON public.job_postings;
DROP POLICY IF EXISTS job_public_policy       ON public.job_postings;

DO $$ BEGIN CREATE POLICY employer_own_postings ON public.job_postings
  FOR ALL
  USING  (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY public_active_jobs ON public.job_postings
  FOR SELECT
  USING (status = 'active'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- job_applications: applicants own their rows; employers see apps for their jobs only
DROP POLICY IF EXISTS auth_read_job_applications          ON public.job_applications;
DROP POLICY IF EXISTS "Users can manage own applications" ON public.job_applications;
DROP POLICY IF EXISTS application_user_policy             ON public.job_applications;

DO $$ BEGIN CREATE POLICY applicant_own ON public.job_applications
  FOR ALL
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY employer_see_own_job_apps ON public.job_applications
  FOR SELECT
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings WHERE employer_id = auth.uid()
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
