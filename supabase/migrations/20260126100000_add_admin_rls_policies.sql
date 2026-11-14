-- Admin RLS Policies for LMS Resources
-- Run this in Supabase SQL Editor

-- ============ COURSES ============
-- Enable RLS
-- SKIPPED: courses is a VIEW
-- ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
-- SKIPPED: courses is a VIEW
-- DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
-- SKIPPED: courses is a VIEW, cannot apply RLS policies
-- CREATE POLICY "courses_admin_all" ON public.courses
-- FOR ALL TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role IN ('admin', 'super_admin', 'instructor')
--   )
-- );

-- SKIPPED: courses is a VIEW, cannot apply RLS policies
-- DROP POLICY IF EXISTS "courses_student_read" ON public.courses;
-- CREATE POLICY "courses_student_read" ON public.courses
-- FOR SELECT TO authenticated
-- USING (is_published = true);

-- ============ LESSONS (training_lessons is the base table; lessons is a VIEW) ============
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
DROP POLICY IF EXISTS "lessons_admin_all" ON public.training_lessons;
CREATE POLICY "lessons_admin_all" ON public.training_lessons
FOR ALL TO authenticated
USING (is_instructor());

-- Students can read lessons from active courses
DROP POLICY IF EXISTS "lessons_student_read" ON public.training_lessons;
CREATE POLICY "lessons_student_read" ON public.training_lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_courses
    WHERE training_courses.id = training_lessons.course_id
    AND training_courses.is_active = true
  )
);

-- ============ QUIZZES ============
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
DROP POLICY IF EXISTS "quizzes_admin_all" ON public.quizzes;
CREATE POLICY "quizzes_admin_all" ON public.quizzes
FOR ALL TO authenticated
USING (is_instructor());

-- Students can read published quizzes
DROP POLICY IF EXISTS "quizzes_student_read" ON public.quizzes;
CREATE POLICY "quizzes_student_read" ON public.quizzes
FOR SELECT TO authenticated
USING (is_published = true);

-- ============ QUIZ QUESTIONS ============
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
DROP POLICY IF EXISTS "quiz_questions_admin_all" ON public.quiz_questions;
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions
FOR ALL TO authenticated
USING (is_instructor());

-- Students can read questions from published quizzes
DROP POLICY IF EXISTS "quiz_questions_student_read" ON public.quiz_questions;
CREATE POLICY "quiz_questions_student_read" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND quizzes.is_published = true
  )
);

-- ============ ENROLLMENTS ============
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.training_enrollments;
CREATE POLICY "enrollments_admin_all" ON public.training_enrollments
FOR ALL TO authenticated
USING (is_admin());

-- Students can read their own enrollments
DROP POLICY IF EXISTS "enrollments_student_own" ON public.training_enrollments;
CREATE POLICY "enrollments_student_own" ON public.training_enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============ PROFILES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (is_admin());

-- Users can read and update their own profile
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
CREATE POLICY "profiles_own_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ LESSON PROGRESS ============
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Admin can read all progress
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON public.lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress
FOR SELECT TO authenticated
USING (is_instructor());

-- Students can manage their own progress
DROP POLICY IF EXISTS "lesson_progress_own" ON public.lesson_progress;
CREATE POLICY "lesson_progress_own" ON public.lesson_progress
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
