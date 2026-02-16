-- CYCLE 2: ENROLLMENT ORCHESTRATOR TABLES
-- Partner LMS integration, email events, AI policies, staff notifications

-- 1. PARTNER ENROLLMENTS (TRACK LMS ENROLLMENT STATUS)
CREATE TABLE IF NOT EXISTS partner_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL,
  partner_course_id TEXT NOT NULL,
  partner_enrollment_id TEXT,
  learner_email TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed', 'failed', 'canceled')) DEFAULT 'requested',
  request_method TEXT NOT NULL CHECK (request_method IN ('link', 'roster', 'manual', 'attestation')),
  access_link TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_enrollments_enrollment_id ON partner_enrollments(enrollment_id);
CREATE INDEX idx_partner_enrollments_partner_id ON partner_enrollments(partner_id);
CREATE INDEX idx_partner_enrollments_status ON partner_enrollments(status);

ALTER TABLE partner_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all partner enrollments"
  ON partner_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can manage partner enrollments"
  ON partner_enrollments FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 2. PARTNER COMPLETION EVENTS (TRACK COMPLETIONS FROM PARTNER LMS)
CREATE TABLE IF NOT EXISTS partner_completion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_enrollment_id UUID REFERENCES partner_enrollments(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL,
  learner_id UUID NOT NULL REFERENCES profiles(id),
  completion_status TEXT NOT NULL CHECK (completion_status IN ('completed', 'failed', 'incomplete')),
  completion_date DATE NOT NULL,
  grade TEXT,
  certificate_url TEXT,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('api_sync', 'certificate_upload', 'partner_attestation', 'roster_import')),
  raw_data JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_completion_events_enrollment_id ON partner_completion_events(enrollment_id);
CREATE INDEX idx_partner_completion_events_learner_id ON partner_completion_events(learner_id);
CREATE INDEX idx_partner_completion_events_processed ON partner_completion_events(processed);

ALTER TABLE partner_completion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all completion events"
  ON partner_completion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can manage completion events"
  ON partner_completion_events FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 3. EMAIL EVENTS (EVIDENCE LOGGING)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_version TEXT NOT NULL,
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE SET NULL,
  learner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'clicked', 'opened')) DEFAULT 'queued',
  provider_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_events_recipient ON email_events(recipient);
CREATE INDEX idx_email_events_enrollment_id ON email_events(enrollment_id);
CREATE INDEX idx_email_events_learner_id ON email_events(learner_id);
CREATE INDEX idx_email_events_status ON email_events(status);
CREATE INDEX idx_email_events_created_at ON email_events(created_at DESC);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can view own email events"
  ON email_events FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

CREATE POLICY "Staff can view all email events"
  ON email_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can manage email events"
  ON email_events FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 4. AI POLICY PROFILES (GOVERNANCE)
CREATE TABLE IF NOT EXISTS ai_policy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('learner', 'staff', 'partner', 'employer')),
  policy_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  allowed_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  disallowed_actions TEXT[] DEFAULT ARRAY['grading', 'exam_answers', 'credential_issuance']::TEXT[],
  data_access_scope TEXT[] DEFAULT ARRAY[]::TEXT[],
  escalation_rules JSONB DEFAULT '{}'::jsonb,
  max_interactions_per_day INTEGER,
  enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_policy_profiles_program_id ON ai_policy_profiles(program_id);
CREATE INDEX idx_ai_policy_profiles_role ON ai_policy_profiles(role);
CREATE INDEX idx_ai_policy_profiles_is_default ON ai_policy_profiles(is_default);

ALTER TABLE ai_policy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage AI policies"
  ON ai_policy_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 5. LEARNER AI POLICIES (ASSIGNMENT)
CREATE TABLE IF NOT EXISTS learner_ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES ai_policy_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learner_ai_policies_learner_id ON learner_ai_policies(learner_id);
CREATE INDEX idx_learner_ai_policies_enrollment_id ON learner_ai_policies(enrollment_id);
CREATE INDEX idx_learner_ai_policies_policy_id ON learner_ai_policies(policy_id);

ALTER TABLE learner_ai_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can view own AI policies"
  ON learner_ai_policies FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

CREATE POLICY "Staff can manage learner AI policies"
  ON learner_ai_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 6. AI INTERACTIONS (AUDIT LOG)
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES ai_policy_profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  program_id TEXT,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'tutor', 'instructor', 'assistant')),
  user_input TEXT NOT NULL,
  ai_output TEXT NOT NULL,
  data_accessed TEXT[],
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_enrollment_id ON ai_interactions(enrollment_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX idx_ai_interactions_escalated ON ai_interactions(escalated);

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all AI interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can insert AI interactions"
  ON ai_interactions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 7. STAFF NOTIFICATIONS (FAILURE VISIBILITY)
CREATE TABLE IF NOT EXISTS staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_notifications_type ON staff_notifications(type);
CREATE INDEX idx_staff_notifications_severity ON staff_notifications(severity);
CREATE INDEX idx_staff_notifications_read ON staff_notifications(read);
CREATE INDEX idx_staff_notifications_created_at ON staff_notifications(created_at DESC);

ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all notifications"
  ON staff_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can update notifications"
  ON staff_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can insert notifications"
  ON staff_notifications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 8. PROGRAM MILESTONES (TEMPLATE)
CREATE TABLE IF NOT EXISTS program_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL,
  days_from_start INTEGER NOT NULL,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_program_milestones_program_id ON program_milestones(program_id);
CREATE INDEX idx_program_milestones_sequence ON program_milestones(sequence);

ALTER TABLE program_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program milestones"
  ON program_milestones FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Staff can manage program milestones"
  ON program_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 9. LEARNER MILESTONES (TRACKING)
CREATE TABLE IF NOT EXISTS learner_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES program_milestones(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learner_milestones_enrollment_id ON learner_milestones(enrollment_id);
CREATE INDEX idx_learner_milestones_learner_id ON learner_milestones(learner_id);
CREATE INDEX idx_learner_milestones_status ON learner_milestones(status);

ALTER TABLE learner_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can view own milestones"
  ON learner_milestones FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

CREATE POLICY "Staff can view all milestones"
  ON learner_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can manage learner milestones"
  ON learner_milestones FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 10. ADD UPDATED_AT TRIGGERS
CREATE TRIGGER update_partner_enrollments_updated_at
  BEFORE UPDATE ON partner_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_policy_profiles_updated_at
  BEFORE UPDATE ON ai_policy_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE partner_enrollments IS 'Tracks enrollment requests to partner LMS systems';
COMMENT ON TABLE partner_completion_events IS 'Records completion events from partner LMS for verification';
COMMENT ON TABLE email_events IS 'Evidence log of all emails sent - required for compliance';
COMMENT ON TABLE ai_policy_profiles IS 'Governance policies for AI interactions per program and role';
COMMENT ON TABLE ai_interactions IS 'Full audit log of all AI interactions';
COMMENT ON TABLE staff_notifications IS 'Surfaces failures and issues to staff dashboard';
