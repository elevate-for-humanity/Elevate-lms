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

ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS token TEXT;
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
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql] CREATE TABLE IF NOT EXISTS apprentice_assignments (
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   apprentice_application_id UUID NOT NULL,
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   host_shop_application_id UUID NOT NULL,
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   start_date DATE NOT NULL,
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   end_date DATE,
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql]   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- [DUPLICATE: canonical in 20260101000001_barber_hvac_reference.sql] );

-- 6. Hour Entries (source-aware, auditable ledger)
CREATE TABLE IF NOT EXISTS hour_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL,
  host_shop_application_id UUID,
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
  apprentice_application_id UUID NOT NULL,
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
  apprentice_application_id UUID NOT NULL,
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
  apprentice_application_id UUID NOT NULL,
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

ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes INT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type, owner_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(verified);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 7. Transfer Requests
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_application_id UUID NOT NULL,
  from_host_shop_application_id UUID,
  to_host_shop_application_id UUID,
  requested_by_email TEXT NOT NULL,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
ALTER TABLE apprentice_applications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_apprentice_applications_status ON apprentice_applications(status);
ALTER TABLE apprentice_applications ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_apprentice_applications_email ON apprentice_applications(email);
ALTER TABLE host_shop_applications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_status ON host_shop_applications(status);
ALTER TABLE host_shop_applications ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_email ON host_shop_applications(email);
ALTER TABLE apprentice_assignments ADD COLUMN IF NOT EXISTS apprentice_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_apprentice ON apprentice_assignments(apprentice_application_id);
ALTER TABLE apprentice_assignments ADD COLUMN IF NOT EXISTS host_shop_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_shop ON apprentice_assignments(host_shop_application_id);
ALTER TABLE hour_entries ADD COLUMN IF NOT EXISTS apprentice_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_hour_entries_apprentice ON hour_entries(apprentice_application_id);
ALTER TABLE hour_entries ADD COLUMN IF NOT EXISTS host_shop_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_hour_entries_shop ON hour_entries(host_shop_application_id);
ALTER TABLE hour_entries ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_hour_entries_status ON hour_entries(status);
ALTER TABLE hour_entries ADD COLUMN IF NOT EXISTS source_type TEXT;
CREATE INDEX IF NOT EXISTS idx_hour_entries_source_type ON hour_entries(source_type);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_subject ON agreement_acceptances(subject_type, subject_id);
ALTER TABLE transfer_hour_submissions ADD COLUMN IF NOT EXISTS apprentice_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_transfer_submissions_apprentice ON transfer_hour_submissions(apprentice_application_id);
ALTER TABLE transfer_hour_submissions ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_transfer_submissions_status ON transfer_hour_submissions(status);
ALTER TABLE licensure_exam_events ADD COLUMN IF NOT EXISTS apprentice_application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_exam_events_apprentice ON licensure_exam_events(apprentice_application_id);
ALTER TABLE continuing_education_hours ADD COLUMN IF NOT EXISTS apprentice_application_id TEXT;
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
DROP POLICY IF EXISTS "Public can insert inquiries" ON inquiries;
CREATE POLICY "Public can insert inquiries" ON inquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Public can INSERT applications
DROP POLICY IF EXISTS "Public can insert apprentice applications" ON apprentice_applications;
CREATE POLICY "Public can insert apprentice applications" ON apprentice_applications
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert host shop applications" ON host_shop_applications;
CREATE POLICY "Public can insert host shop applications" ON host_shop_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Public can INSERT agreement acceptances
DROP POLICY IF EXISTS "Public can insert agreement acceptances" ON agreement_acceptances;
CREATE POLICY "Public can insert agreement acceptances" ON agreement_acceptances
  FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (for admin operations)
DROP POLICY IF EXISTS "Service role full access inquiries" ON inquiries;
CREATE POLICY "Service role full access inquiries" ON inquiries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access apprentice_applications" ON apprentice_applications;
CREATE POLICY "Service role full access apprentice_applications" ON apprentice_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access host_shop_applications" ON host_shop_applications;
CREATE POLICY "Service role full access host_shop_applications" ON host_shop_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access agreement_acceptances" ON agreement_acceptances;
CREATE POLICY "Service role full access agreement_acceptances" ON agreement_acceptances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access apprentice_assignments" ON apprentice_assignments;
CREATE POLICY "Service role full access apprentice_assignments" ON apprentice_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access hour_entries" ON hour_entries;
CREATE POLICY "Service role full access hour_entries" ON hour_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access transfer_requests" ON transfer_requests;
CREATE POLICY "Service role full access transfer_requests" ON transfer_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access access_tokens" ON access_tokens;
CREATE POLICY "Service role full access access_tokens" ON access_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access transfer_hour_submissions" ON transfer_hour_submissions;
CREATE POLICY "Service role full access transfer_hour_submissions" ON transfer_hour_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access licensure_exam_events" ON licensure_exam_events;
CREATE POLICY "Service role full access licensure_exam_events" ON licensure_exam_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access continuing_education_hours" ON continuing_education_hours;
CREATE POLICY "Service role full access continuing_education_hours" ON continuing_education_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public can insert transfer submissions (via token)
DROP POLICY IF EXISTS "Public can insert transfer submissions" ON transfer_hour_submissions;
CREATE POLICY "Public can insert transfer submissions" ON transfer_hour_submissions
  FOR INSERT TO anon WITH CHECK (true);

-- Public can insert CE hours (via token)
DROP POLICY IF EXISTS "Public can insert CE hours" ON continuing_education_hours;
CREATE POLICY "Public can insert CE hours" ON continuing_education_hours
  FOR INSERT TO anon WITH CHECK (true);

-- Documents RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert documents" ON documents;
CREATE POLICY "Public can insert documents" ON documents
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access documents" ON documents;
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
