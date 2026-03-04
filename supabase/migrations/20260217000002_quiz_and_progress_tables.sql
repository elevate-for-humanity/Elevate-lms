-- Migration: Quiz system tables + course_progress
-- These tables are referenced by 55+ code paths but were never applied to production.

-- ============================================================
-- 1. QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID,
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. QUIZ QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'matching', 'fill_blank')),
  question_text TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. QUIZ ANSWERS (answer options for questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

-- ============================================================
-- 4. QUIZ ATTEMPTS (student submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER,
  max_score INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  answers JSONB DEFAULT '[]'
);

-- ============================================================
-- 5. QUIZ ATTEMPT ANSWERS (per-question results)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID,
  is_correct BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. COURSE PROGRESS (enrollment-level progress tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons JSONB DEFAULT '[]',
  current_lesson TEXT,
  last_accessed TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Quizzes: anyone can read published quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "quizzes_admin_all" ON public.quizzes;
CREATE POLICY "quizzes_admin_all" ON public.quizzes FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- Quiz questions: anyone can read
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "quiz_questions_admin_all" ON public.quiz_questions;
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- Quiz answers: anyone can read
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_answers_select" ON public.quiz_answers;
CREATE POLICY "quiz_answers_select" ON public.quiz_answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "quiz_answers_admin_all" ON public.quiz_answers;
CREATE POLICY "quiz_answers_admin_all" ON public.quiz_answers FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- Quiz attempts: users see own, admins see all
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_attempts_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts FOR ALL
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "quiz_attempts_admin" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_admin" ON public.quiz_attempts FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- Quiz attempt answers: users see own via attempt
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_attempt_answers_own" ON public.quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_own" ON public.quiz_attempt_answers FOR ALL
  USING (attempt_id IN (SELECT id FROM public.quiz_attempts WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "quiz_attempt_answers_admin" ON public.quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_admin" ON public.quiz_attempt_answers FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- Course progress: users see own, admins see all
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "course_progress_own" ON public.course_progress;
CREATE POLICY "course_progress_own" ON public.course_progress FOR ALL
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "course_progress_admin" ON public.course_progress;
CREATE POLICY "course_progress_admin" ON public.course_progress FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')));

-- ============================================================
-- 8. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON public.quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON public.quiz_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON public.course_progress(user_id, course_id);
