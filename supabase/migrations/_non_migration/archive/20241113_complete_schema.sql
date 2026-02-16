-- =====================================================
-- ELEVATE FOR HUMANITY - COMPLETE DATABASE SCHEMA
-- WRG/WIOA/JRI Workforce Training Platform
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('student', 'admin', 'program_holder', 'delegate', 'instructor');
CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'completed', 'withdrawn', 'suspended');
CREATE TYPE funding_type AS ENUM ('wrg', 'wioa', 'jri', 'employindy', 'self_pay', 'employer_sponsored');
CREATE TYPE program_holder_status AS ENUM ('pending', 'approved', 'inactive');
CREATE TYPE mou_status AS ENUM ('not_sent', 'pending', 'sent', 'signed_by_holder', 'fully_executed');
CREATE TYPE certificate_status AS ENUM ('pending', 'issued', 'revoked');
CREATE TYPE attendance_type AS ENUM ('login', 'lesson_complete', 'quiz_attempt', 'live_session');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student-specific data
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  county TEXT,
  funding_type funding_type,
  case_manager_name TEXT,
  case_manager_email TEXT,
  case_manager_phone TEXT,
  eligibility_verified BOOLEAN DEFAULT FALSE,
  eligibility_verified_at TIMESTAMPTZ,
  eligibility_verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program Holders (Training Providers)
CREATE TABLE program_holders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  website TEXT,
  training_focus TEXT,
  status program_holder_status NOT NULL DEFAULT 'pending',
  payout_share DECIMAL(3,2) NOT NULL DEFAULT 0.33,
  mou_status mou_status NOT NULL DEFAULT 'not_sent',
  mou_holder_signature_url TEXT,
  mou_holder_signed_at TIMESTAMPTZ,
  mou_admin_signature_url TEXT,
  mou_admin_signed_at TIMESTAMPTZ,
  mou_admin_signed_by UUID REFERENCES profiles(id),
  mou_final_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delegates (Case Managers)
CREATE TABLE delegates (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization TEXT,
  territory TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PROGRAM & COURSE STRUCTURE
-- =====================================================

-- Programs (e.g., Barber Apprenticeship, CNA)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  duration_weeks INTEGER,
  total_hours INTEGER,
  funding_types funding_type[] DEFAULT ARRAY['wrg', 'wioa', 'self_pay']::funding_type[],
  price_self_pay DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  program_holder_id UUID REFERENCES program_holders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses (within programs)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules (within courses)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons (within modules)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  requires_completion BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson Resources (PDFs, links, etc.)
CREATE TABLE lesson_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'pdf', 'video', 'link', 'document'
  url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ENROLLMENTS & PROGRESS
-- =====================================================

-- Student Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  funding_type funding_type NOT NULL,
  status enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  delegate_id UUID REFERENCES delegates(id),
  program_holder_id UUID REFERENCES program_holders(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, program_id)
);

-- Lesson Progress
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

-- =====================================================
-- ATTENDANCE & CONTACT HOURS
-- =====================================================

-- Attendance Log (for WRG/WIOA documentation)
CREATE TABLE attendance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  attendance_type attendance_type NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,
  lesson_id UUID REFERENCES lessons(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Hours Summary (aggregated for reporting)
CREATE TABLE contact_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, week_start_date)
);

-- =====================================================
-- ASSESSMENTS & GRADES
-- =====================================================

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
  correct_answer TEXT NOT NULL,
  options JSONB, -- For multiple choice: ["A", "B", "C", "D"]
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  score INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  answers JSONB, -- Store student answers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id),
  grade_type TEXT NOT NULL, -- 'quiz', 'assignment', 'final'
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATES
-- =====================================================

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by UUID REFERENCES profiles(id),
  status certificate_status NOT NULL DEFAULT 'issued',
  pdf_url TEXT,
  verification_code TEXT UNIQUE NOT NULL,
  total_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATIONS
-- =====================================================

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'success', 'info', 'warning', 'error'
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_students_funding_type ON students(funding_type);
CREATE INDEX idx_students_county ON students(county);

CREATE INDEX idx_program_holders_status ON program_holders(status);
CREATE INDEX idx_program_holders_mou_status ON program_holders(mou_status);

CREATE INDEX idx_programs_slug ON programs(slug);
CREATE INDEX idx_programs_is_active ON programs(is_active);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_delegate_id ON enrollments(delegate_id);

CREATE INDEX idx_attendance_log_student_id ON attendance_log(student_id);
CREATE INDEX idx_attendance_log_enrollment_id ON attendance_log(enrollment_id);
CREATE INDEX idx_attendance_log_logged_at ON attendance_log(logged_at);

CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_completed_at ON lesson_progress(completed_at);

CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);

CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Students: Can view own data, admins and delegates can view their assigned students
CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all students" ON students FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enrollments: Students see their own, delegates see their caseload, admins see all
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE id = auth.uid())
);
CREATE POLICY "Delegates can view their caseload" ON enrollments FOR SELECT USING (
  delegate_id IN (SELECT id FROM delegates WHERE id = auth.uid())
);
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_holders_updated_at BEFORE UPDATE ON program_holders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate certificate number and verification code
CREATE OR REPLACE FUNCTION set_certificate_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_certificate_codes_trigger
BEFORE INSERT ON certificates
FOR EACH ROW EXECUTE FUNCTION set_certificate_codes();

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Insert sample programs
INSERT INTO programs (slug, name, short_description, duration_weeks, total_hours, is_active) VALUES
('barber-apprenticeship', 'Barber Apprenticeship Program', 'Professional barbering and cosmetology training', 12, 240, true),
('cna-training', 'CNA Certification Training', 'Certified Nursing Assistant program', 8, 160, true),
('hvac-tech', 'HVAC Technician Training', 'Heating, ventilation, and air conditioning', 16, 320, true),
('building-tech', 'Building Maintenance Technology', 'Building maintenance and facilities management', 12, 240, true),
('life-coach', 'Life & Success Coaching', 'Professional life coaching certification', 10, 200, true),
('peer-recovery', 'Peer Recovery Specialist', 'Addiction recovery support specialist', 8, 160, true),
('tax-prep', 'Tax Preparation Professional', 'Tax preparation and financial literacy', 6, 120, true),
('medical-assistant', 'Medical Assistant Training', 'Clinical and administrative medical assisting', 14, 280, true),
('truck-driving', 'CDL Truck Driving', 'Commercial driver license training', 8, 160, true),
('workforce-readiness', 'Workforce Readiness Bootcamp', 'Essential workplace skills', 4, 80, true);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE students IS 'Student-specific data including WRG/WIOA eligibility';
COMMENT ON TABLE program_holders IS 'Training providers with MOU and payout tracking';
COMMENT ON TABLE enrollments IS 'Student enrollments in programs with funding type';
COMMENT ON TABLE attendance_log IS 'Detailed attendance tracking for WRG/WIOA compliance';
COMMENT ON TABLE certificates IS 'Issued certificates with verification codes';
