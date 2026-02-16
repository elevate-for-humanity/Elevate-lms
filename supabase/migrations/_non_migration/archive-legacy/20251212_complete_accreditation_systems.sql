-- Complete Accreditation Systems Migration
-- Creates all tables needed for accreditation readiness

-- ============================================
-- WELCOME PACKET SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS welcome_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id)
);

CREATE TABLE IF NOT EXISTS welcome_packet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES welcome_packets(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'form', 'video', 'link')),
  url TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(packet_id, item_id)
);

CREATE INDEX idx_welcome_packets_student ON welcome_packets(student_id);
CREATE INDEX idx_welcome_packets_status ON welcome_packets(status);
CREATE INDEX idx_welcome_packet_items_packet ON welcome_packet_items(packet_id);

-- ============================================
-- AI INSTRUCTOR SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS ai_instructor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  conversation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_instructor_logs_student ON ai_instructor_logs(student_id);
CREATE INDEX idx_ai_instructor_logs_created ON ai_instructor_logs(created_at DESC);

-- ============================================
-- HOUR TRACKING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS student_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  notes TEXT,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_hours_student ON student_hours(student_id);
CREATE INDEX idx_student_hours_enrollment ON student_hours(enrollment_id);
CREATE INDEX idx_student_hours_date ON student_hours(date DESC);
CREATE INDEX idx_student_hours_approved ON student_hours(approved);

-- Add hour tracking columns to enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS theory_hours_completed DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS practical_hours_completed DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours_completed DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMPTZ;

-- ============================================
-- ECR (ELECTRONIC COMPLETION RECORD) SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS ecr_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  theory_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  practical_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  milady_courses JSONB,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ecr_snapshots_student ON ecr_snapshots(student_id);
CREATE INDEX idx_ecr_snapshots_enrollment ON ecr_snapshots(enrollment_id);
CREATE INDEX idx_ecr_snapshots_date ON ecr_snapshots(snapshot_date DESC);

CREATE TABLE IF NOT EXISTS ecr_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_students INTEGER NOT NULL,
  successful INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  sync_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MOU (MEMORANDUM OF UNDERSTANDING) SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS mou_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mou_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES mou_templates(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_data TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, template_id)
);

CREATE INDEX idx_mou_signatures_student ON mou_signatures(student_id);
CREATE INDEX idx_mou_signatures_enrollment ON mou_signatures(enrollment_id);

-- ============================================
-- ONBOARDING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL CHECK (category IN ('enrollment', 'orientation', 'setup', 'training')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, step_id)
);

CREATE INDEX idx_student_onboarding_student ON student_onboarding(student_id);
CREATE INDEX idx_student_onboarding_enrollment ON student_onboarding(enrollment_id);
CREATE INDEX idx_student_onboarding_status ON student_onboarding(status);

-- ============================================
-- EMAIL LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);

-- ============================================
-- MILADY INTEGRATION ENHANCEMENTS
-- ============================================

-- Add additional columns to partner_lms_enrollments
ALTER TABLE partner_lms_enrollments
ADD COLUMN IF NOT EXISTS hours_completed DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;

-- ============================================
-- ATTENDANCE TRACKING ENHANCEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, enrollment_id, date)
);

CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_enrollment ON attendance_records(enrollment_id);
CREATE INDEX idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- ============================================
-- GRADING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assignment_name TEXT NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('quiz', 'exam', 'project', 'practical', 'participation')),
  points_earned DECIMAL(10,2) NOT NULL,
  points_possible DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN points_possible > 0 THEN (points_earned / points_possible * 100)
      ELSE 0
    END
  ) STORED,
  letter_grade TEXT,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_grades_course ON grades(course_id);

-- ============================================
-- COMPLAINT & GRIEVANCE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  complaint_type TEXT NOT NULL CHECK (complaint_type IN ('academic', 'financial', 'discrimination', 'harassment', 'facility', 'other')),
  description TEXT NOT NULL,
  desired_resolution TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_type ON complaints(complaint_type);

-- ============================================
-- REFUND TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'denied')),
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_student ON refunds(student_id);
CREATE INDEX idx_refunds_enrollment ON refunds(enrollment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- ============================================
-- WITHDRAWAL TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  withdrawal_type TEXT NOT NULL CHECK (withdrawal_type IN ('voluntary', 'administrative', 'academic', 'financial', 'medical')),
  reason TEXT NOT NULL,
  effective_date DATE NOT NULL,
  last_attendance_date DATE,
  refund_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed')),
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_student ON withdrawals(student_id);
CREATE INDEX idx_withdrawals_enrollment ON withdrawals(enrollment_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ============================================
-- INSERT DEFAULT ONBOARDING STEPS
-- ============================================

INSERT INTO onboarding_steps (name, description, step_order, required, category) VALUES
  ('Complete Enrollment Application', 'Submit and complete your enrollment application', 1, true, 'enrollment'),
  ('Review Enrollment Agreement', 'Read and sign your enrollment agreement', 2, true, 'enrollment'),
  ('Complete Financial Aid Application', 'Apply for financial aid if needed', 3, false, 'enrollment'),
  ('Acknowledge Student Handbook', 'Read and acknowledge the student handbook', 4, true, 'orientation'),
  ('Review FERPA Rights', 'Understand your privacy rights', 5, true, 'orientation'),
  ('Watch Orientation Video', 'Complete the new student orientation', 6, true, 'orientation'),
  ('Set Up Student Portal', 'Create your student portal account', 7, true, 'setup'),
  ('Set Up LMS Access', 'Access the learning management system', 8, true, 'setup'),
  ('Complete Technology Setup', 'Configure your devices and software', 9, true, 'setup'),
  ('Review Program Workbook', 'Download and review your program materials', 10, true, 'training'),
  ('Schedule First Day', 'Confirm your first day attendance', 11, true, 'training')
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DEFAULT MOU TEMPLATE
-- ============================================

INSERT INTO mou_templates (name, description, content, version) VALUES
  ('Student Enrollment Agreement', 'Standard enrollment agreement for all programs', 
   'STUDENT ENROLLMENT AGREEMENT

This agreement is entered into between Elevate for Humanity ("School") and the student named below.

STUDENT INFORMATION
Name: {{student_name}}
Program: {{program_name}}
Start Date: {{start_date}}

PROGRAM DETAILS
Total Hours: {{total_hours}}
Duration: {{duration}}
Tuition: {{tuition}}

STUDENT RESPONSIBILITIES
1. Attend all scheduled classes
2. Maintain satisfactory academic progress
3. Follow school policies and procedures
4. Pay tuition and fees as agreed

SCHOOL RESPONSIBILITIES
1. Provide quality instruction
2. Maintain safe facilities
3. Support student success
4. Issue certificate upon completion

REFUND POLICY
See Student Handbook for complete refund policy.

ACKNOWLEDGMENT
I have read and understand this agreement and the Student Handbook.

Signature: ___________________________
Date: ___________________________',
   '1.0')
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE welcome_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_packet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_instructor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecr_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mou_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mou_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Students can view their own records
CREATE POLICY "Students can view own welcome packets" ON welcome_packets
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own packet items" ON welcome_packet_items
  FOR SELECT USING (
    packet_id IN (SELECT id FROM welcome_packets WHERE student_id = auth.uid())
  );

CREATE POLICY "Students can view own AI logs" ON ai_instructor_logs
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own hours" ON student_hours
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own ECR snapshots" ON ecr_snapshots
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own MOU signatures" ON mou_signatures
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own onboarding" ON student_onboarding
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own grades" ON grades
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can view own complaints" ON complaints
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Admin/Staff can view all records
CREATE POLICY "Admin can view all welcome packets" ON welcome_packets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage all records" ON welcome_packet_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Public policies for templates
CREATE POLICY "Anyone can view active MOU templates" ON mou_templates
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view onboarding steps" ON onboarding_steps
  FOR SELECT USING (active = true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate attendance percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
  p_student_id UUID,
  p_enrollment_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  total_days INTEGER;
  present_days INTEGER;
  percentage DECIMAL;
BEGIN
  SELECT COUNT(*) INTO total_days
  FROM attendance_records
  WHERE student_id = p_student_id
    AND enrollment_id = p_enrollment_id;
  
  IF total_days = 0 THEN
    RETURN 100.0;
  END IF;
  
  SELECT COUNT(*) INTO present_days
  FROM attendance_records
  WHERE student_id = p_student_id
    AND enrollment_id = p_enrollment_id
    AND status IN ('present', 'excused');
  
  percentage := (present_days::DECIMAL / total_days::DECIMAL) * 100;
  RETURN ROUND(percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate GPA
CREATE OR REPLACE FUNCTION calculate_gpa(
  p_student_id UUID,
  p_enrollment_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  avg_percentage DECIMAL;
  gpa DECIMAL;
BEGIN
  SELECT AVG(percentage) INTO avg_percentage
  FROM grades
  WHERE student_id = p_student_id
    AND enrollment_id = p_enrollment_id;
  
  IF avg_percentage IS NULL THEN
    RETURN 0.0;
  END IF;
  
  -- Convert percentage to 4.0 scale
  gpa := CASE
    WHEN avg_percentage >= 90 THEN 4.0
    WHEN avg_percentage >= 80 THEN 3.0
    WHEN avg_percentage >= 70 THEN 2.0
    WHEN avg_percentage >= 60 THEN 1.0
    ELSE 0.0
  END;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_hours_updated_at
  BEFORE UPDATE ON student_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_onboarding_updated_at
  BEFORE UPDATE ON student_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE welcome_packets IS 'Tracks welcome packet delivery and completion for new students';
COMMENT ON TABLE ai_instructor_logs IS 'Logs all AI instructor interactions for quality assurance';
COMMENT ON TABLE student_hours IS 'Tracks practical hours logged by students';
COMMENT ON TABLE ecr_snapshots IS 'Electronic Completion Record snapshots for compliance reporting';
COMMENT ON TABLE mou_signatures IS 'Digital signatures for enrollment agreements and MOUs';
COMMENT ON TABLE onboarding_steps IS 'Defines the onboarding process steps';
COMMENT ON TABLE student_onboarding IS 'Tracks individual student progress through onboarding';
COMMENT ON TABLE attendance_records IS 'Daily attendance tracking for all students';
COMMENT ON TABLE grades IS 'Student grades and assessment results';
COMMENT ON TABLE complaints IS 'Student complaints and grievances';
COMMENT ON TABLE refunds IS 'Refund requests and processing';
COMMENT ON TABLE withdrawals IS 'Student withdrawal requests and processing';
