-- =====================================================
-- CREATE MISSING TABLES FOR FEATURE CONNECTIONS
-- Date: December 27, 2024
-- Purpose: Add tables needed for existing UI features
-- =====================================================

-- Enable RLS on all new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

-- =====================================================
-- STAFF PORTAL TABLES
-- =====================================================

-- Customer Service Tickets
CREATE TABLE IF NOT EXISTS customer_service_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_student ON customer_service_tickets(student_id);
CREATE INDEX idx_tickets_staff ON customer_service_tickets(staff_id);
CREATE INDEX idx_tickets_status ON customer_service_tickets(status);

-- QA Checklists
CREATE TABLE IF NOT EXISTS qa_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA Checklist Completions
CREATE TABLE IF NOT EXISTS qa_checklist_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES qa_checklists(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES profiles(id),
  entity_type TEXT, -- 'enrollment', 'course', 'student', etc.
  entity_id UUID,
  items_completed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qa_completions_checklist ON qa_checklist_completions(checklist_id);
CREATE INDEX idx_qa_completions_entity ON qa_checklist_completions(entity_type, entity_id);

-- Staff Processes
CREATE TABLE IF NOT EXISTS staff_processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processes_category ON staff_processes(category);

-- =====================================================
-- EMPLOYER PORTAL TABLES
-- =====================================================

-- Employers
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employers_status ON employers(status);
CREATE INDEX idx_employers_industry ON employers(industry);

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  salary_range TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  location TEXT,
  remote_allowed BOOLEAN DEFAULT FALSE,
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'apprenticeship')),
  experience_level TEXT,
  education_required TEXT,
  skills_required TEXT[],
  benefits TEXT,
  application_deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'filled', 'closed')),
  posted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_postings_employer ON job_postings(employer_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_type ON job_postings(job_type);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'interview', 'offered', 'accepted', 'rejected')),
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_student ON job_applications(student_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- Apprenticeships
CREATE TABLE IF NOT EXISTS apprenticeships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  wage_progression JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  benefits TEXT,
  mentor_assigned UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'filled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apprenticeships_employer ON apprenticeships(employer_id);
CREATE INDEX idx_apprenticeships_program ON apprenticeships(program_id);
CREATE INDEX idx_apprenticeships_status ON apprenticeships(status);

-- Apprenticeship Enrollments
CREATE TABLE IF NOT EXISTS apprenticeship_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  current_wage DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apprenticeship_enrollments_apprenticeship ON apprenticeship_enrollments(apprenticeship_id);
CREATE INDEX idx_apprenticeship_enrollments_student ON apprenticeship_enrollments(student_id);

-- =====================================================
-- PAYROLL TABLES
-- =====================================================

-- Payroll Profiles
CREATE TABLE IF NOT EXISTS payroll_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bank_name TEXT,
  account_type TEXT CHECK (account_type IN ('checking', 'savings')),
  routing_number TEXT,
  account_number_encrypted TEXT, -- Should be encrypted at application level
  tax_withholding JSONB DEFAULT '{}'::jsonb,
  direct_deposit_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_profiles_user ON payroll_profiles(user_id);

-- =====================================================
-- CRM TABLES
-- =====================================================

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  source TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  assigned_to UUID REFERENCES profiles(id),
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_assigned ON crm_contacts(assigned_to);

-- CRM Interactions
CREATE TABLE IF NOT EXISTS crm_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  subject TEXT,
  notes TEXT,
  outcome TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_interactions_contact ON crm_interactions(contact_id);
CREATE INDEX idx_crm_interactions_user ON crm_interactions(user_id);
CREATE INDEX idx_crm_interactions_type ON crm_interactions(type);

-- =====================================================
-- TAX SERVICES TABLES
-- =====================================================

-- Tax Filings
CREATE TABLE IF NOT EXISTS tax_filings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_type TEXT CHECK (filing_type IN ('federal', 'state', 'both')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'filed', 'accepted', 'rejected')),
  preparer_id UUID REFERENCES profiles(id),
  vita_site TEXT,
  filing_date DATE,
  refund_amount DECIMAL(10,2),
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_filings_student ON tax_filings(student_id);
CREATE INDEX idx_tax_filings_year ON tax_filings(tax_year);
CREATE INDEX idx_tax_filings_status ON tax_filings(status);

-- VITA Appointments
CREATE TABLE IF NOT EXISTS vita_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  site_location TEXT,
  preparer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vita_appointments_student ON vita_appointments(student_id);
CREATE INDEX idx_vita_appointments_date ON vita_appointments(appointment_date);
CREATE INDEX idx_vita_appointments_status ON vita_appointments(status);

-- =====================================================
-- SHOP SYSTEM TABLES
-- =====================================================

-- Shop Reports
CREATE TABLE IF NOT EXISTS shop_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID, -- Reference to shop/program_holder
  submitted_by UUID REFERENCES profiles(id),
  report_type TEXT,
  report_period_start DATE,
  report_period_end DATE,
  data JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_reports_shop ON shop_reports(shop_id);
CREATE INDEX idx_shop_reports_submitted_by ON shop_reports(submitted_by);
CREATE INDEX idx_shop_reports_status ON shop_reports(status);

-- =====================================================
-- CALENDAR TABLES
-- =====================================================

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  duration INTEGER DEFAULT 60, -- in minutes
  color TEXT DEFAULT '#3b82f6',
  event_type TEXT CHECK (event_type IN ('class', 'assignment', 'exam', 'meeting', 'personal', 'other')),
  location TEXT,
  reminder_minutes INTEGER,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- =====================================================
-- COMPLIANCE TABLES
-- =====================================================

-- FERPA Training Records
CREATE TABLE IF NOT EXISTS ferpa_training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  training_date DATE NOT NULL,
  completion_date DATE,
  score INTEGER,
  certificate_url TEXT,
  expires_at DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ferpa_training_user ON ferpa_training_records(user_id);
CREATE INDEX idx_ferpa_training_status ON ferpa_training_records(status);

-- Document Signatures
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL,
  document_id UUID,
  signer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  signature_data TEXT, -- Base64 encoded signature image
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_signatures_document ON document_signatures(document_type, document_id);
CREATE INDEX idx_document_signatures_signer ON document_signatures(signer_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE customer_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprenticeships ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprenticeship_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vita_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BASIC RLS POLICIES (Can be refined later)
-- =====================================================

-- Staff can see all tickets
CREATE POLICY "Staff can view all tickets" ON customer_service_tickets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Students can see their own tickets
CREATE POLICY "Students can view own tickets" ON customer_service_tickets
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Staff can create tickets
CREATE POLICY "Staff can create tickets" ON customer_service_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins can manage QA checklists
CREATE POLICY "Admins can manage QA checklists" ON qa_checklists
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Staff can view processes
CREATE POLICY "Staff can view processes" ON staff_processes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Public can view active job postings
CREATE POLICY "Public can view active job postings" ON job_postings
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Students can view their own applications
CREATE POLICY "Students can view own applications" ON job_applications
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Students can create applications
CREATE POLICY "Students can create applications" ON job_applications
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Users can view their own payroll profile
CREATE POLICY "Users can view own payroll" ON payroll_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own payroll profile
CREATE POLICY "Users can update own payroll" ON payroll_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Staff can view CRM contacts
CREATE POLICY "Staff can view CRM contacts" ON crm_contacts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Students can view their own tax filings
CREATE POLICY "Students can view own tax filings" ON tax_filings
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Users can view their own FERPA training
CREATE POLICY "Users can view own FERPA training" ON ferpa_training_records
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can view their own signatures
CREATE POLICY "Users can view own signatures" ON document_signatures
  FOR SELECT TO authenticated
  USING (signer_id = auth.uid());

-- Users can manage their own calendar events
CREATE POLICY "Users can manage own calendar events" ON calendar_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_service_tickets_updated_at BEFORE UPDATE ON customer_service_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_checklists_updated_at BEFORE UPDATE ON qa_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_processes_updated_at BEFORE UPDATE ON staff_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON employers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apprenticeships_updated_at BEFORE UPDATE ON apprenticeships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apprenticeship_enrollments_updated_at BEFORE UPDATE ON apprenticeship_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_profiles_updated_at BEFORE UPDATE ON payroll_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at BEFORE UPDATE ON tax_filings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vita_appointments_updated_at BEFORE UPDATE ON vita_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_reports_updated_at BEFORE UPDATE ON shop_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ferpa_training_records_updated_at BEFORE UPDATE ON ferpa_training_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
