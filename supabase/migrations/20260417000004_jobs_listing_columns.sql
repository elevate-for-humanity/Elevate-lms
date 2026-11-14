-- jobs table is a job listings board (not a background queue).
-- Admin /admin/jobs inserts title, company, location, type, salary, requirements, created_by.
-- Add all missing columns so inserts don't silently fail.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS title        text,
  ADD COLUMN IF NOT EXISTS company      text,
  ADD COLUMN IF NOT EXISTS location     text,
  ADD COLUMN IF NOT EXISTS type         text,
  ADD COLUMN IF NOT EXISTS salary_min   numeric,
  ADD COLUMN IF NOT EXISTS salary_max   numeric,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_status     ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs (created_by);
