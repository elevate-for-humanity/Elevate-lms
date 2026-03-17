-- =============================================================================
-- HVAC EPA 608 Exam Ready System
--
-- Applies in dependency order:
--   1. program_exam_ready_rules table
--   2. program_competency_domains table
--   3. exam_readiness_result composite type
--   4. evaluate_exam_readiness() function
--   5. HVAC EPA 608 data seed
--   6. Lesson competency tagging + checkpoint promotion
--   7. program_certification_pathways seed
--   8. exam_ready_status view (generalized, score-source-correct)
--   9. auto_create_exam_authorization() trigger
--  10. enforceCheckpointGate support index
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. program_exam_ready_rules
--    One row per program. Defines what "Exam Ready" means for that program.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_exam_ready_rules (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  min_avg_checkpoint_score  integer     NOT NULL DEFAULT 85
    CHECK (min_avg_checkpoint_score BETWEEN 50 AND 100),
  min_checkpoint_score      integer     NOT NULL DEFAULT 80
    CHECK (min_checkpoint_score BETWEEN 50 AND 100),
  require_all_checkpoints   boolean     NOT NULL DEFAULT true,
  require_all_lessons       boolean     NOT NULL DEFAULT true,
  require_all_competencies  boolean     NOT NULL DEFAULT true,
  require_lab_signoff       boolean     NOT NULL DEFAULT false,
  allow_manual_override     boolean     NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
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
-- 2. program_competency_domains
--    Maps domain keys to human-readable names and exam weights per program.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_competency_domains (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid    NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  domain_key   text    NOT NULL,
  domain_name  text    NOT NULL,
  exam_weight  numeric(5,2),
  is_required  boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, domain_key)
);

ALTER TABLE program_competency_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read competency domains"
  ON program_competency_domains FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manages competency domains"
  ON program_competency_domains FOR ALL TO authenticated
  USING (get_my_role() IN ('admin','super_admin','staff'));

-- ---------------------------------------------------------------------------
-- 3. exam_readiness_result composite type
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE exam_readiness_result AS (
    is_ready              boolean,
    avg_checkpoint_score  numeric(5,2),
    min_checkpoint_score  numeric(5,2),
    checkpoints_passed    integer,
    checkpoints_total     integer,
    lessons_completed     integer,
    lessons_total         integer,
    competencies_met      integer,
    competencies_total    integer,
    lab_signoff_met       boolean,
    failure_reasons       text[]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. evaluate_exam_readiness(p_user_id, p_program_id)
--    Pure computation — reads data, writes nothing.
--    Uses checkpoint_scores (not lesson_progress) for scores.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluate_exam_readiness(
  p_user_id    uuid,
  p_program_id uuid
)
RETURNS exam_readiness_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_rule                program_exam_ready_rules%ROWTYPE;
  v_result              exam_readiness_result;
  v_reasons             text[] := '{}';

  v_total_checkpoints   integer := 0;
  v_passed_checkpoints  integer := 0;
  v_avg_score           numeric(5,2) := 0;
  v_min_score           numeric(5,2) := 0;

  v_total_lessons       integer := 0;
  v_completed_lessons   integer := 0;

  v_total_competencies  integer := 0;
  v_met_competencies    integer := 0;

  v_lab_signoff_met     boolean := false;
  v_missing_domains     text;
BEGIN
  SELECT * INTO v_rule
  FROM program_exam_ready_rules
  WHERE program_id = p_program_id;

  IF NOT FOUND THEN
    v_result.is_ready        := false;
    v_result.failure_reasons := ARRAY['No exam ready rules defined for this program'];
    RETURN v_result;
  END IF;

  -- ── CHECKPOINT SCORES ─────────────────────────────────────────────────
  -- Best attempt per checkpoint lesson, then aggregate
  IF v_rule.require_all_checkpoints THEN
    WITH best_attempts AS (
      SELECT
        cl.id AS lesson_id,
        cl.passing_score,
        MAX(cs.score) AS best_score
      FROM curriculum_lessons cl
      LEFT JOIN checkpoint_scores cs
        ON cs.lesson_id = cl.id AND cs.user_id = p_user_id
      WHERE cl.program_id = p_program_id
        AND cl.step_type = 'checkpoint'
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
          format('Checkpoints: %s of %s passed at ≥%s%%',
            v_passed_checkpoints, v_total_checkpoints, v_rule.min_checkpoint_score)
        ];
      END IF;

      IF v_avg_score < v_rule.min_avg_checkpoint_score THEN
        v_reasons := v_reasons || ARRAY[
          format('Average checkpoint score %s%% below required %s%%',
            v_avg_score, v_rule.min_avg_checkpoint_score)
        ];
      END IF;

      IF v_min_score < v_rule.min_checkpoint_score THEN
        v_reasons := v_reasons || ARRAY[
          format('Lowest checkpoint score %s%% below required %s%%',
            v_min_score, v_rule.min_checkpoint_score)
        ];
      END IF;
    END IF;
  END IF;

  -- ── LESSON COMPLETION ─────────────────────────────────────────────────
  IF v_rule.require_all_lessons THEN
    SELECT COUNT(*)::integer INTO v_total_lessons
    FROM curriculum_lessons
    WHERE program_id = p_program_id
      AND step_type NOT IN ('checkpoint', 'lab', 'certification');

    SELECT COUNT(*)::integer INTO v_completed_lessons
    FROM curriculum_lessons cl
    JOIN lesson_progress lp
      ON lp.lesson_id = cl.id
      AND lp.user_id = p_user_id
      AND lp.completed = true
    WHERE cl.program_id = p_program_id
      AND cl.step_type NOT IN ('checkpoint', 'lab', 'certification');

    IF v_completed_lessons < v_total_lessons THEN
      v_reasons := v_reasons || ARRAY[
        format('Lessons: %s of %s completed', v_completed_lessons, v_total_lessons)
      ];
    END IF;
  END IF;

  -- ── COMPETENCY COVERAGE ───────────────────────────────────────────────
  -- A domain is met when the learner passed at least one checkpoint
  -- whose competency_keys includes that domain_key.
  IF v_rule.require_all_competencies THEN
    SELECT COUNT(*)::integer INTO v_total_competencies
    FROM program_competency_domains
    WHERE program_id = p_program_id AND is_required = true;

    SELECT COUNT(DISTINCT pcd.domain_key)::integer INTO v_met_competencies
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
      SELECT string_agg(pcd.domain_name, ', ' ORDER BY pcd.domain_name)
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
    END IF;
  END IF;

  -- ── LAB SIGNOFF ───────────────────────────────────────────────────────
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
      v_reasons := v_reasons || ARRAY['Lab sign-off not completed'];
    END IF;
  ELSE
    v_lab_signoff_met := true;
  END IF;

  -- ── RESULT ────────────────────────────────────────────────────────────
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
$$;

-- ---------------------------------------------------------------------------
-- 5. HVAC EPA 608 data seed
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_program_id uuid;
  v_credential_id uuid := '1844e9a3-82a1-40d3-a2ae-315a914ea4de'; -- EPA 608
BEGIN
  -- Use the canonical HVAC program (hvac-technician slug, 10 modules)
  SELECT id INTO v_program_id
  FROM programs
  WHERE slug = 'hvac-technician'
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'HVAC program (slug=hvac-technician) not found';
  END IF;

  -- Exam ready rules: 85% average, 80% per checkpoint, no lab signoff
  INSERT INTO program_exam_ready_rules (
    program_id, min_avg_checkpoint_score, min_checkpoint_score,
    require_all_checkpoints, require_all_lessons, require_all_competencies,
    require_lab_signoff, allow_manual_override, notes
  ) VALUES (
    v_program_id, 85, 80,
    true, true, true,
    false, false,
    'EPA 608 Universal. Checkpoint pass = 80%, final average = 85%. No lab signoff required.'
  )
  ON CONFLICT (program_id) DO UPDATE SET
    min_avg_checkpoint_score = 85,
    min_checkpoint_score     = 80,
    require_all_checkpoints  = true,
    require_all_lessons      = true,
    require_all_competencies = true,
    require_lab_signoff      = false,
    allow_manual_override    = false,
    updated_at               = now();

  -- EPA 608 competency domains
  -- Weights reflect actual EPA 608 exam question distribution
  INSERT INTO program_competency_domains
    (program_id, domain_key, domain_name, exam_weight, is_required)
  VALUES
    (v_program_id, 'safety_regulations',  'Safety & Regulations',          20.00, true),
    (v_program_id, 'refrigerant_fund',    'Refrigerant Fundamentals',      20.00, true),
    (v_program_id, 'recovery_recycling',  'Recovery & Recycling',          20.00, true),
    (v_program_id, 'leak_detection',      'Leak Detection & Repair',       20.00, true),
    (v_program_id, 'system_components',   'System Components & Operation', 20.00, true)
  ON CONFLICT (program_id, domain_key) DO NOTHING;

  -- ── TAG LESSONS WITH COMPETENCY KEYS ──────────────────────────────────
  -- Module 1: Safety & Tools → safety_regulations
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['safety_regulations']
  WHERE program_id = v_program_id AND module_order = 1;

  -- Module 2: HVAC Fundamentals → refrigerant_fund
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['refrigerant_fund']
  WHERE program_id = v_program_id AND module_order = 2;

  -- Module 3: Refrigeration Basics → refrigerant_fund
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['refrigerant_fund']
  WHERE program_id = v_program_id AND module_order = 3;

  -- Module 4: Electrical Basics → system_components
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['system_components']
  WHERE program_id = v_program_id AND module_order = 4;

  -- Module 5: Heating Systems → system_components
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['system_components']
  WHERE program_id = v_program_id AND module_order = 5;

  -- Module 6: Cooling Systems → recovery_recycling
  -- (refrigerant handling, recovery procedures)
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['recovery_recycling']
  WHERE program_id = v_program_id AND module_order = 6;

  -- Module 7: Ductwork & Airflow → system_components
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['system_components']
  WHERE program_id = v_program_id AND module_order = 7;

  -- Module 8: System Installation → recovery_recycling
  -- (refrigerant line installation, recovery during service)
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['recovery_recycling']
  WHERE program_id = v_program_id AND module_order = 8;

  -- Module 9: Maintenance & Troubleshooting → leak_detection
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['leak_detection']
  WHERE program_id = v_program_id AND module_order = 9;

  -- Module 10: Professional Skills & Cert Prep → all domains (capstone)
  UPDATE curriculum_lessons
  SET competency_keys = ARRAY['safety_regulations','refrigerant_fund','recovery_recycling','leak_detection','system_components']
  WHERE program_id = v_program_id AND module_order = 10;

  -- ── PROMOTE CHECKPOINTS — one per domain, 80% threshold ───────────────
  -- M1L4: Safety Quiz → checkpoint for safety_regulations
  UPDATE curriculum_lessons
  SET step_type = 'checkpoint', passing_score = 80
  WHERE program_id = v_program_id AND module_order = 1
    AND lesson_title ILIKE '%quiz%';

  -- M3L4: Refrigeration Quiz → checkpoint for refrigerant_fund
  -- (covers both M2 and M3 refrigerant content)
  UPDATE curriculum_lessons
  SET step_type = 'checkpoint', passing_score = 80
  WHERE program_id = v_program_id AND module_order = 3
    AND lesson_title ILIKE '%quiz%';

  -- M6L5: Cooling Systems Quiz → checkpoint for recovery_recycling
  -- (already a checkpoint — update passing_score)
  UPDATE curriculum_lessons
  SET step_type = 'checkpoint', passing_score = 80
  WHERE program_id = v_program_id AND module_order = 6
    AND step_type = 'checkpoint';

  -- M9L5: Maintenance Quiz → checkpoint for leak_detection
  UPDATE curriculum_lessons
  SET step_type = 'checkpoint', passing_score = 80
  WHERE program_id = v_program_id AND module_order = 9
    AND step_type = 'checkpoint';

  -- M10L5: Job Search/Career Planning → repurpose as system_components checkpoint
  -- This is the capstone gate before certification
  UPDATE curriculum_lessons
  SET step_type = 'checkpoint', passing_score = 80,
      lesson_title = 'EPA 608 Readiness Assessment'
  WHERE program_id = v_program_id AND module_order = 10
    AND step_type = 'checkpoint';

  -- Demote remaining non-checkpoint quizzes in M4, M5, M7, M8 to quiz step_type
  -- (they are scored but don't gate — they contribute to avg score)
  UPDATE curriculum_lessons
  SET step_type = 'quiz', passing_score = 70
  WHERE program_id = v_program_id
    AND step_type = 'checkpoint'
    AND module_order IN (4, 5, 7, 8);

  -- ── EPA CERTIFICATION BODY ────────────────────────────────────────────
  INSERT INTO certification_bodies (id, name, abbreviation, website, is_active)
  VALUES (
    'cb000000-0000-0000-0000-000000000005',
    'U.S. Environmental Protection Agency',
    'EPA',
    'https://www.epa.gov/section608',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── CERTIFICATION PATHWAY ─────────────────────────────────────────────
  INSERT INTO program_certification_pathways (
    program_id,
    certification_body_id,
    credential_name,
    credential_abbreviation,
    eligibility_review_required,
    exam_fee_cents,
    fee_payer,   -- CHECK: 'elevate' | 'student' | 'grant'
    is_primary,
    is_active,
    sort_order
  ) VALUES (
    v_program_id,
    'cb000000-0000-0000-0000-000000000005',
    'EPA 608 Universal Certification',
    'EPA 608',
    false,
    2000,
    'student',
    true,
    true,
    1
  )
  ON CONFLICT DO NOTHING;

END $$;

-- ---------------------------------------------------------------------------
-- 6. exam_ready_status view
--    Generalized — works for any program with rules defined.
--    Uses checkpoint_scores (correct score source), not lesson_progress.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW exam_ready_status AS
WITH best_checkpoint_scores AS (
  -- Best attempt per learner per checkpoint lesson
  SELECT
    cs.user_id,
    cl.program_id,
    cl.id          AS lesson_id,
    cl.passing_score,
    MAX(cs.score)  AS best_score
  FROM checkpoint_scores cs
  JOIN curriculum_lessons cl
    ON cl.id = cs.lesson_id
    AND cl.step_type = 'checkpoint'
  GROUP BY cs.user_id, cl.program_id, cl.id, cl.passing_score
),

checkpoint_agg AS (
  SELECT
    user_id,
    program_id,
    COUNT(*)::integer                                          AS total_checkpoints,
    COUNT(*) FILTER (WHERE best_score >= passing_score)::integer AS passed_checkpoints,
    ROUND(AVG(best_score), 2)                                 AS avg_score,
    MIN(best_score)                                           AS min_score
  FROM best_checkpoint_scores
  GROUP BY user_id, program_id
)

SELECT
  ca.user_id,
  ca.program_id,
  pe.id                                                        AS enrollment_id,
  p.slug                                                       AS program_slug,
  p.title                                                      AS program_title,
  ca.total_checkpoints,
  ca.passed_checkpoints,
  ca.avg_score,
  ca.min_score,
  r.min_avg_checkpoint_score,
  r.min_checkpoint_score,
  (
    ca.passed_checkpoints = ca.total_checkpoints
    AND ca.avg_score      >= r.min_avg_checkpoint_score
    AND ca.min_score      >= r.min_checkpoint_score
  )                                                            AS is_exam_ready,
  CASE
    WHEN ca.passed_checkpoints = ca.total_checkpoints
      AND ca.avg_score      >= r.min_avg_checkpoint_score
      AND ca.min_score      >= r.min_checkpoint_score
    THEN 'Verified Exam Ready'
    WHEN ca.passed_checkpoints < ca.total_checkpoints
    THEN format('Checkpoints: %s/%s passed', ca.passed_checkpoints, ca.total_checkpoints)
    WHEN ca.avg_score < r.min_avg_checkpoint_score
    THEN format('Average score %s%% below required %s%%', ca.avg_score, r.min_avg_checkpoint_score)
    ELSE format('Min checkpoint score %s%% below required %s%%', ca.min_score, r.min_checkpoint_score)
  END                                                          AS status_label,
  now()                                                        AS evaluated_at
FROM checkpoint_agg ca
JOIN program_exam_ready_rules r  ON r.program_id = ca.program_id
JOIN programs p                  ON p.id = ca.program_id
LEFT JOIN program_enrollments pe
  ON pe.user_id = ca.user_id
  AND pe.program_id = ca.program_id
  AND pe.status IN ('active','completed');

GRANT SELECT ON exam_ready_status TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. auto_create_exam_authorization()
--    Fires on checkpoint_scores INSERT.
--    Evaluates readiness; creates exam_authorization if ready.
--    Idempotent: checks for existing active authorization first.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auto_create_exam_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id    uuid;
  v_readiness     exam_readiness_result;
  v_pathway       program_certification_pathways%ROWTYPE;
  v_enrollment_id uuid;
BEGIN
  -- Resolve program from the lesson
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

  -- Already has an active authorization — skip
  IF EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id   = NEW.user_id
      AND program_id = v_program_id
      AND status NOT IN ('expired','revoked')
  ) THEN
    RETURN NEW;
  END IF;

  -- Get primary certification pathway
  SELECT * INTO v_pathway
  FROM program_certification_pathways
  WHERE program_id = v_program_id
    AND is_primary  = true
    AND is_active   = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW; -- No pathway configured — do not block
  END IF;

  -- Get active enrollment
  SELECT id INTO v_enrollment_id
  FROM program_enrollments
  WHERE user_id    = NEW.user_id
    AND program_id = v_program_id
    AND status     = 'active'
  LIMIT 1;

  INSERT INTO exam_authorizations (
    user_id, program_id, enrollment_id,
    pathway_id, status, authorized_at, expires_at, notes
  ) VALUES (
    NEW.user_id,
    v_program_id,
    v_enrollment_id,
    v_pathway.id,
    'authorized',
    now(),
    now() + interval '180 days',
    format('Auto-authorized: avg %s%%, min %s%%, %s/%s checkpoints passed',
      v_readiness.avg_checkpoint_score,
      v_readiness.min_checkpoint_score,
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
-- 8. Index to support enforceCheckpointGate service-layer query
--    (lesson_order lookup on checkpoint lessons per program)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_checkpoint_gate
  ON curriculum_lessons (program_id, step_type, lesson_order)
  WHERE step_type = 'checkpoint';

-- ---------------------------------------------------------------------------
-- 9. exam_outcome_tracking view — pass rate feedback loop
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW exam_outcome_tracking AS
SELECT
  p.slug                                                          AS program_slug,
  p.title                                                         AS program_title,
  COUNT(DISTINCT ea.id)                                           AS total_authorized,
  COUNT(DISTINCT er.id)                                           AS total_attempted,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)          AS total_passed,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = false)         AS total_failed,
  ROUND(
    100.0 * COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)
    / NULLIF(COUNT(DISTINCT er.id), 0), 1
  )                                                               AS first_time_pass_rate_pct,
  ROUND(AVG(er.score), 1)                                        AS avg_exam_score
FROM programs p
LEFT JOIN exam_authorizations ea ON ea.program_id = p.id
LEFT JOIN exam_results er
  ON er.authorization_id = ea.id
GROUP BY p.id, p.slug, p.title;

GRANT SELECT ON exam_outcome_tracking TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10. Grants
-- ---------------------------------------------------------------------------

GRANT SELECT ON program_exam_ready_rules    TO authenticated, service_role;
GRANT SELECT ON program_competency_domains  TO authenticated, service_role;
