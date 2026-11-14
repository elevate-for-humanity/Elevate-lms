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

DROP POLICY IF EXISTS "application_intake_service_only_insert" ON public.application_intake;
CREATE POLICY "application_intake_service_only_insert"
  ON public.application_intake
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "application_intake_service_only_select" ON public.application_intake;
CREATE POLICY "application_intake_service_only_select"
  ON public.application_intake
  FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "application_intake_service_only_update" ON public.application_intake;
CREATE POLICY "application_intake_service_only_update"
  ON public.application_intake
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin read access for staff dashboard
DROP POLICY IF EXISTS "application_intake_admin_read" ON public.application_intake;
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
