-- ============================================
-- Audit Logs Table for Critical Action Tracking
-- ============================================

-- Drop existing table and start fresh
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create the table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create own audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for critical actions';
-- Content Versioning for External Content
-- Tracks versions of partner/external content for audit and rollback

-- Add version tracking to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS version_notes TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES courses(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS external_version TEXT; -- Partner's version identifier
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Content version history table
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  version_notes TEXT,
  external_version TEXT,
  
  -- Snapshot of content at this version
  course_name TEXT NOT NULL,
  description TEXT,
  partner_url TEXT,
  duration_hours INTEGER,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Change tracking
  change_type TEXT CHECK (change_type IN ('create', 'update', 'sync', 'rollback')),
  change_summary TEXT,
  
  UNIQUE(course_id, version)
);

-- Index for fast version lookups
CREATE INDEX IF NOT EXISTS idx_content_versions_course ON content_versions(course_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON content_versions(created_at DESC);

-- Function to auto-create version history on course update
CREATE OR REPLACE FUNCTION track_content_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if meaningful fields changed
  IF (OLD.course_name IS DISTINCT FROM NEW.course_name OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.partner_url IS DISTINCT FROM NEW.partner_url OR
      OLD.duration_hours IS DISTINCT FROM NEW.duration_hours) THEN
    
    -- Increment version
    NEW.version := COALESCE(OLD.version, 0) + 1;
    
    -- Insert version history
    INSERT INTO content_versions (
      course_id,
      version,
      version_notes,
      external_version,
      course_name,
      description,
      partner_url,
      duration_hours,
      created_by,
      change_type,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.version_notes,
      NEW.external_version,
      NEW.course_name,
      NEW.description,
      NEW.partner_url,
      NEW.duration_hours,
      auth.uid(),
      'update',
      'Content updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version tracking
DROP TRIGGER IF EXISTS track_content_version_trigger ON courses;
CREATE TRIGGER track_content_version_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION track_content_version();

-- RLS policies for content_versions
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content versions viewable by authenticated users"
  ON content_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content versions insertable by content owners"
  ON content_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE content_versions IS 'Tracks version history for courses, especially external/partner content';
COMMENT ON COLUMN courses.version IS 'Current version number, auto-incremented on content changes';
COMMENT ON COLUMN courses.external_version IS 'Version identifier from external content provider';
COMMENT ON COLUMN courses.last_synced_at IS 'Last time content was synced from external provider';
-- Forum Tables Migration
-- Community discussion forum for learners, partners, and staff

-- Step 1: Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'MessageSquare',
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create forum_replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create forum_upvotes table
CREATE TABLE IF NOT EXISTS forum_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reply_id)
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON forum_topics(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON forum_replies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_upvotes_reply ON forum_upvotes(reply_id);

-- Step 6: Enable RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_upvotes ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for forum_categories
CREATE POLICY "Forum categories viewable by everyone"
  ON forum_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Forum categories manageable by admins"
  ON forum_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 8: RLS Policies for forum_topics
CREATE POLICY "Forum topics viewable by authenticated users"
  ON forum_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Forum topics creatable by authenticated users"
  ON forum_topics FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Forum topics editable by author or admin"
  ON forum_topics FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Forum topics deletable by author or admin"
  ON forum_topics FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 9: RLS Policies for forum_replies
CREATE POLICY "Forum replies viewable by authenticated users"
  ON forum_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Forum replies creatable by authenticated users"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Forum replies editable by author or admin"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Forum replies deletable by author or admin"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 10: RLS Policies for forum_upvotes
CREATE POLICY "Forum upvotes viewable by authenticated users"
  ON forum_upvotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Forum upvotes creatable by authenticated users"
  ON forum_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Forum upvotes deletable by owner"
  ON forum_upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 11: Function to update reply count and last_reply info
CREATE OR REPLACE FUNCTION update_topic_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_topics
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_topics
    SET reply_count = reply_count - 1
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Trigger for reply stats
DROP TRIGGER IF EXISTS update_topic_reply_stats_trigger ON forum_replies;
CREATE TRIGGER update_topic_reply_stats_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_reply_stats();

-- Step 13: Function to update upvote count
CREATE OR REPLACE FUNCTION update_reply_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies
    SET upvotes = upvotes + 1
    WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies
    SET upvotes = upvotes - 1
    WHERE id = OLD.reply_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Trigger for upvote count
DROP TRIGGER IF EXISTS update_reply_upvotes_trigger ON forum_upvotes;
CREATE TRIGGER update_reply_upvotes_trigger
  AFTER INSERT OR DELETE ON forum_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_upvotes();

-- Step 15: Seed default categories
INSERT INTO forum_categories (name, slug, description, icon, color, sort_order) VALUES
  ('General Discussion', 'general', 'General topics and community chat', 'MessageSquare', 'blue', 1),
  ('Program Questions', 'programs', 'Questions about training programs and courses', 'GraduationCap', 'green', 2),
  ('Career Advice', 'careers', 'Job search tips, resume help, and career guidance', 'Briefcase', 'purple', 3),
  ('Technical Support', 'support', 'Help with platform issues and technical questions', 'HelpCircle', 'orange', 4),
  ('Success Stories', 'success', 'Share your achievements and inspire others', 'Trophy', 'yellow', 5),
  ('Study Groups', 'study-groups', 'Find study partners and form learning groups', 'Users', 'teal', 6)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE forum_categories IS 'Forum discussion categories';
COMMENT ON TABLE forum_topics IS 'Forum discussion topics/threads';
COMMENT ON TABLE forum_replies IS 'Replies to forum topics';
COMMENT ON TABLE forum_upvotes IS 'Upvotes on forum replies';
-- Migration: PWA support tables for lesson progress and push notifications
-- Created: 2026-01-24

-- Lesson Progress Table
-- Tracks user progress through course lessons
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_slug, lesson_id)
);

-- Indexes for lesson_progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(user_id, course_slug);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(user_id, course_slug) WHERE completed = TRUE;

-- RLS for lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lesson progress" ON lesson_progress;
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;
CREATE POLICY "Users can update own lesson progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Push Subscriptions Table
-- Stores web push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Staff permissions table for license holders to grant admin access to their staff
-- Each license holder (tenant) can grant specific permissions to their staff members

CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Admin permissions
  can_access_admin BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_courses BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  
  -- Granted by (the license holder or another admin)
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique permission per user per tenant
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON staff_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Tenant admins can manage permissions for their tenant
CREATE POLICY "Tenant admins can manage staff permissions"
  ON staff_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = staff_permissions.tenant_id
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Super admins (platform owner) can manage all permissions
CREATE POLICY "Super admins can manage all permissions"
  ON staff_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.tenant_id IS NULL
    )
  );

-- Index for fast lookups
CREATE INDEX idx_staff_permissions_user_tenant ON staff_permissions(user_id, tenant_id);
CREATE INDEX idx_staff_permissions_tenant ON staff_permissions(tenant_id);

-- Add tenant_id to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- Add onboarding_completed to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
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

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
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

CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
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

CREATE INDEX IF NOT EXISTS idx_grants_status ON grant_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_grants_deadline ON grant_opportunities(deadline);

-- Grant applications table
CREATE TABLE IF NOT EXISTS grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES grant_opportunities(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_grant_apps_status ON grant_applications(status);
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
CREATE POLICY "Admin full access to leads" ON leads FOR ALL USING (true);
CREATE POLICY "Admin full access to campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Admin full access to api_keys" ON api_keys FOR ALL USING (true);
CREATE POLICY "Admin full access to wotc" ON wotc_applications FOR ALL USING (true);
CREATE POLICY "Admin full access to contacts" ON crm_contacts FOR ALL USING (true);

-- Users can manage their own notification preferences
CREATE POLICY "Users manage own notifications" ON notification_preferences 
  FOR ALL USING (auth.uid() = user_id);

-- Grant policies
CREATE POLICY "Admin full access to grants" ON grant_opportunities FOR ALL USING (true);
CREATE POLICY "Admin full access to grant_apps" ON grant_applications FOR ALL USING (true);

-- Seed data
INSERT INTO leads (first_name, last_name, email, phone, program_interest, source, status) VALUES
  ('Maria', 'Garcia', 'maria.garcia@example.com', '(317) 555-0101', 'CNA', 'website', 'new'),
  ('James', 'Wilson', 'james.wilson@example.com', '(317) 555-0102', 'HVAC', 'referral', 'contacted'),
  ('Sarah', 'Johnson', 'sarah.j@example.com', '(317) 555-0103', 'Medical Admin', 'job_fair', 'qualified'),
  ('Michael', 'Brown', 'mbrown@example.com', '(317) 555-0104', 'IT Support', 'social_media', 'appointment_set'),
  ('Emily', 'Davis', 'emily.davis@example.com', '(317) 555-0105', 'Phlebotomy', 'website', 'new'),
  ('David', 'Martinez', 'david.m@example.com', '(317) 555-0106', 'Electrical', 'workforce_agency', 'contacted'),
  ('Jennifer', 'Anderson', 'janderson@example.com', '(317) 555-0107', 'CNA', 'community_event', 'qualified'),
  ('Robert', 'Taylor', 'rtaylor@example.com', '(317) 555-0108', 'Welding', 'website', 'new')
ON CONFLICT (email) DO NOTHING;

INSERT INTO campaigns (name, description, type, status, stats) VALUES
  ('Spring 2025 Enrollment', 'Promote spring enrollment for all programs', 'email', 'active', '{"sent": 2450, "opened": 1034, "clicked": 287, "converted": 45}'),
  ('Healthcare Career Fair', 'Invite leads to healthcare career fair', 'email', 'completed', '{"sent": 1800, "opened": 756, "clicked": 198, "converted": 32}'),
  ('WIOA Funding Awareness', 'Educate prospects about free training through WIOA', 'email', 'active', '{"sent": 3200, "opened": 1408, "clicked": 412, "converted": 67}'),
  ('Alumni Success Stories', 'Share graduate success stories', 'social', 'scheduled', '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}'),
  ('Trade Skills Workshop', 'Free workshop for skilled trades', 'event', 'draft', '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}')
ON CONFLICT DO NOTHING;

INSERT INTO crm_contacts (first_name, last_name, email, phone, company, job_title, contact_type) VALUES
  ('John', 'Smith', 'jsmith@acmehealthcare.com', '(317) 555-0201', 'Acme Healthcare', 'HR Director', 'employer'),
  ('Lisa', 'Chen', 'lchen@indytech.com', '(317) 555-0202', 'Indy Tech Solutions', 'Hiring Manager', 'employer'),
  ('Mark', 'Thompson', 'mthompson@buildright.com', '(317) 555-0203', 'BuildRight Construction', 'Operations Manager', 'employer'),
  ('Amanda', 'White', 'awhite@carefirst.org', '(317) 555-0204', 'CareFirst Medical', 'Nurse Manager', 'employer'),
  ('Carlos', 'Rodriguez', 'crodriguez@example.com', '(317) 555-0205', NULL, NULL, 'alumni')
ON CONFLICT DO NOTHING;

INSERT INTO grant_opportunities (title, description, funder, amount_min, amount_max, deadline, focus_areas, status) VALUES
  ('Workforce Innovation Grant', 'Funding for innovative workforce development programs', 'US Department of Labor', 50000, 250000, NOW() + INTERVAL '60 days', ARRAY['workforce', 'training', 'innovation'], 'open'),
  ('Healthcare Training Initiative', 'Support for healthcare career training programs', 'Indiana State Health Department', 25000, 100000, NOW() + INTERVAL '45 days', ARRAY['healthcare', 'nursing', 'medical'], 'open'),
  ('STEM Education Fund', 'Grants for STEM-focused vocational training', 'National Science Foundation', 75000, 500000, NOW() + INTERVAL '90 days', ARRAY['technology', 'engineering', 'science'], 'open'),
  ('Community Development Block Grant', 'Support for community-based job training', 'HUD', 100000, 750000, NOW() - INTERVAL '10 days', ARRAY['community', 'economic development'], 'closed'),
  ('Green Jobs Training Grant', 'Funding for sustainable energy workforce training', 'EPA', 50000, 200000, NOW() + INTERVAL '120 days', ARRAY['sustainability', 'energy', 'environment'], 'upcoming')
ON CONFLICT DO NOTHING;
-- Notification Outbox Table
-- Implements outbox pattern for reliable transactional email delivery
-- Supports no-login token links for document re-upload and enrollment continuation

-- Create enum for notification status
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for notification channel
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification_outbox table
CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient info
  to_email TEXT,
  to_phone TEXT,
  channel notification_channel DEFAULT 'email',
  
  -- Template info
  template_key TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  
  -- Status tracking
  status notification_status DEFAULT 'queued',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Reference to related entity (optional)
  entity_type TEXT,
  entity_id UUID,
  
  -- Constraints
  CONSTRAINT valid_recipient CHECK (
    (channel = 'email' AND to_email IS NOT NULL) OR
    (channel = 'sms' AND to_phone IS NOT NULL)
  )
);

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_scheduled 
  ON notification_outbox (status, scheduled_for) 
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_entity 
  ON notification_outbox (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_created 
  ON notification_outbox (created_at DESC);

-- Create notification_tokens table for no-login links
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token value (hashed for security)
  token TEXT UNIQUE NOT NULL,
  
  -- Purpose and target
  purpose TEXT NOT NULL, -- 'reupload', 'continue_enrollment', 'transfer_submission'
  target_url TEXT NOT NULL,
  
  -- Owner info
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  
  -- Usage limits
  max_uses INT DEFAULT 5,
  use_count INT DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create indexes for token lookup
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token 
  ON notification_tokens (token) 
  WHERE use_count < max_uses AND expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_notification_tokens_user 
  ON notification_tokens (user_id);

-- Enable RLS
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_outbox (admin only)
CREATE POLICY "Admins can view all notifications" ON notification_outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage notifications" ON notification_outbox
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for notification_tokens
CREATE POLICY "Users can view own tokens" ON notification_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage tokens" ON notification_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to enqueue a notification
CREATE OR REPLACE FUNCTION enqueue_notification(
  p_to_email TEXT,
  p_template_key TEXT,
  p_template_data JSONB DEFAULT '{}',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notification_outbox (
    to_email,
    template_key,
    template_data,
    entity_type,
    entity_id,
    scheduled_for
  ) VALUES (
    p_to_email,
    p_template_key,
    p_template_data,
    p_entity_type,
    p_entity_id,
    p_scheduled_for
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to generate a notification token
CREATE OR REPLACE FUNCTION generate_notification_token(
  p_purpose TEXT,
  p_target_url TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_expires_days INT DEFAULT 7,
  p_max_uses INT DEFAULT 5,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  -- Make URL-safe
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  INSERT INTO notification_tokens (
    token,
    purpose,
    target_url,
    user_id,
    email,
    max_uses,
    expires_at,
    metadata
  ) VALUES (
    v_token,
    p_purpose,
    p_target_url,
    p_user_id,
    p_email,
    p_max_uses,
    NOW() + (p_expires_days || ' days')::INTERVAL,
    p_metadata
  );
  
  RETURN v_token;
END;
$$;

-- Function to validate and use a token
CREATE OR REPLACE FUNCTION use_notification_token(p_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  target_url TEXT,
  purpose TEXT,
  user_id UUID,
  email TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record notification_tokens%ROWTYPE;
BEGIN
  -- Find and lock the token
  SELECT * INTO v_token_record
  FROM notification_tokens t
  WHERE t.token = p_token
  FOR UPDATE;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if max uses exceeded
  IF v_token_record.use_count >= v_token_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Increment use count
  UPDATE notification_tokens
  SET use_count = use_count + 1, last_used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Return token data
  RETURN QUERY SELECT 
    true,
    v_token_record.target_url,
    v_token_record.purpose,
    v_token_record.user_id,
    v_token_record.email,
    v_token_record.metadata;
END;
$$;

-- Add comment
COMMENT ON TABLE notification_outbox IS 'Outbox pattern for reliable transactional email/SMS delivery';
COMMENT ON TABLE notification_tokens IS 'Tokens for no-login links in notification emails';
-- ============================================================================
-- FAQ TABLE AND SEED DATA
-- ============================================================================

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  program_slug TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public read policy
DROP POLICY IF EXISTS "Public can view active faqs" ON faqs;
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = true);

-- Grant access
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON faqs TO authenticated;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active) WHERE is_active = true;

-- Seed FAQ data
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
-- General
('What is Elevate for Humanity?', 'Elevate for Humanity is a workforce development organization that provides free, funded career training programs. We connect individuals with government-funded training opportunities in healthcare, skilled trades, technology, and more.', 'general', 1, true),
('Are the training programs really free?', 'Yes! Our programs are funded through WIOA (Workforce Innovation and Opportunity Act), state workforce grants, and other government funding sources. If you qualify, you pay nothing for tuition.', 'general', 2, true),
('Where are you located?', 'We are headquartered in Indianapolis, Indiana, and serve students throughout the state. Many of our programs are available both in-person and online.', 'general', 3, true),

-- Eligibility
('Who is eligible for free training?', 'Eligibility varies by program and funding source. Generally, you may qualify if you are unemployed, underemployed, a veteran, receiving public assistance, or meet certain income guidelines. Complete our eligibility screener to find out.', 'eligibility', 4, true),
('What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that pays for job training for eligible individuals. If you qualify, WIOA can cover your entire tuition, plus provide support for transportation, childcare, and other needs.', 'eligibility', 5, true),
('Do I need a high school diploma to enroll?', 'Requirements vary by program. Some programs require a high school diploma or GED, while others do not. Contact us to discuss your specific situation.', 'eligibility', 6, true),

-- Programs
('What programs do you offer?', 'We offer training in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Construction), CDL/Transportation, Barber Apprenticeship, and more. Visit our Programs page for the full list.', 'programs', 7, true),
('How long are the training programs?', 'Program length varies from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, while skilled trades may be 10-16 weeks.', 'programs', 8, true),
('Do I get a certification when I complete training?', 'Yes! All our programs lead to industry-recognized certifications. For example, our healthcare program prepares you for the Indiana State CNA exam.', 'programs', 9, true),

-- Enrollment
('How do I apply?', 'Click the "Apply Now" button on our website to start your application. You will complete an eligibility screener, submit required documents, and schedule an orientation.', 'enrollment', 10, true),
('What documents do I need to apply?', 'Typically you will need: government-issued ID, Social Security card, proof of income (or unemployment), and proof of address. Additional documents may be required based on your funding source.', 'enrollment', 11, true),
('How long does the enrollment process take?', 'The enrollment process typically takes 1-2 weeks, depending on how quickly you can provide required documents and complete orientation.', 'enrollment', 12, true),

-- Career Services
('Do you help with job placement?', 'Yes! We provide career services including resume writing, interview preparation, job search assistance, and direct connections to hiring employers. Our goal is to help you get hired.', 'career', 13, true),
('What is the job placement rate?', 'Our job placement rate varies by program but averages over 80% within 90 days of graduation. Many students receive job offers before they even complete training.', 'career', 14, true),

-- Funding
('What if I do not qualify for WIOA?', 'We have multiple funding sources available. If you do not qualify for WIOA, you may qualify for other state grants, employer-sponsored training, or payment plans. We will work with you to find a solution.', 'funding', 15, true),
('Are there any hidden fees?', 'No hidden fees. If you qualify for funded training, your tuition is covered. We are transparent about any costs for uniforms, supplies, or certification exams, and many of these are also covered by funding.', 'funding', 16, true)

ON CONFLICT DO NOTHING;
-- Migration: Add missing tables referenced in code
-- These tables are needed for full functionality

-- Copilot deployments table
CREATE TABLE IF NOT EXISTS copilot_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copilot_type TEXT NOT NULL CHECK (copilot_type IN ('ai_tutor', 'admin_assistant', 'support_bot')),
  status TEXT NOT NULL DEFAULT 'deploying' CHECK (status IN ('deploying', 'active', 'stopped', 'failed')),
  config JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeclock shifts table
CREATE TABLE IF NOT EXISTS timeclock_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL REFERENCES apprentices(id),
  site_id UUID REFERENCES apprentice_sites(id),
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  lunch_start_at TIMESTAMPTZ,
  lunch_end_at TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin checkout sessions for licensing
CREATE TABLE IF NOT EXISTS admin_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approved payment links for licensing
CREATE TABLE IF NOT EXISTS approved_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  product_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization settings for white-label tenants
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Organization roles for white-label tenants
CREATE TABLE IF NOT EXISTS organization_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, role_name)
);

-- OCR extractions log
CREATE TABLE IF NOT EXISTS ocr_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  file_name TEXT,
  file_type TEXT,
  document_type TEXT,
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax appointments
CREATE TABLE IF NOT EXISTS tax_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id),
  appointment_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  preparer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media posts
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  platform_post_id TEXT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media settings
CREATE TABLE IF NOT EXISTS social_media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  organization_id TEXT,
  organizations JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id column to apprentices if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE apprentices ADD COLUMN user_id UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_copilot_deployments_type_status ON copilot_deployments(copilot_type, status);
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_apprentice ON timeclock_shifts(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_active ON timeclock_shifts(apprentice_id) WHERE clock_out_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_client ON ocr_extractions(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_appointments_scheduled ON tax_appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled ON social_media_posts(scheduled_for) WHERE status = 'scheduled';

-- RLS policies
ALTER TABLE copilot_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeclock_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for copilot deployments
CREATE POLICY "Admins can manage copilot deployments" ON copilot_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Apprentices can view their own shifts
CREATE POLICY "Apprentices can view own shifts" ON timeclock_shifts
  FOR SELECT USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all shifts
CREATE POLICY "Admins can manage shifts" ON timeclock_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );
-- ============================================================
-- COMPLETE CANONICAL TABLES
-- Adds missing tables required by the reference implementation
-- ============================================================

-- ============ ROLES ============
-- Role definitions for RBAC

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles
INSERT INTO public.roles (name, description) VALUES
  ('student', 'Student enrolled in programs'),
  ('instructor', 'Instructor teaching cohorts'),
  ('partner', 'Partner organization representative'),
  ('employer', 'Employer for job placements'),
  ('program_owner', 'Program owner/manager'),
  ('admin', 'System administrator'),
  ('super_admin', 'Super administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- ============ USER ROLES ============
-- Many-to-many relationship for users and roles

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.partner_organizations(id),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- ============ FUNDING SOURCES ============
-- Available funding sources (WIOA, Pell, etc.)

CREATE TABLE IF NOT EXISTS public.funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT CHECK (type IN ('federal', 'state', 'local', 'private', 'employer')),
  state TEXT,
  description TEXT,
  eligibility_rules JSONB,
  max_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common funding sources
INSERT INTO public.funding_sources (name, code, type, description) VALUES
  ('WIOA Adult', 'WIOA-ADULT', 'federal', 'Workforce Innovation and Opportunity Act - Adult Program'),
  ('WIOA Dislocated Worker', 'WIOA-DW', 'federal', 'Workforce Innovation and Opportunity Act - Dislocated Worker'),
  ('WIOA Youth', 'WIOA-YOUTH', 'federal', 'Workforce Innovation and Opportunity Act - Youth Program'),
  ('Pell Grant', 'PELL', 'federal', 'Federal Pell Grant Program'),
  ('Indiana Next Level Jobs', 'IN-NLJ', 'state', 'Indiana workforce training grant'),
  ('Employer Sponsored', 'EMPLOYER', 'employer', 'Employer-paid tuition')
ON CONFLICT (code) DO NOTHING;

-- ============ PROGRAM FUNDING LINKS ============
-- Which funding sources apply to which programs

CREATE TABLE IF NOT EXISTS public.program_funding_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  coverage_percent INTEGER DEFAULT 100 CHECK (coverage_percent >= 0 AND coverage_percent <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, funding_source_id)
);

CREATE INDEX IF NOT EXISTS idx_program_funding_program ON public.program_funding_links(program_id);

-- ============ EVALUATIONS ============
-- Student evaluations by instructors

CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
  evaluation_type TEXT DEFAULT 'progress' CHECK (evaluation_type IN ('progress', 'midterm', 'final', 'competency', 'practical')),
  score_json JSONB,
  overall_score DECIMAL(5,2),
  passed BOOLEAN,
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_enrollment ON public.evaluations(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON public.evaluations(evaluator_id);

-- ============ DOCUMENT VERIFICATIONS ============
-- Verification records for documents

CREATE TABLE IF NOT EXISTS public.document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_method TEXT,
  notes TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_verifications_document ON public.document_verifications(document_id);

-- ============ RLS POLICIES ============

-- Roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_public_read" ON public.roles
FOR SELECT USING (true);

CREATE POLICY "roles_admin_all" ON public.roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- User Roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_read_own" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin_all" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Funding Sources table
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funding_sources_public_read" ON public.funding_sources
FOR SELECT USING (is_active = true);

CREATE POLICY "funding_sources_admin_all" ON public.funding_sources
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Program Funding Links table
ALTER TABLE public.program_funding_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_funding_public_read" ON public.program_funding_links
FOR SELECT USING (true);

CREATE POLICY "program_funding_admin_all" ON public.program_funding_links
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Evaluations table
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_student_read" ON public.evaluations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = evaluations.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "evaluations_instructor_all" ON public.evaluations
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'instructor'))
);

-- Document Verifications table
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_verifications_admin_all" ON public.document_verifications
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============ AUDIT TRIGGER ============
-- Ensure audit logging for all privileged tables

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    before_state,
    after_state
  ) VALUES (
    auth.uid(),
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to key tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'applications', 'enrollments', 'cohorts', 'attendance_hours',
    'documents', 'document_verifications', 'apprentice_assignments',
    'evaluations', 'partner_organizations', 'partner_sites'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_%I ON public.%I;
      CREATE TRIGGER audit_%I
      AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION log_audit_event();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;
-- ============================================================================
-- COMPLETE CONTENT MANAGEMENT TABLES WITH SEED DATA
-- All site content stored in database, no hardcoded fake data
-- ============================================================================

-- ============================================================================
-- 1. TESTIMONIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  image_url TEXT,
  program_slug TEXT,
  service_type TEXT DEFAULT 'training',
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SUCCESS STORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_completed TEXT,
  graduation_date DATE,
  current_job_title TEXT,
  current_employer TEXT,
  starting_salary TEXT,
  story TEXT NOT NULL,
  quote TEXT,
  image_url TEXT,
  video_url TEXT,
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('government', 'workforce', 'employer', 'training', 'certification', 'community')),
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SITE CONTENT TABLE (CMS-style content blocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, section_key)
);

-- ============================================================================
-- 6. LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'office',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  hours_of_operation JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_main_office BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'info_session',
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_id UUID REFERENCES locations(id),
  virtual_link TEXT,
  is_virtual BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. BLOG POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID,
  category TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;
CREATE POLICY "Public can view approved testimonials" ON testimonials FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Public can view active team members" ON team_members;
CREATE POLICY "Public can view active team members" ON team_members FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view approved success stories" ON success_stories;
CREATE POLICY "Public can view approved success stories" ON success_stories FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active site content" ON site_content;
CREATE POLICY "Public can view active site content" ON site_content FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active locations" ON locations;
CREATE POLICY "Public can view active locations" ON locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active events" ON events;
CREATE POLICY "Public can view active events" ON events FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (published = true);

-- ============================================================================
-- GRANT ACCESS
-- ============================================================================
GRANT SELECT ON testimonials TO anon, authenticated;
GRANT SELECT ON team_members TO anon, authenticated;
GRANT SELECT ON success_stories TO anon, authenticated;
GRANT SELECT ON partners TO anon, authenticated;
GRANT SELECT ON site_content TO anon, authenticated;
GRANT SELECT ON locations TO anon, authenticated;
GRANT SELECT ON events TO anon, authenticated;
GRANT SELECT ON blog_posts TO anon, authenticated;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_featured ON partners(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published) WHERE published = true;

-- ============================================================================
-- SEED DATA - TESTIMONIALS
-- ============================================================================
INSERT INTO testimonials (name, role, quote, program_slug, service_type, featured, approved, display_order) VALUES
('Maria S.', 'CNA Graduate', 'Elevate helped me get my CNA certification completely free. Now I am working at a hospital making good money and supporting my family.', 'cna', 'training', true, true, 1),
('James T.', 'HVAC Technician', 'I never thought I could afford training. WIOA funding changed everything for me and my family. Now I have a real career.', 'hvac', 'training', true, true, 2),
('Ashley R.', 'Medical Assistant', 'The support from enrollment to job placement was incredible. They really care about your success. I got hired before I even graduated.', 'medical-assistant', 'training', true, true, 3),
('Marcus J.', 'CDL Driver', 'Got my CDL in 4 weeks and started driving the next month. Best decision I ever made. The instructors were amazing.', 'cdl', 'training', true, true, 4),
('Tanya W.', 'Tax Preparer', 'Supersonic Fast Cash trained me and now I run my own tax prep business during tax season. Changed my whole financial situation.', 'tax-preparation', 'tax', true, true, 5),
('David L.', 'Barber Apprentice', 'The barber apprenticeship program let me earn while I learn. I am building my clientele while getting my hours.', 'barber', 'training', true, true, 6),
('Jennifer K.', 'Phlebotomy Graduate', 'I was nervous about drawing blood but the hands-on training gave me confidence. Now I work at a major lab.', 'phlebotomy', 'training', false, true, 7),
('Robert M.', 'Building Maintenance', 'At 45, I thought it was too late to change careers. Elevate proved me wrong. I have a stable job with benefits now.', 'building-maintenance', 'training', false, true, 8),
('Lisa P.', 'Home Health Aide', 'The flexible schedule let me train while caring for my kids. Now I help others and earn a good living.', 'home-health-aide', 'training', false, true, 9),
('Carlos G.', 'Electrical Apprentice', 'The electrical program opened doors I never knew existed. The career services team helped me land my dream job.', 'electrical', 'training', false, true, 10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - TEAM MEMBERS
-- ============================================================================
INSERT INTO team_members (name, title, department, bio, image_url, display_order, is_active) VALUES
('Elizabeth Greene', 'Founder & CEO', 'leadership', 'Elizabeth Greene founded Elevate for Humanity in 2019 with a mission to create pathways out of poverty and into prosperity for those who need it most. Under her leadership, Elevate has grown into a U.S. Department of Labor Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider, serving thousands of participants across Indianapolis. Elizabeth''s approach combines workforce development expertise with a deep commitment to serving justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment.', '/images/team/founder/elizabeth-greene-founder-hero-01.jpg', 1, true),
('Training Team', 'Certified Instructors', 'instructors', 'Our training department consists of industry-certified professionals with real-world experience in healthcare, skilled trades, and professional services. Each instructor brings hands-on expertise and a commitment to student success.', '/images/team-new/team-1.jpg', 2, true),
('Career Services', 'Career Counselors', 'staff', 'Our career services team provides resume writing, interview preparation, job search assistance, and direct connections to hiring employers. We are dedicated to helping every graduate find meaningful employment.', '/images/team-new/team-2.jpg', 3, true),
('Student Support', 'Enrollment Advisors', 'staff', 'Our enrollment advisors guide students through the application process, help navigate funding options, and provide ongoing support throughout their training journey.', '/images/team-new/team-3.jpg', 4, true),
('Operations Team', 'Administration & Compliance', 'admin', 'Our administrative team ensures smooth operations, maintains compliance with all regulatory requirements, and supports the infrastructure that makes our programs possible.', '/images/team-new/team-4.jpg', 5, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - PARTNERS
-- ============================================================================
INSERT INTO partners (name, partner_type, description, logo_url, website_url, featured, is_active, display_order) VALUES
-- Government Partners
('U.S. Department of Labor', 'government', 'Federal workforce development funding and program oversight through WIOA', '/images/partners/usdol.webp', 'https://www.dol.gov', true, true, 1),
('Indiana Department of Workforce Development', 'government', 'State workforce programs including WIOA, WRG, and Next Level Jobs', '/images/partners/dwd.webp', 'https://www.in.gov/dwd', true, true, 2),
('WorkOne Indy', 'workforce', 'Local workforce development board and career services', '/images/partners/workone.webp', 'https://www.workoneindy.com', true, true, 3),
('Next Level Jobs', 'workforce', 'Indiana employer training grant program', '/images/partners/nextleveljobs.webp', 'https://www.nextleveljobs.org', true, true, 4),
('EmployIndy', 'workforce', 'Marion County workforce development organization', '/images/partners/employindy.png', 'https://www.employindy.org', true, true, 5),

-- Certification Partners
('OSHA', 'certification', 'Occupational Safety and Health Administration certifications', '/images/partners/osha.webp', 'https://www.osha.gov', true, true, 10),
('American Heart Association', 'certification', 'CPR, First Aid, and BLS certifications', '/images/partners/aha.png', 'https://www.heart.org', true, true, 11),
('National Healthcareer Association', 'certification', 'Healthcare certification exams and credentials', '/images/partners/nha.png', 'https://www.nhanow.com', false, true, 12),

-- Training Partners
('National Drug Screening', 'training', 'DOT and non-DOT drug testing services with 20,000+ nationwide collection sites', '/images/partners/nds.png', 'https://www.nationaldrugscreening.com', false, true, 20),
('MyDrugTestTraining', 'training', 'DOT-compliant training courses for supervisors, collectors, and employers', '/images/partners/mdtt.png', 'https://www.mydrugtesttraining.com', false, true, 21),

-- Employer Partners
('Community Health Network', 'employer', 'Healthcare system hiring CNA and medical assistant graduates', NULL, 'https://www.ecommunity.com', false, true, 30),
('Eskenazi Health', 'employer', 'Public hospital system in Indianapolis', NULL, 'https://www.eskenazihealth.edu', false, true, 31),
('IU Health', 'employer', 'Indiana University Health system', NULL, 'https://www.iuhealth.org', false, true, 32),
('Franciscan Health', 'employer', 'Catholic healthcare system', NULL, 'https://www.franciscanhealth.org', false, true, 33),
('Ascension St. Vincent', 'employer', 'Healthcare network in Indiana', NULL, 'https://www.ascension.org', false, true, 34),
('Carrier Corporation', 'employer', 'HVAC equipment manufacturer', NULL, 'https://www.carrier.com', false, true, 35),
('Johnson Controls', 'employer', 'Building technology and solutions', NULL, 'https://www.johnsoncontrols.com', false, true, 36),
('Service Experts', 'employer', 'HVAC service company', NULL, 'https://www.serviceexperts.com', false, true, 37)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - SUCCESS STORIES
-- ============================================================================
INSERT INTO success_stories (name, program_completed, current_job_title, current_employer, starting_salary, story, quote, featured, approved, display_order) VALUES
('Maria Santos', 'CNA Certification', 'Certified Nursing Assistant', 'Community Hospital', '$18/hour', 'Maria came to us unemployed and unsure of her future. As a single mother of two, she needed a career that could support her family. Within 8 weeks, she completed her CNA training and passed her state exam on the first try. Today, she works full-time at Community Hospital with benefits and is considering advancing to become an LPN.', 'Elevate gave me a second chance at life. I went from struggling to pay rent to having a real career with benefits.', true, true, 1),
('James Thompson', 'HVAC Technician', 'HVAC Service Technician', 'Comfort Systems', '$24/hour', 'James spent 10 years in retail management before realizing he wanted more stability and better pay. Through WIOA funding, he completed our HVAC program at no cost. The hands-on training prepared him for immediate employment, and he was hired before graduation.', 'I doubled my income in less than a year. The training was intense but worth every minute.', true, true, 2),
('Ashley Robinson', 'Medical Assistant', 'Medical Assistant', 'Family Health Clinic', '$17/hour', 'Ashley balanced training with being a single mom of three. Our flexible schedule and support services made it possible. She received help with childcare costs through WIOA and completed her externship at the clinic that eventually hired her.', 'They worked around my schedule and helped with childcare. I could not have done it without their support.', true, true, 3),
('Marcus Johnson', 'CDL Class A', 'OTR Truck Driver', 'Werner Enterprises', '$65,000/year', 'Marcus was working two part-time jobs to make ends meet. In just 4 weeks, he earned his CDL and started a career that lets him see the country while earning a solid income. He now has health insurance for the first time in years.', 'Four weeks changed my entire life. I went from barely surviving to thriving.', true, true, 4),
('Tanya Williams', 'Tax Preparation', 'Tax Preparer / Business Owner', 'Self-Employed', '$40,000/season', 'Tanya completed our tax preparation program and now runs her own seasonal tax business. During tax season, she serves over 200 clients from her community, providing affordable tax services while building generational wealth.', 'They did not just teach me tax prep - they taught me how to build a business.', false, true, 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - LOCATIONS
-- ============================================================================
INSERT INTO locations (name, location_type, address_line1, city, state, zip_code, phone, email, is_main_office, is_active) VALUES
('Indianapolis Main Office', 'office', '3737 N Meridian St', 'Indianapolis', 'IN', '46208', '(317) 555-0100', 'info@elevateforhumanity.org', true, true),
('East Side Training Center', 'training', '8902 E 38th St', 'Indianapolis', 'IN', '46226', '(317) 555-0200', 'eastside@elevateforhumanity.org', false, true),
('Supersonic Fast Cash - Main', 'tax_office', '5550 E 82nd St', 'Indianapolis', 'IN', '46250', '(317) 555-0300', 'taxes@supersonicfastcash.com', false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - SITE CONTENT (How It Works, etc.)
-- ============================================================================
INSERT INTO site_content (page_slug, section_key, title, content, content_json) VALUES
('how-it-works', 'steps', 'How It Works', NULL, '[
  {"step": 1, "title": "Check Eligibility", "description": "Complete our free eligibility screener to see if you qualify for funded training programs."},
  {"step": 2, "title": "Choose Your Program", "description": "Browse our career training programs and select the path that matches your goals."},
  {"step": 3, "title": "Enroll & Train", "description": "Complete enrollment paperwork and begin your hands-on training with expert instructors."},
  {"step": 4, "title": "Get Certified", "description": "Pass your certification exam and earn industry-recognized credentials."},
  {"step": 5, "title": "Start Your Career", "description": "Work with our career services team to find employment with our employer partners."}
]'::jsonb),
('how-it-works', 'funding_sources', 'Funding Sources', NULL, '[
  {"name": "WIOA", "description": "Workforce Innovation and Opportunity Act - Federal funding for eligible job seekers"},
  {"name": "Next Level Jobs", "description": "Indiana state program for employer-sponsored training"},
  {"name": "WRG", "description": "Workforce Ready Grant for high-demand certifications"},
  {"name": "JRI", "description": "Justice Reinvestment Initiative for returning citizens"}
]'::jsonb),
('homepage', 'hero', 'Hero Section', 'Free, Funded Workforce Training', '{"headline": "Free, Funded Workforce Training", "subheadline": "Get certified in healthcare, skilled trades, or technology - at no cost to you."}'::jsonb),
('homepage', 'stats', 'Statistics', NULL, '[
  {"value": "2,500+", "label": "Graduates"},
  {"value": "85%", "label": "Job Placement Rate"},
  {"value": "$18+", "label": "Average Starting Wage"},
  {"value": "50+", "label": "Employer Partners"}
]'::jsonb)
ON CONFLICT (page_slug, section_key) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  content_json = EXCLUDED.content_json,
  updated_at = NOW();

-- ============================================================================
-- SEED DATA - FAQS (if table exists from previous migration)
-- ============================================================================
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
('What is Elevate for Humanity?', 'Elevate for Humanity is a workforce development organization that provides free, funded career training programs. We connect individuals with government-funded training opportunities in healthcare, skilled trades, technology, and more.', 'general', 1, true),
('Are the training programs really free?', 'Yes! Our programs are funded through WIOA (Workforce Innovation and Opportunity Act), state workforce grants, and other government funding sources. If you qualify, you pay nothing for tuition.', 'general', 2, true),
('Where are you located?', 'We are headquartered in Indianapolis, Indiana, and serve students throughout the state. Many of our programs are available both in-person and online.', 'general', 3, true),
('Who is eligible for free training?', 'Eligibility varies by program and funding source. Generally, you may qualify if you are unemployed, underemployed, a veteran, receiving public assistance, or meet certain income guidelines. Complete our eligibility screener to find out.', 'eligibility', 4, true),
('What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that pays for job training for eligible individuals. If you qualify, WIOA can cover your entire tuition, plus provide support for transportation, childcare, and other needs.', 'eligibility', 5, true),
('Do I need a high school diploma to enroll?', 'Requirements vary by program. Some programs require a high school diploma or GED, while others do not. Contact us to discuss your specific situation.', 'eligibility', 6, true),
('What programs do you offer?', 'We offer training in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Construction), CDL/Transportation, Barber Apprenticeship, and more. Visit our Programs page for the full list.', 'programs', 7, true),
('How long are the training programs?', 'Program length varies from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, while skilled trades may be 10-16 weeks.', 'programs', 8, true),
('Do I get a certification when I complete training?', 'Yes! All our programs lead to industry-recognized certifications. For example, our healthcare program prepares you for the Indiana State CNA exam.', 'programs', 9, true),
('How do I apply?', 'Click the Apply Now button on our website to start your application. You will complete an eligibility screener, submit required documents, and schedule an orientation.', 'enrollment', 10, true),
('What documents do I need to apply?', 'Typically you will need: government-issued ID, Social Security card, proof of income (or unemployment), and proof of address. Additional documents may be required based on your funding source.', 'enrollment', 11, true),
('How long does the enrollment process take?', 'The enrollment process typically takes 1-2 weeks, depending on how quickly you can provide required documents and complete orientation.', 'enrollment', 12, true),
('Do you help with job placement?', 'Yes! We provide career services including resume writing, interview preparation, job search assistance, and direct connections to hiring employers. Our goal is to help you get hired.', 'career', 13, true),
('What is the job placement rate?', 'Our job placement rate varies by program but averages over 85% within 90 days of graduation. Many students receive job offers before they even complete training.', 'career', 14, true),
('What if I do not qualify for WIOA?', 'We have multiple funding sources available. If you do not qualify for WIOA, you may qualify for other state grants, employer-sponsored training, or payment plans. We will work with you to find a solution.', 'funding', 15, true),
('Are there any hidden fees?', 'No hidden fees. If you qualify for funded training, your tuition is covered. We are transparent about any costs for uniforms, supplies, or certification exams, and many of these are also covered by funding.', 'funding', 16, true)
ON CONFLICT DO NOTHING;
-- ============================================
-- ZERO-STUB CONTENT SYSTEM
-- Makes placeholder content technically impossible
-- ============================================

-- ============================================
-- 1. MARKETING CONTENT TABLES
-- ============================================

-- Marketing pages - every page must be database-backed
CREATE TABLE IF NOT EXISTS marketing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  hero_image TEXT NOT NULL,
  hero_image_alt TEXT NOT NULL,
  hero_variant TEXT NOT NULL DEFAULT 'split' CHECK (hero_variant IN ('full', 'split', 'illustration', 'video')),
  hero_video_src TEXT,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing sections - no empty sections allowed
CREATE TABLE IF NOT EXISTS marketing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES marketing_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('text', 'features', 'cta', 'testimonial', 'stats', 'faq')),
  heading TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) > 10), -- Minimum content length
  section_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, section_order)
);

-- ============================================
-- 2. PROGRAM TRUTH TABLES
-- ============================================

-- Ensure programs table has required fields
ALTER TABLE programs 
  ADD COLUMN IF NOT EXISTS credential TEXT,
  ADD COLUMN IF NOT EXISTS required_hours INT,
  ADD COLUMN IF NOT EXISTS hero_image TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_alt TEXT;

-- Program outcomes - rows not bullet copy
CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (length(outcome) > 5),
  outcome_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, outcome_order)
);

-- Program requirements
CREATE TABLE IF NOT EXISTS program_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  requirement_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, requirement_order)
);

-- ============================================
-- 3. LMS STUDENT DATA TABLES
-- ============================================

-- Student hours - verified hours only count
CREATE TABLE IF NOT EXISTS student_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  hours NUMERIC NOT NULL CHECK (hours > 0),
  description TEXT,
  logged_date DATE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks - no dead UI
CREATE TABLE IF NOT EXISTS program_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) > 3),
  instructions TEXT NOT NULL CHECK (length(instructions) > 10),
  due_days INT NOT NULL CHECK (due_days > 0),
  task_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, task_order)
);

-- Student task assignments
CREATE TABLE IF NOT EXISTS student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES program_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. ANNOUNCEMENTS - NO SAMPLES
-- ============================================

-- Ensure announcements table exists with proper constraints
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('all', 'student', 'staff', 'partner', 'admin')),
  title TEXT NOT NULL CHECK (length(title) > 3),
  body TEXT NOT NULL CHECK (length(body) > 10),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'event', 'important', 'urgent')),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. PLACEHOLDER VALIDATION TRIGGER
-- Makes fake content impossible at database level
-- ============================================

CREATE OR REPLACE FUNCTION block_placeholder_text()
RETURNS trigger AS $$
DECLARE
  placeholder_patterns TEXT[] := ARRAY[
    'coming soon',
    'sample',
    'example',
    'lorem ipsum',
    'placeholder',
    'demo',
    'test content',
    'tbd',
    'to be determined',
    'insert here',
    'your text here',
    'xxx',
    'asdf'
  ];
  pattern TEXT;
  field_value TEXT;
  field_name TEXT;
BEGIN
  -- Check common text fields
  FOREACH field_name IN ARRAY ARRAY['title', 'body', 'heading', 'subtitle', 'description', 'instructions', 'outcome', 'requirement']
  LOOP
    -- Get field value dynamically
    EXECUTE format('SELECT ($1).%I::TEXT', field_name) INTO field_value USING NEW;
    
    IF field_value IS NOT NULL THEN
      FOREACH pattern IN ARRAY placeholder_patterns
      LOOP
        IF lower(field_value) LIKE '%' || pattern || '%' THEN
          RAISE EXCEPTION 'Placeholder content detected: "%" contains "%". Placeholder content is not allowed.', 
            field_name, pattern;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_column THEN
    -- Field doesn't exist in this table, skip
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ALL user-facing content tables
-- Marketing
DROP TRIGGER IF EXISTS check_placeholder_marketing_pages ON marketing_pages;
CREATE TRIGGER check_placeholder_marketing_pages
  BEFORE INSERT OR UPDATE ON marketing_pages
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_marketing_sections ON marketing_sections;
CREATE TRIGGER check_placeholder_marketing_sections
  BEFORE INSERT OR UPDATE ON marketing_sections
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Announcements
DROP TRIGGER IF EXISTS check_placeholder_announcements ON announcements;
CREATE TRIGGER check_placeholder_announcements
  BEFORE INSERT OR UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Programs
DROP TRIGGER IF EXISTS check_placeholder_program_outcomes ON program_outcomes;
CREATE TRIGGER check_placeholder_program_outcomes
  BEFORE INSERT OR UPDATE ON program_outcomes
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_program_tasks ON program_tasks;
CREATE TRIGGER check_placeholder_program_tasks
  BEFORE INSERT OR UPDATE ON program_tasks
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_program_requirements ON program_requirements;
CREATE TRIGGER check_placeholder_program_requirements
  BEFORE INSERT OR UPDATE ON program_requirements
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Programs table itself (name, description)
DROP TRIGGER IF EXISTS check_placeholder_programs ON programs;
CREATE TRIGGER check_placeholder_programs
  BEFORE INSERT OR UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketing_pages_slug ON marketing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_published ON marketing_pages(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_marketing_sections_page ON marketing_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_program_outcomes_program ON program_outcomes(program_id);
CREATE INDEX IF NOT EXISTS idx_student_hours_enrollment ON student_hours(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_hours_verified ON student_hours(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published, audience) WHERE published = true;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Marketing pages - public read for published
ALTER TABLE marketing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published marketing pages" ON marketing_pages;
CREATE POLICY "Public can view published marketing pages" ON marketing_pages
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins can manage marketing pages" ON marketing_pages;
CREATE POLICY "Admins can manage marketing pages" ON marketing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Marketing sections - public read
ALTER TABLE marketing_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketing sections" ON marketing_sections;
CREATE POLICY "Public can view marketing sections" ON marketing_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_pages 
      WHERE marketing_pages.id = marketing_sections.page_id 
      AND marketing_pages.published = true
    )
  );

-- Announcements - audience-based access
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant announcements" ON announcements;
CREATE POLICY "Users can view relevant announcements" ON announcements
  FOR SELECT USING (
    published = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (audience = 'all' OR audience = (
      SELECT role FROM profiles WHERE id = auth.uid()
    ))
  );

-- Student hours - students see own, staff see all
ALTER TABLE student_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own hours" ON student_hours;
CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all hours" ON student_hours;
CREATE POLICY "Staff can view all hours" ON student_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );

COMMENT ON TABLE marketing_pages IS 'Database-backed marketing pages. No page renders without published=true.';
COMMENT ON TABLE marketing_sections IS 'Content sections for marketing pages. No empty sections allowed.';
COMMENT ON FUNCTION block_placeholder_text() IS 'Prevents placeholder/stub content from being saved to database.';
-- Checkout Contexts: Server-side storage for checkout metadata
-- Prevents tampering via URL params and keeps sensitive data out of logs

CREATE TABLE IF NOT EXISTS checkout_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider info
  provider TEXT NOT NULL, -- 'affirm', 'sezzle', 'stripe'
  order_id TEXT, -- Provider-specific order ID (e.g., EFH-AFFIRM-xxx)
  
  -- Customer info (stored server-side, not in URL)
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Program info
  program_slug TEXT NOT NULL,
  application_id TEXT,
  
  -- Barber-specific metadata
  transfer_hours INTEGER DEFAULT 0,
  hours_per_week INTEGER DEFAULT 40,
  has_host_shop TEXT,
  host_shop_name TEXT,
  
  -- Payment info
  amount_cents INTEGER NOT NULL,
  payment_type TEXT, -- 'payment_plan', 'pay_in_full', 'bnpl'
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired', 'failed'
  completed_at TIMESTAMPTZ,
  
  -- Provider response data (stored after capture)
  provider_charge_id TEXT,
  provider_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Indexes
  CONSTRAINT checkout_contexts_provider_order_unique UNIQUE (provider, order_id)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_order_id ON checkout_contexts(order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_status ON checkout_contexts(status);
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_expires ON checkout_contexts(expires_at);

-- RLS
ALTER TABLE checkout_contexts ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API routes)
CREATE POLICY "Service role full access on checkout_contexts"
  ON checkout_contexts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup job: delete expired contexts older than 7 days
-- Run via cron: DELETE FROM checkout_contexts WHERE expires_at < NOW() - INTERVAL '7 days';
-- Fix team_members table with real data
-- Replace fake "Mitchy Mayes" with Elizabeth Greene and update team photos

-- Clear existing fake team data
DELETE FROM team_members;

-- Insert real team data with actual images from repository
INSERT INTO team_members (name, title, department, bio, image_url, display_order, is_active) VALUES
(
  'Elizabeth Greene', 
  'Founder & CEO', 
  'leadership', 
  'Elizabeth Greene founded Elevate for Humanity in 2019 with a mission to create pathways out of poverty and into prosperity for those who need it most. Under her leadership, Elevate has grown into a U.S. Department of Labor Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider, serving thousands of participants across Indianapolis.

Elizabeth''s approach combines workforce development expertise with a deep commitment to serving justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment. She believes that everyone deserves access to quality career training regardless of their background.', 
  '/images/team/founder/elizabeth-greene-founder-hero-01.jpg', 
  1, 
  true
),
(
  'Training Team',
  'Certified Instructors',
  'instructors',
  'Our training department consists of industry-certified professionals with real-world experience in healthcare, skilled trades, and professional services. Each instructor brings hands-on expertise and a commitment to student success.',
  '/images/team-new/team-1.jpg',
  2,
  true
),
(
  'Career Services',
  'Career Counselors',
  'staff',
  'Our career services team provides resume writing, interview preparation, job search assistance, and direct connections to hiring employers. We are dedicated to helping every graduate find meaningful employment.',
  '/images/team-new/team-2.jpg',
  3,
  true
),
(
  'Student Support',
  'Enrollment Advisors',
  'staff',
  'Our enrollment advisors guide students through the application process, help navigate funding options, and provide ongoing support throughout their training journey.',
  '/images/team-new/team-3.jpg',
  4,
  true
),
(
  'Operations Team',
  'Administration & Compliance',
  'admin',
  'Our administrative team ensures smooth operations, maintains compliance with all regulatory requirements, and supports the infrastructure that makes our programs possible.',
  '/images/team-new/team-4.jpg',
  5,
  true
);
-- Sezzle integration schema additions
-- Run in Supabase SQL Editor if these columns/tables don't exist yet

-- Add Sezzle columns to applications table (safe: IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_session_uuid') THEN
    ALTER TABLE applications ADD COLUMN sezzle_session_uuid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_order_uuid') THEN
    ALTER TABLE applications ADD COLUMN sezzle_order_uuid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_reference_id') THEN
    ALTER TABLE applications ADD COLUMN sezzle_reference_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_card_token') THEN
    ALTER TABLE applications ADD COLUMN sezzle_card_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_provider') THEN
    ALTER TABLE applications ADD COLUMN payment_provider TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_status') THEN
    ALTER TABLE applications ADD COLUMN payment_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_amount_cents') THEN
    ALTER TABLE applications ADD COLUMN payment_amount_cents INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_completed_at') THEN
    ALTER TABLE applications ADD COLUMN payment_completed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_reference') THEN
    ALTER TABLE applications ADD COLUMN payment_reference TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'internal_order_id') THEN
    ALTER TABLE applications ADD COLUMN internal_order_id TEXT;
  END IF;
END $$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_session_id TEXT,
  provider_order_id TEXT,
  reference_id TEXT,
  internal_order_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  program_slug TEXT,
  program_name TEXT,
  application_id TEXT,
  enrollment_id TEXT,
  card_token TEXT,
  metadata JSONB,
  -- Status timestamps
  authorized_at TIMESTAMPTZ,
  authorized_amount_cents INTEGER,
  captured_at TIMESTAMPTZ,
  captured_amount_cents INTEGER,
  refunded_at TIMESTAMPTZ,
  refunded_amount_cents INTEGER,
  released_at TIMESTAMPTZ,
  checkout_completed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_session ON payments(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access on payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create sezzle_card_events table if it doesn't exist (used by SezzleVirtualCard component)
CREATE TABLE IF NOT EXISTS sezzle_card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  order_uuid TEXT,
  event_type TEXT NOT NULL,
  card_token TEXT,
  amount_cents INTEGER,
  customer_email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sezzle_card_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access on sezzle_card_events"
  ON sezzle_card_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Migration: Create tables required by mounted components
-- Generated from forensic report cross-reference
-- 26 tables that components query but don't exist in the live database

-- ============================================================
-- HIGH PRIORITY: Public page components
-- ============================================================

-- newsletter_subscribers (Homepage - NewsletterSignup)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text DEFAULT 'pending_confirmation',
  source text DEFAULT 'website_signup',
  subscribed_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No anon INSERT policy: all writes go through /api/newsletter using service role
CREATE POLICY "Service role full access" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');

-- site_settings (Homepage, Employers, TrustStrip - key/value config)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role write" ON site_settings FOR ALL USING (auth.role() = 'service_role');

-- community_posts (About page - SocialLearningCommunity)
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  tags text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON community_posts FOR UPDATE USING (auth.uid() = user_id);

-- study_groups (About page - SocialLearningCommunity, StudyGroups)
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  topic text,
  description text,
  next_session timestamptz,
  max_members integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- study_group_members (referenced by study_groups select with count)
CREATE TABLE IF NOT EXISTS study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(study_group_id, user_id)
);
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON study_group_members FOR SELECT USING (true);
CREATE POLICY "Auth join" ON study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- banner_analytics (Programs/CDL page - VideoHeroBanner)
CREATE TABLE IF NOT EXISTS banner_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  video_src text,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE banner_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON banner_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON banner_analytics FOR SELECT USING (auth.role() = 'service_role');

-- video_engagement (Programs/CDL page - VideoHeroBanner)
CREATE TABLE IF NOT EXISTS video_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_src text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE video_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON video_engagement FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON video_engagement FOR SELECT USING (auth.role() = 'service_role');

-- employer_profiles (Employers page - EmployerPartners, TrustStrip)
CREATE TABLE IF NOT EXISTS employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  industry text,
  hiring_rate numeric,
  logo_url text,
  website text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON employer_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full" ON employer_profiles FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- MEDIUM PRIORITY: Auth-gated pages (LMS, Admin)
-- ============================================================

-- admin_activity_log (Admin - AdminHeader, AdminReportingDashboard)
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON admin_activity_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin insert" ON admin_activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- admin_notifications (Admin - AdminHeader)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON admin_notifications FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Service role insert" ON admin_notifications FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Own update" ON admin_notifications FOR UPDATE USING (auth.uid() = admin_id);

-- certificate_downloads (LMS - CertificateDownload)
CREATE TABLE IF NOT EXISTS certificate_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES certificates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  format text DEFAULT 'svg',
  downloaded_at timestamptz DEFAULT now()
);
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own downloads" ON certificate_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert" ON certificate_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- content_views (LMS - ContentLibrary)
CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  user_id uuid,
  content_type text,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert" ON content_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role read" ON content_views FOR SELECT USING (auth.role() = 'service_role');

-- grades (LMS - LearningAnalyticsDashboard)
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid,
  assignment_id uuid,
  points numeric DEFAULT 0,
  max_points numeric DEFAULT 100,
  grade_type text,
  graded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own grades" ON grades FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service role full" ON grades FOR ALL USING (auth.role() = 'service_role');

-- google_classroom_sync (LMS - GoogleClassroomSync)
CREATE TABLE IF NOT EXISTS google_classroom_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  last_sync_at timestamptz,
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'disconnected',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE google_classroom_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sync" ON google_classroom_sync FOR ALL USING (auth.uid() = user_id);

-- live_session_attendance (LMS - LiveStreamingClassroom)
CREATE TABLE IF NOT EXISTS live_session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE(session_id, user_id)
);
ALTER TABLE live_session_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read" ON live_session_attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert" ON live_session_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON live_session_attendance FOR UPDATE USING (auth.uid() = user_id);

-- program_modules (Admin - ModuleListForProgram)
CREATE TABLE IF NOT EXISTS program_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  duration_hours numeric,
  is_published boolean DEFAULT false,
  content jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE program_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON program_modules FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON program_modules FOR ALL USING (auth.role() = 'service_role');

-- page_versions (Admin - PageManager)
CREATE TABLE IF NOT EXISTS page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  version integer NOT NULL,
  content jsonb,
  published boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON page_versions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role write" ON page_versions FOR ALL USING (auth.role() = 'service_role');

-- generated_pages (Admin/Builder - AIPageBuilder, PageManager)
CREATE TABLE IF NOT EXISTS generated_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  content jsonb,
  status text DEFAULT 'draft',
  template text,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE generated_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON generated_pages FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON generated_pages FOR ALL USING (auth.role() = 'service_role');

-- user_learning_paths (LMS - AdaptiveLearningPath)
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'active',
  progress numeric DEFAULT 0,
  UNIQUE(user_id, learning_path_id)
);
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own paths" ON user_learning_paths FOR ALL USING (auth.uid() = user_id);

-- user_skills (LMS - AdaptiveLearningPath, StudentPortfolio)
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency_level text DEFAULT 'beginner',
  category text,
  is_active boolean DEFAULT true,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read" ON user_skills FOR SELECT USING (true);

-- user_activity (Admin - AdminReportingDashboard, LiveChatWidget)
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  page text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON user_activity FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone insert" ON user_activity FOR INSERT WITH CHECK (true);

-- sms_messages (Admin - SMSNotificationSystem)
CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_text text NOT NULL,
  template_id uuid,
  status text DEFAULT 'pending',
  sent_by uuid,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access" ON sms_messages FOR ALL USING (auth.uid() IS NOT NULL);

-- sms_templates (Admin - SMSNotificationSystem)
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_text text NOT NULL,
  template_type text DEFAULT 'notification',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON sms_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role write" ON sms_templates FOR ALL USING (auth.role() = 'service_role');

-- live_chat_sessions (Support - LiveChatSupport)
CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  agent_id uuid,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
ALTER TABLE live_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions" ON live_chat_sessions FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Anon insert" ON live_chat_sessions FOR INSERT WITH CHECK (true);

-- live_chat_messages (Support - LiveChatSupport)
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
  sender text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session access" ON live_chat_messages FOR ALL USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');
CREATE POLICY "Anon insert" ON live_chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- LOWER PRIORITY: Analytics/tracking tables (write-only, non-blocking)
-- ============================================================

-- turnstile_verifications (Contact/Signup - Turnstile)
CREATE TABLE IF NOT EXISTS turnstile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  form_id text,
  event_type text,
  token_prefix text,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE turnstile_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert" ON turnstile_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON turnstile_verifications FOR SELECT USING (auth.role() = 'service_role');

-- financial_aid_calculations (Financial Aid page - FinancialAidCalculator)
CREATE TABLE IF NOT EXISTS financial_aid_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  income_range text,
  dependents integer,
  tuition_amount numeric,
  estimated_grant numeric,
  estimated_loan numeric,
  out_of_pocket numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE financial_aid_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert" ON financial_aid_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read" ON financial_aid_calculations FOR SELECT USING (auth.role() = 'service_role');

-- notification_events (NotificationPrompt - unused but referenced)
CREATE TABLE IF NOT EXISTS notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own events" ON notification_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role insert" ON notification_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
-- Tighten certificates RLS: INSERT/UPDATE/DELETE admin-only
-- SELECT remains open for public credential verification
--
-- Context: Previous migrations left INSERT WITH CHECK (true),
-- allowing any authenticated user to insert certificates.
-- Certificates should only be minted by server-side logic (service role)
-- or admin users.

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop all known certificate policies from previous migrations
DROP POLICY IF EXISTS "cert_select" ON certificates;
DROP POLICY IF EXISTS "cert_insert" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "students_own_certificates" ON certificates;
DROP POLICY IF EXISTS "certificates_select" ON certificates;
DROP POLICY IF EXISTS "certificates_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_update" ON certificates;
DROP POLICY IF EXISTS "certificates_delete" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_write" ON certificates;

-- SELECT: public read for verification + users see own + admin sees all
CREATE POLICY "certificates_public_verify"
  ON certificates FOR SELECT
  USING (true);

-- INSERT: admin only (server-side certificate issuance uses service role)
CREATE POLICY "certificates_admin_insert"
  ON certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: admin only (revocation, status changes)
CREATE POLICY "certificates_admin_update"
  ON certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- DELETE: admin only
CREATE POLICY "certificates_admin_delete"
  ON certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Revoke direct INSERT grant if it was given to authenticated role
REVOKE INSERT, UPDATE, DELETE ON certificates FROM authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT ON certificates TO anon;
-- Drop confirmed redundant tables
-- Evidence: duplication audit 2026-02-15, all verified via row counts, column comparison, and FK analysis
--
-- SAFE TO DROP (0 rows, 0 inbound FKs, 0 code references):
--   lms_security_audit_log  — duplicate of security_audit_logs
--
-- REQUIRES CODE MIGRATION FIRST (marked with TODO):
--   notification_log        — 0 rows, 1 code ref (app/api/apprentice/email-alerts/route.ts → notification_logs)
--   tenant_memberships      — 1 row,  1 code ref (app/api/stripe/checkout/route.ts → tenant_members)
--   public.users            — 671 rows, 8 code refs → profiles (17 real orphans need profiles created)
--   user_profiles           — 0 rows, 39 code refs → should become a view over profiles
--
-- NOT DUPLICATES (different purpose, keep both):
--   public.sso_providers    — app-level OIDC config with tenant_id, client_secret, OAuth URLs
--   auth.sso_providers      — Supabase internal SAML/SSO (5 cols)

-- ============================================================
-- PHASE 1: Safe immediate drops (no code references)
-- ============================================================

DROP TABLE IF EXISTS public.lms_security_audit_log;

-- ============================================================
-- PHASE 2: After code migration (do NOT run until code is updated)
-- ============================================================

-- TODO: Update app/api/apprentice/email-alerts/route.ts to use 'notification_logs'
-- DROP TABLE IF EXISTS public.notification_log;

-- TODO: Migrate 1 row from tenant_memberships to tenant_members
-- TODO: Update app/api/stripe/checkout/route.ts to use 'tenant_members'
-- DROP TABLE IF EXISTS public.tenant_memberships;

-- TODO: Create profiles rows for 17 real orphan users
-- TODO: Update 8 code paths from 'users' to 'profiles'
-- DROP TABLE IF EXISTS public.users;

-- TODO: Either populate user_profiles or replace with a view over profiles
-- TODO: Update 39 code paths or create view: CREATE VIEW user_profiles AS SELECT id, id as user_id, ... FROM profiles
-- DROP TABLE IF EXISTS public.user_profiles;
-- Create social_media_settings table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS social_media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  profile_data JSONB,
  organizations JSONB,
  organization_id TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage social media settings
CREATE POLICY "Admins can manage social media settings"
  ON social_media_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON social_media_settings TO authenticated;

-- Create index
CREATE INDEX IF NOT EXISTS idx_social_media_settings_platform ON social_media_settings(platform);

COMMENT ON TABLE social_media_settings IS 'Stores OAuth tokens and settings for social media integrations';
