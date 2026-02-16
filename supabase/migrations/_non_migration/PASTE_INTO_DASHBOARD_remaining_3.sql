-- ============================================================
-- ELEVATE LMS — 3 Remaining Migrations (run in Supabase SQL Editor)
-- Order: 1) State columns  2) Intake buffer  3) Seal inserts
-- ============================================================

-- Add enrollment state machine columns to program_enrollments.
-- These columns are referenced by:
--   app/api/enrollment/documents/complete/route.ts
--   app/api/enrollment/orientation/complete/route.ts
--   app/enrollment/documents/page.tsx
--   app/enrollment/confirmed/page.tsx
--   app/enrollment/orientation/page.tsx
--   app/programs/barber-apprenticeship/*/layout.tsx
--   app/programs/nail-technician-apprenticeship/*/layout.tsx

BEGIN;

-- 1. State machine column
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_state text DEFAULT 'applied';

-- 2. Timestamp columns for each state transition
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;

-- 3. Next action hint for the frontend
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS next_required_action text;

-- 4. Backfill: set enrollment_state from existing status where possible
UPDATE public.program_enrollments
  SET enrollment_state = CASE
    WHEN status = 'ACTIVE' THEN 'active'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'completed' THEN 'active'
    WHEN status = 'pending' THEN 'applied'
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'applied'
    ELSE 'applied'
  END
WHERE enrollment_state IS NULL OR enrollment_state = 'applied';

-- 5. Index for state queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_state
  ON public.program_enrollments (enrollment_state);

-- 6. Student UPDATE policy so the API routes can advance state
-- (The server-side createClient uses the user's JWT, so RLS applies)
DROP POLICY IF EXISTS "Students can update own program enrollments" ON public.program_enrollments;
CREATE POLICY "Students can update own program enrollments"
  ON public.program_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;

-- application_intake: universal secure buffer for anonymous public submissions.
-- All public form submissions land here. A processor function validates,
-- resolves tenant_id from program_id, and inserts into the correct
-- workflow table (student_applications, employer_applications, etc.).
--
-- Only service_role can read/write this table.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Create the intake buffer table
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_intake (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),

  application_type    text NOT NULL,                          -- e.g. 'student', 'employer', 'career'
  program_id          uuid,                                   -- optional; validated against programs.id

  -- Raw public payload (all submitted fields, allowlisted by Edge Function)
  payload             jsonb NOT NULL,

  -- Routing / tenancy (derived server-side during processing)
  resolved_tenant_id  uuid,

  -- Lifecycle
  status              text NOT NULL DEFAULT 'received',       -- received | processed | rejected
  processed_at        timestamptz,
  error               text,                                   -- populated on processing failure

  -- Metadata
  ip_address          inet,
  user_agent          text,
  source              text NOT NULL DEFAULT 'public_form',    -- public_form | api | import
  destination_table   text,                                   -- set after successful processing
  destination_id      uuid                                    -- FK to the row created in workflow table
);

-- ────────────────────────────────────────────────────────────────
-- 2. Indexes
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_type       ON public.application_intake (application_type);
CREATE INDEX IF NOT EXISTS idx_intake_status     ON public.application_intake (status);
CREATE INDEX IF NOT EXISTS idx_intake_created    ON public.application_intake (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_program    ON public.application_intake (program_id);
CREATE INDEX IF NOT EXISTS idx_intake_ip_created ON public.application_intake (ip_address, created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- 3. RLS — service_role only (explicit deny-all for anon/authenticated)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.application_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_intake_service_only_insert"
  ON public.application_intake
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_select"
  ON public.application_intake
  FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_update"
  ON public.application_intake
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin read access for staff dashboard
CREATE POLICY "application_intake_admin_read"
  ON public.application_intake
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Rate-limit helper: count recent submissions from an IP
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.intake_rate_check(
  p_ip inet,
  p_window_minutes int DEFAULT 15,
  p_max_submissions int DEFAULT 5
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) < p_max_submissions
  FROM application_intake
  WHERE ip_address = p_ip
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
$$;

REVOKE ALL ON FUNCTION public.intake_rate_check(inet, int, int) FROM PUBLIC;

-- ────────────────────────────────────────────────────────────────
-- 5. Comments
-- ────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.application_intake
  IS 'Universal intake buffer for anonymous public form submissions. Processed into workflow tables by process-intake.';
COMMENT ON COLUMN public.application_intake.application_type
  IS 'Maps to a destination workflow table via the routing config in the Edge Function.';
COMMENT ON COLUMN public.application_intake.payload
  IS 'Raw submitted fields. Allowlisted by the Edge Function before insert.';
COMMENT ON COLUMN public.application_intake.resolved_tenant_id
  IS 'Derived from programs.tenant_id when program_id is provided. Set during processing.';
COMMENT ON COLUMN public.application_intake.status
  IS 'received → processed | rejected';

COMMIT;

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
