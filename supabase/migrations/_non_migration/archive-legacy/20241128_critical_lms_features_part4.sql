-- ============================================================================
-- CRITICAL LMS FEATURES - PART 4: MOBILE, ANALYTICS & INSTRUCTOR TOOLS
-- ============================================================================

-- ============================================================================
-- MOBILE & OFFLINE FEATURES
-- ============================================================================
CREATE TABLE IF NOT EXISTS offline_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('video', 'pdf', 'transcript', 'quiz')),
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id, content_type)
);

CREATE TABLE IF NOT EXISTS mobile_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('reminder', 'achievement', 'message', 'announcement')),
  data JSONB DEFAULT '{}'::jsonb,
  sent BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offline_content_user ON offline_content(user_id);
CREATE INDEX idx_mobile_sync_queue_user ON mobile_sync_queue(user_id);
CREATE INDEX idx_mobile_sync_queue_synced ON mobile_sync_queue(synced);
CREATE INDEX idx_push_notifications_user ON push_notifications(user_id);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time_minutes INTEGER DEFAULT 0,
  lessons_viewed INTEGER DEFAULT 0,
  quizzes_attempted INTEGER DEFAULT 0,
  resources_downloaded INTEGER DEFAULT 0,
  forum_posts INTEGER DEFAULT 0,
  video_watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, enrollment_id, date)
);

CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  watch_duration_seconds INTEGER NOT NULL,
  completion_percentage DECIMAL(5,2),
  playback_speed DECIMAL(3,2) DEFAULT 1.0,
  paused_at_seconds INTEGER[],
  rewatched_segments JSONB DEFAULT '[]'::jsonb,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drop_off_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  total_students INTEGER DEFAULT 0,
  dropped_students INTEGER DEFAULT 0,
  drop_rate DECIMAL(5,2),
  common_reasons JSONB DEFAULT '[]'::jsonb,
  analysis_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_metrics_user ON engagement_metrics(user_id);
CREATE INDEX idx_engagement_metrics_date ON engagement_metrics(date);
CREATE INDEX idx_video_analytics_lesson ON video_analytics(lesson_id);
CREATE INDEX idx_drop_off_analysis_program ON drop_off_analysis(program_id);

-- ============================================================================
-- INSTRUCTOR DASHBOARD & TOOLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  specializations TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'instructor' CHECK (role IN ('lead', 'instructor', 'assistant')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, program_id)
);

CREATE TABLE IF NOT EXISTS instructor_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_filter JSONB,
  total_recipients INTEGER,
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  average_progress DECIMAL(5,2),
  questions_answered INTEGER DEFAULT 0,
  average_response_time_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, program_id, date)
);

CREATE INDEX idx_instructor_assignments_instructor ON instructor_assignments(instructor_id);
CREATE INDEX idx_instructor_assignments_program ON instructor_assignments(program_id);
CREATE INDEX idx_instructor_announcements_program ON instructor_announcements(program_id);
CREATE INDEX idx_bulk_messages_instructor ON bulk_messages(instructor_id);
CREATE INDEX idx_instructor_analytics_instructor ON instructor_analytics(instructor_id);

-- ============================================================================
-- ACCESSIBILITY FEATURES
-- ============================================================================
CREATE TABLE IF NOT EXISTS accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  high_contrast BOOLEAN DEFAULT false,
  large_text BOOLEAN DEFAULT false,
  screen_reader_enabled BOOLEAN DEFAULT false,
  keyboard_navigation BOOLEAN DEFAULT false,
  dyslexia_font BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  caption_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz', 'resource', 'announcement')),
  content_id UUID NOT NULL,
  language TEXT NOT NULL,
  translated_content JSONB NOT NULL,
  translator TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accessibility_settings_user ON accessibility_settings(user_id);
CREATE INDEX idx_content_translations_content ON content_translations(content_type, content_id);
CREATE INDEX idx_content_translations_language ON content_translations(language);

-- ============================================================================
-- COHORT ANALYSIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  max_students INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, user_id)
);

CREATE TABLE IF NOT EXISTS cohort_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  average_progress DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  average_quiz_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, date)
);

CREATE INDEX idx_cohorts_program ON cohorts(program_id);
CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_analytics_cohort ON cohort_analytics(cohort_id);

-- ============================================================================
-- CONTENT VERSIONING
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz', 'resource')),
  content_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_versions_content ON content_versions(content_type, content_id);
CREATE INDEX idx_content_versions_published ON content_versions(is_published);

-- ============================================================================
-- A/B TESTING
-- ============================================================================
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT CHECK (test_type IN ('content', 'ui', 'feature')),
  variants JSONB NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  variant TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_test_assignments_test ON ab_test_assignments(test_id);
CREATE INDEX idx_ab_test_results_test ON ab_test_results(test_id);
