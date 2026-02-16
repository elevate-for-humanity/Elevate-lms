-- =====================================================
-- PARTNER PROFILES + MONITORING + REPORTING SYSTEM
-- =====================================================
-- Purpose: Complete partner management with role-based access,
-- student monitoring, alerts, messaging, and reporting
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS message_recipients CASCADE;
DROP TABLE IF EXISTS message_campaigns CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS progress_events CASCADE;
DROP TABLE IF EXISTS login_events CASCADE;
DROP TABLE IF EXISTS attendance_events CASCADE;
DROP TABLE IF EXISTS student_assignments CASCADE;
DROP TABLE IF EXISTS responsibility_acceptance CASCADE;
DROP TABLE IF EXISTS responsibility_items CASCADE;
DROP TABLE IF EXISTS partner_profiles CASCADE;
DROP TABLE IF EXISTS role_packages CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS alert_thresholds CASCADE;

-- =====================================================
-- 1. ROLE PACKAGES (DEFINES EACH PARTNER ROLE)
-- =====================================================
CREATE TABLE role_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  pay_model_type TEXT NOT NULL CHECK (pay_model_type IN ('PERCENTAGE', 'FLAT')),
  default_rate NUMERIC(10, 2) NOT NULL,
  min_rate NUMERIC(10, 2) NOT NULL,
  max_rate NUMERIC(10, 2) NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  can_do JSONB DEFAULT '[]'::jsonb,
  cannot_do JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE role_packages IS 'Defines partner role options with responsibilities and pay models';

-- Insert default role packages
INSERT INTO role_packages (role, title, subtitle, description, pay_model_type, default_rate, min_rate, max_rate, sort_order, responsibilities, can_do, cannot_do, requirements) VALUES
('PROGRAM_HOLDER', 'Program Holder', 'Full Program Oversight', 
'You operate the program delivery at a location under Elevate''s compliance framework (you''re accountable for reporting + outcomes).', 
'PERCENTAGE', 20.00, 18.00, 22.00, 1,
'["Maintain program compliance at site", "Ensure student documentation completion", "Approve/verify progress checkpoints", "Ensure attendance reporting is accurate", "Coordinate with Site Coordinator and Worksite", "Submit monthly outcome updates (completion, placement)"]'::jsonb,
'["View all students in your program", "Bulk message students", "Schedule emails/texts", "Run progress reports", "Approve milestone progress"]'::jsonb,
'["Change pricing/funding rules", "Move students across programs without admin approval", "Issue funding approvals promises"]'::jsonb,
'["U.S. DOL Registered Apprenticeship Program", "Business license", "Liability insurance", "Background check clearance"]'::jsonb),

('WORKSITE_ONLY', 'Worksite Only', 'Hands-On Site / Works Item',
'You only host hands-on hours (no enrollment, no funding decisions).',
'PERCENTAGE', 10.00, 8.00, 12.00, 2,
'["Provide supervised hands-on training only", "Submit weekly hour logs", "Confirm attendance for hands-on sessions", "Report concerns (no-shows, behavior, safety)", "Allow audits/visits as required"]'::jsonb,
'["See assigned students only", "Submit hours + attendance", "Send messages to assigned students", "Receive no-login/no-show alerts"]'::jsonb,
'["Enroll students", "Collect tuition", "Teach theory unless approved", "Alter curriculum"]'::jsonb,
'["Business license", "Liability insurance", "Licensed supervisor on staff", "Background check clearance"]'::jsonb),

('SITE_COORDINATOR', 'Site Coordinator', 'Operations + Reporting',
'You are the daily operator verifying attendance, check-ins, documents, and student support.',
'FLAT', 500.00, 400.00, 750.00, 3,
'["Verify attendance/check-ins weekly", "Track document completion status", "Escalate at-risk students (no-login/no-attendance)", "Coordinate outreach (email/text/calls)", "Maintain monthly compliance checklist"]'::jsonb,
'["See assigned students", "Schedule bulk emails/texts", "Trigger alerts/escalations", "Approve ready for next step checkpoints"]'::jsonb,
'["Change pay rules", "Approve funding", "Override admin decisions"]'::jsonb,
'["Background check clearance", "FERPA confidentiality training", "Reliable internet access", "Available during business hours"]'::jsonb);

-- =====================================================
-- 2. PARTNER PROFILES (USER ROLE ASSIGNMENTS)
-- =====================================================
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  location_id UUID,
  program_id UUID,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

COMMENT ON TABLE partner_profiles IS 'Partner role assignments and status tracking';

CREATE INDEX idx_partner_profiles_user ON partner_profiles(user_id);
CREATE INDEX idx_partner_profiles_role ON partner_profiles(role);
CREATE INDEX idx_partner_profiles_status ON partner_profiles(status);

-- =====================================================
-- 3. RESPONSIBILITY ITEMS (CHECKLIST ITEMS)
-- =====================================================
CREATE TABLE responsibility_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE responsibility_items IS 'Checklist items for each role during onboarding';

CREATE INDEX idx_responsibility_items_role ON responsibility_items(role);

-- =====================================================
-- 4. RESPONSIBILITY ACCEPTANCE (TRACKING)
-- =====================================================
CREATE TABLE responsibility_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  responsibility_item_id UUID NOT NULL REFERENCES responsibility_items(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, responsibility_item_id)
);

COMMENT ON TABLE responsibility_acceptance IS 'Tracks which responsibilities each user has accepted';

CREATE INDEX idx_responsibility_acceptance_user ON responsibility_acceptance(user_id);

-- =====================================================
-- 5. STUDENT ASSIGNMENTS (WHO SEES WHICH STUDENTS)
-- =====================================================
CREATE TABLE student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_role TEXT NOT NULL CHECK (partner_role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  program_id UUID,
  cohort_id UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(student_id, partner_user_id, partner_role)
);

COMMENT ON TABLE student_assignments IS 'Defines which partners can see which students';

CREATE INDEX idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX idx_student_assignments_partner ON student_assignments(partner_user_id);
CREATE INDEX idx_student_assignments_active ON student_assignments(is_active);

-- =====================================================
-- 6. LOGIN EVENTS (STUDENT ENGAGEMENT TRACKING)
-- =====================================================
CREATE TABLE login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  source TEXT CHECK (source IN ('web', 'lms', 'partner', 'mobile')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE login_events IS 'Tracks student login activity for engagement monitoring';

CREATE INDEX idx_login_events_user ON login_events(user_id);
CREATE INDEX idx_login_events_occurred ON login_events(occurred_at DESC);

-- =====================================================
-- 7. ATTENDANCE EVENTS (STUDENT ATTENDANCE TRACKING)
-- =====================================================
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID,
  cohort_id UUID,
  session_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('checkin', 'checkout', 'class', 'hands_on', 'absence')),
  source TEXT NOT NULL CHECK (source IN ('app', 'manual', 'partner', 'coordinator')),
  verified_by_user_id UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  hours NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE attendance_events IS 'Tracks student attendance for compliance and alerts';

CREATE INDEX idx_attendance_events_student ON attendance_events(student_id);
CREATE INDEX idx_attendance_events_date ON attendance_events(session_date DESC);
CREATE INDEX idx_attendance_events_program ON attendance_events(program_id);

-- =====================================================
-- 8. PROGRESS EVENTS (MILESTONE TRACKING)
-- =====================================================
CREATE TABLE progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID,
  milestone_id UUID,
  milestone_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'verified')),
  updated_by_user_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE progress_events IS 'Tracks student progress through program milestones';

CREATE INDEX idx_progress_events_student ON progress_events(student_id);
CREATE INDEX idx_progress_events_program ON progress_events(program_id);
CREATE INDEX idx_progress_events_status ON progress_events(status);

-- =====================================================
-- 9. ALERT THRESHOLDS (CONFIGURABLE RULES)
-- =====================================================
CREATE TABLE alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL UNIQUE CHECK (alert_type IN ('no_login', 'no_attendance', 'missed_milestone', 'document_missing')),
  warn_threshold INTEGER NOT NULL,
  escalate_threshold INTEGER NOT NULL,
  critical_threshold INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE alert_thresholds IS 'Configurable thresholds for automated alerts';

-- Insert default thresholds
INSERT INTO alert_thresholds (alert_type, warn_threshold, escalate_threshold, critical_threshold, description) VALUES
('no_login', 3, 5, 7, 'Days without login: 3=warn, 5=escalate, 7=at-risk'),
('no_attendance', 2, 3, NULL, 'Missed sessions: 2=warn, 3=escalate'),
('missed_milestone', 7, 14, NULL, 'Days past milestone due date'),
('document_missing', 3, 7, 14, 'Days since document request');

-- =====================================================
-- 10. ALERTS (AUTOMATED + MANUAL)
-- =====================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('student', 'program', 'partner', 'global')),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID,
  partner_user_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('no_login', 'no_attendance', 'missed_milestone', 'document_missing', 'behavior', 'custom')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'escalate', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  opened_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  assigned_to_user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE alerts IS 'Automated and manual alerts for student engagement and compliance';

CREATE INDEX idx_alerts_student ON alerts(student_id);
CREATE INDEX idx_alerts_program ON alerts(program_id);
CREATE INDEX idx_alerts_assigned ON alerts(assigned_to_user_id);
CREATE INDEX idx_alerts_resolved ON alerts(resolved_at);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- =====================================================
-- 11. MESSAGE TEMPLATES (REUSABLE MESSAGES)
-- =====================================================
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'both')),
  title TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE message_templates IS 'Reusable message templates for bulk communications';

CREATE INDEX idx_message_templates_owner ON message_templates(owner_user_id);

-- =====================================================
-- 12. MESSAGE CAMPAIGNS (BULK MESSAGING)
-- =====================================================
CREATE TABLE message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id),
  title TEXT NOT NULL,
  audience_scope TEXT NOT NULL CHECK (audience_scope IN ('program', 'cohort', 'assigned_students', 'custom')),
  audience_filter JSONB DEFAULT '{}'::jsonb,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('send_now', 'scheduled', 'recurring')),
  scheduled_for TIMESTAMPTZ,
  recurrence_rule TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE message_campaigns IS 'Bulk messaging campaigns with scheduling';

CREATE INDEX idx_message_campaigns_owner ON message_campaigns(owner_user_id);
CREATE INDEX idx_message_campaigns_status ON message_campaigns(status);
CREATE INDEX idx_message_campaigns_scheduled ON message_campaigns(scheduled_for);

-- =====================================================
-- 13. MESSAGE RECIPIENTS (CAMPAIGN TRACKING)
-- =====================================================
CREATE TABLE message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES message_campaigns(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE message_recipients IS 'Tracks individual message delivery status';

CREATE INDEX idx_message_recipients_campaign ON message_recipients(campaign_id);
CREATE INDEX idx_message_recipients_student ON message_recipients(student_id);
CREATE INDEX idx_message_recipients_status ON message_recipients(status);

-- =====================================================
-- 14. AUDIT LOG (COMPLIANCE TRACKING)
-- =====================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'Audit trail for all partner and admin actions';

CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- =====================================================
-- 15. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE role_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibility_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibility_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 16. RLS POLICIES - ROLE PACKAGES (PUBLIC READ)
-- =====================================================
CREATE POLICY "Anyone can view active role packages"
  ON role_packages FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 17. RLS POLICIES - PARTNER PROFILES (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own partner profile"
  ON partner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own partner profile"
  ON partner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 18. RLS POLICIES - STUDENT ASSIGNMENTS (PARTNER ACCESS)
-- =====================================================
CREATE POLICY "Partners can view their assigned students"
  ON student_assignments FOR SELECT
  USING (auth.uid() = partner_user_id AND is_active = true);

-- =====================================================
-- 19. RLS POLICIES - ALERTS (ASSIGNED ACCESS)
-- =====================================================
CREATE POLICY "Users can view alerts assigned to them"
  ON alerts FOR SELECT
  USING (auth.uid() = assigned_to_user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Partners can create alerts for their students"
  ON alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_assignments
      WHERE student_id = alerts.student_id
        AND partner_user_id = auth.uid()
        AND is_active = true
    )
  );

-- =====================================================
-- 20. RLS POLICIES - MESSAGE TEMPLATES (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own templates or shared templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = owner_user_id OR is_shared = true);

CREATE POLICY "Users can create their own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- =====================================================
-- 21. RLS POLICIES - MESSAGE CAMPAIGNS (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own campaigns"
  ON message_campaigns FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own campaigns"
  ON message_campaigns FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own campaigns"
  ON message_campaigns FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- =====================================================
-- 22. TRIGGERS - UPDATE TIMESTAMPS
-- =====================================================
CREATE TRIGGER update_role_packages_updated_at BEFORE UPDATE ON role_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON partner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_thresholds_updated_at BEFORE UPDATE ON alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_campaigns_updated_at BEFORE UPDATE ON message_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- ✅ Partner role selection and profiles
-- ✅ Student assignment tracking
-- ✅ Login and attendance monitoring
-- ✅ Configurable alert system (3/5/7 days no-login, 2/3 missed attendance)
-- ✅ Messaging system with templates and campaigns
-- ✅ Audit logging
-- ✅ Full RLS security
-- =====================================================
