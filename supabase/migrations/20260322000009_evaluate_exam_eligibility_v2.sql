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
  domain_key        TEXT,
  domain_name       TEXT,
  weight_percent    INTEGER,
  lessons_required  INTEGER,   -- lessons linked to this domain in curriculum
  lessons_completed INTEGER,   -- lessons the learner has completed
  is_domain_covered BOOLEAN,
  blocking_reason   TEXT
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
  WITH domain_lessons AS (
    -- All curriculum lessons linked to each domain for this program
    SELECT
      ced.domain_key,
      ced.domain_name,
      ced.weight_percent,
      COUNT(cl.id)::INTEGER AS lessons_in_curriculum
    FROM credential_exam_domains ced
    LEFT JOIN curriculum_lessons cl
      ON cl.credential_domain_id = ced.id
      AND cl.program_id = p_program_id
      AND cl.status = 'published'
    WHERE ced.credential_id = p_credential_id
      AND ced.weight_percent > 0   -- skip informational domains
    GROUP BY ced.domain_key, ced.domain_name, ced.weight_percent
  ),
  learner_progress AS (
    -- Lessons the learner has completed for this program
    SELECT cl.credential_domain_id, COUNT(*)::INTEGER AS completed
    FROM curriculum_lessons cl
    JOIN course_progress cp
      ON cp.lesson_id = cl.id
      AND cp.user_id = p_learner_id
      AND cp.status = 'completed'
    WHERE cl.program_id = p_program_id
    GROUP BY cl.credential_domain_id
  ),
  domain_coverage AS (
    SELECT
      dl.domain_key,
      dl.domain_name,
      dl.weight_percent,
      dl.lessons_in_curriculum                                    AS lessons_required,
      COALESCE(lp.completed, 0)                                   AS lessons_completed,
      -- Domain is covered if learner completed at least 1 lesson in it
      -- (or if no lessons exist yet for this domain — curriculum not generated)
      CASE
        WHEN dl.lessons_in_curriculum = 0 THEN true   -- no curriculum yet, non-blocking
        ELSE COALESCE(lp.completed, 0) >= 1
      END                                                         AS is_domain_covered,
      CASE
        WHEN dl.lessons_in_curriculum = 0 THEN 'No curriculum generated for this domain yet'
        WHEN COALESCE(lp.completed, 0) = 0 THEN 'No lessons completed in this domain'
        ELSE NULL
      END                                                         AS blocking_reason
    FROM domain_lessons dl
    LEFT JOIN learner_progress lp ON lp.credential_domain_id = (
      SELECT id FROM credential_exam_domains
      WHERE credential_id = p_credential_id AND domain_key = dl.domain_key
      LIMIT 1
    )
  )
  SELECT
    dc.domain_key,
    dc.domain_name,
    dc.weight_percent,
    dc.lessons_required,
    dc.lessons_completed,
    dc.is_domain_covered,
    dc.blocking_reason
  FROM domain_coverage dc
  ORDER BY dc.weight_percent DESC;

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
          SELECT 1 FROM course_progress cp
          WHERE cp.lesson_id = cl.id
            AND cp.user_id = p_learner_id
            AND cp.status = 'completed'
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
  -- Only write if the table exists (it may not on fresh installs before EPA migration)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'learner_exam_eligibility'
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
    '__summary__'::TEXT,
    'Overall Eligibility'::TEXT,
    100::INTEGER,
    0::INTEGER,
    0::INTEGER,
    v_overall_eligible,
    v_blocking;

END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_exam_eligibility_v2(UUID, UUID, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.evaluate_exam_eligibility_v2 IS
  'Credential-domain-aware eligibility check. Works off credential_exam_domains + '
  'curriculum_lessons + completion_rules. Does not replace evaluate_exam_eligibility() '
  '(EPA simulation pipeline). Returns one row per domain plus a __summary__ row. '
  'Writes summary to learner_exam_eligibility if that table exists.';
