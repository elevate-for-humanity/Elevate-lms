-- Barber Apprenticeship System Tables
-- Supports: inquiries, applications, agreements, assignments, hours tracking, transfers
-- Token-based access, automatic transfer evaluation, IPLA exam tracking

-- 1. Access Tokens (controlled access without login)
CREATE TABLE IF NOT EXISTS access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('host_shop_hours', 'school_transfer', 'ce_submission')),
  apprentice_application_id UUID,
  host_shop_application_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 100,
  uses_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON access_tokens(token);

-- 2. Inquiries table (public submissions)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('apprentice', 'host_shop')),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Apprentice Applications
CREATE TABLE IF NOT EXISTS apprentice_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL DEFAULT 'barber-apprenticeship',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  intake JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('drafted', 'submitted', 'reviewed', 'approved', 'matched', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Host Shop Applications
CREATE TABLE IF NOT EXISTS host_shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  license_info JSONB NOT NULL DEFAULT '{}',
  intake JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('drafted', 'submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Agreement Acceptances (audit trail)
CREATE TABLE IF NOT EXISTS agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('apprentice', 'host_shop')),
  subject_id UUID NOT NULL,
  agreement_key TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  accepted_name TEXT NOT NULL,
  accepted_email TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_ip TEXT,
  user_agent TEXT
);

-- 5. Apprentice Assignments (links apprentice to host shop)
CREATE TABLE IF NOT EXISTS apprentice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  host_shop_application_id UUID NOT NULL REFERENCES host_shop_applications(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Hour Entries (source-aware, auditable ledger)
CREATE TABLE IF NOT EXISTS hour_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  host_shop_application_id UUID REFERENCES host_shop_applications(id),
  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN ('host_shop', 'in_state_barber_school', 'out_of_state_school', 'out_of_state_license', 'continuing_education')),
  source_entity_name TEXT,
  source_state TEXT,
  source_document_url TEXT,
  -- Hours
  work_date DATE,
  hours_claimed NUMERIC(5,2) NOT NULL CHECK (hours_claimed > 0),
  accepted_hours NUMERIC(5,2) DEFAULT 0,
  category TEXT,
  notes TEXT,
  -- Evaluation
  evaluation_required BOOLEAN DEFAULT false,
  evaluation_decision TEXT CHECK (evaluation_decision IN ('accepted', 'partially_accepted', 'rejected', 'requires_manual_review')),
  rule_set_id TEXT,
  rule_hash TEXT,
  evaluated_at TIMESTAMPTZ,
  evaluated_by TEXT,
  evaluation_notes TEXT,
  -- Entry metadata
  entered_by_email TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6b. Transfer Hour Submissions (incoming transfers from schools/states)
CREATE TABLE IF NOT EXISTS transfer_hour_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('in_state_barber_school', 'out_of_state_school', 'out_of_state_license')),
  source_entity_name TEXT NOT NULL,
  source_state TEXT NOT NULL,
  hours_claimed NUMERIC(5,2) NOT NULL,
  completion_date DATE,
  documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'evaluated', 'manual_review')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6c. Licensure Exam Events (IPLA tracking)
CREATE TABLE IF NOT EXISTS licensure_exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  exam_authority TEXT NOT NULL DEFAULT 'IPLA',
  exam_type TEXT NOT NULL CHECK (exam_type IN ('written', 'practical')),
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'not_eligible' CHECK (status IN ('not_eligible', 'eligible', 'scheduled', 'passed', 'failed')),
  documentation_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6d. Continuing Education Hours (separate from licensure)
CREATE TABLE IF NOT EXISTS continuing_education_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  provider_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
  completion_date DATE NOT NULL,
  documentation_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6e. Documents (source of truth for all uploads)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('apprentice', 'host_shop')),
  owner_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'photo_id',
    'school_transcript',
    'certificate',
    'out_of_state_license',
    'shop_license',
    'barber_license',
    'ce_certificate',
    'ipla_packet',
    'other'
  )),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes INT,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(verified);

-- 7. Transfer Requests
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL REFERENCES apprentice_applications(id),
  from_host_shop_application_id UUID REFERENCES host_shop_applications(id),
  to_host_shop_application_id UUID REFERENCES host_shop_applications(id),
  requested_by_email TEXT NOT NULL,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_apprentice_applications_status ON apprentice_applications(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_applications_email ON apprentice_applications(email);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_status ON host_shop_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_email ON host_shop_applications(email);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_apprentice ON apprentice_assignments(apprentice_application_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_shop ON apprentice_assignments(host_shop_application_id);
CREATE INDEX IF NOT EXISTS idx_hour_entries_apprentice ON hour_entries(apprentice_application_id);
CREATE INDEX IF NOT EXISTS idx_hour_entries_shop ON hour_entries(host_shop_application_id);
CREATE INDEX IF NOT EXISTS idx_hour_entries_status ON hour_entries(status);
CREATE INDEX IF NOT EXISTS idx_hour_entries_source_type ON hour_entries(source_type);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_subject ON agreement_acceptances(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_transfer_submissions_apprentice ON transfer_hour_submissions(apprentice_application_id);
CREATE INDEX IF NOT EXISTS idx_transfer_submissions_status ON transfer_hour_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exam_events_apprentice ON licensure_exam_events(apprentice_application_id);
CREATE INDEX IF NOT EXISTS idx_ce_hours_apprentice ON continuing_education_hours(apprentice_application_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_shop_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_hour_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE licensure_exam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuing_education_hours ENABLE ROW LEVEL SECURITY;

-- Public can INSERT inquiries
CREATE POLICY "Public can insert inquiries" ON inquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Public can INSERT applications
CREATE POLICY "Public can insert apprentice applications" ON apprentice_applications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can insert host shop applications" ON host_shop_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Public can INSERT agreement acceptances
CREATE POLICY "Public can insert agreement acceptances" ON agreement_acceptances
  FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access inquiries" ON inquiries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access apprentice_applications" ON apprentice_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access host_shop_applications" ON host_shop_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access agreement_acceptances" ON agreement_acceptances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access apprentice_assignments" ON apprentice_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access hour_entries" ON hour_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access transfer_requests" ON transfer_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access access_tokens" ON access_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access transfer_hour_submissions" ON transfer_hour_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access licensure_exam_events" ON licensure_exam_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access continuing_education_hours" ON continuing_education_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public can insert transfer submissions (via token)
CREATE POLICY "Public can insert transfer submissions" ON transfer_hour_submissions
  FOR INSERT TO anon WITH CHECK (true);

-- Public can insert CE hours (via token)
CREATE POLICY "Public can insert CE hours" ON continuing_education_hours
  FOR INSERT TO anon WITH CHECK (true);

-- Documents RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert documents" ON documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Service role full access documents" ON documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- View for apprentice hour totals (source-aware)
CREATE OR REPLACE VIEW apprentice_hour_totals AS
SELECT 
  apprentice_application_id,
  SUM(CASE WHEN status = 'approved' THEN accepted_hours ELSE 0 END) as total_accepted_hours,
  SUM(CASE WHEN status = 'pending' THEN hours_claimed ELSE 0 END) as total_pending_hours,
  SUM(CASE WHEN status = 'approved' AND source_type = 'host_shop' THEN accepted_hours ELSE 0 END) as host_shop_hours,
  SUM(CASE WHEN status = 'approved' AND source_type != 'host_shop' THEN accepted_hours ELSE 0 END) as transfer_hours,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_entry_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_entry_count,
  COUNT(CASE WHEN evaluation_decision = 'requires_manual_review' THEN 1 END) as pending_review_count
FROM hour_entries
GROUP BY apprentice_application_id;

-- View for hours by source type
CREATE OR REPLACE VIEW apprentice_hours_by_source AS
SELECT 
  apprentice_application_id,
  source_type,
  SUM(CASE WHEN status = 'approved' THEN accepted_hours ELSE 0 END) as accepted_hours,
  SUM(CASE WHEN status = 'pending' THEN hours_claimed ELSE 0 END) as pending_hours,
  COUNT(*) as entry_count
FROM hour_entries
GROUP BY apprentice_application_id, source_type;

-- View for hours by shop
CREATE OR REPLACE VIEW apprentice_hours_by_shop AS
SELECT 
  apprentice_application_id,
  host_shop_application_id,
  SUM(CASE WHEN status = 'approved' THEN accepted_hours ELSE 0 END) as approved_hours,
  SUM(CASE WHEN status = 'pending' THEN hours_claimed ELSE 0 END) as pending_hours,
  MIN(work_date) as first_entry_date,
  MAX(work_date) as last_entry_date
FROM hour_entries
WHERE source_type = 'host_shop'
GROUP BY apprentice_application_id, host_shop_application_id;

-- Function to check if apprentice can be matched (requires approved host shop)
CREATE OR REPLACE FUNCTION check_can_match_apprentice(apprentice_id UUID, shop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  shop_approved BOOLEAN;
BEGIN
  SELECT (status = 'approved') INTO shop_approved
  FROM host_shop_applications
  WHERE id = shop_id;
  
  RETURN COALESCE(shop_approved, false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apprentice_applications_updated_at
  BEFORE UPDATE ON apprentice_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER host_shop_applications_updated_at
  BEFORE UPDATE ON host_shop_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Apprentices Table
-- Links users to their apprenticeship enrollment and program

CREATE TABLE IF NOT EXISTS apprentices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application reference (if came through application flow)
  application_id UUID REFERENCES apprentice_applications(id),
  
  -- Program info
  program_id UUID,
  program_name TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'pending',
    'active', 
    'suspended',
    'completed',
    'withdrawn'
  )),
  
  -- Hours tracking
  total_hours_required INT DEFAULT 2000,
  hours_completed INT DEFAULT 0,
  transfer_hours_credited INT DEFAULT 0,
  
  -- Dates
  enrollment_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Current assignment
  current_shop_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on user_id (one apprentice record per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);

-- Index for program lookups
CREATE INDEX IF NOT EXISTS idx_apprentices_program ON apprentices(program_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_apprentices_status ON apprentices(status);

-- Enable RLS
ALTER TABLE apprentices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own apprentice record" ON apprentices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all apprentices" ON apprentices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

CREATE POLICY "Admins can manage apprentices" ON apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access" ON apprentices
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_apprentices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apprentices_updated_at
  BEFORE UPDATE ON apprentices
  FOR EACH ROW
  EXECUTE FUNCTION update_apprentices_updated_at();

-- Add comment
COMMENT ON TABLE apprentices IS 'Active apprentice enrollments linked to users';
-- Hour Transfer Requests Table
-- Tracks requests to transfer hours from previous training/employment

CREATE TABLE IF NOT EXISTS hour_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Apprentice info
  apprentice_id UUID NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Source info
  source TEXT NOT NULL, -- 'barber_school', 'cosmetology_school', 'out_of_state_license', etc.
  source_type TEXT NOT NULL CHECK (source_type IN (
    'in_state_barber_school',
    'out_of_state_school', 
    'out_of_state_license',
    'previous_apprenticeship',
    'work_experience'
  )),
  
  -- Request details
  hours_requested INT NOT NULL CHECK (hours_requested > 0),
  description TEXT,
  previous_employer TEXT,
  employment_dates TEXT,
  
  -- Supporting documents
  document_ids UUID[] DEFAULT '{}',
  
  -- Verification status
  docs_verified BOOLEAN DEFAULT false,
  docs_verified_at TIMESTAMPTZ,
  
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'requires_manual_review',
    'evaluated',
    'approved',
    'partial',
    'rejected'
  )),
  
  -- Evaluation results
  hours_accepted INT,
  evaluation_decision TEXT,
  evaluation_notes TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ,
  
  -- Rule tracking
  rule_set_id TEXT,
  rule_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_apprentice 
  ON hour_transfer_requests(apprentice_id);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_submitted_by 
  ON hour_transfer_requests(submitted_by);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_status 
  ON hour_transfer_requests(status);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_source_type 
  ON hour_transfer_requests(source_type);

-- Enable RLS
ALTER TABLE hour_transfer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transfer requests" ON hour_transfer_requests
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Users can create own transfer requests" ON hour_transfer_requests
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins can view all transfer requests" ON hour_transfer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update transfer requests" ON hour_transfer_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access" ON hour_transfer_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_hour_transfer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hour_transfer_requests_updated_at
  BEFORE UPDATE ON hour_transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_hour_transfer_requests_updated_at();

-- Add comment
COMMENT ON TABLE hour_transfer_requests IS 'Tracks requests to transfer hours from previous training or employment';
-- =====================================================
-- APPRENTICESHIP HOURS COMPATIBILITY VIEW
-- =====================================================
-- Canonical table: progress_entries
-- This VIEW provides backward compatibility for legacy API routes
-- that use different column names.
--
-- DEPLOYED: 2026-01-28
-- =====================================================

-- Drop existing objects for idempotency
DROP VIEW IF EXISTS apprenticeship_hours_summary;
DROP VIEW IF EXISTS apprenticeship_hours;
DROP FUNCTION IF EXISTS insert_apprenticeship_hours() CASCADE;
DROP FUNCTION IF EXISTS update_apprenticeship_hours() CASCADE;

-- Create compatibility view matching actual progress_entries schema
CREATE VIEW apprenticeship_hours AS
SELECT 
  pe.id,
  pe.apprentice_id AS student_id,
  pe.partner_id AS shop_id,
  pe.partner_id,
  pe.work_date AS date_worked,
  pe.work_date AS date,
  pe.week_ending,
  pe.hours_worked AS hours,
  pe.hours_worked,
  pe.program_id AS program_slug,
  pe.program_id,
  pe.tasks_completed AS category,
  pe.tasks_completed AS description,
  pe.notes,
  (pe.status = 'verified') AS approved,
  pe.verified_by AS approved_by,
  pe.verified_at AS approved_at,
  CASE WHEN pe.status = 'disputed' THEN pe.notes ELSE NULL END AS rejection_reason,
  pe.status,
  pe.submitted_by,
  pe.submitted_at,
  pe.created_at,
  pe.updated_at
FROM progress_entries pe;

-- INSERT trigger function
CREATE OR REPLACE FUNCTION insert_apprenticeship_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_id UUID;
  v_program_id VARCHAR(100);
  v_status VARCHAR(20);
BEGIN
  v_program_id := UPPER(COALESCE(NEW.program_slug, NEW.program_id, 'APPRENTICESHIP'));
  v_partner_id := COALESCE(NEW.shop_id, NEW.partner_id, (SELECT id FROM partners LIMIT 1));
  
  IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN
    v_status := 'disputed';
  ELSIF NEW.approved = true THEN
    v_status := 'verified';
  ELSE
    v_status := 'submitted';
  END IF;
  
  INSERT INTO progress_entries (
    apprentice_id, partner_id, program_id, work_date, week_ending, hours_worked,
    tasks_completed, notes, submitted_by, submitted_at,
    verified_by, verified_at, status, created_at, updated_at
  ) VALUES (
    NEW.student_id, 
    v_partner_id, 
    v_program_id,
    COALESCE(NEW.date_worked, NEW.date, CURRENT_DATE),
    COALESCE(NEW.week_ending, DATE_TRUNC('week', COALESCE(NEW.date_worked, NEW.date, CURRENT_DATE)) + INTERVAL '4 days'),
    COALESCE(NEW.hours, NEW.hours_worked, 0),
    COALESCE(NEW.category, NEW.description, ''),
    CASE WHEN v_status = 'disputed' THEN NEW.rejection_reason ELSE NEW.notes END,
    COALESCE(NEW.submitted_by, NEW.student_id),
    COALESCE(NEW.submitted_at, NOW()),
    CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_by, auth.uid()) ELSE NULL END,
    CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_at, NOW()) ELSE NULL END,
    v_status, 
    NOW(), 
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UPDATE trigger function
CREATE OR REPLACE FUNCTION update_apprenticeship_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN
    v_status := 'disputed';
  ELSIF NEW.approved = true THEN
    v_status := 'verified';
  ELSIF OLD.approved = true AND NEW.approved = false THEN
    v_status := 'submitted';
  ELSE
    v_status := COALESCE(NEW.status, OLD.status, 'submitted');
  END IF;
  
  UPDATE progress_entries SET
    hours_worked = COALESCE(NEW.hours, NEW.hours_worked, OLD.hours_worked),
    tasks_completed = COALESCE(NEW.category, NEW.description, OLD.tasks_completed),
    notes = CASE WHEN v_status = 'disputed' THEN COALESCE(NEW.rejection_reason, NEW.notes) ELSE COALESCE(NEW.notes, OLD.notes) END,
    status = v_status,
    verified_by = CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_by, auth.uid(), OLD.verified_by) ELSE NULL END,
    verified_at = CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_at, NOW()) ELSE NULL END,
    updated_at = NOW()
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER apprenticeship_hours_insert_trigger
  INSTEAD OF INSERT ON apprenticeship_hours
  FOR EACH ROW EXECUTE FUNCTION insert_apprenticeship_hours();

CREATE TRIGGER apprenticeship_hours_update_trigger
  INSTEAD OF UPDATE ON apprenticeship_hours
  FOR EACH ROW EXECUTE FUNCTION update_apprenticeship_hours();

-- Summary view
CREATE VIEW apprenticeship_hours_summary AS
SELECT 
  apprentice_id AS student_id,
  program_id AS program_slug,
  DATE_TRUNC('week', week_ending) AS week_start,
  SUM(hours_worked) AS total_hours,
  SUM(CASE WHEN status = 'verified' THEN hours_worked ELSE 0 END) AS approved_hours,
  SUM(CASE WHEN status IN ('submitted', 'draft') THEN hours_worked ELSE 0 END) AS pending_hours,
  SUM(CASE WHEN status = 'disputed' THEN hours_worked ELSE 0 END) AS disputed_hours,
  COUNT(*) AS entry_count
FROM progress_entries
GROUP BY apprentice_id, program_id, DATE_TRUNC('week', week_ending);
-- RAPIDS Apprentice Data Collection
-- Stores all data required for DOL RAPIDS reporting

-- Main RAPIDS apprentice records table
CREATE TABLE IF NOT EXISTS rapids_apprentices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to internal systems
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  enrollment_id UUID,
  
  -- Personal Information (RAPIDS required)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  suffix TEXT, -- Jr, Sr, III, etc.
  
  -- SSN stored encrypted (application handles encryption)
  ssn_encrypted TEXT,
  ssn_last_four TEXT, -- For display/verification
  
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'X')),
  
  -- Demographics (RAPIDS required for EEO reporting)
  race_ethnicity TEXT, -- Hispanic/Latino, White, Black, Asian, etc.
  veteran_status BOOLEAN DEFAULT false,
  disability_status BOOLEAN DEFAULT false,
  education_level TEXT, -- High school, Some college, Associate, Bachelor, etc.
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Program Information
  program_slug TEXT NOT NULL, -- barber, cosmetology, etc.
  occupation_code TEXT NOT NULL, -- DOT code: 330.371-010
  occupation_title TEXT NOT NULL, -- Barber
  
  -- RAPIDS Registration
  rapids_registration_id TEXT, -- Assigned by DOL after submission
  registration_date DATE NOT NULL,
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'submitted', 'registered', 'rejected')),
  
  -- Employer Information (RAPIDS required)
  employer_name TEXT,
  employer_fein TEXT, -- Federal Employer ID Number
  employer_address TEXT,
  employer_city TEXT,
  employer_state TEXT,
  employer_zip TEXT,
  employer_contact_name TEXT,
  employer_contact_email TEXT,
  employer_contact_phone TEXT,
  
  -- Mentor/Journeyworker Information
  mentor_name TEXT,
  mentor_license_number TEXT,
  mentor_years_experience INTEGER,
  
  -- Training Details
  total_hours_required INTEGER NOT NULL DEFAULT 2000,
  related_instruction_hours_required INTEGER NOT NULL DEFAULT 144,
  probationary_period_hours INTEGER DEFAULT 500,
  
  -- Progress Tracking
  ojt_hours_completed INTEGER DEFAULT 0, -- On-the-job training
  rti_hours_completed INTEGER DEFAULT 0, -- Related technical instruction
  last_progress_update DATE,
  
  -- Wage Information
  wage_at_entry DECIMAL(10,2),
  current_wage DECIMAL(10,2),
  wage_schedule JSONB, -- Progressive wage increases
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'suspended')),
  completion_date DATE,
  cancellation_date DATE,
  cancellation_reason TEXT,
  
  -- Credentials
  credential_earned TEXT,
  credential_date DATE,
  state_license_number TEXT,
  state_license_date DATE,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_user ON rapids_apprentices(user_id);
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_program ON rapids_apprentices(program_slug);
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_status ON rapids_apprentices(status);
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_registration ON rapids_apprentices(registration_status);

-- RAPIDS progress updates (for quarterly reporting)
CREATE TABLE IF NOT EXISTS rapids_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID REFERENCES rapids_apprentices(id) ON DELETE CASCADE,
  
  -- Period
  reporting_period TEXT NOT NULL, -- Q1 2026, Q2 2026, etc.
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Hours this period
  ojt_hours_this_period INTEGER DEFAULT 0,
  rti_hours_this_period INTEGER DEFAULT 0,
  
  -- Cumulative totals
  ojt_hours_cumulative INTEGER DEFAULT 0,
  rti_hours_cumulative INTEGER DEFAULT 0,
  
  -- Wage update
  current_wage DECIMAL(10,2),
  wage_increased BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  notes TEXT,
  
  -- Submission tracking
  submitted_to_rapids BOOLEAN DEFAULT false,
  submission_date TIMESTAMPTZ,
  rapids_confirmation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_rapids_progress_apprentice ON rapids_progress_updates(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_rapids_progress_period ON rapids_progress_updates(reporting_period);

-- RAPIDS submissions log (track what was sent to DOL)
CREATE TABLE IF NOT EXISTS rapids_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  submission_type TEXT NOT NULL CHECK (submission_type IN ('registration', 'progress', 'completion', 'cancellation')),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- What was submitted
  apprentice_ids UUID[] NOT NULL,
  record_count INTEGER NOT NULL,
  
  -- Submission details
  submitted_by UUID REFERENCES auth.users(id),
  submission_method TEXT DEFAULT 'manual_portal', -- manual_portal, file_upload
  
  -- File reference if exported
  export_file_url TEXT,
  export_file_name TEXT,
  
  -- Response from RAPIDS
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'partial')),
  rapids_confirmation_number TEXT,
  response_date TIMESTAMPTZ,
  response_notes TEXT,
  errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employer registry for RAPIDS
CREATE TABLE IF NOT EXISTS rapids_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name TEXT NOT NULL,
  dba_name TEXT,
  fein TEXT UNIQUE, -- Federal Employer ID
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Contact
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Business details
  industry_code TEXT, -- NAICS code
  business_type TEXT, -- Sole proprietor, LLC, Corporation, etc.
  employee_count INTEGER,
  
  -- Apprenticeship capacity
  max_apprentices INTEGER,
  current_apprentice_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rapids_employers_fein ON rapids_employers(fein);
CREATE INDEX IF NOT EXISTS idx_rapids_employers_active ON rapids_employers(is_active);

-- RLS Policies
ALTER TABLE rapids_apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_employers ENABLE ROW LEVEL SECURITY;

-- Admin access to all RAPIDS data
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own RAPIDS record
CREATE POLICY "Users can view own RAPIDS record" ON rapids_apprentices
  FOR SELECT USING (user_id = auth.uid());

-- Function to calculate apprentice progress percentage
CREATE OR REPLACE FUNCTION calculate_apprentice_progress(apprentice_id UUID)
RETURNS TABLE (
  ojt_percent NUMERIC,
  rti_percent NUMERIC,
  overall_percent NUMERIC,
  estimated_completion DATE
) AS $$
DECLARE
  apprentice rapids_apprentices%ROWTYPE;
BEGIN
  SELECT * INTO apprentice FROM rapids_apprentices WHERE id = apprentice_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  ojt_percent := ROUND((apprentice.ojt_hours_completed::NUMERIC / NULLIF(apprentice.total_hours_required, 0)) * 100, 1);
  rti_percent := ROUND((apprentice.rti_hours_completed::NUMERIC / NULLIF(apprentice.related_instruction_hours_required, 0)) * 100, 1);
  overall_percent := ROUND(((apprentice.ojt_hours_completed + apprentice.rti_hours_completed)::NUMERIC / 
                           NULLIF(apprentice.total_hours_required + apprentice.related_instruction_hours_required, 0)) * 100, 1);
  
  -- Estimate completion based on average weekly hours (assuming 40 hrs/week OJT)
  IF apprentice.ojt_hours_completed > 0 AND apprentice.registration_date IS NOT NULL THEN
    DECLARE
      weeks_elapsed NUMERIC;
      hours_per_week NUMERIC;
      remaining_hours INTEGER;
      remaining_weeks INTEGER;
    BEGIN
      weeks_elapsed := EXTRACT(EPOCH FROM (NOW() - apprentice.registration_date)) / 604800;
      IF weeks_elapsed > 0 THEN
        hours_per_week := apprentice.ojt_hours_completed / weeks_elapsed;
        remaining_hours := apprentice.total_hours_required - apprentice.ojt_hours_completed;
        IF hours_per_week > 0 THEN
          remaining_weeks := CEIL(remaining_hours / hours_per_week);
          estimated_completion := CURRENT_DATE + (remaining_weeks * 7);
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE rapids_apprentices IS 'Stores apprentice data required for DOL RAPIDS reporting';
COMMENT ON TABLE rapids_progress_updates IS 'Quarterly progress updates for RAPIDS reporting';
COMMENT ON TABLE rapids_submissions IS 'Log of submissions made to DOL RAPIDS portal';
COMMENT ON TABLE rapids_employers IS 'Registry of employers participating in apprenticeship programs';
-- GPS-Enforced Timeclock System for Apprentices
-- Indiana-compliant apprenticeship timekeeping with geofence enforcement

BEGIN;

-- ===========================================
-- PART 1: Add timeclock columns to progress_entries
-- ===========================================

-- Clock in/out timestamps
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS clock_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clock_out_at TIMESTAMPTZ;

-- Lunch tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS lunch_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lunch_end_at TIMESTAMPTZ;

-- Site/geofence tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS site_id UUID,
ADD COLUMN IF NOT EXISTS last_known_lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS last_known_lng DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outside_geofence_since TIMESTAMPTZ;

-- Auto clock-out tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS auto_clocked_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_clock_out_reason TEXT;

-- Weekly cap enforcement
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS max_hours_per_week DECIMAL(5,2) DEFAULT 40.00;

-- ===========================================
-- PART 2: Sites table for geofence definitions
-- ===========================================

CREATE TABLE IF NOT EXISTS apprentice_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  
  -- Geofence center point
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  
  -- Geofence radius in meters
  radius_meters INTEGER NOT NULL DEFAULT 100,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_sites_partner ON apprentice_sites(partner_id);

ALTER TABLE apprentice_sites ENABLE ROW LEVEL SECURITY;

-- Add foreign key from progress_entries to sites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'progress_entries_site_id_fkey'
  ) THEN
    ALTER TABLE progress_entries 
    ADD CONSTRAINT progress_entries_site_id_fkey 
    FOREIGN KEY (site_id) REFERENCES apprentice_sites(id);
  END IF;
END $$;

-- ===========================================
-- PART 3: Geofence check function
-- ===========================================

-- Haversine distance calculation (returns meters)
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$;

-- Check if coordinates are within a site's geofence
CREATE OR REPLACE FUNCTION is_within_geofence(
  p_site_id UUID,
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site apprentice_sites%ROWTYPE;
  v_distance DECIMAL;
BEGIN
  SELECT * INTO v_site FROM apprentice_sites WHERE id = p_site_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  v_distance := calculate_distance_meters(p_lat, p_lng, v_site.latitude, v_site.longitude);
  
  RETURN v_distance <= v_site.radius_meters;
END;
$$;

-- ===========================================
-- PART 4: Update geofence state function
-- ===========================================

CREATE OR REPLACE FUNCTION update_geofence_state(
  p_entry_id UUID,
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS TABLE(
  within_geofence BOOLEAN,
  outside_since TIMESTAMPTZ,
  auto_clocked_out BOOLEAN,
  clock_out_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry progress_entries%ROWTYPE;
  v_within BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Get current entry
  SELECT * INTO v_entry FROM progress_entries WHERE id = p_entry_id;
  
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL THEN
    -- Already clocked out
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, v_entry.auto_clocked_out, v_entry.clock_out_at;
    RETURN;
  END IF;
  
  -- Check geofence
  v_within := is_within_geofence(v_entry.site_id, p_lat, p_lng);
  
  -- Update location
  UPDATE progress_entries SET
    last_known_lat = p_lat,
    last_known_lng = p_lng,
    last_location_at = v_now
  WHERE id = p_entry_id;
  
  IF v_within THEN
    -- Inside geofence - clear outside timer
    UPDATE progress_entries SET outside_geofence_since = NULL WHERE id = p_entry_id;
    RETURN QUERY SELECT true, NULL::TIMESTAMPTZ, false, NULL::TIMESTAMPTZ;
  ELSE
    -- Outside geofence
    IF v_entry.outside_geofence_since IS NULL THEN
      -- Just left - start timer
      UPDATE progress_entries SET outside_geofence_since = v_now WHERE id = p_entry_id;
      RETURN QUERY SELECT false, v_now, false, NULL::TIMESTAMPTZ;
    ELSE
      -- Already outside - check if 15 minutes exceeded
      IF v_now - v_entry.outside_geofence_since >= interval '15 minutes' THEN
        -- Auto clock-out
        UPDATE progress_entries SET
          clock_out_at = v_now,
          auto_clocked_out = true,
          auto_clock_out_reason = 'Left site geofence for more than 15 minutes',
          hours_worked = EXTRACT(EPOCH FROM (v_now - clock_in_at)) / 3600.0
        WHERE id = p_entry_id;
        
        RETURN QUERY SELECT false, v_entry.outside_geofence_since, true, v_now;
      ELSE
        -- Still in grace period
        RETURN QUERY SELECT false, v_entry.outside_geofence_since, false, NULL::TIMESTAMPTZ;
      END IF;
    END IF;
  END IF;
END;
$$;

-- ===========================================
-- PART 5: Auto clock-out check function
-- ===========================================

CREATE OR REPLACE FUNCTION auto_clock_out_if_needed(p_entry_id UUID)
RETURNS TABLE(
  was_clocked_out BOOLEAN,
  clock_out_at TIMESTAMPTZ,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry progress_entries%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_entry FROM progress_entries WHERE id = p_entry_id;
  
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_entry.clock_out_at, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if outside geofence for 15+ minutes
  IF v_entry.outside_geofence_since IS NOT NULL 
     AND v_now - v_entry.outside_geofence_since >= interval '15 minutes' THEN
    
    UPDATE progress_entries SET
      clock_out_at = v_now,
      auto_clocked_out = true,
      auto_clock_out_reason = 'Left site geofence for more than 15 minutes',
      hours_worked = EXTRACT(EPOCH FROM (v_now - clock_in_at)) / 3600.0
    WHERE id = p_entry_id;
    
    RETURN QUERY SELECT true, v_now, 'Left site geofence for more than 15 minutes'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$$;

-- ===========================================
-- PART 6: Hours derivation trigger
-- ===========================================

CREATE OR REPLACE FUNCTION derive_hours_worked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lunch_duration INTERVAL;
BEGIN
  -- Only calculate if both clock in and out are set
  IF NEW.clock_in_at IS NOT NULL AND NEW.clock_out_at IS NOT NULL THEN
    -- Calculate lunch duration if taken
    IF NEW.lunch_start_at IS NOT NULL AND NEW.lunch_end_at IS NOT NULL THEN
      v_lunch_duration := NEW.lunch_end_at - NEW.lunch_start_at;
    ELSE
      v_lunch_duration := interval '0';
    END IF;
    
    -- Derive hours worked (total time minus lunch)
    NEW.hours_worked := EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at - v_lunch_duration)) / 3600.0;
    
    -- Ensure non-negative
    IF NEW.hours_worked < 0 THEN
      NEW.hours_worked := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_derive_hours_worked ON progress_entries;
CREATE TRIGGER trigger_derive_hours_worked
BEFORE INSERT OR UPDATE ON progress_entries
FOR EACH ROW
EXECUTE FUNCTION derive_hours_worked();

-- ===========================================
-- PART 7: Weekly cap enforcement
-- ===========================================

CREATE OR REPLACE FUNCTION get_weekly_hours(
  p_apprentice_id UUID,
  p_week_ending DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(hours_worked), 0) INTO v_total
  FROM progress_entries
  WHERE apprentice_id = p_apprentice_id
    AND week_ending = p_week_ending
    AND clock_out_at IS NOT NULL;
  
  RETURN v_total;
END;
$$;

-- ===========================================
-- PART 8: RLS policies for sites
-- ===========================================

-- Partners can view their own sites
CREATE POLICY "Partner users can view own sites"
  ON apprentice_sites FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admins can manage sites
CREATE POLICY "Admins can manage sites"
  ON apprentice_sites FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ===========================================
-- PART 9: Indexes for performance
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_progress_entries_clock_in ON progress_entries(clock_in_at);
CREATE INDEX IF NOT EXISTS idx_progress_entries_clock_out ON progress_entries(clock_out_at);
CREATE INDEX IF NOT EXISTS idx_progress_entries_site ON progress_entries(site_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_auto_clocked ON progress_entries(auto_clocked_out) WHERE auto_clocked_out = true;

COMMIT;
-- Timeclock Schema Updates
-- Adds user linkage to apprentices and creates dedicated timeclock_shifts table

-- 1. Add user_id to apprentices for auth linkage
ALTER TABLE apprentices 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_apprentices_user_id 
ON apprentices(user_id) WHERE user_id IS NOT NULL;

-- 2. Create dedicated timeclock_shifts table
CREATE TABLE IF NOT EXISTS timeclock_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES apprentice_sites(id),
  
  -- Clock times
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  
  -- Lunch break
  lunch_start_at TIMESTAMPTZ,
  lunch_end_at TIMESTAMPTZ,
  
  -- Geofence verification
  clock_in_lat DECIMAL(10,8),
  clock_in_lng DECIMAL(11,8),
  clock_in_within_geofence BOOLEAN DEFAULT false,
  clock_out_lat DECIMAL(10,8),
  clock_out_lng DECIMAL(11,8),
  clock_out_within_geofence BOOLEAN,
  
  -- Computed hours (updated on clock out)
  total_hours DECIMAL(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_apprentice ON timeclock_shifts(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_site ON timeclock_shifts(site_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_active ON timeclock_shifts(apprentice_id) WHERE clock_out_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_date ON timeclock_shifts(clock_in_at);

-- Enable RLS
ALTER TABLE timeclock_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Apprentices can view their own shifts
CREATE POLICY "Apprentices can view own shifts"
  ON timeclock_shifts FOR SELECT
  USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Apprentices can insert their own shifts (clock in)
CREATE POLICY "Apprentices can clock in"
  ON timeclock_shifts FOR INSERT
  WITH CHECK (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Apprentices can update their own active shifts (clock out, lunch)
CREATE POLICY "Apprentices can update own shifts"
  ON timeclock_shifts FOR UPDATE
  USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Admins/staff can manage all shifts
CREATE POLICY "Admins can manage all shifts"
  ON timeclock_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access timeclock_shifts"
  ON timeclock_shifts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timeclock_shift_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Calculate total hours on clock out
  IF NEW.clock_out_at IS NOT NULL AND OLD.clock_out_at IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at)) / 3600.0;
    -- Subtract lunch if taken
    IF NEW.lunch_start_at IS NOT NULL AND NEW.lunch_end_at IS NOT NULL THEN
      NEW.total_hours = NEW.total_hours - (EXTRACT(EPOCH FROM (NEW.lunch_end_at - NEW.lunch_start_at)) / 3600.0);
    END IF;
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timeclock_shifts_updated_at
  BEFORE UPDATE ON timeclock_shifts
  FOR EACH ROW EXECUTE FUNCTION update_timeclock_shift_updated_at();
-- Funding & Apprenticeship Intake table
-- Screens applicants, tags funding eligibility (JRI, self-pay, workforce),
-- stores leads for submission to Employer Indy and workforce partners.

-- funding_tag values: jri, wioa, wrg, self-pay, pending-review
create table if not exists public.apprenticeship_intake (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  city text,
  state text default 'IN',
  program_interest text default 'barbering',
  employment_status text,
  funding_needed boolean default true,
  workforce_connection text,
  referral_source text,
  probation_or_reentry boolean default false,
  preferred_location text,
  notes text,
  status text default 'new',
  funding_tag text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for admin queries
create index if not exists idx_intake_status on public.apprenticeship_intake(status);
create index if not exists idx_intake_funding on public.apprenticeship_intake(funding_tag);
create index if not exists idx_intake_created on public.apprenticeship_intake(created_at desc);

-- RLS: only service role can insert/read (API route uses admin client)
alter table public.apprenticeship_intake enable row level security;
