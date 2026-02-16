-- LMS Complete Schema
-- Courses, Modules, Lessons, Videos, Quizzes, Progress Tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  duration VARCHAR(50),
  level VARCHAR(50) CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  category VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  total_students INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0
);

-- Modules Table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255),
  url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration VARCHAR(20),
  size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER, -- minutes
  passing_score INTEGER DEFAULT 70,
  attempts_allowed INTEGER,
  randomize_questions BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('multiple-choice', 'true-false', 'short-answer', 'essay')),
  question TEXT NOT NULL,
  options JSONB, -- array of options for multiple choice
  correct_answer TEXT,
  points INTEGER DEFAULT 10,
  explanation TEXT,
  order_index INTEGER NOT NULL
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'assignment', 'resource')),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_id UUID REFERENCES videos(id),
  quiz_id UUID REFERENCES quizzes(id),
  duration VARCHAR(20),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
  UNIQUE(student_id, course_id)
);

-- Student Progress
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  time_spent INTEGER, -- seconds
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id),
  quiz_id UUID REFERENCES quizzes(id),
  score INTEGER,
  total_points INTEGER,
  percentage DECIMAL(5,2),
  answers JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER -- seconds
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url VARCHAR(500),
  verification_code VARCHAR(50) UNIQUE NOT NULL
);

-- Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Partner Programs
CREATE TABLE IF NOT EXISTS partner_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  course_id UUID REFERENCES courses(id),
  start_date DATE,
  end_date DATE,
  capacity INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Courses: Public can view published, staff can manage all
CREATE POLICY "Public can view published courses" ON courses
  FOR SELECT USING (published = true);

CREATE POLICY "Staff can manage all courses" ON courses
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('staff', 'admin')
  );

-- Enrollments: Students can view their own
CREATE POLICY "Students can view own enrollments" ON enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Staff can view all enrollments" ON enrollments
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('staff', 'admin', 'partner')
  );

-- Progress: Students can view/update their own
CREATE POLICY "Students can manage own progress" ON student_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Staff can view all progress" ON student_progress
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('staff', 'admin', 'partner')
  );

-- Videos: Staff can manage, students can view
CREATE POLICY "Staff can manage videos" ON videos
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('staff', 'admin')
  );

CREATE POLICY "Students can view videos" ON videos
  FOR SELECT USING (status = 'ready');

-- Functions

-- Update course updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Count total lessons in course
  SELECT COUNT(l.id) INTO total_lessons
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  -- Count completed lessons
  SELECT COUNT(sp.id) INTO completed_lessons
  FROM student_progress sp
  JOIN lessons l ON sp.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE sp.student_id = p_student_id
    AND m.course_id = p_course_id
    AND sp.completed = true;

  -- Calculate percentage
  IF total_lessons > 0 THEN
    progress_percentage := (completed_lessons * 100) / total_lessons;
  ELSE
    progress_percentage := 0;
  END IF;

  -- Update enrollment progress
  UPDATE enrollments
  SET progress = progress_percentage,
      completed_at = CASE WHEN progress_percentage = 100 THEN NOW() ELSE NULL END,
      status = CASE WHEN progress_percentage = 100 THEN 'completed' ELSE 'active' END
  WHERE student_id = p_student_id AND course_id = p_course_id;

  RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - for testing)
-- Uncomment to populate with sample data

/*
INSERT INTO courses (title, description, level, category, published) VALUES
  ('Barber Apprenticeship Level 1', 'Master the fundamentals of professional barbering', 'Beginner', 'Personal Services', true),
  ('HVAC Technician Training', 'Comprehensive HVAC training with EPA certification', 'Beginner', 'Skilled Trades', true),
  ('Healthcare CNA/QMA', 'Fast-track certification for nursing assistants', 'Beginner', 'Healthcare', true);
*/

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
