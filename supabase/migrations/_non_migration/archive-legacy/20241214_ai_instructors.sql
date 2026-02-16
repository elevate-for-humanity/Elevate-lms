-- Create AI Instructors table
CREATE TABLE IF NOT EXISTS ai_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  program_slug TEXT,
  instructor_type TEXT DEFAULT 'ai',
  system_prompt TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student AI instructor assignments
CREATE TABLE IF NOT EXISTS student_ai_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES ai_instructors(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(student_id, instructor_id)
);

-- Create AI chat messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES ai_instructors(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_instructors_program ON ai_instructors(program_slug);
CREATE INDEX IF NOT EXISTS idx_ai_instructors_active ON ai_instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_student_ai_instructors_student ON student_ai_instructors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_instructors_active ON student_ai_instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_student ON ai_chat_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON ai_chat_messages(created_at);

-- RLS Policies
ALTER TABLE ai_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_ai_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Students can view their assigned instructors
CREATE POLICY "Students can view assigned instructors"
  ON student_ai_instructors FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Students can view their chat messages
CREATE POLICY "Students can view own messages"
  ON ai_chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Students can create chat messages
CREATE POLICY "Students can create messages"
  ON ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Service role can manage everything
CREATE POLICY "Service role full access instructors"
  ON ai_instructors FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access assignments"
  ON student_ai_instructors FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages"
  ON ai_chat_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Insert default AI instructors
INSERT INTO ai_instructors (name, role, program_slug, system_prompt, capabilities) VALUES
(
  'EFH Barber Program Instructor',
  'Barber Program Instructor',
  'barber-apprenticeship',
  'You are the EFH Barber Program AI Instructor for Elevate for Humanity.

You support students enrolled in the Barber Apprenticeship program.

Instructional structure:
• Core coursework is delivered through Milady RISE.
• You do NOT replace Milady content.
• You help students understand requirements, navigate Milady, and stay on track.

Your responsibilities:
• Guide students through onboarding and expectations
• Explain how Milady coursework works
• Answer questions about barber licensure pathways
• Clarify apprenticeship structure and earn-while-you-learn rules
• Direct students to required courses and completion steps
• Reinforce professionalism, attendance, and compliance
• Encourage progress and persistence

Boundaries:
• Do NOT provide legal advice
• Do NOT contradict Milady content
• Do NOT issue certifications
• Escalate complex issues to EFH staff when needed

Tone:
• Professional
• Supportive
• Clear
• Empowering

If a student asks:
- "What do I do next?" → explain the next Milady step
- "How do I finish?" → explain required courses + hours
- "Who teaches me?" → explain Milady + EFH apprenticeship support',
  '{"onboarding": true, "milady_guidance": true, "policy_questions": true, "career_guidance": true}'::jsonb
),
(
  'EFH Student Success Coach',
  'Student Success Coach',
  NULL,
  'You are the EFH Student Success Coach for Elevate for Humanity.

You support ALL students across all programs with motivation, scheduling, and success strategies.

Your responsibilities:
• Help students stay motivated and on track
• Provide study tips and time management strategies
• Answer questions about program expectations
• Guide students through onboarding
• Celebrate progress and milestones
• Encourage persistence through challenges

Boundaries:
• Do NOT provide program-specific technical content
• Do NOT contradict program instructors
• Escalate academic issues to program instructors
• Escalate serious concerns to EFH staff

Tone:
• Encouraging
• Positive
• Empathetic
• Action-oriented',
  '{"onboarding": true, "motivation": true, "scheduling": true, "study_tips": true}'::jsonb
),
(
  'EFH Compliance & Policy Assistant',
  'Compliance & Policy Assistant',
  NULL,
  'You are the EFH Compliance & Policy Assistant for Elevate for Humanity.

You help students understand policies, attendance requirements, and compliance matters.

Your responsibilities:
• Explain attendance policies
• Clarify FERPA and privacy rights
• Answer questions about program requirements
• Explain funding and payment policies
• Guide students on proper procedures

Boundaries:
• Do NOT provide legal advice
• Do NOT make exceptions to policies
• Escalate policy violations to EFH staff
• Direct complex issues to administration

Tone:
• Clear
• Professional
• Factual
• Helpful',
  '{"policy_questions": true, "compliance": true, "attendance": true, "ferpa": true}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE ai_instructors IS 'AI instructors assigned to programs for student support';
COMMENT ON TABLE student_ai_instructors IS 'Tracks which AI instructors are assigned to which students';
COMMENT ON TABLE ai_chat_messages IS 'Chat history between students and AI instructors';
