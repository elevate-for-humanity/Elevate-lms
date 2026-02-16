-- ============================================================================
-- FLEXIBLE PROGRAM HOLDER PERMISSIONS
-- Admin can control exactly what each program holder can access
-- ============================================================================

-- ============================================================================
-- PERMISSION LEVELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_holder_permission_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permission levels
INSERT INTO program_holder_permission_levels (name, description, is_default) VALUES
('basic', 'Basic access - view students only', true),
('standard', 'Standard access - view students, send emails, basic reports', false),
('advanced', 'Advanced access - full student management, detailed reports, bulk operations', false),
('custom', 'Custom permissions set by admin', false);

-- ============================================================================
-- PROGRAM HOLDER PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_holder_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES program_holders(id) ON DELETE CASCADE UNIQUE,
  permission_level TEXT DEFAULT 'basic' REFERENCES program_holder_permission_levels(name),
  
  -- View Permissions
  can_view_students BOOLEAN DEFAULT true,
  can_view_student_details BOOLEAN DEFAULT true,
  can_view_student_progress BOOLEAN DEFAULT true,
  can_view_student_grades BOOLEAN DEFAULT false,
  can_view_student_attendance BOOLEAN DEFAULT false,
  can_view_student_contact_info BOOLEAN DEFAULT true,
  
  -- Action Permissions
  can_enroll_students BOOLEAN DEFAULT false,
  can_unenroll_students BOOLEAN DEFAULT false,
  can_edit_student_info BOOLEAN DEFAULT false,
  can_reset_student_password BOOLEAN DEFAULT false,
  
  -- Communication Permissions (ALL DISABLED BY DEFAULT - ADMIN MUST ENABLE)
  can_send_individual_emails BOOLEAN DEFAULT false,
  can_send_bulk_emails BOOLEAN DEFAULT false,
  can_send_sms BOOLEAN DEFAULT false,
  can_view_messages BOOLEAN DEFAULT false,
  can_message_students BOOLEAN DEFAULT false,
  
  -- Reporting Permissions
  can_generate_basic_reports BOOLEAN DEFAULT true,
  can_generate_detailed_reports BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  
  -- Course Permissions
  can_view_course_content BOOLEAN DEFAULT false,
  can_assign_courses BOOLEAN DEFAULT false,
  can_view_course_materials BOOLEAN DEFAULT false,
  
  -- Administrative Permissions
  can_manage_own_profile BOOLEAN DEFAULT true,
  can_view_billing BOOLEAN DEFAULT false,
  can_download_certificates BOOLEAN DEFAULT false,
  
  -- Custom Restrictions
  max_students INTEGER, -- NULL = unlimited
  max_emails_per_day INTEGER DEFAULT 50,
  max_reports_per_month INTEGER DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_permissions_holder ON program_holder_permissions(program_holder_id);

-- Enable RLS
ALTER TABLE program_holder_permissions ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own permissions
CREATE POLICY "Program holders can view own permissions"
  ON program_holder_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holders ph
      WHERE ph.id = program_holder_permissions.program_holder_id
      AND ph.user_id = auth.uid()
    )
  );

-- Only admins can modify permissions
CREATE POLICY "Only admins can modify permissions"
  ON program_holder_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PERMISSION CHECK FUNCTIONS
-- ============================================================================

-- Function to check if program holder has specific permission
CREATE OR REPLACE FUNCTION program_holder_has_permission(
  ph_user_id UUID,
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Get permission value
  EXECUTE format(
    'SELECT %I FROM program_holder_permissions php
     JOIN program_holders ph ON ph.id = php.program_holder_id
     WHERE ph.user_id = $1 AND ph.status = ''approved''',
    permission_name
  ) INTO has_perm USING ph_user_id;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a program holder
CREATE OR REPLACE FUNCTION get_program_holder_permissions(ph_user_id UUID)
RETURNS TABLE (
  permission_level TEXT,
  can_view_students BOOLEAN,
  can_view_student_details BOOLEAN,
  can_view_student_progress BOOLEAN,
  can_view_student_grades BOOLEAN,
  can_enroll_students BOOLEAN,
  can_send_individual_emails BOOLEAN,
  can_send_bulk_emails BOOLEAN,
  can_generate_basic_reports BOOLEAN,
  can_generate_detailed_reports BOOLEAN,
  can_export_data BOOLEAN,
  max_students INTEGER,
  max_emails_per_day INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    php.permission_level,
    php.can_view_students,
    php.can_view_student_details,
    php.can_view_student_progress,
    php.can_view_student_grades,
    php.can_enroll_students,
    php.can_send_individual_emails,
    php.can_send_bulk_emails,
    php.can_generate_basic_reports,
    php.can_generate_detailed_reports,
    php.can_export_data,
    php.max_students,
    php.max_emails_per_day
  FROM program_holder_permissions php
  JOIN program_holders ph ON ph.id = php.program_holder_id
  WHERE ph.user_id = ph_user_id
  AND ph.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-CREATE DEFAULT PERMISSIONS
-- ============================================================================

-- Trigger to create default permissions when program holder is approved
CREATE OR REPLACE FUNCTION create_default_program_holder_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- When program holder is approved, create default permissions
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO program_holder_permissions (
      program_holder_id,
      permission_level,
      can_view_students,
      can_view_student_details,
      can_view_student_progress,
      can_view_student_grades,
      can_enroll_students,
      can_send_individual_emails,
      can_send_bulk_emails,
      can_generate_basic_reports,
      can_generate_detailed_reports,
      can_export_data
    ) VALUES (
      NEW.id,
      'basic', -- Default to basic permissions
      true,    -- can_view_students
      true,    -- can_view_student_details
      true,    -- can_view_student_progress
      false,   -- can_view_student_grades (admin only by default)
      false,   -- can_enroll_students (admin must enable)
      false,   -- can_send_individual_emails (admin must enable)
      false,   -- can_send_bulk_emails (admin must enable)
      true,    -- can_generate_basic_reports
      false,   -- can_generate_detailed_reports (admin must enable)
      false    -- can_export_data (admin must enable)
    )
    ON CONFLICT (program_holder_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_program_holder_approved ON program_holders;
CREATE TRIGGER on_program_holder_approved
  AFTER INSERT OR UPDATE ON program_holders
  FOR EACH ROW
  EXECUTE FUNCTION create_default_program_holder_permissions();

-- ============================================================================
-- PERMISSION TEMPLATES
-- ============================================================================

-- Function to apply permission template
CREATE OR REPLACE FUNCTION apply_permission_template(
  ph_id UUID,
  template_name TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can modify permissions';
  END IF;

  -- Apply template
  CASE template_name
    WHEN 'basic' THEN
      UPDATE program_holder_permissions SET
        permission_level = 'basic',
        can_view_students = true,
        can_view_student_details = true,
        can_view_student_progress = true,
        can_view_student_grades = false,
        can_enroll_students = false,
        can_send_individual_emails = false,
        can_send_bulk_emails = false,
        can_generate_basic_reports = true,
        can_generate_detailed_reports = false,
        can_export_data = false,
        updated_at = NOW()
      WHERE program_holder_id = ph_id;
      
    WHEN 'standard' THEN
      UPDATE program_holder_permissions SET
        permission_level = 'standard',
        can_view_students = true,
        can_view_student_details = true,
        can_view_student_progress = true,
        can_view_student_grades = true,
        can_enroll_students = true,
        can_send_individual_emails = true,
        can_send_bulk_emails = false,
        can_generate_basic_reports = true,
        can_generate_detailed_reports = true,
        can_export_data = false,
        updated_at = NOW()
      WHERE program_holder_id = ph_id;
      
    WHEN 'advanced' THEN
      UPDATE program_holder_permissions SET
        permission_level = 'advanced',
        can_view_students = true,
        can_view_student_details = true,
        can_view_student_progress = true,
        can_view_student_grades = true,
        can_enroll_students = true,
        can_send_individual_emails = true,
        can_send_bulk_emails = true,
        can_generate_basic_reports = true,
        can_generate_detailed_reports = true,
        can_export_data = true,
        can_view_analytics = true,
        updated_at = NOW()
      WHERE program_holder_id = ph_id;
      
    ELSE
      RAISE EXCEPTION 'Invalid template name: %', template_name;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_holder_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES program_holders(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'email_sent', 'report_generated', 'student_enrolled', etc.
  count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_holder_id, action_type, date)
);

CREATE INDEX IF NOT EXISTS idx_ph_usage_holder_date ON program_holder_usage_tracking(program_holder_id, date);

-- Function to track usage
CREATE OR REPLACE FUNCTION track_program_holder_usage(
  ph_id UUID,
  action TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO program_holder_usage_tracking (program_holder_id, action_type, count, date)
  VALUES (ph_id, action, 1, CURRENT_DATE)
  ON CONFLICT (program_holder_id, action_type, date)
  DO UPDATE SET count = program_holder_usage_tracking.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if usage limit exceeded
CREATE OR REPLACE FUNCTION check_usage_limit(
  ph_user_id UUID,
  action TEXT,
  limit_column TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  usage_count INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Get today's usage
  SELECT COALESCE(SUM(count), 0) INTO usage_count
  FROM program_holder_usage_tracking put
  JOIN program_holders ph ON ph.id = put.program_holder_id
  WHERE ph.user_id = ph_user_id
  AND put.action_type = action
  AND put.date = CURRENT_DATE;
  
  -- Get limit
  EXECUTE format(
    'SELECT %I FROM program_holder_permissions php
     JOIN program_holders ph ON ph.id = php.program_holder_id
     WHERE ph.user_id = $1',
    limit_column
  ) INTO usage_limit USING ph_user_id;
  
  -- NULL limit means unlimited
  IF usage_limit IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN usage_count < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to list all program holders with their permission levels
CREATE OR REPLACE FUNCTION admin_list_program_holder_permissions()
RETURNS TABLE (
  program_holder_id UUID,
  organization_name TEXT,
  permission_level TEXT,
  total_students INTEGER,
  emails_sent_today INTEGER,
  reports_generated_this_month INTEGER
) AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view this data';
  END IF;

  RETURN QUERY
  SELECT 
    ph.id,
    ph.organization_name,
    COALESCE(php.permission_level, 'none'),
    COUNT(DISTINCT phs.student_id)::INTEGER,
    COALESCE((
      SELECT SUM(count) FROM program_holder_usage_tracking
      WHERE program_holder_id = ph.id
      AND action_type = 'email_sent'
      AND date = CURRENT_DATE
    ), 0)::INTEGER,
    COALESCE((
      SELECT SUM(count) FROM program_holder_usage_tracking
      WHERE program_holder_id = ph.id
      AND action_type = 'report_generated'
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0)::INTEGER
  FROM program_holders ph
  LEFT JOIN program_holder_permissions php ON php.program_holder_id = ph.id
  LEFT JOIN program_holder_students phs ON phs.program_holder_id = ph.id
  WHERE ph.status = 'approved'
  GROUP BY ph.id, ph.organization_name, php.permission_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION program_holder_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION get_program_holder_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION apply_permission_template TO authenticated;
GRANT EXECUTE ON FUNCTION track_program_holder_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_program_holder_permissions TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE program_holder_permissions IS 
  'Flexible permission system - admin controls exactly what each program holder can access';

COMMENT ON TABLE program_holder_permission_levels IS 
  'Pre-defined permission templates: basic, standard, advanced, custom';

COMMENT ON FUNCTION apply_permission_template IS 
  'Admin function to quickly apply permission templates to program holders';

COMMENT ON FUNCTION program_holder_has_permission IS 
  'Check if a program holder has a specific permission';

COMMENT ON TABLE program_holder_usage_tracking IS 
  'Track usage to enforce limits (emails per day, reports per month, etc.)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Flexible permission system created!';
  RAISE NOTICE '✅ Default permission level: BASIC (view students only)';
  RAISE NOTICE '✅ Admin can upgrade to STANDARD or ADVANCED';
  RAISE NOTICE '✅ Admin can set custom permissions per program holder';
  RAISE NOTICE '✅ Usage tracking enabled (email limits, report limits)';
  RAISE NOTICE '✅ Program holders get BASIC access by default';
END $$;
