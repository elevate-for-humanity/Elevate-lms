-- NHA Exam Prep: Flashcards, Practice Assessments & Readiness Reports

-- Flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  times_shown INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  source TEXT DEFAULT 'ai_generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User flashcard progress (spaced repetition)
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- Practice attempts for exams
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  score DECIMAL(5,2),
  total_questions INT,
  correct_answers INT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  domain_scores JSONB,
  time_spent_seconds INT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Readiness reports
CREATE TABLE IF NOT EXISTS public.readiness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  pass_probability DECIMAL(5,2),
  confidence_level TEXT,
  domain_breakdown JSONB,
  strengths JSONB,
  weaknesses JSONB,
  recommendations JSONB,
  study_plan JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Focused review sessions
CREATE TABLE IF NOT EXISTS public.focused_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  weak_domains JSONB NOT NULL,
  lessons_to_review JSONB,
  practice_questions JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course module settings (for NHA-style courses)
CREATE TABLE IF NOT EXISTS public.course_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_index INT NOT NULL,
  title TEXT,
  description TEXT,
  learning_objectives JSONB,
  required_lessons INT DEFAULT 0,
  checkpoint_passing_score DECIMAL(5,2) DEFAULT 70.00,
  enable_flashcards BOOLEAN DEFAULT false,
  enable_practice_activities BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, module_index)
);

-- Practice activity templates
CREATE TABLE IF NOT EXISTS public.practice_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_index INT,
  title TEXT NOT NULL,
  activity_type TEXT CHECK (activity_type IN ('case_study', 'simulation', 'drag_drop', 'matching', 'ordering', 'fill_blank')),
  content JSONB NOT NULL,
  correct_answer JSONB,
  points INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity progress
CREATE TABLE IF NOT EXISTS public.activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.practice_activities(id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  user_answer JSONB,
  is_correct BOOLEAN,
  time_spent_seconds INT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focused_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own flashcard progress" ON public.flashcard_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress" ON public.flashcard_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own practice attempts" ON public.practice_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create practice attempts" ON public.practice_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own readiness reports" ON public.readiness_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage flashcards" ON public.flashcards
  FOR ALL USING (auth.role() IN ('authenticated'));

CREATE POLICY "Admins can manage practice activities" ON public.practice_activities
  FOR ALL USING (auth.role() IN ('authenticated'));

CREATE POLICY "Users can view own activity progress" ON public.activity_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity progress" ON public.activity_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_flashcards_course ON public.flashcards(course_id);
CREATE INDEX idx_flashcards_difficulty ON public.flashcards(difficulty);
CREATE INDEX idx_flashcard_progress_user ON public.flashcard_progress(user_id);
CREATE INDEX idx_flashcard_progress_next_review ON public.flashcard_progress(next_review) WHERE next_review IS NOT NULL;
CREATE INDEX idx_practice_attempts_user_course ON public.practice_attempts(user_id, course_id);
CREATE INDEX idx_readiness_reports_user_course ON public.readiness_reports(user_id, course_id);
CREATE INDEX idx_focused_reviews_user ON public.focused_reviews(user_id);
CREATE INDEX idx_course_module_settings_course ON public.course_module_settings(course_id);
CREATE INDEX idx_activity_progress_user ON public.activity_progress(user_id);