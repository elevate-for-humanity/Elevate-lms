-- =====================================================
-- CASE SPINE AND WORKFLOW AUTOMATION
-- Unified case record + signature completeness + event triggers
-- =====================================================

-- 0. EXTEND STUDENT_ENROLLMENTS (Add missing fields for case spine compatibility)
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS program_holder_id UUID;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS employer_id UUID;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS region_id TEXT DEFAULT 'IN';
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;

-- 1. ENROLLMENT CASES (Canonical Case Spine)
CREATE TABLE IF NOT EXISTS enrollment_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL DEFAULT ('CASE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
  
  -- Party links
  student_id UUID NOT NULL REFERENCES profiles(id),
  program_id UUID,
  program_holder_id UUID REFERENCES profiles(id),
  employer_id UUID REFERENCES profiles(id),
  
  -- Classification
  program_slug TEXT NOT NULL,
  program_type TEXT NOT NULL DEFAULT 'apprenticeship',
  region_id TEXT NOT NULL DEFAULT 'IN',
  funding_source TEXT,
  
  -- Status lifecycle: draft → pending_signatures → active → in_progress → completed → closed
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'active', 'in_progress', 'completed', 'closed', 'cancelled')),
  
  -- Signature tracking
  signatures_required JSONB DEFAULT '["student", "employer", "program_holder"]'::jsonb,
  signatures_completed JSONB DEFAULT '[]'::jsonb,
  all_signatures_complete BOOLEAN DEFAULT FALSE,
  signatures_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enrollment_cases_student ON enrollment_cases(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_cases_program_holder ON enrollment_cases(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_cases_employer ON enrollment_cases(employer_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_cases_status ON enrollment_cases(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_cases_program_slug ON enrollment_cases(program_slug);

-- 2. UPDATE APPRENTICE_AGREEMENTS (Signatures)
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES enrollment_cases(id);
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS signer_role TEXT CHECK (signer_role IN ('student', 'employer', 'program_holder', 'witness', 'admin'));
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS agreement_version TEXT DEFAULT '1.0';
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS agreement_template_id UUID;
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS signer_name TEXT;
ALTER TABLE apprentice_agreements ADD COLUMN IF NOT EXISTS signer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_apprentice_agreements_case ON apprentice_agreements(case_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_agreements_signer_role ON apprentice_agreements(signer_role);

-- 3. CASE TASKS (Tasks linked to cases)
CREATE TABLE IF NOT EXISTS case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES enrollment_cases(id) ON DELETE CASCADE,
  
  -- Task definition
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to_role TEXT NOT NULL CHECK (assigned_to_role IN ('student', 'employer', 'program_holder', 'staff', 'admin')),
  assigned_to_user_id UUID REFERENCES profiles(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  
  -- Evidence
  evidence_url TEXT,
  evidence_metadata JSONB DEFAULT '{}',
  
  -- Ordering
  sequence_order INT DEFAULT 0,
  depends_on UUID REFERENCES case_tasks(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_tasks_case ON case_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_tasks_status ON case_tasks(status);
CREATE INDEX IF NOT EXISTS idx_case_tasks_assigned_role ON case_tasks(assigned_to_role);
CREATE INDEX IF NOT EXISTS idx_case_tasks_due_date ON case_tasks(due_date);

-- 4. CASE EVENTS (Append-only event log per case)
CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES enrollment_cases(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  
  -- Data
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_type ON case_events(event_type);
CREATE INDEX IF NOT EXISTS idx_case_events_created ON case_events(created_at);

-- 5. TASK TEMPLATES (Per-program task definitions)
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_role TEXT NOT NULL,
  due_days_from_activation INT DEFAULT 7,
  sequence_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_program ON task_templates(program_slug);

-- 6. INSERT DEFAULT TASK TEMPLATES FOR BARBER APPRENTICESHIP
INSERT INTO task_templates (program_slug, task_type, title, description, assigned_to_role, due_days_from_activation, sequence_order, is_required) VALUES
  ('barber-apprenticeship', 'document_upload', 'Upload Government ID', 'Upload a valid government-issued photo ID', 'student', 3, 1, true),
  ('barber-apprenticeship', 'document_upload', 'Upload Proof of Age', 'Upload birth certificate or passport', 'student', 3, 2, true),
  ('barber-apprenticeship', 'document_upload', 'Upload Barber School Enrollment', 'Upload proof of barber school enrollment or completion', 'student', 7, 3, true),
  ('barber-apprenticeship', 'verification', 'Verify Host Shop License', 'Verify the host barbershop has a valid state license', 'program_holder', 5, 4, true),
  ('barber-apprenticeship', 'verification', 'Verify Supervisor License', 'Verify the supervising barber has a valid license', 'program_holder', 5, 5, true),
  ('barber-apprenticeship', 'registration', 'Complete RAPIDS Registration', 'Register apprentice in DOL RAPIDS system', 'program_holder', 14, 6, true),
  ('barber-apprenticeship', 'registration', 'Enroll in Milady LMS', 'Set up Milady courseware access for related instruction', 'program_holder', 7, 7, true),
  ('barber-apprenticeship', 'orientation', 'Complete Orientation', 'Complete apprenticeship orientation session', 'student', 14, 8, true),
  ('barber-apprenticeship', 'agreement', 'Sign Employer Agreement', 'Employer signs the apprenticeship agreement', 'employer', 7, 9, true),
  ('barber-apprenticeship', 'milestone', 'First Week Check-in', 'Complete first week progress check-in', 'student', 21, 10, true)
ON CONFLICT DO NOTHING;

-- 7. FUNCTION: Check Signature Completeness
CREATE OR REPLACE FUNCTION check_signature_completeness(p_case_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_required JSONB;
  v_completed TEXT[];
  v_role TEXT;
  v_all_complete BOOLEAN := TRUE;
BEGIN
  -- Get required signatures for this case
  SELECT signatures_required INTO v_required
  FROM enrollment_cases WHERE id = p_case_id;
  
  IF v_required IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get completed signatures
  SELECT ARRAY_AGG(DISTINCT signer_role) INTO v_completed
  FROM apprentice_agreements
  WHERE case_id = p_case_id AND signed_at IS NOT NULL;
  
  IF v_completed IS NULL THEN
    v_completed := ARRAY[]::TEXT[];
  END IF;
  
  -- Check each required role
  FOR v_role IN SELECT jsonb_array_elements_text(v_required)
  LOOP
    IF NOT (v_role = ANY(v_completed)) THEN
      v_all_complete := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_all_complete;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCTION: Initialize Case Tasks
CREATE OR REPLACE FUNCTION initialize_case_tasks(p_case_id UUID)
RETURNS INT AS $$
DECLARE
  v_program_slug TEXT;
  v_activation_date DATE;
  v_task_count INT := 0;
BEGIN
  -- Get case details
  SELECT program_slug, COALESCE(activated_at::date, CURRENT_DATE)
  INTO v_program_slug, v_activation_date
  FROM enrollment_cases WHERE id = p_case_id;
  
  -- Insert tasks from templates
  INSERT INTO case_tasks (case_id, task_type, title, description, assigned_to_role, due_date, sequence_order)
  SELECT 
    p_case_id,
    tt.task_type,
    tt.title,
    tt.description,
    tt.assigned_to_role,
    v_activation_date + tt.due_days_from_activation,
    tt.sequence_order
  FROM task_templates tt
  WHERE tt.program_slug = v_program_slug
  ORDER BY tt.sequence_order;
  
  GET DIAGNOSTICS v_task_count = ROW_COUNT;
  
  RETURN v_task_count;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCTION: Log Case Event
CREATE OR REPLACE FUNCTION log_case_event(
  p_case_id UUID,
  p_event_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO case_events (case_id, event_type, actor_id, actor_role, before_state, after_state, metadata)
  VALUES (p_case_id, p_event_type, p_actor_id, p_actor_role, p_before_state, p_after_state, p_metadata)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- 10. TRIGGER: On Signature Added - Check Completeness and Activate
CREATE OR REPLACE FUNCTION on_signature_added()
RETURNS TRIGGER AS $$
DECLARE
  v_is_complete BOOLEAN;
  v_current_status TEXT;
  v_task_count INT;
BEGIN
  -- Only process if this signature has a case_id and is now signed
  IF NEW.case_id IS NULL OR NEW.signed_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get current case status
  SELECT status INTO v_current_status
  FROM enrollment_cases WHERE id = NEW.case_id;
  
  -- Log signature event
  PERFORM log_case_event(
    NEW.case_id,
    'signature_added',
    NEW.student_id,
    NEW.signer_role,
    NULL,
    jsonb_build_object('agreement_type', NEW.agreement_type, 'signer_role', NEW.signer_role),
    jsonb_build_object('agreement_id', NEW.id, 'agreement_version', NEW.agreement_version)
  );
  
  -- Update signatures_completed array
  UPDATE enrollment_cases
  SET signatures_completed = (
    SELECT jsonb_agg(DISTINCT signer_role)
    FROM apprentice_agreements
    WHERE case_id = NEW.case_id AND signed_at IS NOT NULL
  ),
  updated_at = NOW()
  WHERE id = NEW.case_id;
  
  -- Check completeness
  v_is_complete := check_signature_completeness(NEW.case_id);
  
  -- If all signatures complete and case is pending_signatures, activate
  IF v_is_complete AND v_current_status = 'pending_signatures' THEN
    -- Update case status
    UPDATE enrollment_cases
    SET 
      status = 'active',
      all_signatures_complete = TRUE,
      signatures_completed_at = NOW(),
      activated_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.case_id;
    
    -- Log activation event
    PERFORM log_case_event(
      NEW.case_id,
      'case_activated',
      NULL,
      'system',
      jsonb_build_object('status', 'pending_signatures'),
      jsonb_build_object('status', 'active'),
      jsonb_build_object('trigger', 'all_signatures_complete')
    );
    
    -- Initialize tasks
    v_task_count := initialize_case_tasks(NEW.case_id);
    
    -- Log tasks created event
    PERFORM log_case_event(
      NEW.case_id,
      'tasks_initialized',
      NULL,
      'system',
      NULL,
      jsonb_build_object('task_count', v_task_count),
      jsonb_build_object('trigger', 'case_activation')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_signature_added ON apprentice_agreements;
CREATE TRIGGER trigger_signature_added
AFTER INSERT OR UPDATE OF signed_at ON apprentice_agreements
FOR EACH ROW
EXECUTE FUNCTION on_signature_added();

-- 11. TRIGGER: On Task Completed - Log Event
CREATE OR REPLACE FUNCTION on_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM log_case_event(
      NEW.case_id,
      'task_completed',
      NEW.completed_by,
      NEW.assigned_to_role,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', 'completed', 'task_type', NEW.task_type),
      jsonb_build_object('task_id', NEW.id, 'title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_completed ON case_tasks;
CREATE TRIGGER trigger_task_completed
AFTER UPDATE OF status ON case_tasks
FOR EACH ROW
EXECUTE FUNCTION on_task_completed();

-- 12. TRIGGER: On Case Status Change - Log Event
CREATE OR REPLACE FUNCTION on_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM log_case_event(
      NEW.id,
      'status_changed',
      NULL,
      'system',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_case_status_change ON enrollment_cases;
CREATE TRIGGER trigger_case_status_change
AFTER UPDATE OF status ON enrollment_cases
FOR EACH ROW
EXECUTE FUNCTION on_case_status_change();

-- 13. RLS POLICIES
ALTER TABLE enrollment_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Enrollment cases: users can see their own cases
CREATE POLICY "Users can view own cases" ON enrollment_cases
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() = program_holder_id OR 
    auth.uid() = employer_id
  );

CREATE POLICY "Staff can view all cases" ON enrollment_cases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff can manage cases" ON enrollment_cases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Case tasks: users can see tasks for their cases
CREATE POLICY "Users can view own case tasks" ON case_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollment_cases ec 
      WHERE ec.id = case_tasks.case_id 
      AND (ec.student_id = auth.uid() OR ec.program_holder_id = auth.uid() OR ec.employer_id = auth.uid())
    )
  );

CREATE POLICY "Users can complete assigned tasks" ON case_tasks
  FOR UPDATE USING (
    assigned_to_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM enrollment_cases ec 
      WHERE ec.id = case_tasks.case_id 
      AND (
        (assigned_to_role = 'student' AND ec.student_id = auth.uid()) OR
        (assigned_to_role = 'program_holder' AND ec.program_holder_id = auth.uid()) OR
        (assigned_to_role = 'employer' AND ec.employer_id = auth.uid())
      )
    )
  );

CREATE POLICY "Staff can manage all tasks" ON case_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Case events: read-only for case participants
CREATE POLICY "Users can view own case events" ON case_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollment_cases ec 
      WHERE ec.id = case_events.case_id 
      AND (ec.student_id = auth.uid() OR ec.program_holder_id = auth.uid() OR ec.employer_id = auth.uid())
    )
  );

CREATE POLICY "Staff can view all events" ON case_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- No update/delete on case_events (append-only)

-- 14. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_enrollment_cases ON enrollment_cases;
CREATE TRIGGER set_updated_at_enrollment_cases
BEFORE UPDATE ON enrollment_cases
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_case_tasks ON case_tasks;
CREATE TRIGGER set_updated_at_case_tasks
BEFORE UPDATE ON case_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
