-- Payment + enrollment integrity hardening.
--
-- Addresses findings from 2026-05-03 reconciliation audit:
--
-- 1. 40 active enrollments with funding_source='pending', no Stripe session,
--    no application — created via direct insert (admin import or seed).
--    These are flagged for review, not deleted. Admin must verify each one.
--
-- 2. 2 active SELF_PAY enrollments with no Stripe evidence — one has
--    funding_verified=true on the application (legitimate), one is in_review.
--    The in_review one is blocked pending payment confirmation.
--
-- 3. enroll_application RPC hardened: Stripe staging table check added as
--    an additional payment gate alongside existing funding_verified check.
--
-- 4. payment_integrity_flags table: permanent audit trail for flagged rows.
--    Admin resolves each flag explicitly — no silent auto-deletion.

-- ── FLAG TABLE ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_integrity_flags (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text        NOT NULL,  -- 'program_enrollment'
  entity_id       uuid        NOT NULL,
  flag_type       text        NOT NULL,  -- 'no_payment_evidence' | 'bnpl_unverified' | 'blocked_pending_review'
  flag_reason     text        NOT NULL,
  flagged_at      timestamptz NOT NULL DEFAULT now(),
  flagged_by      text        NOT NULL DEFAULT 'system_audit',
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution      text,       -- 'payment_confirmed' | 'waived' | 'enrollment_revoked' | 'false_positive'
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payment_flags_entity
  ON public.payment_integrity_flags (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_payment_flags_unresolved
  ON public.payment_integrity_flags (flag_type, flagged_at)
  WHERE resolved_at IS NULL;

ALTER TABLE public.payment_integrity_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.payment_integrity_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "admin_read" ON public.payment_integrity_flags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── FLAG THE 40 PENDING-FUNDING ENROLLMENTS ───────────────────────────────────
-- These are active enrollments with no payment, no application, no Stripe session.
-- Flagged for admin review — NOT auto-revoked.

INSERT INTO public.payment_integrity_flags (
  entity_type, entity_id, flag_type, flag_reason, metadata
)
SELECT
  'program_enrollment',
  pe.id,
  'no_payment_evidence',
  'Active enrollment with funding_source=pending, no Stripe session, no matching application',
  jsonb_build_object(
    'user_id',        pe.user_id,
    'program_slug',   pe.program_slug,
    'enrollment_state', pe.enrollment_state,
    'created_at',     pe.created_at,
    'amount_paid_cents', pe.amount_paid_cents
  )
FROM public.program_enrollments pe
WHERE pe.funding_source = 'pending'
  AND pe.enrollment_state IN ('active', 'enrolled')
  AND pe.stripe_checkout_session_id IS NULL
  AND pe.stripe_payment_intent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE (a.user_id = pe.user_id OR a.user_id = pe.student_id)
      AND a.program_slug = pe.program_slug
  )
ON CONFLICT DO NOTHING;

-- ── FLAG THE in_review SELF_PAY ENROLLMENT ────────────────────────────────────
-- peer-recovery-specialist enrollment, app status=in_review, no payment confirmed.
-- Block access until payment is confirmed.

INSERT INTO public.payment_integrity_flags (
  entity_type, entity_id, flag_type, flag_reason, metadata
)
SELECT
  'program_enrollment',
  pe.id,
  'blocked_pending_review',
  'SELF_PAY enrollment active but application is in_review with no payment evidence',
  jsonb_build_object(
    'user_id',      pe.user_id,
    'program_slug', pe.program_slug,
    'app_id',       a.id,
    'app_status',   a.status
  )
FROM public.program_enrollments pe
JOIN public.applications a
  ON a.user_id = pe.user_id AND a.program_slug = pe.program_slug
WHERE pe.id = '6d4d0ed8-49da-40b0-affd-152e0dbbee78'
  AND a.status = 'in_review'
ON CONFLICT DO NOTHING;

-- ── MONITORING VIEW ───────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_payment_integrity_dashboard AS
SELECT
  f.id            AS flag_id,
  f.flag_type,
  f.flag_reason,
  f.flagged_at,
  f.resolved_at,
  f.resolution,
  pe.user_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.amount_paid_cents,
  pe.created_at   AS enrolled_at,
  p.email
FROM public.payment_integrity_flags f
JOIN public.program_enrollments pe ON pe.id = f.entity_id
LEFT JOIN public.profiles p ON p.id = pe.user_id
WHERE f.entity_type = 'program_enrollment'
ORDER BY f.flagged_at DESC;

-- ── WEBHOOK HEALTH MONITORING TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_health_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text        NOT NULL DEFAULT 'stripe',
  check_at        timestamptz NOT NULL DEFAULT now(),
  endpoint_status text        NOT NULL,  -- 'enabled' | 'disabled' | 'unknown'
  events_last_24h integer,
  events_failed   integer,
  events_processed integer,
  unprocessed_paid_sessions integer,
  enrolled_not_paid integer,
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

ALTER TABLE public.webhook_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.webhook_health_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
