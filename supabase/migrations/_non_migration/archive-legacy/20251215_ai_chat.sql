-- AI Chat System
-- Provides real-time AI instructor chat for students

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  instructor_id uuid NOT NULL REFERENCES ai_instructors(id),
  program_slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, program_slug)
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_student ON ai_chat_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON ai_chat_messages(created_at DESC);

-- RLS Policies
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Students can view their own sessions
CREATE POLICY "Students can view their sessions"
  ON ai_chat_sessions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can view messages in their sessions
CREATE POLICY "Students can view their messages"
  ON ai_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM ai_chat_sessions WHERE student_id = auth.uid()
    )
  );

-- Service role can manage everything
CREATE POLICY "Service role can manage sessions"
  ON ai_chat_sessions
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage messages"
  ON ai_chat_messages
  FOR ALL
  TO service_role
  USING (true);

-- Comments
COMMENT ON TABLE ai_chat_sessions IS 'Chat sessions between students and AI instructors';
COMMENT ON TABLE ai_chat_messages IS 'Individual messages in AI chat sessions';
COMMENT ON COLUMN ai_chat_messages.role IS 'Either user (student) or assistant (AI instructor)';
