-- Comprehensive Lesson Content System
-- Adds full lesson content structure with videos, materials, and quizzes

-- Enhance lessons table with content fields
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS video_duration INTEGER;
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 30;

-- Create lesson progress tracking
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  enrollment_id UUID,
  status TEXT DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_position INTEGER DEFAULT 0,
  notes TEXT,
  bookmarks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);

-- Create course materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_downloadable BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_lesson ON public.course_materials(lesson_id);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'assessment',
  passing_score INTEGER DEFAULT 70,
  time_limit INTEGER,
  max_attempts INTEGER,
  randomize_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON public.quizzes(lesson_id);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]',
  correct_answer TEXT,
  correct_answers TEXT[],
  explanation TEXT,
  points INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  enrollment_id UUID,
  attempt_number INTEGER DEFAULT 1,
  score INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  answers JSONB DEFAULT '{}',
  time_spent INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment ON public.quiz_attempts(enrollment_id);

-- Create video watch progress table
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  current_time INTEGER DEFAULT 0,
  duration INTEGER,
  completed BOOLEAN DEFAULT false,
  watch_count INTEGER DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id, video_url)
);

CREATE INDEX IF NOT EXISTS idx_video_progress_user ON public.video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_lesson ON public.video_progress(lesson_id);

-- RLS Policies
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users view own lesson progress" ON public.lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own lesson progress" ON public.lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own lesson progress" ON public.lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view course materials
CREATE POLICY "Anyone view course materials" ON public.course_materials
  FOR SELECT USING (true);

-- Anyone can view quizzes
CREATE POLICY "Anyone view quizzes" ON public.quizzes
  FOR SELECT USING (true);

CREATE POLICY "Anyone view quiz questions" ON public.quiz_questions
  FOR SELECT USING (true);

-- Users can view their own quiz attempts
CREATE POLICY "Users view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can manage their own video progress
CREATE POLICY "Users manage own video progress" ON public.video_progress
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER trigger_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_updated_at();

DROP TRIGGER IF EXISTS trigger_course_materials_updated_at ON public.course_materials;
CREATE TRIGGER trigger_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_updated_at();

DROP TRIGGER IF EXISTS trigger_video_progress_updated_at ON public.video_progress;
CREATE TRIGGER trigger_video_progress_updated_at
  BEFORE UPDATE ON public.video_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_updated_at();
