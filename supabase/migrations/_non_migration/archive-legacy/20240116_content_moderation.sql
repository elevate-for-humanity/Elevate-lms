-- Create moderation_reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'discussion', 'comment', 'review', 'message', 'profile')),
  content_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'hate_speech', 'violence', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  moderator_notes TEXT
);

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'remove', 'warn')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_rules table
CREATE TABLE IF NOT EXISTS moderation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content_types TEXT[] NOT NULL,
  keywords TEXT[] NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'remove', 'warn')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add moderation_status column to relevant tables
ALTER TABLE courses ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'removed'));
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'removed'));
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'removed'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'removed'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_content ON moderation_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter ON moderation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reviewer ON moderation_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_created ON moderation_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_content ON moderation_actions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON moderation_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_rules_enabled ON moderation_rules(enabled);

-- Enable Row Level Security
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_reports

-- Users can create reports
CREATE POLICY "Users can create moderation reports"
  ON moderation_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON moderation_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON moderation_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON moderation_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for moderation_actions

-- Admins can view all actions
CREATE POLICY "Admins can view moderation actions"
  ON moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create actions
CREATE POLICY "Admins can create moderation actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for moderation_rules

-- Admins can manage rules
CREATE POLICY "Admins can manage moderation rules"
  ON moderation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_moderation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for moderation_rules
CREATE TRIGGER update_moderation_rules_updated_at
  BEFORE UPDATE ON moderation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_moderation_rules_updated_at();

-- Insert default moderation rules
INSERT INTO moderation_rules (name, description, content_types, keywords, action, enabled) VALUES
  ('Spam Detection', 'Detect common spam patterns', ARRAY['discussion', 'comment', 'review', 'message'], ARRAY['buy now', 'click here', 'limited time', 'act now', 'free money'], 'flag', true),
  ('Profanity Filter', 'Flag content with profanity', ARRAY['discussion', 'comment', 'review', 'message'], ARRAY['profanity1', 'profanity2'], 'flag', true),
  ('Harassment Prevention', 'Detect harassment and bullying', ARRAY['discussion', 'comment', 'message'], ARRAY['hate', 'kill', 'die', 'stupid'], 'flag', true)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE moderation_reports IS 'User-submitted reports of problematic content';
COMMENT ON TABLE moderation_actions IS 'Actions taken by moderators on content';
COMMENT ON TABLE moderation_rules IS 'Automated moderation rules and filters';

COMMENT ON COLUMN moderation_reports.content_type IS 'Type of content being reported';
COMMENT ON COLUMN moderation_reports.content_id IS 'ID of the content being reported';
COMMENT ON COLUMN moderation_reports.reason IS 'Reason for the report';
COMMENT ON COLUMN moderation_reports.status IS 'Current status of the report';

COMMENT ON COLUMN moderation_actions.action IS 'Action taken by moderator';
COMMENT ON COLUMN moderation_actions.notes IS 'Moderator notes about the action';

COMMENT ON COLUMN moderation_rules.keywords IS 'Keywords to match for this rule';
COMMENT ON COLUMN moderation_rules.action IS 'Action to take when rule matches';
