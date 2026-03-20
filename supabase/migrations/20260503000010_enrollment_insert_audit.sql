-- Tripwire audit for program_enrollments inserts.
--
-- The direct-insert trigger (trg_block_direct_insert) blocks non-privileged callers.
-- service_role and postgres can still write directly — this is intentional for system
-- execution paths. This migration makes that privileged bypass observable.
--
-- Every INSERT on program_enrollments writes a row to enrollment_insert_audit with:
--   db_user         — current_user at insert time (postgres = RPC, other = bypass)
--   pg_session_user — session_user (authenticator for normal API calls)
--   via_rpc         — true iff db_user = 'postgres' (i.e. SECURITY DEFINER RPC)
--
-- Any row with via_rpc=false is a privileged bypass. The integrity audit
-- (lib/enrollment-integrity-audit.ts) surfaces these as PRIVILEGED_BYPASS_DETECTED.

CREATE TABLE IF NOT EXISTS public.enrollment_insert_audit (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL,
  user_id         UUID,
  program_slug    TEXT,
  db_user         TEXT        NOT NULL,
  pg_session_user TEXT        NOT NULL,
  via_rpc         BOOLEAN     NOT NULL,
  inserted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enrollment_insert_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrollment_insert_audit_admin ON public.enrollment_insert_audit;
CREATE POLICY enrollment_insert_audit_admin
  ON public.enrollment_insert_audit
  FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.enrollment_insert_audit (
    enrollment_id, user_id, program_slug,
    db_user, pg_session_user, via_rpc
  ) VALUES (
    NEW.id, NEW.user_id, NEW.program_slug,
    current_user,
    session_user,
    -- enroll_application RPC runs SECURITY DEFINER owned by postgres
    current_user = 'postgres'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_enrollment_insert ON public.program_enrollments;

CREATE TRIGGER trg_audit_enrollment_insert
AFTER INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollment_insert();
