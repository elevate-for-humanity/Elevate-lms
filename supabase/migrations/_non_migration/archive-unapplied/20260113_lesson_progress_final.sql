-- Migration: lesson_progress and certificates tables
-- Note: enrollments/courses/lessons are views, so no FK constraints or triggers on them

DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_course ON lesson_progress(user_id, course_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  enrollment_id UUID,
  certificate_number TEXT UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_select" ON lesson_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "lp_all" ON lesson_progress FOR ALL USING (user_id = auth.uid());

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_select" ON certificates FOR SELECT USING (true);
CREATE POLICY "cert_insert" ON certificates FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons FROM lessons WHERE course_id = p_course_id;
  IF total_lessons = 0 THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO completed_lessons FROM lesson_progress WHERE user_id = p_user_id AND course_id = p_course_id AND completed = true;
  RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_certificate_number() RETURNS TEXT AS $$
BEGIN RETURN 'EFH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)); END;
$$ LANGUAGE plpgsql;
