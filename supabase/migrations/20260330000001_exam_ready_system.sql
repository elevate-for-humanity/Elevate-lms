-- =============================================================================
-- SUPERSEDED — do not apply. Replaced by 20260331000001_hvac_exam_ready_system.sql
-- Kept for reference only.
-- =============================================================================
-- Exam Ready System — CNA pilot, extensible to all programs
--
-- Implements:
--   1. program_exam_ready_rules     — per-program thresholds (no hardcoding)
--   2. cna_competency_domains       — CNA NNAAP exam domain seed
--   3. evaluate_exam_readiness()    — deterministic readiness function
--   4. exam_ready_status view       — per-learner status with failure reasons
--   5. auto_create_exam_authorization trigger — fires on readiness
--   6. exam_outcome_tracking view   — pass rate feedback loop
--   7. program_completion_certificates: add exam_ready columns
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. program_exam_ready_rules
--    One row per program. Defines what "Exam Ready" means for that program.
--    Never editable by staff — only by migration or admin with audit trail.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_exam_ready_rules (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  min_avg_checkpoint_score  integer     NOT NULL DEFAULT 85,
    CHECK (min_avg_checkpoint_score BETWEEN 50 AND 100),
  require_all_checkpoints   boolean     NOT NULL DEFAULT true,
  require_all_lessons       boolean     NOT NULL DEFAULT true,
  require_all_competencies  boolean     NOT NULL DEFAULT true,
  require_lab_signoff       boolean     NOT NULL DEFAULT false,
  allow_manual_override     boolean     NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id)
);

ALTER TABLE program_exam_ready_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages exam ready rules"
  ON program_exam_ready_rules FOR ALL TO authenticated
  USING (get_my_role() IN ('admin','super_admin'));

CREATE POLICY "authenticated read exam ready rules"
  ON program_exam_ready_rules FOR SELECT TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_exam_ready_rules_updated_at ON program_exam_ready_rules;
CREATE TRIGGER trg_exam_ready_rules_updated_at
  BEFORE UPDATE ON program_exam_ready_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. CNA exam ready rule seed — 85% strict
-- ---------------------------------------------------------------------------

INSERT INTO program_exam_ready_rules (
  program_id, min_avg_checkpoint_score, require_all_checkpoints,
  require_all_lessons, require_all_competencies, require_lab_signoff,
  allow_manual_override, notes
)
SELECT
  id,
  85,    -- 85% minimum average across all checkpoints
  true,  -- every checkpoint must be passed
  true,  -- every required lesson must be completed
  true,  -- all NNAAP competency domains must be covered
  true,  -- clinical skills lab sign-off required (CNA state requirement)
  false, -- no manual overrides
  'CNA NNAAP standard. Indiana ISDH requires clinical skills competency verification before exam authorization.'
FROM programs
WHERE slug = 'cna-cert'
ON CONFLICT (program_id) DO NOTHING;

-- Also seed for cna-training slug if it exists
INSERT INTO program_exam_ready_rules (
  program_id, min_avg_checkpoint_score, require_all_checkpoints,
  require_all_lessons, require_all_competencies, require_lab_signoff,
  allow_manual_override, notes
)
SELECT
  id, 85, true, true, true, true, false,
  'CNA NNAAP standard. Indiana ISDH requires clinical skills competency verification before exam authorization.'
FROM programs
WHERE slug = 'cna-training'
ON CONFLICT (program_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. CNA competency domain seed
--    Based on NNAAP (National Nurse Aide Assessment Program) exam blueprint.
--    Indiana uses Pearson VUE for CNA testing.
--    Source: NNAAP Candidate Handbook 2024
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_competency_domains (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid    NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  domain_key   text    NOT NULL,
  domain_name  text    NOT NULL,
  exam_weight  numeric(5,2),   -- % of exam questions from this domain
  is_required  boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id, domain_key)
);

ALTER TABLE program_competency_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read competency domains"
  ON program_competency_domains FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages competency domains"
  ON program_competency_domains FOR ALL TO authenticated
  USING (get_my_role() IN ('admin','super_admin','staff'));

-- Seed CNA NNAAP domains for both CNA program slugs
INSERT INTO program_competency_domains (program_id, domain_key, domain_name, exam_weight, is_required)
SELECT p.id, d.domain_key, d.domain_name, d.exam_weight, true
FROM programs p
CROSS JOIN (VALUES
  ('physical_care',         'Physical Care Skills',                          36.00),
  ('psychosocial_care',     'Psychosocial Care Skills',                      16.00),
  ('role_responsibilities', 'Role of the Nurse Aide',                        16.00),
  ('safety_emergency',      'Safety and Emergency Procedures',               14.00),
  ('infection_control',     'Infection Control',                             14.00),
  ('communication',         'Communication and Documentation',                4.00)
) AS d(domain_key, domain_name, exam_weight)
WHERE p.slug IN ('cna-cert', 'cna-training')
ON CONFLICT (program_id, domain_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. evaluate_exam_readiness(p_user_id, p_program_id)
--    Returns a structured result: is_ready + reasons if not.
--    Pure computation — reads data, writes nothing.
--    Called by the trigger and by the status view.
-- ---------------------------------------------------------------------------

CREATE TYPE exam_readiness_result AS (
  is_ready            boolean,
  avg_checkpoint_score numeric(5,2),
  checkpoints_passed  integer,
  checkpoints_total   integer,
  lessons_completed   integer,
  lessons_total       integer,
  competencies_met    integer,
  competencies_total  integer,
  lab_signoff_met     boolean,
  failure_reasons     text[]
);

CREATE OR REPLACE FUNCTION evaluate_exam_readiness(
  p_user_id   uuid,
  p_program_id uuid
)
RETURNS exam_readiness_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_rule          program_exam_ready_rules%ROWTYPE;
  v_result        exam_readiness_result;
  v_reasons       text[] := '{}';

  -- checkpoint metrics
  v_total_checkpoints   integer := 0;
  v_passed_checkpoints  integer := 0;
  v_avg_score           numeric(5,2) := 0;

  -- lesson metrics
  v_total_lessons       integer := 0;
  v_completed_lessons   integer := 0;

  -- competency metrics
  v_total_competencies  integer := 0;
  v_met_competencies    integer := 0;

  -- lab signoff
  v_lab_signoff_met     boolean := false;

  -- course_id for this program
  v_course_id           uuid;
BEGIN
  -- Load rule for this program
  SELECT * INTO v_rule
  FROM program_exam_ready_rules
  WHERE program_id = p_program_id;

  -- No rule defined = not ready
  IF NOT FOUND THEN
    v_result.is_ready := false;
    v_result.failure_reasons := ARRAY['No exam ready rules defined for this program'];
    RETURN v_result;
  END IF;

  -- Get course_id for this program
  SELECT id INTO v_course_id
  FROM training_courses
  WHERE program_id = p_program_id
  LIMIT 1;

  -- ── CHECKPOINT EVALUATION ──────────────────────────────────────────────
  IF v_rule.require_all_checkpoints THEN
    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE cs.passed = true)::integer,
      COALESCE(AVG(cs.score) FILTER (WHERE cs.passed = true), 0)::numeric(5,2)
    INTO v_total_checkpoints, v_passed_checkpoints, v_avg_score
    FROM curriculum_lessons cl
    LEFT JOIN checkpoint_scores cs
      ON cs.lesson_id = cl.id AND cs.user_id = p_user_id
    WHERE cl.program_id = p_program_id
      AND cl.step_type = 'checkpoint';

    IF v_total_checkpoints = 0 THEN
      v_reasons := v_reasons || ARRAY['No checkpoints defined for this program'];
    ELSE
      IF v_passed_checkpoints < v_total_checkpoints THEN
        v_reasons := v_reasons || ARRAY[
          format('Checkpoints: %s of %s passed', v_passed_checkpoints, v_total_checkpoints)
        ];
      END IF;

      IF v_avg_score < v_rule.min_avg_checkpoint_score THEN
        v_reasons := v_reasons || ARRAY[
          format('Average checkpoint score %s%% is below required %s%%',
            v_avg_score, v_rule.min_avg_checkpoint_score)
        ];
      END IF;
    END IF;
  END IF;

  -- ── LESSON COMPLETION ──────────────────────────────────────────────────
  IF v_rule.require_all_lessons THEN
    SELECT COUNT(*)::integer
    INTO v_total_lessons
    FROM curriculum_lessons
    WHERE program_id = p_program_id
      AND step_type NOT IN ('checkpoint', 'lab');

    SELECT COUNT(*)::integer
    INTO v_completed_lessons
    FROM curriculum_lessons cl
    JOIN lesson_progress lp
      ON lp.lesson_id = cl.id AND lp.user_id = p_user_id AND lp.completed = true
    WHERE cl.program_id = p_program_id
      AND cl.step_type NOT IN ('checkpoint', 'lab');

    IF v_completed_lessons < v_total_lessons THEN
      v_reasons := v_reasons || ARRAY[
        format('Lessons: %s of %s completed', v_completed_lessons, v_total_lessons)
      ];
    END IF;
  END IF;

  -- ── COMPETENCY COVERAGE ────────────────────────────────────────────────
  IF v_rule.require_all_competencies THEN
    SELECT COUNT(*)::integer
    INTO v_total_competencies
    FROM program_competency_domains
    WHERE program_id = p_program_id AND is_required = true;

    -- A competency domain is "met" when at least one checkpoint covering
    -- that domain was passed by the learner
    SELECT COUNT(DISTINCT pcd.domain_key)::integer
    INTO v_met_competencies
    FROM program_competency_domains pcd
    JOIN curriculum_lessons cl
      ON cl.program_id = p_program_id
      AND pcd.domain_key = ANY(cl.competency_keys)
      AND cl.step_type = 'checkpoint'
    JOIN checkpoint_scores cs
      ON cs.lesson_id = cl.id
      AND cs.user_id = p_user_id
      AND cs.passed = true
    WHERE pcd.program_id = p_program_id
      AND pcd.is_required = true;

    IF v_met_competencies < v_total_competencies THEN
      -- List which domains are missing
      DECLARE
        v_missing_domains text;
      BEGIN
        SELECT string_agg(domain_name, ', ')
        INTO v_missing_domains
        FROM program_competency_domains pcd
        WHERE pcd.program_id = p_program_id
          AND pcd.is_required = true
          AND NOT EXISTS (
            SELECT 1
            FROM curriculum_lessons cl
            JOIN checkpoint_scores cs
              ON cs.lesson_id = cl.id
              AND cs.user_id = p_user_id
              AND cs.passed = true
            WHERE cl.program_id = p_program_id
              AND pcd.domain_key = ANY(cl.competency_keys)
              AND cl.step_type = 'checkpoint'
          );

        v_reasons := v_reasons || ARRAY[
          format('Missing competency domains: %s', COALESCE(v_missing_domains, 'unknown'))
        ];
      END;
    END IF;
  END IF;

  -- ── LAB / CLINICAL SIGNOFF ─────────────────────────────────────────────
  IF v_rule.require_lab_signoff THEN
    SELECT EXISTS (
      SELECT 1
      FROM step_submissions ss
      JOIN curriculum_lessons cl ON cl.id = ss.lesson_id
      WHERE ss.user_id = p_user_id
        AND cl.program_id = p_program_id
        AND cl.step_type = 'lab'
        AND ss.status = 'approved'
    ) INTO v_lab_signoff_met;

    IF NOT v_lab_signoff_met THEN
      v_reasons := v_reasons || ARRAY['Clinical skills lab sign-off not completed'];
    END IF;
  ELSE
    v_lab_signoff_met := true;
  END IF;

  -- ── ASSEMBLE RESULT ────────────────────────────────────────────────────
  v_result.avg_checkpoint_score := v_avg_score;
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
$$;

-- ---------------------------------------------------------------------------
-- 5. exam_ready_status view
--    Per-learner readiness status with exact failure reasons.
--    Queryable by admin, instructor, and the learner themselves.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW exam_ready_status AS
SELECT
  pe.user_id,
  pe.program_id,
  pe.id AS enrollment_id,
  p.slug AS program_slug,
  p.title AS program_title,
  r.is_ready AS exam_ready,
  r.avg_checkpoint_score,
  r.checkpoints_passed,
  r.checkpoints_total,
  r.lessons_completed,
  r.lessons_total,
  r.competencies_met,
  r.competencies_total,
  r.lab_signoff_met,
  r.failure_reasons,
  CASE
    WHEN r.is_ready THEN 'Verified Exam Ready'
    WHEN array_length(r.failure_reasons, 1) > 0 THEN 'Not Ready: ' || r.failure_reasons[1]
    ELSE 'Insufficient Data'
  END AS status_label,
  now() AS evaluated_at
FROM program_enrollments pe
JOIN programs p ON p.id = pe.program_id
CROSS JOIN LATERAL evaluate_exam_readiness(pe.user_id, pe.program_id) AS r
WHERE pe.status IN ('active', 'completed');

GRANT SELECT ON exam_ready_status TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Auto-create exam_authorization when learner becomes exam ready
--    Fires on checkpoint_scores INSERT — the last event before readiness.
--    Idempotent: will not create duplicate authorizations.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auto_create_exam_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id    uuid;
  v_readiness     exam_readiness_result;
  v_credential_id uuid;
  v_pathway_id    uuid;
  v_enrollment_id uuid;
BEGIN
  -- Get program_id from the lesson
  SELECT cl.program_id INTO v_program_id
  FROM curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id;

  IF v_program_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Evaluate readiness
  v_readiness := evaluate_exam_readiness(NEW.user_id, v_program_id);

  IF NOT v_readiness.is_ready THEN
    RETURN NEW;
  END IF;

  -- Already authorized? Skip.
  IF EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id = NEW.user_id
      AND program_id = v_program_id
      AND status NOT IN ('expired', 'revoked')
  ) THEN
    RETURN NEW;
  END IF;

  -- Get primary credential for this program
  SELECT pcp.credential_id, pcp.id
  INTO v_credential_id, v_pathway_id
  FROM program_certification_pathways pcp
  WHERE pcp.program_id = v_program_id
    AND pcp.is_primary = true
    AND pcp.active = true
  LIMIT 1;

  IF v_credential_id IS NULL THEN
    RETURN NEW; -- No pathway configured yet — do not block
  END IF;

  -- Get enrollment_id
  SELECT id INTO v_enrollment_id
  FROM program_enrollments
  WHERE user_id = NEW.user_id
    AND program_id = v_program_id
    AND status = 'active'
  LIMIT 1;

  -- Create authorization
  INSERT INTO exam_authorizations (
    user_id, credential_id, program_id, enrollment_id,
    pathway_id, status, authorized_at,
    expires_at, notes
  ) VALUES (
    NEW.user_id,
    v_credential_id,
    v_program_id,
    v_enrollment_id,
    v_pathway_id,
    'authorized',
    now(),
    now() + interval '180 days', -- 6-month window to sit for exam
    format('Auto-authorized: avg score %s%%, %s/%s checkpoints passed',
      v_readiness.avg_checkpoint_score,
      v_readiness.checkpoints_passed,
      v_readiness.checkpoints_total)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_exam_authorization ON checkpoint_scores;
CREATE TRIGGER trg_auto_exam_authorization
  AFTER INSERT ON checkpoint_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_exam_authorization();

-- ---------------------------------------------------------------------------
-- 7. program_completion_certificates — add exam_ready columns
-- ---------------------------------------------------------------------------

ALTER TABLE program_completion_certificates
  ADD COLUMN IF NOT EXISTS exam_ready            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avg_checkpoint_score  numeric(5,2),
  ADD COLUMN IF NOT EXISTS competency_domains    text[],
  ADD COLUMN IF NOT EXISTS certificate_title     text    NOT NULL DEFAULT 'Certificate of Completion',
  ADD COLUMN IF NOT EXISTS certificate_subtitle  text;

-- Update CNA certificate title/subtitle for existing rows
UPDATE program_completion_certificates pcc
SET
  certificate_title    = 'Verified Exam Ready',
  certificate_subtitle = 'Demonstrated proficiency ≥ 85% across required NNAAP competency domains'
FROM programs p
WHERE p.id = pcc.program_id
  AND p.slug IN ('cna-cert', 'cna-training')
  AND pcc.certificate_title = 'Certificate of Completion';

-- ---------------------------------------------------------------------------
-- 8. exam_outcome_tracking view — pass rate feedback loop
--    Answers: "Are our Exam Ready learners actually passing?"
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW exam_outcome_tracking AS
SELECT
  p.slug                                          AS program_slug,
  p.title                                         AS program_title,
  COUNT(DISTINCT ea.id)                           AS total_authorized,
  COUNT(DISTINCT er.id)                           AS total_attempted,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed)  AS total_passed,
  COUNT(DISTINCT er.id) FILTER (WHERE NOT er.passed) AS total_failed,
  ROUND(
    100.0 * COUNT(DISTINCT er.id) FILTER (WHERE er.passed)
    / NULLIF(COUNT(DISTINCT er.id), 0), 1
  )                                               AS first_time_pass_rate_pct,
  ROUND(AVG(er.score), 1)                         AS avg_exam_score,
  ROUND(AVG(ea_meta.avg_score), 1)                AS avg_readiness_score
FROM exam_authorizations ea
JOIN programs p ON p.id = ea.program_id
LEFT JOIN exam_results er
  ON er.authorization_id = ea.id AND er.attempt_number = 1
LEFT JOIN LATERAL (
  SELECT AVG(cs.score)::numeric AS avg_score
  FROM checkpoint_scores cs
  JOIN curriculum_lessons cl ON cl.id = cs.lesson_id
  WHERE cs.user_id = ea.user_id
    AND cl.program_id = ea.program_id
    AND cs.passed = true
) AS ea_meta ON true
WHERE ea.status IN ('authorized','scheduled','passed','failed')
GROUP BY p.slug, p.title
ORDER BY p.title;

GRANT SELECT ON exam_outcome_tracking TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. learner_exam_readiness_detail view
--    What a learner sees: exactly what they need to do to become exam ready.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW learner_exam_readiness_detail AS
SELECT
  ers.user_id,
  ers.program_id,
  ers.enrollment_id,
  ers.program_title,
  ers.exam_ready,
  ers.status_label,
  ers.avg_checkpoint_score,
  ers.checkpoints_passed,
  ers.checkpoints_total,
  ers.lessons_completed,
  ers.lessons_total,
  ers.competencies_met,
  ers.competencies_total,
  ers.lab_signoff_met,
  ers.failure_reasons,
  -- What they still need
  CASE WHEN NOT ers.exam_ready THEN ers.failure_reasons ELSE '{}' END AS remaining_requirements,
  -- Authorization if it exists
  ea.id        AS authorization_id,
  ea.status    AS authorization_status,
  ea.authorized_at,
  ea.expires_at,
  ea.exam_date
FROM exam_ready_status ers
LEFT JOIN exam_authorizations ea
  ON ea.user_id = ers.user_id
  AND ea.program_id = ers.program_id
  AND ea.status NOT IN ('expired','revoked');

GRANT SELECT ON learner_exam_readiness_detail TO authenticated, service_role;
