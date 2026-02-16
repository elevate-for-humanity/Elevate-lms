-- ============================================================================
-- BASELINE MIGRATION
-- ============================================================================
-- This is a placeholder baseline migration.
-- 
-- The database schema was created manually/via Supabase dashboard before
-- migrations were properly set up. All 428 tables already exist with RLS.
--
-- This migration marks the baseline state. Future migrations should be
-- incremental changes from this point forward.
--
-- To generate a full schema dump, run:
--   npx supabase db dump --schema public > supabase/schema.sql
--
-- Created: 2026-01-23
-- Tables: 428
-- RLS Policies: 428 tables covered
-- ============================================================================

-- No-op to mark baseline
SELECT 1;
-- ============================================================
-- ELEVATE FOR HUMANITY - BARBER + HVAC REFERENCE IMPLEMENTATION
-- This is the canonical schema. All programs must conform.
-- ============================================================

-- ============ CORE IDENTITY ============

-- Profiles (extends auth.users)
-- Already exists, ensure required fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- ============ PROGRAMS ============

-- Ensure programs table has all required fields
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS total_hours INTEGER;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS tuition DECIMAL(10,2);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS funding_eligible BOOLEAN DEFAULT true;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived'));
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS requirements JSONB;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS eligibility_rules JSONB;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============ INTAKES (Marketing Lead Capture) ============
-- AT-02: General Inquiry must create intake record

CREATE TABLE IF NOT EXISTS public.intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'website',
  source_page TEXT,
  program_interest TEXT,
  program_id UUID REFERENCES public.programs(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  converted_to_application_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intakes_status ON public.intakes(status);
CREATE INDEX IF NOT EXISTS idx_intakes_program ON public.intakes(program_id);
CREATE INDEX IF NOT EXISTS idx_intakes_email ON public.intakes(email);

-- ============ APPLICATIONS ============
-- AT-03: Enrollment Application must create application record

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS intake_id UUID REFERENCES public.intakes(id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'enrolled', 'withdrawn'));
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS eligibility_data JSONB;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_program ON public.applications(program_id);

-- ============ COHORTS ============
-- Groups of students in a program delivery

CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  max_capacity INTEGER DEFAULT 20,
  current_enrollment INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'enrolling', 'active', 'completed', 'cancelled')),
  location TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_program ON public.cohorts(program_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON public.cohorts(status);

-- ============ ENROLLMENTS ============
-- AT-07: Enrollment must be linked to cohort

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'withdrawn', 'suspended'));
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS hours_completed DECIMAL(6,2) DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT false;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============ PARTNER ORGANIZATIONS ============
-- Employers / Training Sites

CREATE TABLE IF NOT EXISTS public.partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'employer' CHECK (type IN ('employer', 'training_site', 'both')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  agreement_signed BOOLEAN DEFAULT false,
  agreement_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PARTNER SITES ============
-- AT-08: Partner Site Assignment

CREATE TABLE IF NOT EXISTS public.partner_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  capacity INTEGER DEFAULT 5,
  current_apprentices INTEGER DEFAULT 0,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
  programs_supported UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sites_partner ON public.partner_sites(partner_id);

-- ============ APPRENTICE ASSIGNMENTS ============
-- AT-08: Student must be assigned before logging hours

CREATE TABLE IF NOT EXISTS public.apprentice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id),
  site_id UUID NOT NULL REFERENCES public.partner_sites(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'terminated')),
  supervisor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, site_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_enrollment ON public.apprentice_assignments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_site ON public.apprentice_assignments(site_id);

-- ============ ATTENDANCE HOURS ============
-- AT-09: Instructor Hour Logging
-- AT-10: Student Hour Visibility (read-only)

CREATE TABLE IF NOT EXISTS public.attendance_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id),
  assignment_id UUID REFERENCES public.apprentice_assignments(id),
  cohort_id UUID REFERENCES public.cohorts(id),
  date DATE NOT NULL,
  hours_logged DECIMAL(4,2) NOT NULL CHECK (hours_logged > 0 AND hours_logged <= 12),
  type TEXT DEFAULT 'classroom' CHECK (type IN ('classroom', 'lab', 'ojt', 'online', 'makeup')),
  logged_by UUID NOT NULL REFERENCES public.profiles(id),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, date, type)
);

CREATE INDEX IF NOT EXISTS idx_attendance_hours_enrollment ON public.attendance_hours(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_hours_date ON public.attendance_hours(date);

-- ============ DOCUMENT REQUIREMENTS ============
-- AT-05: Document Upload Enforcement

CREATE TABLE IF NOT EXISTS public.document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id),
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  due_stage TEXT DEFAULT 'enrollment' CHECK (due_stage IN ('application', 'enrollment', 'completion')),
  document_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DOCUMENTS ============
-- AT-05: Files must be linked to student + application

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.enrollments(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES public.document_requirements(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============ AUDIT LOGS ============
-- AT-13: Every privileged action must be logged

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'approve', 'reject', 'login', 'logout')),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============ RLS POLICIES ============

-- Enable RLS on all tables
ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ INTAKES RLS ============
-- Public can create (lead capture)
-- Admin can read/update all

CREATE POLICY "intakes_public_insert" ON public.intakes
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "intakes_admin_all" ON public.intakes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ APPLICATIONS RLS ============
-- AT-12: Role Enforcement

-- Users can view their own applications
CREATE POLICY "applications_own_read" ON public.applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Admin can do everything
CREATE POLICY "applications_admin_all" ON public.applications
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ COHORTS RLS ============

-- Instructors can view assigned cohorts
CREATE POLICY "cohorts_instructor_read" ON public.cohorts
FOR SELECT TO authenticated
USING (
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Admin can manage
CREATE POLICY "cohorts_admin_all" ON public.cohorts
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ PARTNER ORGANIZATIONS RLS ============

-- Partners can view their own org
CREATE POLICY "partner_orgs_own_read" ON public.partner_organizations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.partner_org_id = partner_organizations.id)
  )
);

-- Admin can manage
CREATE POLICY "partner_orgs_admin_all" ON public.partner_organizations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ PARTNER SITES RLS ============

-- Partners can view their own sites
CREATE POLICY "partner_sites_own_read" ON public.partner_sites
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.partner_organizations po ON p.partner_org_id = po.id
    WHERE p.id = auth.uid()
    AND po.id = partner_sites.partner_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admin can manage
CREATE POLICY "partner_sites_admin_all" ON public.partner_sites
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ APPRENTICE ASSIGNMENTS RLS ============

-- Students can view their own assignments
CREATE POLICY "assignments_student_read" ON public.apprentice_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = apprentice_assignments.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Partners can view assignments at their sites
CREATE POLICY "assignments_partner_read" ON public.apprentice_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.partner_organizations po ON p.partner_org_id = po.id
    JOIN public.partner_sites ps ON ps.partner_id = po.id
    WHERE p.id = auth.uid()
    AND ps.id = apprentice_assignments.site_id
  )
);

-- Admin/Instructor can manage
CREATE POLICY "assignments_admin_all" ON public.apprentice_assignments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- ============ ATTENDANCE HOURS RLS ============
-- AT-09: Instructor can log
-- AT-10: Student can only read

-- Students can view their own hours (READ ONLY)
CREATE POLICY "hours_student_read" ON public.attendance_hours
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = attendance_hours.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Instructors can log hours
CREATE POLICY "hours_instructor_insert" ON public.attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Admin/Instructor can update
CREATE POLICY "hours_admin_update" ON public.attendance_hours
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Admin can delete
CREATE POLICY "hours_admin_delete" ON public.attendance_hours
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ AUDIT LOGS RLS ============
-- AT-13: Admin can read all

CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- System can insert (via service role or triggers)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============ DOCUMENT REQUIREMENTS RLS ============

CREATE POLICY "doc_requirements_read" ON public.document_requirements
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "doc_requirements_admin_all" ON public.document_requirements
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ FUNCTIONS ============

-- Function to update enrollment hours when attendance is logged
CREATE OR REPLACE FUNCTION update_enrollment_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.enrollments
  SET hours_completed = (
    SELECT COALESCE(SUM(hours_logged), 0)
    FROM public.attendance_hours
    WHERE enrollment_id = NEW.enrollment_id
  ),
  updated_at = NOW()
  WHERE id = NEW.enrollment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update hours
DROP TRIGGER IF EXISTS trigger_update_enrollment_hours ON public.attendance_hours;
CREATE TRIGGER trigger_update_enrollment_hours
AFTER INSERT OR UPDATE OR DELETE ON public.attendance_hours
FOR EACH ROW EXECUTE FUNCTION update_enrollment_hours();

-- Function to check completion eligibility
CREATE OR REPLACE FUNCTION check_completion_eligibility(enrollment_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_hours INTEGER;
  completed_hours DECIMAL;
  docs_complete BOOLEAN;
BEGIN
  -- Get required hours from program
  SELECT p.total_hours INTO required_hours
  FROM public.enrollments e
  JOIN public.programs p ON e.program_id = p.id
  WHERE e.id = enrollment_uuid;
  
  -- Get completed hours
  SELECT hours_completed INTO completed_hours
  FROM public.enrollments
  WHERE id = enrollment_uuid;
  
  -- Check if all required documents are verified
  SELECT NOT EXISTS (
    SELECT 1 FROM public.document_requirements dr
    JOIN public.enrollments e ON e.program_id = dr.program_id
    LEFT JOIN public.documents d ON d.requirement_id = dr.id AND d.enrollment_id = e.id
    WHERE e.id = enrollment_uuid
    AND dr.required = true
    AND (d.id IS NULL OR d.verification_status != 'verified')
  ) INTO docs_complete;
  
  RETURN (completed_hours >= required_hours) AND docs_complete;
END;
$$ LANGUAGE plpgsql;

-- ============ SEED DATA: BARBER + HVAC ============

-- Insert Barber program if not exists
INSERT INTO public.programs (code, title, description, duration_weeks, total_hours, tuition, funding_eligible, status, category)
VALUES (
  'BARBER-2024',
  'Professional Barber Program',
  'State-licensed barber training program covering cutting, styling, shaving, and business management.',
  52,
  1500,
  15000.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (code) DO NOTHING;

-- Insert HVAC program if not exists
INSERT INTO public.programs (code, title, description, duration_weeks, total_hours, tuition, funding_eligible, status, category)
VALUES (
  'HVAC-2024',
  'HVAC Technician Program',
  'Comprehensive HVAC training covering installation, maintenance, and repair of heating and cooling systems.',
  24,
  720,
  12000.00,
  true,
  'active',
  'Skilled Trades'
) ON CONFLICT (code) DO NOTHING;

-- ============ ACCEPTANCE TEST VERIFICATION ============
-- Run these queries to verify schema supports all acceptance tests

-- AT-01: Programs exist with required fields
-- SELECT code, title, status, eligibility_rules FROM programs WHERE code IN ('BARBER-2024', 'HVAC-2024');

-- AT-02: Intakes table exists
-- SELECT COUNT(*) FROM intakes;

-- AT-03: Applications table has required fields
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'applications';

-- AT-08: Apprentice assignments table exists
-- SELECT COUNT(*) FROM apprentice_assignments;

-- AT-09/10: Attendance hours table exists with constraints
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance_hours';

-- AT-13: Audit logs table exists
-- SELECT COUNT(*) FROM audit_logs;
-- Studio Workspaces: Persistent file storage for admin IDE
-- This enables full dev environment functionality without external services

-- Workspaces table: each admin can have multiple workspaces
CREATE TABLE IF NOT EXISTS studio_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT, -- Optional GitHub repo to sync with
  repo_branch TEXT DEFAULT 'main',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Files table: stores all workspace files with content
CREATE TABLE IF NOT EXISTS studio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL, -- e.g., 'src/index.ts'
  content TEXT, -- File content (NULL for directories)
  is_directory BOOLEAN DEFAULT FALSE,
  size_bytes INTEGER DEFAULT 0,
  mime_type TEXT,
  checksum TEXT, -- For sync conflict detection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, path)
);

-- Terminal sessions: track command history and output
CREATE TABLE IF NOT EXISTS studio_terminal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Terminal commands: individual commands and their output
CREATE TABLE IF NOT EXISTS studio_terminal_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES studio_terminal_sessions(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  output TEXT,
  exit_code INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_studio_workspaces_user ON studio_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_files_workspace ON studio_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_studio_files_path ON studio_files(workspace_id, path);
CREATE INDEX IF NOT EXISTS idx_studio_terminal_sessions_workspace ON studio_terminal_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_studio_terminal_commands_session ON studio_terminal_commands(session_id);

-- RLS Policies
ALTER TABLE studio_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_terminal_commands ENABLE ROW LEVEL SECURITY;

-- Workspace policies: users can only access their own workspaces
CREATE POLICY studio_workspaces_select ON studio_workspaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY studio_workspaces_insert ON studio_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY studio_workspaces_update ON studio_workspaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY studio_workspaces_delete ON studio_workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- File policies: access through workspace ownership
CREATE POLICY studio_files_select ON studio_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

CREATE POLICY studio_files_insert ON studio_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

CREATE POLICY studio_files_update ON studio_files
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

CREATE POLICY studio_files_delete ON studio_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

-- Terminal session policies
CREATE POLICY studio_terminal_sessions_select ON studio_terminal_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY studio_terminal_sessions_insert ON studio_terminal_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY studio_terminal_sessions_update ON studio_terminal_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Terminal command policies (through session ownership)
CREATE POLICY studio_terminal_commands_select ON studio_terminal_commands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY studio_terminal_commands_insert ON studio_terminal_commands
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE studio_files;
ALTER PUBLICATION supabase_realtime ADD TABLE studio_terminal_commands;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_studio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER studio_workspaces_updated_at
  BEFORE UPDATE ON studio_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_studio_updated_at();

CREATE TRIGGER studio_files_updated_at
  BEFORE UPDATE ON studio_files
  FOR EACH ROW EXECUTE FUNCTION update_studio_updated_at();
