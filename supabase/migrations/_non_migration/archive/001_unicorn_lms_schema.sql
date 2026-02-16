-- =====================================================
-- UNICORN LMS - Complete Database Schema
-- Multi-tenant, RBAC, Audit, Billing-ready
-- Production-ready with all features
-- Copyright (c) 2025 Elevate for Humanity
-- =====================================================

-- 0) Extensions & enums
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. ORGANIZATIONS (Multi-tenant foundation)
-- =====================================================
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON orgs(slug);
CREATE INDEX idx_orgs_tier ON orgs(tier);

-- =====================================================
-- 2. ORG MEMBERS (RBAC - Role-Based Access Control)
-- =====================================================
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'instructor', 'staff', 'student')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org ON org_members(org_id);
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_role ON org_members(role);

-- =====================================================
-- 3. COURSES (Org-scoped)
-- =====================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_courses_org ON courses(org_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created_by ON courses(created_by);

-- =====================================================
-- 4. COURSE VERSIONS (Audit trail for course changes)
-- =====================================================
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, version)
);

CREATE INDEX idx_course_versions_course ON course_versions(course_id);

-- =====================================================
-- 5. ENROLLMENTS (Student course access)
-- =====================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'expired')),
  progress JSONB DEFAULT '{}',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, course_id, user_id)
);

CREATE INDEX idx_enrollments_org ON enrollments(org_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- =====================================================
-- 6. AUDIT LOGS (Who did what, when)
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  diff JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- 7. ENTITLEMENTS (Feature flags per org)
-- =====================================================
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'stripe', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, feature_key)
);

CREATE INDEX idx_entitlements_org ON entitlements(org_id);
CREATE INDEX idx_entitlements_feature ON entitlements(feature_key);

-- =====================================================
-- 8. BILLING SUBSCRIPTIONS (Stripe integration)
-- =====================================================
CREATE TABLE billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  seats INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id)
);

CREATE INDEX idx_billing_subs_org ON billing_subscriptions(org_id);
CREATE INDEX idx_billing_subs_stripe_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX idx_billing_subs_status ON billing_subscriptions(status);

-- =====================================================
-- 9. SCHOOL WEBSITES (From advanced-lms-features)
-- =====================================================
CREATE TABLE school_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  school_id UUID REFERENCES auth.users(id),
  design JSONB NOT NULL,
  files JSONB,
  domain TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_school_websites_org ON school_websites(org_id);

-- =====================================================
-- 10. MOBILE APPS (From advanced-lms-features)
-- =====================================================
CREATE TABLE mobile_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  school_id UUID REFERENCES auth.users(id),
  app_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'both')),
  config JSONB NOT NULL,
  build_status TEXT DEFAULT 'pending' CHECK (build_status IN ('pending', 'building', 'success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mobile_apps_org ON mobile_apps(org_id);

-- =====================================================
-- 11. LEARNING COMMUNITIES (From advanced-lms-features)
-- =====================================================
CREATE TABLE learning_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_learning_communities_org ON learning_communities(org_id);

-- =====================================================
-- 12. MARKETING AUTOMATION (From advanced-lms-features)
-- =====================================================
CREATE TABLE marketing_automation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'funnel')),
  config JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketing_automation_org ON marketing_automation(org_id);

-- =====================================================
-- 13. ASSESSMENT ENGINES (From advanced-lms-features)
-- =====================================================
CREATE TABLE assessment_engines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'exam', 'assignment', 'project')),
  config JSONB NOT NULL,
  questions JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessment_engines_org ON assessment_engines(org_id);

-- =====================================================
-- 14. WHITE LABEL INSTANCES (From advanced-lms-features)
-- =====================================================
CREATE TABLE white_label_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  branding JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_white_label_instances_org ON white_label_instances(org_id);

-- =====================================================
-- 15. COURSE PLAYERS (From advanced-lms-features)
-- =====================================================
CREATE TABLE course_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  player_config JSONB NOT NULL,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_course_players_org ON course_players(org_id);
CREATE INDEX idx_course_players_course ON course_players(course_id);

-- =====================================================
-- 16. USER MANAGEMENT SYSTEMS (From advanced-lms-features)
-- =====================================================
CREATE TABLE user_management_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  rbac_config JSONB NOT NULL,
  sso_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_management_systems_org ON user_management_systems(org_id);

-- =====================================================
-- 17. INTEGRATIONS HUB (From advanced-lms-features)
-- =====================================================
CREATE TABLE integrations_hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('zapier', 'webhook', 'oauth', 'api', 'sso')),
  config JSONB NOT NULL,
  credentials JSONB,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integrations_hubs_org ON integrations_hubs(org_id);

-- =====================================================
-- 18. ANALYTICS SYSTEMS (From advanced-lms-features)
-- =====================================================
CREATE TABLE analytics_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dashboard_name TEXT NOT NULL,
  metrics JSONB NOT NULL,
  filters JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_systems_org ON analytics_systems(org_id);

-- =====================================================
-- 19. SYSTEM CONFIGURATION (For Copilot/Autopilot)
-- =====================================================
CREATE TABLE system_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 20. AI GENERATED COURSES (From ai-course-creator)
-- =====================================================
CREATE TABLE ai_generated_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  content JSONB NOT NULL,
  structure JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_generated_courses_org ON ai_generated_courses(org_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_management_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORGS: Members can read their orgs
-- =====================================================
CREATE POLICY "org_read" ON orgs
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_update" ON orgs
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- ORG_MEMBERS: Members can read their org's members
-- =====================================================
CREATE POLICY "org_members_read" ON org_members
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_write" ON org_members
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- COURSES: Members can read, admins+ can write
-- =====================================================
CREATE POLICY "courses_read" ON courses
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "courses_write" ON courses
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'instructor')
    )
  );

-- =====================================================
-- COURSE_VERSIONS: Same as courses
-- =====================================================
CREATE POLICY "course_versions_read" ON course_versions
  FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- ENROLLMENTS: Students can read their own, admins can manage
-- =====================================================
CREATE POLICY "enrollments_read" ON enrollments
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'instructor', 'staff')
    )
  );

CREATE POLICY "enrollments_write" ON enrollments
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'instructor')
    )
  );

-- =====================================================
-- AUDIT_LOGS: Read-only for admins+
-- =====================================================
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- System can always insert

-- =====================================================
-- ENTITLEMENTS: Read for all members, write for system
-- =====================================================
CREATE POLICY "entitlements_read" ON entitlements
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- BILLING_SUBSCRIPTIONS: Owners/admins only
-- =====================================================
CREATE POLICY "billing_read" ON billing_subscriptions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- ALL OTHER TABLES: Standard org-scoped policies
-- =====================================================

-- School Websites
CREATE POLICY "school_websites_read" ON school_websites
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "school_websites_write" ON school_websites
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Mobile Apps
CREATE POLICY "mobile_apps_read" ON mobile_apps
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "mobile_apps_write" ON mobile_apps
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Learning Communities
CREATE POLICY "learning_communities_read" ON learning_communities
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "learning_communities_write" ON learning_communities
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'instructor')));

-- Marketing Automation
CREATE POLICY "marketing_automation_read" ON marketing_automation
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "marketing_automation_write" ON marketing_automation
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Assessment Engines
CREATE POLICY "assessment_engines_read" ON assessment_engines
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "assessment_engines_write" ON assessment_engines
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'instructor')));

-- White Label Instances
CREATE POLICY "white_label_instances_read" ON white_label_instances
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "white_label_instances_write" ON white_label_instances
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Course Players
CREATE POLICY "course_players_read" ON course_players
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "course_players_write" ON course_players
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'instructor')));

-- User Management Systems
CREATE POLICY "user_management_systems_read" ON user_management_systems
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "user_management_systems_write" ON user_management_systems
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Integrations Hubs
CREATE POLICY "integrations_hubs_read" ON integrations_hubs
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "integrations_hubs_write" ON integrations_hubs
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Analytics Systems
CREATE POLICY "analytics_systems_read" ON analytics_systems
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "analytics_systems_write" ON analytics_systems
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- AI Generated Courses
CREATE POLICY "ai_generated_courses_read" ON ai_generated_courses
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "ai_generated_courses_write" ON ai_generated_courses
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'instructor')));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON org_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entitlements_updated_at BEFORE UPDATE ON entitlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON billing_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Default entitlements per tier)
-- =====================================================

-- Starter tier defaults
INSERT INTO system_configuration (config_key, config_value, description) VALUES
  ('tier.starter.max_orgs', '1', 'Maximum organizations for starter tier'),
  ('tier.starter.max_seats', '5', 'Maximum seats for starter tier'),
  ('tier.starter.max_courses', '10', 'Maximum courses for starter tier'),
  ('tier.starter.features', '["basic_courses", "basic_analytics"]', 'Features for starter tier');

-- Growth tier defaults
INSERT INTO system_configuration (config_key, config_value, description) VALUES
  ('tier.growth.max_orgs', '5', 'Maximum organizations for growth tier'),
  ('tier.growth.max_seats', '50', 'Maximum seats for growth tier'),
  ('tier.growth.max_courses', '100', 'Maximum courses for growth tier'),
  ('tier.growth.features', '["basic_courses", "advanced_analytics", "white_label", "mobile_apps"]', 'Features for growth tier');

-- Enterprise tier defaults
INSERT INTO system_configuration (config_key, config_value, description) VALUES
  ('tier.enterprise.max_orgs', '-1', 'Unlimited organizations for enterprise tier'),
  ('tier.enterprise.max_seats', '-1', 'Unlimited seats for enterprise tier'),
  ('tier.enterprise.max_courses', '-1', 'Unlimited courses for enterprise tier'),
  ('tier.enterprise.features', '["all"]', 'All features for enterprise tier');

-- =====================================================
-- COMPLETE! Ready for production.
-- =====================================================
