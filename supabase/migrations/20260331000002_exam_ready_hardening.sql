-- =============================================================================
-- Exam Ready System — Hardening Pass
--
-- Fix 1: Unique partial index on exam_authorizations (user_id, program_id)
--         where status is active. Prevents duplicate authorizations on
--         checkpoint retakes or data replays.
--
-- Fix 2+4: domain_min_score column on program_competency_domains.
--          evaluate_exam_readiness() upgraded to enforce per-domain minimums,
--          not just coverage. A learner who passes all checkpoints but scores
--          below the domain floor is correctly blocked.
--
-- Fix 3: learner_module_gate_state view — separates "can view" from
--         "can complete." Lesson page uses this to show lock state.
--         The completion API (enforceCheckpointGate) is the hard block.
--         Learners can always review lessons in locked modules.
--
-- Fix 5: exam_scheduling table — tracks the gap between authorization
--         and actual exam sitting. Without this the funnel goes dark
--         after authorization and outcome data is unreliable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fix 1: Prevent duplicate active authorizations
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_auth_active_unique
  ON exam_authorizations (user_id, program_id)
  WHERE status NOT IN ('expired', 'revoked');

CREATE OR REPLACE FUNCTION auto_create_exam_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id    uuid;
  v_readiness     exam_readiness_result;
  v_pathway_id    uuid;
  v_enrollment_id uuid;
BEGIN
  SELECT cl.program_id INTO v_program_id
  FROM curriculum_lessons cl WHERE cl.id = NEW.lesson_id;

  IF v_program_id IS NULL THEN RETURN NEW; END IF;

  IF NOT EXISTS (SELECT 1 FROM program_exam_ready_rules WHERE program_id = v_program_id) THEN
    RETURN NEW;
  END IF;

  v_readiness := evaluate_exam_readiness(NEW.user_id, v_program_id);
  IF NOT v_readiness.is_ready THEN RETURN NEW; END IF;

  -- Belt + suspenders: trigger guard AND unique index both prevent duplicates
  IF EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id    = NEW.user_id
      AND program_id = v_program_id
      AND status NOT IN ('expired', 'revoked')
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_pathway_id
  FROM program_certification_pathways
  WHERE program_id = v_program_id AND is_primary = true AND is_active = true
  LIMIT 1;

  IF v_pathway_id IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_enrollment_id
  FROM program_enrollments
  WHERE user_id = NEW.user_id AND program_id = v_program_id AND status = 'active'
  LIMIT 1;

  -- WHERE NOT EXISTS as final guard before insert
  INSERT INTO exam_authorizations (
    user_id, program_id, enrollment_id, pathway_id,
    status, authorized_at, expires_at, notes
  )
  SELECT
    NEW.user_id, v_program_id, v_enrollment_id, v_pathway_id,
    'authorized', now(), now() + interval '180 days',
    format('Auto-authorized: avg %s%%, min %s%%, %s/%s checkpoints passed',
      v_readiness.avg_checkpoint_score, v_readiness.min_checkpoint_score,
      v_readiness.checkpoints_passed, v_readiness.checkpoints_total)
  WHERE NOT EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id    = NEW.user_id
      AND program_id = v_program_id
      AND status NOT IN ('expired', 'revoked')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_exam_authorization ON checkpoint_scores;
CREATE TRIGGER trg_auto_exam_authorization
  AFTER INSERT ON checkpoint_scores
  FOR EACH ROW EXECUTE FUNCTION auto_create_exam_authorization();

-- ---------------------------------------------------------------------------
-- Fix 2+4: Per-domain minimum score
--
-- HVAC EPA 608 minimums reflect real exam failure patterns:
--   Recovery & Recycling has the highest EPA 608 failure rate → 80% floor.
--   Safety, Refrigerant, Leak Detection → 75% floor.
--   System Components (broadest domain) → 70% floor.
-- ---------------------------------------------------------------------------

ALTER TABLE program_competency_domains
  ADD COLUMN IF NOT EXISTS domain_min_score integer
    CHECK (domain_min_score IS NULL OR domain_min_score BETWEEN 50 AND 100);

UPDATE program_competency_domains
SET domain_min_score = CASE domain_key
  WHEN 'safety_regulations' THEN 75
  WHEN 'refrigerant_fund'   THEN 75
  WHEN 'recovery_recycling' THEN 80
  WHEN 'leak_detection'     THEN 75
  WHEN 'system_components'  THEN 70
END
WHERE program_id = (SELECT id FROM programs WHERE slug = 'hvac-technician')
  AND domain_key IN (
    'safety_regulations','refrigerant_fund',
    'recovery_recycling','leak_detection','system_components'
  );

-- ---------------------------------------------------------------------------
-- Upgrade evaluate_exam_readiness() — per-domain score enforcement
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluate_exam_readiness(
  p_user_id    uuid,
  p_program_id uuid
)
RETURNS exam_readiness_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $fn$
DECLARE
  v_rule                program_exam_ready_rules%ROWTYPE;
  v_result              exam_readiness_result;
  v_reasons             text[] := '{}';
  v_total_checkpoints   integer      := 0;
  v_passed_checkpoints  integer      := 0;
  v_avg_score           numeric(5,2) := 0;
  v_min_score           numeric(5,2) := 0;
  v_total_lessons       integer      := 0;
  v_completed_lessons   integer      := 0;
  v_total_competencies  integer      := 0;
  v_met_competencies    integer      := 0;
  v_lab_signoff_met     boolean      := false;
  v_domain              RECORD;
  v_domain_avg          numeric(5,2);
  v_domain_failures     text[]       := '{}';
BEGIN
  SELECT * INTO v_rule FROM program_exam_ready_rules WHERE program_id = p_program_id;
  IF NOT FOUND THEN
    v_result.is_ready        := false;
    v_result.failure_reasons := ARRAY['No exam ready rules defined for this program'];
    RETURN v_result;
  END IF;

  -- Checkpoint aggregate
  IF v_rule.require_all_checkpoints THEN
    WITH best_attempts AS (
      SELECT cl.id AS lesson_id, cl.passing_score, MAX(cs.score) AS best_score
      FROM curriculum_lessons cl
      LEFT JOIN checkpoint_scores cs ON cs.lesson_id = cl.id AND cs.user_id = p_user_id
      WHERE cl.program_id = p_program_id AND cl.step_type = 'checkpoint'
      GROUP BY cl.id, cl.passing_score
    )
    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE best_score >= passing_score)::integer,
      COALESCE(AVG(best_score), 0)::numeric(5,2),
      COALESCE(MIN(best_score), 0)::numeric(5,2)
    INTO v_total_checkpoints, v_passed_checkpoints, v_avg_score, v_min_score
    FROM best_attempts;

    IF v_total_checkpoints = 0 THEN
      v_reasons := v_reasons || ARRAY['No checkpoints defined for this program'];
    ELSE
      IF v_passed_checkpoints < v_total_checkpoints THEN
        v_reasons := v_reasons || ARRAY[
          format('Checkpoints: %s of %s passed', v_passed_checkpoints, v_total_checkpoints)];
      END IF;
      IF v_avg_score < v_rule.min_avg_checkpoint_score THEN
        v_reasons := v_reasons || ARRAY[
          format('Average score %s%% below required %s%%',
            v_avg_score, v_rule.min_avg_checkpoint_score)];
      END IF;
      IF v_min_score < v_rule.min_checkpoint_score THEN
        v_reasons := v_reasons || ARRAY[
          format('Lowest checkpoint score %s%% below required %s%%',
            v_min_score, v_rule.min_checkpoint_score)];
      END IF;
    END IF;
  END IF;

  -- Lesson completion
  IF v_rule.require_all_lessons THEN
    SELECT COUNT(*)::integer INTO v_total_lessons
    FROM curriculum_lessons
    WHERE program_id = p_program_id
      AND step_type NOT IN ('checkpoint','lab','certification');

    SELECT COUNT(*)::integer INTO v_completed_lessons
    FROM curriculum_lessons cl
    JOIN lesson_progress lp
      ON lp.lesson_id = cl.id AND lp.user_id = p_user_id AND lp.completed = true
    WHERE cl.program_id = p_program_id
      AND cl.step_type NOT IN ('checkpoint','lab','certification');

    IF v_completed_lessons < v_total_lessons THEN
      v_reasons := v_reasons || ARRAY[
        format('Lessons: %s of %s completed', v_completed_lessons, v_total_lessons)];
    END IF;
  END IF;

  -- Per-domain competence check
  -- Iterates all required domains. Collects all failures before returning
  -- so the learner sees every gap at once, not just the first.
  IF v_rule.require_all_competencies THEN
    SELECT COUNT(*)::integer INTO v_total_competencies
    FROM program_competency_domains
    WHERE program_id = p_program_id AND is_required = true;

    v_met_competencies := 0;

    FOR v_domain IN
      SELECT domain_key, domain_name, domain_min_score
      FROM program_competency_domains
      WHERE program_id = p_program_id AND is_required = true
      ORDER BY domain_key
    LOOP
      -- Average best-attempt score across checkpoints tagged to this domain
      SELECT COALESCE(AVG(sub.best_score), 0)::numeric(5,2)
      INTO v_domain_avg
      FROM (
        SELECT MAX(cs.score) AS best_score
        FROM curriculum_lessons cl
        JOIN checkpoint_scores cs
          ON cs.lesson_id = cl.id
          AND cs.user_id  = p_user_id
          AND cs.passed   = true
        WHERE cl.program_id = p_program_id
          AND v_domain.domain_key = ANY(cl.competency_keys)
          AND cl.step_type = 'checkpoint'
        GROUP BY cl.id
      ) sub;

      IF v_domain_avg = 0 THEN
        v_domain_failures := v_domain_failures || ARRAY[
          format('%s: not yet covered', v_domain.domain_name)];
      ELSIF v_domain.domain_min_score IS NOT NULL
        AND v_domain_avg < v_domain.domain_min_score
      THEN
        v_domain_failures := v_domain_failures || ARRAY[
          format('%s: %s%% (need %s%%)',
            v_domain.domain_name, v_domain_avg, v_domain.domain_min_score)];
      ELSE
        v_met_competencies := v_met_competencies + 1;
      END IF;
    END LOOP;

    IF array_length(v_domain_failures, 1) > 0 THEN
      v_reasons := v_reasons || ARRAY[
        format('Domain requirements not met — %s',
          array_to_string(v_domain_failures, '; '))];
    END IF;
  END IF;

  -- Lab signoff
  IF v_rule.require_lab_signoff THEN
    SELECT EXISTS (
      SELECT 1 FROM step_submissions ss
      JOIN curriculum_lessons cl ON cl.id = ss.lesson_id
      WHERE ss.user_id = p_user_id AND cl.program_id = p_program_id
        AND cl.step_type = 'lab' AND ss.status = 'approved'
    ) INTO v_lab_signoff_met;
    IF NOT v_lab_signoff_met THEN
      v_reasons := v_reasons || ARRAY['Lab sign-off not completed'];
    END IF;
  ELSE
    v_lab_signoff_met := true;
  END IF;

  v_result.avg_checkpoint_score := v_avg_score;
  v_result.min_checkpoint_score := v_min_score;
  v_result.checkpoints_passed   := v_passed_checkpoints;
  v_result.checkpoints_total    := v_total_checkpoints;
  v_result.lessons_completed    := v_completed_lessons;
  v_result.lessons_total        := v_total_lessons;
  v_result.competencies_met     := v_met_competencies;
  v_result.competencies_total   := v_total_competencies;
  v_result.lab_signoff_met      := v_lab_signoff_met;
  v_result.failure_reasons      := v_reasons;
  v_result.is_ready             := (array_length(v_reasons, 1) IS NULL);
  RETURN v_result;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- Fix 3: learner_module_gate_state view
--
-- Per-learner module lock state. Separates access from completion:
--   is_locked = true  → completion API will block (enforceCheckpointGate)
--   is_locked = false → learner can complete and advance
--   Learners can VIEW any lesson regardless of lock state.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW learner_module_gate_state AS
SELECT
  cs_agg.user_id,
  cl_cp.program_id,
  cl_cp.module_order + 1                              AS locked_module_order,
  cl_cp.id                                            AS checkpoint_lesson_id,
  cl_cp.lesson_title                                  AS checkpoint_title,
  cl_cp.passing_score                                 AS required_score,
  COALESCE(cs_agg.best_score, 0)                      AS best_score,
  COALESCE(cs_agg.passed, false)                      AS checkpoint_passed,
  COALESCE(cs_agg.attempt_count, 0)                   AS attempt_count,
  NOT COALESCE(cs_agg.passed, false)                  AS is_locked,
  CASE
    WHEN COALESCE(cs_agg.passed, false)               THEN 'unlocked'
    WHEN COALESCE(cs_agg.attempt_count, 0) = 0        THEN 'not_attempted'
    ELSE format('failed — best %s%%, need %s%%',
           COALESCE(cs_agg.best_score, 0), cl_cp.passing_score)
  END                                                 AS gate_status
FROM curriculum_lessons cl_cp
LEFT JOIN (
  SELECT
    user_id,
    lesson_id,
    MAX(score)      AS best_score,
    bool_or(passed) AS passed,
    COUNT(*)        AS attempt_count
  FROM checkpoint_scores
  GROUP BY user_id, lesson_id
) cs_agg ON cs_agg.lesson_id = cl_cp.id
WHERE cl_cp.step_type = 'checkpoint'
  AND cs_agg.user_id IS NOT NULL;

GRANT SELECT ON learner_module_gate_state TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fix 5: exam_scheduling — authorization → scheduling → outcome funnel
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exam_scheduling (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id    uuid        NOT NULL REFERENCES exam_authorizations(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  scheduled_date      date,
  scheduled_time      time,
  testing_center      text,
  proctor_name        text,
  confirmation_number text,
  outcome             text        CHECK (outcome IN ('passed','failed','no_show','cancelled','rescheduled')),
  outcome_recorded_at timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (authorization_id, scheduled_date)
);

ALTER TABLE exam_scheduling ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learner reads own scheduling"
  ON exam_scheduling FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin manages scheduling"
  ON exam_scheduling FOR ALL TO authenticated
  USING (get_my_role() IN ('admin','super_admin','staff','instructor'));

DROP TRIGGER IF EXISTS trg_exam_scheduling_updated_at ON exam_scheduling;
CREATE TRIGGER trg_exam_scheduling_updated_at
  BEFORE UPDATE ON exam_scheduling
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT SELECT ON exam_scheduling TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Upgrade exam_outcome_tracking — full funnel: authorized → scheduled → sat → passed
-- Must DROP first: CREATE OR REPLACE cannot rename existing columns.
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS exam_outcome_tracking;
CREATE VIEW exam_outcome_tracking AS
SELECT
  p.slug                                                              AS program_slug,
  p.title                                                             AS program_title,
  COUNT(DISTINCT ea.id)                                               AS total_authorized,
  COUNT(DISTINCT es.id)                                               AS total_scheduled,
  COUNT(DISTINCT es.id) FILTER (WHERE es.outcome != 'no_show'
    AND es.outcome IS NOT NULL)                                       AS total_sat,
  COUNT(DISTINCT es.id) FILTER (WHERE es.outcome = 'no_show')        AS total_no_show,
  COUNT(DISTINCT er.id)                                               AS total_results_recorded,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)              AS total_passed,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = false)             AS total_failed,
  ROUND(
    100.0 * COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)
    / NULLIF(COUNT(DISTINCT er.id), 0), 1
  )                                                                   AS first_time_pass_rate_pct,
  ROUND(
    100.0 * COUNT(DISTINCT es.id) FILTER (WHERE es.outcome = 'no_show')
    / NULLIF(COUNT(DISTINCT es.id), 0), 1
  )                                                                   AS no_show_rate_pct,
  ROUND(AVG(er.score), 1)                                            AS avg_exam_score
FROM programs p
LEFT JOIN exam_authorizations ea  ON ea.program_id = p.id
LEFT JOIN exam_scheduling es      ON es.authorization_id = ea.id
LEFT JOIN exam_results er         ON er.authorization_id = ea.id
GROUP BY p.id, p.slug, p.title;

GRANT SELECT ON exam_outcome_tracking TO authenticated, service_role;
