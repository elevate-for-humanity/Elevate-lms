-- =====================================================
-- MARKETING AUTOMATION CORE
-- Migration: 20241118_marketing_automation.sql
-- =====================================================

-- Marketing Contacts Table
CREATE TABLE IF NOT EXISTS marketing_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100), -- website_form, import, partner, lms_user, etc.
  tags TEXT[] DEFAULT '{}',
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email)
);

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, completed, paused, cancelled
  html_body TEXT NOT NULL,
  text_body TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_segment JSONB, -- { tags: ["wrg", "barber"], programs: [...] }
  stats JSONB DEFAULT '{}'::jsonb, -- { sent: 0, opened: 0, clicked: 0, bounced: 0 }
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Sends Table (tracks individual sends)
CREATE TABLE IF NOT EXISTS marketing_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES marketing_contacts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'queued', -- queued, sent, bounced, opened, clicked, unsubscribed
  send_at TIMESTAMPTZ,
  open_at TIMESTAMPTZ,
  click_at TIMESTAMPTZ,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON marketing_contacts(email);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_unsubscribed ON marketing_contacts(unsubscribed);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_tags ON marketing_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_campaign_id ON marketing_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_contact_id ON marketing_campaign_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_sends_status ON marketing_campaign_sends(status);

-- Enable Row Level Security
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin and marketing staff only)
CREATE POLICY "Admin and marketing staff can view contacts"
  ON marketing_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

CREATE POLICY "Admin and marketing staff can manage contacts"
  ON marketing_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

CREATE POLICY "Admin and marketing staff can view campaigns"
  ON marketing_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

CREATE POLICY "Admin and marketing staff can manage campaigns"
  ON marketing_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

CREATE POLICY "Admin and marketing staff can view sends"
  ON marketing_campaign_sends FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

CREATE POLICY "Admin and marketing staff can manage sends"
  ON marketing_campaign_sends FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

-- Comments
COMMENT ON TABLE marketing_contacts IS 'Marketing contacts and leads for email campaigns';
COMMENT ON TABLE marketing_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE marketing_campaign_sends IS 'Individual email sends tracking opens, clicks, bounces';
