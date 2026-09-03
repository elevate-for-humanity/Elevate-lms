-- Computes a learner's simulation readiness for a given credential.
-- Returns JSONB with attempt counts, per-sim best scores, and a readiness percentage.
-- readiness_pct = (sims_passed / sims_available) * 100
-- Used by the credential issuance pipeline to surface pre-exam performance.

CREATE OR REPLACE FUNCTION sim_readiness_score(
  p_learner_id    UUID,
  p_credential_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'sim_attempts_total', COUNT(sa.id),
    'sims_passed',        COUNT(sa.id) FILTER (WHERE sa.passed = true),
    'sims_available',     COUNT(DISTINCT ts.id),
    'best_scores',        jsonb_agg(
                            jsonb_build_object(
                              'sim_key',    ts.sim_key,
                              'best_score', sub.best_score,
                              'passed',     sub.passed
                            )
                            ORDER BY ts.sort_order
                          ),
    'readiness_pct',      CASE
                            WHEN COUNT(DISTINCT ts.id) = 0 THEN 0
                            ELSE ROUND(
                              (COUNT(sa.id) FILTER (WHERE sa.passed = true)::numeric
                               / COUNT(DISTINCT ts.id)) * 100
                            )
                          END
  )
  FROM training_simulations ts
  LEFT JOIN LATERAL (
    SELECT
      MAX(score)    AS best_score,
      bool_or(passed) AS passed
    FROM sim_attempts
    WHERE simulation_id = ts.id
      AND learner_id    = p_learner_id
      AND completed_at IS NOT NULL
  ) sub ON true
  LEFT JOIN sim_attempts sa
    ON  sa.simulation_id = ts.id
    AND sa.learner_id    = p_learner_id
    AND sa.passed        = true
  WHERE ts.credential_id = p_credential_id
    AND ts.is_active     = true;
$$;
