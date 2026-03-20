-- Funding verification state for program_enrollments.
--
-- Problem: ~40 enrollments flagged by payment_integrity_flags sit in
-- enrollment_state='active' or 'enrolled' with no payment evidence.
-- They are indistinguishable from financially cleared students in every
-- admin view, export, access decision, and metric.
--
-- Fix: introduce enrollment_state='pending_funding_verification' as an
-- explicit holding state. Move all unresolved payment_integrity_flags
-- rows into this state. Add an admin view, SLA escalation flag, and
-- explicit LMS access rule.
--
-- State semantics:
--   pending_funding_verification = provisionally admitted, source-of-funds
--   not confirmed. Admin must resolve before student is treated as cleared.
--
-- LMS access policy (explicit, not accidental):
--   pending_funding_verification → LMS access RETAINED (provisional)
--   This is a policy decision. Change the access gate if policy changes.
--   The state makes the decision visible and auditable.
--
-- Normal progression is unchanged:
--   applied → approved → confirmed → orientation_complete
--     → documents_complete → active
--
-- pending_funding_verification is a lateral hold, not part of the
-- progression chain. Resolution moves the row to 'active' (cleared)
-- or triggers revocation.

-- ── MOVE FLAGGED ENROLLMENTS TO HOLDING STATE ─────────────────────────────────
-- Only moves rows with unresolved payment_integrity_flags.
-- Does not touch rows that have already been resolved.

UPDATE public.program_enrollments pe
SET
  enrollment_state = 'pending_funding_verification',
  updated_at       = NOW()
FROM public.payment_integrity_flags f
WHERE f.entity_type  = 'program_enrollment'
  AND f.entity_id    = pe.id
  AND f.resolved_at  IS NULL
  AND pe.enrollment_state IN ('active', 'enrolled', 'approved');

-- ── SLA COLUMN ────────────────────────────────────────────────────────────────
-- Track when the flag was last actioned so SLA escalation can fire.

ALTER TABLE public.payment_integrity_flags
  ADD COLUMN IF NOT EXISTS last_actioned_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_escalated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_days          INTEGER NOT NULL DEFAULT 14;

COMMENT ON COLUMN public.payment_integrity_flags.sla_days IS
  'Days after flagged_at before this flag is auto-escalated for manual review. Default 14.';

-- ── ADMIN QUEUE VIEW ──────────────────────────────────────────────────────────
-- Shows all unresolved funding verification exceptions with age, program,
-- last contact date, docs received flag, and SLA status.

CREATE OR REPLACE VIEW public.v_funding_verification_queue AS
SELECT
  f.id                                          AS flag_id,
  f.flag_type,
  f.flag_reason,
  f.flagged_at,
  f.last_actioned_at,
  f.sla_days,
  f.sla_escalated_at,
  -- Age in days since flagged
  EXTRACT(DAY FROM NOW() - f.flagged_at)::INT   AS age_days,
  -- SLA breach: flagged more than sla_days ago with no action
  CASE
    WHEN f.last_actioned_at IS NULL
     AND EXTRACT(DAY FROM NOW() - f.flagged_at) > f.sla_days
    THEN TRUE
    ELSE FALSE
  END                                           AS sla_breached,
  pe.id                                         AS enrollment_id,
  pe.user_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.amount_paid_cents,
  pe.created_at                                 AS enrolled_at,
  -- Docs received: any document uploaded after enrollment
  EXISTS (
    SELECT 1 FROM public.student_documents sd
    WHERE sd.user_id = pe.user_id
      AND sd.created_at > pe.created_at
  )                                             AS docs_received,
  -- Last contact: most recent outreach log entry
  (
    SELECT MAX(ol.created_at)
    FROM public.outreach_logs ol
    WHERE ol.user_id = pe.user_id
  )                                             AS last_contact_at,
  pr.email,
  pr.full_name
FROM public.payment_integrity_flags f
JOIN public.program_enrollments pe
  ON pe.id = f.entity_id
LEFT JOIN public.profiles pr
  ON pr.id = pe.user_id
WHERE f.entity_type  = 'program_enrollment'
  AND f.resolved_at  IS NULL
ORDER BY sla_breached DESC, age_days DESC;

-- ── LMS ACCESS GATE ───────────────────────────────────────────────────────────
-- Explicit function: returns TRUE if an enrollment grants LMS access.
-- Called by access-sensitive routes instead of raw status checks.
-- Policy: pending_funding_verification retains provisional LMS access.
-- Change this function to change the policy — one place, not 30.

CREATE OR REPLACE FUNCTION public.enrollment_grants_lms_access(
  p_enrollment_state TEXT,
  p_revoked_at       TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_revoked_at IS NULL
    AND p_enrollment_state IN (
      'active',
      'enrolled',
      'in_progress',
      'confirmed',
      'pending_funding_verification'  -- provisional: policy decision, see migration comment
    );
$$;

COMMENT ON FUNCTION public.enrollment_grants_lms_access IS
  'Returns TRUE if the enrollment state + revocation status grants LMS access.
   pending_funding_verification is included by policy (provisional access).
   Remove it from the IN list to revoke access for unverified-funding students.';

-- ── SLA ESCALATION FUNCTION ───────────────────────────────────────────────────
-- Called by a cron job (or manually) to mark flags that have breached SLA.
-- Does not auto-revoke. Marks sla_escalated_at so admin queue surfaces them.

CREATE OR REPLACE FUNCTION public.escalate_funding_verification_sla()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.payment_integrity_flags
  SET sla_escalated_at = NOW()
  WHERE resolved_at    IS NULL
    AND sla_escalated_at IS NULL
    AND EXTRACT(DAY FROM NOW() - flagged_at) > sla_days;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log escalation event
  IF v_count > 0 THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      NULL,
      'sla_escalation',
      'payment_integrity_flags',
      NULL,
      jsonb_build_object('escalated_count', v_count, 'escalated_at', NOW())
    );
  END IF;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.escalate_funding_verification_sla IS
  'Marks payment_integrity_flags rows that have exceeded their SLA window.
   Safe to call repeatedly — idempotent. Returns count of newly escalated rows.
   Wire to /api/cron/escalate-funding-sla with CRON_SECRET guard.';

-- ── METRIC DEFINITION COMMENT ─────────────────────────────────────────────────
-- v_enrolled_not_paid measures unauthorized enrollment leakage:
--   rows in enrollment_state IN ('active','enrolled','approved') for SELF_PAY/stripe
--   with no Stripe session and no verified application_financials row.
--
-- v_enrolled_not_paid = 0 means: no new unauthorized leakage detected.
-- It does NOT mean: all students are financially cleared.
-- The pending_funding_verification cohort is intentionally excluded from
-- v_enrolled_not_paid because they have been explicitly flagged and moved
-- to a holding state. They are tracked in v_funding_verification_queue instead.

COMMENT ON VIEW public.v_enrolled_not_paid IS
  'Measures unauthorized enrollment leakage for SELF_PAY/stripe enrollments.
   A count of 0 means no new leakage — it does not mean all students are
   financially cleared. The pending_funding_verification cohort is tracked
   separately in v_funding_verification_queue.';
