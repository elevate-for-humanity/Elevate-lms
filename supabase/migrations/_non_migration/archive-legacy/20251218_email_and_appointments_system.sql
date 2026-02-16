-- Email and Appointments System
-- Complete automation for email delivery and appointment management

-- ============================================================================
-- 1. EMAIL QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email details
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  
  -- Template tracking
  template_name text,
  template_data jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  retry_count int DEFAULT 0,
  
  -- Metadata
  user_id uuid REFERENCES auth.users(id),
  related_type text, -- 'application', 'enrollment', 'appointment', 'tax', 'platform'
  related_id uuid,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_user ON email_queue(user_id);
CREATE INDEX idx_email_queue_created ON email_queue(created_at);
CREATE INDEX idx_email_queue_related ON email_queue(related_type, related_id);

COMMENT ON TABLE email_queue IS 'Queue for all outgoing emails with retry logic';

-- ============================================================================
-- 2. APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Appointment details
  appointment_type text NOT NULL CHECK (appointment_type IN (
    'student_advising',
    'tax_free',
    'tax_paid',
    'partner_meeting',
    'platform_demo'
  )),
  
  -- Scheduling
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  duration_minutes int DEFAULT 30,
  timezone text DEFAULT 'America/Indiana/Indianapolis',
  
  -- Format
  format text NOT NULL CHECK (format IN ('phone', 'zoom')),
  phone_number text,
  zoom_link text,
  zoom_meeting_id text,
  
  -- Participants
  student_id uuid REFERENCES auth.users(id),
  advisor_id uuid REFERENCES auth.users(id),
  guest_name text,
  guest_email text,
  guest_phone text,
  
  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'reminded_24h',
    'reminded_1h',
    'completed',
    'no_show',
    'cancelled',
    'rescheduled'
  )),
  
  -- Reminders
  reminder_24h_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,
  
  -- External integration
  calendly_event_id text,
  calendly_invitee_id text,
  external_calendar_id text,
  
  -- Notes
  notes text,
  cancellation_reason text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_advisor ON appointments(advisor_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_calendly ON appointments(calendly_event_id);

COMMENT ON TABLE appointments IS 'All appointments (phone and Zoom) for students, tax, and partners';

-- ============================================================================
-- 3. APPOINTMENT REMINDERS FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION send_appointment_reminders()
RETURNS void AS $$
DECLARE
  v_appointment record;
  v_now timestamptz := now();
  v_24h_window timestamptz := v_now + interval '24 hours';
  v_1h_window timestamptz := v_now + interval '1 hour';
BEGIN
  -- Send 24-hour reminders
  FOR v_appointment IN
    SELECT * FROM appointments
    WHERE status IN ('scheduled', 'confirmed')
      AND reminder_24h_sent_at IS NULL
      AND (scheduled_date + scheduled_time::time) BETWEEN v_now AND v_24h_window
  LOOP
    -- Queue 24-hour reminder email
    INSERT INTO email_queue (
      to_email,
      from_email,
      subject,
      template_name,
      template_data,
      user_id,
      related_type,
      related_id
    ) VALUES (
      COALESCE(
        (SELECT email FROM auth.users WHERE id = v_appointment.student_id),
        v_appointment.guest_email
      ),
      'noreply@elevateforhumanity.org',
      'Reminder: Your appointment tomorrow',
      'appointment_reminder_24h',
      jsonb_build_object(
        'firstName', COALESCE(
          (SELECT first_name FROM profiles WHERE id = v_appointment.student_id),
          v_appointment.guest_name
        ),
        'date', v_appointment.scheduled_date::text,
        'time', v_appointment.scheduled_time::text,
        'format', v_appointment.format,
        'zoomLink', v_appointment.zoom_link
      ),
      v_appointment.student_id,
      'appointment',
      v_appointment.id
    );
    
    -- Mark as sent
    UPDATE appointments
    SET reminder_24h_sent_at = v_now,
        status = 'reminded_24h',
        updated_at = v_now
    WHERE id = v_appointment.id;
  END LOOP;
  
  -- Send 1-hour reminders
  FOR v_appointment IN
    SELECT * FROM appointments
    WHERE status IN ('scheduled', 'confirmed', 'reminded_24h')
      AND reminder_1h_sent_at IS NULL
      AND (scheduled_date + scheduled_time::time) BETWEEN v_now AND v_1h_window
  LOOP
    -- Queue 1-hour reminder email
    INSERT INTO email_queue (
      to_email,
      from_email,
      subject,
      template_name,
      template_data,
      user_id,
      related_type,
      related_id
    ) VALUES (
      COALESCE(
        (SELECT email FROM auth.users WHERE id = v_appointment.student_id),
        v_appointment.guest_email
      ),
      'noreply@elevateforhumanity.org',
      'Starting soon: Your appointment in 1 hour',
      'appointment_reminder_1h',
      jsonb_build_object(
        'firstName', COALESCE(
          (SELECT first_name FROM profiles WHERE id = v_appointment.student_id),
          v_appointment.guest_name
        ),
        'time', v_appointment.scheduled_time::text,
        'format', v_appointment.format,
        'zoomLink', v_appointment.zoom_link
      ),
      v_appointment.student_id,
      'appointment',
      v_appointment.id
    );
    
    -- Mark as sent
    UPDATE appointments
    SET reminder_1h_sent_at = v_now,
        status = 'reminded_1h',
        updated_at = v_now
    WHERE id = v_appointment.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_appointment_reminders IS 'Sends 24h and 1h appointment reminders';

-- ============================================================================
-- 4. APPLICATION EMAIL TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_application_received_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue application received email
  INSERT INTO email_queue (
    to_email,
    from_email,
    subject,
    template_name,
    template_data,
    user_id,
    related_type,
    related_id
  ) VALUES (
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    'noreply@elevateforhumanity.org',
    'We received your application — here''s what happens next',
    'application_received',
    jsonb_build_object(
      'firstName', (SELECT first_name FROM profiles WHERE id = NEW.user_id)
    ),
    NEW.user_id,
    'application',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_received_email
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION trigger_application_received_email();

-- ============================================================================
-- 5. ENROLLMENT EMAIL TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_enrollment_confirmation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send if status changed to 'active'
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO email_queue (
      to_email,
      from_email,
      subject,
      template_name,
      template_data,
      user_id,
      related_type,
      related_id
    ) VALUES (
      (SELECT email FROM auth.users WHERE id = NEW.student_id),
      'noreply@elevateforhumanity.org',
      'You''re enrolled — here''s what''s next',
      'enrollment_confirmation',
      jsonb_build_object(
        'firstName', (SELECT first_name FROM profiles WHERE id = NEW.student_id),
        'programName', (SELECT name FROM programs WHERE id = NEW.program_id),
        'startDate', NEW.start_date::text,
        'format', 'Hybrid (online + in-person)'
      ),
      NEW.student_id,
      'enrollment',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_confirmation_email
AFTER INSERT OR UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION trigger_enrollment_confirmation_email();

-- ============================================================================
-- 6. APPOINTMENT CONFIRMATION EMAIL TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_appointment_confirmation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue appointment confirmation email
  INSERT INTO email_queue (
    to_email,
    from_email,
    subject,
    template_name,
    template_data,
    user_id,
    related_type,
    related_id
  ) VALUES (
    COALESCE(
      (SELECT email FROM auth.users WHERE id = NEW.student_id),
      NEW.guest_email
    ),
    'noreply@elevateforhumanity.org',
    'Your appointment with Elevate for Humanity',
    'student_appointment',
    jsonb_build_object(
      'firstName', COALESCE(
        (SELECT first_name FROM profiles WHERE id = NEW.student_id),
        NEW.guest_name
      ),
      'date', NEW.scheduled_date::text,
      'time', NEW.scheduled_time::text,
      'format', NEW.format,
      'zoomLink', NEW.zoom_link
    ),
    NEW.student_id,
    'appointment',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_confirmation_email
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION trigger_appointment_confirmation_email();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Email queue policies (admin only)
CREATE POLICY email_queue_admin_all ON email_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Appointments policies
CREATE POLICY appointments_own_view ON appointments
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR advisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'advisor')
    )
  );

CREATE POLICY appointments_admin_all ON appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'advisor')
    )
  );

-- ============================================================================
-- 8. SCHEDULED JOB (Run every 15 minutes)
-- ============================================================================
-- Note: This requires pg_cron extension
-- Run: SELECT cron.schedule('send-appointment-reminders', '*/15 * * * *', 'SELECT send_appointment_reminders();');

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Email and Appointments System - Complete';
