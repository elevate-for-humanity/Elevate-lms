-- =============================================================================
-- Exam Ready System — Calibration Query Pack
--
-- Run these after your first cohort (10–20 learners) to validate whether
-- your thresholds are predictive, not just internally consistent.
--
-- Re-run every cohort. Adjust program_exam_ready_rules and
-- program_competency_domains.domain_min_score based on findings.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. FUNNEL OVERVIEW
--    How many learners reached each stage?
--    Identifies where the pipeline is leaking.
-- ---------------------------------------------------------------------------

SELECT
  p.title                                                   AS program,
  COUNT(DISTINCT pe.user_id)                                AS enrolled,
  COUNT(DISTINCT ers.user_id)
    FILTER (WHERE ers.is_exam_ready)                        AS exam_ready,
  COUNT(DISTINCT ea.user_id)                                AS authorized,
  COUNT(DISTINCT es.authorization_id)                       AS scheduled,
  COUNT(DISTINCT es.authorization_id)
    FILTER (WHERE es.outcome != 'no_show')                  AS sat,
  COUNT(DISTINCT er.authorization_id)
    FILTER (WHERE er.passed = true)                         AS passed,
  -- Drop-off rates
  ROUND(100.0 * COUNT(DISTINCT ers.user_id) FILTER (WHERE ers.is_exam_ready)
    / NULLIF(COUNT(DISTINCT pe.user_id), 0), 1)             AS pct_reached_ready,
  ROUND(100.0 * COUNT(DISTINCT er.authorization_id) FILTER (WHERE er.passed = true)
    / NULLIF(COUNT(DISTINCT es.authorization_id) FILTER (WHERE es.outcome != 'no_show'), 0), 1)
                                                            AS first_time_pass_rate
FROM programs p
JOIN program_enrollments pe   ON pe.program_id = p.id
LEFT JOIN exam_ready_status ers
  ON ers.program_id = p.id AND ers.user_id = pe.user_id
LEFT JOIN exam_authorizations ea
  ON ea.program_id = p.id AND ea.user_id = pe.user_id
LEFT JOIN exam_scheduling es  ON es.authorization_id = ea.id
LEFT JOIN exam_results er     ON er.authorization_id = ea.id
WHERE p.slug = 'hvac-technician'  -- change per program
GROUP BY p.id, p.title;


-- ---------------------------------------------------------------------------
-- 2. DOMAIN SCORE vs EXAM OUTCOME
--    Does scoring well in a domain predict passing the real exam?
--    High domain avg + fail = content misaligned with exam.
--    Low domain avg + pass = threshold may be too strict.
-- ---------------------------------------------------------------------------

WITH domain_scores AS (
  SELECT
    cs.user_id,
    cl.program_id,
    pcd.domain_name,
    pcd.domain_min_score,
    AVG(cs.score)::numeric(5,1)   AS avg_domain_score
  FROM checkpoint_scores cs
  JOIN curriculum_lessons cl
    ON cl.id = cs.lesson_id AND cl.step_type = 'checkpoint'
  JOIN program_competency_domains pcd
    ON pcd.program_id = cl.program_id
    AND pcd.domain_key = ANY(cl.competency_keys)
  WHERE cs.passed = true
  GROUP BY cs.user_id, cl.program_id, pcd.domain_name, pcd.domain_min_score
)
SELECT
  ds.domain_name,
  ds.domain_min_score                                       AS floor,
  ROUND(AVG(ds.avg_domain_score), 1)                        AS cohort_avg,
  ROUND(AVG(ds.avg_domain_score)
    FILTER (WHERE er.passed = true), 1)                     AS avg_when_passed,
  ROUND(AVG(ds.avg_domain_score)
    FILTER (WHERE er.passed = false), 1)                    AS avg_when_failed,
  COUNT(DISTINCT ds.user_id)                                AS learners,
  COUNT(DISTINCT ds.user_id) FILTER (WHERE er.passed = true)  AS passed_exam,
  COUNT(DISTINCT ds.user_id) FILTER (WHERE er.passed = false) AS failed_exam
FROM domain_scores ds
JOIN programs p ON p.id = ds.program_id AND p.slug = 'hvac-technician'
LEFT JOIN exam_authorizations ea
  ON ea.user_id = ds.user_id AND ea.program_id = ds.program_id
LEFT JOIN exam_results er ON er.authorization_id = ea.id
GROUP BY ds.domain_name, ds.domain_min_score
ORDER BY ds.domain_name;


-- ---------------------------------------------------------------------------
-- 3. THRESHOLD SENSITIVITY
--    What % of learners would be blocked at different avg thresholds?
--    Use this to decide if 85% is too tight or too loose.
-- ---------------------------------------------------------------------------

WITH learner_avgs AS (
  SELECT
    cs.user_id,
    cl.program_id,
    AVG(cs.score)::numeric(5,1) AS avg_score
  FROM checkpoint_scores cs
  JOIN curriculum_lessons cl ON cl.id = cs.lesson_id AND cl.step_type = 'checkpoint'
  WHERE cs.passed = true
  GROUP BY cs.user_id, cl.program_id
)
SELECT
  threshold,
  COUNT(*) FILTER (WHERE avg_score >= threshold)            AS would_pass,
  COUNT(*) FILTER (WHERE avg_score < threshold)             AS would_block,
  ROUND(100.0 * COUNT(*) FILTER (WHERE avg_score >= threshold)
    / NULLIF(COUNT(*), 0), 1)                               AS pct_passing
FROM learner_avgs
JOIN programs p ON p.id = program_id AND p.slug = 'hvac-technician'
CROSS JOIN (VALUES (75),(80),(82),(85),(87),(90)) AS t(threshold)
GROUP BY threshold
ORDER BY threshold;


-- ---------------------------------------------------------------------------
-- 4. NO-SHOW ANALYSIS
--    Are no-shows correlated with low readiness scores or long wait times?
--    High no-show + low avg = scheduling too fast, learner not confident.
--    High no-show + high avg = logistics problem, not readiness problem.
-- ---------------------------------------------------------------------------

SELECT
  es.outcome,
  COUNT(*)                                                  AS count,
  ROUND(AVG(ers.avg_score), 1)                              AS avg_checkpoint_score,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (es.created_at - ea.authorized_at)) / 86400
  ), 1)                                                     AS avg_days_auth_to_schedule,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (es.scheduled_date::timestamptz - ea.authorized_at)) / 86400
  ), 1)                                                     AS avg_days_auth_to_exam
FROM exam_scheduling es
JOIN exam_authorizations ea ON ea.id = es.authorization_id
JOIN programs p ON p.id = ea.program_id AND p.slug = 'hvac-technician'
LEFT JOIN exam_ready_status ers
  ON ers.user_id = ea.user_id AND ers.program_id = ea.program_id
WHERE es.outcome IS NOT NULL
GROUP BY es.outcome
ORDER BY count DESC;


-- ---------------------------------------------------------------------------
-- 5. TIME-TO-EXAM DISTRIBUTION
--    How long from authorization to sitting?
--    Outliers (>30 days) are where you lose learners.
-- ---------------------------------------------------------------------------

SELECT
  ea.user_id,
  p.title                                                   AS program,
  ea.authorized_at::date                                    AS authorized_date,
  es.scheduled_date,
  es.outcome,
  er.passed                                                 AS exam_passed,
  er.score                                                  AS exam_score,
  (es.scheduled_date - ea.authorized_at::date)              AS days_to_exam,
  ers.avg_score                                             AS readiness_avg
FROM exam_authorizations ea
JOIN programs p ON p.id = ea.program_id AND p.slug = 'hvac-technician'
LEFT JOIN exam_scheduling es  ON es.authorization_id = ea.id
LEFT JOIN exam_results er     ON er.authorization_id = ea.id
LEFT JOIN exam_ready_status ers
  ON ers.user_id = ea.user_id AND ers.program_id = ea.program_id
ORDER BY ea.authorized_at DESC;


-- ---------------------------------------------------------------------------
-- 6. CHECKPOINT RETAKE PATTERNS
--    Which checkpoints are learners retaking most?
--    High retake count = content gap or question quality issue.
-- ---------------------------------------------------------------------------

SELECT
  cl.lesson_title                                           AS checkpoint,
  cl.module_order,
  pcd.domain_name,
  COUNT(cs.id)                                              AS total_attempts,
  COUNT(DISTINCT cs.user_id)                                AS unique_learners,
  ROUND(COUNT(cs.id)::numeric / NULLIF(COUNT(DISTINCT cs.user_id), 0), 1)
                                                            AS avg_attempts_per_learner,
  ROUND(100.0 * COUNT(cs.id) FILTER (WHERE cs.passed = true)
    / NULLIF(COUNT(cs.id), 0), 1)                           AS pass_rate_pct,
  ROUND(AVG(cs.score), 1)                                   AS avg_score
FROM checkpoint_scores cs
JOIN curriculum_lessons cl ON cl.id = cs.lesson_id
JOIN programs p ON p.id = cl.program_id AND p.slug = 'hvac-technician'
LEFT JOIN program_competency_domains pcd
  ON pcd.program_id = cl.program_id
  AND pcd.domain_key = ANY(cl.competency_keys)
GROUP BY cl.id, cl.lesson_title, cl.module_order, pcd.domain_name
ORDER BY avg_attempts_per_learner DESC, pass_rate_pct ASC;


-- ---------------------------------------------------------------------------
-- CALIBRATION DECISION GUIDE
--
-- After running these queries, use this logic to adjust thresholds:
--
-- avg_when_passed >> avg_when_failed for a domain
--   → domain floor is predictive, keep or raise it
--
-- avg_when_passed ≈ avg_when_failed for a domain
--   → domain floor is not predictive, lower it or remove it
--
-- pct_passing at 85% < 60%
--   → threshold may be causing unnecessary attrition, consider 82%
--
-- pct_passing at 85% > 90%
--   → threshold may be too easy, consider 87%
--
-- avg_days_auth_to_exam > 14 for no-shows
--   → scheduling delay is causing drop-off, tighten SLA
--
-- avg_attempts_per_learner > 2 on a checkpoint
--   → review question quality or content coverage for that domain
-- ---------------------------------------------------------------------------
