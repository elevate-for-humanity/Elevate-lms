ALTER TABLE public.wotc_applications
  ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applicant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_ssn_last4 text,
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS previously_employed boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS ein text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS student_binder_documents_student_title_uidx
  ON public.student_binder_documents(student_id, title);
