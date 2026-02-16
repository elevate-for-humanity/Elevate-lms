-- ============================================================================
-- CRITICAL LMS FEATURES - PART 2: GAMIFICATION & SOCIAL LEARNING
-- ============================================================================

-- ============================================================================
-- 6. GAMIFICATION: POINTS SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Beginner',
  points_to_next_level INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);

-- ============================================================================
-- 7. GAMIFICATION: BADGES & ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  badge_type TEXT CHECK (badge_type IN ('completion', 'streak', 'mastery', 'social', 'special')),
  criteria JSONB NOT NULL,
  points_reward INTEGER DEFAULT 0,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress_data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ============================================================================
-- 8. GAMIFICATION: LEADERBOARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('global', 'program', 'weekly', 'monthly')),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  rank INTEGER,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_type ON leaderboard_entries(leaderboard_type);
CREATE INDEX idx_leaderboard_program ON leaderboard_entries(program_id);
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);

-- ============================================================================
-- 9. GAMIFICATION: LEARNING STREAKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  total_active_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_learning_streaks_user ON learning_streaks(user_id);
CREATE INDEX idx_daily_activities_user ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date);

-- ============================================================================
-- 10. PEER REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  rubric JSONB NOT NULL,
  min_reviews_required INTEGER DEFAULT 2,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES peer_review_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  submission_text TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviews_received INTEGER DEFAULT 0,
  average_score DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES peer_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  scores JSONB NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  feedback TEXT,
  is_helpful BOOLEAN,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_peer_submissions_assignment ON peer_submissions(assignment_id);
CREATE INDEX idx_peer_reviews_submission ON peer_reviews(submission_id);

-- ============================================================================
-- 11. STUDY GROUPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  meeting_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_groups_program ON study_groups(program_id);
CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_messages_group ON study_group_messages(group_id);

-- ============================================================================
-- 12. INSTRUCTOR Q&A
-- ============================================================================
CREATE TABLE IF NOT EXISTS instructor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  is_public BOOLEAN DEFAULT true,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES instructor_questions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  answer TEXT NOT NULL,
  is_official BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instructor_questions_program ON instructor_questions(program_id);
CREATE INDEX idx_instructor_questions_status ON instructor_questions(status);
CREATE INDEX idx_instructor_answers_question ON instructor_answers(question_id);
