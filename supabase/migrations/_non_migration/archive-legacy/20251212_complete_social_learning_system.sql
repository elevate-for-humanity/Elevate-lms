-- ============================================
-- COMPLETE SOCIAL LEARNING SYSTEM
-- Discussion Forums, Study Groups, Peer Reviews, Mentoring, Alumni Network
-- ============================================

-- ============================================
-- DISCUSSION FORUMS
-- ============================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- STUDY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  meeting_schedule JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PEER REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES peer_review_assignments(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  strengths TEXT,
  improvements TEXT,
  rubric_scores JSONB,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MENTORING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  expertise_areas TEXT[],
  years_experience INTEGER,
  max_mentees INTEGER DEFAULT 5,
  is_available BOOLEAN DEFAULT true,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  goals TEXT,
  meeting_frequency TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  UNIQUE(mentor_id, mentee_id)
);

CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES mentorship_relationships(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  action_items TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALUMNI NETWORK
-- ============================================

CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  graduation_year INTEGER,
  current_company TEXT,
  current_position TEXT,
  industry TEXT,
  location TEXT,
  willing_to_mentor BOOLEAN DEFAULT false,
  willing_to_hire BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  bio TEXT,
  achievements TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('networking', 'workshop', 'reunion', 'webinar', 'social')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  virtual_link TEXT,
  max_attendees INTEGER,
  registration_deadline TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES alumni_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- JOB PLACEMENT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  description TEXT,
  requirements TEXT[],
  salary_range TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  posted_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  application_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  resume_url TEXT,
  cover_letter TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

CREATE TABLE IF NOT EXISTS employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  salary DECIMAL(10,2),
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  industry TEXT,
  placed_through_program BOOLEAN DEFAULT false,
  program_id UUID REFERENCES programs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT SUCCESS & EARLY WARNING
-- ============================================

CREATE TABLE IF NOT EXISTS student_success_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  attendance_rate DECIMAL(5,2),
  assignment_completion_rate DECIMAL(5,2),
  average_grade DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  last_login TIMESTAMPTZ,
  days_since_login INTEGER,
  at_risk_level TEXT CHECK (at_risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors TEXT[],
  interventions_needed TEXT[],
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intervention_type TEXT CHECK (intervention_type IN ('email', 'call', 'meeting', 'tutoring', 'counseling', 'academic_support')),
  reason TEXT NOT NULL,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automated_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_type TEXT CHECK (check_in_type IN ('weekly', 'milestone', 'at_risk', 'completion')),
  questions JSONB NOT NULL,
  responses JSONB,
  sentiment_score DECIMAL(3,2),
  needs_follow_up BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- LIVE CHAT & SUPPORT
-- ============================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  support_agent_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_bot_response BOOLEAN DEFAULT false,
  attachments JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name TEXT NOT NULL UNIQUE,
  patterns TEXT[] NOT NULL,
  responses TEXT[] NOT NULL,
  category TEXT,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_course ON forum_threads(course_id);
CREATE INDEX idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX idx_forum_posts_user ON forum_posts(user_id);

CREATE INDEX idx_study_groups_course ON study_groups(course_id);
CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user ON study_group_members(user_id);

CREATE INDEX idx_peer_reviews_reviewer ON peer_reviews(reviewer_id);
CREATE INDEX idx_peer_reviews_assignment ON peer_reviews(assignment_id);

CREATE INDEX idx_mentorship_mentor ON mentorship_relationships(mentor_id);
CREATE INDEX idx_mentorship_mentee ON mentorship_relationships(mentee_id);

CREATE INDEX idx_alumni_user ON alumni_profiles(user_id);
CREATE INDEX idx_employment_user ON employment_records(user_id);
CREATE INDEX idx_employment_program ON employment_records(program_id);

CREATE INDEX idx_success_metrics_user ON student_success_metrics(user_id);
CREATE INDEX idx_success_metrics_course ON student_success_metrics(course_id);
CREATE INDEX idx_success_metrics_risk ON student_success_metrics(at_risk_level);

CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_agent ON chat_conversations(support_agent_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Forum Threads
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum threads" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own threads" ON forum_threads FOR UPDATE USING (auth.uid() = user_id);

-- Forum Posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

-- Study Groups
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public study groups" ON study_groups FOR SELECT USING (is_public = true OR EXISTS (
  SELECT 1 FROM study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid()
));
CREATE POLICY "Authenticated users can create study groups" ON study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Study Group Members
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group members" ON study_group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid())
);

-- Chat Conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = support_agent_id);
CREATE POLICY "Users can create conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND (user_id = auth.uid() OR support_agent_id = auth.uid()))
);
CREATE POLICY "Users can send messages in their conversations" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR support_agent_id = auth.uid()))
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate student success metrics
CREATE OR REPLACE FUNCTION calculate_student_success_metrics(student_id UUID, course_id_param UUID)
RETURNS void AS $$
DECLARE
  attendance DECIMAL(5,2);
  completion DECIMAL(5,2);
  avg_grade DECIMAL(5,2);
  engagement DECIMAL(5,2);
  last_login_date TIMESTAMPTZ;
  days_inactive INTEGER;
  risk_level TEXT;
  risk_factors_array TEXT[];
BEGIN
  -- Calculate attendance rate
  SELECT COALESCE(AVG(CASE WHEN attended THEN 100 ELSE 0 END), 0)
  INTO attendance
  FROM attendance_records
  WHERE user_id = student_id AND course_id = course_id_param;
  
  -- Calculate assignment completion rate
  SELECT COALESCE(AVG(CASE WHEN submitted THEN 100 ELSE 0 END), 0)
  INTO completion
  FROM assignment_submissions
  WHERE user_id = student_id;
  
  -- Calculate average grade
  SELECT COALESCE(AVG(grade), 0)
  INTO avg_grade
  FROM assignment_submissions
  WHERE user_id = student_id AND grade IS NOT NULL;
  
  -- Calculate engagement score (based on forum posts, study group participation, etc.)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM forum_posts WHERE user_id = student_id) * 2 +
    (SELECT COUNT(*) FROM study_group_messages WHERE user_id = student_id) * 1.5 +
    (SELECT COUNT(*) FROM lesson_progress WHERE user_id = student_id AND completed = true) * 1,
    0
  ) INTO engagement;
  
  -- Get last login
  SELECT last_sign_in_at INTO last_login_date
  FROM auth.users WHERE id = student_id;
  
  days_inactive := EXTRACT(DAY FROM NOW() - last_login_date);
  
  -- Determine risk level
  risk_factors_array := ARRAY[]::TEXT[];
  
  IF attendance < 70 THEN
    risk_factors_array := array_append(risk_factors_array, 'low_attendance');
  END IF;
  
  IF completion < 60 THEN
    risk_factors_array := array_append(risk_factors_array, 'low_completion');
  END IF;
  
  IF avg_grade < 70 THEN
    risk_factors_array := array_append(risk_factors_array, 'low_grades');
  END IF;
  
  IF days_inactive > 7 THEN
    risk_factors_array := array_append(risk_factors_array, 'inactive');
  END IF;
  
  IF array_length(risk_factors_array, 1) >= 3 THEN
    risk_level := 'critical';
  ELSIF array_length(risk_factors_array, 1) = 2 THEN
    risk_level := 'high';
  ELSIF array_length(risk_factors_array, 1) = 1 THEN
    risk_level := 'medium';
  ELSE
    risk_level := 'low';
  END IF;
  
  -- Insert or update metrics
  INSERT INTO student_success_metrics (
    user_id, course_id, attendance_rate, assignment_completion_rate,
    average_grade, engagement_score, last_login, days_since_login,
    at_risk_level, risk_factors, calculated_at
  ) VALUES (
    student_id, course_id_param, attendance, completion,
    avg_grade, engagement, last_login_date, days_inactive,
    risk_level, risk_factors_array, NOW()
  )
  ON CONFLICT (user_id, course_id) DO UPDATE SET
    attendance_rate = EXCLUDED.attendance_rate,
    assignment_completion_rate = EXCLUDED.assignment_completion_rate,
    average_grade = EXCLUDED.average_grade,
    engagement_score = EXCLUDED.engagement_score,
    last_login = EXCLUDED.last_login,
    days_since_login = EXCLUDED.days_since_login,
    at_risk_level = EXCLUDED.at_risk_level,
    risk_factors = EXCLUDED.risk_factors,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to match chatbot intent
CREATE OR REPLACE FUNCTION match_chatbot_intent(user_message TEXT)
RETURNS TABLE(intent_name TEXT, response TEXT, confidence DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.intent_name,
    ci.responses[1 + floor(random() * array_length(ci.responses, 1))::int] as response,
    0.8::DECIMAL as confidence
  FROM chatbot_intents ci
  WHERE ci.is_active = true
  AND EXISTS (
    SELECT 1 FROM unnest(ci.patterns) AS pattern
    WHERE user_message ILIKE '%' || pattern || '%'
  )
  ORDER BY confidence DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Forum Categories
INSERT INTO forum_categories (name, description, icon, sort_order) VALUES
('General Discussion', 'General topics and announcements', '💬', 1),
('Course Help', 'Get help with course content', '📚', 2),
('Career Advice', 'Career guidance and job search tips', '💼', 3),
('Technical Support', 'Technical issues and troubleshooting', '🔧', 4),
('Success Stories', 'Share your achievements', '🎉', 5)
ON CONFLICT DO NOTHING;

-- Chatbot Intents
INSERT INTO chatbot_intents (intent_name, patterns, responses, category) VALUES
('greeting', ARRAY['hello', 'hi', 'hey', 'good morning', 'good afternoon'], 
 ARRAY['Hello! How can I help you today?', 'Hi there! What can I assist you with?'], 'general'),
('enrollment', ARRAY['enroll', 'sign up', 'register', 'join program'], 
 ARRAY['To enroll in a program, visit our Programs page and click "Enroll Now". Need help choosing? I can connect you with an advisor.'], 'enrollment'),
('payment', ARRAY['payment', 'tuition', 'cost', 'price', 'afford'], 
 ARRAY['We offer multiple payment options including payment plans, WIOA funding, and scholarships. Would you like to speak with our financial aid team?'], 'financial'),
('technical_support', ARRAY['login', 'password', 'access', 'technical issue', 'not working'], 
 ARRAY['I can help with technical issues. Please describe the problem you''re experiencing, or I can connect you with our technical support team.'], 'support')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE forum_threads IS 'Discussion forum threads for student collaboration';
COMMENT ON TABLE study_groups IS 'Student-created study groups for collaborative learning';
COMMENT ON TABLE peer_reviews IS 'Peer review system for assignments';
COMMENT ON TABLE mentorship_relationships IS 'Mentor-mentee relationships for career guidance';
COMMENT ON TABLE alumni_profiles IS 'Alumni network profiles';
COMMENT ON TABLE employment_records IS 'Job placement and employment tracking';
COMMENT ON TABLE student_success_metrics IS 'Early warning system metrics for at-risk students';
COMMENT ON TABLE chat_conversations IS 'Live chat support conversations';
