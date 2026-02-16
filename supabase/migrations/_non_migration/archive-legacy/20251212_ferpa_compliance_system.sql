-- FERPA Compliance System Migration
-- Creates tables for FERPA training, certifications, and compliance tracking

-- FERPA Training Records Table
CREATE TABLE IF NOT EXISTS ferpa_training_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_score DECIMAL(5,2) NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 100),
  quiz_answers JSONB NOT NULL DEFAULT '{}',
  training_signature TEXT NOT NULL,
  confidentiality_signature TEXT NOT NULL,
  training_acknowledged BOOLEAN NOT NULL DEFAULT false,
  confidentiality_acknowledged BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FERPA Student Acknowledgments Table
CREATE TABLE IF NOT EXISTS ferpa_student_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orientation_completed BOOLEAN NOT NULL DEFAULT false,
  orientation_completed_at TIMESTAMPTZ,
  rights_acknowledged BOOLEAN NOT NULL DEFAULT false,
  directory_opt_out BOOLEAN NOT NULL DEFAULT false,
  signature TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

-- FERPA Disclosure Log Table
CREATE TABLE IF NOT EXISTS ferpa_disclosure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disclosed_by UUID NOT NULL REFERENCES auth.users(id),
  disclosed_to TEXT NOT NULL,
  disclosure_type TEXT NOT NULL CHECK (disclosure_type IN ('consent', 'directory', 'school_official', 'transfer', 'financial_aid', 'accreditation', 'legal', 'emergency', 'workforce')),
  purpose TEXT NOT NULL,
  data_disclosed JSONB NOT NULL,
  consent_id UUID,
  legal_basis TEXT,
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FERPA Consent Forms Table
CREATE TABLE IF NOT EXISTS ferpa_consent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('general', 'workforce', 'parent', 'employer', 'third_party')),
  recipient_name TEXT NOT NULL,
  recipient_organization TEXT,
  purpose TEXT NOT NULL,
  data_elements TEXT[] NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FERPA Access Log Table (tracks who accessed student records)
CREATE TABLE IF NOT EXISTS ferpa_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'edit', 'export', 'print', 'delete')),
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  legitimate_interest TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FERPA Violation Reports Table
CREATE TABLE IF NOT EXISTS ferpa_violation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES auth.users(id),
  reported_by_name TEXT,
  reported_by_email TEXT,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('unauthorized_disclosure', 'improper_access', 'security_breach', 'policy_violation', 'other')),
  description TEXT NOT NULL,
  student_affected UUID REFERENCES auth.users(id),
  date_of_violation TIMESTAMPTZ,
  evidence JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  investigated_by UUID REFERENCES auth.users(id),
  investigation_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data Sharing Agreements Table (for workforce partners)
CREATE TABLE IF NOT EXISTS data_sharing_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('workforce', 'employer', 'educational', 'government', 'vendor', 'other')),
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('wioa', 'etpl', 'placement', 'research', 'service', 'other')),
  purpose TEXT NOT NULL,
  data_elements TEXT[] NOT NULL,
  security_requirements TEXT NOT NULL,
  prohibition_on_redisclosure BOOLEAN NOT NULL DEFAULT true,
  data_retention_period TEXT,
  destruction_method TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LMS Security Audit Log Table
CREATE TABLE IF NOT EXISTS lms_security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_change', 'permission_change', 'data_export', 'suspicious_activity')),
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FERPA Compliance Checklist Table
CREATE TABLE IF NOT EXISTS ferpa_compliance_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('accreditation', 'annual_review', 'audit', 'workforce')),
  academic_year TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  completed_items INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL,
  completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_items > 0 THEN (completed_items::DECIMAL / total_items::DECIMAL * 100) ELSE 0 END
  ) STORED,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ferpa_training_user_id ON ferpa_training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ferpa_training_status ON ferpa_training_records(status);
CREATE INDEX IF NOT EXISTS idx_ferpa_training_expires_at ON ferpa_training_records(expires_at);

CREATE INDEX IF NOT EXISTS idx_ferpa_student_ack_student_id ON ferpa_student_acknowledgments(student_id);

CREATE INDEX IF NOT EXISTS idx_ferpa_disclosure_student_id ON ferpa_disclosure_log(student_id);
CREATE INDEX IF NOT EXISTS idx_ferpa_disclosure_disclosed_by ON ferpa_disclosure_log(disclosed_by);
CREATE INDEX IF NOT EXISTS idx_ferpa_disclosure_type ON ferpa_disclosure_log(disclosure_type);
CREATE INDEX IF NOT EXISTS idx_ferpa_disclosure_date ON ferpa_disclosure_log(disclosed_at);

CREATE INDEX IF NOT EXISTS idx_ferpa_consent_student_id ON ferpa_consent_forms(student_id);
CREATE INDEX IF NOT EXISTS idx_ferpa_consent_type ON ferpa_consent_forms(consent_type);
CREATE INDEX IF NOT EXISTS idx_ferpa_consent_revoked ON ferpa_consent_forms(revoked);

CREATE INDEX IF NOT EXISTS idx_ferpa_access_student_id ON ferpa_access_log(student_id);
CREATE INDEX IF NOT EXISTS idx_ferpa_access_accessed_by ON ferpa_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_ferpa_access_date ON ferpa_access_log(accessed_at);

CREATE INDEX IF NOT EXISTS idx_ferpa_violations_status ON ferpa_violation_reports(status);
CREATE INDEX IF NOT EXISTS idx_ferpa_violations_student ON ferpa_violation_reports(student_affected);

CREATE INDEX IF NOT EXISTS idx_data_sharing_partner ON data_sharing_agreements(partner_name);
CREATE INDEX IF NOT EXISTS idx_data_sharing_status ON data_sharing_agreements(status);
CREATE INDEX IF NOT EXISTS idx_data_sharing_expiration ON data_sharing_agreements(expiration_date);

CREATE INDEX IF NOT EXISTS idx_lms_audit_user_id ON lms_security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_audit_event_type ON lms_security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_lms_audit_severity ON lms_security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_lms_audit_created_at ON lms_security_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_ferpa_checklist_type ON ferpa_compliance_checklist(checklist_type);
CREATE INDEX IF NOT EXISTS idx_ferpa_checklist_year ON ferpa_compliance_checklist(academic_year);
CREATE INDEX IF NOT EXISTS idx_ferpa_checklist_status ON ferpa_compliance_checklist(status);

-- Update timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_ferpa_training_records_updated_at 
  BEFORE UPDATE ON ferpa_training_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_student_acknowledgments_updated_at 
  BEFORE UPDATE ON ferpa_student_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_consent_forms_updated_at 
  BEFORE UPDATE ON ferpa_consent_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_violation_reports_updated_at 
  BEFORE UPDATE ON ferpa_violation_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sharing_agreements_updated_at 
  BEFORE UPDATE ON data_sharing_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_compliance_checklist_updated_at 
  BEFORE UPDATE ON ferpa_compliance_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- FERPA Training Records
ALTER TABLE ferpa_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training records"
  ON ferpa_training_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all training records"
  ON ferpa_training_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer', 'hr')
    )
  );

CREATE POLICY "Users can insert their own training records"
  ON ferpa_training_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FERPA Student Acknowledgments
ALTER TABLE ferpa_student_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own acknowledgments"
  ON ferpa_student_acknowledgments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own acknowledgments"
  ON ferpa_student_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own acknowledgments"
  ON ferpa_student_acknowledgments FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all acknowledgments"
  ON ferpa_student_acknowledgments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- FERPA Disclosure Log
ALTER TABLE ferpa_disclosure_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view disclosure log"
  ON ferpa_disclosure_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

CREATE POLICY "Authorized users can insert disclosures"
  ON ferpa_disclosure_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff')
    )
  );

-- FERPA Consent Forms
ALTER TABLE ferpa_consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own consent forms"
  ON ferpa_consent_forms FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own consent forms"
  ON ferpa_consent_forms FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own consent forms"
  ON ferpa_consent_forms FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all consent forms"
  ON ferpa_consent_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- FERPA Access Log
ALTER TABLE ferpa_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access log"
  ON ferpa_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

CREATE POLICY "System can insert access log"
  ON ferpa_access_log FOR INSERT
  WITH CHECK (true);

-- FERPA Violation Reports
ALTER TABLE ferpa_violation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert violation reports"
  ON ferpa_violation_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view violation reports"
  ON ferpa_violation_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

CREATE POLICY "Admins can update violation reports"
  ON ferpa_violation_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- Data Sharing Agreements
ALTER TABLE data_sharing_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage data sharing agreements"
  ON data_sharing_agreements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- LMS Security Audit Log
ALTER TABLE lms_security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert audit log"
  ON lms_security_audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view audit log"
  ON lms_security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- FERPA Compliance Checklist
ALTER TABLE ferpa_compliance_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance checklist"
  ON ferpa_compliance_checklist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'ferpa_officer')
    )
  );

-- Helper function to check if training is current
CREATE OR REPLACE FUNCTION is_ferpa_training_current(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ferpa_training_records
    WHERE user_id = user_id_param
    AND status = 'completed'
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to log FERPA access
CREATE OR REPLACE FUNCTION log_ferpa_access(
  student_id_param UUID,
  accessed_by_param UUID,
  access_type_param TEXT,
  resource_type_param TEXT,
  resource_id_param TEXT,
  legitimate_interest_param TEXT
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO ferpa_access_log (
    student_id,
    accessed_by,
    access_type,
    resource_type,
    resource_id,
    legitimate_interest
  ) VALUES (
    student_id_param,
    accessed_by_param,
    access_type_param,
    resource_type_param,
    resource_id_param,
    legitimate_interest_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE ferpa_training_records IS 'Tracks FERPA training completion and certification for staff';
COMMENT ON TABLE ferpa_student_acknowledgments IS 'Records student acknowledgment of FERPA rights';
COMMENT ON TABLE ferpa_disclosure_log IS 'Audit log of all student record disclosures';
COMMENT ON TABLE ferpa_consent_forms IS 'Student consent forms for data sharing';
COMMENT ON TABLE ferpa_access_log IS 'Tracks all access to student education records';
COMMENT ON TABLE ferpa_violation_reports IS 'Reports of suspected FERPA violations';
COMMENT ON TABLE data_sharing_agreements IS 'Agreements with workforce partners and third parties';
COMMENT ON TABLE lms_security_audit_log IS 'Security audit log for LMS access and events';
COMMENT ON TABLE ferpa_compliance_checklist IS 'Accreditation and compliance checklists';
