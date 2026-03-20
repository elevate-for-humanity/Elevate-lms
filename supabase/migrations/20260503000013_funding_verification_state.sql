-- Funding verification state hardening.
--
-- Problem: 36 students enrolled via instant-access flow (Feb 22 – Mar 10 2026)
-- have no payment and no verified funding. They are currently enrollment_state='active'
-- which is indistinguishable from fully paid/verified students in every report,
-- export, and admin view.
--
-- Fix:
-- 1. Move those 36 to enrollment_state='pending_funding_verification' — a distinct,
--    visible state that cannot be mistaken for financially cleared.
-- 2. Add a check constraint so enrollment_state is always one of the known values.
-- 3. Add funding_verification_due_at column — SLA deadline (14 days from flagged_at).
-- 4. Add v_funding_verification_queue view — admin queue with age, SLA status, last contact.
-- 5. Add funding_verification_escalations table — auto-escalation log when SLA breached.

-- ── 1. Add funding_verification_due_at column ─────────────────────────────────

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS funding_verification_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_verification_notes  text;

-- ── 2. Move the 36 from active/enrolled → pending_funding_verification ─────────

UPDATE public.program_enrollments
SET
  enrollment_state             = 'pending_funding_verification',
  funding_verification_due_at  = NOW() + INTERVAL '14 days',
  updated_at                   = NOW()
WHERE funding_source = 'pending_funding_verification'
  AND enrollment_state IN ('active', 'enrolled', 'approved');

-- ── 3. Add enrollment_state check constraint ──────────────────────────────────
-- Allows all existing states plus the new one.
-- 'pending_funding_verification' = provisionally admitted, source-of-funds unconfirmed.

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS enrollment_state_valid;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT enrollment_state_valid CHECK (
    enrollment_state IS NULL OR enrollment_state IN (
      'applied',
      'onboarding',
      'orientation',
      'enrolled',
      'active',
      'pending_funding_verification',  -- provisionally admitted, awaiting funding confirmation
      'payment_required',              -- self-pay, checkout not completed
      'suspended',
      'revoked',
      'withdrawn',
      'completed',
      'graduated'
    )
  );

-- ── 4. Escalation log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.funding_verification_escalations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid        NOT NULL REFERENCES public.program_enrollments(id),
  user_id         uuid        NOT NULL,
  program_slug    text        NOT NULL,
  escalated_at    timestamptz NOT NULL DEFAULT now(),
  reason          text        NOT NULL DEFAULT 'sla_breach_14d',
  days_overdue    integer,
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution      text,
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_fve_enrollment_id
  ON public.funding_verification_escalations (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_fve_unresolved
  ON public.funding_verification_escalations (escalated_at)
  WHERE resolved_at IS NULL;

ALTER TABLE public.funding_verification_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.funding_verification_escalations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "admin_read" ON public.funding_verification_escalations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 5. Admin queue view ───────────────────────────────────────────────────────
-- Shows all pending_funding_verification enrollments with SLA status.
-- This is the canonical admin queue — not a report, an action list.

CREATE OR REPLACE VIEW public.v_funding_verification_queue AS
SELECT
  pe.id                           AS enrollment_id,
  pe.user_id,
  p.email,
  p.full_name,
  p.phone,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.created_at                   AS enrolled_at,
  pe.funding_verification_due_at  AS due_at,
  pe.funding_verification_notes   AS notes,
  -- Age in days since enrollment
  EXTRACT(DAY FROM NOW() - pe.created_at)::integer AS days_since_enrollment,
  -- Days until/past SLA deadline
  EXTRACT(DAY FROM pe.funding_verification_due_at - NOW())::integer AS days_until_due,
  -- SLA status
  CASE
    WHEN pe.funding_verification_due_at IS NULL THEN 'no_deadline'
    WHEN NOW() > pe.funding_verification_due_at + INTERVAL '7 days' THEN 'critical'
    WHEN NOW() > pe.funding_verification_due_at THEN 'overdue'
    WHEN NOW() > pe.funding_verification_due_at - INTERVAL '3 days' THEN 'due_soon'
    ELSE 'on_track'
  END                             AS sla_status,
  -- Open escalation
  EXISTS (
    SELECT 1 FROM public.funding_verification_escalations fve
    WHERE fve.enrollment_id = pe.id AND fve.resolved_at IS NULL
  )                               AS has_open_escalation,
  -- Open integrity flag
  pif.flag_type,
  pif.flagged_at
FROM public.program_enrollments pe
LEFT JOIN public.profiles p ON p.id = pe.user_id
LEFT JOIN public.payment_integrity_flags pif
  ON pif.entity_id = pe.id
  AND pif.entity_type = 'program_enrollment'
  AND pif.resolved_at IS NULL
WHERE pe.enrollment_state = 'pending_funding_verification'
ORDER BY
  CASE
    WHEN NOW() > pe.funding_verification_due_at + INTERVAL '7 days' THEN 1
    WHEN NOW() > pe.funding_verification_due_at THEN 2
    WHEN NOW() > pe.funding_verification_due_at - INTERVAL '3 days' THEN 3
    ELSE 4
  END,
  pe.funding_verification_due_at ASC NULLS LAST;

-- ── 6. SLA escalation function ────────────────────────────────────────────────
-- Called by cron job at /api/cron/funding-verification-escalation
-- Inserts escalation records for any enrollment past its due date.

CREATE OR REPLACE FUNCTION public.escalate_overdue_funding_verifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO public.funding_verification_escalations (
    enrollment_id, user_id, program_slug, reason, days_overdue, metadata
  )
  SELECT
    pe.id,
    pe.user_id,
    pe.program_slug,
    'sla_breach_14d',
    EXTRACT(DAY FROM NOW() - pe.funding_verification_due_at)::integer,
    jsonb_build_object(
      'enrolled_at',  pe.created_at,
      'due_at',       pe.funding_verification_due_at,
      'funding_source', pe.funding_source
    )
  FROM public.program_enrollments pe
  WHERE pe.enrollment_state = 'pending_funding_verification'
    AND pe.funding_verification_due_at < NOW()
    -- Only escalate once per enrollment (no duplicate open escalations)
    AND NOT EXISTS (
      SELECT 1 FROM public.funding_verification_escalations fve
      WHERE fve.enrollment_id = pe.id AND fve.resolved_at IS NULL
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 7. Metric view — freeze the definition ────────────────────────────────────
-- v_enrolled_not_paid measures UNAUTHORIZED enrollment leakage only.
-- It explicitly excludes pending_funding_verification (which is a known,
-- intentional provisional state requiring admin action, not a payment gap).
-- This comment is the written policy for what the metric means.

COMMENT ON VIEW public.v_enrolled_not_paid IS
'Measures unauthorized enrollment leakage: active enrollments with no payment
evidence and no verified funding. Does NOT include pending_funding_verification
enrollments — those are tracked separately in v_funding_verification_queue.
A count of 0 means no unauthorized access, not that all funding is resolved.';

COMMENT ON VIEW public.v_funding_verification_queue IS
'Admin action queue for provisionally admitted students awaiting funding
confirmation. SLA: 14 days from enrollment. Overdue = requires immediate
admin contact. Critical = 7+ days past due, consider suspending access.';

-- ── 8. DB-level invariant: funding_verified=true cannot coexist with pending state ──
--
-- Prevents the UI from showing "verified" while the system still blocks access.
-- Without this, a partial update (funding_verified set but enrollment_state not
-- transitioned) would silently leave the student locked out.

CREATE OR REPLACE FUNCTION public.enforce_funding_state_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- funding_verified=true must not remain in pending_funding_verification state
  IF NEW.funding_verified = true
     AND NEW.enrollment_state = 'pending_funding_verification' THEN
    RAISE EXCEPTION 'INVALID_STATE: funding_verified=true but enrollment_state is still pending_funding_verification. Transition enrollment_state to onboarding or active.';
  END IF;

  -- revoked enrollment must not have funding_verified=true
  IF NEW.enrollment_state = 'revoked'
     AND NEW.funding_verified = true
     AND (OLD.enrollment_state = 'pending_funding_verification') THEN
    RAISE EXCEPTION 'INVALID_STATE: cannot set funding_verified=true on a revoked enrollment.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funding_state_consistency ON public.program_enrollments;
CREATE TRIGGER trg_funding_state_consistency
  BEFORE UPDATE ON public.program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_funding_state_consistency();
