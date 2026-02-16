-- =====================================================
-- COMPLETE ACTIVATION MIGRATION
-- All tables needed for LMS features activation
-- Date: November 25, 2025
-- =====================================================

-- =====================================================
-- FORUMS TABLES
-- =====================================================

-- Forums table
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion threads table
CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion posts table
CREATE TABLE IF NOT EXISTS public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDY GROUPS TABLES
-- =====================================================

-- Study groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  modality TEXT CHECK (modality IN ('online', 'in_person', 'hybrid')),
  schedule TEXT,
  location TEXT,
  meeting_link TEXT,
  max_members INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  next_session TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study group members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =====================================================
-- LEARNING ACTIVITY & ANALYTICS TABLES
-- =====================================================

-- Learning activity table (for analytics)
CREATE TABLE IF NOT EXISTS public.learning_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  minutes_spent INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Forums indexes
CREATE INDEX IF NOT EXISTS idx_forums_pinned ON public.forums(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_forum ON public.discussion_threads(forum_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_user ON public.discussion_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_last_post ON public.discussion_threads(last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON public.discussion_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_user ON public.discussion_posts(user_id);

-- Study groups indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_active ON public.study_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);

-- Learning activity indexes
CREATE INDEX IF NOT EXISTS idx_learning_activity_user ON public.learning_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activity_date ON public.learning_activity(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_date ON public.learning_activity(user_id, activity_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;

-- Forums policies
CREATE POLICY "Forums are viewable by authenticated users" 
  ON public.forums FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage forums" 
  ON public.forums FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Discussion threads policies
CREATE POLICY "Threads are viewable by authenticated users" 
  ON public.discussion_threads FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create threads" 
  ON public.discussion_threads FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
  ON public.discussion_threads FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Discussion posts policies
CREATE POLICY "Posts are viewable by authenticated users" 
  ON public.discussion_posts FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create posts" 
  ON public.discussion_posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.discussion_posts FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Study groups policies
CREATE POLICY "Active study groups are viewable by authenticated users" 
  ON public.study_groups FOR SELECT 
  TO authenticated 
  USING (is_active = true);

CREATE POLICY "Admins can manage study groups" 
  ON public.study_groups FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Study group members policies
CREATE POLICY "Users can view study group memberships" 
  ON public.study_group_members FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can join study groups" 
  ON public.study_group_members FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave study groups" 
  ON public.study_group_members FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Learning activity policies
CREATE POLICY "Users can view their own learning activity" 
  ON public.learning_activity FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert learning activity" 
  ON public.learning_activity FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update learning activity" 
  ON public.learning_activity FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all learning activity" 
  ON public.learning_activity FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update thread last_post_at when new post is created
CREATE OR REPLACE FUNCTION update_thread_last_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.discussion_threads
  SET last_post_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_last_post
  AFTER INSERT ON public.discussion_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_post();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forums_updated_at
  BEFORE UPDATE ON public.forums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_threads_updated_at
  BEFORE UPDATE ON public.discussion_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_posts_updated_at
  BEFORE UPDATE ON public.discussion_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_activity_updated_at
  BEFORE UPDATE ON public.learning_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Insert sample forums
INSERT INTO public.forums (name, description, is_pinned) VALUES
  ('General Discussion', 'General topics and announcements', true),
  ('HVAC Training', 'Discuss HVAC courses and techniques', false),
  ('Medical Assistant', 'Medical Assistant program discussions', false),
  ('CDL Training', 'Commercial Driver License training', false),
  ('Career Support', 'Job search, resume help, and career advice', false)
ON CONFLICT DO NOTHING;

-- Insert sample study groups
INSERT INTO public.study_groups (name, description, modality, schedule, is_active) VALUES
  ('HVAC Evening Cohort', 'Evening study group for HVAC students', 'online', 'Mon/Wed 6-8pm EST', true),
  ('Medical Assistant Weekend', 'Weekend study sessions for MA students', 'hybrid', 'Saturdays 10am-12pm', true),
  ('CDL Practice Group', 'Practice driving and theory together', 'in_person', 'Tuesdays 2-4pm', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Activation migration complete!';
  RAISE NOTICE '📊 Tables created: forums, discussion_threads, discussion_posts, study_groups, study_group_members, learning_activity';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Triggers set up for automatic updates';
  RAISE NOTICE '🌱 Sample data inserted (optional)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your LMS features are now ready to activate!';
END $$;
