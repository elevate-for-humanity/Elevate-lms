-- ============================================================================
-- AI INSTRUCTOR AND CERTIFICATE SYSTEM
-- ============================================================================

-- AI Instructor configurations per program
CREATE TABLE IF NOT EXISTS ai_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  instructor_name TEXT NOT NULL,
  instructor_avatar_url TEXT,
  voice_id TEXT, -- ElevenLabs voice ID
  personality_prompt TEXT, -- AI personality instructions
  welcome_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_instructors_program ON ai_instructors(program_id);

-- AI Instructor lesson scripts (what AI says for each lesson)
CREATE TABLE IF NOT EXISTS lesson_ai_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  script_type TEXT NOT NULL CHECK (script_type IN ('introduction', 'summary', 'encouragement', 'quiz_intro')),
  script_text TEXT NOT NULL,
  audio_url TEXT, -- Generated TTS audio URL
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_scripts_lesson ON lesson_ai_scripts(lesson_id);

-- Module completion certificates (from partners)
CREATE TABLE IF NOT EXISTS module_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_name TEXT NOT NULL,
  issued_by TEXT NOT NULL, -- Partner name (HSI, Certiport, etc.)
  issued_date DATE NOT NULL,
  certificate_url TEXT, -- PDF URL
  verification_url TEXT,
  is_partner_cert BOOLEAN DEFAULT false,
  partner_course_id UUID REFERENCES partner_courses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_certs_user ON module_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_module_certs_module ON module_certificates(module_id);

-- Program completion certificates (from Elevate)
CREATE TABLE IF NOT EXISTS program_completion_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  program_title TEXT NOT NULL,
  completion_date DATE NOT NULL,
  certificate_url TEXT, -- PDF URL
  verification_url TEXT,
  total_hours DECIMAL(10,2),
  grade_percentage DECIMAL(5,2),
  honors TEXT, -- 'with honors', 'with distinction', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_certs_user ON program_completion_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_program_certs_program ON program_completion_certificates(program_id);

-- AI Instructor interactions log
CREATE TABLE IF NOT EXISTS ai_instructor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('welcome', 'lesson_intro', 'lesson_complete', 'encouragement', 'quiz_feedback', 'module_complete', 'program_complete')),
  message_text TEXT NOT NULL,
  audio_played BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_instructor_interactions(user_id);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- View to check if student can get program certificate
CREATE OR REPLACE VIEW student_graduation_eligibility AS
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.program_id,
  p.title as program_title,
  
  -- Lesson completion
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) as completed_lessons,
  
  -- Required certifications
  COUNT(DISTINCT prc.id) as total_required_certs,
  COUNT(DISTINCT CASE WHEN scp.status = 'completed' THEN prc.id END) as completed_certs,
  
  -- Module certificates
  COUNT(DISTINCT m.id) as total_modules,
  COUNT(DISTINCT mc.module_id) as modules_with_certs,
  
  -- Eligibility
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) = COUNT(DISTINCT l.id)
     AND (COUNT(DISTINCT prc.id) = 0 OR COUNT(DISTINCT CASE WHEN scp.status = 'completed' THEN prc.id END) = COUNT(DISTINCT prc.id))
    THEN true
    ELSE false
  END as eligible_for_graduation,
  
  -- Has already graduated?
  EXISTS(SELECT 1 FROM program_completion_certificates pcc WHERE pcc.enrollment_id = e.id) as has_graduated

FROM enrollments e
JOIN programs p ON p.id = e.program_id
LEFT JOIN modules m ON m.program_id = e.program_id
LEFT JOIN lessons l ON l.program_id = e.program_id
LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
LEFT JOIN program_required_certifications prc ON prc.program_id = e.program_id
LEFT JOIN student_certification_progress scp ON scp.user_id = e.user_id 
  AND scp.program_id = e.program_id 
  AND scp.partner_course_id = prc.partner_course_id
LEFT JOIN module_certificates mc ON mc.user_id = e.user_id AND mc.module_id = m.id
WHERE e.status = 'active'
GROUP BY e.id, e.user_id, e.program_id, p.title;

-- Default AI Instructor for Medical Assistant program
INSERT INTO ai_instructors (program_id, instructor_name, instructor_avatar_url, personality_prompt, welcome_message)
SELECT 
  id,
  'Dr. Sarah Mitchell',
  '/avatars/dr-sarah.png',
  'You are Dr. Sarah Mitchell, a friendly and encouraging medical assistant instructor with 15 years of experience. You speak in a warm, professional tone and always encourage students. Keep explanations clear and concise.',
  'Welcome to the Medical Assistant program! I''m Dr. Sarah Mitchell, and I''ll be guiding you through every step of your journey to becoming a certified medical assistant. Let''s get started!'
FROM programs 
WHERE slug = 'medical-assistant'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ai_instructors IS 'AI instructor avatars and personalities for each program';
COMMENT ON TABLE lesson_ai_scripts IS 'AI-generated scripts and audio for lesson guidance';
COMMENT ON TABLE module_certificates IS 'Certificates issued by partners after module completion';
COMMENT ON TABLE program_completion_certificates IS 'Final certificates issued by Elevate after program completion';
COMMENT ON TABLE ai_instructor_interactions IS 'Log of all AI instructor interactions with students';
