-- Migration: Create tables required by mounted components
-- Generated from forensic report cross-reference
-- 26 tables that components query but don't exist in the live database

-- ============================================================
-- HIGH PRIORITY: Public page components
-- ============================================================

-- newsletter_subscribers (Homepage - NewsletterSignup)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text DEFAULT 'pending_confirmation',
  source text DEFAULT 'website_signup',
  subscribed_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No anon INSERT policy: all writes go through /api/newsletter using service role
CREATE POLICY "Service role full access" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');

-- site_settings (Homepage, Employers, TrustStrip - key/value config)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role write" ON site_settings FOR ALL USING (auth.role() = 'service_role');

-- community_posts (About page - SocialLearningCommunity)
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  tags text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON community_posts FOR UPDATE USING (auth.uid() = user_id);

-- study_groups (About page - SocialLearningCommunity, StudyGroups)
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  topic text,
  description text,
  next_session timestamptz,
  max_members integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- study_group_members (referenced by study_groups select with count)
CREATE TABLE IF NOT EXISTS study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(study_group_id, user_id)
);
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON study_group_members FOR SELECT USING (true);
CREATE POLICY "Auth join" ON study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- banner_analytics (Programs/CDL page - VideoHeroBanner)
CREATE TABLE IF NOT EXISTS banner_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  video_src text,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE banner_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON banner_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON banner_analytics FOR SELECT USING (auth.role() = 'service_role');

-- video_engagement (Programs/CDL page - VideoHeroBanner)
CREATE TABLE IF NOT EXISTS video_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_src text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE video_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON video_engagement FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON video_engagement FOR SELECT USING (auth.role() = 'service_role');

-- employer_profiles (Employers page - EmployerPartners, TrustStrip)
CREATE TABLE IF NOT EXISTS employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  industry text,
  hiring_rate numeric,
  logo_url text,
  website text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON employer_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full" ON employer_profiles FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- MEDIUM PRIORITY: Auth-gated pages (LMS, Admin)
-- ============================================================

-- admin_activity_log (Admin - AdminHeader, AdminReportingDashboard)
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON admin_activity_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin insert" ON admin_activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- admin_notifications (Admin - AdminHeader)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON admin_notifications FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Service role insert" ON admin_notifications FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Own update" ON admin_notifications FOR UPDATE USING (auth.uid() = admin_id);

-- certificate_downloads (LMS - CertificateDownload)
CREATE TABLE IF NOT EXISTS certificate_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES certificates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  format text DEFAULT 'svg',
  downloaded_at timestamptz DEFAULT now()
);
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own downloads" ON certificate_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert" ON certificate_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- content_views (LMS - ContentLibrary)
CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  user_id uuid,
  content_type text,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert" ON content_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role read" ON content_views FOR SELECT USING (auth.role() = 'service_role');

-- grades (LMS - LearningAnalyticsDashboard)
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid,
  assignment_id uuid,
  points numeric DEFAULT 0,
  max_points numeric DEFAULT 100,
  grade_type text,
  graded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own grades" ON grades FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service role full" ON grades FOR ALL USING (auth.role() = 'service_role');

-- google_classroom_sync (LMS - GoogleClassroomSync)
CREATE TABLE IF NOT EXISTS google_classroom_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  last_sync_at timestamptz,
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'disconnected',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE google_classroom_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sync" ON google_classroom_sync FOR ALL USING (auth.uid() = user_id);

-- live_session_attendance (LMS - LiveStreamingClassroom)
CREATE TABLE IF NOT EXISTS live_session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE(session_id, user_id)
);
ALTER TABLE live_session_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read" ON live_session_attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert" ON live_session_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON live_session_attendance FOR UPDATE USING (auth.uid() = user_id);

-- program_modules (Admin - ModuleListForProgram)
CREATE TABLE IF NOT EXISTS program_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  duration_hours numeric,
  is_published boolean DEFAULT false,
  content jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE program_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON program_modules FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON program_modules FOR ALL USING (auth.role() = 'service_role');

-- page_versions (Admin - PageManager)
CREATE TABLE IF NOT EXISTS page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  version integer NOT NULL,
  content jsonb,
  published boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON page_versions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role write" ON page_versions FOR ALL USING (auth.role() = 'service_role');

-- generated_pages (Admin/Builder - AIPageBuilder, PageManager)
CREATE TABLE IF NOT EXISTS generated_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  content jsonb,
  status text DEFAULT 'draft',
  template text,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE generated_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON generated_pages FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON generated_pages FOR ALL USING (auth.role() = 'service_role');

-- user_learning_paths (LMS - AdaptiveLearningPath)
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'active',
  progress numeric DEFAULT 0,
  UNIQUE(user_id, learning_path_id)
);
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own paths" ON user_learning_paths FOR ALL USING (auth.uid() = user_id);

-- user_skills (LMS - AdaptiveLearningPath, StudentPortfolio)
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency_level text DEFAULT 'beginner',
  category text,
  is_active boolean DEFAULT true,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read" ON user_skills FOR SELECT USING (true);

-- user_activity (Admin - AdminReportingDashboard, LiveChatWidget)
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  page text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON user_activity FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone insert" ON user_activity FOR INSERT WITH CHECK (true);

-- sms_messages (Admin - SMSNotificationSystem)
CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_text text NOT NULL,
  template_id uuid,
  status text DEFAULT 'pending',
  sent_by uuid,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access" ON sms_messages FOR ALL USING (auth.uid() IS NOT NULL);

-- sms_templates (Admin - SMSNotificationSystem)
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_text text NOT NULL,
  template_type text DEFAULT 'notification',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON sms_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role write" ON sms_templates FOR ALL USING (auth.role() = 'service_role');

-- live_chat_sessions (Support - LiveChatSupport)
CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  agent_id uuid,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
ALTER TABLE live_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions" ON live_chat_sessions FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Anon insert" ON live_chat_sessions FOR INSERT WITH CHECK (true);

-- live_chat_messages (Support - LiveChatSupport)
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
  sender text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session access" ON live_chat_messages FOR ALL USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');
CREATE POLICY "Anon insert" ON live_chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- LOWER PRIORITY: Analytics/tracking tables (write-only, non-blocking)
-- ============================================================

-- turnstile_verifications (Contact/Signup - Turnstile)
CREATE TABLE IF NOT EXISTS turnstile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  form_id text,
  event_type text,
  token_prefix text,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE turnstile_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert" ON turnstile_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON turnstile_verifications FOR SELECT USING (auth.role() = 'service_role');

-- financial_aid_calculations (Financial Aid page - FinancialAidCalculator)
CREATE TABLE IF NOT EXISTS financial_aid_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  income_range text,
  dependents integer,
  tuition_amount numeric,
  estimated_grant numeric,
  estimated_loan numeric,
  out_of_pocket numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE financial_aid_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert" ON financial_aid_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON financial_aid_calculations FOR SELECT USING (auth.role() = 'service_role');

-- notification_events (NotificationPrompt - unused but referenced)
CREATE TABLE IF NOT EXISTS notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own events" ON notification_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role insert" ON notification_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
