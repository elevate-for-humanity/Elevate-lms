-- Converts enrollment bypass from detective to partially preventive control.
--
-- Changes:
--   1. bypass_allowlist: adds ticket_ref, scope, created_by columns
--   2. audit_enrollment_insert trigger: hard-fail on invariant violation + pg_notify
--   3. health_check_log table: deadman tracking for health route invocation
--
-- Hard-fail rule (enforced in trigger, not application code):
--   via_rpc=false AND invariant_violated=true AND NOT allowlisted
--   → INSERT is REJECTED with UNAUTHORIZED_ENROLLMENT_WRITE
--
-- This closes the highest-risk path: a privileged writer that also breaks
-- the program_id binding invariant cannot create a bad row, even with service_role.
-- A privileged writer that preserves the invariant is still allowed but audited
-- and emits a pg_notify('enrollment_bypass', ...) for real-time listeners.
--
-- Allowlisted writes (active, non-expired entry in enrollment_bypass_allowlist)
-- bypass the hard-fail but are still audited and still emit pg_notify.
--
-- health_check_log records every invocation of the enrollment health route.
-- The route alerts if the gap since the last run exceeds 2 hours, making
-- the detection chain itself observable.

-- ── bypass_allowlist: add change-control fields ───────────────────────────────
ALTER TABLE public.enrollment_bypass_allowlist
  ADD COLUMN IF NOT EXISTS ticket_ref  TEXT,
  ADD COLUMN IF NOT EXISTS scope       TEXT,
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES public.profiles(id);

-- ── audit trigger: hard-fail + pg_notify ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
DECLARE
  v_via_rpc            BOOLEAN;
  v_allowlisted        BOOLEAN := FALSE;
  v_invariant_violated BOOLEAN := FALSE;
  v_ap_program_id      UUID;
  v_payload            TEXT;
BEGIN
  v_via_rpc := current_user = 'postgres';

  SELECT id INTO v_ap_program_id
  FROM public.apprenticeship_programs
  WHERE slug = NEW.program_slug
  LIMIT 1;

  IF NOT v_via_rpc THEN
    SELECT EXISTS (
      SELECT 1 FROM public.enrollment_bypass_allowlist
      WHERE db_user    = current_user
      AND   active_from <= NOW()
      AND   sunset_at   >  NOW()
    ) INTO v_allowlisted;

    IF NEW.program_id IS NULL
       OR v_ap_program_id IS NULL
       OR NEW.program_id <> v_ap_program_id
    THEN
      v_invariant_violated := TRUE;
    END IF;

    -- Hard-fail: unauthorized write with invariant violation is rejected
    IF v_invariant_violated AND NOT v_allowlisted THEN
      RAISE EXCEPTION
        'UNAUTHORIZED_ENROLLMENT_WRITE: direct insert on program_enrollments with invariant violation rejected. program_slug=%, db_user=%. Register in enrollment_bypass_allowlist if this is an approved maintenance operation.',
        NEW.program_slug, current_user
        USING ERRCODE = 'P0001';
    END IF;

    -- Write-time signal for all non-RPC writes (decoupled from health-check cadence)
    v_payload := json_build_object(
      'enrollment_id',      NEW.id,
      'program_slug',       NEW.program_slug,
      'db_user',            current_user,
      'allowlisted',        v_allowlisted,
      'invariant_violated', v_invariant_violated,
      'ts',                 extract(epoch from NOW())
    )::text;
    PERFORM pg_notify('enrollment_bypass', v_payload);
  END IF;

  INSERT INTO public.enrollment_insert_audit (
    enrollment_id, user_id, program_slug, program_id,
    db_user, pg_session_user, via_rpc,
    invariant_violated, allowlisted
  ) VALUES (
    NEW.id, NEW.user_id, NEW.program_slug, NEW.program_id,
    current_user, session_user, v_via_rpc,
    v_invariant_violated, v_allowlisted
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_enrollment_insert ON public.program_enrollments;

CREATE TRIGGER trg_audit_enrollment_insert
AFTER INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollment_insert();

-- ── health_check_log: deadman tracking ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_log (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route    TEXT        NOT NULL,
  ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clean    BOOLEAN     NOT NULL,
  failures TEXT[]      NOT NULL DEFAULT '{}'
);

ALTER TABLE public.health_check_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_check_log_admin ON public.health_check_log;
CREATE POLICY health_check_log_admin
  ON public.health_check_log FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );
