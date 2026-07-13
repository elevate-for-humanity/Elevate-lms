-- Link certificates to exam_sessions for competency-verified credential issuance.
-- Allows auditors to trace: certificate → exam session → proctor + score + provider.
--
-- ON DELETE SET NULL: deleting an exam_session should not cascade-delete the certificate.
-- The certificate remains valid; the exam linkage becomes null.

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS exam_session_id UUID
  REFERENCES exam_sessions(id) ON DELETE SET NULL;

-- Partial index: only index rows that have an exam session link.
-- Supports lookups like "show all certificates tied to proctored exams."
CREATE INDEX IF NOT EXISTS idx_certificates_exam_session
  ON certificates(exam_session_id)
  WHERE exam_session_id IS NOT NULL;

-- Also add the result index to exam_sessions (applied to prod earlier).
CREATE INDEX IF NOT EXISTS idx_exam_sessions_result
  ON exam_sessions(result);
