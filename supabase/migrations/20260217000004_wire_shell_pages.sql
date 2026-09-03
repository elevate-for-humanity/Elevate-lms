-- Migration: Create tables required by shell pages being wired to real data
-- These tables are queried by activated components but don't exist yet

-- ============================================
-- ENROLLMENT REQUIREMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS enrollment_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  requirement_type TEXT NOT NULL DEFAULT 'document',
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  evidence_url TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enrollment_requirements_enrollment ON enrollment_requirements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requirements_status ON enrollment_requirements(status);

-- ============================================
-- FORUM VIEWS (alias forum_threads/forum_posts to existing tables)
-- ============================================
CREATE OR REPLACE VIEW forum_threads AS SELECT * FROM forum_topics;
CREATE OR REPLACE VIEW forum_posts AS SELECT * FROM forum_replies;

-- ============================================
-- COMPLIANCE & WIOA
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved ON compliance_alerts(resolved);

CREATE TABLE IF NOT EXISTS wioa_compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  quarter TEXT,
  fiscal_year INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  data JSONB DEFAULT '{}',
  generated_by UUID,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wioa_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_hash TEXT,
  date_of_birth DATE,
  email TEXT,
  phone TEXT,
  address JSONB,
  eligibility_status TEXT DEFAULT 'pending',
  eligibility_verified_at TIMESTAMPTZ,
  eligibility_verified_by UUID,
  enrollment_date DATE,
  exit_date DATE,
  program_id UUID,
  funding_source TEXT,
  case_manager_id UUID,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wioa_participants_user ON wioa_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_wioa_participants_status ON wioa_participants(eligibility_status);

-- ============================================
-- MESSAGING
-- ============================================
CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_messages_conversation ON portal_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender ON portal_messages(sender_id);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  portal_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);

-- ============================================
-- CRM
-- ============================================
CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  assigned_to UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  follow_up_type TEXT DEFAULT 'call',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_assigned ON crm_follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_status ON crm_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_due ON crm_follow_ups(due_date);

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  company_name TEXT,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);

CREATE TABLE IF NOT EXISTS crm_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT DEFAULT 'consultation',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_scheduled ON crm_appointments(scheduled_at);

-- ============================================
-- APPRENTICE MILESTONES & STATE BOARD
-- ============================================
CREATE TABLE IF NOT EXISTS apprentice_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID,
  milestone_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_hours INTEGER,
  completed_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  badge_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apprentice_milestones_user ON apprentice_milestones(user_id);

CREATE TABLE IF NOT EXISTS practice_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  question_count INTEGER DEFAULT 0,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_practice_test_attempts_user ON practice_test_attempts(user_id);

CREATE TABLE IF NOT EXISTS study_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  resources JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIME OFF (employee portal)
-- ============================================
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours NUMERIC,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_user ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);

-- ============================================
-- SEARCH
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  category TEXT,
  weight INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FERPA AUDIT
-- ============================================
CREATE TABLE IF NOT EXISTS ferpa_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ferpa_access_logs_student ON ferpa_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_ferpa_access_logs_user ON ferpa_access_logs(user_id);

-- ============================================
-- MARKETPLACE PRODUCTS (community marketplace)
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  condition TEXT DEFAULT 'new',
  images JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================
ALTER TABLE enrollment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
DO $$ BEGIN
  -- enrollment_requirements: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollment_requirements' AND policyname = 'Users read own requirements') THEN
    CREATE POLICY "Users read own requirements" ON enrollment_requirements FOR SELECT USING (
      enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid())
    );
  END IF;

  -- portal_messages: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portal_messages' AND policyname = 'Users read own messages') THEN
    CREATE POLICY "Users read own messages" ON portal_messages FOR SELECT USING (
      sender_id = auth.uid() OR recipient_id = auth.uid()
    );
  END IF;

  -- portal_messages: users can send
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portal_messages' AND policyname = 'Users send messages') THEN
    CREATE POLICY "Users send messages" ON portal_messages FOR INSERT WITH CHECK (
      sender_id = auth.uid()
    );
  END IF;

  -- conversations: participants only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants read conversations') THEN
    CREATE POLICY "Participants read conversations" ON conversations FOR SELECT USING (
      auth.uid() = ANY(participant_ids)
    );
  END IF;

  -- apprentice_milestones: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'apprentice_milestones' AND policyname = 'Users read own milestones') THEN
    CREATE POLICY "Users read own milestones" ON apprentice_milestones FOR SELECT USING (
      user_id = auth.uid()
    );
  END IF;

  -- practice_test_attempts: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_test_attempts' AND policyname = 'Users read own attempts') THEN
    CREATE POLICY "Users read own attempts" ON practice_test_attempts FOR SELECT USING (
      user_id = auth.uid()
    );
  END IF;

  -- time_off_requests: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_off_requests' AND policyname = 'Users read own requests') THEN
    CREATE POLICY "Users read own requests" ON time_off_requests FOR SELECT USING (
      user_id = auth.uid()
    );
  END IF;

  -- marketplace_products: public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_products' AND policyname = 'Public read active products') THEN
    CREATE POLICY "Public read active products" ON marketplace_products FOR SELECT USING (
      status = 'active'
    );
  END IF;

  -- search_history: users see their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users read own history') THEN
    CREATE POLICY "Users read own history" ON search_history FOR SELECT USING (
      user_id = auth.uid()
    );
  END IF;

  -- practice_tests: authenticated users can read active tests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_tests' AND policyname = 'Authenticated read active tests') THEN
    CREATE POLICY "Authenticated read active tests" ON practice_tests FOR SELECT USING (
      is_active = true AND auth.uid() IS NOT NULL
    );
  END IF;

  -- study_topics: authenticated users can read active topics
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_topics' AND policyname = 'Authenticated read active topics') THEN
    CREATE POLICY "Authenticated read active topics" ON study_topics FOR SELECT USING (
      is_active = true AND auth.uid() IS NOT NULL
    );
  END IF;

  -- practice_test_attempts: users can insert their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_test_attempts' AND policyname = 'Users insert own attempts') THEN
    CREATE POLICY "Users insert own attempts" ON practice_test_attempts FOR INSERT WITH CHECK (
      user_id = auth.uid()
    );
  END IF;

  -- time_off_requests: users can insert their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_off_requests' AND policyname = 'Users insert own requests') THEN
    CREATE POLICY "Users insert own requests" ON time_off_requests FOR INSERT WITH CHECK (
      user_id = auth.uid()
    );
  END IF;

  -- marketplace_products: authenticated users can insert
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_products' AND policyname = 'Users insert own products') THEN
    CREATE POLICY "Users insert own products" ON marketplace_products FOR INSERT WITH CHECK (
      seller_id = auth.uid()
    );
  END IF;

  -- search_history: users can insert their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users insert own history') THEN
    CREATE POLICY "Users insert own history" ON search_history FOR INSERT WITH CHECK (
      user_id = auth.uid()
    );
  END IF;
END $$;
