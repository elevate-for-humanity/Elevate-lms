-- Certificate idempotency constraints
--
-- Prevents duplicate certificate issuance at the database level.
-- The application layer has a soft idempotency check (SELECT before INSERT),
-- but concurrent requests can both pass that check. These constraints are the
-- hard guarantee that only one certificate per learner+credential can exist.
--
-- Three constraints:
--   1. Unique certificate_number — no two certificates share a serial
--   2. Partial unique (student_id, course_id) — one cert per learner per course
--   3. Partial unique (student_id, program_id) — one cert per learner per program
--
-- Both #2 and #3 are partial (WHERE NOT NULL) because:
--   - Program-completion certificates have course_id = NULL
--   - Course certificates may have program_id = NULL
--   - A learner can hold both a course cert and a program cert
--
-- Pre-flight: if duplicates already exist, this migration will fail.
-- Run the duplicate audit query below first and resolve before applying.
--
-- Duplicate audit (run manually before applying):
--   SELECT student_id, course_id, COUNT(*) AS n
--   FROM certificates
--   WHERE course_id IS NOT NULL AND student_id IS NOT NULL
--   GROUP BY student_id, course_id HAVING COUNT(*) > 1;
--
--   SELECT student_id, program_id, COUNT(*) AS n
--   FROM certificates
--   WHERE program_id IS NOT NULL AND student_id IS NOT NULL
--   GROUP BY student_id, program_id HAVING COUNT(*) > 1;

-- 1. Unique certificate_number (partial: only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_number
  ON certificates (certificate_number)
  WHERE certificate_number IS NOT NULL;

-- 2. One certificate per learner per course
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_student_course
  ON certificates (student_id, course_id)
  WHERE student_id IS NOT NULL AND course_id IS NOT NULL;

-- 3. One certificate per learner per program
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_student_program
  ON certificates (student_id, program_id)
  WHERE student_id IS NOT NULL AND program_id IS NOT NULL;

-- Index to support the idempotency SELECT in issueCertificate()
-- (student_id lookup is the hot path — both user_id and student_id columns exist)
CREATE INDEX IF NOT EXISTS idx_certificates_student_id
  ON certificates (student_id)
  WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_user_id
  ON certificates (user_id)
  WHERE user_id IS NOT NULL;

-- Comment documenting the constraint intent for future maintainers
COMMENT ON INDEX uq_certificates_student_course IS
  'Prevents duplicate certificate issuance for the same learner and course. '
  'Application code must handle unique_violation (23505) by returning the existing certificate.';

COMMENT ON INDEX uq_certificates_student_program IS
  'Prevents duplicate certificate issuance for the same learner and program. '
  'Application code must handle unique_violation (23505) by returning the existing certificate.';
