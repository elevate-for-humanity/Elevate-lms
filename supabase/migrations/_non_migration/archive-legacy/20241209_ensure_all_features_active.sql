-- ============================================
-- ENSURE ALL FEATURES ARE ACTIVE
-- Migration to verify and create any missing tables/features
-- ============================================

-- Create missing tables if they don't exist

-- 1. Ensure lesson_progress exists
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 2. Ensure module_progress exists
CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 3. Ensure course_progress exists
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 4. Ensure partner_courses exists
CREATE TABLE IF NOT EXISTS partner_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  partner_name TEXT NOT NULL,
  external_course_id TEXT,
  external_url TEXT,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  price DECIMAL(10,2),
  duration_hours INTEGER,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ensure partner_enrollments exists
CREATE TABLE IF NOT EXISTS partner_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_course_id UUID NOT NULL REFERENCES partner_courses(id) ON DELETE CASCADE,
  external_enrollment_id TEXT,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'expired')),
  progress_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_course_id)
);

-- 6. Ensure partner_credentials exists
CREATE TABLE IF NOT EXISTS partner_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL UNIQUE,
  api_key TEXT,
  api_secret TEXT,
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure external_course_links exists
CREATE TABLE IF NOT EXISTS external_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  external_url TEXT NOT NULL,
  link_type TEXT DEFAULT 'enrollment',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ensure achievements exists
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ensure badges exists
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  badge_type TEXT NOT NULL,
  icon_url TEXT,
  criteria JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Ensure user_badges exists
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 11. Ensure learning_streaks exists
CREATE TABLE IF NOT EXISTS learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  total_days_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Ensure user_activity exists
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Ensure hybrid_schedules exists
CREATE TABLE IF NOT EXISTS hybrid_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('online', 'in_person', 'hybrid')),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  instructor_id UUID REFERENCES profiles(id),
  max_capacity INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Ensure attendance_records exists
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES hybrid_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, schedule_id)
);

-- 15. Ensure payroll_cards exists
CREATE TABLE IF NOT EXISTS payroll_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number_encrypted TEXT,
  card_provider TEXT,
  card_status TEXT DEFAULT 'active' CHECK (card_status IN ('active', 'inactive', 'blocked', 'expired')),
  balance DECIMAL(10,2) DEFAULT 0,
  last_deposit_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Ensure job_postings exists
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship')),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  requirements TEXT[],
  benefits TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'filled')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Ensure job_applications exists
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'interview', 'offered', 'accepted', 'rejected')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_posting_id, user_id)
);

-- 18. Ensure employer_profiles exists
CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  company_description TEXT,
  industry TEXT,
  company_size TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Ensure email_campaigns exists
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Ensure social_media_posts exists
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  engagement_metrics JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_user ON partner_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_course ON partner_enrollments(partner_course_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_hybrid_schedules_course ON hybrid_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_hybrid_schedules_date ON hybrid_schedules(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);

-- Enable RLS on all tables
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_course_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lesson_progress
DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;
CREATE POLICY "Users can update own lesson progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lesson progress" ON lesson_progress;
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for module_progress
DROP POLICY IF EXISTS "Users can view own module progress" ON module_progress;
CREATE POLICY "Users can view own module progress" ON module_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own module progress" ON module_progress;
CREATE POLICY "Users can update own module progress" ON module_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own module progress" ON module_progress;
CREATE POLICY "Users can insert own module progress" ON module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for course_progress
DROP POLICY IF EXISTS "Users can view own course progress" ON course_progress;
CREATE POLICY "Users can view own course progress" ON course_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own course progress" ON course_progress;
CREATE POLICY "Users can update own course progress" ON course_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own course progress" ON course_progress;
CREATE POLICY "Users can insert own course progress" ON course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for partner_courses (public read)
DROP POLICY IF EXISTS "Anyone can view active partner courses" ON partner_courses;
CREATE POLICY "Anyone can view active partner courses" ON partner_courses FOR SELECT USING (is_active = true);

-- Create RLS policies for partner_enrollments
DROP POLICY IF EXISTS "Users can view own partner enrollments" ON partner_enrollments;
CREATE POLICY "Users can view own partner enrollments" ON partner_enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own partner enrollments" ON partner_enrollments;
CREATE POLICY "Users can insert own partner enrollments" ON partner_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for badges (public read)
DROP POLICY IF EXISTS "Anyone can view active badges" ON badges;
CREATE POLICY "Anyone can view active badges" ON badges FOR SELECT USING (is_active = true);

-- Create RLS policies for user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for job_postings (public read for active)
DROP POLICY IF EXISTS "Anyone can view active job postings" ON job_postings;
CREATE POLICY "Anyone can view active job postings" ON job_postings FOR SELECT USING (status = 'active');

-- Create RLS policies for job_applications
DROP POLICY IF EXISTS "Users can view own job applications" ON job_applications;
CREATE POLICY "Users can view own job applications" ON job_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job applications" ON job_applications;
CREATE POLICY "Users can insert own job applications" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All features migration completed successfully';
END $$;
