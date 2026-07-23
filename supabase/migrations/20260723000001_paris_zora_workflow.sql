-- PARIS–ZORA Application Workflow System
-- Elevate for Humanity - Student Admissions Lifecycle
-- 
-- This migration creates the core workflow infrastructure for:
-- - PARIS: Student-facing admissions journey
-- - ZORA: Operations and governance layer
--
-- Marketing Apply → PARIS intake → ZORA validation → Digital binder → 
-- Funding → Admissions decision → Signatures/Payment → LMS enrollment

BEGIN;

-- ============================================
-- ENUMS
-- ============================================

-- Application workflow status
CREATE TYPE IF NOT EXISTS application_workflow_status AS ENUM (
  'DRAFT',
  'ELIGIBILITY_REVIEW',
  'DOCUMENTS_REQUIRED',
  'FUNDING_REVIEW',
  'ADMISSIONS_REVIEW',
  'CONDITIONALLY_ACCEPTED',
  'ACCEPTED',
  'PAYMENT_REQUIRED',
  'READY_TO_ENROLL',
  'ENROLLED',
  'WAITLISTED',
  'REFERRED',
  'REJECTED',
  'WITHDRAWN'
);

-- Application type
CREATE TYPE IF NOT EXISTS application_workflow_type AS ENUM (
  'STUDENT',
  'APPRENTICE',
  'TESTING_CANDIDATE'
);

-- Funding types
CREATE TYPE IF NOT EXISTS funding_type AS ENUM (
  'WIOA',
  'WORKFORCE_READY_GRANT',
  'VOCATIONAL_REHABILITATION',
  'EMPLOYER_SPONSORSHIP',
  'APPRENTICESHIP',
  'GRANT',
  'SELF_PAY',
  'BNPL',
  'PAYMENT_PLAN',
  'OTHER'
);

-- Funding case status
CREATE TYPE IF NOT EXISTS funding_case_status AS ENUM (
  'NOT_STARTED',
  'SCREENING',
  'DOCUMENTS_REQUIRED',
  'SUBMITTED',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'DENIED',
  'EXPIRED'
);

-- Document status
CREATE TYPE IF NOT EXISTS application_document_status AS ENUM (
  'REQUIRED',
  'REQUESTED',
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'WAIVED'
);

-- Admissions decision
CREATE TYPE IF NOT EXISTS admissions_decision AS ENUM (
  'PENDING',
  'CONDITIONAL_ACCEPTANCE',
  'ACCEPTED',
  'WAITLISTED',
  'REFERRED',
  'REJECTED'
);

-- Workflow actor type
CREATE TYPE IF NOT EXISTS workflow_actor_type AS ENUM (
  'APPLICANT',
  'PARIS',
  'ZORA',
  'RECRUITER',
  'ADMISSIONS',
  'FINANCE',
  'COMPLIANCE',
  'PROGRAM_HOLDER',
  'SYSTEM'
);

-- Task status
CREATE TYPE IF NOT EXISTS workflow_task_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED'
);

-- Task priority
CREATE TYPE IF NOT EXISTS workflow_task_priority AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- ============================================
-- PARIS_APPLICATIONS
-- Core application record for the workflow
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_applications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number      TEXT UNIQUE NOT NULL,
  applicant_id            UUID NOT NULL,  -- References auth.users or profile
  
  program_id              UUID NOT NULL,  -- References programs table
  program_slug            TEXT,
  
  application_type        application_workflow_type DEFAULT 'STUDENT',
  workflow_status         application_workflow_status DEFAULT 'DRAFT',
  admissions_decision     admissions_decision DEFAULT 'PENDING',

  -- Personal information
  first_name              TEXT NOT NULL,
  middle_name             TEXT,
  last_name               TEXT NOT NULL,
  date_of_birth           DATE,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  
  -- Address
  address_line_1          TEXT,
  address_line_2          TEXT,
  city                    TEXT,
  state                   TEXT,
  postal_code             TEXT,

  -- Education & Employment
  highest_education       TEXT,
  employment_status       TEXT,
  preferred_schedule      TEXT,
  desired_start_date      DATE,
  career_goal             TEXT,
  barriers                JSONB DEFAULT '[]',

  -- Eligibility
  eligibility_answers     JSONB DEFAULT '{}',
  eligibility_score       INTEGER DEFAULT 0,
  risk_score              INTEGER DEFAULT 0,

  -- Source tracking
  source                  TEXT DEFAULT 'direct',
  referral_code           TEXT,

  -- Staff assignment
  assigned_recruiter_id   UUID,
  assigned_at             TIMESTAMPTZ,

  -- Lifecycle timestamps
  submitted_at            TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  enrolled_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata                JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (char_length(phone) >= 10)
);

-- Indexes
CREATE INDEX idx_paris_applications_applicant ON public.paris_applications (applicant_id);
CREATE INDEX idx_paris_applications_program ON public.paris_applications (program_id);
CREATE INDEX idx_paris_applications_status ON public.paris_applications (workflow_status);
CREATE INDEX idx_paris_applications_recruiter ON public.paris_applications (assigned_recruiter_id);
CREATE INDEX idx_paris_applications_created ON public.paris_applications (created_at DESC);
CREATE INDEX idx_paris_applications_number ON public.paris_applications (application_number);

-- ============================================
-- PARIS_APPLICATION_DOCUMENTS
-- Digital binder tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_application_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  requirement_code    TEXT NOT NULL,  -- e.g., 'PHOTO_ID', 'WIOA_INCOME'
  document_type       TEXT NOT NULL,  -- e.g., 'IDENTITY', 'EDUCATION', 'FUNDING'
  display_name        TEXT NOT NULL,
  
  status              application_document_status DEFAULT 'REQUIRED',
  
  -- File storage
  storage_key         TEXT,
  file_name           TEXT,
  mime_type           TEXT,
  size_bytes          INTEGER,
  
  -- Review tracking
  rejection_reason    TEXT,
  reviewed_by_id      UUID,
  reviewed_at         TIMESTAMPTZ,
  uploaded_at         TIMESTAMPTZ,
  expiration_date     DATE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id, requirement_code)
);

-- Indexes
CREATE INDEX idx_paris_docs_application ON public.paris_application_documents (application_id);
CREATE INDEX idx_paris_docs_status ON public.paris_application_documents (status);
CREATE INDEX idx_paris_docs_application_status ON public.paris_application_documents (application_id, status);

-- ============================================
-- PARIS_FUNDING_CASES
-- Funding applications and tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_funding_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  funding_type        funding_type NOT NULL,
  status              funding_case_status DEFAULT 'NOT_STARTED',
  
  -- Financial
  requested_amount    DECIMAL(10,2),
  approved_amount     DECIMAL(10,2),
  student_balance     DECIMAL(10,2),
  
  -- External references
  external_reference  TEXT,  -- WIOA case number, WRG application ID, etc.
  
  -- Eligibility
  eligibility_result  JSONB,
  denial_reason       TEXT,
  
  -- Dates
  expiration_date     DATE,
  submitted_at        TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paris_funding_application ON public.paris_funding_cases (application_id);
CREATE INDEX idx_paris_funding_status ON public.paris_funding_cases (status);
CREATE INDEX idx_paris_funding_type ON public.paris_funding_cases (funding_type);

-- ============================================
-- PARIS_WORKFLOW_TASKS
-- ZORA task management
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_workflow_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  task_type           TEXT NOT NULL,  -- e.g., 'COMPLETE_APPLICATION', 'RECRUITER_REVIEW'
  title               TEXT NOT NULL,
  description         TEXT,
  
  -- Assignment
  assigned_role       TEXT,  -- e.g., 'APPLICANT', 'RECRUITER', 'ADMISSIONS'
  assigned_user_id    UUID,
  
  -- Priority & Status
  priority            workflow_task_priority DEFAULT 'NORMAL',
  status              workflow_task_status DEFAULT 'OPEN',
  
  -- Due dates
  due_at              TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  
  -- Metadata
  metadata            JSONB DEFAULT '{}',
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paris_tasks_application ON public.paris_workflow_tasks (application_id);
CREATE INDEX idx_paris_tasks_status ON public.paris_workflow_tasks (status);
CREATE INDEX idx_paris_tasks_user ON public.paris_workflow_tasks (assigned_user_id, status);
CREATE INDEX idx_paris_tasks_role ON public.paris_workflow_tasks (assigned_role, status);
CREATE INDEX idx_paris_tasks_due ON public.paris_workflow_tasks (due_at) WHERE status IN ('OPEN', 'IN_PROGRESS');

-- ============================================
-- PARIS_WORKFLOW_EVENTS
-- Immutable audit log
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_workflow_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  event_type          TEXT NOT NULL,  -- e.g., 'application.created', 'document.uploaded'
  actor_type          workflow_actor_type NOT NULL,
  actor_id            UUID,
  
  -- State change tracking
  previous_status     application_workflow_status,
  new_status          application_workflow_status,
  
  -- Event payload
  payload             JSONB DEFAULT '{}',
  
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paris_events_application ON public.paris_workflow_events (application_id);
CREATE INDEX idx_paris_events_type ON public.paris_workflow_events (event_type);
CREATE INDEX idx_paris_events_created ON public.paris_workflow_events (application_id, created_at DESC);

-- ============================================
-- PARIS_APPLICATION_NOTES
-- Staff notes and communication log
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_application_notes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  author_id           UUID NOT NULL,
  body                TEXT NOT NULL,
  
  is_internal         BOOLEAN DEFAULT TRUE,  -- vs visible to applicant
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paris_notes_application ON public.paris_application_notes (application_id);

-- ============================================
-- PARIS_APPLICATION_DECISIONS
-- Admissions decisions with audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_application_decisions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  decision            admissions_decision NOT NULL,
  reason              TEXT,
  conditions          JSONB DEFAULT '[]',  -- Array of conditions for conditional acceptance
  
  decided_by_id       UUID NOT NULL,
  decided_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paris_decisions_application ON public.paris_application_decisions (application_id);

-- ============================================
-- PARIS_APPLICATION_ENROLLMENTS
-- Tracks LMS enrollment after acceptance
-- ============================================
CREATE TABLE IF NOT EXISTS public.paris_application_enrollments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES public.paris_applications(id) ON DELETE CASCADE,
  
  -- External references
  enrollment_id       TEXT UNIQUE,  -- LMS enrollment ID
  lms_user_id        TEXT,
  student_dashboard_id TEXT,
  apprentice_record_id TEXT,  -- For apprenticeship programs
  
  -- Enrollment details
  enrolled_by_id      UUID NOT NULL,
  enrollment_payload  JSONB DEFAULT '{}',
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate application number
CREATE OR REPLACE FUNCTION public.generate_paris_application_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  random_part TEXT;
BEGIN
  year_prefix := to_char(NOW(), 'YYYY');
  random_part := upper(substr(replacereplacereplace(replace(replace(gen_random_uuid()::text, '-', ''), 'a', ''), 'b', ''), 'c', ''), 'd', ''), 'e', ''), 'f', ''), 1, 8));
  RETURN 'EFH-' || year_prefix || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_paris_applications_updated_at
  BEFORE UPDATE ON public.paris_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paris_application_documents_updated_at
  BEFORE UPDATE ON public.paris_application_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paris_funding_cases_updated_at
  BEFORE UPDATE ON public.paris_funding_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paris_workflow_tasks_updated_at
  BEFORE UPDATE ON public.paris_workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paris_application_notes_updated_at
  BEFORE UPDATE ON public.paris_application_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paris_application_enrollments_updated_at
  BEFORE UPDATE ON public.paris_application_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.paris_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_funding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_application_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paris_application_enrollments ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is admin/staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('admin', 'super_admin', 'staff', 'admissions', 'recruiter')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARIS Applications Policies
-- Applicants can view their own applications
CREATE POLICY "paris_applications_applicant_select" ON public.paris_applications
  FOR SELECT USING (applicant_id = auth.uid());

-- Applicants can insert their own applications
CREATE POLICY "paris_applications_applicant_insert" ON public.paris_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- Applicants can update their own DRAFT applications
CREATE POLICY "paris_applications_applicant_update" ON public.paris_applications
  FOR UPDATE USING (applicant_id = auth.uid() AND workflow_status = 'DRAFT');

-- Staff can view all applications
CREATE POLICY "paris_applications_staff_select" ON public.paris_applications
  FOR SELECT USING (is_admin_or_staff(auth.uid()));

-- Staff can update applications
CREATE POLICY "paris_applications_staff_update" ON public.paris_applications
  FOR UPDATE USING (is_admin_or_staff(auth.uid()));

-- Paris Application Documents Policies
CREATE POLICY "paris_docs_applicant_select" ON public.paris_application_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_docs_applicant_insert" ON public.paris_application_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_docs_staff_select" ON public.paris_application_documents
  FOR SELECT USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "paris_docs_staff_all" ON public.paris_application_documents
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Paris Funding Cases Policies
CREATE POLICY "paris_funding_applicant_select" ON public.paris_funding_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_funding_staff_all" ON public.paris_funding_cases
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Paris Workflow Tasks Policies
CREATE POLICY "paris_tasks_applicant_select" ON public.paris_workflow_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_tasks_staff_all" ON public.paris_workflow_tasks
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Paris Workflow Events - Read only for audit
CREATE POLICY "paris_events_applicant_select" ON public.paris_workflow_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_events_staff_select" ON public.paris_workflow_events
  FOR SELECT USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "paris_events_staff_insert" ON public.paris_workflow_events
  FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));

-- Paris Application Notes Policies
CREATE POLICY "paris_notes_applicant_select_internal" ON public.paris_application_notes
  FOR SELECT USING (
    applicant_id = auth.uid() OR NOT is_internal
  );

CREATE POLICY "paris_notes_staff_all" ON public.paris_application_notes
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Paris Application Decisions - Read only for applicants
CREATE POLICY "paris_decisions_applicant_select" ON public.paris_application_decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_decisions_staff_all" ON public.paris_application_decisions
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Paris Application Enrollments Policies
CREATE POLICY "paris_enrollments_applicant_select" ON public.paris_application_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paris_applications
      WHERE id = application_id AND applicant_id = auth.uid()
    )
  );

CREATE POLICY "paris_enrollments_staff_all" ON public.paris_application_enrollments
  FOR ALL USING (is_admin_or_staff(auth.uid()));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.paris_applications IS 'PARIS student application workflow - core record';
COMMENT ON TABLE public.paris_application_documents IS 'PARIS digital binder - document tracking';
COMMENT ON TABLE public.paris_funding_cases IS 'PARIS funding applications - per funding source';
COMMENT ON TABLE public.paris_workflow_tasks IS 'ZORA task management - automated and manual tasks';
COMMENT ON TABLE public.paris_workflow_events IS 'PARIS/ZORA immutable audit log';
COMMENT ON TABLE public.paris_application_notes IS 'Staff notes and applicant communication';
COMMENT ON TABLE public.paris_application_decisions IS 'Admissions decisions with conditions';
COMMENT ON TABLE public.paris_application_enrollments IS 'LMS enrollment tracking after acceptance';

COMMIT;
