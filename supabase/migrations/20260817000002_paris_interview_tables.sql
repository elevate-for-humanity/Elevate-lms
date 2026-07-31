-- PARS Interview Engine Database Schema
-- Student-facing AI interview system for program admission

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS paris_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  application_ref VARCHAR(50) NOT NULL,
  program_slug VARCHAR(100) NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  responses JSONB DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  status VARCHAR(30) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  risk_score VARCHAR(20),
  eligibility_status VARCHAR(20),
  total_score INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview Messages Table
CREATE TABLE IF NOT EXISTS paris_interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL REFERENCES paris_interview_sessions(session_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('paris', 'applicant')),
  content TEXT NOT NULL,
  question_id VARCHAR(50),
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_application_ref ON paris_interview_sessions(application_ref);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON paris_interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_program ON paris_interview_sessions(program_slug);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created ON paris_interview_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_interview_messages_session ON paris_interview_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_messages_created ON paris_interview_messages(created_at);

-- Row Level Security Policies
ALTER TABLE paris_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paris_interview_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview sessions
CREATE POLICY "Service role can manage all interview sessions"
  ON paris_interview_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view their own interview sessions"
  ON paris_interview_sessions
  FOR SELECT
  TO authenticated
  USING (application_ref IN (
    SELECT application_ref 
    FROM paris_applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- RLS Policies for interview messages
CREATE POLICY "Service role can manage all interview messages"
  ON paris_interview_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view their own interview messages"
  ON paris_interview_messages
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT session_id 
    FROM paris_interview_sessions 
    WHERE application_ref IN (
      SELECT application_ref 
      FROM paris_applications 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  ));

-- Trigger to update application status when interview completes
CREATE OR REPLACE FUNCTION update_application_on_interview_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE paris_applications
    SET 
      status = CASE 
        WHEN NEW.eligibility_status = 'eligible' THEN 'interview_eligible'
        WHEN NEW.eligibility_status = 'review' THEN 'interview_review'
        ELSE 'interview_denied'
      END,
      interview_completed_at = NEW.completed_at,
      interview_score = NEW.total_score,
      eligibility_status = NEW.eligibility_status,
      risk_level = NEW.risk_score,
      updated_at = NOW()
    WHERE application_ref = NEW.application_ref;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_on_interview_complete
  AFTER UPDATE OF status ON paris_interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_application_on_interview_complete();

-- Function to get interview session statistics
CREATE OR REPLACE FUNCTION get_interview_stats_by_program(program VARCHAR)
RETURNS TABLE (
  total_sessions INTEGER,
  completed_sessions INTEGER,
  avg_score NUMERIC,
  eligible_count INTEGER,
  review_count INTEGER,
  denied_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_sessions,
    COUNT(*) FILTER (WHERE pis.status = 'completed')::INTEGER AS completed_sessions,
    AVG(pis.total_score)::NUMERIC AS avg_score,
    COUNT(*) FILTER (WHERE pis.eligibility_status = 'eligible')::INTEGER AS eligible_count,
    COUNT(*) FILTER (WHERE pis.eligibility_status = 'review')::INTEGER AS review_count,
    COUNT(*) FILTER (WHERE pis.eligibility_status = 'denied')::INTEGER AS denied_count
  FROM paris_interview_sessions pis
  WHERE pis.program_slug = program;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE paris_interview_sessions IS 'Stores PARS AI interview sessions for student applications';
COMMENT ON TABLE paris_interview_messages IS 'Individual messages exchanged during PARS interview sessions';
COMMENT ON COLUMN paris_interview_sessions.risk_score IS 'Risk assessment: low, medium, or high based on interview performance';
COMMENT ON COLUMN paris_interview_sessions.eligibility_status IS 'Eligibility determination: eligible, review, or denied';
COMMENT ON COLUMN paris_interview_sessions.responses IS 'JSON object mapping question IDs to student responses';
COMMENT ON COLUMN paris_interview_sessions.messages IS 'JSON array of conversation messages with timestamps';
