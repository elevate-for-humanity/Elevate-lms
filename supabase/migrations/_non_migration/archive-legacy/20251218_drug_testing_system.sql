-- Drug Testing System for Elevate for Humanity
-- Integration with National Drug Screening

-- ============================================================================
-- 1. DRUG TESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drug_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Test details
  test_type text NOT NULL CHECK (test_type IN (
    'pre_employment',
    'random',
    'post_accident',
    'reasonable_suspicion',
    'return_to_duty',
    'follow_up'
  )),
  panel_type text NOT NULL CHECK (panel_type IN (
    '5_panel',
    '10_panel',
    '12_panel',
    'dot_5_panel',
    'alcohol',
    'custom'
  )),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'pending_collection',
    'collected',
    'in_lab',
    'completed',
    'positive',
    'negative',
    'cancelled',
    'no_show'
  )),
  
  -- Scheduling
  scheduled_date timestamptz NOT NULL,
  collection_site text NOT NULL,
  collection_site_address text,
  
  -- Results
  result text CHECK (result IN ('positive', 'negative', 'dilute', 'invalid')),
  result_date timestamptz,
  result_details text,
  lab_report_url text,
  
  -- National Drug Screening integration
  nds_order_id text,
  nds_donor_id text,
  nds_collection_site_id text,
  
  -- Compliance
  required_by_program boolean DEFAULT false,
  required_by_employer boolean DEFAULT false,
  required_by_funding boolean DEFAULT false,
  
  -- MRO (Medical Review Officer)
  mro_review_required boolean DEFAULT false,
  mro_reviewed boolean DEFAULT false,
  mro_reviewed_by uuid REFERENCES auth.users(id),
  mro_reviewed_at timestamptz,
  
  -- Notifications
  student_notified boolean DEFAULT false,
  employer_notified boolean DEFAULT false,
  program_holder_notified boolean DEFAULT false,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_drug_tests_student ON drug_tests(student_id);
CREATE INDEX idx_drug_tests_enrollment ON drug_tests(enrollment_id);
CREATE INDEX idx_drug_tests_organization ON drug_tests(organization_id);
CREATE INDEX idx_drug_tests_status ON drug_tests(status);
CREATE INDEX idx_drug_tests_scheduled_date ON drug_tests(scheduled_date);
CREATE INDEX idx_drug_tests_nds_order ON drug_tests(nds_order_id);

-- ============================================================================
-- 2. DRUG TESTING POLICIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drug_testing_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  
  -- Policy details
  policy_name text NOT NULL,
  policy_type text NOT NULL CHECK (policy_type IN (
    'pre_employment',
    'random',
    'comprehensive'
  )),
  
  -- Requirements
  pre_employment_required boolean DEFAULT false,
  random_testing_enabled boolean DEFAULT false,
  random_testing_percentage integer CHECK (random_testing_percentage >= 0 AND random_testing_percentage <= 100),
  post_accident_required boolean DEFAULT false,
  reasonable_suspicion_enabled boolean DEFAULT false,
  
  -- Test specifications
  default_panel text NOT NULL DEFAULT '5_panel',
  alcohol_testing_included boolean DEFAULT false,
  
  -- Compliance
  dot_regulated boolean DEFAULT false,
  state_requirements text[],
  
  -- Document
  policy_document_url text,
  
  -- Status
  active boolean DEFAULT true,
  effective_date date NOT NULL,
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drug_policies_org ON drug_testing_policies(organization_id);
CREATE INDEX idx_drug_policies_program ON drug_testing_policies(program_id);
CREATE INDEX idx_drug_policies_active ON drug_testing_policies(active);

-- ============================================================================
-- 3. COLLECTION SITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nds_site_id text UNIQUE NOT NULL,
  
  -- Location
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  
  -- Contact
  phone text NOT NULL,
  email text,
  
  -- Hours
  hours_of_operation text,
  
  -- Services
  services_offered text[],
  dot_certified boolean DEFAULT false,
  
  -- Coordinates (for distance calculation)
  latitude numeric,
  longitude numeric,
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_collection_sites_state ON collection_sites(state);
CREATE INDEX idx_collection_sites_city ON collection_sites(city);
CREATE INDEX idx_collection_sites_active ON collection_sites(active);
CREATE INDEX idx_collection_sites_nds_id ON collection_sites(nds_site_id);

-- ============================================================================
-- 4. DRUG TEST HISTORY TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS drug_test_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_test_id uuid NOT NULL REFERENCES drug_tests(id) ON DELETE CASCADE,
  
  -- Change details
  action text NOT NULL CHECK (action IN (
    'created',
    'scheduled',
    'rescheduled',
    'collected',
    'result_received',
    'mro_reviewed',
    'cancelled',
    'no_show'
  )),
  previous_status text,
  new_status text,
  
  -- Actor
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT NOW(),
  
  -- Details
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index
CREATE INDEX idx_drug_test_history_test ON drug_test_history(drug_test_id);
CREATE INDEX idx_drug_test_history_date ON drug_test_history(performed_at);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_drug_test_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drug_tests_updated_at
  BEFORE UPDATE ON drug_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_drug_test_timestamp();

CREATE TRIGGER drug_testing_policies_updated_at
  BEFORE UPDATE ON drug_testing_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_drug_test_timestamp();

-- Audit trail trigger
CREATE OR REPLACE FUNCTION log_drug_test_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO drug_test_history (drug_test_id, action, new_status, performed_by, notes)
    VALUES (NEW.id, 'created', NEW.status, NEW.created_by, 'Drug test created');
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO drug_test_history (drug_test_id, action, previous_status, new_status, performed_by, notes)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, NEW.created_by, 'Status updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drug_test_audit_trail
  AFTER INSERT OR UPDATE ON drug_tests
  FOR EACH ROW
  EXECUTE FUNCTION log_drug_test_change();

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE drug_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_testing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_test_history ENABLE ROW LEVEL SECURITY;

-- Students can view their own tests
CREATE POLICY "Students can view own drug tests"
  ON drug_tests FOR SELECT
  USING (auth.uid() = student_id);

-- Program holders can view tests for their programs
CREATE POLICY "Program holders can view program drug tests"
  ON drug_tests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('program_holder', 'admin', 'super_admin')
    )
  );

-- Admins can manage all tests
CREATE POLICY "Admins can manage drug tests"
  ON drug_tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Collection sites are publicly viewable (for scheduling)
CREATE POLICY "Collection sites are publicly viewable"
  ON collection_sites FOR SELECT
  USING (active = true);

-- Policies viewable by organization members
CREATE POLICY "Organization members can view policies"
  ON drug_testing_policies FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- History viewable by authorized users
CREATE POLICY "Authorized users can view drug test history"
  ON drug_test_history FOR SELECT
  USING (
    drug_test_id IN (
      SELECT id FROM drug_tests
      WHERE student_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid() AND role IN ('program_holder', 'admin', 'super_admin')
      )
    )
  );

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Drug Testing System migration complete';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '  • drug_tests - Main drug test tracking';
  RAISE NOTICE '  • drug_testing_policies - Organization/program policies';
  RAISE NOTICE '  • collection_sites - National Drug Screening locations';
  RAISE NOTICE '  • drug_test_history - Complete audit trail';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 RLS Policies: Enabled';
  RAISE NOTICE '🔔 Triggers: Active (timestamps, audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Integration: Ready for National Drug Screening API';
END $$;
