-- Learner transcripts
-- One row per program completion. Aggregates course completions into a
-- portable transcript record. Written automatically by the completion
-- pipeline when mark_program_completed() fires.

CREATE TABLE IF NOT EXISTS transcripts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_enrollment_id UUID NOT NULL,
  program_id            UUID NOT NULL,
  program_name          TEXT NOT NULL,
  completed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_hours           NUMERIC,
  courses_completed     INTEGER NOT NULL DEFAULT 0,
  certificate_id        UUID,           -- FK to certificates after issuance
  pdf_url               TEXT,           -- generated transcript PDF
  tenant_id             UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  UNIQUE (user_id, program_enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_transcripts_user    ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_program ON transcripts(program_id);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transcripts" ON transcripts;
CREATE POLICY "Users view own transcripts" ON transcripts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage transcripts" ON transcripts;
CREATE POLICY "Admins manage transcripts" ON transcripts
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role'));

GRANT SELECT ON transcripts TO authenticated;
GRANT ALL    ON transcripts TO service_role;
