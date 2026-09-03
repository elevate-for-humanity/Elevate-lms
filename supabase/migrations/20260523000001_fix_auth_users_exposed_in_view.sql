-- =============================================================================
-- Security fix: auth.users exposed through exam_authorization_queue view
--
-- The view joined auth.users directly, exposing u.email to the authenticated
-- role via PostgREST. Supabase flagged this as a critical vulnerability
-- (auth_users_exposed, detected 23 Mar 2026).
--
-- Fix: replace JOIN auth.users with profiles (which stores email safely in
-- the public schema), add SECURITY DEFINER so the view runs as its owner
-- rather than the calling role, and revoke anon access explicitly.
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.exam_authorization_queue;

-- Recreate without any reference to auth.users
-- Email comes from profiles.email (populated on signup via trigger)
CREATE OR REPLACE VIEW public.exam_authorization_queue
WITH (security_invoker = false)
AS
SELECT
  ea.id                                                     AS authorization_id,
  ea.user_id,
  ea.program_id,
  ea.status,
  ea.authorized_at,
  ea.expires_at,
  ea.notes,

  -- Learner info — sourced from profiles, not auth.users
  pr.email                                                  AS learner_email,
  COALESCE(pr.full_name, pr.email)                          AS learner_name,

  -- Program info
  p.slug                                                    AS program_slug,
  p.title                                                   AS program_title,

  -- Scheduling state (most recent scheduled attempt)
  es.scheduled_date,
  es.testing_center,
  es.outcome                                                AS scheduling_outcome,

  -- Exam result (if recorded)
  er.passed                                                 AS exam_passed,
  er.score                                                  AS exam_score,
  er.exam_date                                              AS exam_date,

  -- Days until expiration (negative = already expired)
  (ea.expires_at::date - CURRENT_DATE)                      AS days_until_expiry,

  -- Urgency flag: expiring within 30 days and not yet scheduled
  (
    ea.status = 'authorized'
    AND ea.expires_at < now() + interval '30 days'
  )                                                         AS expiring_soon,

  -- What action is needed
  CASE
    WHEN ea.status = 'authorized' AND es.id IS NULL
      THEN 'needs_scheduling'
    WHEN ea.status = 'authorized' AND es.id IS NOT NULL AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status = 'scheduled' AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status IN ('passed','failed') AND er.id IS NULL
      THEN 'needs_result_recorded'
    WHEN ea.status = 'expired'
      THEN 'eligible_for_reauth'
    ELSE 'no_action_needed'
  END                                                       AS action_needed

FROM exam_authorizations ea
JOIN programs p          ON p.id = ea.program_id
JOIN public.profiles pr  ON pr.id = ea.user_id
LEFT JOIN exam_scheduling es
  ON es.authorization_id = ea.id
  AND es.id = (
    SELECT id FROM exam_scheduling
    WHERE authorization_id = ea.id
    ORDER BY created_at DESC LIMIT 1
  )
LEFT JOIN exam_results er ON er.authorization_id = ea.id

-- Show active + recently expired (last 90 days) — not historical noise
WHERE ea.status NOT IN ('revoked')
  AND (
    ea.status NOT IN ('expired', 'passed', 'failed')
    OR ea.updated_at > now() - interval '90 days'
  )

ORDER BY
  -- Expiring soon first
  CASE WHEN ea.status = 'authorized' AND ea.expires_at < now() + interval '30 days'
    THEN 0 ELSE 1 END,
  ea.expires_at ASC NULLS LAST,
  ea.authorized_at DESC;

-- Explicit grants: no anon access, authenticated + service_role only
REVOKE ALL ON public.exam_authorization_queue FROM anon;
GRANT SELECT ON public.exam_authorization_queue TO authenticated, service_role;

-- RLS note: this view is admin-only. API routes that query it must use
-- apiRequireAdmin() before any DB access. The view itself does not enforce
-- row-level filtering — that is the responsibility of the calling route.
