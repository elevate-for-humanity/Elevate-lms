-- Seal all workflow application tables from anonymous/public inserts.
-- After this migration, only service_role can insert into these tables.
-- Public submissions go through application_intake via the public-submit
-- Edge Function.
--
-- Run AFTER 20260216_application_intake.sql

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Drop any existing permissive anon INSERT policies
-- ────────────────────────────────────────────────────────────────

-- applications
DROP POLICY IF EXISTS "service insert" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
REVOKE INSERT ON public.applications FROM anon;

-- career_applications (already blocked by state-machine migration,
-- but ensure no leftover policies)
DROP POLICY IF EXISTS "Users can insert own career applications" ON public.career_applications;

-- student_applications
DROP POLICY IF EXISTS "Anyone can insert student_applications" ON public.student_applications;
DROP POLICY IF EXISTS "Public insert student_applications" ON public.student_applications;
REVOKE INSERT ON public.student_applications FROM anon;

-- employer_applications
DROP POLICY IF EXISTS "Anyone can insert employer_applications" ON public.employer_applications;
DROP POLICY IF EXISTS "Public insert employer_applications" ON public.employer_applications;
REVOKE INSERT ON public.employer_applications FROM anon;

-- staff_applications
DROP POLICY IF EXISTS "Anyone can insert staff_applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Public insert staff_applications" ON public.staff_applications;
REVOKE INSERT ON public.staff_applications FROM anon;

-- partner_applications
DROP POLICY IF EXISTS "Anyone can insert partner_applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Public insert partner_applications" ON public.partner_applications;
REVOKE INSERT ON public.partner_applications FROM anon;

-- barbershop_partner_applications
DROP POLICY IF EXISTS "Anyone can insert barbershop_partner_applications" ON public.barbershop_partner_applications;
DROP POLICY IF EXISTS "Public insert barbershop_partner_applications" ON public.barbershop_partner_applications;
REVOKE INSERT ON public.barbershop_partner_applications FROM anon;

-- program_holder_applications
DROP POLICY IF EXISTS "Anyone can insert program_holder_applications" ON public.program_holder_applications;
DROP POLICY IF EXISTS "Public insert program_holder_applications" ON public.program_holder_applications;
REVOKE INSERT ON public.program_holder_applications FROM anon;

-- shop_applications
DROP POLICY IF EXISTS "Anyone can insert shop_applications" ON public.shop_applications;
DROP POLICY IF EXISTS "Public insert shop_applications" ON public.shop_applications;
REVOKE INSERT ON public.shop_applications FROM anon;

-- affiliate_applications
DROP POLICY IF EXISTS "Anyone can insert affiliate_applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Public insert affiliate_applications" ON public.affiliate_applications;
REVOKE INSERT ON public.affiliate_applications FROM anon;

-- funding_applications
DROP POLICY IF EXISTS "Anyone can insert funding_applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Public insert funding_applications" ON public.funding_applications;
REVOKE INSERT ON public.funding_applications FROM anon;

-- job_applications
DROP POLICY IF EXISTS "Anyone can insert job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public insert job_applications" ON public.job_applications;
REVOKE INSERT ON public.job_applications FROM anon;

-- supersonic_applications
DROP POLICY IF EXISTS "Anyone can insert supersonic_applications" ON public.supersonic_applications;
DROP POLICY IF EXISTS "Public insert supersonic_applications" ON public.supersonic_applications;
REVOKE INSERT ON public.supersonic_applications FROM anon;

-- tax_applications
DROP POLICY IF EXISTS "Anyone can insert tax_applications" ON public.tax_applications;
DROP POLICY IF EXISTS "Public insert tax_applications" ON public.tax_applications;
REVOKE INSERT ON public.tax_applications FROM anon;

-- application_submissions
DROP POLICY IF EXISTS "Anyone can insert application_submissions" ON public.application_submissions;
DROP POLICY IF EXISTS "Public insert application_submissions" ON public.application_submissions;
REVOKE INSERT ON public.application_submissions FROM anon;

-- ────────────────────────────────────────────────────────────────
-- 2. Create service-only INSERT policies for each workflow table
-- ────────────────────────────────────────────────────────────────
-- These ensure only service_role (Edge Functions) can insert.
-- Authenticated users with admin/staff roles manage via RPCs or
-- admin endpoints that use service_role internally.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'applications',
    'career_applications',
    'student_applications',
    'employer_applications',
    'staff_applications',
    'partner_applications',
    'barbershop_partner_applications',
    'program_holder_applications',
    'shop_applications',
    'affiliate_applications',
    'funding_applications',
    'job_applications',
    'supersonic_applications',
    'tax_applications',
    'application_submissions'
  ])
  LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop any existing service-only insert policy to avoid conflicts
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_only_insert" ON public.%I',
      tbl, tbl
    );

    -- Create service-only insert policy
    EXECUTE format(
      'CREATE POLICY "%s_service_only_insert" ON public.%I FOR INSERT TO public WITH CHECK (auth.role() = ''service_role'')',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. Verification query (run manually to confirm)
-- ────────────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd, roles::text
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND cmd = 'INSERT'
--   AND tablename LIKE '%application%'
-- ORDER BY tablename, policyname;

COMMIT;
