-- Complete CRM System Tables
-- Pipeline stages, deals, notes, timeline, bulk actions

-- ============================================================================
-- LEAD PIPELINE STAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES license_leads(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
  notes text,
  moved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lead_pipeline_stages_lead ON lead_pipeline_stages(lead_id);
CREATE INDEX idx_lead_pipeline_stages_stage ON lead_pipeline_stages(stage);

-- ============================================================================
-- DEALS (Sales Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_id uuid REFERENCES profiles(id),
  lead_id uuid REFERENCES license_leads(id),
  amount numeric(10,2) NOT NULL,
  stage text NOT NULL CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability integer DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date,
  actual_close_date date,
  owner_id uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);

-- ============================================================================
-- CONTACT NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'task')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_created_by ON contact_notes(created_by);

-- ============================================================================
-- CONTACT TIMELINE (Unified Activity Feed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('email_sent', 'email_opened', 'email_clicked', 'note_added', 'task_created', 'task_completed', 'meeting_scheduled', 'deal_created', 'deal_updated', 'stage_changed')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contact_timeline_contact ON contact_timeline(contact_id);
CREATE INDEX idx_contact_timeline_type ON contact_timeline(activity_type);
CREATE INDEX idx_contact_timeline_created_at ON contact_timeline(created_at DESC);

-- ============================================================================
-- BULK CAMPAIGN ACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_campaign_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('send_email', 'create_task', 'update_stage', 'assign_to')),
  target_count integer NOT NULL,
  completed_count integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_bulk_actions_campaign ON bulk_campaign_actions(campaign_id);
CREATE INDEX idx_bulk_actions_status ON bulk_campaign_actions(status);

-- ============================================================================
-- CAMPAIGN TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  category text NOT NULL CHECK (category IN ('student_reminder', 'program_update', 'class_announcement', 'hiring_invitation', 'follow_up', 'general')),
  variables jsonb DEFAULT '[]', -- List of variables like {{student_name}}, {{course_name}}
  created_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_campaign_templates_category ON campaign_templates(category);
CREATE INDEX idx_campaign_templates_active ON campaign_templates(is_active);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Lead pipeline stages
ALTER TABLE lead_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_pipeline ON lead_pipeline_stages
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

-- Deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_deals ON deals
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

CREATE POLICY owner_view_deals ON deals
FOR SELECT USING (owner_id = auth.uid());

-- Contact notes
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_notes ON contact_notes
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

CREATE POLICY staff_manage_notes ON contact_notes
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'program_holder', 'instructor'))
);

-- Contact timeline
ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_view_timeline ON contact_timeline
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

CREATE POLICY staff_view_timeline ON contact_timeline
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'program_holder', 'instructor'))
);

-- Bulk actions
ALTER TABLE bulk_campaign_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_bulk_actions ON bulk_campaign_actions
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

CREATE POLICY staff_view_bulk_actions ON bulk_campaign_actions
FOR SELECT USING (created_by = auth.uid());

-- Campaign templates
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY all_view_templates ON campaign_templates
FOR SELECT USING (is_active = true);

CREATE POLICY admin_manage_templates ON campaign_templates
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update deals updated_at
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION update_deals_updated_at();

-- Auto-create timeline entry when note is added
CREATE OR REPLACE FUNCTION create_timeline_from_note()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contact_timeline (contact_id, activity_type, description, created_by)
  VALUES (NEW.contact_id, 'note_added', 'Note added: ' || LEFT(NEW.note, 100), NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER note_creates_timeline
AFTER INSERT ON contact_notes
FOR EACH ROW
EXECUTE FUNCTION create_timeline_from_note();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE lead_pipeline_stages IS 'Track lead progression through sales pipeline';
COMMENT ON TABLE deals IS 'Sales deal tracking with revenue forecasting';
COMMENT ON TABLE contact_notes IS 'Notes attached to contacts for relationship management';
COMMENT ON TABLE contact_timeline IS 'Unified activity timeline for each contact';
COMMENT ON TABLE bulk_campaign_actions IS 'Track bulk actions performed on campaigns';
COMMENT ON TABLE campaign_templates IS 'Reusable email campaign templates with variables';
