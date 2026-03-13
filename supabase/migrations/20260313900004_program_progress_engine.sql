-- Program progress engine
-- Adds the missing tables and views that connect course completions
-- (training_enrollments) to program-level credential issuance
-- (program_enrollments).

-- ─── 1. program_courses ──────────────────────────────────────────────────────
-- Maps which courses belong to a program and which are required for
-- program completion. Referenced by enrollment orchestration but never
-- formally created.

CREATE TABLE IF NOT EXISTS program_courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL,
  course_id    UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  is_required  BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_program_courses_program ON program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_course  ON program_courses(course_id);

ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage program_courses" ON program_courses;
CREATE POLICY "Admins manage program_courses" ON program_courses
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role'));

DROP POLICY IF EXISTS "Authenticated read program_courses" ON program_courses;
CREATE POLICY "Authenticated read program_courses" ON program_courses
  FOR SELECT USING (auth.role() = 'authenticated');

GRANT SELECT ON program_courses TO authenticated;
GRANT ALL    ON program_courses TO service_role;

-- ─── 2. completion_rules ─────────────────────────────────────────────────────
-- Data-driven completion rules. Keeps completion logic out of route
-- handlers and into the database where it can be changed without deploys.
--
-- rule_type values:
--   'all_lessons'       -- all lessons in course must be completed
--   'required_lessons'  -- only is_required=true lessons must be completed
--   'min_score'         -- config: { "min_score": 80 }
--   'all_courses'       -- all courses in program must be completed
--   'required_courses'  -- only is_required=true courses must be completed
--   'min_courses'       -- config: { "count": 4 }

CREATE TABLE IF NOT EXISTS completion_rules (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT    NOT NULL CHECK (entity_type IN ('course', 'program')),
  entity_id   UUID    NOT NULL,
  rule_type   TEXT    NOT NULL,
  config      JSONB   NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completion_rules_entity
  ON completion_rules(entity_type, entity_id)
  WHERE is_active = true;

ALTER TABLE completion_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage completion_rules" ON completion_rules;
CREATE POLICY "Admins manage completion_rules" ON completion_rules
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role'));

DROP POLICY IF EXISTS "Authenticated read completion_rules" ON completion_rules;
CREATE POLICY "Authenticated read completion_rules" ON completion_rules
  FOR SELECT USING (auth.role() = 'authenticated');

GRANT SELECT ON completion_rules TO authenticated;
GRANT ALL    ON completion_rules TO service_role;

-- ─── 3. program_course_activity view ─────────────────────────────────────────
-- Per-user, per-program rollup of course completion progress.
-- Aggregates training_enrollments so analytics dashboards get accurate
-- counts without reading program_enrollments for course activity.

CREATE OR REPLACE VIEW program_course_activity AS
SELECT
  pe.id                                                        AS program_enrollment_id,
  pe.user_id,
  pe.program_id,
  pe.status                                                    AS program_status,
  pe.enrolled_at                                               AS program_enrolled_at,
  COUNT(DISTINCT pc.course_id)                                 AS total_required_courses,
  COUNT(DISTINCT te.course_id)
    FILTER (WHERE te.completed_at IS NOT NULL)                 AS completed_courses,
  ROUND(
    COUNT(DISTINCT te.course_id)
      FILTER (WHERE te.completed_at IS NOT NULL)::NUMERIC
    / NULLIF(COUNT(DISTINCT pc.course_id), 0) * 100
  )                                                            AS program_progress_pct,
  (COUNT(DISTINCT pc.course_id) > 0
   AND COUNT(DISTINCT pc.course_id)
     = COUNT(DISTINCT te.course_id)
         FILTER (WHERE te.completed_at IS NOT NULL))           AS all_courses_complete,
  MAX(te.completed_at)                                         AS last_course_completed_at
FROM program_enrollments pe
JOIN program_courses pc
  ON  pc.program_id  = pe.program_id
  AND pc.is_required = true
LEFT JOIN training_enrollments te
  ON  te.user_id   = pe.user_id
  AND te.course_id = pc.course_id
GROUP BY pe.id, pe.user_id, pe.program_id, pe.status, pe.enrolled_at;

GRANT SELECT ON program_course_activity TO authenticated;
GRANT SELECT ON program_course_activity TO service_role;

-- ─── 4. program_completion_candidates view ───────────────────────────────────
-- Learners who have completed all required courses but whose
-- program_enrollment.status is not yet 'completed'.

CREATE OR REPLACE VIEW program_completion_candidates AS
SELECT
  pca.program_enrollment_id,
  pca.user_id,
  pca.program_id,
  pca.last_course_completed_at,
  pe.cohort_id,
  pe.funding_source
FROM program_course_activity pca
JOIN program_enrollments pe ON pe.id = pca.program_enrollment_id
WHERE pca.all_courses_complete = true
  AND pe.status != 'completed';

GRANT SELECT ON program_completion_candidates TO authenticated;
GRANT SELECT ON program_completion_candidates TO service_role;

-- ─── 5. check_program_completion function ────────────────────────────────────
-- Called by the API after each course completion.
-- Returns the program_enrollment row if completing this course satisfies
-- all required courses for the program.

CREATE OR REPLACE FUNCTION check_program_completion(
  p_user_id   UUID,
  p_course_id UUID
)
RETURNS TABLE (
  program_enrollment_id UUID,
  program_id            UUID,
  user_id               UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pcc.program_enrollment_id,
    pcc.program_id,
    pcc.user_id
  FROM program_completion_candidates pcc
  JOIN program_courses pc
    ON  pc.program_id  = pcc.program_id
    AND pc.course_id   = p_course_id
    AND pc.is_required = true
  WHERE pcc.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION check_program_completion(UUID, UUID) TO service_role;

-- ─── 6. mark_program_completed function ──────────────────────────────────────
-- Marks program_enrollment as completed. Idempotent.

CREATE OR REPLACE FUNCTION mark_program_completed(
  p_program_enrollment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE program_enrollments
  SET
    status       = 'completed',
    completed_at = NOW(),
    updated_at   = NOW()
  WHERE id     = p_program_enrollment_id
    AND status != 'completed';
END;
$$;

GRANT EXECUTE ON FUNCTION mark_program_completed(UUID) TO service_role;
