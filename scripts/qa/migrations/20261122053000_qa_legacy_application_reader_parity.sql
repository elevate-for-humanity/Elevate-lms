-- Isolated Supabase QA only (elevate-lms-qa, isdgjcdabhxxozarmxta).
-- Root defect: QA staged public.applications omitted legacy classification
-- columns consumed by Admin employer review. Tracking uses normalized_email
-- and must be able to query this table before falling back to intake receipts.
-- Canonical production columns: type text DEFAULT 'student',
-- application_type text NULL. This additive stage never copies production data.
-- No student, approval, enrollment, payment, or document rows are changed.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.tenants') IS NULL
     OR to_regclass('public.applications') IS NULL
     OR to_regclass('public.application_intake') IS NULL
     OR to_regclass('public.employer_applications') IS NULL
  THEN
    RAISE EXCEPTION 'QA legacy application reader parity refused: prerequisites absent';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'QA legacy application reader parity refused: isolated QA marker absent';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
      AND column_name = 'normalized_email' AND data_type = 'text'
  )
  OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.applications'::regclass
      AND tgname = 'trg_normalize_application_contact'
      AND NOT tgisinternal AND tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'QA legacy application reader parity refused: email normalization contract absent';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.applications'::regclass)
     OR has_table_privilege('anon', 'public.applications', 'SELECT')
  THEN
    RAISE EXCEPTION 'QA legacy application reader parity refused: application RLS/anonymous boundary unexpected';
  END IF;
END;
$guard$;

-- Keep the old rows classified as student applications unless explicitly
-- reclassified by a governed intake workflow. Do not infer employer approval.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS application_type text;

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
      AND column_name = 'type' AND data_type = 'text'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'applications'
      AND column_name = 'application_type' AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'QA legacy application reader parity failed: reader columns missing';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.applications'::regclass)
     OR has_table_privilege('anon', 'public.applications', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.applications', 'SELECT')
  THEN
    RAISE EXCEPTION 'QA legacy application reader parity failed: authorization boundary changed';
  END IF;
END;
$verify$;

NOTIFY pgrst, 'reload schema';
COMMIT;
