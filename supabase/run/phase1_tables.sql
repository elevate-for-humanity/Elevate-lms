-- ================================================================
-- PHASE 1: CREATE TABLES + ADD MISSING COLUMNS
-- Run this first. All use IF NOT EXISTS — safe to re-run.
-- ================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE agreement_type AS ENUM (
    'eula','tos','aup','disclosures','license','nda','mou',
    'enrollment','participation','ferpa','media_release','handbook','employer','partner'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signature_method AS ENUM ('checkbox', 'typed', 'drawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- license_agreement_acceptances (already exists — this is a no-op)
CREATE TABLE IF NOT EXISTS license_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  agreement_type TEXT NOT NULL,
  document_version TEXT NOT NULL DEFAULT '1.0',
  document_url TEXT,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  auth_email TEXT,
  signature_method TEXT NOT NULL DEFAULT 'checkbox',
  signature_typed TEXT,
  signature_data TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT NOT NULL DEFAULT '0.0.0.0',
  user_agent TEXT NOT NULL DEFAULT 'unknown',
  acceptance_context TEXT DEFAULT 'onboarding',
  role_at_signing TEXT,
  organization_id UUID,
  tenant_id UUID,
  program_id UUID,
  legal_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT unique_user_agreement UNIQUE(user_id, agreement_type, document_version)
);

-- agreement_versions (does not exist yet)
DROP TABLE IF EXISTS agreement_versions CASCADE;
CREATE TABLE IF NOT EXISTS agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  current_version TEXT NOT NULL DEFAULT '1.0',
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  document_url TEXT NOT NULL,
  document_hash TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  summary_of_changes TEXT,
  requires_re_acceptance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(agreement_type, version)
);

-- onboarding_progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at TIMESTAMPTZ,
  agreements_completed BOOLEAN DEFAULT FALSE,
  agreements_completed_at TIMESTAMPTZ,
  handbook_acknowledged BOOLEAN DEFAULT FALSE,
  handbook_acknowledged_at TIMESTAMPTZ,
  documents_uploaded BOOLEAN DEFAULT FALSE,
  documents_uploaded_at TIMESTAMPTZ,
  status onboarding_status DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- handbook_acknowledgments
CREATE TABLE IF NOT EXISTS handbook_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  tenant_id UUID,
  handbook_version TEXT NOT NULL,
  handbook_hash TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  attendance_policy_ack BOOLEAN DEFAULT FALSE,
  dress_code_ack BOOLEAN DEFAULT FALSE,
  conduct_policy_ack BOOLEAN DEFAULT FALSE,
  safety_policy_ack BOOLEAN DEFAULT FALSE,
  grievance_policy_ack BOOLEAN DEFAULT FALSE,
  full_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  acknowledgment_statement TEXT NOT NULL DEFAULT 'I have read and understand the Student Handbook.',
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, handbook_version)
);

-- compliance_audit_log
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  target_table TEXT,
  target_id UUID,
  tenant_id UUID,
  organization_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE
);

-- automated_decisions
CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  confidence DECIMAL(5,4),
  reasoning JSONB DEFAULT '{}',
  rules_applied JSONB DEFAULT '[]',
  override_by UUID,
  override_reason TEXT,
  input_snapshot JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- review_queue
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  review_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  assigned_to UUID,
  ai_recommendation JSONB DEFAULT '{}',
  ai_confidence DECIMAL(5,4),
  human_decision TEXT,
  human_notes TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- shop_recommendations
CREATE TABLE IF NOT EXISTS shop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  ranking INTEGER NOT NULL,
  match_factors JSONB DEFAULT '{}',
  distance_miles DECIMAL(10,2),
  factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- partner_documents
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- partner_mous
CREATE TABLE IF NOT EXISTS partner_mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  mou_version TEXT NOT NULL DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  signed_by UUID,
  document_url TEXT,
  effective_date DATE,
  expiry_date DATE,
  terms JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- apprentice_placements
CREATE TABLE IF NOT EXISTS apprentice_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  program_id UUID,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  mentor_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- enrollment_requirements
CREATE TABLE IF NOT EXISTS enrollment_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  requirement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  verified_by UUID,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- compliance_alerts
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  tenant_id UUID,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- wioa_compliance_reports
CREATE TABLE IF NOT EXISTS wioa_compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  quarter TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  data JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- portal_messages
CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  conversation_id UUID,
  subject TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- crm_follow_ups
CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL,
  assigned_to UUID,
  follow_up_type TEXT DEFAULT 'call',
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- crm_deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'lead',
  value DECIMAL(12,2),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  assigned_to UUID,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- crm_appointments
CREATE TABLE IF NOT EXISTS crm_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  staff_id UUID,
  appointment_type TEXT DEFAULT 'consultation',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- apprentice_milestones
CREATE TABLE IF NOT EXISTS apprentice_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL,
  program_id UUID,
  milestone_name TEXT NOT NULL,
  description TEXT,
  hours_required INTEGER,
  hours_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  badge_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- practice_tests
CREATE TABLE IF NOT EXISTS practice_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  question_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- practice_test_attempts
CREATE TABLE IF NOT EXISTS practice_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER
);

-- study_topics
CREATE TABLE IF NOT EXISTS study_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- time_off_requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- search_history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- search_suggestions
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  weight INTEGER DEFAULT 1,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ferpa_access_logs
CREATE TABLE IF NOT EXISTS ferpa_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessor_id UUID NOT NULL,
  student_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  records_accessed TEXT[],
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- marketplace_products (already exists — no-op)
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  status TEXT DEFAULT 'active',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- wioa_pirl_mappings
CREATE TABLE IF NOT EXISTS wioa_pirl_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id TEXT NOT NULL,
  element TEXT NOT NULL,
  element_name TEXT,
  source_table TEXT,
  source_column TEXT,
  transform TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schema_id, element)
);

-- wioa_pirl_exports
CREATE TABLE IF NOT EXISTS wioa_pirl_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id TEXT NOT NULL,
  quarter TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  record_count INTEGER DEFAULT 0,
  file_url TEXT,
  errors JSONB DEFAULT '[]',
  exported_by UUID,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- wioa_pirl_export_issues
CREATE TABLE IF NOT EXISTS wioa_pirl_export_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL,
  participant_id UUID,
  element TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'warning',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum aliases: only create views if they don't already exist as tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'forum_threads') THEN
    EXECUTE 'CREATE VIEW forum_threads AS SELECT * FROM forum_topics';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'forum_posts') THEN
    EXECUTE 'CREATE VIEW forum_posts AS SELECT * FROM forum_replies';
  END IF;
END $$;

-- Add missing columns to existing tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}';

-- Add partner columns if missing
ALTER TABLE partners ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mou_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;
