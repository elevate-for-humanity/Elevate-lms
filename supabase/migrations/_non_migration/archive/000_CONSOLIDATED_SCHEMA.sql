-- =====================================================
-- CONSOLIDATED SCHEMA FOR ELEVATE FOR HUMANITY LMS
-- =====================================================
-- This migration consolidates all previous migrations
-- Run this ONCE in a fresh Supabase project
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Programs (Training Programs)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hero_image TEXT,
  tagline TEXT,
  summary TEXT,
  bullets TEXT[],
  funding TEXT[],
  cta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs (slug);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  cert_valid_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses (slug);
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON public.courses (program_id);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules (course_id);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons (module_id);

-- User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor', 'program_holder', 'delegate')),
  program_holder_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  program_holder_id UUID,
  delegate_id UUID,
  funding_program_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'pending')),
  progress DECIMAL(5,2) DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments (course_id);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON public.lesson_progress (student_id);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  serial TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_serial ON public.certificates (serial);

-- =====================================================
-- ASSESSMENT TABLES
-- =====================================================

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- WORKFORCE TABLES
-- =====================================================

-- Program Holders (Training Providers)
CREATE TABLE IF NOT EXISTS public.program_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payout_share DECIMAL(5,3) DEFAULT 0.333,
  mou_status TEXT DEFAULT 'not_sent' CHECK (mou_status IN ('not_sent', 'sent', 'signed', 'countersigned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Holder Applications
CREATE TABLE IF NOT EXISTS public.program_holder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  site_address TEXT,
  training_focus TEXT,
  funding_sources TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegates (Case Managers)
CREATE TABLE IF NOT EXISTS public.delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_view_learners BOOLEAN DEFAULT TRUE,
  can_edit_courses BOOLEAN DEFAULT FALSE,
  can_view_financials BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_holder_id, user_id)
);

-- Program Holder Notes (Case Notes)
CREATE TABLE IF NOT EXISTS public.program_holder_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  status TEXT,
  note TEXT,
  follow_up_date DATE,
  follow_up_done BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding Programs
CREATE TABLE IF NOT EXISTS public.funding_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  actor_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);

-- Attendance Log
CREATE TABLE IF NOT EXISTS public.attendance_log (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  login_time TIMESTAMPTZ NOT NULL,
  logout_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  activity_type TEXT DEFAULT 'learning'
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_log (student_id);

-- Contact Hours (Weekly Aggregation)
CREATE TABLE IF NOT EXISTS public.contact_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_hours DECIMAL(5,1) DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  UNIQUE(student_id, week_start)
);

-- =====================================================
-- GAMIFICATION TABLES (NEW)
-- =====================================================

-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DISCUSSION FORUMS (NEW)
-- =====================================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Threads
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON public.forum_threads (category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_course_id ON public.forum_threads (course_id);

-- Forum Posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id ON public.forum_posts (thread_id);

-- =====================================================
-- LIVE CLASSES (NEW)
-- =====================================================

-- Live Classes
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  provider TEXT CHECK (provider IN ('zoom', 'meet', 'teams')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_classes_course_id ON public.live_classes (course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled_at ON public.live_classes (scheduled_at);

-- Class Attendance
CREATE TABLE IF NOT EXISTS public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.live_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  UNIQUE(class_id, student_id)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Public read access for programs and courses
CREATE POLICY "Allow public read access" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.lessons FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Students can read their enrollments
CREATE POLICY "Students can read own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

-- Students can read/update their lesson progress
CREATE POLICY "Students can manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = student_id);

-- Students can read their certificates
CREATE POLICY "Students can read own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);

-- Public can verify certificates
CREATE POLICY "Public can verify certificates" ON public.certificates FOR SELECT USING (true);

-- Forum policies
CREATE POLICY "Anyone can read forum categories" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can read threads" ON public.forum_threads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create threads" ON public.forum_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update own threads" ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authenticated users can read posts" ON public.forum_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);

-- Gamification policies
CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can read own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read leaderboard" ON public.leaderboard FOR SELECT USING (true);

-- Live classes policies
CREATE POLICY "Enrolled students can read classes" ON public.live_classes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = auth.uid() AND course_id = live_classes.course_id
  )
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert funding programs
INSERT INTO public.funding_programs (code, name, description) VALUES
  ('WIOA', 'Workforce Innovation and Opportunity Act', 'Federal workforce development program'),
  ('WRG', 'Work Ready Grant', 'Indiana state workforce grant'),
  ('JRI', 'Justice Reinvestment Initiative', 'Reentry workforce program'),
  ('DOL', 'Department of Labor Apprenticeship', 'Federal apprenticeship program'),
  ('SNAP', 'SNAP Employment & Training', 'Food assistance employment program'),
  ('TANF', 'Temporary Assistance for Needy Families', 'Family assistance program')
ON CONFLICT (code) DO NOTHING;

-- Insert forum categories
INSERT INTO public.forum_categories (name, description, order_index) VALUES
  ('General Discussion', 'General topics and introductions', 0),
  ('Course Help', 'Get help with course content', 1),
  ('Career Advice', 'Career guidance and job search tips', 2),
  ('Success Stories', 'Share your achievements', 3)
ON CONFLICT DO NOTHING;

-- Insert sample badges
INSERT INTO public.badges (name, description, icon_url, points) VALUES
  ('First Steps', 'Complete your first lesson', '/badges/first-steps.svg', 10),
  ('Quick Learner', 'Complete a course in under 2 weeks', '/badges/quick-learner.svg', 50),
  ('Perfect Score', 'Get 100% on a quiz', '/badges/perfect-score.svg', 25),
  ('Helping Hand', 'Answer 10 forum questions', '/badges/helping-hand.svg', 30),
  ('Course Champion', 'Complete 5 courses', '/badges/champion.svg', 100)
ON CONFLICT DO NOTHING;

-- =====================================================
-- END OF CONSOLIDATED SCHEMA
-- =====================================================
