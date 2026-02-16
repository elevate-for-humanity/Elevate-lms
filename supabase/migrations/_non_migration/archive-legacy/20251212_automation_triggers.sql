-- Automation Triggers for All Systems
-- Automatically triggers welcome packets, emails, onboarding, etc.

-- ============================================
-- ENROLLMENT TRIGGERS
-- ============================================

-- Function: Trigger welcome packet creation on enrollment
CREATE OR REPLACE FUNCTION trigger_welcome_packet()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create welcome packet for new active enrollments
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- Create welcome packet
    INSERT INTO welcome_packets (
      student_id,
      enrollment_id,
      program_id,
      status,
      created_at
    ) VALUES (
      NEW.student_id,
      NEW.id,
      NEW.program_id,
      'pending',
      NOW()
    )
    ON CONFLICT (enrollment_id) DO NOTHING;

    -- Create welcome packet items
    INSERT INTO welcome_packet_items (
      packet_id,
      item_id,
      title,
      description,
      type,
      url,
      required,
      completed
    )
    SELECT 
      wp.id,
      item.item_id,
      item.title,
      item.description,
      item.type,
      item.url,
      item.required,
      false
    FROM welcome_packets wp
    CROSS JOIN (
      VALUES
        ('welcome-letter', 'Welcome Letter', 'Personal welcome message from our team', 'document', '/documents/welcome-letter.pdf', false),
        ('student-handbook', 'Student Handbook', 'Complete guide to policies and procedures', 'document', '/student-handbook', true),
        ('program-workbook', 'Program Workbook', 'Program-specific learning materials', 'document', '/workbooks', true),
        ('enrollment-agreement', 'Enrollment Agreement', 'Review and acknowledge your enrollment terms', 'form', '/student/enrollment-agreement', true),
        ('ferpa-rights', 'FERPA Rights Notification', 'Your privacy rights under federal law', 'document', '/ferpa', true),
        ('technology-setup', 'Technology Setup Guide', 'Set up your student portal and LMS access', 'document', '/student/tech-setup', true),
        ('financial-aid-info', 'Financial Aid Information', 'Understanding your funding and payment options', 'document', '/funding', false),
        ('campus-map', 'Campus Map & Directions', 'Find your way around campus', 'document', '/campus-map', false),
        ('first-day-checklist', 'First Day Checklist', 'What to bring and expect on your first day', 'document', '/first-day-checklist', true),
        ('orientation-video', 'Orientation Video', 'Watch our welcome orientation (15 minutes)', 'video', '/orientation/video', true)
    ) AS item(item_id, title, description, type, url, required)
    WHERE wp.enrollment_id = NEW.id
    ON CONFLICT (packet_id, item_id) DO NOTHING;

    -- Log welcome packet creation
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'Welcome to Your Program!',
      'welcome_packet',
      NOW(),
      'pending'
    FROM profiles p
    WHERE p.id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create welcome packet on enrollment
DROP TRIGGER IF EXISTS on_enrollment_create_welcome_packet ON enrollments;
CREATE TRIGGER on_enrollment_create_welcome_packet
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_packet();

-- ============================================
-- ONBOARDING TRIGGERS
-- ============================================

-- Function: Initialize onboarding steps for new enrollment
CREATE OR REPLACE FUNCTION trigger_onboarding_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Create onboarding records for all active steps
  INSERT INTO student_onboarding (
    student_id,
    enrollment_id,
    step_id,
    status,
    created_at
  )
  SELECT 
    NEW.student_id,
    NEW.id,
    os.id,
    'pending',
    NOW()
  FROM onboarding_steps os
  WHERE os.active = true
  ON CONFLICT (enrollment_id, step_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Initialize onboarding on enrollment
DROP TRIGGER IF EXISTS on_enrollment_init_onboarding ON enrollments;
CREATE TRIGGER on_enrollment_init_onboarding
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_onboarding_steps();

-- ============================================
-- PAYMENT TRIGGERS
-- ============================================

-- Function: Create enrollment after successful payment
CREATE OR REPLACE FUNCTION trigger_enrollment_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_program_id UUID;
  v_student_id UUID;
BEGIN
  -- Only process completed payments
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    
    -- Get program_id and student_id from payment metadata
    v_program_id := (NEW.metadata->>'program_id')::UUID;
    v_student_id := NEW.user_id;

    -- Create enrollment if it doesn't exist
    INSERT INTO enrollments (
      student_id,
      program_id,
      status,
      start_date,
      payment_status,
      tuition_paid,
      created_at
    )
    SELECT
      v_student_id,
      v_program_id,
      'active',
      CURRENT_DATE + INTERVAL '7 days', -- Start in 7 days
      'paid',
      NEW.amount,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = v_student_id 
      AND program_id = v_program_id
    );

    -- Log enrollment creation
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'Enrollment Confirmed - Payment Received',
      'enrollment_confirmation',
      NOW(),
      'pending'
    FROM profiles p
    WHERE p.id = v_student_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create enrollment after payment
DROP TRIGGER IF EXISTS on_payment_create_enrollment ON payment_logs;
CREATE TRIGGER on_payment_create_enrollment
  AFTER INSERT OR UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_enrollment_from_payment();

-- ============================================
-- ATTENDANCE TRIGGERS
-- ============================================

-- Function: Update attendance percentage on record change
CREATE OR REPLACE FUNCTION update_attendance_percentage()
RETURNS TRIGGER AS $$
DECLARE
  v_total_days INTEGER;
  v_present_days INTEGER;
  v_percentage DECIMAL;
BEGIN
  -- Calculate attendance percentage
  SELECT COUNT(*) INTO v_total_days
  FROM attendance_records
  WHERE student_id = NEW.student_id
    AND enrollment_id = NEW.enrollment_id;

  SELECT COUNT(*) INTO v_present_days
  FROM attendance_records
  WHERE student_id = NEW.student_id
    AND enrollment_id = NEW.enrollment_id
    AND status IN ('present', 'excused');

  IF v_total_days > 0 THEN
    v_percentage := (v_present_days::DECIMAL / v_total_days::DECIMAL) * 100;

    -- Update enrollment with attendance percentage
    UPDATE enrollments
    SET attendance_percentage = v_percentage,
        updated_at = NOW()
    WHERE id = NEW.enrollment_id;

    -- Check if attendance is below threshold (80%)
    IF v_percentage < 80 THEN
      -- Log warning
      INSERT INTO email_logs (
        recipient,
        subject,
        type,
        sent_at,
        status
      )
      SELECT 
        p.email,
        'Attendance Warning - Action Required',
        'attendance_warning',
        NOW(),
        'pending'
      FROM profiles p
      WHERE p.id = NEW.student_id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update attendance percentage
DROP TRIGGER IF EXISTS on_attendance_update_percentage ON attendance_records;
CREATE TRIGGER on_attendance_update_percentage
  AFTER INSERT OR UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_percentage();

-- ============================================
-- GRADE TRIGGERS
-- ============================================

-- Function: Update GPA on grade change
CREATE OR REPLACE FUNCTION update_student_gpa()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_percentage DECIMAL;
  v_gpa DECIMAL;
BEGIN
  -- Calculate average percentage
  SELECT AVG(percentage) INTO v_avg_percentage
  FROM grades
  WHERE student_id = NEW.student_id
    AND enrollment_id = NEW.enrollment_id;

  -- Convert to GPA (4.0 scale)
  v_gpa := CASE
    WHEN v_avg_percentage >= 90 THEN 4.0
    WHEN v_avg_percentage >= 80 THEN 3.0
    WHEN v_avg_percentage >= 70 THEN 2.0
    WHEN v_avg_percentage >= 60 THEN 1.0
    ELSE 0.0
  END;

  -- Update enrollment with GPA
  UPDATE enrollments
  SET gpa = v_gpa,
      updated_at = NOW()
  WHERE id = NEW.enrollment_id;

  -- Check if GPA is below threshold (2.0)
  IF v_gpa < 2.0 THEN
    -- Log warning
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'Academic Warning - GPA Below Requirement',
      'academic_warning',
      NOW(),
      'pending'
    FROM profiles p
    WHERE p.id = NEW.student_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update GPA on grade change
DROP TRIGGER IF EXISTS on_grade_update_gpa ON grades;
CREATE TRIGGER on_grade_update_gpa
  AFTER INSERT OR UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_student_gpa();

-- ============================================
-- HOUR TRACKING TRIGGERS
-- ============================================

-- Function: Update total hours on hour log
CREATE OR REPLACE FUNCTION update_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_practical_hours DECIMAL;
BEGIN
  -- Calculate total practical hours
  SELECT COALESCE(SUM(hours), 0) INTO v_practical_hours
  FROM student_hours
  WHERE student_id = NEW.student_id
    AND enrollment_id = NEW.enrollment_id
    AND approved = true;

  -- Update enrollment
  UPDATE enrollments
  SET practical_hours_completed = v_practical_hours,
      total_hours_completed = COALESCE(theory_hours_completed, 0) + v_practical_hours,
      updated_at = NOW()
  WHERE id = NEW.enrollment_id;

  -- Update progress percentage
  UPDATE enrollments e
  SET progress_percentage = CASE
    WHEN p.total_hours > 0 THEN
      ROUND((e.total_hours_completed / p.total_hours) * 100)
    ELSE 0
  END
  FROM programs p
  WHERE e.id = NEW.enrollment_id
    AND e.program_id = p.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update hours on student_hours change
DROP TRIGGER IF EXISTS on_hours_update_total ON student_hours;
CREATE TRIGGER on_hours_update_total
  AFTER INSERT OR UPDATE ON student_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_total_hours();

-- ============================================
-- SAP MONITORING TRIGGERS
-- ============================================

-- Function: Check SAP status on enrollment update
CREATE OR REPLACE FUNCTION check_sap_status()
RETURNS TRIGGER AS $$
DECLARE
  v_gpa DECIMAL;
  v_attendance DECIMAL;
  v_completion DECIMAL;
  v_sap_status TEXT;
BEGIN
  v_gpa := COALESCE(NEW.gpa, 0);
  v_attendance := COALESCE(NEW.attendance_percentage, 100);
  v_completion := COALESCE(NEW.progress_percentage, 0);

  -- Determine SAP status
  IF v_gpa >= 2.0 AND v_attendance >= 80 AND v_completion >= 67 THEN
    v_sap_status := 'good_standing';
  ELSIF v_gpa >= 1.5 AND v_attendance >= 70 AND v_completion >= 50 THEN
    v_sap_status := 'warning';
  ELSIF v_gpa >= 1.0 AND v_attendance >= 60 AND v_completion >= 40 THEN
    v_sap_status := 'probation';
  ELSE
    v_sap_status := 'suspension';
  END IF;

  -- Update SAP status
  NEW.sap_status := v_sap_status;

  -- Send notification if status changed
  IF OLD IS NOT NULL AND OLD.sap_status != v_sap_status THEN
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'SAP Status Change - ' || v_sap_status,
      'sap_notification',
      NOW(),
      'pending'
    FROM profiles p
    WHERE p.id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add SAP status column if not exists
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS sap_status TEXT DEFAULT 'good_standing',
ADD COLUMN IF NOT EXISTS gpa DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2) DEFAULT 100;

-- Trigger: Check SAP on enrollment update
DROP TRIGGER IF EXISTS on_enrollment_check_sap ON enrollments;
CREATE TRIGGER on_enrollment_check_sap
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION check_sap_status();

-- ============================================
-- WELCOME PACKET COMPLETION TRIGGER
-- ============================================

-- Function: Check if welcome packet is complete
CREATE OR REPLACE FUNCTION check_welcome_packet_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_required INTEGER;
  v_completed_required INTEGER;
  v_packet_id UUID;
BEGIN
  -- Get packet ID
  SELECT packet_id INTO v_packet_id
  FROM welcome_packet_items
  WHERE id = NEW.id;

  -- Count required items
  SELECT 
    COUNT(*) FILTER (WHERE required = true),
    COUNT(*) FILTER (WHERE required = true AND completed = true)
  INTO v_total_required, v_completed_required
  FROM welcome_packet_items
  WHERE packet_id = v_packet_id;

  -- If all required items complete, mark packet as complete
  IF v_total_required > 0 AND v_completed_required = v_total_required THEN
    UPDATE welcome_packets
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_packet_id
      AND status != 'completed';

    -- Send completion email
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'Welcome Packet Complete - You''re Ready!',
      'welcome_packet_complete',
      NOW(),
      'pending'
    FROM welcome_packets wp
    JOIN profiles p ON p.id = wp.student_id
    WHERE wp.id = v_packet_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check welcome packet completion
DROP TRIGGER IF EXISTS on_packet_item_check_completion ON welcome_packet_items;
CREATE TRIGGER on_packet_item_check_completion
  AFTER UPDATE ON welcome_packet_items
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION check_welcome_packet_completion();

-- ============================================
-- COMPLAINT TRIGGERS
-- ============================================

-- Function: Notify admin of new complaint
CREATE OR REPLACE FUNCTION notify_complaint_submitted()
RETURNS TRIGGER AS $$
BEGIN
  -- Log notification for admin
  INSERT INTO email_logs (
    recipient,
    subject,
    type,
    sent_at,
    status
  ) VALUES (
    'admin@elevateforhumanity.org',
    'New Student Complaint Submitted',
    'complaint_notification',
    NOW(),
    'pending'
  );

  -- Send confirmation to student
  INSERT INTO email_logs (
    recipient,
    subject,
    type,
    sent_at,
    status
  )
  SELECT 
    p.email,
    'Complaint Received - We''re Investigating',
    'complaint_confirmation',
    NOW(),
    'pending'
  FROM profiles p
  WHERE p.id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify on complaint submission
DROP TRIGGER IF EXISTS on_complaint_notify ON complaints;
CREATE TRIGGER on_complaint_notify
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_submitted();

-- ============================================
-- WITHDRAWAL TRIGGERS
-- ============================================

-- Function: Process withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment status
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE enrollments
    SET status = 'withdrawn',
        withdrawal_date = NEW.effective_date,
        updated_at = NOW()
    WHERE id = NEW.enrollment_id;

    -- Send confirmation email
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      sent_at,
      status
    )
    SELECT 
      p.email,
      'Withdrawal Processed',
      'withdrawal_confirmation',
      NOW(),
      'pending'
    FROM profiles p
    WHERE p.id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Process withdrawal
DROP TRIGGER IF EXISTS on_withdrawal_process ON withdrawals;
CREATE TRIGGER on_withdrawal_process
  AFTER UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION process_withdrawal();

-- ============================================
-- ECR SYNC TRIGGER
-- ============================================

-- Function: Create ECR snapshot on progress update
CREATE OR REPLACE FUNCTION create_ecr_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create snapshot if significant progress change
  IF ABS(COALESCE(NEW.progress_percentage, 0) - COALESCE(OLD.progress_percentage, 0)) >= 5 THEN
    INSERT INTO ecr_snapshots (
      student_id,
      enrollment_id,
      theory_hours,
      practical_hours,
      total_hours,
      progress_percentage,
      snapshot_date
    ) VALUES (
      NEW.student_id,
      NEW.id,
      COALESCE(NEW.theory_hours_completed, 0),
      COALESCE(NEW.practical_hours_completed, 0),
      COALESCE(NEW.total_hours_completed, 0),
      COALESCE(NEW.progress_percentage, 0),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create ECR snapshot
DROP TRIGGER IF EXISTS on_progress_create_snapshot ON enrollments;
CREATE TRIGGER on_progress_create_snapshot
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage)
  EXECUTE FUNCTION create_ecr_snapshot();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_status ON enrollments(program_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_sap_status ON enrollments(sap_status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_status ON payment_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_program ON payment_logs(program_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance_records(enrollment_id);

-- Grade indexes
CREATE INDEX IF NOT EXISTS idx_grades_student_enrollment ON grades(student_id, enrollment_id);

-- Hour tracking indexes
CREATE INDEX IF NOT EXISTS idx_student_hours_enrollment ON student_hours(enrollment_id, approved);

-- Email log indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_type ON email_logs(recipient, type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status, sent_at);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION trigger_welcome_packet() IS 'Automatically creates welcome packet when student enrolls';
COMMENT ON FUNCTION trigger_onboarding_steps() IS 'Initializes onboarding checklist for new enrollments';
COMMENT ON FUNCTION trigger_enrollment_from_payment() IS 'Creates enrollment after successful payment';
COMMENT ON FUNCTION update_attendance_percentage() IS 'Calculates and updates attendance percentage';
COMMENT ON FUNCTION update_student_gpa() IS 'Calculates and updates student GPA';
COMMENT ON FUNCTION update_total_hours() IS 'Updates total hours completed';
COMMENT ON FUNCTION check_sap_status() IS 'Monitors Satisfactory Academic Progress';
COMMENT ON FUNCTION check_welcome_packet_completion() IS 'Marks welcome packet complete when all required items done';
COMMENT ON FUNCTION notify_complaint_submitted() IS 'Sends notifications when complaint is filed';
COMMENT ON FUNCTION process_withdrawal() IS 'Processes student withdrawal';
COMMENT ON FUNCTION create_ecr_snapshot() IS 'Creates ECR snapshot for compliance';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all triggers are created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'on_%'
ORDER BY event_object_table, trigger_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All automation triggers created successfully!';
  RAISE NOTICE 'Triggers will automatically:';
  RAISE NOTICE '  - Create welcome packets on enrollment';
  RAISE NOTICE '  - Initialize onboarding checklists';
  RAISE NOTICE '  - Create enrollments after payment';
  RAISE NOTICE '  - Update attendance percentages';
  RAISE NOTICE '  - Calculate GPAs';
  RAISE NOTICE '  - Track hours';
  RAISE NOTICE '  - Monitor SAP status';
  RAISE NOTICE '  - Send email notifications';
  RAISE NOTICE '  - Process withdrawals';
  RAISE NOTICE '  - Create ECR snapshots';
END $$;
