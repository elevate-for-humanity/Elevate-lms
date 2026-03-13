-- Create exam_events table for proctoring event logging.
-- Referenced by app/api/exams/events/route.ts

CREATE TABLE IF NOT EXISTS exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_events_session ON exam_events(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_events_user ON exam_events(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_events_type ON exam_events(event_type);

-- RLS: users can insert their own events, admins can read all
ALTER TABLE exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exam events"
  ON exam_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exam events"
  ON exam_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON exam_events FOR ALL
  USING (auth.role() = 'service_role');
