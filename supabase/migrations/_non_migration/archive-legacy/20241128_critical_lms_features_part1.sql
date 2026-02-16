-- ============================================================================
-- CRITICAL LMS FEATURES - PART 1
-- INTERACTIVE QUIZZES • RESOURCES • TRANSCRIPTS • PROGRESS • FORUMS
-- NO HANDS-ON LABS (PER CURRENT REQUIREMENTS)
-- ============================================================================

-- 1. INTERACTIVE QUIZZES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS interactive_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  show_correct_answers BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactive_quizzes_lesson
  ON interactive_quizzes(lesson_id);

-- Quiz questions for interactive quizzes
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES interactive_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (
    question_type IN ('multiple_choice', 'true_false', 'multiple_select')
  ),
  options TEXT[] NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz
  ON quiz_questions(quiz_id);

-- Attempts and instant feedback
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES interactive_quizzes(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  attempt_number INTEGER NOT NULL,
  feedback JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user
  ON quiz_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz
  ON quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment
  ON quiz_attempts(enrollment_id);

-- 2. DOWNLOADABLE RESOURCES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (
    resource_type IN ('pdf', 'template', 'checklist', 'worksheet', 'guide', 'tool', 'infographic')
  ),
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  download_count INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson
  ON lesson_resources(lesson_id);

CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES lesson_resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_user
  ON resource_downloads(user_id);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource
  ON resource_downloads(resource_id);

-- 3. VIDEO TRANSCRIPTS & CAPTIONS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  transcript_text TEXT NOT NULL,
  vtt_url TEXT,
  srt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_transcripts_lesson
  ON video_transcripts(lesson_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_transcripts_lesson_lang
  ON video_transcripts(lesson_id, language);

-- 4. USER PROGRESS (FOR "YOU'RE 65% COMPLETE" ETC.)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  completed_quizzes INTEGER DEFAULT 0,
  total_resources INTEGER DEFAULT 0,
  downloaded_resources INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  estimated_completion_date DATE,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_enrollment
  ON user_progress(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user
  ON user_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_program
  ON user_progress(program_id);

-- 5. DISCUSSION FORUMS & COMMUNITY
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, reply_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category
  ON forum_threads(category_id);

CREATE INDEX IF NOT EXISTS idx_forum_threads_program
  ON forum_threads(program_id);

CREATE INDEX IF NOT EXISTS idx_forum_threads_lesson
  ON forum_threads(lesson_id);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread
  ON forum_replies(thread_id);

CREATE INDEX IF NOT EXISTS idx_forum_votes_reply
  ON forum_votes(reply_id);
