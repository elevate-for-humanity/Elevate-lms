-- ============================================================
-- ZORA — Zero Obstacles, Ready Advisors
-- Career Guidance Interview System
-- ============================================================

-- AI Interview Sessions
-- Tracks career guidance conversations with applicants
CREATE TABLE IF NOT EXISTS public.ai_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'career_guidance',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_step TEXT DEFAULT 'greeting',
  session_data JSONB DEFAULT '{}',
  recommended_programs TEXT[],
  assessment_score INTEGER,
  assessment_notes TEXT,
  next_steps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_type ON ai_interview_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_created ON ai_interview_sessions(created_at DESC);

-- AI Interview Messages
-- Stores conversation history for each session
CREATE TABLE IF NOT EXISTS public.ai_interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_interview_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
  content TEXT NOT NULL,
  message_order INTEGER,
  assessment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_interview_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_order ON ai_interview_messages(session_id, message_order);

-- AI Interview Assessments
-- Stores structured assessment results after session completion
CREATE TABLE IF NOT EXISTS public.ai_interview_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_interview_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Career interests
  career_goals TEXT[],
  expressed_interests TEXT[],
  
  -- Assessment dimensions (1-5 scale)
  goal_clarity INTEGER CHECK (goal_clarity BETWEEN 1 AND 5),
  experience_level INTEGER CHECK (experience_level BETWEEN 1 AND 5),
  readiness_score INTEGER CHECK (readiness_score BETWEEN 1 AND 5),
  funding_indicators INTEGER CHECK (funding_indicators BETWEEN 1 AND 5),
  
  -- Barriers identified
  barriers TEXT[],
  barrier_notes TEXT,
  
  -- Recommendations
  recommended_programs TEXT[],
  recommended_next_steps TEXT,
  recommended_contact TEXT,
  
  -- Overall assessment
  overall_recommendation TEXT CHECK (overall_recommendation IN ('immediate_enrollment', 'pre_enrollment_prep', 'exploration', 'not_ready')),
  readiness_summary TEXT,
  
  -- Review status
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for assessment queries
CREATE INDEX IF NOT EXISTS idx_ai_assessments_session ON ai_interview_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_user ON ai_interview_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_recommendation ON ai_interview_assessments(overall_recommendation);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_created ON ai_interview_assessments(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ai_interview_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_interview_sessions_updated_at
  BEFORE UPDATE ON public.ai_interview_sessions
  FOR EACH ROW EXECUTE FUNCTION update_ai_interview_updated_at();

CREATE TRIGGER update_ai_interview_assessments_updated_at
  BEFORE UPDATE ON public.ai_interview_assessments
  FOR EACH ROW EXECUTE FUNCTION update_ai_interview_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.ai_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interview_assessments ENABLE ROW LEVEL SECURITY;

-- Users can see their own sessions
CREATE POLICY "Users can view own sessions" ON public.ai_interview_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.ai_interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.ai_interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can see their own messages
CREATE POLICY "Users can view own messages" ON public.ai_interview_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_interview_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages" ON public.ai_interview_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_interview_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Users can see their own assessments
CREATE POLICY "Users can view own assessments" ON public.ai_interview_assessments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all
CREATE POLICY "Admins can view all sessions" ON public.ai_interview_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can view all messages" ON public.ai_interview_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.ai_interview_sessions s ON s.user_id = p.id
      WHERE p.is_admin = true AND s.id = session_id
    )
  );

CREATE POLICY "Admins can view all assessments" ON public.ai_interview_assessments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update assessments" ON public.ai_interview_assessments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can do everything (for internal operations)
CREATE POLICY "Service role full access sessions" ON public.ai_interview_sessions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access messages" ON public.ai_interview_messages
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access assessments" ON public.ai_interview_assessments
  FOR ALL TO service_role USING (true);

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE public.ai_interview_sessions IS 'ZORA career guidance interview sessions — tracks conversation state and assessment results';
COMMENT ON TABLE public.ai_interview_messages IS 'Individual messages in ZORA career guidance conversations';
COMMENT ON TABLE public.ai_interview_assessments IS 'Structured assessment results from ZORA career guidance interviews';
