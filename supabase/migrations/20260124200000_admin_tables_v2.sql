-- Pre-add columns to existing tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS user_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
    ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS user_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}';
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
  END IF;
END $$;

-- =====================================================
-- ADMIN TABLES: Leads, Campaigns, API Keys, WOTC
-- (Courses table already exists - not recreating)
-- =====================================================

-- Leads table for CRM
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  program_interest TEXT,
  source TEXT DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'appointment_set', 
    'application_started', 'enrolled', 'not_interested', 'unqualified'
  )),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS program_interest TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Campaigns table for marketing
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'sms', 'social', 'event')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  target_audience TEXT,
  content JSONB,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT;
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  scopes TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_by UUID;
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- WOTC Applications table
CREATE TABLE IF NOT EXISTS wotc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_first_name TEXT NOT NULL,
  employee_last_name TEXT NOT NULL,
  employee_ssn_hash TEXT,
  employee_dob DATE,
  employer_name TEXT NOT NULL,
  employer_ein TEXT,
  employer_contact_phone TEXT,
  job_offer_date DATE,
  start_date DATE,
  starting_wage DECIMAL(10,2),
  position TEXT,
  target_groups TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'pending_review', 'approved', 'denied', 'expired'
  )),
  certification_received BOOLEAN DEFAULT false,
  tax_credit_amount DECIMAL(10,2),
  documents JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wotc_applications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_wotc_status ON wotc_applications(status);
CREATE INDEX IF NOT EXISTS idx_wotc_created_at ON wotc_applications(created_at DESC);

-- CRM Contacts table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  contact_type TEXT DEFAULT 'prospect' CHECK (contact_type IN (
    'prospect', 'student', 'alumni', 'employer', 'vendor', 'other'
  )),
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS contact_type TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS address_zip TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tags TEXT[];
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_course_updates BOOLEAN DEFAULT true,
  email_grades BOOLEAN DEFAULT true,
  email_deadlines BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  push_announcements BOOLEAN DEFAULT true,
  sms_urgent BOOLEAN DEFAULT false,
  sms_reminders BOOLEAN DEFAULT false,
  sms_phone TEXT,
  in_app_all BOOLEAN DEFAULT true,
  in_app_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Grant opportunities table
CREATE TABLE IF NOT EXISTS grant_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  funder TEXT NOT NULL,
  amount_min DECIMAL(12,2),
  amount_max DECIMAL(12,2),
  deadline TIMESTAMPTZ,
  eligibility_criteria JSONB,
  focus_areas TEXT[],
  application_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS funder TEXT;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS amount_min DECIMAL(12,2);
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS amount_max DECIMAL(12,2);
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS focus_areas TEXT[];
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS application_url TEXT;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_grants_status ON grant_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_grants_deadline ON grant_opportunities(deadline);

-- Grant applications table
CREATE TABLE IF NOT EXISTS grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn')),
  amount_requested DECIMAL(12,2),
  amount_awarded DECIMAL(12,2),
  proposal_summary TEXT,
  documents JSONB,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_grant_apps_status ON grant_applications(status);
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS grant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_grant_apps_grant_id ON grant_applications(grant_id);

-- RLS Policies
ALTER TABLE grant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE wotc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access to leads" ON leads;
CREATE POLICY "Admin full access to leads" ON leads FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access to campaigns" ON campaigns;
CREATE POLICY "Admin full access to campaigns" ON campaigns FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access to api_keys" ON api_keys;
CREATE POLICY "Admin full access to api_keys" ON api_keys FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access to wotc" ON wotc_applications;
CREATE POLICY "Admin full access to wotc" ON wotc_applications FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access to contacts" ON crm_contacts;
CREATE POLICY "Admin full access to contacts" ON crm_contacts FOR ALL USING (true);

-- Users can manage their own notification preferences
DROP POLICY IF EXISTS "Users manage own notifications" ON notification_preferences;
CREATE POLICY "Users manage own notifications" ON notification_preferences 
  FOR ALL USING (auth.uid() = user_id);

-- Grant policies
DROP POLICY IF EXISTS "Admin full access to grants" ON grant_opportunities;
CREATE POLICY "Admin full access to grants" ON grant_opportunities FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access to grant_apps" ON grant_applications;
CREATE POLICY "Admin full access to grant_apps" ON grant_applications FOR ALL USING (true);

-- Seed data
-- No seed data for leads — real leads come from the application intake system
-- No seed data for crm_contacts — real contacts come from the CRM system

-- Add unique constraints BEFORE seed inserts so ON CONFLICT works
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_name_unique ON campaigns(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grant_opportunities_external_id_unique ON grant_opportunities(external_id);

INSERT INTO campaigns (name, description, goal_amount, start_date, end_date, type, status, is_active) VALUES
  ('Spring 2026 Enrollment Drive', 'Targeted outreach for spring semester healthcare and trades programs', 5000.00, '2026-03-01', '2026-05-31', 'email', 'draft', true),
  ('WIOA Awareness Campaign', 'Educate eligible residents about WIOA-funded training opportunities', 3000.00, '2026-02-15', '2026-04-15', 'social', 'active', true),
  ('Employer Partnership Outreach', 'Connect with local employers for apprenticeship and hiring partnerships', 2500.00, '2026-01-15', '2026-06-30', 'email', 'active', true),
  ('CDL Program Launch', 'Promote new CDL commercial driving program to target demographics', 4000.00, '2026-04-01', '2026-06-30', 'social', 'draft', true),
  ('Alumni Success Stories', 'Share graduate success stories to drive new enrollments', 1500.00, '2026-01-01', '2026-12-31', 'social', 'active', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO grant_opportunities (external_id, title, description, funder, amount_min, amount_max, deadline, focus_areas, status) VALUES
  ('wig-2026', 'Workforce Innovation Grant', 'Funding for innovative workforce development programs', 'US Department of Labor', 50000, 250000, NOW() + INTERVAL '60 days', ARRAY['workforce', 'training', 'innovation'], 'open'),
  ('hti-2026', 'Healthcare Training Initiative', 'Support for healthcare career training programs', 'Indiana State Health Department', 25000, 100000, NOW() + INTERVAL '45 days', ARRAY['healthcare', 'nursing', 'medical'], 'open'),
  ('stem-2026', 'STEM Education Fund', 'Grants for STEM-focused vocational training', 'National Science Foundation', 75000, 500000, NOW() + INTERVAL '90 days', ARRAY['technology', 'engineering', 'science'], 'open'),
  ('cdbg-2026', 'Community Development Block Grant', 'Support for community-based job training', 'HUD', 100000, 750000, NOW() - INTERVAL '10 days', ARRAY['community', 'economic development'], 'closed'),
  ('gjt-2026', 'Green Jobs Training Grant', 'Funding for sustainable energy workforce training', 'EPA', 50000, 200000, NOW() + INTERVAL '120 days', ARRAY['sustainability', 'energy', 'environment'], 'upcoming')
ON CONFLICT (external_id) DO NOTHING;
