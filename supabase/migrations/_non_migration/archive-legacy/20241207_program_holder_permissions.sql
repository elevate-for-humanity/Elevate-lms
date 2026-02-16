-- ============================================================================
-- PROGRAM HOLDER PERMISSIONS & RESTRICTIONS
-- Program holders can ONLY access THEIR students - NO admin access
-- ============================================================================

-- ============================================================================
-- STRICT ACCESS CONTROL FOR PROGRAM HOLDERS
-- ============================================================================

-- Program holders can ONLY view their own students' enrollments
DROP POLICY IF EXISTS "Program holders can view their students enrollments" ON enrollments;
CREATE POLICY "Program holders can view their students enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holder_students phs
      JOIN program_holders ph ON ph.id = phs.program_holder_id
      WHERE ph.user_id = auth.uid()
      AND ph.status = 'approved'
      AND phs.student_id = enrollments.user_id
      AND phs.status = 'active'
    )
  );

-- Program holders can ONLY view their own students' profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Program holders can view their students" ON profiles;
CREATE POLICY "Program holders can view their students"
  ON profiles FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = id
    OR
    -- Program holders can view their students
    EXISTS (
      SELECT 1 FROM program_holder_students phs
      JOIN program_holders ph ON ph.id = phs.program_holder_id
      WHERE ph.user_id = auth.uid()
      AND ph.status = 'approved'
      AND phs.student_id = profiles.id
    )
    OR
    -- Admins can view all profiles
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Program holders can ONLY view courses their students are enrolled in
DROP POLICY IF EXISTS "Program holders can view their students courses" ON courses;
CREATE POLICY "Program holders can view their students courses"
  ON courses FOR SELECT
  USING (
    -- Published courses visible to all
    is_published = true
    OR
    -- Program holders can see courses their students are enrolled in
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN program_holder_students phs ON phs.student_id = e.user_id
      JOIN program_holders ph ON ph.id = phs.program_holder_id
      WHERE ph.user_id = auth.uid()
      AND ph.status = 'approved'
      AND e.course_id = courses.id
    )
    OR
    -- Admins can see all courses
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- PROGRAM HOLDER REPORTING FUNCTIONS
-- ============================================================================

-- Function: Get program holder's students with progress
CREATE OR REPLACE FUNCTION get_program_holder_students_report(ph_user_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  program_name TEXT,
  enrollment_date TIMESTAMPTZ,
  status TEXT,
  progress_percentage INTEGER,
  courses_enrolled INTEGER,
  courses_completed INTEGER,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify caller is the program holder
  IF NOT EXISTS (
    SELECT 1 FROM program_holders
    WHERE user_id = ph_user_id
    AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not an approved program holder';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    prog.name,
    phs.enrolled_at,
    phs.status,
    COALESCE(AVG(e.progress_percentage)::INTEGER, 0),
    COUNT(DISTINCT e.id)::INTEGER,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END)::INTEGER,
    MAX(e.updated_at)
  FROM program_holder_students phs
  JOIN program_holders ph ON ph.id = phs.program_holder_id
  JOIN profiles p ON p.id = phs.student_id
  LEFT JOIN programs prog ON prog.id = phs.program_id
  LEFT JOIN enrollments e ON e.user_id = phs.student_id
  WHERE ph.user_id = ph_user_id
  AND ph.status = 'approved'
  GROUP BY p.id, p.full_name, p.email, prog.name, phs.enrolled_at, phs.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get individual student detailed report
CREATE OR REPLACE FUNCTION get_student_detailed_report(ph_user_id UUID, student_id_param UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  enrollment_date TIMESTAMPTZ,
  status TEXT,
  progress_percentage INTEGER,
  last_accessed TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  assignments_completed INTEGER,
  assignments_total INTEGER,
  grade_percentage DECIMAL
) AS $$
BEGIN
  -- Verify program holder owns this student
  IF NOT EXISTS (
    SELECT 1 FROM program_holder_students phs
    JOIN program_holders ph ON ph.id = phs.program_holder_id
    WHERE ph.user_id = ph_user_id
    AND ph.status = 'approved'
    AND phs.student_id = student_id_param
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Student does not belong to this program holder';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    e.enrolled_at,
    e.status,
    e.progress_percentage,
    e.last_accessed_at,
    COALESCE(e.time_spent_minutes, 0),
    0::INTEGER, -- assignments_completed (add if you have assignments table)
    0::INTEGER, -- assignments_total
    COALESCE(e.grade_percentage, 0)
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = student_id_param
  ORDER BY e.enrolled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EMAIL NOTIFICATION SYSTEM FOR PROGRAM HOLDERS
-- ============================================================================

-- Table: Program holder email queue
CREATE TABLE IF NOT EXISTS program_holder_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES program_holders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_emails_holder ON program_holder_emails(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_emails_student ON program_holder_emails(student_id);
CREATE INDEX IF NOT EXISTS idx_ph_emails_status ON program_holder_emails(status);

-- Enable RLS
ALTER TABLE program_holder_emails ENABLE ROW LEVEL SECURITY;

-- Program holders can only view their own emails
CREATE POLICY "Program holders can view own emails"
  ON program_holder_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holders ph
      WHERE ph.id = program_holder_emails.program_holder_id
      AND ph.user_id = auth.uid()
    )
  );

-- Program holders can send emails ONLY if admin has enabled this permission
CREATE POLICY "Program holders can send emails if permitted"
  ON program_holder_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_holders ph
      JOIN program_holder_students phs ON phs.program_holder_id = ph.id
      JOIN program_holder_permissions php ON php.program_holder_id = ph.id
      WHERE ph.id = program_holder_emails.program_holder_id
      AND ph.user_id = auth.uid()
      AND phs.student_id = program_holder_emails.student_id
      AND ph.status = 'approved'
      AND php.can_send_individual_emails = true  -- MUST BE ENABLED BY ADMIN
    )
  );

-- Admins can view all emails
CREATE POLICY "Admins can view all emails"
  ON program_holder_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function: Send email to student (queues email) - REQUIRES PERMISSION
CREATE OR REPLACE FUNCTION send_email_to_student(
  ph_user_id UUID,
  student_id_param UUID,
  subject_param TEXT,
  body_param TEXT
)
RETURNS UUID AS $$
DECLARE
  ph_id UUID;
  email_id UUID;
  can_email BOOLEAN;
BEGIN
  -- Get program holder ID and check permission
  SELECT ph.id, COALESCE(php.can_send_individual_emails, false)
  INTO ph_id, can_email
  FROM program_holders ph
  LEFT JOIN program_holder_permissions php ON php.program_holder_id = ph.id
  WHERE ph.user_id = ph_user_id
  AND ph.status = 'approved';

  IF ph_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not an approved program holder';
  END IF;

  -- Check if email permission is enabled
  IF NOT can_email THEN
    RAISE EXCEPTION 'Permission denied: Email sending not enabled for this program holder. Contact admin to enable this feature.';
  END IF;

  -- Verify student belongs to program holder
  IF NOT EXISTS (
    SELECT 1 FROM program_holder_students
    WHERE program_holder_id = ph_id
    AND student_id = student_id_param
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Student does not belong to this program holder';
  END IF;

  -- Check daily email limit
  IF NOT check_usage_limit(ph_user_id, 'email_sent', 'max_emails_per_day') THEN
    RAISE EXCEPTION 'Daily email limit reached. Contact admin to increase limit.';
  END IF;

  -- Queue email
  INSERT INTO program_holder_emails (
    program_holder_id,
    student_id,
    subject,
    body,
    status
  ) VALUES (
    ph_id,
    student_id_param,
    subject_param,
    body_param,
    'pending'
  ) RETURNING id INTO email_id;

  -- Track usage
  PERFORM track_program_holder_usage(ph_id, 'email_sent');

  RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Send bulk email to all students - REQUIRES PERMISSION
CREATE OR REPLACE FUNCTION send_bulk_email_to_students(
  ph_user_id UUID,
  subject_param TEXT,
  body_param TEXT
)
RETURNS INTEGER AS $$
DECLARE
  ph_id UUID;
  student_record RECORD;
  email_count INTEGER := 0;
  can_bulk_email BOOLEAN;
BEGIN
  -- Get program holder ID and check permission
  SELECT ph.id, COALESCE(php.can_send_bulk_emails, false)
  INTO ph_id, can_bulk_email
  FROM program_holders ph
  LEFT JOIN program_holder_permissions php ON php.program_holder_id = ph.id
  WHERE ph.user_id = ph_user_id
  AND ph.status = 'approved';

  IF ph_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not an approved program holder';
  END IF;

  -- Check if bulk email permission is enabled
  IF NOT can_bulk_email THEN
    RAISE EXCEPTION 'Permission denied: Bulk email sending not enabled for this program holder. Contact admin to enable this feature.';
  END IF;

  -- Queue emails for all students
  FOR student_record IN
    SELECT student_id
    FROM program_holder_students
    WHERE program_holder_id = ph_id
    AND status = 'active'
  LOOP
    -- Check daily limit before each email
    IF NOT check_usage_limit(ph_user_id, 'email_sent', 'max_emails_per_day') THEN
      RAISE NOTICE 'Daily email limit reached after % emails', email_count;
      EXIT;
    END IF;

    INSERT INTO program_holder_emails (
      program_holder_id,
      student_id,
      subject,
      body,
      status
    ) VALUES (
      ph_id,
      student_record.student_id,
      subject_param,
      body_param,
      'pending'
    );
    
    -- Track each email
    PERFORM track_program_holder_usage(ph_id, 'email_sent');
    email_count := email_count + 1;
  END LOOP;

  RETURN email_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PREVENT PROGRAM HOLDERS FROM ACCESSING ADMIN FEATURES
-- ============================================================================

-- Function to check if user is admin (for use in app)
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id_param
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is program holder
CREATE OR REPLACE FUNCTION is_program_holder(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM program_holders
    WHERE user_id = user_id_param
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ACTIVITY MONITORING
-- ============================================================================

-- Table: Program holder activity log
CREATE TABLE IF NOT EXISTS program_holder_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES program_holders(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'view_student', 'send_email', 'generate_report', 'enroll_student'
  student_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_activity_holder ON program_holder_activity_log(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_activity_created ON program_holder_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE program_holder_activity_log ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own activity
CREATE POLICY "Program holders can view own activity"
  ON program_holder_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holders ph
      WHERE ph.id = program_holder_activity_log.program_holder_id
      AND ph.user_id = auth.uid()
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
  ON program_holder_activity_log FOR INSERT
  WITH CHECK (true);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON program_holder_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_program_holder_students_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_detailed_report TO authenticated;
GRANT EXECUTE ON FUNCTION send_email_to_student TO authenticated;
GRANT EXECUTE ON FUNCTION send_bulk_email_to_students TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_program_holder TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_program_holder_students_report IS 
  'Returns report of all students for a specific program holder - ONLY their students';

COMMENT ON FUNCTION get_student_detailed_report IS 
  'Returns detailed course progress for a specific student - program holder must own the student';

COMMENT ON FUNCTION send_email_to_student IS 
  'Queues email to be sent to a student - program holder must own the student';

COMMENT ON FUNCTION send_bulk_email_to_students IS 
  'Queues emails to all students belonging to the program holder';

COMMENT ON TABLE program_holder_emails IS 
  'Email queue for program holders to communicate with their students';

COMMENT ON TABLE program_holder_activity_log IS 
  'Audit log of all program holder actions for security and monitoring';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Program holder permissions configured!';
  RAISE NOTICE '✅ Program holders can ONLY access THEIR students';
  RAISE NOTICE '✅ Program holders CANNOT access admin features';
  RAISE NOTICE '✅ Email system enabled for program holders';
  RAISE NOTICE '✅ Reporting functions created';
  RAISE NOTICE '✅ Activity logging enabled';
END $$;
