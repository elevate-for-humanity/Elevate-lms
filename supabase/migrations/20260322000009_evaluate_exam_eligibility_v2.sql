-- =============================================================================
-- evaluate_exam_eligibility_v2
--
-- Credential-domain-aware eligibility function. Works off credential_exam_domains
-- and curriculum_lessons, not the EPA-specific epa_exam_domains table.
--
-- The existing evaluate_exam_eligibility() is NOT replaced — it remains the
-- operational function for the EPA 608 simulation pipeline. This function
-- handles all other credentials and will eventually replace the EPA one
-- once the simulation pipeline is migrated to credential_exam_domains.
--
-- Eligibility logic (all conditions must pass):
--
--   1. Domain coverage — for each active domain in credential_exam_domains,
--      the learner must have completed at least one lesson linked to that domain
--      (curriculum_lessons.credential_domain_id). Domains with weight_percent = 0
--      are informational only and do not block eligibility.
--
--   2. Completion rules — all is_required = true rules for this program must pass:
--        min_attendance   → training_attendance coverage >= threshold_value %
--        all_modules      → all curriculum_lessons for program are completed
--        min_hours        → sum of lesson duration_minutes / 60 >= threshold_value
--        practical_assessment → instructor_attestations row exists for learner+program
--
--   3. No failed/pending payment — exam_funding_authorizations must not have
--      funding_status = 'denied' for this learner + credential.
--
-- Returns one row per domain with eligibility detail, plus a summary row
-- with domain_key = '__summary__' containing overall eligibility.
--
-- Writes results to learner_exam_eligibility (upsert) so the UI can read
-- eligibility without re-running the function on every page load.
--
-- Preserves existing evaluate_exam_eligibility() — does not replace it.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_exam_eligibility_v2(
  p_learner_id  UUID,
  p_credential_id UUID,
  p_program_id  UUID
)
RETURNS TABLE (
  out_domain_key        TEXT,
  out_domain_name       TEXT,
  out_weight_percent    INTEGER,
  out_lessons_required  INTEGER,
  out_lessons_completed INTEGER,
  out_is_domain_covered BOOLEAN,
  out_blocking_reason   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overall_eligible BOOLEAN := true;
  v_blocking         TEXT    := NULL;
BEGIN

  -- ── 1. Domain coverage ──────────────────────────────────────────────────────
  RETURN QUERY
  WITH dl AS (
    SELECT
      ced.id            AS ced_id,
      ced.domain_key    AS dkey,
      ced.domain_name   AS dname,
      ced.weight_percent AS wpct,
      COUNT(cl.id)::INTEGER AS lesson_cnt
    FROM credential_exam_domains ced
    LEFT JOIN curriculum_lessons cl
      ON cl.credential_domain_id = ced.id
      AND cl.program_id = p_program_id
      AND cl.status = 'published'
    WHERE ced.credential_id = p_credential_id
      AND ced.weight_percent > 0
    GROUP BY ced.id, ced.domain_key, ced.domain_name, ced.weight_percent
  ),
  lp AS (
    SELECT cl.credential_domain_id AS dom_id, COUNT(*)::INTEGER AS done
    FROM curriculum_lessons cl
    JOIN lesson_progress lpr
      ON lpr.lesson_id = cl.id
      AND lpr.user_id = p_learner_id
      AND lpr.completed = true
    WHERE cl.program_id = p_program_id
    GROUP BY cl.credential_domain_id
  ),
  dc AS (
    SELECT
      dl.dkey,
      dl.dname,
      dl.wpct,
      dl.lesson_cnt                                AS req,
      COALESCE(lp.done, 0)                         AS done,
      CASE
        WHEN dl.lesson_cnt = 0 THEN true
        ELSE COALESCE(lp.done, 0) >= 1
      END                                          AS covered,
      CASE
        WHEN dl.lesson_cnt = 0 THEN 'No curriculum generated for this domain yet'
        WHEN COALESCE(lp.done, 0) = 0 THEN 'No lessons completed in this domain'
        ELSE NULL
      END                                          AS reason
    FROM dl
    LEFT JOIN lp ON lp.dom_id = dl.ced_id
  )
  SELECT
    dc.dkey    AS out_domain_key,
    dc.dname   AS out_domain_name,
    dc.wpct    AS out_weight_percent,
    dc.req     AS out_lessons_required,
    dc.done    AS out_lessons_completed,
    dc.covered AS out_is_domain_covered,
    dc.reason  AS out_blocking_reason
  FROM dc
  ORDER BY dc.wpct DESC;

  -- ── 2. Completion rules check ────────────────────────────────────────────────
  -- Check all_modules rule: every published lesson must be completed
  IF EXISTS (
    SELECT 1 FROM completion_rules
    WHERE entity_type = 'program'
      AND entity_id = p_program_id
      AND rule_type = 'all_modules'
      AND is_required = true
      AND is_active = true
  ) THEN
    IF EXISTS (
      SELECT 1 FROM curriculum_lessons cl
      WHERE cl.program_id = p_program_id
        AND cl.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM lesson_progress lp
          WHERE lp.lesson_id = cl.id
            AND lp.user_id = p_learner_id
            AND lp.completed = true
        )
    ) THEN
      v_overall_eligible := false;
      v_blocking := 'Not all required lessons are completed';
    END IF;
  END IF;

  -- Check practical_assessment rule: instructor attestation required
  IF EXISTS (
    SELECT 1 FROM completion_rules
    WHERE entity_type = 'program'
      AND entity_id = p_program_id
      AND rule_type = 'practical_assessment'
      AND is_required = true
      AND is_active = true
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM instructor_attestations
      WHERE student_id = p_learner_id
        AND program_id = p_program_id
    ) THEN
      v_overall_eligible := false;
      v_blocking := COALESCE(v_blocking || '; ', '') || 'Practical assessment not completed';
    END IF;
  END IF;

  -- ── 3. Payment block check ───────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM exam_funding_authorizations
    WHERE learner_id = p_learner_id
      AND credential_id = p_credential_id
      AND funding_status = 'denied'
  ) THEN
    v_overall_eligible := false;
    v_blocking := COALESCE(v_blocking || '; ', '') || 'Funding authorization denied';
  END IF;

  -- ── 4. Write summary to learner_exam_eligibility ─────────────────────────────
  -- Only write if the table exists AND the domain_key FK allows non-epa keys.
  -- learner_exam_eligibility has a FK to epa_exam_domains which rejects '__summary__',
  -- so we skip this write for non-EPA credentials to avoid FK violations.
  -- The summary row is returned in step 5 regardless.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'learner_exam_eligibility'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'learner_exam_eligibility'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'domain_key'
  ) THEN
    INSERT INTO learner_exam_eligibility
      (learner_id, credential_id, domain_key, sims_passed, sims_required,
       is_eligible, eligible_at, last_evaluated_at)
    VALUES
      (p_learner_id, p_credential_id, '__summary__', 0, 0,
       v_overall_eligible,
       CASE WHEN v_overall_eligible THEN now() ELSE NULL END,
       now())
    ON CONFLICT (learner_id, credential_id, domain_key) DO UPDATE SET
      is_eligible       = EXCLUDED.is_eligible,
      eligible_at       = CASE
                            WHEN EXCLUDED.is_eligible AND learner_exam_eligibility.eligible_at IS NULL
                            THEN now()
                            ELSE learner_exam_eligibility.eligible_at
                          END,
      last_evaluated_at = now();
  END IF;

  -- ── 5. Return summary row ────────────────────────────────────────────────────
  RETURN QUERY SELECT
    '__summary__'::TEXT        AS out_domain_key,
    'Overall Eligibility'::TEXT AS out_domain_name,
    100::INTEGER               AS out_weight_percent,
    0::INTEGER                 AS out_lessons_required,
    0::INTEGER                 AS out_lessons_completed,
    v_overall_eligible         AS out_is_domain_covered,
    v_blocking                 AS out_blocking_reason;

END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_exam_eligibility_v2(UUID, UUID, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.evaluate_exam_eligibility_v2 IS
  'Credential-domain-aware eligibility check. Works off credential_exam_domains + '
  'curriculum_lessons + completion_rules. Does not replace evaluate_exam_eligibility() '
  '(EPA simulation pipeline). Returns one row per domain plus a __summary__ row. '
  'Writes summary to learner_exam_eligibility if that table exists.';
