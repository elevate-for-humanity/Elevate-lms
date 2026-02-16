-- =====================================================
-- COMPLETE PRODUCTION SETUP MIGRATION
-- Run this ONCE to set up all missing tables and data
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DISCUSSION FORUMS TABLES
-- =====================================================

-- Forum categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'blue',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts (replies)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_solution BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum votes
CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thread_id),
  UNIQUE(user_id, post_id)
);

-- =====================================================
-- LIVE CHAT TABLES
-- =====================================================

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  assigned_to UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments JSONB DEFAULT '[]',
  is_ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat context (for OpenAI integration)
CREATE TABLE IF NOT EXISTS ai_chat_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  context_data JSONB NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MOBILE APP TABLES
-- =====================================================

-- Push notification tokens
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline sync queue
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- =====================================================
-- PAYMENT TABLES (Enhanced)
-- =====================================================

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('card', 'bank_account', 'paypal', 'affirm')),
  provider TEXT CHECK (provider IN ('stripe', 'paypal', 'affirm')),
  provider_payment_method_id TEXT,
  last_four TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment plans
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  installment_amount DECIMAL(10,2) NOT NULL,
  installment_count INTEGER NOT NULL,
  installments_paid INTEGER DEFAULT 0,
  next_payment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment installments
CREATE TABLE IF NOT EXISTS payment_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'failed')),
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course analytics
CREATE TABLE IF NOT EXISTS course_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  enrollments INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  avg_completion_time INTERVAL,
  avg_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_activity ON forum_threads(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_thread ON forum_votes(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_post ON forum_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Mobile indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON offline_sync_queue(sync_status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_enrollment ON payment_plans(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due ON payment_installments(due_date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_analytics_course ON course_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_course_analytics_date ON course_analytics(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analytics ENABLE ROW LEVEL SECURITY;

-- Forum policies
CREATE POLICY "Anyone can view forum categories" ON forum_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view forum threads" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their threads" ON forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can manage their votes" ON forum_votes FOR ALL USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users can view their conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY "Users can create conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR assigned_to = auth.uid()))
);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Mobile policies
CREATE POLICY "Users can manage their push tokens" ON push_notification_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their sync queue" ON offline_sync_queue FOR ALL USING (auth.uid() = user_id);

-- Payment policies
CREATE POLICY "Users can view their payment methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their payment methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their payment plans" ON payment_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE id = enrollment_id AND user_id = auth.uid())
);

-- Analytics policies (admin only)
CREATE POLICY "Admins can view activity logs" ON user_activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view course analytics" ON course_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Increment thread view count
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_threads
  SET view_count = view_count + 1
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update thread last activity
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads
  SET last_activity = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_activity_trigger
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_thread_activity();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - FORUM CATEGORIES
-- =====================================================

INSERT INTO forum_categories (name, description, icon, color, display_order) VALUES
('Healthcare Discussions', 'Connect with fellow healthcare students and professionals', 'heart-pulse', 'red', 1),
('Skilled Trades Community', 'Share experiences in construction, electrical, plumbing, and more', 'wrench', 'orange', 2),
('Business & Professional', 'Network with business, accounting, and management students', 'briefcase', 'blue', 3),
('Beauty & Cosmetology', 'Discuss techniques, trends, and career opportunities', 'sparkles', 'pink', 4),
('Social Services Support', 'Connect with social work and community service professionals', 'users', 'green', 5),
('Technology & IT', 'Share knowledge about programming, networking, and cybersecurity', 'laptop', 'purple', 6),
('Transportation & Logistics', 'Discuss CDL, logistics, and transportation careers', 'truck', 'yellow', 7),
('Hospitality & Food Service', 'Connect with culinary and hospitality professionals', 'utensils', 'amber', 8),
('General Discussion', 'Off-topic conversations and community building', 'message-circle', 'gray', 9),
('Career Advice', 'Get guidance on job search, interviews, and career development', 'compass', 'indigo', 10),
('Study Groups', 'Form study groups and collaborate on coursework', 'book-open', 'teal', 11),
('Success Stories', 'Share your achievements and inspire others', 'trophy', 'gold', 12)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created tables:';
  RAISE NOTICE '   - Forum system (categories, threads, posts, votes)';
  RAISE NOTICE '   - Live chat system (conversations, messages, AI context)';
  RAISE NOTICE '   - Mobile app (push tokens, sync queue)';
  RAISE NOTICE '   - Enhanced payments (methods, plans, installments)';
  RAISE NOTICE '   - Analytics (activity logs, course analytics)';
  RAISE NOTICE '🔒 Security: RLS enabled on all tables';
  RAISE NOTICE '⚡ Performance: Indexes created';
  RAISE NOTICE '🎯 Ready for production!';
END $$;
