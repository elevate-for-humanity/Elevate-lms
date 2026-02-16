-- LMS Requirements System
-- Unified tracking for all student completion requirements

-- ============================================================================
-- 1. STUDENT REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Requirement details
  requirement_type text NOT NULL CHECK (requirement_type IN (
    'course',           -- Complete a course/lesson
    'document',         -- Upload document/certificate
    'hours',            -- Log apprenticeship hours
    'evaluation',       -- Complete evaluation/assessment
    'sign_off',         -- Get supervisor sign-off
    'appointment',      -- Schedule/attend appointment
    'verification'      -- Verify information
  )),
  
  title text NOT NULL,
  description text,
  
  -- Scheduling
  due_date date,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Not started
    'in_progress',      -- Student working on it
    'completed',        -- Student completed, awaiting verification
    'verified',         -- Verified by program holder/admin
    'rejected'          -- Rejected, needs resubmission
  )),
  
  -- Evidence
  evidence_url text,
  evidence_type text, -- 'file', 'link', 'external_system'
  notes text,
  
  -- Verification
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  rejection_reason text,
  
  -- Metadata
  external_id text,   -- Link to external system (Milady, Certiport, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_student_requirements_enrollment ON student_requirements(enrollment_id);
CREATE INDEX idx_student_requirements_status ON student_requirements(status);
CREATE INDEX idx_student_requirements_due_date ON student_requirements(due_date);
CREATE INDEX idx_student_requirements_priority ON student_requirements(priority);
CREATE INDEX idx_student_requirements_type ON student_requirements(requirement_type);

COMMENT ON TABLE student_requirements IS 'Unified tracking for all student completion requirements';
COMMENT ON COLUMN student_requirements.requirement_type IS 'Type of requirement: course, document, hours, evaluation, sign_off, appointment, verification';
COMMENT ON COLUMN student_requirements.status IS 'Current status: pending, in_progress, completed, verified, rejected';
COMMENT ON COLUMN student_requirements.priority IS 'Priority level: urgent, high, normal, low';

-- ============================================================================
-- 2. STUDENT RISK STATUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_risk_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Risk calculation
  status text NOT NULL DEFAULT 'on_track' CHECK (status IN (
    'on_track',         -- All requirements current
    'needs_action',     -- 1-2 overdue items
    'at_risk'           -- 3+ overdue items or critical missing
  )),
  
  -- Metrics
  overdue_count int DEFAULT 0,
  pending_count int DEFAULT 0,
  completed_count int DEFAULT 0,
  total_count int DEFAULT 0,
  progress_percentage int DEFAULT 0,
  
  -- Activity tracking
  last_activity_date date,
  last_login_date date,
  days_since_activity int DEFAULT 0,
  
  -- Flags
  has_critical_overdue boolean DEFAULT false,
  has_missing_funding_docs boolean DEFAULT false,
  has_attendance_issues boolean DEFAULT false,
  
  -- Calculation metadata
  calculated_at timestamptz DEFAULT now(),
  calculation_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_student_risk_status_enrollment ON student_risk_status(enrollment_id);
CREATE INDEX idx_student_risk_status_status ON student_risk_status(status);
CREATE INDEX idx_student_risk_status_overdue ON student_risk_status(overdue_count);

COMMENT ON TABLE student_risk_status IS 'Calculated risk status for each student enrollment';
COMMENT ON COLUMN student_risk_status.status IS 'Risk level: on_track, needs_action, at_risk';

-- ============================================================================
-- 3. REQUIREMENT TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS requirement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  
  -- Template details
  requirement_type text NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Default settings
  default_priority text DEFAULT 'normal',
  days_after_enrollment int, -- Auto-create X days after enrollment
  relative_due_days int,     -- Due X days after creation
  
  -- Ordering
  sequence_order int DEFAULT 0,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_requirement_templates_program ON requirement_templates(program_id);
CREATE INDEX idx_requirement_templates_active ON requirement_templates(is_active);

COMMENT ON TABLE requirement_templates IS 'Templates for auto-creating requirements when student enrolls';

-- ============================================================================
-- 4. VERIFICATION ACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES student_requirements(id) ON DELETE CASCADE,
  
  action_type text NOT NULL CHECK (action_type IN (
    'submitted',
    'approved',
    'rejected',
    'requested_changes',
    'note_added'
  )),
  
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_verification_actions_requirement ON verification_actions(requirement_id);
CREATE INDEX idx_verification_actions_performed_by ON verification_actions(performed_by);

COMMENT ON TABLE verification_actions IS 'Audit trail for requirement verification actions';

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to calculate student risk status
CREATE OR REPLACE FUNCTION calculate_student_risk_status(p_enrollment_id uuid)
RETURNS void AS $$
DECLARE
  v_overdue_count int;
  v_pending_count int;
  v_completed_count int;
  v_total_count int;
  v_progress_percentage int;
  v_status text;
  v_has_critical_overdue boolean;
  v_last_activity date;
BEGIN
  -- Count requirements
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE),
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')),
    COUNT(*) FILTER (WHERE status IN ('completed', 'verified')),
    COUNT(*)
  INTO v_overdue_count, v_pending_count, v_completed_count, v_total_count
  FROM student_requirements
  WHERE enrollment_id = p_enrollment_id;
  
  -- Calculate progress
  IF v_total_count > 0 THEN
    v_progress_percentage := ROUND((v_completed_count::numeric / v_total_count::numeric) * 100);
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  -- Check for critical overdue (urgent priority items overdue)
  SELECT EXISTS(
    SELECT 1 FROM student_requirements
    WHERE enrollment_id = p_enrollment_id
      AND priority = 'urgent'
      AND status IN ('pending', 'in_progress')
      AND due_date < CURRENT_DATE
  ) INTO v_has_critical_overdue;
  
  -- Determine status
  IF v_overdue_count >= 3 OR v_has_critical_overdue THEN
    v_status := 'at_risk';
  ELSIF v_overdue_count >= 1 THEN
    v_status := 'needs_action';
  ELSE
    v_status := 'on_track';
  END IF;
  
  -- Get last activity
  SELECT MAX(updated_at::date)
  INTO v_last_activity
  FROM student_requirements
  WHERE enrollment_id = p_enrollment_id;
  
  -- Upsert risk status
  INSERT INTO student_risk_status (
    enrollment_id,
    status,
    overdue_count,
    pending_count,
    completed_count,
    total_count,
    progress_percentage,
    has_critical_overdue,
    last_activity_date,
    days_since_activity,
    calculated_at
  ) VALUES (
    p_enrollment_id,
    v_status,
    v_overdue_count,
    v_pending_count,
    v_completed_count,
    v_total_count,
    v_progress_percentage,
    v_has_critical_overdue,
    v_last_activity,
    COALESCE(CURRENT_DATE - v_last_activity, 0),
    now()
  )
  ON CONFLICT (enrollment_id) DO UPDATE SET
    status = EXCLUDED.status,
    overdue_count = EXCLUDED.overdue_count,
    pending_count = EXCLUDED.pending_count,
    completed_count = EXCLUDED.completed_count,
    total_count = EXCLUDED.total_count,
    progress_percentage = EXCLUDED.progress_percentage,
    has_critical_overdue = EXCLUDED.has_critical_overdue,
    last_activity_date = EXCLUDED.last_activity_date,
    days_since_activity = EXCLUDED.days_since_activity,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create requirements from templates
CREATE OR REPLACE FUNCTION create_requirements_from_templates(p_enrollment_id uuid)
RETURNS void AS $$
DECLARE
  v_program_id uuid;
  v_enrollment_date date;
  v_template record;
BEGIN
  -- Get enrollment details
  SELECT program_id, start_date
  INTO v_program_id, v_enrollment_date
  FROM enrollments
  WHERE id = p_enrollment_id;
  
  -- Create requirements from templates
  FOR v_template IN
    SELECT * FROM requirement_templates
    WHERE program_id = v_program_id
      AND is_active = true
    ORDER BY sequence_order
  LOOP
    INSERT INTO student_requirements (
      enrollment_id,
      requirement_type,
      title,
      description,
      priority,
      due_date,
      status
    ) VALUES (
      p_enrollment_id,
      v_template.requirement_type,
      v_template.title,
      v_template.description,
      v_template.default_priority,
      CASE 
        WHEN v_template.relative_due_days IS NOT NULL 
        THEN v_enrollment_date + v_template.relative_due_days
        ELSE NULL
      END,
      'pending'
    );
  END LOOP;
  
  -- Calculate initial risk status
  PERFORM calculate_student_risk_status(p_enrollment_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Trigger to update risk status when requirements change
CREATE OR REPLACE FUNCTION trigger_update_risk_status()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_student_risk_status(NEW.enrollment_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_risk_status_on_requirement_change
AFTER INSERT OR UPDATE ON student_requirements
FOR EACH ROW
EXECUTE FUNCTION trigger_update_risk_status();

-- Trigger to auto-create requirements on enrollment
CREATE OR REPLACE FUNCTION trigger_create_requirements_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    PERFORM create_requirements_from_templates(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_requirements_on_enrollment
AFTER INSERT OR UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION trigger_create_requirements_on_enrollment();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE student_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_risk_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_actions ENABLE ROW LEVEL SECURITY;

-- Students can view their own requirements
CREATE POLICY student_requirements_select_own ON student_requirements
  FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

-- Students can update their own requirements (submit evidence)
CREATE POLICY student_requirements_update_own ON student_requirements
  FOR UPDATE
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  )
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY student_requirements_admin_all ON student_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Program holders can view/update requirements for their students
CREATE POLICY student_requirements_program_holder ON student_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN programs p ON e.program_id = p.id
      JOIN profiles prof ON prof.id = auth.uid()
      WHERE e.id = student_requirements.enrollment_id
        AND prof.role = 'program_holder'
        AND p.organization_id = prof.organization_id
    )
  );

-- Similar policies for other tables
CREATE POLICY student_risk_status_select ON student_risk_status
  FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'program_holder')
    )
  );

CREATE POLICY requirement_templates_select ON requirement_templates
  FOR SELECT
  USING (true);

CREATE POLICY requirement_templates_admin ON requirement_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY verification_actions_insert ON verification_actions
  FOR INSERT
  WITH CHECK (
    performed_by = auth.uid()
  );

CREATE POLICY verification_actions_select ON verification_actions
  FOR SELECT
  USING (
    performed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 8. SEED DATA - DEFAULT REQUIREMENT TEMPLATES
-- ============================================================================

-- Note: These will be program-specific in production
-- This is example data for Barber Apprenticeship

INSERT INTO requirement_templates (program_id, requirement_type, title, description, default_priority, days_after_enrollment, relative_due_days, sequence_order)
SELECT 
  p.id,
  'course',
  'Complete Milady Theory Course',
  'Complete all modules in the Milady online theory course',
  'high',
  0,
  90,
  1
FROM programs p
WHERE p.slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

INSERT INTO requirement_templates (program_id, requirement_type, title, description, default_priority, days_after_enrollment, relative_due_days, sequence_order)
SELECT 
  p.id,
  'document',
  'Upload Completion Certificate',
  'Upload your Milady course completion certificate',
  'high',
  90,
  7,
  2
FROM programs p
WHERE p.slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

INSERT INTO requirement_templates (program_id, requirement_type, title, description, default_priority, days_after_enrollment, relative_due_days, sequence_order)
SELECT 
  p.id,
  'hours',
  'Log Apprenticeship Hours',
  'Log your weekly apprenticeship hours with supervisor approval',
  'urgent',
  0,
  NULL, -- Ongoing requirement
  3
FROM programs p
WHERE p.slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

INSERT INTO requirement_templates (program_id, requirement_type, title, description, default_priority, days_after_enrollment, relative_due_days, sequence_order)
SELECT 
  p.id,
  'appointment',
  'Schedule Check-In with Advisor',
  'Schedule your monthly check-in appointment with your advisor',
  'normal',
  30,
  7,
  4
FROM programs p
WHERE p.slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'LMS Requirements System - Complete';
