-- ============================================================================
-- CRITICAL LMS FEATURES - PART 3: PERSONALIZATION & CAREER SERVICES
-- ============================================================================

-- ============================================================================
-- 13. LEARNING PATHS & RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  path_type TEXT CHECK (path_type IN ('beginner', 'career_track', 'skill_based', 'custom')),
  programs JSONB NOT NULL,
  estimated_weeks INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS course_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('based_on_progress', 'similar_students', 'trending', 'personalized')),
  score DECIMAL(5,2),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_type ON learning_paths(path_type);
CREATE INDEX idx_user_learning_paths_user ON user_learning_paths(user_id);
CREATE INDEX idx_course_recommendations_user ON course_recommendations(user_id);

-- ============================================================================
-- 14. SKILL ASSESSMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT CHECK (assessment_type IN ('pre_test', 'placement', 'skill_check', 'final')),
  questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES skill_assessments(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  skill_levels JSONB,
  recommendations JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_assessments_program ON skill_assessments(program_id);
CREATE INDEX idx_skill_assessment_results_user ON skill_assessment_results(user_id);

-- ============================================================================
-- 15. ADAPTIVE CONTENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  difficulty_level TEXT CHECK (difficulty_level IN ('simplified', 'standard', 'advanced')),
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  pace TEXT CHECK (pace IN ('slow', 'normal', 'fast')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_learning_style TEXT,
  preferred_pace TEXT,
  preferred_time_of_day TEXT,
  session_duration_minutes INTEGER DEFAULT 30,
  accessibility_needs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_content_adaptations_user ON content_adaptations(user_id);
CREATE INDEX idx_user_learning_preferences_user ON user_learning_preferences(user_id);

-- ============================================================================
-- 16. RESUME BUILDER
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'My Resume',
  personal_info JSONB NOT NULL,
  summary TEXT,
  work_experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  template_name TEXT DEFAULT 'professional',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_resumes_user ON user_resumes(user_id);

-- ============================================================================
-- 17. PORTFOLIO BUILDER
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  theme TEXT DEFAULT 'modern',
  is_public BOOLEAN DEFAULT true,
  custom_domain TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  skills_used JSONB DEFAULT '[]'::jsonb,
  completion_date DATE,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_portfolios_user ON user_portfolios(user_id);
CREATE INDEX idx_portfolio_projects_portfolio ON portfolio_projects(portfolio_id);

-- ============================================================================
-- 18. LEARNING GOALS & REMINDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')),
  target_minutes INTEGER,
  target_lessons INTEGER,
  target_quizzes INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  goal_met BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

CREATE TABLE IF NOT EXISTS learning_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('email', 'sms', 'push')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'custom')),
  time_of_day TIME,
  days_of_week INTEGER[],
  message_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_goals_user ON learning_goals(user_id);
CREATE INDEX idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX idx_learning_reminders_user ON learning_reminders(user_id);

-- ============================================================================
-- 19. MILESTONE CELEBRATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT CHECK (milestone_type IN ('first_lesson', 'first_quiz', 'streak', 'completion', 'mastery')),
  criteria JSONB NOT NULL,
  celebration_message TEXT,
  animation_type TEXT,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  was_celebrated BOOLEAN DEFAULT false,
  UNIQUE(user_id, milestone_id)
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);

-- ============================================================================
-- 20. COMPLETION ESTIMATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS completion_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  estimated_completion_date DATE,
  estimated_hours_remaining DECIMAL(5,2),
  average_weekly_hours DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

CREATE INDEX idx_completion_estimates_user ON completion_estimates(user_id);
CREATE INDEX idx_completion_estimates_enrollment ON completion_estimates(enrollment_id);
