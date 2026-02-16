-- =====================================================
-- FERPA COMPLIANCE SYSTEM
-- Date: January 18, 2026
-- Purpose: Tables for FERPA records access requests, 
--          audit logs, and compliance tracking
-- =====================================================

-- FERPA Access Requests
-- Tracks requests to access or release student records
CREATE TABLE IF NOT EXISTS ferpa_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN (
    'student_access',      -- Student requesting their own records
    'parent_access',       -- Parent/guardian requesting records
    'third_party',         -- Third party disclosure request
    'transcript',          -- Transcript request
    'verification',        -- Enrollment verification
    'subpoena',           -- Legal/subpoena request
    'directory_opt_out'    -- Directory information opt-out
  )),
  
  -- Who is requesting
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  requester_relationship TEXT, -- 'self', 'parent', 'employer', 'school', 'government', 'other'
  
  -- Student whose records are requested
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT,
  student_email TEXT,
  
  -- Request specifics
  records_requested TEXT[], -- Array of record types requested
  purpose TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Supporting documentation
  consent_form_url TEXT,
  supporting_docs JSONB DEFAULT '[]'::jsonb,
  
  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'partially_approved', 
    'denied', 'completed', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Review/approval
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  denial_reason TEXT,
  
  -- Fulfillment
  fulfilled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  fulfillment_method TEXT, -- 'email', 'mail', 'pickup', 'portal'
  fulfillment_notes TEXT,
  
  -- Deadlines (FERPA requires response within 45 days)
  due_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ferpa_requests_status ON ferpa_access_requests(status);
CREATE INDEX idx_ferpa_requests_student ON ferpa_access_requests(student_id);
CREATE INDEX idx_ferpa_requests_requester ON ferpa_access_requests(requester_id);
CREATE INDEX idx_ferpa_requests_type ON ferpa_access_requests(request_type);
CREATE INDEX idx_ferpa_requests_due ON ferpa_access_requests(due_date);

-- FERPA Record Access Audit Log
-- Tracks every access to student education records
CREATE TABLE IF NOT EXISTS ferpa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who accessed
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- What was accessed
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL, -- 'profile', 'grades', 'enrollment', 'financial', 'disciplinary', etc.
  record_id UUID,
  
  -- Access details
  action TEXT NOT NULL CHECK (action IN (
    'view', 'search', 'export', 'print', 'update', 'delete', 'disclose'
  )),
  access_reason TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id UUID REFERENCES ferpa_access_requests(id) ON DELETE SET NULL,
  
  -- Timestamp
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ferpa_audit_user ON ferpa_audit_log(user_id);
CREATE INDEX idx_ferpa_audit_student ON ferpa_audit_log(student_id);
CREATE INDEX idx_ferpa_audit_action ON ferpa_audit_log(action);
CREATE INDEX idx_ferpa_audit_date ON ferpa_audit_log(accessed_at);

-- FERPA Compliance Events/Calendar
CREATE TABLE IF NOT EXISTS ferpa_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'training', 'audit', 'deadline', 'review', 'notification', 'other'
  )),
  
  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  
  -- Assignment
  assigned_to UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ferpa_calendar_date ON ferpa_calendar_events(start_date);
CREATE INDEX idx_ferpa_calendar_type ON ferpa_calendar_events(event_type);

-- FERPA Documentation/Forms
CREATE TABLE IF NOT EXISTS ferpa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'consent_form', 'release_form', 'policy', 'procedure', 
    'template', 'training_material', 'audit_report', 'other'
  )),
  
  -- File info
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Version control
  version TEXT DEFAULT '1.0',
  is_current BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES ferpa_documents(id),
  
  -- Access control
  is_public BOOLEAN DEFAULT false, -- Available to students
  required_roles TEXT[] DEFAULT '{"admin", "staff"}',
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ferpa_docs_type ON ferpa_documents(document_type);
CREATE INDEX idx_ferpa_docs_current ON ferpa_documents(is_current);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ferpa_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_documents ENABLE ROW LEVEL SECURITY;

-- FERPA Access Requests policies
CREATE POLICY "Staff can view all FERPA requests" ON ferpa_access_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff', 'ferpa_officer', 'registrar')
    )
  );

CREATE POLICY "Staff can create FERPA requests" ON ferpa_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff', 'ferpa_officer', 'registrar')
    )
  );

CREATE POLICY "Staff can update FERPA requests" ON ferpa_access_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff', 'ferpa_officer', 'registrar')
    )
  );

-- Students can view their own requests
CREATE POLICY "Students can view own FERPA requests" ON ferpa_access_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR student_id = auth.uid());

-- FERPA Audit Log policies (read-only for staff, insert for system)
CREATE POLICY "Staff can view audit logs" ON ferpa_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

CREATE POLICY "System can insert audit logs" ON ferpa_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Calendar events policies
CREATE POLICY "Staff can manage calendar events" ON ferpa_calendar_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff', 'ferpa_officer', 'registrar')
    )
  );

-- Documents policies
CREATE POLICY "Staff can manage FERPA documents" ON ferpa_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff', 'ferpa_officer', 'registrar')
    )
  );

CREATE POLICY "Public documents visible to all" ON ferpa_documents
  FOR SELECT TO authenticated
  USING (is_public = true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_ferpa_requests_updated_at 
  BEFORE UPDATE ON ferpa_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_calendar_updated_at 
  BEFORE UPDATE ON ferpa_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_documents_updated_at 
  BEFORE UPDATE ON ferpa_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set due date (45 days from creation per FERPA)
CREATE OR REPLACE FUNCTION set_ferpa_request_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date IS NULL THEN
    NEW.due_date := (NEW.created_at + INTERVAL '45 days')::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ferpa_due_date
  BEFORE INSERT ON ferpa_access_requests
  FOR EACH ROW EXECUTE FUNCTION set_ferpa_request_due_date();

-- =====================================================
-- SEED DATA: Default FERPA Documents
-- =====================================================

INSERT INTO ferpa_documents (title, description, document_type, is_public, required_roles)
VALUES 
  ('FERPA Consent Form', 'Standard consent form for release of education records', 'consent_form', true, '{"student"}'),
  ('Third Party Release Authorization', 'Authorization for releasing records to third parties', 'release_form', true, '{"student"}'),
  ('FERPA Policy', 'Institutional FERPA compliance policy', 'policy', true, '{}'),
  ('Directory Information Opt-Out Form', 'Form to opt out of directory information disclosure', 'consent_form', true, '{"student"}'),
  ('FERPA Staff Training Guide', 'Training materials for staff on FERPA compliance', 'training_material', false, '{"admin", "staff"}')
ON CONFLICT DO NOTHING;
