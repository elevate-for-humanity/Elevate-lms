-- ============================================================================
-- COURSE PLAYER ENHANCEMENTS
-- Add missing fields for full course player functionality
-- ============================================================================

-- Add video duration and description to lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;

-- Add quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- Array of options for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON quiz_questions(lesson_id);

-- Add quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  answers JSONB, -- Store user's answers
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson ON quiz_attempts(lesson_id);

-- Add discussions table
CREATE TABLE IF NOT EXISTS lesson_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON lesson_discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussions_program ON lesson_discussions(program_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user ON lesson_discussions(user_id);

-- Add discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES lesson_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_replies_user ON discussion_replies(user_id);

-- Add notes table (students can take notes)
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER, -- For video timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_lesson ON lesson_notes(user_id, lesson_id);

-- Add bookmarks table
CREATE TABLE IF NOT EXISTS lesson_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON lesson_bookmarks(user_id);

-- Update lesson_progress to track video progress
ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS times_watched INTEGER DEFAULT 0;

-- Add view to get course progress summary
CREATE OR REPLACE VIEW course_progress_summary AS
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.program_id,
  p.title as program_title,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) as completed_lessons,
  ROUND(
    (COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END)::DECIMAL / 
     NULLIF(COUNT(DISTINCT l.id), 0) * 100), 2
  ) as completion_percentage,
  MAX(lp.last_viewed_at) as last_activity
FROM enrollments e
JOIN programs p ON p.id = e.program_id
LEFT JOIN lessons l ON l.program_id = e.program_id
LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
WHERE e.status = 'active'
GROUP BY e.id, e.user_id, e.program_id, p.title;

COMMENT ON TABLE quiz_questions IS 'Questions for lesson quizzes';
COMMENT ON TABLE quiz_attempts IS 'Student quiz attempt history';
COMMENT ON TABLE lesson_discussions IS 'Discussion threads for lessons';
COMMENT ON TABLE discussion_replies IS 'Replies to discussion threads';
COMMENT ON TABLE lesson_notes IS 'Student notes for lessons';
COMMENT ON TABLE lesson_bookmarks IS 'Bookmarked lessons';
