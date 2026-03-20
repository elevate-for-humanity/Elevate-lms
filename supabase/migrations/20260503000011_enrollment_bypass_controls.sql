-- Enriches enrollment_insert_audit and adds bypass_allowlist with sunset enforcement.
--
-- Changes:
--   1. enrollment_insert_audit: adds program_id, invariant_violated, allowlisted columns
--   2. enrollment_bypass_allowlist: approved maintenance paths with mandatory sunset_at
--   3. audit_enrollment_insert trigger: checks allowlist, computes invariant_violated inline
--
-- Operational contract:
--   via_rpc=false + allowlisted=false  → unauthorized bypass → PRIVILEGED_BYPASS_DETECTED
--   via_rpc=false + allowlisted=true   → approved maintenance → still audited, not alerted
--   invariant_violated=true            → row violates program_id binding invariant
--
-- Sunset enforcement: allowlist entries with sunset_at < NOW() are treated as expired.
-- No permanent allowlist entries are permitted — sunset_at is NOT NULL.

ALTER TABLE public.enrollment_insert_audit
  ADD COLUMN IF NOT EXISTS program_id         UUID,
  ADD COLUMN IF NOT EXISTS invariant_violated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bypass_context     TEXT,
  ADD COLUMN IF NOT EXISTS allowlisted        BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.enrollment_bypass_allowlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL,
  db_user     TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  approved_by UUID        REFERENCES public.profiles(id),
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sunset_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enrollment_bypass_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bypass_allowlist_admin ON public.enrollment_bypass_allowlist;
CREATE POLICY bypass_allowlist_admin
  ON public.enrollment_bypass_allowlist FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
DECLARE
  v_via_rpc            BOOLEAN;
  v_allowlisted        BOOLEAN := FALSE;
  v_invariant_violated BOOLEAN := FALSE;
  v_ap_program_id      UUID;
BEGIN
  v_via_rpc := current_user = 'postgres';

  -- Resolve canonical program_id from apprenticeship_programs for invariant check
  SELECT id INTO v_ap_program_id
  FROM public.apprenticeship_programs
  WHERE slug = NEW.program_slug
  LIMIT 1;

  IF NOT v_via_rpc THEN
    -- Check allowlist: is this an approved maintenance write?
    SELECT EXISTS (
      SELECT 1 FROM public.enrollment_bypass_allowlist
      WHERE db_user    = current_user
      AND   active_from <= NOW()
      AND   sunset_at   >  NOW()
    ) INTO v_allowlisted;

    -- Invariant check: program_id must match the canonical ap row
    IF NEW.program_id IS NULL
       OR v_ap_program_id IS NULL
       OR NEW.program_id <> v_ap_program_id
    THEN
      v_invariant_violated := TRUE;
    END IF;
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
