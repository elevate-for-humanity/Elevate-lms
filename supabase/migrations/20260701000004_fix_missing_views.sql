-- Fix two views that code references but don't exist in the live DB.
--
-- 1. ai_audit_log — was dropped by 20260630000007_consolidate_tables.sql
--    (merged into audit_logs). Code in apps/admin still writes to it via
--    withApiAudit and ai-assistant route. Recreate as a view over audit_logs
--    so writes go to the canonical table and reads still work.
--
-- 2. at_risk_learners — referenced by lib/automation/enrollment-automation.ts
--    and admin dashboard. Was never created as a migration. Create it now as
--    a view over lesson_progress + program_enrollments.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ai_audit_log — view over audit_logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.ai_audit_log AS
SELECT
  id,
  actor_id                          AS user_id,
  action,
  metadata->>'prompt'               AS prompt,
  metadata->>'reply'                AS reply,
  metadata->>'tool'                 AS tool,
  metadata->>'model'                AS model,
  ip_address,
  created_at
FROM public.audit_logs
WHERE action ILIKE 'ai_%'
   OR action ILIKE '%ai_assistant%'
   OR action ILIKE '%devstudio%'
   OR metadata->>'source' = 'ai';

COMMENT ON VIEW public.ai_audit_log IS
  'AI action audit trail — view over audit_logs filtered to AI actions. '
  'Replaces the dropped ai_audit_log table (consolidated 2026-06-30).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. at_risk_learners — learners inactive for 7+ days
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.at_risk_learners AS
SELECT
  pe.user_id,
  pe.id                                         AS enrollment_id,
  pe.program_id,
  pe.program_slug,
  p.full_name,
  p.email,
  pe.enrolled_at,
  pe.progress_percent,
  MAX(lp.completed_at)                          AS last_activity_at,
  now() - MAX(lp.completed_at)                  AS inactive_duration,
  EXTRACT(DAY FROM now() - MAX(lp.completed_at))::int AS days_inactive,
  CASE
    WHEN MAX(lp.completed_at) IS NULL THEN 'never_started'
    WHEN now() - MAX(lp.completed_at) > interval '30 days' THEN 'critical'
    WHEN now() - MAX(lp.completed_at) > interval '14 days' THEN 'high'
    ELSE 'moderate'
  END                                           AS risk_level
FROM public.program_enrollments pe
JOIN public.profiles p ON p.id = pe.user_id
LEFT JOIN public.lesson_progress lp ON lp.user_id = pe.user_id
WHERE pe.status = 'active'
  AND pe.completed_at IS NULL
  AND (
    -- No lesson activity at all
    NOT EXISTS (
      SELECT 1 FROM public.lesson_progress lp2
      WHERE lp2.user_id = pe.user_id
    )
    OR
    -- Last activity was 7+ days ago
    (
      SELECT MAX(completed_at) FROM public.lesson_progress lp3
      WHERE lp3.user_id = pe.user_id
    ) < now() - interval '7 days'
  )
GROUP BY pe.user_id, pe.id, pe.program_id, pe.program_slug,
         p.full_name, p.email, pe.enrolled_at, pe.progress_percent
ORDER BY days_inactive DESC NULLS FIRST;

COMMENT ON VIEW public.at_risk_learners IS
  'Active enrollments with no lesson activity in 7+ days. '
  'Used by admin dashboard at-risk panel and enrollment-automation.ts inactivity reminders.';
