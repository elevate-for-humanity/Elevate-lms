-- Tax Preparer Training System for Supersonic Fast Cash
-- Complete course management, enrollment, and progress tracking

CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  lessons_count INTEGER NOT NULL,
  price INTEGER NOT NULL,
  stripe_price_id TEXT,
  prerequisite_course_id TEXT REFERENCES training_courses(course_id),
  certification_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES training_courses(course_id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  duration_minutes INTEGER,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, lesson_number)
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES training_courses(course_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  current_lesson_number INTEGER DEFAULT 1,
  payment_status TEXT DEFAULT 'pending',
  payment_amount INTEGER,
  stripe_payment_id TEXT,
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_training_courses_course_id ON training_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_course_id ON training_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_user_id ON training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course_id ON training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_enrollment_id ON training_progress(enrollment_id);

ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses"
  ON training_courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage courses"
  ON training_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Enrolled users can view lessons"
  ON training_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_enrollments
      WHERE training_enrollments.user_id = auth.uid()
      AND training_enrollments.course_id = training_lessons.course_id
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON training_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own enrollments"
  ON training_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON training_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON training_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments"
  ON training_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own progress"
  ON training_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_enrollments
      WHERE training_enrollments.id = training_progress.enrollment_id
      AND training_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own progress"
  ON training_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM training_enrollments
      WHERE training_enrollments.id = training_progress.enrollment_id
      AND training_enrollments.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON training_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_lessons_updated_at
  BEFORE UPDATE ON training_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_progress_updated_at
  BEFORE UPDATE ON training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO training_courses (course_id, title, description, duration, lessons_count, price, stripe_price_id, certification_name) VALUES
  ('tax-basics', 'Tax Preparation Fundamentals', 'Complete beginner course covering everything you need to start preparing tax returns. No prior experience required! Learn the Elevate method for accurate, efficient tax preparation.', '12 hours', 24, 199, 'price_tax_prep_fundamentals', 'Elevate for Humanity Tax Preparation Certificate'),
  ('irs-regulations', 'IRS Ethics & Professional Standards', 'Learn IRS regulations, preparer responsibilities, and ethical standards. Elevate-certified training ensures you meet all compliance requirements.', '6 hours', 12, 149, 'price_irs_ethics', 'Elevate for Humanity Ethics Certificate'),
  ('advanced-returns', 'Advanced Tax Strategies', 'Master complex tax situations including rental property, investments, and multi-state returns using Elevate-proven techniques.', '16 hours', 20, 199, 'price_advanced_returns', 'Elevate for Humanity Advanced Tax Certificate'),
  ('business-returns', 'Business Tax Mastery', 'Learn to prepare business returns for sole proprietors, partnerships, S-corps, and C-corps with Elevate best practices.', '20 hours', 25, 299, 'price_business_returns', 'Elevate for Humanity Business Tax Certificate'),
  ('software-mastery', 'Professional Tax Software Excellence', 'Master professional tax preparation software with Elevate-exclusive training methods and real-world scenarios.', '18 hours', 22, 249, 'price_software_mastery', 'Elevate for Humanity Tax Software Certificate')
ON CONFLICT (course_id) DO NOTHING;

UPDATE training_courses SET prerequisite_course_id = 'tax-basics' WHERE course_id = 'advanced-returns';
UPDATE training_courses SET prerequisite_course_id = 'advanced-returns' WHERE course_id = 'business-returns';
