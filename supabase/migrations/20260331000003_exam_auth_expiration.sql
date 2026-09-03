-- =============================================================================
-- Exam Authorization Expiration + Re-authorization Rules
--
-- Expiration policy (machine-enforced):
--   An authorization expires after 180 days if the learner has not sat
--   (status never reached 'scheduled', 'passed', or 'failed').
--   Nightly job calls expire_stale_exam_authorizations().
--
-- Re-authorization rule (explicit, not implicit):
--   Expired authorizations do NOT auto-reactivate.
--   Re-authorization requires a fresh readiness evaluation at the moment
--   of re-authorization. A learner who was ready 6 months ago may not
--   still be ready — their checkpoint scores may have decayed in relevance.
--   Re-authorization is triggered by staff via the admin work queue,
--   which calls reauthorize_exam_if_ready().
--
-- Admin work queue view:
--   exam_authorization_queue — every active authorization with the data
--   staff need to take action. Not a dashboard. A work queue.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. expire_stale_exam_authorizations()
--    Called nightly by /api/cron/expire-exam-authorizations.
--    Expires authorizations that are past their expires_at date and have
--    not progressed to scheduled/passed/failed.
--    Returns a summary row for the cron job to log.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_stale_exam_authorizations()
RETURNS TABLE (
  expired_count   integer,
  program_summary jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count integer;
  v_summary       jsonb;
BEGIN
  WITH expired AS (
    UPDATE exam_authorizations
    SET
      status     = 'expired',
      updated_at = now(),
      notes      = COALESCE(notes || ' | ', '') ||
                   format('Auto-expired %s: no exam sat within 180-day window.',
                     to_char(now(), 'YYYY-MM-DD'))
    WHERE status IN ('pending', 'fee_charged', 'authorized')
      AND expires_at < now()
    RETURNING id, program_id
  )
  SELECT
    COUNT(*)::integer,
    jsonb_object_agg(p.slug, cnt)
  INTO v_expired_count, v_summary
  FROM (
    SELECT e.program_id, COUNT(*) AS cnt
    FROM expired e
    GROUP BY e.program_id
  ) sub
  JOIN programs p ON p.id = sub.program_id;

  RETURN QUERY SELECT
    COALESCE(v_expired_count, 0),
    COALESCE(v_summary, '{}'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. reauthorize_exam_if_ready(p_user_id, p_program_id, p_staff_id)
--    Called by staff from the admin work queue.
--    Re-evaluates readiness at the current moment — does NOT reuse the
--    original authorization's readiness state.
--    Creates a new authorization row (does not reactivate the expired one).
--    Returns the new authorization id, or NULL with a reason if not ready.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reauthorize_exam_if_ready(
  p_user_id    uuid,
  p_program_id uuid,
  p_staff_id   uuid DEFAULT NULL
)
RETURNS TABLE (
  success          boolean,
  authorization_id uuid,
  reason           text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_readiness     exam_readiness_result;
  v_pathway_id    uuid;
  v_enrollment_id uuid;
  v_new_auth_id   uuid;
BEGIN
  -- Block if an active authorization already exists
  IF EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id    = p_user_id
      AND program_id = p_program_id
      AND status NOT IN ('expired', 'revoked')
  ) THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Active authorization already exists — no re-authorization needed';
    RETURN;
  END IF;

  -- Fresh readiness evaluation — not cached, not assumed
  v_readiness := evaluate_exam_readiness(p_user_id, p_program_id);

  IF NOT v_readiness.is_ready THEN
    RETURN QUERY SELECT false, NULL::uuid,
      format('Not exam ready: %s',
        array_to_string(v_readiness.failure_reasons, '; '));
    RETURN;
  END IF;

  SELECT id INTO v_pathway_id
  FROM program_certification_pathways
  WHERE program_id = p_program_id AND is_primary = true AND is_active = true
  LIMIT 1;

  IF v_pathway_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'No active certification pathway configured for this program';
    RETURN;
  END IF;

  SELECT id INTO v_enrollment_id
  FROM program_enrollments
  WHERE user_id = p_user_id AND program_id = p_program_id
    AND status IN ('active', 'completed')
  LIMIT 1;

  INSERT INTO exam_authorizations (
    user_id, program_id, enrollment_id, pathway_id,
    status, authorized_at, expires_at, notes
  ) VALUES (
    p_user_id, p_program_id, v_enrollment_id, v_pathway_id,
    'authorized', now(), now() + interval '180 days',
    format('Re-authorized by staff%s: avg %s%%, min %s%%, %s/%s checkpoints. Fresh eval at %s.',
      CASE WHEN p_staff_id IS NOT NULL
        THEN ' (' || p_staff_id::text || ')'
        ELSE '' END,
      v_readiness.avg_checkpoint_score,
      v_readiness.min_checkpoint_score,
      v_readiness.checkpoints_passed,
      v_readiness.checkpoints_total,
      to_char(now(), 'YYYY-MM-DD HH24:MI'))
  )
  RETURNING id INTO v_new_auth_id;

  RETURN QUERY SELECT true, v_new_auth_id,
    format('Re-authorized. Expires %s.',
      to_char(now() + interval '180 days', 'YYYY-MM-DD'));
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. exam_authorization_queue view
--    The admin work queue. Not a dashboard — a list of things that need action.
--    Shows every authorization that is active or recently terminal.
--    Ordered by urgency: expiring soonest first, then by status.
--
--    Actions staff can take per row (enforced in the API, shown here for clarity):
--      authorized  → set scheduled_date, mark sat, mark no-show, expire, re-auth
--      scheduled   → mark sat, mark no-show, record result
--      passed/failed → record result (if not already), attach note
--      expired     → re-authorize if learner is still ready
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW exam_authorization_queue AS
SELECT
  ea.id                                                     AS authorization_id,
  ea.user_id,
  ea.program_id,
  ea.status,
  ea.authorized_at,
  ea.expires_at,
  ea.notes,

  -- Learner info
  u.email                                                   AS learner_email,
  COALESCE(pr.full_name, u.email)                           AS learner_name,

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
JOIN auth.users u        ON u.id = ea.user_id
LEFT JOIN profiles pr    ON pr.id = ea.user_id
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

GRANT SELECT ON exam_authorization_queue TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. pg_cron job — nightly expiration at 2am UTC
--    Calls expire_stale_exam_authorizations() directly in the DB.
--    The API route /api/cron/expire-exam-authorizations is the fallback
--    for environments where pg_cron is not available (e.g. local dev).
-- ---------------------------------------------------------------------------

SELECT cron.schedule(
  'expire-exam-authorizations',
  '0 2 * * *',
  $$SELECT expire_stale_exam_authorizations()$$
);
