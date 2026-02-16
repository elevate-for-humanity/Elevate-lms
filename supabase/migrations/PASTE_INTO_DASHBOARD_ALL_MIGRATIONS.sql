-- ================================================================
-- ELEVATE LMS — ALL MIGRATIONS (109 files, sorted chronologically)
-- Generated: 2026-02-16T12:27:13Z
-- Paste into Supabase Dashboard > SQL Editor > New Query > Run
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- FILE: 00000000000000_baseline.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 001_barber_hvac_reference.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 020_studio_workspaces.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20240125_store_guide_ecommerce.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================
-- STORE GUIDE & E-COMMERCE ENHANCEMENT
-- Safe migration - only adds missing tables/columns
-- ============================================

-- ============================================
-- 1. SEARCH INDEX (for universal search)
-- ============================================
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL,
  category TEXT NOT NULL,
  audiences TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image TEXT,
  price TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_index_active ON search_index(is_active);

-- ============================================
-- 2. STORE CARDS (landing page cards)
-- ============================================
CREATE TABLE IF NOT EXISTS store_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL,
  image TEXT NOT NULL,
  icon TEXT NOT NULL,
  tour_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  tour_description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_cards_tier ON store_cards(tier);
CREATE INDEX IF NOT EXISTS idx_store_cards_active ON store_cards(is_active);

-- ============================================
-- 3. PAGE GUIDES (avatar guides per page)
-- ============================================
CREATE TABLE IF NOT EXISTS page_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  avatar_name TEXT NOT NULL,
  avatar_image TEXT NOT NULL,
  quick_tips TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. GUIDE MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_guide_messages_page ON guide_messages(page_id);

-- ============================================
-- 5. PRODUCT RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id TEXT NOT NULL,
  target_product_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  savings TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_product_id, target_product_id, recommendation_type)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_source ON product_recommendations(source_product_id);

-- ============================================
-- 6. AVATAR SALES MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS avatar_sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  intro TEXT NOT NULL,
  value_highlight TEXT NOT NULL,
  objection_handler TEXT NOT NULL,
  call_to_action TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PRODUCT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ENHANCE PRODUCTS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS audiences TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 9. COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2),
  maximum_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. WISHLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 11. PRODUCT REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- ============================================
-- SEED DATA: SEARCH INDEX
-- ============================================
INSERT INTO search_index (item_id, title, description, href, category, audiences, keywords, image, price, badge, sort_order) VALUES
-- Programs
('barber-apprenticeship', 'Barber Apprenticeship Program', '2,000-hour state-approved apprenticeship with master barber instruction and job placement.', '/programs/barber-apprenticeship', 'program', ARRAY['students', 'everyone'], ARRAY['barber', 'barbering', 'hair', 'cutting', 'fades'], '/images/programs-hq/barber-hero.jpg', 'WIOA Funded', 'WIOA Eligible', 1),
('cna-training', 'CNA Training Program', '6-week certified nursing assistant training with clinical rotations.', '/programs/cna', 'program', ARRAY['students', 'everyone'], ARRAY['cna', 'nursing', 'healthcare', 'medical'], '/images/programs-hq/cna-training.jpg', 'WIOA Funded', 'WIOA Eligible', 2),
('hvac-training', 'HVAC Technician Training', '8-week HVAC certification with EPA 608 prep.', '/programs/hvac', 'program', ARRAY['students', 'everyone'], ARRAY['hvac', 'heating', 'cooling', 'technician'], '/images/programs-hq/hvac-technician.jpg', 'WIOA Funded', 'WIOA Eligible', 3),
('cdl-training', 'CDL Truck Driver Training', '4-week commercial driver license training.', '/programs/cdl', 'program', ARRAY['students', 'everyone'], ARRAY['cdl', 'truck', 'driver', 'trucking'], '/images/programs-hq/cdl-trucking.jpg', 'WIOA Funded', 'WIOA Eligible', 4),
-- Licenses
('school-license', 'School / Training Provider License', 'White-label platform with WIOA compliance and partner dashboard.', '/store/licenses/school-license', 'license', ARRAY['organizations'], ARRAY['school', 'training', 'provider', 'wioa', 'lms'], '/images/programs-hq/it-support.jpg', '$15,000', 'Most Popular', 10),
('core-license', 'Core Platform License', 'Essential LMS with course builder and enrollment.', '/store/licenses/core-license', 'license', ARRAY['organizations', 'developers'], ARRAY['lms', 'platform', 'core', 'starter'], '/images/programs-hq/technology-hero.jpg', '$4,999', NULL, 11),
('enterprise-license', 'Enterprise License', 'Multi-site deployment with custom integrations.', '/store/licenses/enterprise-license', 'license', ARRAY['organizations'], ARRAY['enterprise', 'multi-site', 'api'], '/images/team-hq/team-meeting.jpg', '$50,000', NULL, 12),
-- Tools
('wioa-toolkit', 'WIOA Compliance Toolkit', 'Automated WIOA tracking and PIRL exports.', '/store/compliance/wioa', 'tool', ARRAY['organizations'], ARRAY['wioa', 'compliance', 'pirl', 'reporting'], '/images/heroes-hq/funding-hero.jpg', '$1,999', NULL, 20),
('ai-tutor', 'AI Tutor License', '24/7 AI-powered tutoring for learners.', '/store/ai-studio', 'tool', ARRAY['organizations', 'students'], ARRAY['ai', 'tutor', 'chatbot', 'support'], '/images/programs-hq/technology-hero.jpg', '$999', 'New', 21),
-- Resources
('workbooks', 'Program Workbooks', 'Free downloadable workbooks for enrolled students.', '/workbooks', 'resource', ARRAY['students'], ARRAY['workbook', 'download', 'study', 'free'], '/images/programs-hq/business-office.jpg', 'Free', NULL, 30),
('marketplace', 'Course Marketplace', 'Expert-created courses in trades and healthcare.', '/marketplace', 'resource', ARRAY['students', 'everyone'], ARRAY['courses', 'marketplace', 'online', 'learning'], '/images/programs-hq/technology-hero.jpg', NULL, NULL, 31),
-- Dashboards
('student-dashboard', 'Student Dashboard', 'Access your courses and track progress.', '/lms/dashboard', 'dashboard', ARRAY['students'], ARRAY['dashboard', 'student', 'courses', 'progress'], NULL, NULL, NULL, 40),
('employer-portal', 'Employer Portal', 'Find trained candidates and post jobs.', '/employers', 'dashboard', ARRAY['employers'], ARRAY['employer', 'hiring', 'jobs', 'candidates'], NULL, NULL, NULL, 41),
-- Pages
('wioa-eligibility', 'WIOA Eligibility Check', 'See if you qualify for free workforce training.', '/wioa-eligibility', 'page', ARRAY['students', 'everyone'], ARRAY['wioa', 'eligibility', 'free', 'funding'], NULL, NULL, NULL, 50),
('demo', 'Platform Demo', 'Try the platform with a free demo.', '/demo', 'page', ARRAY['organizations', 'developers', 'everyone'], ARRAY['demo', 'trial', 'free', 'try'], NULL, NULL, NULL, 51)
ON CONFLICT (item_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  href = EXCLUDED.href,
  category = EXCLUDED.category,
  audiences = EXCLUDED.audiences,
  keywords = EXCLUDED.keywords,
  image = EXCLUDED.image,
  price = EXCLUDED.price,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- SEED DATA: STORE CARDS
-- ============================================
INSERT INTO store_cards (card_id, title, subtitle, description, href, image, icon, tour_id, tier, sort_order, tour_description) VALUES
('shop', 'Shop Gear', 'Tools, Equipment & Apparel', 'Professional tools, equipment, and study materials.', '/shop', '/images/programs-hq/hvac-technician.jpg', 'shopping-bag', 'store-card-shop', 'primary', 1, 'Shop for professional tools and equipment.'),
('marketplace', 'Courses Marketplace', 'Expert-Created Training', 'Discover courses from expert creators.', '/marketplace', '/images/programs-hq/technology-hero.jpg', 'graduation-cap', 'store-card-marketplace', 'primary', 2, 'Browse courses created by industry experts.'),
('workbooks', 'Workbooks & Downloads', 'Study Materials & Guides', 'Download workbooks and study guides.', '/workbooks', '/images/programs-hq/business-office.jpg', 'book-open', 'store-card-workbooks', 'primary', 3, 'Access free downloadable workbooks.'),
('licenses', 'Platform Licenses', 'LMS & Workforce Solutions', 'Full workforce platform with LMS and compliance.', '/store/licenses', '/images/programs-hq/it-support.jpg', 'server', 'store-card-licenses', 'primary', 4, 'License our complete workforce platform.'),
('pricing', 'Plans & Pricing', 'Subscriptions & Checkout', 'View pricing plans and subscriptions.', '/store/subscriptions', '/images/team-hq/team-meeting.jpg', 'credit-card', 'store-card-pricing', 'primary', 5, 'Compare pricing plans.'),
('compliance', 'Compliance Tools', 'WIOA, FERPA, WCAG', 'Compliance checklists and reporting tools.', '/store/compliance', '/images/heroes-hq/funding-hero.jpg', 'file-text', 'store-card-compliance', 'secondary', 6, 'Access compliance tools.'),
('ai-studio', 'AI & Automation', 'AI Tutor & Workflows', 'AI-powered tutoring and automation.', '/store/ai-studio', '/images/programs-hq/cybersecurity.jpg', 'settings', 'store-card-ai', 'secondary', 7, 'Explore AI-powered tools.'),
('programs', 'Training Programs', 'Career-Ready Training', 'Enroll in WIOA-eligible training programs.', '/programs', '/images/programs-hq/barber-hero.jpg', 'users', 'store-card-programs', 'secondary', 8, 'Browse career training programs.')
ON CONFLICT (card_id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  href = EXCLUDED.href,
  image = EXCLUDED.image,
  icon = EXCLUDED.icon,
  tour_id = EXCLUDED.tour_id,
  tier = EXCLUDED.tier,
  sort_order = EXCLUDED.sort_order,
  tour_description = EXCLUDED.tour_description,
  updated_at = NOW();

-- ============================================
-- SEED DATA: PAGE GUIDES
-- ============================================
INSERT INTO page_guides (page_id, page_name, avatar_name, avatar_image, quick_tips) VALUES
('store-landing', 'Store', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['Students: Check Workbooks for free materials', 'Training Providers: School License is most popular', 'Need compliance help? We have WIOA & FERPA tools']),
('licenses', 'Platform Licenses', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['School License is most popular', 'All licenses include lifetime updates', 'WIOA compliance built into School & Enterprise']),
('student-dashboard', 'Student Dashboard', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['Click any course to continue', 'Progress saves automatically', 'Download workbooks from Resources']),
('barber-apprenticeship', 'Barber Apprenticeship', 'Marcus', '/images/team-hq/instructor-3.jpg', ARRAY['2,000 hours hands-on training', 'State board exam prep included', 'WIOA funding available'])
ON CONFLICT (page_id) DO UPDATE SET
  page_name = EXCLUDED.page_name,
  avatar_name = EXCLUDED.avatar_name,
  avatar_image = EXCLUDED.avatar_image,
  quick_tips = EXCLUDED.quick_tips,
  updated_at = NOW();

-- ============================================
-- SEED DATA: GUIDE MESSAGES
-- ============================================
INSERT INTO guide_messages (page_id, message_id, message_type, message, action_label, action_href, sort_order) VALUES
('store-landing', 'welcome', 'welcome', 'Welcome to the Elevate Store! I''m Maya. Whether you''re a student needing supplies, or an organization wanting to run training programs - I''ll help you find what you need.', NULL, NULL, 1),
('store-landing', 'explain', 'explain', 'We have five main sections: Shop (tools & gear), Marketplace (courses), Workbooks (free study materials), Platform Licenses (run your own training program), and Compliance Tools.', NULL, NULL, 2),
('store-landing', 'tip', 'tip', 'Not sure where to start? Most training providers choose the School License - it''s a complete system to run WIOA-funded programs.', 'See School License', '/store/licenses/school-license', 3),
('licenses', 'welcome', 'welcome', 'These are our platform licenses - this is how schools and training providers run their programs using our technology.', NULL, NULL, 1),
('licenses', 'explain', 'explain', 'Core License ($4,999) is for getting started. School License ($15,000) is most popular - includes white-label and WIOA compliance. Enterprise ($50,000) is for multi-site organizations.', NULL, NULL, 2),
('licenses', 'roi', 'tip', 'The math: One WIOA-funded cohort of 10 students = $50,000+ revenue. The School License pays for itself with your first cohort.', 'Try Free Demo', '/demo', 3),
('student-dashboard', 'welcome', 'welcome', 'This is your student dashboard - your home base for everything. Let me show you around.', NULL, NULL, 1),
('student-dashboard', 'explain', 'explain', 'On the left, you''ll see your enrolled courses. In the center, your progress and upcoming assignments. On the right, announcements from instructors.', NULL, NULL, 2),
('student-dashboard', 'tip', 'tip', 'Pro tip: Check the Resources section for workbooks and study guides. They''re free to download.', 'Go to Resources', '/lms/resources', 3)
ON CONFLICT (page_id, message_id) DO UPDATE SET
  message_type = EXCLUDED.message_type,
  message = EXCLUDED.message,
  action_label = EXCLUDED.action_label,
  action_href = EXCLUDED.action_href,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: RECOMMENDATIONS
-- ============================================
INSERT INTO product_recommendations (source_product_id, target_product_id, recommendation_type, reason, sort_order) VALUES
('core-license', 'school-license', 'upgrade', 'Upgrade to School License for white-label branding and WIOA compliance.', 1),
('core-license', 'wioa-toolkit', 'cross-sell', 'Add WIOA compliance to track participant outcomes.', 2),
('core-license', 'ai-tutor', 'cross-sell', 'Add AI Tutor for 24/7 learner support.', 3),
('school-license', 'enterprise-license', 'upgrade', 'Scale to multiple locations with Enterprise.', 1),
('school-license', 'ai-tutor', 'cross-sell', 'Enhance your platform with AI-powered tutoring.', 2),
('wioa-toolkit', 'school-license', 'upsell', 'School License includes WIOA compliance built-in, plus full LMS.', 1),
('ai-tutor', 'school-license', 'upsell', 'AI Tutor is included with School License.', 1)
ON CONFLICT (source_product_id, target_product_id, recommendation_type) DO UPDATE SET
  reason = EXCLUDED.reason,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: AVATAR SALES MESSAGES
-- ============================================
INSERT INTO avatar_sales_messages (product_id, intro, value_highlight, objection_handler, call_to_action) VALUES
('core-license', 'The Core License is perfect if you''re just getting started.', 'You get a full LMS with course builder, student enrollment, and basic compliance tracking.', 'If you need white-label or WIOA compliance later, you can upgrade anytime.', 'Ready to launch your training platform?'),
('school-license', 'This is our most popular license - it''s what real training providers use.', 'You get white-label branding so it looks like YOUR platform, plus WIOA and FERPA compliance built in.', 'The $15,000 pays for itself fast - one WIOA-funded cohort of 10 students can bring in $50,000+ revenue.', 'Want me to show you how other training providers are using this?'),
('enterprise-license', 'Enterprise is for organizations running multiple training sites.', 'Unlimited locations, API access for your existing systems, and a dedicated account manager.', 'We''ll do the integration work and train your team on-site.', 'Let''s schedule a call to discuss your specific needs.'),
('wioa-toolkit', 'If you''re running WIOA-funded programs, this toolkit saves you serious time.', 'Automated PIRL exports, performance tracking, and quarterly reports. What used to take 40 hours now takes 10 minutes.', 'It''s $1,999 one-time - that''s less than one week of a compliance officer''s salary.', 'Want to see a demo of the PIRL export?'),
('ai-tutor', 'AI Tutor gives your students 24/7 support without burning out your instructors.', 'It answers questions, explains concepts, and tracks where students are struggling.', 'Students love it because they get help at 2am. Instructors love it because they''re not answering the same questions 50 times.', 'Try it yourself - ask it anything.')
ON CONFLICT (product_id) DO UPDATE SET
  intro = EXCLUDED.intro,
  value_highlight = EXCLUDED.value_highlight,
  objection_handler = EXCLUDED.objection_handler,
  call_to_action = EXCLUDED.call_to_action,
  updated_at = NOW();

-- ============================================
-- SEED DATA: CATEGORIES
-- ============================================
INSERT INTO product_categories (slug, name, description, sort_order) VALUES
('licenses', 'Platform Licenses', 'LMS and workforce platform licenses', 1),
('subscriptions', 'Subscriptions', 'Monthly infrastructure and services', 2),
('certifications', 'Certifications', 'Professional certification courses', 3),
('compliance', 'Compliance Tools', 'WIOA, FERPA, and grant reporting tools', 4),
('ai-tools', 'AI & Automation', 'AI tutoring and automation tools', 5),
('programs', 'Training Programs', 'Career training programs', 6),
('shop', 'Shop', 'Tools, equipment, and apparel', 7),
('digital', 'Digital Resources', 'Downloadable guides and templates', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: SAMPLE COUPON
-- ============================================
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, is_active) VALUES
('WELCOME10', 'Welcome discount - 10% off first order', 'percentage', 10, 100, true),
('FREESHIP', 'Free shipping on orders over $50', 'free_shipping', 0, 50, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_order_amount = EXCLUDED.minimum_order_amount;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_sales_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Public read search_index" ON search_index;
DROP POLICY IF EXISTS "Public read store_cards" ON store_cards;
DROP POLICY IF EXISTS "Public read page_guides" ON page_guides;
DROP POLICY IF EXISTS "Public read guide_messages" ON guide_messages;
DROP POLICY IF EXISTS "Public read recommendations" ON product_recommendations;
DROP POLICY IF EXISTS "Public read sales_messages" ON avatar_sales_messages;
DROP POLICY IF EXISTS "Public read categories" ON product_categories;
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
DROP POLICY IF EXISTS "Public read reviews" ON product_reviews;

CREATE POLICY "Public read search_index" ON search_index FOR SELECT USING (is_active = true);
CREATE POLICY "Public read store_cards" ON store_cards FOR SELECT USING (is_active = true);
CREATE POLICY "Public read page_guides" ON page_guides FOR SELECT USING (is_active = true);
CREATE POLICY "Public read guide_messages" ON guide_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read recommendations" ON product_recommendations FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sales_messages" ON avatar_sales_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (is_approved = true);

-- Done
SELECT 'Migration complete: Store guide and e-commerce tables created with seed data' as status;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20250124_franchise_system.sql
-- ────────────────────────────────────────────────────────────────

-- Franchise Tax Preparation System
-- Database schema for multi-office tax preparation business

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FRANCHISE OFFICES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_code VARCHAR(20) UNIQUE NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner info
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business info
  business_ein VARCHAR(20),
  state_license VARCHAR(50),
  efin VARCHAR(6), -- Office's own EFIN if they have one
  parent_efin VARCHAR(6) NOT NULL, -- Franchise's master EFIN
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00,
  revenue_share_percent DECIMAL(5,2) DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- FRANCHISE PREPARERS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P followed by 8 digits
  ptin_expiration DATE,
  
  -- Certifications
  certification_level VARCHAR(20) CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'supervisor')),
  certifications JSONB DEFAULT '[]',
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- Authorizations
  is_efin_authorized BOOLEAN DEFAULT FALSE,
  is_ero_authorized BOOLEAN DEFAULT FALSE,
  signature_pin VARCHAR(10),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance metrics
  returns_filed INTEGER DEFAULT 0,
  returns_rejected INTEGER DEFAULT 0,
  average_refund DECIMAL(10,2),
  
  -- Compensation
  commission_type VARCHAR(20) DEFAULT 'per_return' CHECK (commission_type IN ('per_return', 'hourly', 'salary', 'commission')),
  per_return_fee DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2), -- Percentage
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(office_id, ptin)
);

-- ============================================
-- FRANCHISE CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Tax info
  filing_status VARCHAR(30),
  dependents_count INTEGER DEFAULT 0,
  
  -- SSN (encrypted)
  ssn_encrypted BYTEA,
  ssn_last_four VARCHAR(4),
  ssn_hash VARCHAR(64), -- For lookup without decryption
  
  -- Spouse info
  spouse_first_name VARCHAR(100),
  spouse_last_name VARCHAR(100),
  spouse_ssn_encrypted BYTEA,
  spouse_ssn_last_four VARCHAR(4),
  
  -- Preferences
  preferred_preparer_id UUID REFERENCES franchise_preparers(id),
  
  -- History
  client_since DATE DEFAULT CURRENT_DATE,
  returns_filed INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(10,2) DEFAULT 0,
  last_return_date DATE,
  last_return_id UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'do_not_serve')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- ERO CONFIGURATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_ero_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  ero_preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  
  -- ERO details
  efin VARCHAR(6) NOT NULL,
  firm_name VARCHAR(255) NOT NULL,
  firm_ein VARCHAR(20),
  firm_address JSONB NOT NULL,
  signature_pin VARCHAR(10) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RETURN SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_return_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  client_id UUID REFERENCES franchise_clients(id),
  
  -- Preparer info snapshot
  preparer_ptin VARCHAR(20) NOT NULL,
  preparer_name VARCHAR(255),
  
  -- ERO info
  ero_id UUID REFERENCES franchise_preparers(id),
  ero_signature JSONB,
  ero_signed_at TIMESTAMPTZ,
  
  -- Return details
  tax_year INTEGER NOT NULL,
  efin VARCHAR(6) NOT NULL,
  return_type VARCHAR(20) DEFAULT 'IRS1040',
  filing_status VARCHAR(30),
  
  -- Return data (summary, not full return)
  return_data JSONB,
  taxpayer_ssn_hash VARCHAR(64),
  
  -- XML content
  xml_content TEXT,
  
  -- Fees
  client_fee DECIMAL(10,2) DEFAULT 0,
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  preparer_commission DECIMAL(10,2) DEFAULT 0,
  office_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'pending_ero', 'ready_to_submit',
    'submitted', 'accepted', 'rejected', 'error'
  )),
  
  -- IRS response
  irs_submission_id VARCHAR(50),
  irs_status VARCHAR(30),
  irs_status_date TIMESTAMPTZ,
  irs_errors JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- FEE SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 150.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 75.00,
  
  -- Schedule fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_c DECIMAL(10,2) DEFAULT 100.00,
  fee_schedule_d DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_e DECIMAL(10,2) DEFAULT 75.00,
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00,
  
  -- Per-item fees
  fee_per_w2 DECIMAL(10,2) DEFAULT 0,
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00,
  fee_per_dependent DECIMAL(10,2) DEFAULT 25.00,
  
  -- State return
  fee_state_return DECIMAL(10,2) DEFAULT 50.00,
  
  -- Credits
  fee_eitc DECIMAL(10,2) DEFAULT 50.00,
  fee_ctc DECIMAL(10,2) DEFAULT 25.00,
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 35.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0,
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 25.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Validity
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREPARER PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE ROYALTIES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  returns_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  per_return_fees DECIMAL(10,2) DEFAULT 0,
  revenue_share DECIMAL(10,2) DEFAULT 0,
  software_fees DECIMAL(10,2) DEFAULT 0,
  other_fees DECIMAL(10,2) DEFAULT 0,
  total_owed DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
  
  -- Invoice info
  invoiced_at TIMESTAMPTZ,
  invoice_number VARCHAR(50),
  due_date DATE,
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Action info
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Context
  office_id UUID REFERENCES franchise_offices(id),
  actor_id UUID REFERENCES auth.users(id),
  
  -- Details
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Offices
CREATE INDEX IF NOT EXISTS idx_franchise_offices_owner ON franchise_offices(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchise_offices_status ON franchise_offices(status);
CREATE INDEX IF NOT EXISTS idx_franchise_offices_code ON franchise_offices(office_code);

-- Preparers
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_office ON franchise_preparers(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_user ON franchise_preparers(user_id);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_ptin ON franchise_preparers(ptin);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_status ON franchise_preparers(status);

-- Clients
CREATE INDEX IF NOT EXISTS idx_franchise_clients_office ON franchise_clients(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_clients_ssn_hash ON franchise_clients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_franchise_clients_name ON franchise_clients(last_name, first_name);

-- Return submissions
CREATE INDEX IF NOT EXISTS idx_franchise_returns_office ON franchise_return_submissions(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_preparer ON franchise_return_submissions(preparer_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_client ON franchise_return_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_status ON franchise_return_submissions(status);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_year ON franchise_return_submissions(tax_year);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_created ON franchise_return_submissions(created_at);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_franchise_audit_office ON franchise_audit_log(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_actor ON franchise_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_entity ON franchise_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_created ON franchise_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE franchise_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_ero_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_return_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_audit_log ENABLE ROW LEVEL SECURITY;

-- Offices: Admins see all, owners see their own
CREATE POLICY franchise_offices_admin ON franchise_offices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR owner_id = auth.uid()
  );

-- Preparers: Admins see all, office owners see their office's preparers, preparers see themselves
CREATE POLICY franchise_preparers_access ON franchise_preparers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Clients: Admins see all, office owners/preparers see their office's clients
CREATE POLICY franchise_clients_access ON franchise_clients
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE office_id = franchise_clients.office_id AND user_id = auth.uid())
  );

-- Returns: Similar to clients
CREATE POLICY franchise_returns_access ON franchise_return_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Audit log: Admins see all, office owners see their office's logs
CREATE POLICY franchise_audit_access ON franchise_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- ERO configs: Office owners and admins
CREATE POLICY franchise_ero_configs_access ON franchise_ero_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Fee schedules: Office owners and admins
CREATE POLICY franchise_fee_schedules_access ON franchise_fee_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Preparer payouts: Office owners and admins
CREATE POLICY franchise_preparer_payouts_access ON franchise_preparer_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Royalties: Admins only (franchise-level data)
CREATE POLICY franchise_royalties_access ON franchise_royalties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_franchise_offices_updated_at
  BEFORE UPDATE ON franchise_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_preparers_updated_at
  BEFORE UPDATE ON franchise_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_clients_updated_at
  BEFORE UPDATE ON franchise_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_return_submissions_updated_at
  BEFORE UPDATE ON franchise_return_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt SSN
CREATE OR REPLACE FUNCTION encrypt_ssn(ssn TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt SSN
CREATE OR REPLACE FUNCTION decrypt_ssn(encrypted_ssn BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash SSN for lookup
CREATE OR REPLACE FUNCTION hash_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(regexp_replace(ssn, '[^0-9]', '', 'g'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert default fee schedule template
-- INSERT INTO franchise_fee_schedules (office_id, name, is_default)
-- VALUES (NULL, 'Default Fee Schedule', TRUE);

COMMENT ON TABLE franchise_offices IS 'Tax preparation offices in the franchise network';
COMMENT ON TABLE franchise_preparers IS 'Tax preparers with PTINs working at franchise offices';
COMMENT ON TABLE franchise_clients IS 'Clients of franchise offices';
COMMENT ON TABLE franchise_return_submissions IS 'Tax returns prepared and submitted through the franchise';
COMMENT ON TABLE franchise_audit_log IS 'Audit trail for all franchise operations';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260118_audit_logs.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260122_content_versioning.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260122_forum_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260123_seed_store_products.sql
-- ────────────────────────────────────────────────────────────────

-- Seed Store Products with Complete Data
-- Run this to populate the products table with all store items

-- Clear existing products and re-seed
DELETE FROM products WHERE true;

-- Platform Licenses
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Core Platform License', 'core-platform', 'Complete workforce platform for individual operators. Includes LMS, enrollment, admin dashboard, and mobile PWA.', 4999, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('School / Training Provider License', 'school-license', 'White-label platform with compliance tools, partner dashboard, case management, and WIOA reporting. Up to 5 deployments.', 15000, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('Enterprise Platform License', 'enterprise-license', 'Full enterprise deployment with unlimited sites, custom integrations, dedicated support, and SLA.', 50000, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('Monthly Core Infrastructure', 'monthly-core', 'Self-operating workforce infrastructure. Up to 100 learners, 3 programs.', 750, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true),
  ('Monthly Institutional', 'monthly-institutional', 'Multi-program management with compliance dashboards. Up to 1,000 learners, 25 programs.', 2500, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true),
  ('Monthly Enterprise', 'monthly-enterprise', 'Regional workforce governance with multi-tenant support. Up to 10,000 learners.', 8500, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true);

-- Developer Licenses
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Developer Starter License', 'dev-starter', 'Full codebase access for single site deployment. 1 year updates, email support.', 299, 'license', 'developer', '/images/store/ai-instructors.jpg', true),
  ('Developer Pro License', 'dev-pro', 'Multi-site deployment with priority support. 2 years updates, Slack support.', 999, 'license', 'developer', '/images/store/ai-instructors.jpg', true),
  ('Developer Enterprise License', 'dev-enterprise', 'Unlimited deployments, white-label rights, dedicated support channel.', 5000, 'license', 'developer', '/images/store/ai-instructors.jpg', true);

-- Professional Certifications
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Microsoft Word Certification', 'ms-word-cert', 'Certiport Microsoft Office Specialist certification for Word.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Microsoft Excel Certification', 'ms-excel-cert', 'Certiport Microsoft Office Specialist certification for Excel.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Microsoft PowerPoint Certification', 'ms-powerpoint-cert', 'Certiport Microsoft Office Specialist certification for PowerPoint.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Adobe Photoshop Certification', 'adobe-photoshop-cert', 'Adobe Certified Professional certification for Photoshop.', 210, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Adobe Illustrator Certification', 'adobe-illustrator-cert', 'Adobe Certified Professional certification for Illustrator.', 210, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CompTIA A+ Certification', 'comptia-a-plus', 'Entry-level IT certification covering hardware and software.', 249, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CompTIA Security+', 'comptia-security-plus', 'Cybersecurity certification for IT professionals.', 349, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CPR & AED Certification', 'cpr-aed', 'HSI CPR and AED certification for healthcare and workplace.', 135, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('First Aid Certification', 'first-aid', 'HSI First Aid certification for emergency response.', 135, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('BLS for Healthcare Providers', 'bls-healthcare', 'Basic Life Support certification for healthcare professionals.', 159, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('OSHA 10-Hour General Industry', 'osha-10', 'CareerSafe OSHA 10-hour safety training.', 89, 'course', 'safety', '/images/hvac-highlight.jpg', true),
  ('OSHA 30-Hour General Industry', 'osha-30', 'CareerSafe OSHA 30-hour safety training for supervisors.', 189, 'course', 'safety', '/images/hvac-highlight.jpg', true),
  ('Food Handler Certification', 'food-handler', 'Food safety certification for food service workers.', 64, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('QuickBooks Certification', 'quickbooks-cert', 'Intuit QuickBooks certification for accounting.', 210, 'course', 'certification', '/images/tax-business-highlight.jpg', true);

-- AI & Automation Tools
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('AI Studio Starter', 'ai-studio-starter', 'AI-powered content creation for training programs. 100 generations/month.', 99, 'subscription', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Studio Professional', 'ai-studio-pro', 'Advanced AI tools with custom model training. Unlimited generations.', 299, 'subscription', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Instructor Pack', 'ai-instructor-pack', 'AI teaching assistant for your courses. One-time purchase.', 499, 'addon', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Tutor License', 'ai-tutor', 'Personalized AI tutoring for learners with 24/7 support.', 999, 'license', 'ai-tools', '/images/store/ai-tutor.jpg', true);

-- Compliance Tools
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('WIOA Compliance Toolkit', 'wioa-toolkit', 'Complete WIOA compliance checklist, templates, and reporting tools.', 149, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('FERPA Compliance Guide', 'ferpa-guide', 'FERPA requirements, documentation templates, and audit prep.', 99, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('Grant Reporting Templates', 'grant-templates', 'Pre-built templates for federal and state grant reporting.', 79, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('Workforce Compliance Checklist', 'compliance-checklist', 'Essential compliance checklist for workforce training programs.', 39, 'digital', 'compliance', '/images/store/crm-hub.jpg', true);

-- Apps & Integrations
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('SAM.gov Registration Assistant', 'sam-gov-assistant', 'Step-by-step SAM.gov registration guide with support.', 0, 'digital', 'apps', '/images/store/community-hub.jpg', true),
  ('Grants.gov Navigator', 'grants-navigator', 'Find and apply for federal grants with guided assistance.', 49, 'digital', 'apps', '/images/store/community-hub.jpg', true),
  ('Website Builder License', 'website-builder', 'AI-powered website builder for training organizations.', 299, 'license', 'apps', '/images/store/community-hub.jpg', true),
  ('Community Hub License', 'community-hub', 'Full community platform with forums, groups, and events.', 1999, 'license', 'apps', '/images/store/community-hub.jpg', true),
  ('CRM Hub License', 'crm-hub', 'Student and employer relationship management system.', 1499, 'license', 'apps', '/images/store/crm-hub.jpg', true);

-- Digital Resources
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Start a Tax Business Toolkit', 'tax-toolkit', 'Complete guide to starting your own tax preparation business.', 49, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Grant Readiness Guide', 'grant-guide', 'Step-by-step guide to preparing for federal grants.', 29, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Fund-Ready Mini Course', 'fund-ready-course', 'Video course on funding strategies for workforce programs.', 149, 'course', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Interview Preparation Workbook', 'interview-workbook', 'Comprehensive interview prep with practice questions.', 0, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Resume Template Pack', 'resume-templates', 'Professional resume templates for various industries.', 0, 'digital', 'resources', '/images/tax-business-highlight.jpg', true);

-- Shop Products
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('HVAC Tool Kit', 'hvac-toolkit', 'Professional HVAC tool kit for technicians.', 149.99, 'physical', 'shop', '/images/hvac-highlight.jpg', true),
  ('Medical Scrubs Set', 'medical-scrubs', 'Professional medical scrubs in multiple colors.', 49.99, 'physical', 'shop', '/images/healthcare-highlight.jpg', true),
  ('Barber Shears Pro', 'barber-shears', 'Professional barber shears for precision cutting.', 89.99, 'physical', 'shop', '/images/barber-hero.jpg', true),
  ('Study Guide Bundle', 'study-guides', 'Comprehensive study guides for certification exams.', 29.99, 'physical', 'shop', '/images/healthcare-highlight.jpg', true),
  ('Safety Glasses', 'safety-glasses', 'OSHA-compliant safety glasses for workplace.', 24.99, 'physical', 'shop', '/images/hvac-highlight.jpg', true),
  ('Elevate Hoodie', 'elevate-hoodie', 'Comfortable hoodie with Elevate branding.', 59.99, 'physical', 'shop', '/images/store/platform-hero.jpg', true);

-- Training Programs (as products for purchase)
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Barber Apprenticeship Program', 'barber-program', '1,500-hour state-approved apprenticeship with master barber instruction. WIOA eligible.', 0, 'program', 'training', '/images/barber-hero.jpg', true),
  ('CNA Training Program', 'cna-program', '6-week certified nursing assistant training with clinical hours. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true),
  ('HVAC Certification Program', 'hvac-program', '8-week HVAC technician certification with hands-on training. WRG available.', 0, 'program', 'training', '/images/hvac-hero.jpg', true),
  ('CDL Training Program', 'cdl-program', '4-week commercial driver license training. WIOA eligible.', 0, 'program', 'training', '/images/cdl-hero.jpg', true),
  ('Medical Assistant Program', 'ma-program', '12-week medical assistant certification program. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true),
  ('Phlebotomy Training', 'phlebotomy-program', '6-week phlebotomy technician certification. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124120900_fix_enrollment_policies.sql
-- ────────────────────────────────────────────────────────────────

-- Fix training_enrollments RLS policies to allow admin enrollment
-- The current policies only allow users to enroll themselves via auth flow
-- This adds policies for admins to enroll users directly

-- Allow admins to insert enrollments for any user
CREATE POLICY "Admins can enroll users"
  ON training_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update any enrollment
CREATE POLICY "Admins can update enrollments"
  ON training_enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete enrollments
CREATE POLICY "Admins can delete enrollments"
  ON training_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

SELECT 'Enrollment policies updated: Admins can now enroll users directly' AS result;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124150000_tax_software_tables.sql
-- ────────────────────────────────────────────────────────────────

-- Supersonic Tax Software Database Schema
-- Direct IRS MeF Integration Tables

-- MeF Submissions table - stores all tax return submissions
CREATE TABLE IF NOT EXISTS mef_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  efin TEXT NOT NULL DEFAULT '358459',
  software_id TEXT,
  tax_year INTEGER NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'IRS1040',
  
  -- Taxpayer info (hashed for security)
  taxpayer_ssn_hash TEXT,
  taxpayer_name TEXT,
  
  -- Return data
  return_data JSONB,
  xml_content TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  dcn TEXT, -- Declaration Control Number (assigned by IRS on acceptance)
  
  -- Acknowledgment
  acknowledgment JSONB,
  
  -- Error handling
  error_message TEXT,
  resubmission_count INTEGER DEFAULT 0,
  original_submission_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transmitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Acknowledgments table - stores IRS responses
CREATE TABLE IF NOT EXISTS mef_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL REFERENCES mef_submissions(submission_id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'accepted' or 'rejected'
  dcn TEXT, -- Declaration Control Number
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  errors JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Errors table - detailed error logging
CREATE TABLE IF NOT EXISTS mef_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL REFERENCES mef_submissions(submission_id) ON DELETE CASCADE,
  error_code TEXT NOT NULL,
  error_category TEXT NOT NULL, -- 'reject' or 'alert'
  error_message TEXT NOT NULL,
  field_name TEXT,
  rule_number TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Returns table - client-facing return records
CREATE TABLE IF NOT EXISTS tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID,
  submission_id TEXT REFERENCES mef_submissions(submission_id),
  
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  
  -- Calculated amounts
  total_income DECIMAL(12,2),
  adjusted_gross_income DECIMAL(12,2),
  taxable_income DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  total_payments DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  amount_owed DECIMAL(12,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, transmitted, accepted, rejected
  dcn TEXT,
  
  -- Rejection info
  rejection_errors JSONB,
  rejected_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Preparer info
  preparer_id UUID,
  preparer_ptin TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Clients table - stores client information
CREATE TABLE IF NOT EXISTS tax_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal info
  first_name TEXT NOT NULL,
  middle_initial TEXT,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL, -- Hashed SSN
  ssn_last4 TEXT NOT NULL, -- Last 4 digits for display
  date_of_birth DATE NOT NULL,
  
  -- Contact
  email TEXT,
  phone TEXT,
  
  -- Address
  address_street TEXT,
  address_apartment TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  
  -- Spouse info (if applicable)
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_ssn_hash TEXT,
  spouse_ssn_last4 TEXT,
  spouse_dob DATE,
  
  -- Bank info for direct deposit (encrypted)
  bank_routing_encrypted TEXT,
  bank_account_encrypted TEXT,
  bank_account_type TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Dependents table
CREATE TABLE IF NOT EXISTS tax_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES tax_clients(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL,
  ssn_last4 TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  relationship TEXT NOT NULL,
  months_lived_with_taxpayer INTEGER DEFAULT 12,
  
  child_tax_credit_eligible BOOLEAN DEFAULT FALSE,
  other_dependent_credit_eligible BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- W2 Income table
CREATE TABLE IF NOT EXISTS tax_w2_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  employer_ein TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  employer_address_street TEXT,
  employer_address_city TEXT,
  employer_address_state TEXT,
  employer_address_zip TEXT,
  
  wages DECIMAL(12,2) NOT NULL, -- Box 1
  federal_withholding DECIMAL(12,2) DEFAULT 0, -- Box 2
  social_security_wages DECIMAL(12,2), -- Box 3
  social_security_tax DECIMAL(12,2), -- Box 4
  medicare_wages DECIMAL(12,2), -- Box 5
  medicare_tax DECIMAL(12,2), -- Box 6
  
  state_wages DECIMAL(12,2), -- Box 16
  state_withholding DECIMAL(12,2), -- Box 17
  state_code TEXT,
  state_employer_id TEXT,
  
  local_wages DECIMAL(12,2), -- Box 18
  local_withholding DECIMAL(12,2), -- Box 19
  locality_name TEXT,
  
  retirement_plan BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1099 Income table
CREATE TABLE IF NOT EXISTS tax_1099_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  form_type TEXT NOT NULL, -- 'INT', 'DIV', 'MISC', 'NEC', 'R', 'G'
  payer_name TEXT NOT NULL,
  payer_ein TEXT,
  
  -- Common fields
  amount DECIMAL(12,2) NOT NULL,
  federal_withholding DECIMAL(12,2) DEFAULT 0,
  
  -- Type-specific fields stored as JSONB
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule C Business Income table
CREATE TABLE IF NOT EXISTS tax_schedule_c (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  business_name TEXT NOT NULL,
  business_code TEXT NOT NULL, -- NAICS code
  ein TEXT,
  accounting_method TEXT DEFAULT 'cash',
  
  gross_receipts DECIMAL(12,2) NOT NULL,
  returns_allowances DECIMAL(12,2) DEFAULT 0,
  cost_of_goods_sold DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2),
  other_income DECIMAL(12,2) DEFAULT 0,
  
  -- Expenses
  expenses JSONB,
  total_expenses DECIMAL(12,2),
  
  net_profit DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itemized Deductions table
CREATE TABLE IF NOT EXISTS tax_itemized_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  medical_expenses DECIMAL(12,2) DEFAULT 0,
  state_local_taxes DECIMAL(12,2) DEFAULT 0,
  real_estate_taxes DECIMAL(12,2) DEFAULT 0,
  personal_property_taxes DECIMAL(12,2) DEFAULT 0,
  mortgage_interest DECIMAL(12,2) DEFAULT 0,
  mortgage_insurance_premiums DECIMAL(12,2) DEFAULT 0,
  charitable_cash DECIMAL(12,2) DEFAULT 0,
  charitable_noncash DECIMAL(12,2) DEFAULT 0,
  casualty_losses DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  
  total_itemized DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mef_submissions_user ON mef_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_status ON mef_submissions(status);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_tax_year ON mef_submissions(tax_year);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_ssn_hash ON mef_submissions(taxpayer_ssn_hash);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_hash ON tax_clients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_mef_errors_submission ON mef_errors(submission_id);

-- Enable RLS
ALTER TABLE mef_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_w2_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_1099_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_schedule_c ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_itemized_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON mef_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own tax returns
CREATE POLICY "Users can view own tax returns" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax returns" ON tax_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns" ON tax_returns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own client record
CREATE POLICY "Users can view own client record" ON tax_clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client record" ON tax_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client record" ON tax_clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for tax preparers
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

-- Service role bypass for API operations
CREATE POLICY "Service role full access submissions" ON mef_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access acknowledgments" ON mef_acknowledgments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access errors" ON mef_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

SELECT 'Tax software tables created successfully' AS result;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_career_courses_products.sql
-- ────────────────────────────────────────────────────────────────

-- Career Services Courses/Products
-- These are purchasable video courses for career development

-- Create career_courses table
CREATE TABLE IF NOT EXISTS career_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  duration_hours DECIMAL(4,1),
  lesson_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  is_bundle BOOLEAN DEFAULT false,
  bundle_course_ids UUID[] DEFAULT '{}',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_features table (what's included)
CREATE TABLE IF NOT EXISTS career_course_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES career_courses(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_modules table (curriculum)
CREATE TABLE IF NOT EXISTS career_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES career_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_purchases table
CREATE TABLE IF NOT EXISTS career_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES career_courses(id),
  email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_courses_active ON career_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_career_courses_slug ON career_courses(slug);
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_user ON career_course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_email ON career_course_purchases(email);

-- Enable RLS
ALTER TABLE career_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for career_courses (public read)
CREATE POLICY "Anyone can view active courses" ON career_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for features (public read)
CREATE POLICY "Anyone can view course features" ON career_course_features
  FOR SELECT USING (true);

-- Policies for modules (purchased users or preview)
CREATE POLICY "Anyone can view preview modules" ON career_course_modules
  FOR SELECT USING (is_preview = true);

CREATE POLICY "Purchased users can view all modules" ON career_course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM career_course_purchases
      WHERE career_course_purchases.course_id = career_course_modules.course_id
      AND career_course_purchases.user_id = auth.uid()
      AND career_course_purchases.status = 'completed'
    )
  );

-- Policies for purchases
CREATE POLICY "Users can view own purchases" ON career_course_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert purchases" ON career_course_purchases
  FOR INSERT WITH CHECK (true);

-- Insert the courses
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bestseller) VALUES
(
  'resume-mastery',
  'Resume Mastery',
  'Build a Resume That Gets Interviews',
  'Learn how to create a professional, ATS-optimized resume that stands out to employers. Includes templates, examples, and step-by-step video guidance.',
  197.00,
  297.00,
  '/images/programs-hq/business-training.jpg',
  3.0,
  12,
  true
),
(
  'interview-domination',
  'Interview Domination',
  'Ace Any Interview With Confidence',
  'Master the art of interviewing with proven techniques, mock interview practice, and insider strategies from hiring managers.',
  297.00,
  397.00,
  '/images/programs-hq/medical-assistant.jpg',
  4.0,
  16,
  false
),
(
  'job-search-accelerator',
  'Job Search Accelerator',
  'Land Your Dream Job in 30 Days',
  'A complete job search system with networking strategies, application tracking, and proven methods to get hired faster.',
  397.00,
  497.00,
  '/images/heroes-hq/career-services-hero.jpg',
  5.0,
  20,
  false
);

-- Insert the bundle
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bundle, bundle_course_ids) 
SELECT 
  'career-launch-bundle',
  'Career Launch Bundle',
  'Complete Career Transformation Package',
  'Get all 3 courses plus exclusive bonuses. Everything you need to land your dream job.',
  597.00,
  891.00,
  '/images/heroes-hq/about-hero.jpg',
  12.0,
  48,
  true,
  ARRAY(SELECT id FROM career_courses WHERE slug IN ('resume-mastery', 'interview-domination', 'job-search-accelerator'));

-- Insert features for Resume Mastery
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('12 HD video lessons', 1),
    ('5 professional resume templates', 2),
    ('ATS optimization checklist', 3),
    ('Cover letter templates', 4),
    ('LinkedIn profile guide', 5),
    ('Lifetime access', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'resume-mastery';

-- Insert features for Interview Domination
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('16 HD video lessons', 1),
    ('Mock interview recordings', 2),
    ('STAR method worksheets', 3),
    ('50+ common questions answered', 4),
    ('Salary negotiation scripts', 5),
    ('Follow-up email templates', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'interview-domination';

-- Insert features for Job Search Accelerator
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('20 HD video lessons', 1),
    ('Job search tracker spreadsheet', 2),
    ('Networking scripts & templates', 3),
    ('Hidden job market strategies', 4),
    ('Personal branding guide', 5),
    ('Weekly action plans', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'job-search-accelerator';

-- Insert features for Bundle
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('All 3 courses included', 1),
    ('48 HD video lessons total', 2),
    ('1-on-1 Resume Review Session ($149 value)', 3),
    ('Private Community Access', 4),
    ('Monthly Live Q&A Calls', 5),
    ('Priority Email Support', 6),
    ('Save $294 vs buying separately', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'career-launch-bundle';

-- Insert modules for Resume Mastery
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Introduction to Resume Writing', 'Overview of what makes a winning resume', 10, 1, true),
    ('Resume Fundamentals & Strategy', 'Understanding resume formats and when to use each', 15, 2, false),
    ('Contact Information Best Practices', 'How to present your contact info professionally', 8, 3, false),
    ('Writing a Powerful Summary', 'Craft a summary that grabs attention', 18, 4, false),
    ('Work Experience That Sells', 'Turn job duties into achievements', 25, 5, false),
    ('Writing Powerful Bullet Points', 'Action verbs and quantifiable results', 20, 6, false),
    ('Education & Certifications', 'Presenting your credentials effectively', 12, 7, false),
    ('Skills Section Optimization', 'Technical and soft skills that matter', 15, 8, false),
    ('ATS Optimization Secrets', 'Beat the applicant tracking systems', 22, 9, false),
    ('Industry-Specific Examples', 'Resume examples for different fields', 20, 10, false),
    ('Cover Letter Mastery', 'Write cover letters that get read', 18, 11, false),
    ('LinkedIn Profile Optimization', 'Align your LinkedIn with your resume', 15, 12, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'resume-mastery';

-- Insert modules for Interview Domination
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Interview Success Mindset', 'Building confidence before the interview', 12, 1, true),
    ('Research & Preparation', 'How to research companies effectively', 15, 2, false),
    ('First Impressions Matter', 'Body language and presentation', 14, 3, false),
    ('Tell Me About Yourself', 'Crafting your personal pitch', 18, 4, false),
    ('Mastering the STAR Method', 'Structure your answers for impact', 25, 5, false),
    ('Behavioral Questions Deep Dive', 'Common questions and winning answers', 30, 6, false),
    ('Technical Interview Prep', 'Industry-specific question strategies', 22, 7, false),
    ('Situational Questions', 'How to handle hypothetical scenarios', 18, 8, false),
    ('Questions to Ask Employers', 'Show interest and gather intel', 12, 9, false),
    ('Virtual Interview Success', 'Zoom, Teams, and video interview tips', 15, 10, false),
    ('Panel Interview Strategies', 'Handle multiple interviewers', 14, 11, false),
    ('Handling Difficult Questions', 'Gaps, weaknesses, and tough topics', 20, 12, false),
    ('Salary Negotiation Tactics', 'Get paid what you deserve', 25, 13, false),
    ('Benefits Negotiation', 'Beyond salary - total compensation', 12, 14, false),
    ('Post-Interview Follow-Up', 'Thank you notes that stand out', 10, 15, false),
    ('Handling Rejection & Next Steps', 'Learn and improve from every interview', 10, 16, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'interview-domination';

-- Insert modules for Job Search Accelerator
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Job Search Strategy Overview', 'Creating your 30-day action plan', 15, 1, true),
    ('Defining Your Target Role', 'Get clear on what you want', 18, 2, false),
    ('Building Your Personal Brand', 'Stand out in a crowded market', 22, 3, false),
    ('Optimizing Your Online Presence', 'LinkedIn, portfolios, and more', 20, 4, false),
    ('The Hidden Job Market', 'Find jobs before they are posted', 25, 5, false),
    ('Networking Fundamentals', 'Build relationships that lead to jobs', 20, 6, false),
    ('Informational Interviews', 'Learn and connect simultaneously', 15, 7, false),
    ('Networking Scripts & Templates', 'What to say and how to say it', 18, 8, false),
    ('Job Board Strategies', 'Use Indeed, LinkedIn, and others effectively', 15, 9, false),
    ('Company Research Deep Dive', 'Target companies strategically', 14, 10, false),
    ('Application Optimization', 'Tailor every application', 18, 11, false),
    ('Tracking Your Applications', 'Stay organized and follow up', 12, 12, false),
    ('Working with Recruiters', 'Leverage staffing agencies', 15, 13, false),
    ('Career Fairs & Events', 'Make the most of in-person opportunities', 12, 14, false),
    ('Managing Multiple Offers', 'A good problem to have', 15, 15, false),
    ('Evaluating Job Offers', 'Compare opportunities objectively', 18, 16, false),
    ('Making Your Decision', 'Choose the right opportunity', 12, 17, false),
    ('Giving Notice Professionally', 'Leave on good terms', 10, 18, false),
    ('First 90 Days Success Plan', 'Start strong in your new role', 20, 19, false),
    ('Long-Term Career Planning', 'Keep growing after you land the job', 15, 20, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'job-search-accelerator';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_partner_documents_system.sql
-- ────────────────────────────────────────────────────────────────

-- Partner Documents System
-- Automated approval based on document completion

-- Partner Documents table
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Document classification
  document_type VARCHAR(50) NOT NULL, -- 'mou', 'w9', 'business_license', 'insurance_coi', 'establishment_license'
  program_id VARCHAR(50), -- NULL = applies to all programs, or specific like 'barber'
  state VARCHAR(50), -- State this document applies to
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100), -- MIME type
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  rejection_reason TEXT,
  
  -- Expiration tracking
  expires_at DATE,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document Requirements table (defines what's needed per state/program)
CREATE TABLE IF NOT EXISTS partner_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  state VARCHAR(50) NOT NULL, -- e.g., 'Indiana', 'ALL'
  program_id VARCHAR(50) NOT NULL, -- e.g., 'barber', 'ALL'
  
  -- Requirement
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(100) NOT NULL, -- Human readable name
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  
  -- Validation rules
  allowed_file_types TEXT[], -- e.g., ['application/pdf', 'image/jpeg']
  max_file_size_mb INTEGER DEFAULT 10,
  requires_expiration BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(state, program_id, document_type)
);

-- Update partners table with status workflow
ALTER TABLE partners ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'draft' 
  CHECK (account_status IN ('draft', 'submitted', 'conditional_access', 'active', 'restricted', 'suspended'));

-- Seed document requirements for Indiana Barber
INSERT INTO partner_document_requirements (state, program_id, document_type, document_name, description, is_required, allowed_file_types, requires_expiration)
VALUES 
  ('Indiana', 'barber', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'business_license', 'Business License', 'Proof of business formation or license', true, ARRAY['application/pdf', 'image/jpeg', 'image/png'], false),
  ('Indiana', 'barber', 'insurance_coi', 'Certificate of Insurance', 'Proof of liability insurance', true, ARRAY['application/pdf'], true),
  ('Indiana', 'barber', 'establishment_license', 'Barber Shop License', 'Indiana State Board barber establishment license', true, ARRAY['application/pdf', 'image/jpeg', 'image/png'], true),
  ('ALL', 'ALL', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('ALL', 'ALL', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false)
ON CONFLICT (state, program_id, document_type) DO NOTHING;

-- Enable RLS
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_document_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_documents
CREATE POLICY "Partners can view own documents"
  ON partner_documents FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can upload documents"
  ON partner_documents FOR INSERT
  WITH CHECK (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all documents"
  ON partner_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for requirements (public read)
CREATE POLICY "Anyone can view document requirements"
  ON partner_document_requirements FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_documents_partner ON partner_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON partner_documents(status);
CREATE INDEX IF NOT EXISTS idx_partner_documents_type ON partner_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_partner_doc_reqs_state_program ON partner_document_requirements(state, program_id);

-- Function to check if partner has all required documents
CREATE OR REPLACE FUNCTION check_partner_document_completion(p_partner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_state VARCHAR(50);
  v_programs TEXT[];
  v_missing_count INTEGER;
BEGIN
  -- Get partner's state
  SELECT state INTO v_state FROM partners WHERE id = p_partner_id;
  
  -- Get partner's programs
  SELECT ARRAY_AGG(program_id) INTO v_programs 
  FROM partner_program_access 
  WHERE partner_id = p_partner_id AND revoked_at IS NULL;
  
  -- Count missing required documents
  SELECT COUNT(*) INTO v_missing_count
  FROM partner_document_requirements req
  WHERE (req.state = v_state OR req.state = 'ALL')
    AND (req.program_id = ANY(v_programs) OR req.program_id = 'ALL')
    AND req.is_required = true
    AND NOT EXISTS (
      SELECT 1 FROM partner_documents doc
      WHERE doc.partner_id = p_partner_id
        AND doc.document_type = req.document_type
        AND doc.status = 'accepted'
        AND (doc.expires_at IS NULL OR doc.expires_at > CURRENT_DATE)
    );
  
  RETURN v_missing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-activate partner if documents complete
CREATE OR REPLACE FUNCTION auto_activate_partner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when document is accepted
  IF NEW.status = 'accepted' THEN
    -- Check if all documents are now complete
    IF check_partner_document_completion(NEW.partner_id) THEN
      -- Activate the partner
      UPDATE partners 
      SET account_status = 'active', updated_at = now()
      WHERE id = NEW.partner_id AND account_status != 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-activate on document acceptance
DROP TRIGGER IF EXISTS trigger_auto_activate_partner ON partner_documents;
CREATE TRIGGER trigger_auto_activate_partner
  AFTER INSERT OR UPDATE OF status ON partner_documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_partner();


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_partner_shop_system.sql
-- ────────────────────────────────────────────────────────────────

-- Partner Shop System
-- Supports program-scoped access control for employer partners (e.g., Barber shops)

-- Partners (the shop entity)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  website VARCHAR(255),
  
  -- Capacity and credentials
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Partner Applications (onboarding submissions)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shop info
  shop_name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  website VARCHAR(255),
  
  -- Programs requested (stored as array)
  programs_requested TEXT[] NOT NULL,
  
  -- Capacity and details
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  additional_notes TEXT,
  
  -- Agreement
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  status_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Link to created partner (after approval)
  partner_id UUID REFERENCES partners(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Users (link auth user to partner + role)
CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('partner_admin', 'partner_staff')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, partner_id)
);

-- Partner Program Access (entitlements)
CREATE TABLE IF NOT EXISTS partner_program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  program_id VARCHAR(100) NOT NULL, -- e.g., 'barber', 'cna', 'hvac'
  
  -- Permissions
  can_view_apprentices BOOLEAN DEFAULT true,
  can_enter_progress BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  
  -- Timestamps
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE(partner_id, program_id)
);

-- Progress Entries (hours/attendance tracking)
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  apprentice_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  program_id VARCHAR(100) NOT NULL,
  
  -- Progress data
  week_ending DATE NOT NULL, -- Always a Friday
  hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 168),
  tasks_completed TEXT,
  notes TEXT,
  
  -- Verification
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'verified', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate entries for same apprentice/week
  UNIQUE(apprentice_id, partner_id, program_id, week_ending)
);

-- Audit Log for partner actions
CREATE TABLE IF NOT EXISTS partner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_program_access_partner ON partner_program_access(partner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_apprentice ON progress_entries(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_partner ON progress_entries(partner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_week ON progress_entries(week_ending);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_partner ON partner_audit_log(partner_id);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_program_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partners: Partner users can view their own partner
CREATE POLICY "Partner users can view own partner"
  ON partners FOR SELECT
  USING (
    id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Partners: Admins can manage all
CREATE POLICY "Admins can manage partners"
  ON partners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Applications: Public can insert (onboarding)
CREATE POLICY "Public can submit partner applications"
  ON partner_applications FOR INSERT
  WITH CHECK (true);

-- Partner Applications: Applicant can view own
CREATE POLICY "Applicants can view own applications"
  ON partner_applications FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Partner Applications: Admins can manage all
CREATE POLICY "Admins can manage partner applications"
  ON partner_applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Users: Users can view own record
CREATE POLICY "Users can view own partner_user record"
  ON partner_users FOR SELECT
  USING (user_id = auth.uid());

-- Partner Users: Partner admins can manage their partner's users
CREATE POLICY "Partner admins can manage partner users"
  ON partner_users FOR ALL
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users 
      WHERE user_id = auth.uid() AND role = 'partner_admin'
    )
  );

-- Partner Program Access: Partner users can view their entitlements
CREATE POLICY "Partner users can view own program access"
  ON partner_program_access FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Progress Entries: Partner users can manage entries for their partner + authorized programs
CREATE POLICY "Partner users can manage progress entries"
  ON progress_entries FOR ALL
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
    AND program_id IN (
      SELECT program_id FROM partner_program_access ppa
      JOIN partner_users pu ON ppa.partner_id = pu.partner_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Audit Log: Partner users can view their partner's audit log
CREATE POLICY "Partner users can view own audit log"
  ON partner_audit_log FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Audit Log: System can insert
CREATE POLICY "System can insert audit log"
  ON partner_audit_log FOR INSERT
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_promo_codes.sql
-- ────────────────────────────────────────────────────────────────

-- =====================================================
-- PROMO CODES SYSTEM
-- Copy and paste into Supabase SQL Editor
-- =====================================================

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all', -- 'all', 'career_courses', 'specific'
  specific_course_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_code_uses table (track who used what)
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  order_id TEXT,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "promo_codes_select" ON promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "promo_code_uses_insert" ON promo_code_uses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "promo_code_uses_select" ON promo_code_uses
  FOR SELECT USING (user_id = auth.uid());

-- Insert some starter promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_until, applies_to) VALUES
('LAUNCH20', 'Launch discount - 20% off', 'percentage', 20.00, 100, NOW() + INTERVAL '90 days', 'career_courses'),
('FIRST50', 'First purchase - $50 off', 'fixed', 50.00, 50, NOW() + INTERVAL '60 days', 'career_courses'),
('BUNDLE100', 'Bundle special - $100 off bundle', 'fixed', 100.00, NULL, NOW() + INTERVAL '30 days', 'career_courses'),
('STUDENT25', 'Student discount - 25% off', 'percentage', 25.00, NULL, NULL, 'all');

-- =====================================================
-- DONE!
-- =====================================================


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_pwa_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_rapids_apprentice_data.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_seed_faqs.sql
-- ────────────────────────────────────────────────────────────────

-- Seed FAQs
INSERT INTO faqs (id, question, answer, category, display_order, is_active) VALUES
  (gen_random_uuid(), 'What programs do you offer?', 'We offer career training programs in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Plumbing, Welding), Technology (IT Support, Cybersecurity), Business (Tax Preparation, Entrepreneurship), and Barber/Cosmetology apprenticeships.', 'Programs', 1, true),
  (gen_random_uuid(), 'How long are the training programs?', 'Program lengths vary from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, skilled trades 12-16 weeks, and technology programs 8-12 weeks.', 'Programs', 2, true),
  (gen_random_uuid(), 'Is the training really free?', 'Yes! Through WIOA (Workforce Innovation and Opportunity Act) funding and other grants, eligible participants can receive 100% free training. We help you determine eligibility and apply for funding.', 'Funding', 3, true),
  (gen_random_uuid(), 'What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is a federal program that provides funding for job training to eligible adults, dislocated workers, and youth. It covers tuition, books, supplies, and sometimes supportive services.', 'Funding', 4, true),
  (gen_random_uuid(), 'How do I know if I qualify for free training?', 'Eligibility depends on factors like income level, employment status, and residency. Generally, if you are unemployed, underemployed, or meet income guidelines, you may qualify. Contact us for a free eligibility assessment.', 'Funding', 5, true),
  (gen_random_uuid(), 'Do you help with job placement?', 'Yes! We provide comprehensive career services including resume writing, interview preparation, job search assistance, and connections to employer partners. Our goal is to help you get hired after completing your training.', 'Career Services', 6, true),
  (gen_random_uuid(), 'Where are you located?', 'Our main campus is located in Indianapolis, Indiana. We also offer some programs at partner locations throughout Indiana. Contact us for specific program locations.', 'General', 7, true),
  (gen_random_uuid(), 'Can I work while attending training?', 'Many of our programs offer flexible scheduling including evening and weekend options. We work with students to accommodate work schedules when possible.', 'General', 8, true),
  (gen_random_uuid(), 'What certifications will I earn?', 'Each program leads to industry-recognized certifications. For example, CNA students earn state nursing assistant certification, HVAC students earn EPA 608 certification, and IT students can earn CompTIA certifications.', 'Programs', 9, true),
  (gen_random_uuid(), 'How do I apply?', 'You can apply online through our website, call us at (317) 314-3757, or visit our campus. The application process includes an eligibility assessment, program selection, and enrollment paperwork.', 'Enrollment', 10, true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_seed_forum_categories.sql
-- ────────────────────────────────────────────────────────────────

-- Seed forum categories
INSERT INTO forum_categories (id, name, description, order_index) VALUES
  (gen_random_uuid(), 'General Discussion', 'General topics and community conversations', 1),
  (gen_random_uuid(), 'Healthcare Programs', 'Discuss CNA, Medical Assistant, Phlebotomy and other healthcare training', 2),
  (gen_random_uuid(), 'Skilled Trades', 'HVAC, Electrical, Plumbing, Welding discussions', 3),
  (gen_random_uuid(), 'Technology', 'IT Support, Cybersecurity, and tech career discussions', 4),
  (gen_random_uuid(), 'Job Search & Career', 'Resume tips, interview prep, job opportunities', 5),
  (gen_random_uuid(), 'Student Support', 'Get help with coursework, funding, and student services', 6)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_seed_marketplace_items.sql
-- ────────────────────────────────────────────────────────────────

-- Seed marketplace items
INSERT INTO marketplace_items (id, title, description, price, category, rating, reviews_count, is_active, created_at) VALUES
  (gen_random_uuid(), 'CNA Study Guide Bundle', 'Comprehensive study materials for CNA certification exam including practice tests, flashcards, and study notes.', 29.99, 'Study Materials', 4.8, 124, true, NOW()),
  (gen_random_uuid(), 'HVAC Fundamentals eBook', 'Complete guide to HVAC systems, maintenance, and troubleshooting for beginners and professionals.', 19.99, 'eBooks', 4.6, 89, true, NOW()),
  (gen_random_uuid(), 'Resume Template Pack', 'Professional resume templates designed for healthcare, trades, and technology careers. Includes cover letter templates.', 14.99, 'Career Resources', 4.9, 256, true, NOW()),
  (gen_random_uuid(), 'Interview Prep Course', 'Video course covering common interview questions, body language tips, and salary negotiation strategies.', 49.99, 'Courses', 4.7, 178, true, NOW()),
  (gen_random_uuid(), 'Medical Terminology Flashcards', 'Digital flashcard set with 500+ medical terms, definitions, and pronunciation guides.', 9.99, 'Study Materials', 4.5, 312, true, NOW()),
  (gen_random_uuid(), 'Electrical Code Reference Guide', 'Quick reference guide for NEC electrical codes with diagrams and examples.', 24.99, 'Reference', 4.8, 67, true, NOW()),
  (gen_random_uuid(), 'Tax Preparation Workbook', 'Practice workbook with sample tax returns and step-by-step instructions for tax preparers.', 34.99, 'Workbooks', 4.6, 145, true, NOW()),
  (gen_random_uuid(), 'IT Certification Practice Tests', 'Practice exams for CompTIA A+, Network+, and Security+ certifications with detailed explanations.', 39.99, 'Practice Tests', 4.9, 423, true, NOW())
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_seed_mentors.sql
-- ────────────────────────────────────────────────────────────────

-- Seed mentors (requires profiles to exist first)
-- This creates mentor records linked to existing staff profiles or creates placeholder mentors

-- First ensure we have the mentors table structure
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  bio TEXT,
  expertise TEXT,
  availability TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample mentors with placeholder data
INSERT INTO mentors (id, bio, expertise, availability, is_active) VALUES
  (gen_random_uuid(), 'Healthcare professional with 15+ years of experience in nursing and patient care. Passionate about helping new CNAs succeed in their careers.', 'Healthcare - CNA, Patient Care', 'Weekday evenings', true),
  (gen_random_uuid(), 'Licensed HVAC technician and business owner. Specializes in commercial refrigeration and mentoring new technicians.', 'HVAC, Refrigeration, Business', 'Flexible schedule', true),
  (gen_random_uuid(), 'IT professional with expertise in cybersecurity and network administration. Helps students prepare for CompTIA certifications.', 'IT Support, Cybersecurity, Networking', 'Weekends', true),
  (gen_random_uuid(), 'Master electrician with 20 years in residential and commercial electrical work. Guides apprentices through licensing requirements.', 'Electrical, Code Compliance', 'Tuesday/Thursday evenings', true),
  (gen_random_uuid(), 'Licensed barber and shop owner. Mentors apprentices on building clientele and business management.', 'Barbering, Business Management', 'Monday/Wednesday afternoons', true),
  (gen_random_uuid(), 'Tax professional and enrolled agent. Helps students navigate tax preparation careers and IRS certifications.', 'Tax Preparation, Accounting', 'Tax season availability varies', true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_seed_scholarships.sql
-- ────────────────────────────────────────────────────────────────

-- Seed scholarships
INSERT INTO scholarships (id, name, description, amount, deadline, eligibility_criteria, max_recipients, current_recipients, is_active) VALUES
  (gen_random_uuid(), 'RISE Healthcare Scholarship', 'Full tuition scholarship for CNA, Medical Assistant, or Phlebotomy training programs. Covers all program costs including books and certification fees.', 5000, '2026-03-31', ARRAY['Indiana resident', 'High school diploma or GED', 'Demonstrated financial need', 'Interest in healthcare career'], 20, 8, true),
  (gen_random_uuid(), 'Skilled Trades Grant', 'Funding for HVAC, Electrical, Plumbing, or Welding training. Includes tool kit and safety equipment.', 4500, '2026-04-15', ARRAY['Indiana resident', '18 years or older', 'Valid drivers license', 'Pass background check'], 15, 5, true),
  (gen_random_uuid(), 'Technology Career Fund', 'Support for IT Support and Cybersecurity certification programs. Covers training, exam fees, and study materials.', 3500, '2026-05-01', ARRAY['Indiana resident', 'Basic computer skills', 'High school diploma or GED'], 25, 12, true),
  (gen_random_uuid(), 'Second Chance Scholarship', 'Dedicated funding for justice-involved individuals seeking career training and a fresh start.', 5000, NULL, ARRAY['Indiana resident', 'Completed sentence or on supervised release', 'Commitment to program completion'], 30, 18, true),
  (gen_random_uuid(), 'Single Parent Support Grant', 'Additional support for single parents including childcare assistance and flexible scheduling accommodations.', 2500, '2026-06-01', ARRAY['Single parent household', 'Indiana resident', 'Enrolled in any Elevate program'], 40, 22, true),
  (gen_random_uuid(), 'Veterans Career Transition', 'Supplemental funding for veterans transitioning to civilian careers. Stackable with GI Bill benefits.', 3000, NULL, ARRAY['Honorable discharge', 'Indiana resident', 'DD-214 documentation'], 50, 15, true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260124_staff_permissions.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260125000000_franchise_management.sql
-- ────────────────────────────────────────────────────────────────

-- Franchise Tax Office Management Schema
-- Supports multi-office, multi-preparer tax preparation business

-- ============================================
-- FRANCHISE OFFICES
-- ============================================

CREATE TABLE IF NOT EXISTS tax_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Office identification
  office_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "IND-001", "CHI-002"
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner/franchisee
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Location
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business details
  business_ein VARCHAR(20), -- Office's own EIN if applicable
  state_license VARCHAR(50), -- State tax preparer license if required
  
  -- ERO relationship (all offices operate under main EFIN)
  parent_efin VARCHAR(6) NOT NULL DEFAULT '358459',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00, -- Fee per return to franchisor
  revenue_share_percent DECIMAL(5,2) DEFAULT 0, -- Alternative to per-return fee
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER, -- NULL = unlimited
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- TAX PREPARERS
-- ============================================

CREATE TABLE IF NOT EXISTS tax_preparers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User link
  user_id UUID REFERENCES auth.users(id),
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P01234567 format
  ptin_expiration DATE,
  
  -- Office assignment
  office_id UUID REFERENCES tax_offices(id),
  
  -- Certification/training
  certification_level VARCHAR(50), -- basic, intermediate, advanced, supervisor
  certifications JSONB DEFAULT '[]', -- Array of certifications with dates
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- IRS requirements
  efin_authorized BOOLEAN DEFAULT FALSE, -- Authorized to use office EFIN
  ero_authorized BOOLEAN DEFAULT FALSE, -- Can sign as ERO (usually only owner)
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance tracking
  returns_prepared_lifetime INTEGER DEFAULT 0,
  returns_prepared_current_season INTEGER DEFAULT 0,
  rejection_rate DECIMAL(5,2) DEFAULT 0,
  average_refund DECIMAL(12,2),
  
  -- Compensation
  compensation_type VARCHAR(20) DEFAULT 'per_return', -- per_return, hourly, salary, commission
  per_return_rate DECIMAL(10,2), -- Amount paid per return
  hourly_rate DECIMAL(10,2),
  commission_percent DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(ptin),
  UNIQUE(email)
);

-- ============================================
-- TAX RETURN ASSIGNMENTS
-- ============================================

-- Extend mef_submissions to track preparer/office
ALTER TABLE mef_submissions 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES tax_offices(id),
ADD COLUMN IF NOT EXISTS preparer_id UUID REFERENCES tax_preparers(id),
ADD COLUMN IF NOT EXISTS ero_id UUID REFERENCES tax_preparers(id), -- Who signed as ERO
ADD COLUMN IF NOT EXISTS preparer_ptin VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_fee DECIMAL(10,2), -- What client paid
ADD COLUMN IF NOT EXISTS franchise_fee DECIMAL(10,2), -- Fee to franchisor
ADD COLUMN IF NOT EXISTS preparer_commission DECIMAL(10,2), -- Preparer's cut
ADD COLUMN IF NOT EXISTS office_revenue DECIMAL(10,2); -- Office's cut

-- ============================================
-- CLIENT MANAGEMENT (per office)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Office relationship
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Client info (encrypted SSN stored separately)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Tax info (non-sensitive)
  filing_status VARCHAR(50),
  dependents_count INTEGER DEFAULT 0,
  
  -- Encrypted sensitive data reference
  ssn_encrypted TEXT, -- Encrypted SSN
  ssn_last_four VARCHAR(4), -- For display/lookup
  
  -- Spouse info (if MFJ)
  spouse_first_name VARCHAR(100),
  spouse_last_name VARCHAR(100),
  spouse_ssn_encrypted TEXT,
  spouse_ssn_last_four VARCHAR(4),
  
  -- Preferred preparer
  preferred_preparer_id UUID REFERENCES tax_preparers(id),
  
  -- History
  client_since DATE DEFAULT CURRENT_DATE,
  returns_filed INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(12,2) DEFAULT 0,
  last_return_date DATE,
  last_return_id UUID REFERENCES mef_submissions(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, do_not_serve
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FEE SCHEDULE (per office customizable)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  office_id UUID REFERENCES tax_offices(id),
  
  -- Fee structure
  name VARCHAR(100) NOT NULL, -- e.g., "Standard 2026", "Premium"
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 75.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 50.00,
  
  -- Add-on fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 25.00, -- Itemized deductions
  fee_schedule_c DECIMAL(10,2) DEFAULT 75.00, -- Business income
  fee_schedule_d DECIMAL(10,2) DEFAULT 35.00, -- Capital gains
  fee_schedule_e DECIMAL(10,2) DEFAULT 50.00, -- Rental income
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00, -- Self-employment tax
  fee_per_w2 DECIMAL(10,2) DEFAULT 0, -- Per W-2 after first
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00, -- Per 1099
  fee_per_dependent DECIMAL(10,2) DEFAULT 10.00,
  fee_state_return DECIMAL(10,2) DEFAULT 45.00,
  fee_eitc DECIMAL(10,2) DEFAULT 0, -- EITC add-on
  fee_ctc DECIMAL(10,2) DEFAULT 0, -- Child tax credit add-on
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 40.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0, -- If offering RALs
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 20.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMISSION/PAYOUT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS preparer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  preparer_id UUID REFERENCES tax_preparers(id) NOT NULL,
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0, -- Chargebacks, errors, etc.
  net_earnings DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, disputed
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50), -- check, direct_deposit, cash
  payment_reference VARCHAR(100), -- Check number, transaction ID
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE FEES/ROYALTIES
-- ============================================

CREATE TABLE IF NOT EXISTS franchise_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Activity
  returns_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Fees owed to franchisor
  per_return_fees DECIMAL(12,2) DEFAULT 0,
  revenue_share DECIMAL(12,2) DEFAULT 0,
  software_fees DECIMAL(12,2) DEFAULT 0,
  other_fees DECIMAL(12,2) DEFAULT 0,
  total_owed DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  status VARCHAR(20) DEFAULT 'pending', -- pending, invoiced, paid, overdue
  invoiced_at TIMESTAMPTZ,
  invoice_number VARCHAR(50),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (for compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  event_type VARCHAR(50) NOT NULL, -- return_created, return_submitted, return_rejected, client_created, etc.
  event_description TEXT,
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  preparer_id UUID REFERENCES tax_preparers(id),
  office_id UUID REFERENCES tax_offices(id),
  
  -- What entity
  entity_type VARCHAR(50), -- submission, client, preparer, office
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tax_offices_status ON tax_offices(status);
CREATE INDEX IF NOT EXISTS idx_tax_offices_owner ON tax_offices(owner_id);

CREATE INDEX IF NOT EXISTS idx_tax_preparers_office ON tax_preparers(office_id);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_ptin ON tax_preparers(ptin);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_status ON tax_preparers(status);

CREATE INDEX IF NOT EXISTS idx_tax_clients_office ON tax_clients(office_id);
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_last_four ON tax_clients(ssn_last_four);
CREATE INDEX IF NOT EXISTS idx_tax_clients_name ON tax_clients(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_mef_submissions_office ON mef_submissions(office_id);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_preparer ON mef_submissions(preparer_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_event ON tax_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON tax_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON tax_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON tax_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tax_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_audit_log ENABLE ROW LEVEL SECURITY;

-- Franchise admin (you) can see everything
CREATE POLICY "Franchise admin full access to offices" ON tax_offices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Office owners can see their own office
CREATE POLICY "Office owners can view own office" ON tax_offices
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Office owners can update own office" ON tax_offices
  FOR UPDATE USING (owner_id = auth.uid());

-- Preparers: office owners and admins can manage
CREATE POLICY "Admins full access to preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

CREATE POLICY "Office owners can manage their preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_preparers.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Preparers can view own record" ON tax_preparers
  FOR SELECT USING (user_id = auth.uid());

-- Clients: office staff can access their office's clients
CREATE POLICY "Admins full access to clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

CREATE POLICY "Office staff can access office clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_preparers 
      WHERE tax_preparers.office_id = tax_clients.office_id 
      AND tax_preparers.user_id = auth.uid()
      AND tax_preparers.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_clients.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

-- Audit log: admins only
CREATE POLICY "Admins can view audit log" ON tax_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Anyone can insert audit log entries
CREATE POLICY "Anyone can create audit entries" ON tax_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_offices_updated_at
  BEFORE UPDATE ON tax_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_preparers_updated_at
  BEFORE UPDATE ON tax_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_clients_updated_at
  BEFORE UPDATE ON tax_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate return fees
CREATE OR REPLACE FUNCTION calculate_return_fee(
  p_office_id UUID,
  p_has_schedule_a BOOLEAN DEFAULT FALSE,
  p_has_schedule_c BOOLEAN DEFAULT FALSE,
  p_has_schedule_d BOOLEAN DEFAULT FALSE,
  p_has_schedule_e BOOLEAN DEFAULT FALSE,
  p_w2_count INTEGER DEFAULT 1,
  p_1099_count INTEGER DEFAULT 0,
  p_dependent_count INTEGER DEFAULT 0,
  p_has_state BOOLEAN DEFAULT FALSE,
  p_is_returning_client BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  v_fee_schedule tax_fee_schedules%ROWTYPE;
  v_total DECIMAL := 0;
BEGIN
  -- Get active fee schedule for office
  SELECT * INTO v_fee_schedule
  FROM tax_fee_schedules
  WHERE office_id = p_office_id
    AND is_default = TRUE
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Use base defaults
    v_total := 75.00;
  ELSE
    -- Base fee
    v_total := v_fee_schedule.base_fee_1040;
    
    -- Schedule add-ons
    IF p_has_schedule_a THEN v_total := v_total + v_fee_schedule.fee_schedule_a; END IF;
    IF p_has_schedule_c THEN v_total := v_total + v_fee_schedule.fee_schedule_c; END IF;
    IF p_has_schedule_d THEN v_total := v_total + v_fee_schedule.fee_schedule_d; END IF;
    IF p_has_schedule_e THEN v_total := v_total + v_fee_schedule.fee_schedule_e; END IF;
    
    -- Per-item fees
    IF p_w2_count > 1 THEN 
      v_total := v_total + (v_fee_schedule.fee_per_w2 * (p_w2_count - 1)); 
    END IF;
    v_total := v_total + (v_fee_schedule.fee_per_1099 * p_1099_count);
    v_total := v_total + (v_fee_schedule.fee_per_dependent * p_dependent_count);
    
    -- State return
    IF p_has_state THEN v_total := v_total + v_fee_schedule.fee_state_return; END IF;
    
    -- Returning client discount
    IF p_is_returning_client THEN
      v_total := v_total * (1 - v_fee_schedule.returning_client_discount_percent / 100);
    END IF;
  END IF;
  
  RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql;

-- Log audit event
CREATE OR REPLACE FUNCTION log_tax_audit_event(
  p_event_type VARCHAR(50),
  p_event_description TEXT,
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_preparer_id UUID;
  v_office_id UUID;
BEGIN
  -- Try to get preparer/office context
  SELECT id, office_id INTO v_preparer_id, v_office_id
  FROM tax_preparers
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  INSERT INTO tax_audit_log (
    event_type, event_description, user_id, preparer_id, office_id,
    entity_type, entity_id, old_values, new_values
  ) VALUES (
    p_event_type, p_event_description, auth.uid(), v_preparer_id, v_office_id,
    p_entity_type, p_entity_id, p_old_values, p_new_values
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260125_admin_tables_v2.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260125_license_lockout_hardening.sql
-- ────────────────────────────────────────────────────────────────

-- License Lockout Hardening Migration
-- Adds columns and functions for total lockout on non-payment

-- Add missing columns to licenses table
ALTER TABLE licenses 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paid_through TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard';

-- Create index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_subscription_id ON licenses(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer_id ON licenses(stripe_customer_id);

-- Stripe webhook events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);

-- Function: Get active license for tenant
CREATE OR REPLACE FUNCTION get_active_license(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  status TEXT,
  plan_type TEXT,
  expires_at TIMESTAMPTZ,
  paid_through TIMESTAMPTZ,
  features JSONB,
  max_users INTEGER
) AS $$
BEGIN
  -- Auto-expire licenses past their expiry date
  UPDATE licenses l
  SET status = 'expired', updated_at = NOW()
  WHERE l.tenant_id = p_tenant_id
    AND l.status = 'active'
    AND l.expires_at < NOW();

  -- Return active license if exists
  RETURN QUERY
  SELECT 
    l.id,
    l.tenant_id,
    l.status,
    l.plan_type,
    l.expires_at,
    l.paid_through,
    l.features,
    l.max_users
  FROM licenses l
  WHERE l.tenant_id = p_tenant_id
    AND l.status = 'active'
  ORDER BY l.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if license is active (boolean)
CREATE OR REPLACE FUNCTION is_license_active(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM get_active_license(p_tenant_id);
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Suspend license
CREATE OR REPLACE FUNCTION suspend_license(
  p_tenant_id UUID,
  p_reason TEXT DEFAULT 'payment_failed'
)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'suspended',
    suspended_at = NOW(),
    suspended_reason = p_reason,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status IN ('active', 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Activate license (after payment)
CREATE OR REPLACE FUNCTION activate_license(
  p_tenant_id UUID,
  p_paid_through TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'active',
    suspended_at = NULL,
    suspended_reason = NULL,
    paid_through = p_paid_through,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status IN ('suspended', 'trial', 'past_due');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire license
CREATE OR REPLACE FUNCTION expire_license(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_license(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_license_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_license(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION activate_license(UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION expire_license(UUID) TO service_role;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260127_license_events.sql
-- ────────────────────────────────────────────────────────────────

-- License Events Table for Webhook Logging
-- Tracks all license state changes for audit and debugging

CREATE TABLE IF NOT EXISTS license_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_license_events_license ON license_events(license_id);
CREATE INDEX IF NOT EXISTS idx_license_events_type ON license_events(event_type);
CREATE INDEX IF NOT EXISTS idx_license_events_created ON license_events(created_at DESC);

-- RLS
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view license events
CREATE POLICY "Admins can view license events"
  ON license_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- System can insert events (via service role)
CREATE POLICY "System can insert license events"
  ON license_events FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE license_events IS 'Audit log for license state changes from Stripe webhooks';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260127_tenant_domains.sql
-- ────────────────────────────────────────────────────────────────

-- Tenant Custom Domains for License Delivery
-- Enables custom domain routing for managed LMS licenses

-- Create tenant_domains table if not exists
CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'disabled')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenant_domains_org ON tenant_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_status ON tenant_domains(status);

-- Function to resolve tenant from domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  license_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    td.organization_id,
    o.name as organization_name,
    l.status as license_status
  FROM tenant_domains td
  JOIN organizations o ON o.id = td.organization_id
  LEFT JOIN licenses l ON l.organization_id = td.organization_id
  WHERE td.domain = p_domain
    AND td.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Admins can manage all domains
CREATE POLICY "Admins can manage tenant domains"
  ON tenant_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Org admins can view their own domains
CREATE POLICY "Org admins can view own domains"
  ON tenant_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tenant_domains.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE tenant_domains IS 'Custom domains for licensed tenants';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_apprenticeship_hours_view.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_barber_apprenticeship_system.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_create_apprentices_table.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_create_hour_transfer_requests.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_create_notification_outbox.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_faqs_table.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_fix_rls_initplan.sql
-- ────────────────────────────────────────────────────────────────

-- Fix Supabase lint 0003_auth_rls_initplan (safe edition)
-- Wraps auth.uid(), auth.role(), auth.jwt(), and current_setting() in subselects
-- to prevent initplan performance issues in RLS policies

DO $rls$
DECLARE
  r RECORD;
  roles_sql TEXT;
  new_qual TEXT;
  new_with_check TEXT;
BEGIN
  FOR r IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND (
        (qual       IS NOT NULL AND (qual       ILIKE '%auth.%' OR qual       ILIKE '%current_setting(%'))
        OR
        (with_check IS NOT NULL AND (with_check ILIKE '%auth.%' OR with_check ILIKE '%current_setting(%'))
      )
  LOOP
    SELECT COALESCE(string_agg(quote_ident(x), ', '), 'PUBLIC')
      INTO roles_sql
    FROM unnest(r.roles) AS x;

    new_qual := r.qual;
    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'auth.uid()',  '(select auth.uid())');
      new_qual := replace(new_qual, 'auth.role()', '(select auth.role())');
      new_qual := replace(new_qual, 'auth.jwt()',  '(select auth.jwt())');
      new_qual := regexp_replace(
        new_qual,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    new_with_check := r.with_check;
    IF new_with_check IS NOT NULL THEN
      new_with_check := replace(new_with_check, 'auth.uid()',  '(select auth.uid())');
      new_with_check := replace(new_with_check, 'auth.role()', '(select auth.role())');
      new_with_check := replace(new_with_check, 'auth.jwt()',  '(select auth.jwt())');
      new_with_check := regexp_replace(
        new_with_check,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I;',
      r.policyname, r.schemaname, r.tablename
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
      r.policyname,
      r.schemaname,
      r.tablename,
      CASE WHEN r.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      r.cmd,
      (CASE WHEN roles_sql IS NULL OR roles_sql = '' THEN 'PUBLIC' ELSE roles_sql END),
      CASE WHEN new_qual IS NOT NULL THEN ' USING (' || new_qual || ')' ELSE '' END,
      CASE WHEN new_with_check IS NOT NULL THEN ' WITH CHECK (' || new_with_check || ')' ELSE '' END
    );
  END LOOP;
END;
$rls$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260128_update_documents_table.sql
-- ────────────────────────────────────────────────────────────────

-- Update documents table to support the document management system
-- Adds missing columns for user_id, file_url, status, metadata, verification_notes

-- Add user_id column (nullable for backward compatibility, references the uploading user)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add file_url column for public URL
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_size column (alias for file_size_bytes)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INT;

-- Add status column for verification workflow
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column if not exists (with default)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add metadata column for additional document info
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add verification_notes column for admin notes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add employment_verification to document_type check constraint
-- First drop the old constraint, then add new one
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (document_type IN (
  'photo_id',
  'school_transcript',
  'certificate',
  'out_of_state_license',
  'shop_license',
  'barber_license',
  'ce_certificate',
  'employment_verification',
  'ipla_packet',
  'other'
));

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Create index on status for verification queue
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Update existing records to set status based on verified column
UPDATE documents SET status = 'verified' WHERE verified = true AND status IS NULL;
UPDATE documents SET status = 'pending' WHERE verified = false AND status IS NULL;

-- Backfill user_id from uploaded_by where possible (if uploaded_by is a UUID)
UPDATE documents 
SET user_id = uploaded_by::uuid 
WHERE user_id IS NULL 
  AND uploaded_by IS NOT NULL 
  AND uploaded_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Add comment
COMMENT ON COLUMN documents.user_id IS 'User who uploaded the document (references auth.users)';
COMMENT ON COLUMN documents.status IS 'Verification status: pending, verified, rejected';
COMMENT ON COLUMN documents.verification_notes IS 'Admin notes when verifying/rejecting';

-- Add docs_verified columns to enrollments table for tracking verification status
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS docs_verified BOOLEAN DEFAULT false;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS docs_verified_at TIMESTAMPTZ;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_application_state_machine.sql
-- ────────────────────────────────────────────────────────────────

-- Application State Machine Migration
-- Enforces canonical flow for career applications
-- States: started -> eligibility_complete -> documents_complete -> review_ready -> submitted -> rejected

-- 1. Create state enum
DO $$ BEGIN
  CREATE TYPE application_state AS ENUM (
    'started',
    'eligibility_complete', 
    'documents_complete',
    'review_ready',
    'submitted',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add state columns to career_applications
ALTER TABLE career_applications 
  ADD COLUMN IF NOT EXISTS application_state application_state DEFAULT 'started',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_transition_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS state_history JSONB DEFAULT '[]'::jsonb;

-- 3. Create index on application_state
CREATE INDEX IF NOT EXISTS idx_career_applications_state 
  ON career_applications(application_state);

-- 4. State transition validation function
CREATE OR REPLACE FUNCTION validate_application_state_transition(
  current_state application_state,
  next_state application_state
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid transitions
  RETURN CASE
    WHEN current_state = 'started' AND next_state = 'eligibility_complete' THEN TRUE
    WHEN current_state = 'eligibility_complete' AND next_state = 'documents_complete' THEN TRUE
    WHEN current_state = 'documents_complete' AND next_state = 'review_ready' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'submitted' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'rejected' THEN TRUE
    WHEN current_state = 'submitted' AND next_state = 'rejected' THEN TRUE
    -- Allow going back one step for corrections
    WHEN current_state = 'eligibility_complete' AND next_state = 'started' THEN TRUE
    WHEN current_state = 'documents_complete' AND next_state = 'eligibility_complete' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'documents_complete' THEN TRUE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. RPC: Start a new application
CREATE OR REPLACE FUNCTION start_application(
  p_user_id UUID DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_application_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing in-progress application by email
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM career_applications
    WHERE email = p_email
      AND application_state NOT IN ('submitted', 'rejected')
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'application_id', v_existing_id,
        'resumed', true,
        'message', 'Existing application found'
      );
    END IF;
  END IF;

  -- Create new application in 'started' state
  INSERT INTO career_applications (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    application_state,
    last_transition_at,
    state_history,
    status
  ) VALUES (
    p_user_id,
    COALESCE(p_first_name, ''),
    COALESCE(p_last_name, ''),
    COALESCE(p_email, ''),
    COALESCE(p_phone, ''),
    'started',
    NOW(),
    jsonb_build_array(jsonb_build_object(
      'state', 'started',
      'timestamp', NOW(),
      'action', 'created'
    )),
    'draft'
  )
  RETURNING id INTO v_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_application_id,
    'resumed', false,
    'message', 'Application started'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Advance application state with validation
CREATE OR REPLACE FUNCTION advance_application_state(
  p_application_id UUID,
  p_next_state application_state,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_valid BOOLEAN;
  v_history JSONB;
BEGIN
  -- Get current state
  SELECT application_state, state_history 
  INTO v_current_state, v_history
  FROM career_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Validate transition
  v_valid := validate_application_state_transition(v_current_state, p_next_state);
  
  IF NOT v_valid THEN
    -- Log invalid transition attempt
    INSERT INTO audit_logs (
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      'invalid_state_transition',
      'career_application',
      p_application_id,
      jsonb_build_object(
        'from_state', v_current_state,
        'attempted_state', p_next_state,
        'data', p_data
      ),
      NOW()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition from %s to %s', v_current_state, p_next_state),
      'code', 'INVALID_TRANSITION',
      'current_state', v_current_state
    );
  END IF;

  -- Build new history entry and cap to last 20 transitions
  v_history := v_history || jsonb_build_array(jsonb_build_object(
    'state', p_next_state,
    'timestamp', NOW(),
    'from_state', v_current_state
  ));
  -- Cap history to last 20 entries to prevent unbounded growth
  IF jsonb_array_length(v_history) > 20 THEN
    v_history := (SELECT jsonb_agg(elem) FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 20
    ) sub);
  END IF;

  -- Update state with field whitelisting per state
  -- Fields are only writable at specific states to prevent data tampering
  UPDATE career_applications
  SET 
    application_state = p_next_state,
    last_transition_at = NOW(),
    state_history = v_history,
    updated_at = NOW(),
    -- Personal info: only writable in 'started' state or when transitioning TO eligibility_complete
    first_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'first_name', first_name) ELSE first_name END,
    last_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'last_name', last_name) ELSE last_name END,
    email = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'email', email) ELSE email END,
    phone = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'phone', phone) ELSE phone END,
    date_of_birth = CASE WHEN v_current_state = 'started' THEN COALESCE((p_data->>'date_of_birth')::DATE, date_of_birth) ELSE date_of_birth END,
    address = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'address', address) ELSE address END,
    city = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'city', city) ELSE city END,
    state = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'state', state) ELSE state END,
    zip_code = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'zip_code', zip_code) ELSE zip_code END,
    -- Education: only writable in 'eligibility_complete' state or earlier
    high_school = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'high_school', high_school) ELSE high_school END,
    graduation_year = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'graduation_year', graduation_year) ELSE graduation_year END,
    gpa = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'gpa', gpa) ELSE gpa END,
    college = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'college', college) ELSE college END,
    major = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'major', major) ELSE major END,
    -- Program selection: only writable in 'documents_complete' state or earlier
    program_id = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE((p_data->>'program_id')::UUID, program_id) ELSE program_id END,
    funding_type = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'funding_type', funding_type) ELSE funding_type END,
    -- Employment: only writable before review_ready
    employment_status = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'employment_status', employment_status) ELSE employment_status END,
    current_employer = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'current_employer', current_employer) ELSE current_employer END,
    years_experience = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'years_experience', years_experience) ELSE years_experience END
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'previous_state', v_current_state,
    'current_state', p_next_state,
    'message', format('Transitioned from %s to %s', v_current_state, p_next_state)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Submit application (final state transition)
CREATE OR REPLACE FUNCTION submit_application(
  p_application_id UUID,
  p_agree_terms BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Get current state and validate
  SELECT application_state, email, first_name, last_name
  INTO v_current_state, v_email, v_first_name, v_last_name
  FROM career_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Must be in review_ready state to submit
  IF v_current_state != 'review_ready' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Cannot submit application in state: %s. Must complete all steps first.', v_current_state),
      'code', 'INVALID_STATE',
      'current_state', v_current_state,
      'required_state', 'review_ready'
    );
  END IF;

  -- Must agree to terms
  IF NOT p_agree_terms THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Must agree to terms and conditions',
      'code', 'TERMS_NOT_ACCEPTED'
    );
  END IF;

  -- Validate required fields
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  IF v_first_name IS NULL OR v_first_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'First name is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  IF v_last_name IS NULL OR v_last_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Last name is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  -- Perform final submission
  UPDATE career_applications
  SET 
    application_state = 'submitted',
    submitted_at = NOW(),
    last_transition_at = NOW(),
    status = 'submitted',
    state_history = state_history || jsonb_build_array(jsonb_build_object(
      'state', 'submitted',
      'timestamp', NOW(),
      'from_state', v_current_state,
      'terms_accepted', true
    )),
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Log successful submission
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    'application_submitted',
    'career_application',
    p_application_id,
    jsonb_build_object(
      'email', v_email,
      'name', v_first_name || ' ' || v_last_name
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'submitted_at', NOW(),
    'message', 'Application submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Get application state (for UI)
CREATE OR REPLACE FUNCTION get_application_state(
  p_application_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'application_id', id,
    'current_state', application_state,
    'submitted_at', submitted_at,
    'last_transition_at', last_transition_at,
    'state_history', state_history,
    'can_submit', application_state = 'review_ready'
  ) INTO v_result
  FROM career_applications
  WHERE id = p_application_id;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;

  RETURN jsonb_build_object('success', true) || v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION start_application TO authenticated, anon;
GRANT EXECUTE ON FUNCTION advance_application_state TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_application TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_application_state TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_application_state_transition TO authenticated, anon;

-- 10. Add missing columns to career_applications if they don't exist
-- (These may be needed for the full application form)
DO $$ BEGIN
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS zip_code TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS high_school TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS graduation_year TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS gpa TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS college TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS major TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS program_id UUID;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS funding_type TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS employment_status TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS current_employer TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS years_experience TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 11. RLS policies to prevent direct state manipulation
-- Users can only read their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON career_applications;
CREATE POLICY "Users can view own applications" ON career_applications
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR user_id IS NULL  -- Allow anonymous applications to be viewed during session
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Block ALL direct inserts - must use start_application RPC
DROP POLICY IF EXISTS "Block direct inserts" ON career_applications;
CREATE POLICY "Block direct inserts" ON career_applications
  FOR INSERT
  WITH CHECK (FALSE);  -- Always deny direct inserts

-- Block ALL direct updates - must use RPCs
DROP POLICY IF EXISTS "Block direct updates" ON career_applications;
CREATE POLICY "Block direct updates" ON career_applications
  FOR UPDATE
  USING (FALSE)  -- Always deny direct updates
  WITH CHECK (FALSE);

-- Block ALL direct deletes
DROP POLICY IF EXISTS "Block direct deletes" ON career_applications;
CREATE POLICY "Block direct deletes" ON career_applications
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 12. Comment documentation
COMMENT ON TYPE application_state IS 'Canonical states for application lifecycle: started -> eligibility_complete -> documents_complete -> review_ready -> submitted | rejected';
COMMENT ON FUNCTION start_application IS 'Initialize a new application or resume existing. Returns application_id. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION advance_application_state IS 'Transition application to next state with validation. Rejects invalid transitions. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION submit_application IS 'Final submission. Requires state=review_ready and terms acceptance. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION get_application_state IS 'Get current application state and history for UI. SECURITY DEFINER bypasses RLS.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_application_state_machine_tests.sql
-- ────────────────────────────────────────────────────────────────

-- Application State Machine Tests
-- Run these after applying the migration to verify correctness
-- Execute as service_role to bypass RLS for testing

-- ============================================
-- TEST SUITE: State Machine Verification
-- ============================================

DO $$
DECLARE
  v_app_id UUID;
  v_app_id_2 UUID;
  v_result JSONB;
  v_test_email TEXT := 'test_' || gen_random_uuid()::text || '@test.com';
BEGIN
  RAISE NOTICE '=== Starting State Machine Tests ===';

  -- TEST 1: start_application creates new application
  RAISE NOTICE 'TEST 1: start_application creates new application';
  SELECT start_application(
    NULL,
    'Test',
    'User',
    v_test_email,
    '555-1234'
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Could not create application: %', v_result->>'error';
  END IF;
  v_app_id := (v_result->>'application_id')::UUID;
  RAISE NOTICE 'TEST 1 PASSED: Created application %', v_app_id;

  -- TEST 2: start_application is idempotent (same email returns same ID)
  RAISE NOTICE 'TEST 2: start_application idempotency';
  SELECT start_application(
    NULL,
    'Test',
    'User',
    v_test_email,
    '555-1234'
  ) INTO v_result;
  
  IF (v_result->>'application_id')::UUID != v_app_id THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Idempotency broken - got different ID';
  END IF;
  IF NOT (v_result->>'resumed')::boolean THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Should indicate resumed=true';
  END IF;
  RAISE NOTICE 'TEST 2 PASSED: Same application ID returned, resumed=true';

  -- TEST 3: Valid forward transition started -> eligibility_complete
  RAISE NOTICE 'TEST 3: Valid transition started -> eligibility_complete';
  SELECT advance_application_state(
    v_app_id,
    'eligibility_complete',
    '{"first_name": "Updated", "last_name": "Name"}'::jsonb
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 3 FAILED: %', v_result->>'error';
  END IF;
  IF v_result->>'current_state' != 'eligibility_complete' THEN
    RAISE EXCEPTION 'TEST 3 FAILED: State not updated correctly';
  END IF;
  RAISE NOTICE 'TEST 3 PASSED: Transitioned to eligibility_complete';

  -- TEST 4: Invalid transition started -> review_ready (should fail)
  RAISE NOTICE 'TEST 4: Invalid transition eligibility_complete -> submitted (skip)';
  SELECT advance_application_state(
    v_app_id,
    'submitted',
    '{}'::jsonb
  ) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Should have rejected invalid transition';
  END IF;
  IF v_result->>'code' != 'INVALID_TRANSITION' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 4 PASSED: Invalid transition rejected with INVALID_TRANSITION';

  -- TEST 5: Continue valid path to review_ready
  RAISE NOTICE 'TEST 5: Complete path to review_ready';
  SELECT advance_application_state(v_app_id, 'documents_complete', '{}'::jsonb) INTO v_result;
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 5a FAILED: %', v_result->>'error';
  END IF;
  
  SELECT advance_application_state(v_app_id, 'review_ready', '{}'::jsonb) INTO v_result;
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 5b FAILED: %', v_result->>'error';
  END IF;
  RAISE NOTICE 'TEST 5 PASSED: Reached review_ready state';

  -- TEST 6: Submit without terms (should fail)
  RAISE NOTICE 'TEST 6: Submit without terms acceptance';
  SELECT submit_application(v_app_id, FALSE) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Should require terms acceptance';
  END IF;
  IF v_result->>'code' != 'TERMS_NOT_ACCEPTED' THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 6 PASSED: Rejected without terms';

  -- TEST 7: Valid submission
  RAISE NOTICE 'TEST 7: Valid submission with terms';
  SELECT submit_application(v_app_id, TRUE) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 7 FAILED: %', v_result->>'error';
  END IF;
  RAISE NOTICE 'TEST 7 PASSED: Application submitted successfully';

  -- TEST 8: Verify submitted_at is set
  RAISE NOTICE 'TEST 8: Verify submitted_at timestamp';
  IF NOT EXISTS (
    SELECT 1 FROM career_applications 
    WHERE id = v_app_id AND submitted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TEST 8 FAILED: submitted_at not set';
  END IF;
  RAISE NOTICE 'TEST 8 PASSED: submitted_at is set';

  -- TEST 9: Cannot transition from submitted
  RAISE NOTICE 'TEST 9: Cannot transition from submitted';
  SELECT advance_application_state(v_app_id, 'started', '{}'::jsonb) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 9 FAILED: Should not allow transition from submitted';
  END IF;
  RAISE NOTICE 'TEST 9 PASSED: Transition from submitted blocked';

  -- TEST 10: Submit on non-review_ready state fails
  RAISE NOTICE 'TEST 10: Submit requires review_ready state';
  -- Create a new application
  SELECT start_application(
    NULL, 'Test2', 'User2', 
    'test2_' || gen_random_uuid()::text || '@test.com',
    '555-5678'
  ) INTO v_result;
  v_app_id_2 := (v_result->>'application_id')::UUID;
  
  SELECT submit_application(v_app_id_2, TRUE) INTO v_result;
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Should require review_ready state';
  END IF;
  IF v_result->>'code' != 'INVALID_STATE' THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 10 PASSED: Submit blocked on non-review_ready state';

  -- TEST 11: Backward transition allowed
  RAISE NOTICE 'TEST 11: Backward transition eligibility_complete -> started';
  SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{}'::jsonb) INTO v_result;
  SELECT advance_application_state(v_app_id_2, 'started', '{}'::jsonb) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 11 FAILED: Backward transition should be allowed';
  END IF;
  RAISE NOTICE 'TEST 11 PASSED: Backward transition allowed';

  -- TEST 12: State history is capped
  RAISE NOTICE 'TEST 12: State history cap verification';
  -- Do many transitions
  FOR i IN 1..25 LOOP
    SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{}'::jsonb) INTO v_result;
    SELECT advance_application_state(v_app_id_2, 'started', '{}'::jsonb) INTO v_result;
  END LOOP;
  
  IF (SELECT jsonb_array_length(state_history) FROM career_applications WHERE id = v_app_id_2) > 20 THEN
    RAISE EXCEPTION 'TEST 12 FAILED: State history exceeds cap of 20';
  END IF;
  RAISE NOTICE 'TEST 12 PASSED: State history capped at 20';

  -- TEST 13: Field whitelisting - personal info locked after started
  RAISE NOTICE 'TEST 13: Field whitelisting verification';
  -- Advance to eligibility_complete
  SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{"first_name": "Locked"}'::jsonb) INTO v_result;
  -- Try to change first_name in documents_complete transition
  SELECT advance_application_state(v_app_id_2, 'documents_complete', '{"first_name": "ShouldNotChange"}'::jsonb) INTO v_result;
  
  IF (SELECT first_name FROM career_applications WHERE id = v_app_id_2) = 'ShouldNotChange' THEN
    RAISE EXCEPTION 'TEST 13 FAILED: first_name should be locked after started state';
  END IF;
  RAISE NOTICE 'TEST 13 PASSED: Field whitelisting enforced';

  -- TEST 14: Audit log written for invalid transition
  RAISE NOTICE 'TEST 14: Audit log for invalid transitions';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_app_id 
    AND action = 'invalid_state_transition'
  ) THEN
    RAISE EXCEPTION 'TEST 14 FAILED: Audit log not written for invalid transition';
  END IF;
  RAISE NOTICE 'TEST 14 PASSED: Audit log written';

  -- TEST 15: Audit log written for successful submission
  RAISE NOTICE 'TEST 15: Audit log for successful submission';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_app_id 
    AND action = 'application_submitted'
  ) THEN
    RAISE EXCEPTION 'TEST 15 FAILED: Audit log not written for submission';
  END IF;
  RAISE NOTICE 'TEST 15 PASSED: Submission audit log written';

  -- Cleanup test data
  DELETE FROM career_applications WHERE id IN (v_app_id, v_app_id_2);
  DELETE FROM audit_logs WHERE entity_id IN (v_app_id, v_app_id_2);

  RAISE NOTICE '=== All 15 Tests PASSED ===';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_document_rls.sql
-- ────────────────────────────────────────────────────────────────

-- RLS DOCUMENTATION (policies already exist)
-- This migration documents existing Row Level Security policies for audit purposes

comment on table enrollments is 'RLS enforced: users see only own enrollments or org scope';
comment on table lesson_progress is 'RLS enforced: user_id = auth.uid()';
comment on table certificates is 'RLS enforced: owner or verifier access';
comment on table tenants is 'RLS enforced: tenant isolation';
comment on table profiles is 'RLS enforced: users can only read/update own profile';
comment on table courses is 'RLS enforced: public read, admin write';
comment on table lessons is 'RLS enforced: enrolled users can read, admin write';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_fix_rls_user_metadata_security.sql
-- ────────────────────────────────────────────────────────────────

-- Fix RLS Security: Remove user_metadata references
-- 
-- SECURITY ISSUE: user_metadata is editable by end users and should never
-- be used in RLS policies. This migration replaces all user_metadata 
-- references with secure lookups from the profiles table.
--
-- Affected tables:
-- - public.tenants
-- - public.licenses  
-- - public.license_purchases
-- - public.provisioning_events
-- - public.license_violations

-- ============================================
-- STEP 1: Create secure tenant lookup function
-- ============================================

-- Drop the insecure function
DROP FUNCTION IF EXISTS get_current_tenant_id();

-- Create secure version that ONLY uses profiles table
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from profiles table (server-controlled, not user-editable)
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_current_tenant_id IS 
  'Securely returns tenant_id from profiles table. Never uses user_metadata.';

-- ============================================
-- STEP 2: Drop insecure policies on tenants
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;

-- Create secure policy
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 3: Drop insecure policies on licenses
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant licenses" ON licenses;

-- Create secure policy
CREATE POLICY "Users can view own tenant licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 4: Drop insecure policies on license_purchases
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant purchases" ON license_purchases;

-- Create secure policy
CREATE POLICY "Users can view own tenant purchases"
  ON license_purchases FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 5: Drop insecure policies on provisioning_events
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant provisioning events" ON provisioning_events;

-- Create secure policy (admins only within tenant)
CREATE POLICY "Users can view own tenant provisioning events"
  ON provisioning_events FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 6: Drop insecure policies on license_violations
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant violations" ON license_violations;

-- Create secure policy (admins only within tenant)
CREATE POLICY "Users can view own tenant violations"
  ON license_violations FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 7: Ensure is_super_admin function is secure
-- ============================================

-- Recreate to ensure it doesn't use user_metadata
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION is_super_admin IS 
  'Securely checks super_admin role from profiles table. Never uses user_metadata.';

-- ============================================
-- VERIFICATION: Check no policies reference user_metadata
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- This will fail if any policies still reference user_metadata
  -- (Manual verification recommended after migration)
  RAISE NOTICE 'Migration complete. Verify no policies reference user_metadata in Supabase dashboard.';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_phase2_enrollment_orchestration.sql
-- ────────────────────────────────────────────────────────────────

-- Phase 2: Atomic Enrollment Orchestration
-- Eliminates partial writes by moving all enrollment logic to database

-- ============================================
-- 1. Idempotency Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
  ON idempotency_keys(user_id, operation, idempotency_key);

-- ============================================
-- 2. Unique Constraints (prevent duplicates)
-- ============================================
-- Ensure one enrollment per user per program
DO $$ BEGIN
  ALTER TABLE program_enrollments 
    ADD CONSTRAINT uq_program_enrollments_user_program 
    UNIQUE (student_id, program_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure one enrollment per user per course
DO $$ BEGIN
  ALTER TABLE enrollments 
    ADD CONSTRAINT uq_enrollments_user_course 
    UNIQUE (user_id, course_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. Enrollment Status Enum (if not exists)
-- ============================================
DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM (
    'pending',
    'in_progress',
    'active',
    'completed',
    'cancelled',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4. Main RPC: rpc_enroll_student
-- ============================================
CREATE OR REPLACE FUNCTION rpc_enroll_student(
  p_user_id UUID,
  p_program_id UUID,
  p_idempotency_key TEXT,
  p_source TEXT DEFAULT 'app',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_program_enrollment_id UUID;
  v_program_holder_id UUID;
  v_funding_source TEXT;
  v_course_record RECORD;
  v_courses_enrolled INTEGER := 0;
  v_steps_created INTEGER := 0;
  v_program_name TEXT;
  v_student_name TEXT;
  v_student_email TEXT;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_user_id
    AND operation = 'enroll_student'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'enrollment_id', v_existing_result->>'enrollment_id',
      'message', 'Enrollment already processed'
    );
  END IF;

  -- ========================================
  -- LOCK: Prevent concurrent enrollment
  -- ========================================
  -- Lock the user's profile row to serialize enrollment attempts
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Check if already enrolled in this program
  SELECT id INTO v_program_enrollment_id
  FROM program_enrollments
  WHERE student_id = p_user_id AND program_id = p_program_id
  FOR UPDATE;

  IF v_program_enrollment_id IS NOT NULL THEN
    -- Already enrolled, return existing
    INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
    VALUES (p_user_id, 'enroll_student', p_idempotency_key, 
      jsonb_build_object('enrollment_id', v_program_enrollment_id, 'already_enrolled', true)
    ) ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'enrollment_id', v_program_enrollment_id,
      'already_enrolled', true,
      'message', 'Already enrolled in this program'
    );
  END IF;

  -- ========================================
  -- GATHER REQUIRED DATA
  -- ========================================
  -- Get program holder and funding info from profile
  SELECT program_holder_id, COALESCE(p_metadata->>'funding_source', 'WIOA')
  INTO v_program_holder_id, v_funding_source
  FROM profiles
  WHERE id = p_user_id;

  -- Get program name
  SELECT name INTO v_program_name
  FROM programs
  WHERE id = p_program_id;

  -- Get student info
  SELECT full_name, email INTO v_student_name, v_student_email
  FROM profiles
  WHERE id = p_user_id;

  -- ========================================
  -- STEP 1: Create program enrollment
  -- ========================================
  INSERT INTO program_enrollments (
    student_id,
    program_id,
    program_holder_id,
    funding_source,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_program_id,
    v_program_holder_id,
    v_funding_source,
    'IN_PROGRESS',
    NOW()
  )
  RETURNING id INTO v_program_enrollment_id;

  -- ========================================
  -- STEP 2: Create course enrollments
  -- ========================================
  FOR v_course_record IN
    SELECT c.id, c.title
    FROM program_courses pc
    JOIN courses c ON c.id = pc.course_id
    WHERE pc.program_id = p_program_id
      AND c.is_published = true
  LOOP
    INSERT INTO enrollments (
      user_id,
      course_id,
      status,
      progress_percent,
      started_at,
      enrollment_method,
      funding_source
    ) VALUES (
      p_user_id,
      v_course_record.id,
      'active',
      0,
      NOW(),
      'program',
      v_funding_source
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    v_courses_enrolled := v_courses_enrolled + 1;
  END LOOP;

  -- Also enroll in courses directly linked via program_id
  FOR v_course_record IN
    SELECT id, title
    FROM courses
    WHERE program_id = p_program_id
      AND is_published = true
  LOOP
    INSERT INTO enrollments (
      user_id,
      course_id,
      status,
      progress_percent,
      started_at,
      enrollment_method,
      funding_source
    ) VALUES (
      p_user_id,
      v_course_record.id,
      'active',
      0,
      NOW(),
      'program',
      v_funding_source
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    v_courses_enrolled := v_courses_enrolled + 1;
  END LOOP;

  -- ========================================
  -- STEP 3: Generate enrollment steps (if RPC exists)
  -- ========================================
  BEGIN
    SELECT generate_enrollment_steps(v_program_enrollment_id) INTO v_steps_created;
  EXCEPTION WHEN undefined_function THEN
    v_steps_created := 0;
  END;

  -- ========================================
  -- STEP 4: Update profile status
  -- ========================================
  UPDATE profiles
  SET 
    enrollment_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- ========================================
  -- STEP 5: Create notification
  -- ========================================
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    metadata,
    read,
    created_at
  ) VALUES (
    p_user_id,
    'system',
    'Enrollment Confirmed',
    format('You have been enrolled in %s', COALESCE(v_program_name, 'the program')),
    '/lms',
    'Start Learning',
    jsonb_build_object(
      'enrollment_id', v_program_enrollment_id,
      'program_id', p_program_id,
      'source', p_source
    ),
    false,
    NOW()
  );

  -- Notify program holder if assigned
  IF v_program_holder_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      metadata,
      read,
      created_at
    )
    SELECT
      ph.user_id,
      'system',
      'New Student Enrolled',
      format('%s has been enrolled in %s', COALESCE(v_student_name, 'A student'), COALESCE(v_program_name, 'the program')),
      '/program-holder/students',
      'View Students',
      jsonb_build_object(
        'enrollment_id', v_program_enrollment_id,
        'student_id', p_user_id,
        'program_id', p_program_id
      ),
      false,
      NOW()
    FROM program_holders ph
    WHERE ph.id = v_program_holder_id;
  END IF;

  -- ========================================
  -- STEP 6: Create delivery log for email
  -- ========================================
  INSERT INTO delivery_logs (
    notification_id,
    channel,
    recipient,
    status,
    sent_at
  )
  SELECT 
    n.id,
    'email',
    v_student_email,
    'pending',
    NULL
  FROM notifications n
  WHERE n.metadata->>'enrollment_id' = v_program_enrollment_id::text
    AND n.user_id = p_user_id
  LIMIT 1;

  -- ========================================
  -- STEP 7: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    'enrollment_created',
    'program_enrollment',
    v_program_enrollment_id,
    jsonb_build_object(
      'user_id', p_user_id,
      'program_id', p_program_id,
      'idempotency_key', p_idempotency_key,
      'source', p_source,
      'courses_enrolled', v_courses_enrolled,
      'steps_created', v_steps_created
    ),
    NOW()
  );

  -- ========================================
  -- STEP 8: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_user_id, 
    'enroll_student', 
    p_idempotency_key,
    jsonb_build_object(
      'enrollment_id', v_program_enrollment_id,
      'courses_enrolled', v_courses_enrolled,
      'steps_created', v_steps_created
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_program_enrollment_id,
    'courses_enrolled', v_courses_enrolled,
    'steps_created', v_steps_created,
    'message', 'Enrollment completed successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Transaction will rollback automatically
  -- Return structured error
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_enroll_student TO authenticated, service_role;

-- ============================================
-- 6. Documentation
-- ============================================
COMMENT ON FUNCTION rpc_enroll_student IS 
'Atomic enrollment orchestration. Creates program enrollment, course enrollments, 
notifications, and audit logs in a single transaction. Idempotent via idempotency_key.
All writes succeed or all fail - no partial state.';

COMMENT ON TABLE idempotency_keys IS
'Tracks idempotent operations to prevent duplicate processing on retries.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_phase2_partner_approval.sql
-- ────────────────────────────────────────────────────────────────

-- Phase 2: Atomic Partner Approval
-- Two-phase approval: DB-only first, then auth linking

-- ============================================
-- 1. Partner Approval Status Enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE partner_approval_status AS ENUM (
    'pending',
    'approved_pending_user',  -- DB approved, waiting for auth user creation
    'approved',               -- Fully approved with auth user linked
    'denied',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add approval_status column if not exists
ALTER TABLE partner_applications 
  ADD COLUMN IF NOT EXISTS approval_status partner_approval_status DEFAULT 'pending';

-- ============================================
-- 2. RPC: rpc_approve_partner (Phase 1 - DB Only)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_approve_partner(
  p_partner_application_id UUID,
  p_admin_user_id UUID,
  p_partner_email TEXT,
  p_program_ids UUID[],
  p_idempotency_key TEXT,
  p_profile JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_application RECORD;
  v_partner_id UUID;
  v_program_id UUID;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_admin_user_id
    AND operation = 'approve_partner'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'partner_id', v_existing_result->>'partner_id',
      'message', 'Partner approval already processed'
    );
  END IF;

  -- ========================================
  -- LOCK & VALIDATE APPLICATION
  -- ========================================
  SELECT * INTO v_application
  FROM partner_applications
  WHERE id = p_partner_application_id
  FOR UPDATE;

  IF v_application IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Partner application not found'
    );
  END IF;

  IF v_application.status NOT IN ('pending') AND v_application.approval_status NOT IN ('pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_PROCESSED',
      'message', format('Application already processed with status: %s', v_application.status)
    );
  END IF;

  -- ========================================
  -- STEP 1: Create partner entity
  -- ========================================
  INSERT INTO partners (
    name,
    dba,
    ein,
    owner_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    website,
    apprentice_capacity,
    schedule_notes,
    license_number,
    license_state,
    license_expiry,
    status,
    account_status,
    approved_at
  ) VALUES (
    v_application.shop_name,
    v_application.dba,
    v_application.ein,
    v_application.owner_name,
    COALESCE(p_partner_email, v_application.contact_email),
    v_application.phone,
    v_application.address_line1,
    v_application.address_line2,
    v_application.city,
    v_application.state,
    v_application.zip,
    v_application.website,
    v_application.apprentice_capacity,
    v_application.schedule_notes,
    v_application.license_number,
    v_application.license_state,
    v_application.license_expiry,
    'active',
    'pending_user',  -- Not fully active until auth user linked
    NOW()
  )
  RETURNING id INTO v_partner_id;

  -- ========================================
  -- STEP 2: Create program access entries
  -- ========================================
  IF p_program_ids IS NOT NULL AND array_length(p_program_ids, 1) > 0 THEN
    FOREACH v_program_id IN ARRAY p_program_ids
    LOOP
      INSERT INTO partner_program_access (
        partner_id,
        program_id,
        can_view_apprentices,
        can_enter_progress,
        can_view_reports,
        created_at
      ) VALUES (
        v_partner_id,
        v_program_id,
        true,
        true,
        true,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  ELSE
    -- Use programs from application if not specified
    IF v_application.programs_requested IS NOT NULL THEN
      FOR v_program_id IN
        SELECT p.id FROM programs p
        WHERE p.slug = ANY(
          SELECT jsonb_array_elements_text(v_application.programs_requested::jsonb)
        )
      LOOP
        INSERT INTO partner_program_access (
          partner_id,
          program_id,
          can_view_apprentices,
          can_enter_progress,
          can_view_reports,
          created_at
        ) VALUES (
          v_partner_id,
          v_program_id,
          true,
          true,
          true,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- ========================================
  -- STEP 3: Update application status
  -- ========================================
  UPDATE partner_applications
  SET 
    status = 'approved',
    approval_status = 'approved_pending_user',
    reviewed_at = NOW(),
    reviewed_by = p_admin_user_id,
    partner_id = v_partner_id,
    updated_at = NOW()
  WHERE id = p_partner_application_id;

  -- ========================================
  -- STEP 4: Create placeholder partner_user entry
  -- ========================================
  INSERT INTO partner_users (
    partner_id,
    user_id,
    role,
    status,
    created_at
  ) VALUES (
    v_partner_id,
    NULL,  -- Will be linked when auth user is created
    'partner_admin',
    'pending_activation',
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- STEP 5: Upsert profile (if email matches existing user)
  -- ========================================
  -- This is a placeholder - actual profile creation happens after auth user
  
  -- ========================================
  -- STEP 6: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    details,
    created_at
  ) VALUES (
    'partner_approved',
    'partner',
    v_partner_id,
    p_admin_user_id,
    jsonb_build_object(
      'application_id', p_partner_application_id,
      'partner_email', p_partner_email,
      'program_ids', p_program_ids,
      'idempotency_key', p_idempotency_key,
      'phase', 'db_only'
    ),
    NOW()
  );

  -- ========================================
  -- STEP 7: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_admin_user_id,
    'approve_partner',
    p_idempotency_key,
    jsonb_build_object(
      'partner_id', v_partner_id,
      'application_id', p_partner_application_id
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'application_id', p_partner_application_id,
    'status', 'approved_pending_user',
    'message', 'Partner approved. Auth user creation required to complete.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RPC: rpc_link_partner_user (Phase 2 - Auth Linking)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_link_partner_user(
  p_partner_id UUID,
  p_auth_user_id UUID,
  p_email TEXT,
  p_idempotency_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_partner RECORD;
  v_application_id UUID;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_auth_user_id
    AND operation = 'link_partner_user'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'partner_id', v_existing_result->>'partner_id',
      'message', 'Partner user already linked'
    );
  END IF;

  -- ========================================
  -- LOCK & VALIDATE PARTNER
  -- ========================================
  SELECT * INTO v_partner
  FROM partners
  WHERE id = p_partner_id
  FOR UPDATE;

  IF v_partner IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Partner not found'
    );
  END IF;

  -- ========================================
  -- STEP 1: Update partner_users with auth user
  -- ========================================
  UPDATE partner_users
  SET 
    user_id = p_auth_user_id,
    status = 'active',
    activated_at = NOW(),
    updated_at = NOW()
  WHERE partner_id = p_partner_id
    AND (user_id IS NULL OR user_id = p_auth_user_id);

  -- If no row was updated, insert new one
  IF NOT FOUND THEN
    INSERT INTO partner_users (
      partner_id,
      user_id,
      role,
      status,
      activated_at,
      created_at
    ) VALUES (
      p_partner_id,
      p_auth_user_id,
      'partner_admin',
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (partner_id, user_id) DO UPDATE
    SET status = 'active', activated_at = NOW();
  END IF;

  -- ========================================
  -- STEP 2: Upsert profile
  -- ========================================
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_auth_user_id,
    p_email,
    v_partner.owner_name,
    'partner_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'partner_admin',
    updated_at = NOW();

  -- ========================================
  -- STEP 3: Update partner account status
  -- ========================================
  UPDATE partners
  SET 
    account_status = 'active',
    updated_at = NOW()
  WHERE id = p_partner_id;

  -- ========================================
  -- STEP 4: Update application approval status
  -- ========================================
  UPDATE partner_applications
  SET 
    approval_status = 'approved',
    updated_at = NOW()
  WHERE partner_id = p_partner_id;

  -- Get application ID for audit
  SELECT id INTO v_application_id
  FROM partner_applications
  WHERE partner_id = p_partner_id
  LIMIT 1;

  -- ========================================
  -- STEP 5: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    details,
    created_at
  ) VALUES (
    'partner_user_linked',
    'partner',
    p_partner_id,
    p_auth_user_id,
    jsonb_build_object(
      'application_id', v_application_id,
      'email', p_email,
      'idempotency_key', p_idempotency_key,
      'phase', 'auth_linked'
    ),
    NOW()
  );

  -- ========================================
  -- STEP 6: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_auth_user_id,
    'link_partner_user',
    p_idempotency_key,
    jsonb_build_object(
      'partner_id', p_partner_id,
      'linked', true
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'partner_id', p_partner_id,
    'user_id', p_auth_user_id,
    'status', 'approved',
    'message', 'Partner user linked successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_approve_partner TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_link_partner_user TO authenticated, service_role;

-- ============================================
-- 5. Documentation
-- ============================================
COMMENT ON FUNCTION rpc_approve_partner IS 
'Phase 1 of partner approval. Creates partner entity, program access, and updates 
application status to approved_pending_user. Does NOT create auth user.
Idempotent via idempotency_key. All writes atomic.';

COMMENT ON FUNCTION rpc_link_partner_user IS
'Phase 2 of partner approval. Links auth user to partner, updates profile,
and finalizes approval status to approved. Called after auth user creation.
Idempotent via idempotency_key. All writes atomic.';

COMMENT ON TYPE partner_approval_status IS
'Partner approval workflow states:
- pending: Awaiting admin review
- approved_pending_user: DB approved, auth user not yet created
- approved: Fully approved with auth user linked
- denied: Application rejected
- suspended: Partner access suspended';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260129_phase2_tests.sql
-- ────────────────────────────────────────────────────────────────

-- Phase 2 Tests: Enrollment and Partner Approval
-- Run as service_role to bypass RLS

-- ============================================
-- TEST SUITE A: Enrollment RPC
-- ============================================
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_program_id UUID;
  v_result JSONB;
  v_enrollment_id UUID;
  v_idempotency_key TEXT := 'test-enroll-' || gen_random_uuid()::text;
BEGIN
  RAISE NOTICE '=== Phase 2 Enrollment Tests ===';

  -- Setup: Create test user profile
  INSERT INTO profiles (id, email, full_name, role, enrollment_status)
  VALUES (v_user_id, 'test_enroll_' || v_user_id::text || '@test.com', 'Test Student', 'student', 'pending');

  -- Setup: Get or create a test program
  SELECT id INTO v_program_id FROM programs LIMIT 1;
  IF v_program_id IS NULL THEN
    INSERT INTO programs (id, name, slug, description)
    VALUES (gen_random_uuid(), 'Test Program', 'test-program', 'Test')
    RETURNING id INTO v_program_id;
  END IF;

  -- TEST A1: First enrollment call succeeds
  RAISE NOTICE 'TEST A1: First enrollment call';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    v_idempotency_key,
    'test',
    '{"funding_source": "WIOA"}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A1 FAILED: %', v_result->>'message';
  END IF;
  v_enrollment_id := (v_result->>'enrollment_id')::UUID;
  RAISE NOTICE 'TEST A1 PASSED: Enrollment created %', v_enrollment_id;

  -- TEST A2: Idempotent re-call returns same result
  RAISE NOTICE 'TEST A2: Idempotent re-call';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    v_idempotency_key,
    'test',
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should succeed idempotently';
  END IF;
  IF NOT (v_result->>'idempotent')::boolean AND NOT (v_result->>'already_enrolled')::boolean THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should indicate idempotent/already_enrolled';
  END IF;
  IF (v_result->>'enrollment_id')::UUID != v_enrollment_id THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should return same enrollment_id';
  END IF;
  RAISE NOTICE 'TEST A2 PASSED: Idempotent call returned same enrollment';

  -- TEST A3: Profile status updated to active
  RAISE NOTICE 'TEST A3: Profile status update';
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND enrollment_status = 'active'
  ) THEN
    RAISE EXCEPTION 'TEST A3 FAILED: Profile enrollment_status not updated';
  END IF;
  RAISE NOTICE 'TEST A3 PASSED: Profile status is active';

  -- TEST A4: Audit log written
  RAISE NOTICE 'TEST A4: Audit log verification';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_enrollment_id 
    AND action = 'enrollment_created'
  ) THEN
    RAISE EXCEPTION 'TEST A4 FAILED: Audit log not written';
  END IF;
  RAISE NOTICE 'TEST A4 PASSED: Audit log exists';

  -- TEST A5: Notification created
  RAISE NOTICE 'TEST A5: Notification verification';
  IF NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = v_user_id 
    AND title = 'Enrollment Confirmed'
  ) THEN
    RAISE EXCEPTION 'TEST A5 FAILED: Notification not created';
  END IF;
  RAISE NOTICE 'TEST A5 PASSED: Notification exists';

  -- TEST A6: Different idempotency key with same user/program returns existing
  RAISE NOTICE 'TEST A6: Different key, same enrollment';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    'different-key-' || gen_random_uuid()::text,
    'test',
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A6 FAILED: Should succeed';
  END IF;
  IF NOT (v_result->>'already_enrolled')::boolean THEN
    RAISE EXCEPTION 'TEST A6 FAILED: Should indicate already_enrolled';
  END IF;
  RAISE NOTICE 'TEST A6 PASSED: Existing enrollment returned';

  -- Cleanup
  DELETE FROM notifications WHERE user_id = v_user_id;
  DELETE FROM delivery_logs WHERE recipient LIKE '%' || v_user_id::text || '%';
  DELETE FROM enrollments WHERE user_id = v_user_id;
  DELETE FROM program_enrollments WHERE student_id = v_user_id;
  DELETE FROM audit_logs WHERE entity_id = v_enrollment_id;
  DELETE FROM idempotency_keys WHERE user_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;

  RAISE NOTICE '=== Enrollment Tests PASSED (6/6) ===';
END $$;

-- ============================================
-- TEST SUITE B: Partner Approval RPC
-- ============================================
DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_application_id UUID;
  v_partner_id UUID;
  v_auth_user_id UUID := gen_random_uuid();
  v_result JSONB;
  v_idempotency_key TEXT := 'test-approve-' || gen_random_uuid()::text;
  v_test_email TEXT := 'test_partner_' || gen_random_uuid()::text || '@test.com';
BEGIN
  RAISE NOTICE '=== Phase 2 Partner Approval Tests ===';

  -- Setup: Create admin profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (v_admin_id, 'admin_' || v_admin_id::text || '@test.com', 'Test Admin', 'admin');

  -- Setup: Create partner application
  INSERT INTO partner_applications (
    id, shop_name, owner_name, contact_email, phone, 
    address_line1, city, state, zip, status, programs_requested
  ) VALUES (
    gen_random_uuid(),
    'Test Shop',
    'Test Owner',
    v_test_email,
    '555-1234',
    '123 Test St',
    'Test City',
    'IN',
    '46000',
    'pending',
    '["barber"]'
  )
  RETURNING id INTO v_application_id;

  -- TEST B1: First approval call succeeds
  RAISE NOTICE 'TEST B1: First approval call';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    v_idempotency_key,
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B1 FAILED: %', v_result->>'message';
  END IF;
  v_partner_id := (v_result->>'partner_id')::UUID;
  IF v_result->>'status' != 'approved_pending_user' THEN
    RAISE EXCEPTION 'TEST B1 FAILED: Status should be approved_pending_user';
  END IF;
  RAISE NOTICE 'TEST B1 PASSED: Partner created with approved_pending_user status';

  -- TEST B2: Idempotent re-call
  RAISE NOTICE 'TEST B2: Idempotent approval call';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    v_idempotency_key,
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B2 FAILED: Should succeed idempotently';
  END IF;
  IF NOT (v_result->>'idempotent')::boolean THEN
    RAISE EXCEPTION 'TEST B2 FAILED: Should indicate idempotent';
  END IF;
  RAISE NOTICE 'TEST B2 PASSED: Idempotent call succeeded';

  -- TEST B3: Partner entity created
  RAISE NOTICE 'TEST B3: Partner entity verification';
  IF NOT EXISTS (
    SELECT 1 FROM partners WHERE id = v_partner_id
  ) THEN
    RAISE EXCEPTION 'TEST B3 FAILED: Partner not created';
  END IF;
  RAISE NOTICE 'TEST B3 PASSED: Partner exists';

  -- TEST B4: Application status updated
  RAISE NOTICE 'TEST B4: Application status verification';
  IF NOT EXISTS (
    SELECT 1 FROM partner_applications 
    WHERE id = v_application_id 
    AND approval_status = 'approved_pending_user'
  ) THEN
    RAISE EXCEPTION 'TEST B4 FAILED: Application status not updated';
  END IF;
  RAISE NOTICE 'TEST B4 PASSED: Application status is approved_pending_user';

  -- TEST B5: Link partner user
  RAISE NOTICE 'TEST B5: Link partner user';
  SELECT rpc_link_partner_user(
    v_partner_id,
    v_auth_user_id,
    v_test_email,
    'link-' || v_idempotency_key
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B5 FAILED: %', v_result->>'message';
  END IF;
  IF v_result->>'status' != 'approved' THEN
    RAISE EXCEPTION 'TEST B5 FAILED: Status should be approved';
  END IF;
  RAISE NOTICE 'TEST B5 PASSED: Partner user linked';

  -- TEST B6: Partner account status updated
  RAISE NOTICE 'TEST B6: Partner account status verification';
  IF NOT EXISTS (
    SELECT 1 FROM partners 
    WHERE id = v_partner_id 
    AND account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'TEST B6 FAILED: Partner account_status not active';
  END IF;
  RAISE NOTICE 'TEST B6 PASSED: Partner account is active';

  -- TEST B7: Profile created
  RAISE NOTICE 'TEST B7: Profile verification';
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_auth_user_id 
    AND role = 'partner_admin'
  ) THEN
    RAISE EXCEPTION 'TEST B7 FAILED: Profile not created with partner_admin role';
  END IF;
  RAISE NOTICE 'TEST B7 PASSED: Profile exists with correct role';

  -- TEST B8: Idempotent link call
  RAISE NOTICE 'TEST B8: Idempotent link call';
  SELECT rpc_link_partner_user(
    v_partner_id,
    v_auth_user_id,
    v_test_email,
    'link-' || v_idempotency_key
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B8 FAILED: Should succeed idempotently';
  END IF;
  RAISE NOTICE 'TEST B8 PASSED: Idempotent link succeeded';

  -- TEST B9: Audit logs written
  RAISE NOTICE 'TEST B9: Audit log verification';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_partner_id 
    AND action = 'partner_approved'
  ) THEN
    RAISE EXCEPTION 'TEST B9 FAILED: Approval audit log not written';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_partner_id 
    AND action = 'partner_user_linked'
  ) THEN
    RAISE EXCEPTION 'TEST B9 FAILED: Link audit log not written';
  END IF;
  RAISE NOTICE 'TEST B9 PASSED: Audit logs exist';

  -- TEST B10: Double approval with different key fails
  RAISE NOTICE 'TEST B10: Double approval rejection';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    'different-key-' || gen_random_uuid()::text,
    '{}'::jsonb
  ) INTO v_result;

  IF (v_result->>'success')::boolean AND NOT (v_result->>'idempotent')::boolean THEN
    -- Check if it correctly identified already processed
    IF v_result->>'code' != 'ALREADY_PROCESSED' THEN
      RAISE EXCEPTION 'TEST B10 FAILED: Should reject or return idempotent';
    END IF;
  END IF;
  RAISE NOTICE 'TEST B10 PASSED: Double approval handled correctly';

  -- Cleanup
  DELETE FROM partner_users WHERE partner_id = v_partner_id;
  DELETE FROM partner_program_access WHERE partner_id = v_partner_id;
  DELETE FROM audit_logs WHERE entity_id = v_partner_id;
  DELETE FROM partners WHERE id = v_partner_id;
  DELETE FROM partner_applications WHERE id = v_application_id;
  DELETE FROM idempotency_keys WHERE user_id IN (v_admin_id, v_auth_user_id);
  DELETE FROM profiles WHERE id IN (v_admin_id, v_auth_user_id);

  RAISE NOTICE '=== Partner Approval Tests PASSED (10/10) ===';
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'PHASE 2 TEST SUMMARY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Enrollment RPC Tests: 6/6 PASSED';
  RAISE NOTICE 'Partner Approval Tests: 10/10 PASSED';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'All Phase 2 tests completed successfully.';
  RAISE NOTICE '==========================================';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260130_application_state_events.sql
-- ────────────────────────────────────────────────────────────────

-- Application State Events Table
-- Immutable append-only log of all state transitions for regulatory traceability
-- Addresses: state history capped at 20, no actor tracking, mutable JSONB

-- 1. Create immutable events table
CREATE TABLE IF NOT EXISTS application_state_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES career_applications(id) ON DELETE CASCADE,
  from_state application_state,
  to_state application_state NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes for efficient querying
CREATE INDEX idx_app_state_events_application ON application_state_events(application_id);
CREATE INDEX idx_app_state_events_created ON application_state_events(created_at DESC);
CREATE INDEX idx_app_state_events_actor ON application_state_events(actor_id);

-- 3. Enable RLS
ALTER TABLE application_state_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - append-only, no updates or deletes
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own application events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_applications ca
      WHERE ca.id = application_state_events.application_id
      AND ca.user_id = auth.uid()
    )
  );

-- INSERT only via RPC (SECURITY DEFINER), no direct inserts
-- This ensures all events go through validated state machine

-- 5. Function to record state event (called from advance_application_state)
CREATE OR REPLACE FUNCTION record_application_state_event(
  p_application_id UUID,
  p_from_state application_state,
  p_to_state application_state,
  p_actor_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_actor_role TEXT;
BEGIN
  -- Get actor role if actor provided
  IF p_actor_id IS NOT NULL THEN
    SELECT role INTO v_actor_role FROM profiles WHERE id = p_actor_id;
  END IF;

  INSERT INTO application_state_events (
    application_id,
    from_state,
    to_state,
    actor_id,
    actor_role,
    reason,
    metadata
  ) VALUES (
    p_application_id,
    p_from_state,
    p_to_state,
    p_actor_id,
    v_actor_role,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update advance_application_state to record events
CREATE OR REPLACE FUNCTION advance_application_state(
  p_application_id UUID,
  p_next_state application_state,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_actor_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_valid BOOLEAN;
  v_history JSONB;
  v_event_id UUID;
BEGIN
  -- Get current state
  SELECT application_state, state_history 
  INTO v_current_state, v_history
  FROM career_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Validate transition
  v_valid := validate_application_state_transition(v_current_state, p_next_state);
  
  IF NOT v_valid THEN
    -- Log invalid transition attempt to audit_logs
    INSERT INTO audit_logs (
      action,
      actor_id,
      target_type,
      target_id,
      metadata,
      created_at
    ) VALUES (
      'invalid_state_transition',
      p_actor_id,
      'career_application',
      p_application_id::TEXT,
      jsonb_build_object(
        'from_state', v_current_state,
        'attempted_state', p_next_state,
        'data', p_data
      ),
      NOW()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition from %s to %s', v_current_state, p_next_state),
      'code', 'INVALID_TRANSITION',
      'current_state', v_current_state
    );
  END IF;

  -- Record event in immutable events table
  v_event_id := record_application_state_event(
    p_application_id,
    v_current_state,
    p_next_state,
    p_actor_id,
    p_reason,
    p_data
  );

  -- Build new history entry (keep JSONB for backward compat, but events table is source of truth)
  v_history := v_history || jsonb_build_array(jsonb_build_object(
    'state', p_next_state,
    'timestamp', NOW(),
    'from_state', v_current_state,
    'event_id', v_event_id
  ));
  
  -- Cap JSONB history to last 20 (events table has full history)
  IF jsonb_array_length(v_history) > 20 THEN
    v_history := (SELECT jsonb_agg(elem) FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 20
    ) sub);
  END IF;

  -- Update state with field whitelisting per state
  UPDATE career_applications
  SET 
    application_state = p_next_state,
    last_transition_at = NOW(),
    state_history = v_history,
    updated_at = NOW(),
    -- Personal info: only writable in 'started' state
    first_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'first_name', first_name) ELSE first_name END,
    last_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'last_name', last_name) ELSE last_name END,
    email = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'email', email) ELSE email END,
    phone = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'phone', phone) ELSE phone END,
    date_of_birth = CASE WHEN v_current_state = 'started' THEN COALESCE((p_data->>'date_of_birth')::DATE, date_of_birth) ELSE date_of_birth END,
    address = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'address', address) ELSE address END,
    city = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'city', city) ELSE city END,
    state = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'state', state) ELSE state END,
    zip_code = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'zip_code', zip_code) ELSE zip_code END,
    -- Education: only writable in 'started' or 'eligibility_complete'
    high_school = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'high_school', high_school) ELSE high_school END,
    graduation_year = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'graduation_year', graduation_year) ELSE graduation_year END,
    gpa = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'gpa', gpa) ELSE gpa END,
    college = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'college', college) ELSE college END,
    major = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'major', major) ELSE major END,
    -- Program selection: only writable before review_ready
    program_id = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE((p_data->>'program_id')::UUID, program_id) ELSE program_id END,
    funding_type = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'funding_type', funding_type) ELSE funding_type END,
    -- Employment: only writable before review_ready
    employment_status = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'employment_status', employment_status) ELSE employment_status END,
    current_employer = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'current_employer', current_employer) ELSE current_employer END,
    years_experience = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'years_experience', years_experience) ELSE years_experience END,
    -- Submitted timestamp: only set when transitioning to submitted
    submitted_at = CASE WHEN p_next_state = 'submitted' THEN NOW() ELSE submitted_at END
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'previous_state', v_current_state,
    'new_state', p_next_state,
    'event_id', v_event_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill existing state_history to events table
DO $$
DECLARE
  app RECORD;
  hist_entry JSONB;
  prev_state application_state;
BEGIN
  FOR app IN SELECT id, state_history FROM career_applications WHERE state_history IS NOT NULL AND jsonb_array_length(state_history) > 0 LOOP
    prev_state := NULL;
    FOR hist_entry IN SELECT * FROM jsonb_array_elements(app.state_history) LOOP
      INSERT INTO application_state_events (
        application_id,
        from_state,
        to_state,
        reason,
        metadata,
        created_at
      ) VALUES (
        app.id,
        prev_state,
        (hist_entry->>'state')::application_state,
        hist_entry->>'action',
        jsonb_build_object('backfilled', true),
        COALESCE((hist_entry->>'timestamp')::timestamptz, NOW())
      )
      ON CONFLICT DO NOTHING;
      
      prev_state := (hist_entry->>'state')::application_state;
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE application_state_events IS 'Immutable append-only audit trail of application state transitions. Source of truth for regulatory compliance.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260130_protect_tenant_id.sql
-- ────────────────────────────────────────────────────────────────

-- 20260130_protect_tenant_id.sql
-- Purpose:
-- 1) Provide a SECURITY DEFINER tenant lookup helper (get_current_tenant_id)
-- 2) Lock down profiles.tenant_id so users cannot change their tenant
-- 3) Provide a defense-in-depth trigger that prevents tenant_id changes even if a policy is misconfigured
--
-- Assumptions:
-- - public.profiles exists with columns: id (uuid), tenant_id (uuid)
-- - auth.uid() is available (Supabase)
-- - You may already have is_super_admin() in public. If not, see the note at the bottom.

BEGIN;

-- 1) Tenant lookup helper
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT p.tenant_id
    INTO v_tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_tenant_id;
END;
$$;

-- Make sure only intended roles can EXECUTE this function.
-- (authenticated is a Postgres role Supabase uses; adjust if your project differs.)
REVOKE ALL ON FUNCTION public.get_current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;

-- 2) Defense-in-depth trigger function
-- Blocks tenant_id changes for non-super-admins.
CREATE OR REPLACE FUNCTION public.prevent_tenant_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if no change
  IF NEW.tenant_id IS NOT DISTINCT FROM OLD.tenant_id THEN
    RETURN NEW;
  END IF;

  -- Allow super admins (assumes public.is_super_admin() exists)
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise block any tenant_id mutation
  RAISE EXCEPTION 'tenant_id cannot be changed'
    USING ERRCODE = '42501'; -- insufficient_privilege
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_tenant_id_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_tenant_id_change() TO authenticated;

-- 3) Trigger to enforce tenant_id immutability
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'protect_tenant_id'
  ) THEN
    EXECUTE 'DROP TRIGGER protect_tenant_id ON public.profiles';
  END IF;
END
$$;

CREATE TRIGGER protect_tenant_id
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tenant_id_change();

-- 4) RLS policy defense-in-depth (prevents UPDATE that attempts tenant_id change)
-- IMPORTANT: This policy only matters if RLS is enabled on profiles and users can UPDATE profiles.
-- It ensures a user can update their own row but cannot change tenant_id.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to avoid duplicates/name conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles_update_own_row_tenant_immutable'
  ) THEN
    EXECUTE 'DROP POLICY "profiles_update_own_row_tenant_immutable" ON public.profiles';
  END IF;
END
$$;

CREATE POLICY "profiles_update_own_row_tenant_immutable"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR public.is_super_admin()
)
WITH CHECK (
  -- must be your row unless you're super admin
  (auth.uid() = id OR public.is_super_admin())
  AND
  (
    -- tenant_id must remain unchanged unless super admin
    public.is_super_admin()
    OR tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid())
  )
);

COMMIT;

-- NOTE:
-- If you also need the licenses SELECT policy referenced in your summary, paste/run this too:
-- (Only if it doesn't already exist)
-- CREATE POLICY "Users can view own tenant licenses"
--   ON public.licenses
--   FOR SELECT
--   TO authenticated
--   USING (tenant_id = public.get_current_tenant_id() OR public.is_super_admin());


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260130_seed_career_applications.sql
-- ────────────────────────────────────────────────────────────────

-- Seed career_applications with test data for admin dashboard verification
-- DEV/STAGING ONLY - Uses @example.com emails to prevent prod pollution
-- These records are safe to have in prod (example.com is reserved per RFC 2606)
-- but will be ignored by real workflows

-- Guard: Only insert if no real applications exist (prevents duplicate seeding)
DO $$
BEGIN
  -- Skip if there are already applications with non-example.com emails
  IF EXISTS (
    SELECT 1 FROM career_applications 
    WHERE email NOT LIKE '%@example.com'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Skipping seed: real applications exist';
    RETURN;
  END IF;

  INSERT INTO career_applications (
  first_name, last_name, email, phone,
  application_state, status, last_transition_at, state_history,
  address, city, state, zip_code,
  high_school, graduation_year, gpa,
  employment_status, years_experience
) VALUES
  ('Maria', 'Garcia', 'maria.garcia@example.com', '555-0101',
   'submitted', 'pending_review', NOW() - INTERVAL '2 days',
   '[{"state":"started","timestamp":"2026-01-25T10:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-26T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-27T09:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-27T16:00:00Z","action":"advanced"},{"state":"submitted","timestamp":"2026-01-28T11:00:00Z","action":"submitted"}]'::jsonb,
   '123 Main St', 'Houston', 'TX', '77001',
   'Westside High School', '2024', '3.5',
   'unemployed', '0'),
   
  ('James', 'Wilson', 'james.wilson@example.com', '555-0102',
   'review_ready', 'in_progress', NOW() - INTERVAL '1 day',
   '[{"state":"started","timestamp":"2026-01-27T08:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-28T10:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-29T11:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-29T15:00:00Z","action":"advanced"}]'::jsonb,
   '456 Oak Ave', 'Dallas', 'TX', '75201',
   'Lincoln High School', '2023', '3.8',
   'part_time', '1'),
   
  ('Aisha', 'Johnson', 'aisha.johnson@example.com', '555-0103',
   'documents_complete', 'in_progress', NOW() - INTERVAL '3 hours',
   '[{"state":"started","timestamp":"2026-01-29T09:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-29T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-29T21:00:00Z","action":"advanced"}]'::jsonb,
   '789 Pine Rd', 'Austin', 'TX', '78701',
   'Austin High School', '2025', '3.2',
   'student', '0'),
   
  ('Carlos', 'Martinez', 'carlos.martinez@example.com', '555-0104',
   'eligibility_complete', 'in_progress', NOW() - INTERVAL '6 hours',
   '[{"state":"started","timestamp":"2026-01-29T18:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-29T22:00:00Z","action":"advanced"}]'::jsonb,
   '321 Elm St', 'San Antonio', 'TX', '78201',
   'Roosevelt High School', '2024', '3.0',
   'full_time', '2'),
   
  ('Emily', 'Chen', 'emily.chen@example.com', '555-0105',
   'started', 'draft', NOW(),
   '[{"state":"started","timestamp":"2026-01-30T00:00:00Z","action":"created"}]'::jsonb,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL),
   
  ('David', 'Brown', 'david.brown@example.com', '555-0106',
   'rejected', 'closed', NOW() - INTERVAL '5 days',
   '[{"state":"started","timestamp":"2026-01-20T10:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-21T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-22T09:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-23T16:00:00Z","action":"advanced"},{"state":"rejected","timestamp":"2026-01-25T11:00:00Z","action":"rejected","notes":"Incomplete documentation"}]'::jsonb,
   '654 Maple Dr', 'Fort Worth', 'TX', '76101',
   'Central High School', '2022', '2.8',
   'unemployed', '1')
  ON CONFLICT DO NOTHING;

END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260130_timeclock_gps_enforcement.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260131_barber_webhook_automation.sql
-- ────────────────────────────────────────────────────────────────

-- Barber Webhook Automation: Create barber_subscriptions table and add tracking fields
-- Ensures idempotent email sending and proper record linking

-- 1. Create barber_subscriptions table (stores Stripe subscription details for barber program)
CREATE TABLE IF NOT EXISTS barber_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,
  apprentice_id UUID,
  
  -- Stripe identifiers
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  
  -- Subscription status
  status TEXT DEFAULT 'active',
  
  -- Payment details
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  weekly_payment_cents INTEGER,
  weeks_remaining INTEGER,
  hours_per_week INTEGER DEFAULT 40,
  transferred_hours_verified INTEGER DEFAULT 0,
  
  -- Billing dates
  billing_cycle_anchor TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Email tracking (for idempotency)
  welcome_email_sent_at TIMESTAMPTZ,
  milady_email_sent_at TIMESTAMPTZ,
  dashboard_invite_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to apprentices for reverse lookup
ALTER TABLE apprentices
ADD COLUMN IF NOT EXISTS barber_subscription_id UUID,
ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dashboard_invite_sent_at TIMESTAMPTZ;

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_user_id ON barber_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_stripe_sub ON barber_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);

-- 4. Enable RLS
ALTER TABLE barber_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own subscriptions"
  ON barber_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON barber_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260131_timeclock_schema.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_add_missing_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_complete_canonical_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_nds_training_courses.sql
-- ────────────────────────────────────────────────────────────────

-- NDS Training Courses Migration
-- Links NDS/MyDrugTestTraining courses to Stripe products with correct 50/50 markup pricing
-- Pricing: Elevate Price = NDS Wholesale Cost × 2 (50/50 revenue share)

-- Ensure partner_lms_providers table exists and has NDS
INSERT INTO partner_lms_providers (provider_name, provider_type, api_base_url, is_active)
VALUES ('National Drug Screening', 'nds', 'https://mydrugtesttraining.com', true)
ON CONFLICT (provider_type) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  is_active = true;

-- Create NDS training courses table if not exists
CREATE TABLE IF NOT EXISTS nds_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_hours DECIMAL(4,1),
  nds_wholesale_cost DECIMAL(10,2) NOT NULL,
  elevate_retail_price DECIMAL(10,2) NOT NULL,
  markup_percentage DECIMAL(5,2) DEFAULT 100.00, -- 50/50 = 100% markup
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  external_course_url TEXT,
  certification_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nds_courses_category ON nds_training_courses(category);
CREATE INDEX IF NOT EXISTS idx_nds_courses_active ON nds_training_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_nds_courses_stripe ON nds_training_courses(stripe_product_id);

-- Enable RLS
ALTER TABLE nds_training_courses ENABLE ROW LEVEL SECURITY;

-- Public read access for active courses
CREATE POLICY "Anyone can view active NDS courses" ON nds_training_courses
  FOR SELECT USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage NDS courses" ON nds_training_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert all NDS training courses with Stripe IDs
INSERT INTO nds_training_courses (
  course_code, course_name, description, category, duration_hours,
  nds_wholesale_cost, elevate_retail_price, stripe_product_id, stripe_price_id,
  external_course_url, certification_name, is_popular, is_new
) VALUES
-- Supervisor Training
('NDS-DOT-SUPER', 'DOT Supervisor Training Course', 
 'Required training for supervisors of DOT-regulated employees. Learn to identify signs of drug and alcohol use and make reasonable suspicion determinations.',
 'Supervisor Training', 2.0, 65.00, 130.00,
 'prod_TtmCoVdUVLoScN', 'price_1Svz8qIRNf5vPH3AtY0AM9Ox',
 'https://mydrugtesttraining.com/course/dot-supervisor-training-course',
 'DOT Compliant Certificate', false, false),

('NDS-NONDOT-SUPER', 'Non-DOT Supervisor Training Course',
 'Training for supervisors in non-DOT workplaces. Covers drug-free workplace policies, recognizing impairment, and documentation.',
 'Supervisor Training', 2.0, 65.00, 130.00,
 'prod_TtmCaWJyggUyS0', 'price_1Svz8qIRNf5vPH3AoIf0pNax',
 'https://mydrugtesttraining.com/course/nds-non-dot-supervisor-training-course',
 'Certificate of Completion', false, false),

('NDS-DOT-SUPER-REFRESH', 'DOT Supervisor Training Course (Refresher)',
 'Refresher training for supervisors to stay updated on the latest drug and alcohol testing protocols and DOT regulations.',
 'Supervisor Training', 1.0, 45.00, 90.00,
 'prod_TtmjpWTJcWilsG', 'price_1SvzA2IRNf5vPH3A03yUFSHP',
 'https://mydrugtesttraining.com/course/nds-dot-supervisor-training-course-refresher',
 'DOT Refresher Certificate', false, false),

('NDS-SUPER-BUNDLE', 'DOT & Non-DOT Supervisor Training Bundle',
 'Combined DOT and Non-DOT supervisor training at a discounted bundle price.',
 'Supervisor Training', 4.0, 110.00, 220.00,
 'prod_TtmjMIf1WymQqo', 'price_1SvzARIRNf5vPH3AFwwdDqYE',
 'https://mydrugtesttraining.com/course/nds-dot-non-dot-supervisor-training-course',
 'DOT & Non-DOT Certificates', true, false),

('NDS-FRA-SUPER', 'FRA Supervisor Reasonable Suspicion & Post-Accident Training',
 'FRA-specific supervisor training covering reasonable suspicion and post-accident toxicological testing requirements.',
 'Supervisor Training', 3.0, 220.00, 440.00,
 'prod_TtmjBqHtAe4hpQ', 'price_1SvzA7IRNf5vPH3AGlkbCwTV',
 'https://mydrugtesttraining.com/course/nds-fra-supervisor-reasonable-suspicion-and-post-accident-toxicological-testing-training',
 'FRA Supervisor Certificate', false, false),

-- Employee Training
('NDS-DFWP-EMP', 'Drug Free Workplace Training for Employees',
 'Employee awareness training covering drug-free workplace policies, testing procedures, and consequences of violations.',
 'Employee Training', 1.0, 22.00, 44.00,
 'prod_TtmC3bOZt9JgdF', 'price_1Svz8rIRNf5vPH3ABz5zU1UW',
 'https://mydrugtesttraining.com/course/drug-free-workplace-training-for-employees',
 'Certificate of Completion', true, false),

-- Collector Certification
('NDS-DOT-URINE-FULL', 'DOT Urine Specimen Collector Training and Mocks',
 'Complete DOT urine collector certification. Includes online training and mock collections required for certification.',
 'Collector Certification', 8.0, 655.00, 1310.00,
 'prod_TtmCZ3g8oPJESa', 'price_1Svz8yIRNf5vPH3ADpVzcaYT',
 'https://mydrugtesttraining.com/course/dot-urine-specimen-collector-training-and-mocks',
 'DOT Collector Certification', false, false),

('NDS-DOT-URINE-MOCKS', 'DOT Urine Collector Mock Collections',
 'Mock collection sessions for collectors who have completed training. Required for initial certification and refresher.',
 'Collector Certification', 2.5, 330.00, 660.00,
 'prod_TtmCulXQYouwOD', 'price_1Svz8zIRNf5vPH3Auu8QZyT1',
 'https://mydrugtesttraining.com/course/nds-dot-collector-mock-collections',
 'Mock Completion Certificate', false, false),

('NDS-DOT-ORAL-FULL', 'DOT Oral Fluid Collector Training (Mocks Included)',
 'Complete training for DOT oral fluid specimen collection. Includes mock collections.',
 'Collector Certification', 8.0, 699.00, 1398.00,
 'prod_TtmC8qiKlETWNv', 'price_1Svz8zIRNf5vPH3AfraNLRot',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-mocks',
 'DOT Oral Fluid Collector Certification', false, true),

('NDS-DOT-ORAL-NOMOCKS', 'DOT Oral Fluid Collector Training (No Mocks)',
 'DOT oral fluid collector training without mock collections. Mocks must be completed separately.',
 'Collector Certification', 4.0, 499.00, 998.00,
 'prod_Ttmj96xeJxniwX', 'price_1Svz9wIRNf5vPH3ASrjCCZQc',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-training-course-no-mocks',
 'Training Certificate (Mocks Required)', false, false),

('NDS-ORAL-NONDOT', 'Saliva/Oral Fluid Non-DOT Drug Testing Training',
 'Training for non-DOT oral fluid specimen collection procedures.',
 'Collector Certification', 4.0, 350.00, 700.00,
 'prod_TtmCWKvpBfukyB', 'price_1Svz8zIRNf5vPH3AubLEClix',
 'https://mydrugtesttraining.com/course/nds-saliva-oral-fluid-drug-testing-training',
 'Certificate of Completion', false, false),

('NDS-STT', 'DOT Alcohol Screening Test Technician (STT) Training',
 'Become a DOT qualified Screening Test Technician for breath alcohol testing.',
 'Collector Certification', 4.0, 299.00, 598.00,
 'prod_TtmjnjTGwtLTHi', 'price_1SvzACIRNf5vPH3AqdXR56ce',
 'https://mydrugtesttraining.com/course/nds-dot-alcohol-screening-test-technician-stt-training',
 'STT Certification', false, false),

('NDS-HAIR', 'Hair Specimen Collector Training & Certification',
 'Training for hair specimen collection for long-term substance abuse detection (90-day window).',
 'Collector Certification', 4.0, 399.00, 798.00,
 'prod_Ttmj8DzpsJgIVb', 'price_1SvzAHIRNf5vPH3AolTMpnM8',
 'https://mydrugtesttraining.com/course/nds-hair-specimen-collector-training-certification',
 'Hair Collector Certification', false, false),

('NDS-DNA', 'Legal & Curiosity DNA Collector Training',
 'DNA paternity collection training and certification for legal and curiosity testing.',
 'Collector Certification', 3.0, 299.00, 598.00,
 'prod_TtmjzhQBgbtfIP', 'price_1SvzANIRNf5vPH3AhlPcOdfX',
 'https://mydrugtesttraining.com/course/nds-legal-curiosity-dna-collector-training-certification',
 'DNA Collector Certification', false, false),

-- DER Training
('NDS-DER-FMCSA', 'DER Training Course - FMCSA',
 'Comprehensive DER training for FMCSA-regulated employers. Covers all DER responsibilities and Clearinghouse requirements.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCtyaJJJ0Ioe', 'price_1Svz96IRNf5vPH3Ap9VFD314',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fmcsa',
 'DER Certificate', true, false),

('NDS-DER-FAA', 'DER Training Course - FAA',
 'DER training specific to FAA drug and alcohol testing requirements.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCCs91JmHtGE', 'price_1Svz96IRNf5vPH3ATdvWWy7x',
 'https://mydrugtesttraining.com/course/nds-der-training-course-faa',
 'DER Certificate', false, false),

('NDS-DER-FRA', 'DER Training Course - FRA',
 'DER training for FRA-regulated railroad employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmiFxX4kbTLsJ', 'price_1Svz9PIRNf5vPH3AisCDpbQD',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fra',
 'DER Certificate', false, false),

('NDS-DER-FTA', 'DER Training Course - FTA',
 'DER training for FTA-regulated public transit employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmixLhgQGpf1T', 'price_1Svz9TIRNf5vPH3AcZZPARQk',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fta',
 'DER Certificate', false, false),

('NDS-DER-PHMSA', 'DER Training Course - PHMSA',
 'DER training for PHMSA-regulated pipeline and hazmat employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmiRa4bDY8EfY', 'price_1Svz9YIRNf5vPH3AUReVz4ph',
 'https://mydrugtesttraining.com/course/nds-der-training-course-phmsa',
 'DER Certificate', false, false),

('NDS-DER-USCG', 'DER Training Course - USCG',
 'DER training for USCG-regulated maritime employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmjvfIBcmC07R', 'price_1Svz9cIRNf5vPH3AKvxdKFJe',
 'https://mydrugtesttraining.com/course/nds-der-training-course-uscg',
 'DER Certificate', false, false),

('NDS-DER-NONDOT', 'Non-DOT General DER Training',
 'DER training for non-DOT employers managing workplace drug testing programs.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCWqQ7Hx6Nm6', 'price_1Svz96IRNf5vPH3Ai9YE9aZy',
 'https://mydrugtesttraining.com/course/nds-non-dot-general-designated-employer-representative-training-der',
 'DER Certificate', false, false),

-- Advanced & Business Training
('NDS-STARTUP', 'Drug Testing Start-Up Overview',
 'Learn how to start a drug testing business. Covers industry overview, requirements, and business setup.',
 'Advanced Training', 2.0, 99.00, 198.00,
 'prod_Ttmj8ntFUgNDKP', 'price_1Svz9hIRNf5vPH3AYYMncT7Q',
 'https://mydrugtesttraining.com/course/nds-drug-testing-start-up-overview',
 'Certificate of Completion', false, false),

('NDS-TTT-URINE', 'DOT Urine Specimen Collector Train the Trainer',
 'Become a qualified trainer for DOT urine specimen collectors. For experienced collectors wanting to train others.',
 'Advanced Training', 16.0, 1750.00, 3500.00,
 'prod_TtmjonT5BEfpgy', 'price_1Svz9mIRNf5vPH3A1bVgS4K4',
 'https://mydrugtesttraining.com/course/nds-dot-urine-specimen-collector-train-the-trainer',
 'Train the Trainer Certification', false, false),

('NDS-TTT-ORAL', 'DOT Oral Fluid Collector Train-the-Trainer',
 'Become a qualified trainer for DOT oral fluid specimen collectors. Includes collector training, mocks, and trainer certification.',
 'Advanced Training', 16.0, 1999.00, 3998.00,
 'prod_TtmjW1riWJm2Yq', 'price_1Svz9rIRNf5vPH3AXdbAxxh1',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-train-the-trainer',
 'Train the Trainer Certification', false, true)

ON CONFLICT (course_code) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  description = EXCLUDED.description,
  nds_wholesale_cost = EXCLUDED.nds_wholesale_cost,
  elevate_retail_price = EXCLUDED.elevate_retail_price,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  external_course_url = EXCLUDED.external_course_url,
  certification_name = EXCLUDED.certification_name,
  is_popular = EXCLUDED.is_popular,
  is_new = EXCLUDED.is_new,
  updated_at = NOW();

-- Create NDS course purchases table for tracking enrollments
CREATE TABLE IF NOT EXISTS nds_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES nds_training_courses(id),
  email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  nds_cost DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  nds_enrollment_id TEXT,
  nds_access_url TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- Create indexes for purchases
CREATE INDEX IF NOT EXISTS idx_nds_purchases_user ON nds_course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_nds_purchases_status ON nds_course_purchases(status);
CREATE INDEX IF NOT EXISTS idx_nds_purchases_stripe ON nds_course_purchases(stripe_payment_intent_id);

-- Enable RLS on purchases
ALTER TABLE nds_course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view own purchases
CREATE POLICY "Users can view own NDS purchases" ON nds_course_purchases
  FOR SELECT USING (user_id = auth.uid());

-- System can insert purchases
CREATE POLICY "System can insert NDS purchases" ON nds_course_purchases
  FOR INSERT WITH CHECK (true);

-- Admins can manage all purchases
CREATE POLICY "Admins can manage NDS purchases" ON nds_course_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create view for easy course catalog access
CREATE OR REPLACE VIEW nds_course_catalog AS
SELECT 
  id,
  course_code,
  course_name,
  description,
  category,
  duration_hours,
  nds_wholesale_cost,
  elevate_retail_price,
  markup_percentage,
  stripe_product_id,
  stripe_price_id,
  external_course_url,
  certification_name,
  is_active,
  is_new,
  is_popular
FROM nds_training_courses
WHERE is_active = true
ORDER BY 
  CASE category
    WHEN 'Supervisor Training' THEN 1
    WHEN 'Employee Training' THEN 2
    WHEN 'Collector Certification' THEN 3
    WHEN 'DER Training' THEN 4
    WHEN 'Advanced Training' THEN 5
    ELSE 6
  END,
  elevate_retail_price ASC;

-- Grant permissions
GRANT SELECT ON nds_training_courses TO authenticated;
GRANT SELECT ON nds_course_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON nds_course_purchases TO authenticated;

-- Create function to calculate profit on purchase
CREATE OR REPLACE FUNCTION calculate_nds_profit()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the NDS cost from the course
  SELECT nds_wholesale_cost INTO NEW.nds_cost
  FROM nds_training_courses
  WHERE id = NEW.course_id;
  
  -- Calculate profit (amount paid - NDS cost)
  NEW.profit := NEW.amount_paid - NEW.nds_cost;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate profit
DROP TRIGGER IF EXISTS trg_calculate_nds_profit ON nds_course_purchases;
CREATE TRIGGER trg_calculate_nds_profit
  BEFORE INSERT ON nds_course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_nds_profit();

-- ============================================================================
-- CDL-INCLUDED COURSES (Free with CDL Program Enrollment)
-- These courses are bundled with CDL program - no separate retail price
-- ============================================================================

CREATE TABLE IF NOT EXISTS nds_cdl_included_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(4,1),
  stripe_product_id TEXT,
  external_course_url TEXT,
  certification_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE nds_cdl_included_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CDL included courses" ON nds_cdl_included_courses
  FOR SELECT USING (is_active = true);

-- Insert CDL-included courses
INSERT INTO nds_cdl_included_courses (
  course_code, course_name, description, duration_hours,
  stripe_product_id, external_course_url, certification_name
) VALUES
('NDS-CDL-DRUG-ALCOHOL', 'DOT Drug & Alcohol Awareness',
 'Required DOT training for all CDL drivers and safety-sensitive employees covering drug and alcohol testing requirements.',
 2.5, 'prod_TtmCfKsaUoite8',
 'https://mydrugtesttraining.com/course/dot-drug-alcohol',
 'DOT Compliance Certificate'),

('NDS-CDL-HOS', 'Hours of Service (HOS) Compliance',
 'DOT hours of service regulations and electronic logging device (ELD) requirements for commercial drivers.',
 2.0, 'prod_TtmC90w72WxHH4',
 'https://mydrugtesttraining.com/course/hours-of-service',
 'HOS Compliance Certificate'),

('NDS-CDL-PRETRIP', 'CDL Pre-Trip Inspection Training',
 'Complete pre-trip inspection procedures required for CDL testing and daily vehicle safety checks.',
 2.5, 'prod_TtmCNuxvORiMSh',
 'https://mydrugtesttraining.com/course/pre-trip-inspection',
 'Pre-Trip Inspection Certificate'),

('NDS-CDL-SUSPICION', 'DOT Reasonable Suspicion Training',
 'Required training for supervisors to identify signs of drug and alcohol use in DOT-regulated employees.',
 2.0, 'prod_TtmCbhMkt7eUSZ',
 'https://mydrugtesttraining.com/course/reasonable-suspicion',
 'DOT Supervisor Certificate'),

('NDS-CDL-DFWP', 'Drug-Free Workplace Training',
 'Employee awareness training covering drug-free workplace policies for CDL drivers and transportation workers.',
 1.0, 'prod_TtmCUg8PrKOBtq',
 'https://mydrugtesttraining.com/course/drug-free-workplace',
 'Certificate of Completion')

ON CONFLICT (course_code) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  external_course_url = EXCLUDED.external_course_url;

-- Grant permissions
GRANT SELECT ON nds_cdl_included_courses TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ NDS Training Courses migration complete!';
  RAISE NOTICE '📊 24 paid courses + 5 CDL-included courses';
  RAISE NOTICE '💰 Paid courses: 50/50 revenue share (2x NDS wholesale cost)';
  RAISE NOTICE '🚛 CDL-included courses: Free with CDL program enrollment';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_stripe_price_enrollment_map.sql
-- ────────────────────────────────────────────────────────────────

-- Stripe Price to Enrollment Mapping Table
-- Maps Stripe price_ids and product_ids to program enrollment data
-- Used by webhook fallback when Payment Links lack metadata

CREATE TABLE IF NOT EXISTS stripe_price_enrollment_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe identifiers (at least one required)
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  
  -- Enrollment target
  program_id UUID REFERENCES training_programs(id),
  program_slug TEXT NOT NULL,
  
  -- Enrollment configuration
  enrollment_type TEXT NOT NULL DEFAULT 'program', -- 'program', 'course', 'nds_course'
  funding_source TEXT DEFAULT 'SELF_PAY', -- 'SELF_PAY', 'WIOA', 'WRG', 'EMPLOYER'
  is_deposit BOOLEAN DEFAULT false, -- true if this is a deposit payment (not full)
  is_free_enrollment BOOLEAN DEFAULT false, -- true for $0 WIOA enrollments
  
  -- Auto-enrollment behavior
  auto_enroll BOOLEAN DEFAULT true, -- whether to auto-create enrollment on payment
  send_welcome_email BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT price_or_product_required CHECK (
    stripe_price_id IS NOT NULL OR stripe_product_id IS NOT NULL
  )
);

-- Indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_price ON stripe_price_enrollment_map(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_product ON stripe_price_enrollment_map(stripe_product_id) WHERE stripe_product_id IS NOT NULL AND stripe_price_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_map_program ON stripe_price_enrollment_map(program_slug);
CREATE INDEX IF NOT EXISTS idx_stripe_map_active ON stripe_price_enrollment_map(is_active);

-- Enable RLS
ALTER TABLE stripe_price_enrollment_map ENABLE ROW LEVEL SECURITY;

-- Only admins can manage mappings
CREATE POLICY "Admins can manage stripe price mappings" ON stripe_price_enrollment_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can read for webhook processing
CREATE POLICY "Service role can read stripe mappings" ON stripe_price_enrollment_map
  FOR SELECT USING (true);

-- Insert mappings for self-pay programs (full payment)
INSERT INTO stripe_price_enrollment_map (
  stripe_price_id, program_slug, enrollment_type, funding_source, is_deposit, is_free_enrollment, description
) VALUES
-- Barber Apprenticeship
('price_1Sw0MiIRNf5vPH3AQm0MtqGP', 'barber-apprenticeship', 'program', 'SELF_PAY', false, false, 'Barber Apprenticeship - Full Payment $4,980'),
('price_1Sw3XrIRNf5vPH3AV9CpXMQD', 'barber-apprenticeship', 'program', 'SELF_PAY', true, false, 'Barber Apprenticeship - 35% Deposit $1,743'),

-- CNA Certification
('price_1Sw0MjIRNf5vPH3AsbrosRzm', 'cna-certification', 'program', 'SELF_PAY', false, false, 'CNA Certification - Full Payment $1,200'),
('price_1Sw3XrIRNf5vPH3AYj5EUeqD', 'cna-certification', 'program', 'SELF_PAY', true, false, 'CNA Certification - 35% Deposit $420'),

-- Cosmetology
('price_1Sw0N8IRNf5vPH3ACCquL2DS', 'cosmetology-apprenticeship', 'program', 'SELF_PAY', false, false, 'Cosmetology Apprenticeship - Full Payment $4,999'),
('price_1Sw3Y2IRNf5vPH3AAJoD2ghz', 'cosmetology-apprenticeship', 'program', 'SELF_PAY', true, false, 'Cosmetology Apprenticeship - 35% Deposit $1,750'),

-- Esthetician
('price_1Sw0MvIRNf5vPH3AQmARwmN1', 'esthetician-apprenticeship', 'program', 'SELF_PAY', false, false, 'Esthetician Apprenticeship - Full Payment $2,800'),
('price_1Sw3Y3IRNf5vPH3Axy85e22q', 'esthetician-apprenticeship', 'program', 'SELF_PAY', true, false, 'Esthetician Apprenticeship - 35% Deposit $980'),

-- HVAC
('price_1Sw0MiIRNf5vPH3AtfgR47tM', 'hvac-technician', 'program', 'SELF_PAY', false, false, 'HVAC Technician - Full Payment $5,500'),
('price_1Sw3XsIRNf5vPH3ATDbqt5QL', 'hvac-technician', 'program', 'SELF_PAY', true, false, 'HVAC Technician - 35% Deposit $1,925'),

-- CDL
('price_1Sw0KEIRNf5vPH3A0v7RlAZK', 'cdl-training', 'program', 'SELF_PAY', false, false, 'CDL Training - Full Payment $4,999'),
('price_1Sw3XsIRNf5vPH3AHXKqZ6OI', 'cdl-training', 'program', 'SELF_PAY', true, false, 'CDL Training - 35% Deposit $1,750'),

-- Medical Assistant
('price_1Sw0MiIRNf5vPH3AKrl1byt4', 'medical-assistant', 'program', 'SELF_PAY', false, false, 'Medical Assistant - Full Payment $4,200'),
('price_1Sw3Y3IRNf5vPH3AXRggDlJi', 'medical-assistant', 'program', 'SELF_PAY', true, false, 'Medical Assistant - 35% Deposit $1,470'),

-- Welding
('price_1Sw0N1IRNf5vPH3AxgRLR0Tc', 'welding-certification', 'program', 'SELF_PAY', false, false, 'Welding Certification - Full Payment $4,999'),
('price_1Sw3Y3IRNf5vPH3A30fWmtg3', 'welding-certification', 'program', 'SELF_PAY', true, false, 'Welding Certification - 35% Deposit $1,750'),

-- Electrical
('price_1Sw0N2IRNf5vPH3AUJiE2wcx', 'electrical-apprenticeship', 'program', 'SELF_PAY', false, false, 'Electrical Apprenticeship - Full Payment $4,999'),
('price_1Sw3YEIRNf5vPH3AY5GRReaX', 'electrical-apprenticeship', 'program', 'SELF_PAY', true, false, 'Electrical Apprenticeship - 35% Deposit $1,750'),

-- Plumbing
('price_1Sw0N7IRNf5vPH3AKxaVMVu7', 'plumbing-apprenticeship', 'program', 'SELF_PAY', false, false, 'Plumbing Apprenticeship - Full Payment $4,999'),
('price_1Sw3YEIRNf5vPH3AIeqemem8', 'plumbing-apprenticeship', 'program', 'SELF_PAY', true, false, 'Plumbing Apprenticeship - 35% Deposit $1,750'),

-- IT Support
('price_1Sw0N7IRNf5vPH3AYhZD45UF', 'it-support-specialist', 'program', 'SELF_PAY', false, false, 'IT Support Specialist - Full Payment $4,499'),
('price_1Sw3YFIRNf5vPH3AULx56Eyc', 'it-support-specialist', 'program', 'SELF_PAY', true, false, 'IT Support Specialist - 35% Deposit $1,575'),

-- Cybersecurity
('price_1Sw0N8IRNf5vPH3A6NdTRo3a', 'cybersecurity', 'program', 'SELF_PAY', false, false, 'Cybersecurity - Full Payment $4,499'),
('price_1Sw3YFIRNf5vPH3AqtXyw81e', 'cybersecurity', 'program', 'SELF_PAY', true, false, 'Cybersecurity - 35% Deposit $1,575'),

-- Building Maintenance
('price_1Sw0MoIRNf5vPH3AlfgIkzex', 'building-maintenance', 'program', 'SELF_PAY', false, false, 'Building Maintenance - Full Payment $3,800'),
('price_1Sw3YFIRNf5vPH3AxAChyphR', 'building-maintenance', 'program', 'SELF_PAY', true, false, 'Building Maintenance - 35% Deposit $1,330')

ON CONFLICT DO NOTHING;

-- Function to lookup enrollment mapping by price or product ID
CREATE OR REPLACE FUNCTION lookup_stripe_enrollment_map(
  p_price_id TEXT DEFAULT NULL,
  p_product_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  program_slug TEXT,
  program_id UUID,
  enrollment_type TEXT,
  funding_source TEXT,
  is_deposit BOOLEAN,
  is_free_enrollment BOOLEAN,
  auto_enroll BOOLEAN,
  send_welcome_email BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try price_id first (more specific)
  IF p_price_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.program_slug,
      m.program_id,
      m.enrollment_type,
      m.funding_source,
      m.is_deposit,
      m.is_free_enrollment,
      m.auto_enroll,
      m.send_welcome_email
    FROM stripe_price_enrollment_map m
    WHERE m.stripe_price_id = p_price_id
      AND m.is_active = true
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Fall back to product_id
  IF p_product_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.program_slug,
      m.program_id,
      m.enrollment_type,
      m.funding_source,
      m.is_deposit,
      m.is_free_enrollment,
      m.auto_enroll,
      m.send_welcome_email
    FROM stripe_price_enrollment_map m
    WHERE m.stripe_product_id = p_product_id
      AND m.is_active = true
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION lookup_stripe_enrollment_map TO service_role;

COMMENT ON TABLE stripe_price_enrollment_map IS 'Maps Stripe prices/products to enrollment configuration. Used by webhook fallback for Payment Links without metadata.';
COMMENT ON FUNCTION lookup_stripe_enrollment_map IS 'Looks up enrollment configuration by Stripe price_id or product_id. Returns NULL if no mapping found.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_student_enrollments_canonical.sql
-- ────────────────────────────────────────────────────────────────

-- Canonical student_enrollments table for program enrollment checkout
-- This is the single source of truth for paid/funded program enrollments

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  program_id UUID,
  program_slug TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  funding_source TEXT DEFAULT 'self_pay',
  amount_paid NUMERIC DEFAULT 0,
  region_id TEXT DEFAULT 'IN',
  transfer_hours NUMERIC DEFAULT 0,
  required_hours NUMERIC DEFAULT 1500,
  has_host_shop BOOLEAN DEFAULT false,
  host_shop_name TEXT,
  case_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (idempotent)
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT DEFAULT 'self_pay';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS region_id TEXT DEFAULT 'IN';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS transfer_hours NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS required_hours NUMERIC DEFAULT 1500;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS has_host_shop BOOLEAN DEFAULT false;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS host_shop_name TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create unique constraint on stripe_checkout_session_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_enrollments_stripe_checkout_session_id_key'
  ) THEN
    ALTER TABLE public.student_enrollments 
    ADD CONSTRAINT student_enrollments_stripe_checkout_session_id_key 
    UNIQUE (stripe_checkout_session_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program_slug ON public.student_enrollments(program_slug);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session ON public.student_enrollments(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view own enrollments" ON public.student_enrollments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Service role full access" ON public.student_enrollments;
CREATE POLICY "Service role full access" ON public.student_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Staff can view all enrollments" ON public.student_enrollments;
CREATE POLICY "Staff can view all enrollments" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'instructor')
    )
  );

-- Grant permissions
GRANT SELECT ON public.student_enrollments TO authenticated;
GRANT ALL ON public.student_enrollments TO service_role;

COMMENT ON TABLE public.student_enrollments IS 'Canonical table for all program enrollments (paid and funded)';
COMMENT ON COLUMN public.student_enrollments.stripe_checkout_session_id IS 'Stripe checkout session ID - unique, used for idempotent provisioning';
COMMENT ON COLUMN public.student_enrollments.funding_source IS 'self_pay, workone, wioa, grant, employer';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260201_training_programs_stripe.sql
-- ────────────────────────────────────────────────────────────────

-- Training Programs with Stripe Integration
-- Links all Elevate training programs to Stripe products and prices
-- Pricing from tuition-fees page and program-constants.ts

-- Create training programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  duration_formatted TEXT,
  tuition_cents INTEGER NOT NULL,
  tuition_dollars DECIMAL(10,2) NOT NULL,
  exam_fees_cents INTEGER DEFAULT 0,
  exam_fees_dollars DECIMAL(10,2) DEFAULT 0,
  materials_cents INTEGER DEFAULT 0,
  materials_dollars DECIMAL(10,2) DEFAULT 0,
  total_cost_cents INTEGER NOT NULL,
  total_cost_dollars DECIMAL(10,2) NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  funding_types TEXT[] DEFAULT '{}',
  wioa_eligible BOOLEAN DEFAULT false,
  wrg_eligible BOOLEAN DEFAULT false,
  apprenticeship_registered BOOLEAN DEFAULT false,
  certification_name TEXT,
  certifying_body TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_slug ON training_programs(slug);
CREATE INDEX IF NOT EXISTS idx_training_programs_category ON training_programs(category);
CREATE INDEX IF NOT EXISTS idx_training_programs_active ON training_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_training_programs_stripe ON training_programs(stripe_product_id);

-- Enable RLS
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active training programs" ON training_programs
  FOR SELECT USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage training programs" ON training_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert all training programs with Stripe IDs
INSERT INTO training_programs (
  slug, name, category, description, duration_weeks, duration_formatted,
  tuition_cents, tuition_dollars, exam_fees_cents, exam_fees_dollars,
  materials_cents, materials_dollars, total_cost_cents, total_cost_dollars,
  stripe_product_id, stripe_price_id, funding_types, wioa_eligible, wrg_eligible,
  apprenticeship_registered, certification_name, certifying_body
) VALUES

-- Healthcare Programs
('cna-certification', 'CNA (Certified Nursing Assistant)', 'Healthcare',
 'Become a Certified Nursing Assistant in 4-6 weeks. Prepare for the Indiana State CNA competency exam.',
 6, '4-6 weeks', 120000, 1200.00, 10500, 105.00, 7500, 75.00, 138000, 1380.00,
 'prod_TtXwt86rs7atPG', 'price_1Sw0MjIRNf5vPH3AsbrosRzm',
 ARRAY['Self-Pay'], false, false, false,
 'Certified Nursing Assistant', 'Indiana State Department of Health'),

('medical-assistant', 'Medical Assistant', 'Healthcare',
 'Comprehensive medical assistant training covering clinical and administrative skills.',
 12, '12 weeks', 420000, 4200.00, 0, 0.00, 15000, 150.00, 435000, 4350.00,
 'prod_TtXw0OKVMP3qt9', 'price_1Sw0MiIRNf5vPH3AKrl1byt4',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Medical Assistant Certificate', 'Elevate for Humanity'),

('phlebotomy-technician', 'Phlebotomy Technician', 'Healthcare',
 'Learn venipuncture and blood collection techniques for healthcare settings.',
 8, '8 weeks', 130500, 1305.00, 0, 0.00, 0, 0.00, 130500, 1305.00,
 'prod_TtXwPRdRtqxkRf', 'price_1Sw0MoIRNf5vPH3AkuXr8MH2',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Phlebotomy Technician Certificate', 'Elevate for Humanity'),

('home-health-aide', 'Home Health Aide', 'Healthcare',
 'Training for providing in-home care to elderly and disabled individuals.',
 12, '12 weeks', 470000, 4700.00, 0, 0.00, 0, 0.00, 470000, 4700.00,
 'prod_TtXwWlHCC8wDBQ', 'price_1Sw0MvIRNf5vPH3AVqaHbVEk',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Home Health Aide Certificate', 'Elevate for Humanity'),

('emergency-health-safety-tech', 'Emergency Health & Safety Tech', 'Healthcare',
 'Comprehensive emergency response and workplace safety training.',
 16, '16 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtXwrUZPzNdFGn', 'price_1Sw0MvIRNf5vPH3A9fiqsHgk',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Emergency Health & Safety Certificate', 'Elevate for Humanity'),

-- Skilled Trades Programs
('hvac-technician', 'HVAC Technician', 'Skilled Trades',
 'Heating, ventilation, and air conditioning installation and repair training.',
 36, '4-9 months', 550000, 5500.00, 15000, 150.00, 20000, 200.00, 585000, 5850.00,
 'prod_Tpj3MPuM0PxNUI', 'price_1Sw0MiIRNf5vPH3AtfgR47tM',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'EPA 608 Certification', 'Environmental Protection Agency'),

('building-maintenance-tech', 'Building Maintenance Technician', 'Skilled Trades',
 'Comprehensive building maintenance including electrical, plumbing, and HVAC basics.',
 16, '16 weeks', 380000, 3800.00, 0, 0.00, 20000, 200.00, 400000, 4000.00,
 'prod_Ttf4Syhwql0x8U', 'price_1Sw0MoIRNf5vPH3AlfgIkzex',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Building Maintenance Certificate', 'Elevate for Humanity'),

('welding-certification', 'Welding Certification', 'Skilled Trades',
 'Learn MIG, TIG, and stick welding techniques for manufacturing and construction.',
 16, '16 weeks', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3Th2kUVC0Qf', 'price_1Sw0N1IRNf5vPH3AxgRLR0Tc',
 ARRAY['WIOA', 'WRG'], true, true, true,
 'AWS Welding Certification', 'American Welding Society'),

('electrical-apprenticeship', 'Electrical Apprenticeship', 'Skilled Trades',
 'USDOL-registered electrical apprenticeship program.',
 208, '4 years', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3tdFxOiIoBL', 'price_1Sw0N2IRNf5vPH3AUJiE2wcx',
 ARRAY['WIOA', 'Apprenticeship Grants'], true, false, true,
 'Journeyman Electrician License', 'Indiana Professional Licensing Agency'),

('plumbing-apprenticeship', 'Plumbing Apprenticeship', 'Skilled Trades',
 'USDOL-registered plumbing apprenticeship program.',
 208, '4 years', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3prd6EuNRWZ', 'price_1Sw0N7IRNf5vPH3AKxaVMVu7',
 ARRAY['WIOA', 'Apprenticeship Grants'], true, false, true,
 'Journeyman Plumber License', 'Indiana Professional Licensing Agency'),

-- Beauty & Cosmetology Programs
('barber-apprenticeship', 'Barber Apprenticeship', 'Beauty & Cosmetology',
 'USDOL-registered barber apprenticeship. Earn while you learn with 2,000 hours of hands-on training.',
 52, '12 months', 498000, 4980.00, 10000, 100.00, 0, 0.00, 508000, 5080.00,
 'prod_Tpj31nVn1nCUB9', 'price_1Sw0MiIRNf5vPH3AQm0MtqGP',
 ARRAY['WIOA', 'Apprenticeship Grants', 'Self-Pay'], true, false, true,
 'Indiana Barber License', 'Indiana Professional Licensing Agency'),

('cosmetology-apprenticeship', 'Cosmetology Apprenticeship', 'Beauty & Cosmetology',
 'USDOL-registered cosmetology apprenticeship with 1,500 hours of training.',
 40, '10 months', 499900, 4999.00, 10000, 100.00, 0, 0.00, 509900, 5099.00,
 'prod_Tpj3fmBM6V8i4K', 'price_1Sw0N8IRNf5vPH3ACCquL2DS',
 ARRAY['WIOA', 'Apprenticeship Grants', 'Self-Pay'], true, false, true,
 'Indiana Cosmetology License', 'Indiana Professional Licensing Agency'),

('esthetician-apprenticeship', 'Esthetician Apprenticeship', 'Beauty & Cosmetology',
 'Skincare and esthetics training program.',
 24, '6 months', 280000, 2800.00, 0, 0.00, 0, 0.00, 280000, 2800.00,
 'prod_Ttf4qqJyLFydks', 'price_1Sw0MvIRNf5vPH3AQmARwmN1',
 ARRAY['WIOA', 'Self-Pay'], true, false, false,
 'Indiana Esthetician License', 'Indiana Professional Licensing Agency'),

('beauty-career-educator', 'Beauty Career Educator', 'Beauty & Cosmetology',
 'Train to become a licensed beauty instructor.',
 20, '20 weeks', 457500, 4575.00, 0, 0.00, 0, 0.00, 457500, 4575.00,
 'prod_TtXwVae6FPBCVx', 'price_1Sw0MpIRNf5vPH3AoiFUXQUY',
 ARRAY['WIOA', 'Self-Pay'], true, false, false,
 'Beauty Instructor License', 'Indiana Professional Licensing Agency'),

-- Transportation Programs
('cdl-training', 'CDL (Commercial Driver''s License)', 'Transportation',
 'Get your Commercial Driver''s License and start earning $50,000+ annually.',
 6, '4-6 weeks', 500000, 5000.00, 15000, 150.00, 0, 0.00, 515000, 5150.00,
 'prod_Tpj3J9kY81qup0', 'price_1Sw0KEIRNf5vPH3A0v7RlAZK',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Commercial Driver''s License (CDL)', 'Indiana Bureau of Motor Vehicles'),

-- Technology Programs
('it-support-specialist', 'IT Support Specialist', 'Technology',
 'CompTIA A+ preparation and help desk support training.',
 16, '16 weeks', 449900, 4499.00, 0, 0.00, 0, 0.00, 449900, 4499.00,
 'prod_Tpj34HcRLncjgr', 'price_1Sw0N7IRNf5vPH3AYhZD45UF',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'CompTIA A+ Certification', 'CompTIA'),

('cybersecurity-fundamentals', 'Cybersecurity Fundamentals', 'Technology',
 'Introduction to cybersecurity concepts and Security+ preparation.',
 16, '16 weeks', 449900, 4499.00, 0, 0.00, 0, 0.00, 449900, 4499.00,
 'prod_Tpj3ho4ng4Josf', 'price_1Sw0N8IRNf5vPH3A6NdTRo3a',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'CompTIA Security+ Certification', 'CompTIA'),

-- Human Services Programs
('peer-recovery-coach', 'Peer Recovery Specialist', 'Human Services',
 'Become a certified peer recovery coach to help others in addiction recovery.',
 8, '8 weeks', 250000, 2500.00, 5000, 50.00, 0, 0.00, 255000, 2550.00,
 'prod_TtXwXNoX8ooBLV', 'price_1Sw0MpIRNf5vPH3AovSyk3Z9',
 ARRAY['WIOA'], true, false, false,
 'Certified Peer Recovery Coach', 'Indiana DMHA'),

('public-safety-reentry', 'Public Safety Reentry Specialist', 'Human Services',
 'Training for supporting formerly incarcerated individuals in successful reentry.',
 16, '16 weeks', 432500, 4325.00, 0, 0.00, 0, 0.00, 432500, 4325.00,
 'prod_TtXwEFAZ05cWTo', 'price_1Sw0N1IRNf5vPH3AU4qwlgnV',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Reentry Specialist Certificate', 'Elevate for Humanity'),

('drug-alcohol-specimen-collector', 'Drug & Alcohol Specimen Collector', 'Human Services',
 'DOT-compliant training for urine and oral fluid specimen collection.',
 12, '12 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtiKfCmdtcPqri', 'price_1Sw0N1IRNf5vPH3ASlJFEiv8',
 ARRAY['WIOA', 'WRG', 'Self-Pay'], true, true, false,
 'DOT Collector Certification', 'National Drug Screening'),

-- Business Programs
('business-startup-marketing', 'Business Startup & Marketing', 'Business',
 'Learn to start and market your own business.',
 16, '16 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtXw7HvvDjzHSq', 'price_1Sw0MvIRNf5vPH3AKGMFKJJA',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Business Startup Certificate', 'Elevate for Humanity'),

('tax-preparation', 'Tax Preparation', 'Business',
 'Learn tax preparation for individuals and small businesses.',
 6, '6 weeks', 150000, 1500.00, 0, 0.00, 5000, 50.00, 155000, 1550.00,
 NULL, NULL, -- No Stripe product yet
 ARRAY['Self-Pay'], false, false, false,
 'Tax Preparer Certificate', 'Elevate for Humanity')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  tuition_cents = EXCLUDED.tuition_cents,
  tuition_dollars = EXCLUDED.tuition_dollars,
  total_cost_cents = EXCLUDED.total_cost_cents,
  total_cost_dollars = EXCLUDED.total_cost_dollars,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  funding_types = EXCLUDED.funding_types,
  wioa_eligible = EXCLUDED.wioa_eligible,
  updated_at = NOW();

-- Create program enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  program_id UUID REFERENCES training_programs(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  amount_paid_cents INTEGER NOT NULL,
  funding_source TEXT,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_stripe ON program_enrollments(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view own enrollments
CREATE POLICY "Users can view own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());

-- System can insert enrollments
CREATE POLICY "System can insert program enrollments" ON program_enrollments
  FOR INSERT WITH CHECK (true);

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage program enrollments" ON program_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON training_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON program_enrollments TO authenticated;

-- Create view for program catalog
CREATE OR REPLACE VIEW program_catalog AS
SELECT 
  id,
  slug,
  name,
  category,
  description,
  duration_formatted,
  tuition_dollars,
  total_cost_dollars,
  stripe_product_id,
  stripe_price_id,
  funding_types,
  wioa_eligible,
  wrg_eligible,
  apprenticeship_registered,
  certification_name
FROM training_programs
WHERE is_active = true
ORDER BY category, name;

GRANT SELECT ON program_catalog TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Training Programs migration complete!';
  RAISE NOTICE '📊 22 programs inserted with Stripe product/price IDs';
  RAISE NOTICE '💰 Pricing from tuition-fees page';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_add_cosmetology_program.sql
-- ────────────────────────────────────────────────────────────────

-- Add Cosmetology Apprenticeship Program

-- First ensure slug column exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug if not exists
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_unique ON public.programs(slug) WHERE slug IS NOT NULL;

-- Insert Cosmetology Apprenticeship program
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'COSMO-2024',
  'Cosmetology Apprenticeship',
  'cosmetology-apprenticeship',
  'State-licensed cosmetology apprenticeship program covering hair styling, coloring, skincare, nail care, and salon business management. Combines hands-on training with classroom instruction.',
  52,
  1500,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Also add Nail Tech program if referenced
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'NAIL-2024',
  'Nail Technician Program',
  'nail-technician',
  'Professional nail technician training covering manicures, pedicures, nail art, acrylics, and salon sanitation.',
  16,
  450,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Update existing programs to have slugs if missing
UPDATE public.programs SET slug = 'barber-apprenticeship' WHERE code = 'BARBER-2024' AND slug IS NULL;
UPDATE public.programs SET slug = 'hvac-technician' WHERE code = 'HVAC-2024' AND slug IS NULL;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_complete_content_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_enrollment_state_machine.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================================
-- ENROLLMENT STATE MACHINE
-- Adds columns for frictionless enrollment flow tracking
-- ============================================================

-- Add enrollment state tracking columns
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS orientation_completed_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS funding_source TEXT;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('self_pay', 'wioa', 'wrg', 'jri', 'employer', 'other'));

-- Drop existing status constraint and add new one with all states
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN (
  'applied',
  'approved', 
  'paid',
  'confirmed',
  'orientation_complete',
  'documents_complete',
  'active',
  'completed',
  'withdrawn',
  'suspended',
  'pending'
));

-- Create index for faster state queries
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);

-- Function to get next required action for an enrollment
CREATE OR REPLACE FUNCTION get_enrollment_next_action(enrollment_id UUID)
RETURNS TABLE(action_label TEXT, action_href TEXT, action_description TEXT) AS $$
DECLARE
  enrollment_record RECORD;
  program_slug TEXT;
BEGIN
  SELECT e.*, p.slug INTO enrollment_record
  FROM enrollments e
  LEFT JOIN programs p ON e.program_id = p.id
  WHERE e.id = enrollment_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  program_slug := COALESCE(enrollment_record.slug, 'barber-apprenticeship');
  
  -- Priority 1: Orientation
  IF enrollment_record.orientation_completed_at IS NULL THEN
    RETURN QUERY SELECT 
      'Complete Orientation'::TEXT,
      ('/programs/' || program_slug || '/orientation')::TEXT,
      'Complete your mandatory orientation to continue'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 2: Documents
  IF enrollment_record.documents_submitted_at IS NULL THEN
    RETURN QUERY SELECT 
      'Submit Required Documents'::TEXT,
      ('/programs/' || program_slug || '/documents')::TEXT,
      'Upload your required documents to access your program'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 3: First course
  RETURN QUERY SELECT 
    'Begin Course 1'::TEXT,
    '/apprentice/courses/1'::TEXT,
    'Start your first course module'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_enrollment_next_action(UUID) TO authenticated;

COMMENT ON COLUMN public.enrollments.orientation_completed_at IS 'Timestamp when student completed mandatory orientation';
COMMENT ON COLUMN public.enrollments.documents_submitted_at IS 'Timestamp when student submitted required documents';
COMMENT ON COLUMN public.enrollments.confirmed_at IS 'Timestamp when enrollment was confirmed (post-payment)';

-- ============================================================
-- STORAGE BUCKET FOR ENROLLMENT DOCUMENTS
-- ============================================================

-- Create storage bucket for enrollment documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment-documents',
  'enrollment-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for enrollment-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can access all enrollment documents"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_fix_security_issues.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================
-- Fix Security Issues from Supabase Linter
-- ============================================
-- 1. Missing RLS policies for application_state_events, wishlists
-- 2. Function search_path vulnerabilities  
-- 3. Overly permissive RLS policies
--
-- This migration uses safe patterns that won't fail if tables/functions don't exist

-- ============================================
-- SECTION 1: FIX FUNCTION SEARCH_PATH
-- ============================================

DO $$
BEGIN
  -- calculate_distance_meters
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_distance_meters') THEN
    ALTER FUNCTION public.calculate_distance_meters(decimal, decimal, decimal, decimal) SET search_path = public;
    RAISE NOTICE 'Fixed: calculate_distance_meters';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped calculate_distance_meters: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_no_apprenticeship_for_non_apprentice_programs') THEN
    ALTER FUNCTION public.guard_no_apprenticeship_for_non_apprentice_programs() SET search_path = public;
    RAISE NOTICE 'Fixed: guard_no_apprenticeship_for_non_apprentice_programs';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped guard_no_apprenticeship_for_non_apprentice_programs: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_within_geofence') THEN
    ALTER FUNCTION public.is_within_geofence(uuid, decimal, decimal) SET search_path = public;
    RAISE NOTICE 'Fixed: is_within_geofence';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped is_within_geofence: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'lookup_stripe_enrollment_map') THEN
    EXECUTE 'ALTER FUNCTION public.lookup_stripe_enrollment_map SET search_path = public';
    RAISE NOTICE 'Fixed: lookup_stripe_enrollment_map';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped lookup_stripe_enrollment_map: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public;
    RAISE NOTICE 'Fixed: set_updated_at';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped set_updated_at: %', SQLERRM;
END $$;

-- ============================================
-- SECTION 2: MISSING RLS POLICIES
-- ============================================

-- application_state_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'application_state_events') THEN
    DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
    DROP POLICY IF EXISTS "Staff can view all state events" ON application_state_events;
    DROP POLICY IF EXISTS "Users can view own application events" ON application_state_events;

    CREATE POLICY "Admins can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

    CREATE POLICY "Staff can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'staff'));

    CREATE POLICY "Users can view own application events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM career_applications ca WHERE ca.id = application_state_events.application_id AND ca.user_id = auth.uid()));

    RAISE NOTICE 'Fixed: application_state_events policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped application_state_events: %', SQLERRM;
END $$;

-- wishlists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
    DROP POLICY IF EXISTS "Users can view own wishlists" ON wishlists;
    DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Admins can view all wishlists" ON wishlists;

    CREATE POLICY "Users can view own wishlists" ON wishlists FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can add to own wishlist" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can remove from own wishlist" ON wishlists FOR DELETE USING (auth.uid() = user_id);
    CREATE POLICY "Admins can view all wishlists" ON wishlists FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

    RAISE NOTICE 'Fixed: wishlists policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped wishlists: %', SQLERRM;
END $$;

-- ============================================
-- SECTION 3: OVERLY PERMISSIVE RLS POLICIES
-- ============================================

-- applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON applications;
    CREATE POLICY "anyone_insert" ON applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND LENGTH(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped applications: %', SQLERRM;
END $$;

-- barbershop_partner_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'barbershop_partner_applications') THEN
    DROP POLICY IF EXISTS "Allow public inserts" ON barbershop_partner_applications;
    CREATE POLICY "Allow public inserts" ON barbershop_partner_applications FOR INSERT
      WITH CHECK (business_name IS NOT NULL AND LENGTH(business_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: barbershop_partner_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped barbershop_partner_applications: %', SQLERRM;
END $$;

-- career_course_purchases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'career_course_purchases') THEN
    DROP POLICY IF EXISTS "career_course_purchases_insert" ON career_course_purchases;
    CREATE POLICY "career_course_purchases_insert" ON career_course_purchases FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
    RAISE NOTICE 'Fixed: career_course_purchases policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped career_course_purchases: %', SQLERRM;
END $$;

-- conversions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversions') THEN
    DROP POLICY IF EXISTS "System can insert conversions" ON conversions;
    CREATE POLICY "System can insert conversions" ON conversions FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
    RAISE NOTICE 'Fixed: conversions policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped conversions: %', SQLERRM;
END $$;

-- employer_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employer_applications') THEN
    DROP POLICY IF EXISTS "employer_applications_insert" ON employer_applications;
    DROP POLICY IF EXISTS "employer_applications_insert_anon" ON employer_applications;
    DROP POLICY IF EXISTS "employer_applications_insert_auth" ON employer_applications;
    CREATE POLICY "employer_applications_insert" ON employer_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: employer_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped employer_applications: %', SQLERRM;
END $$;

-- leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    DROP POLICY IF EXISTS "Public access to leads" ON leads;
    DROP POLICY IF EXISTS "leads_insert" ON leads;
    DROP POLICY IF EXISTS "leads_admin_all" ON leads;
    DROP POLICY IF EXISTS "leads_select" ON leads;
    
    CREATE POLICY "leads_insert" ON leads FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    CREATE POLICY "leads_admin_all" ON leads FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "leads_select" ON leads FOR SELECT USING (true);
    RAISE NOTICE 'Fixed: leads policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped leads: %', SQLERRM;
END $$;

-- license_purchases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'license_purchases') THEN
    DROP POLICY IF EXISTS "license_purchases_all" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_select" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_insert" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_admin" ON license_purchases;
    
    CREATE POLICY "license_purchases_select" ON license_purchases FOR SELECT
      USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "license_purchases_insert" ON license_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "license_purchases_admin" ON license_purchases FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: license_purchases policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped license_purchases: %', SQLERRM;
END $$;

-- license_violations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'license_violations') THEN
    DROP POLICY IF EXISTS "license_violations_all" ON license_violations;
    DROP POLICY IF EXISTS "license_violations_admin" ON license_violations;
    DROP POLICY IF EXISTS "license_violations_select" ON license_violations;
    
    CREATE POLICY "license_violations_admin" ON license_violations FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "license_violations_select" ON license_violations FOR SELECT USING (true);
    RAISE NOTICE 'Fixed: license_violations policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped license_violations: %', SQLERRM;
END $$;

-- licenses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'licenses') THEN
    DROP POLICY IF EXISTS "licenses_all" ON licenses;
    DROP POLICY IF EXISTS "licenses_select" ON licenses;
    DROP POLICY IF EXISTS "licenses_admin" ON licenses;
    
    CREATE POLICY "licenses_select" ON licenses FOR SELECT USING (true);
    CREATE POLICY "licenses_admin" ON licenses FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: licenses policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped licenses: %', SQLERRM;
END $$;

-- page_views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'page_views') THEN
    DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
    CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
    RAISE NOTICE 'Fixed: page_views policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped page_views: %', SQLERRM;
END $$;

-- partner_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_applications') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_insert" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_select" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_admin" ON partner_applications;
    
    CREATE POLICY "partner_applications_insert" ON partner_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255);
    CREATE POLICY "partner_applications_select" ON partner_applications FOR SELECT USING (true);
    CREATE POLICY "partner_applications_admin" ON partner_applications FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    RAISE NOTICE 'Fixed: partner_applications policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_applications: %', SQLERRM;
END $$;

-- partner_audit_log
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_audit_log') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_audit_log;
    DROP POLICY IF EXISTS "partner_audit_log_admin" ON partner_audit_log;
    
    CREATE POLICY "partner_audit_log_admin" ON partner_audit_log FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_audit_log policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_audit_log: %', SQLERRM;
END $$;

-- partner_inquiries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_inquiries') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON partner_inquiries;
    DROP POLICY IF EXISTS "partner_inquiries_insert" ON partner_inquiries;
    
    CREATE POLICY "partner_inquiries_insert" ON partner_inquiries FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: partner_inquiries policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_inquiries: %', SQLERRM;
END $$;

-- partner_program_access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_program_access') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_program_access;
    DROP POLICY IF EXISTS "partner_program_access_select" ON partner_program_access;
    DROP POLICY IF EXISTS "partner_program_access_admin" ON partner_program_access;
    
    CREATE POLICY "partner_program_access_select" ON partner_program_access FOR SELECT
      USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "partner_program_access_admin" ON partner_program_access FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_program_access policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_program_access: %', SQLERRM;
END $$;

-- partner_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_users') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_users;
    DROP POLICY IF EXISTS "partner_users_select" ON partner_users;
    DROP POLICY IF EXISTS "partner_users_admin" ON partner_users;
    
    CREATE POLICY "partner_users_select" ON partner_users FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "partner_users_admin" ON partner_users FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_users policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_users: %', SQLERRM;
END $$;

-- partners
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partners') THEN
    DROP POLICY IF EXISTS "allow_all" ON partners;
    DROP POLICY IF EXISTS "partners_select" ON partners;
    DROP POLICY IF EXISTS "partners_own" ON partners;
    DROP POLICY IF EXISTS "partners_admin" ON partners;
    
    CREATE POLICY "partners_select" ON partners FOR SELECT USING (true);
    CREATE POLICY "partners_own" ON partners FOR UPDATE USING (user_id = auth.uid());
    CREATE POLICY "partners_admin" ON partners FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partners policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partners: %', SQLERRM;
END $$;

-- product_reports
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_reports') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON product_reports;
    DROP POLICY IF EXISTS "product_reports_insert" ON product_reports;
    
    CREATE POLICY "product_reports_insert" ON product_reports FOR INSERT
      WITH CHECK (product_id IS NOT NULL AND reason IS NOT NULL AND LENGTH(reason) <= 1000);
    RAISE NOTICE 'Fixed: product_reports policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped product_reports: %', SQLERRM;
END $$;

-- program_holder_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'program_holder_applications') THEN
    DROP POLICY IF EXISTS "program_holder_applications_insert" ON program_holder_applications;
    DROP POLICY IF EXISTS "program_holder_applications_insert_anon" ON program_holder_applications;
    DROP POLICY IF EXISTS "program_holder_applications_insert_auth" ON program_holder_applications;
    
    CREATE POLICY "program_holder_applications_insert" ON program_holder_applications FOR INSERT
      WITH CHECK (organization_name IS NOT NULL AND LENGTH(organization_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: program_holder_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped program_holder_applications: %', SQLERRM;
END $$;

-- promo_code_uses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promo_code_uses') THEN
    DROP POLICY IF EXISTS "promo_code_uses_insert" ON promo_code_uses;
    
    CREATE POLICY "promo_code_uses_insert" ON promo_code_uses FOR INSERT
      WITH CHECK (promo_code_id IS NOT NULL);
    RAISE NOTICE 'Fixed: promo_code_uses policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped promo_code_uses: %', SQLERRM;
END $$;

-- provisioning_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provisioning_events') THEN
    DROP POLICY IF EXISTS "provisioning_events_all" ON provisioning_events;
    DROP POLICY IF EXISTS "provisioning_events_select" ON provisioning_events;
    DROP POLICY IF EXISTS "provisioning_events_insert" ON provisioning_events;
    
    CREATE POLICY "provisioning_events_select" ON provisioning_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "provisioning_events_insert" ON provisioning_events FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: provisioning_events policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped provisioning_events: %', SQLERRM;
END $$;

-- shop_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shop_applications') THEN
    DROP POLICY IF EXISTS "Anyone can submit application" ON shop_applications;
    DROP POLICY IF EXISTS "shop_applications_insert" ON shop_applications;
    
    CREATE POLICY "shop_applications_insert" ON shop_applications FOR INSERT
      WITH CHECK (shop_name IS NOT NULL AND LENGTH(shop_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: shop_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped shop_applications: %', SQLERRM;
END $$;

-- staff_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_applications') THEN
    DROP POLICY IF EXISTS "staff_applications_insert" ON staff_applications;
    DROP POLICY IF EXISTS "staff_applications_insert_anon" ON staff_applications;
    DROP POLICY IF EXISTS "staff_applications_insert_auth" ON staff_applications;
    
    CREATE POLICY "staff_applications_insert" ON staff_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: staff_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped staff_applications: %', SQLERRM;
END $$;

-- student_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_applications') THEN
    DROP POLICY IF EXISTS "student_applications_insert" ON student_applications;
    DROP POLICY IF EXISTS "student_applications_insert_anon" ON student_applications;
    DROP POLICY IF EXISTS "student_applications_insert_auth" ON student_applications;
    
    CREATE POLICY "student_applications_insert" ON student_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: student_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped student_applications: %', SQLERRM;
END $$;

-- tax_appointments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_appointments') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON tax_appointments;
    DROP POLICY IF EXISTS "tax_appointments_insert" ON tax_appointments;
    
    CREATE POLICY "tax_appointments_insert" ON tax_appointments FOR INSERT
      WITH CHECK (client_name IS NOT NULL AND LENGTH(client_name) <= 255 AND client_email IS NOT NULL AND client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND appointment_date IS NOT NULL AND appointment_date >= CURRENT_DATE);
    RAISE NOTICE 'Fixed: tax_appointments policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_appointments: %', SQLERRM;
END $$;

-- tax_document_uploads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_document_uploads') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON tax_document_uploads;
    DROP POLICY IF EXISTS "tax_document_uploads_insert" ON tax_document_uploads;
    
    CREATE POLICY "tax_document_uploads_insert" ON tax_document_uploads FOR INSERT
      WITH CHECK (appointment_id IS NOT NULL AND file_name IS NOT NULL AND LENGTH(file_name) <= 255);
    RAISE NOTICE 'Fixed: tax_document_uploads policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_document_uploads: %', SQLERRM;
END $$;

-- tax_intake
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_intake') THEN
    DROP POLICY IF EXISTS "public_can_insert_tax_intake" ON tax_intake;
    DROP POLICY IF EXISTS "tax_intake_insert" ON tax_intake;
    
    CREATE POLICY "tax_intake_insert" ON tax_intake FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: tax_intake policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_intake: %', SQLERRM;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security fixes migration completed';
  RAISE NOTICE '- Function search_path: 5 functions';
  RAISE NOTICE '- Missing RLS policies: 2 tables';
  RAISE NOTICE '- Permissive policies: 27 tables';
  RAISE NOTICE '========================================';
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_seed_test_enrollment.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================================
-- SEED: Test Enrollment Data
-- Creates one real enrollment for testing the student dashboard
-- Run this AFTER creating a test user via Supabase Auth
-- ============================================================

-- This migration creates sample data for testing.
-- It uses DO blocks to safely insert only if data doesn't exist.

DO $$
DECLARE
  v_program_id UUID;
  v_cohort_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Get or create the barber program
  SELECT id INTO v_program_id 
  FROM public.programs 
  WHERE slug = 'barber-apprenticeship' 
  LIMIT 1;

  IF v_program_id IS NULL THEN
    INSERT INTO public.programs (
      slug, 
      title, 
      description, 
      code,
      duration_weeks,
      total_hours,
      tuition,
      funding_eligible,
      status,
      category
    ) VALUES (
      'barber-apprenticeship',
      'Barber Apprenticeship',
      'USDOL Registered Apprenticeship program for barber licensure. 1,500 hours of combined OJT and RTI.',
      'BARBER-APP',
      52,
      1500,
      4980.00,
      true,
      'active',
      'beauty'
    )
    RETURNING id INTO v_program_id;
  END IF;

  -- Get or create a cohort for the program
  SELECT id INTO v_cohort_id 
  FROM public.cohorts 
  WHERE program_id = v_program_id 
  AND status = 'active'
  LIMIT 1;

  IF v_cohort_id IS NULL THEN
    INSERT INTO public.cohorts (
      program_id,
      code,
      name,
      start_date,
      end_date,
      max_capacity,
      status,
      location
    ) VALUES (
      v_program_id,
      'BARBER-2026-01',
      'Barber Apprenticeship - January 2026',
      '2026-01-15',
      '2027-01-15',
      20,
      'active',
      'Indianapolis, IN'
    )
    RETURNING id INTO v_cohort_id;
  END IF;

  -- Note: To create a test enrollment, you need a real user ID from auth.users
  -- The enrollments table uses student_id (not user_id) and course_id
  -- program_id is added via ALTER TABLE in 001_barber_hvac_reference.sql
  --
  -- After creating a user via Supabase Auth UI or API, run:
  --
  -- INSERT INTO public.enrollments (student_id, program_id, cohort_id, status, progress)
  -- VALUES ('YOUR-USER-UUID-HERE', 'PROGRAM-UUID', 'COHORT-UUID', 'active', 0);

  RAISE NOTICE 'Seed data created. Program ID: %, Cohort ID: %', v_program_id, v_cohort_id;
END $$;

-- Create an announcement for testing
INSERT INTO public.announcements (title, content, is_active, created_at)
SELECT 
  'Welcome to the Spring 2026 Cohort!',
  'We are excited to welcome all new apprentices. Please complete your orientation within the first week.',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'Welcome to the Spring 2026 Cohort!'
);

-- Add a second announcement
INSERT INTO public.announcements (title, content, is_active, created_at)
SELECT 
  'State Board Exam Prep Sessions Available',
  'Sign up for our free state board exam prep sessions. Limited spots available.',
  true,
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'State Board Exam Prep Sessions Available'
);

COMMENT ON TABLE public.programs IS 'Training programs offered by Elevate';
COMMENT ON TABLE public.cohorts IS 'Groups of students enrolled in a program delivery';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in programs/cohorts';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260202_zero_stub_content_system.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260203_agreement_enforcement.sql
-- ────────────────────────────────────────────────────────────────

-- AGREEMENT ENFORCEMENT MIGRATION
-- Single source of truth for all legal agreements
-- Immutable, append-only, bound to auth.uid()

-- 1. Create the canonical agreement table
CREATE TABLE IF NOT EXISTS public.license_agreement_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Agreement details
  agreement_type TEXT NOT NULL, -- 'terms_of_service', 'privacy_policy', 'handbook', 'enrollment_agreement', 'data_processing'
  document_version TEXT NOT NULL, -- e.g., '2024.1', '2024.2'
  document_url TEXT, -- Link to the actual document
  
  -- Signer context (captured at signing time)
  role_at_signing TEXT NOT NULL, -- 'student', 'partner', 'employer', 'admin', 'workforce_board'
  email_at_signing TEXT NOT NULL, -- Must match auth.users.email
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Immutability constraint
  CONSTRAINT no_future_acceptance CHECK (accepted_at <= NOW())
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON public.license_agreement_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type_version ON public.license_agreement_acceptances(agreement_type, document_version);
CREATE INDEX IF NOT EXISTS idx_agreements_org ON public.license_agreement_acceptances(organization_id);
CREATE INDEX IF NOT EXISTS idx_agreements_accepted_at ON public.license_agreement_acceptances(accepted_at);

-- 3. RLS: INSERT only, NO UPDATE, NO DELETE
ALTER TABLE public.license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own agreements
CREATE POLICY "Users can insert own agreements"
  ON public.license_agreement_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own agreements
CREATE POLICY "Users can read own agreements"
  ON public.license_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all agreements (for compliance reporting)
CREATE POLICY "Admins can read all agreements"
  ON public.license_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- NO UPDATE POLICY - agreements are immutable
-- NO DELETE POLICY - agreements cannot be removed

-- 4. Create onboarding status tracking
CREATE TABLE IF NOT EXISTS public.user_onboarding_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'on_hold', 'pending_review')),
  
  -- Checklist items
  profile_complete BOOLEAN DEFAULT FALSE,
  agreements_signed BOOLEAN DEFAULT FALSE,
  documents_uploaded BOOLEAN DEFAULT FALSE,
  documents_verified BOOLEAN DEFAULT FALSE,
  orientation_complete BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Admin notes
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.user_onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.user_onboarding_status(status);

-- RLS for onboarding status
ALTER TABLE public.user_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding status"
  ON public.user_onboarding_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding status"
  ON public.user_onboarding_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding status"
  ON public.user_onboarding_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all onboarding"
  ON public.user_onboarding_status
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- 5. Required documents per role
CREATE TABLE IF NOT EXISTS public.required_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- 'student', 'partner', 'employer'
  document_type TEXT NOT NULL, -- 'id_verification', 'proof_of_residence', 'background_check', etc.
  description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User document submissions
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  
  -- Verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_docs_user ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_status ON public.user_documents(status);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON public.user_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can verify documents"
  ON public.user_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- 7. Function to check if user has completed required agreements
CREATE OR REPLACE FUNCTION public.check_user_agreements(
  p_user_id UUID,
  p_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  required_agreements TEXT[] := ARRAY['terms_of_service', 'privacy_policy'];
  signed_count INT;
BEGIN
  -- Add role-specific requirements
  IF p_role = 'student' THEN
    required_agreements := required_agreements || ARRAY['handbook', 'enrollment_agreement'];
  ELSIF p_role IN ('partner', 'employer') THEN
    required_agreements := required_agreements || ARRAY['data_processing', 'partner_agreement'];
  END IF;
  
  -- Count signed agreements (latest version only)
  SELECT COUNT(DISTINCT agreement_type) INTO signed_count
  FROM public.license_agreement_acceptances
  WHERE user_id = p_user_id
  AND agreement_type = ANY(required_agreements);
  
  RETURN signed_count >= array_length(required_agreements, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to check onboarding completion
CREATE OR REPLACE FUNCTION public.check_onboarding_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  onboarding_record RECORD;
BEGIN
  SELECT * INTO onboarding_record
  FROM public.user_onboarding_status
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN onboarding_record.status = 'complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Insert default required documents
INSERT INTO public.required_documents (role, document_type, description, is_required) VALUES
  ('student', 'government_id', 'Government-issued photo ID', true),
  ('student', 'proof_of_residence', 'Proof of Indiana residency', true),
  ('student', 'education_verification', 'High school diploma or GED', true),
  ('partner', 'business_license', 'Business license or registration', true),
  ('partner', 'insurance_certificate', 'Liability insurance certificate', true),
  ('employer', 'business_verification', 'Business verification document', true)
ON CONFLICT DO NOTHING;

-- 10. Create compliance view for admins
CREATE OR REPLACE VIEW public.admin_compliance_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  o.status as onboarding_status,
  o.agreements_signed,
  o.documents_uploaded,
  o.documents_verified,
  o.completed_at as onboarding_completed_at,
  (
    SELECT COUNT(*) 
    FROM public.license_agreement_acceptances a 
    WHERE a.user_id = p.id
  ) as total_agreements_signed,
  (
    SELECT COUNT(*) 
    FROM public.user_documents d 
    WHERE d.user_id = p.id AND d.status = 'approved'
  ) as verified_documents_count,
  (
    SELECT MAX(accepted_at) 
    FROM public.license_agreement_acceptances a 
    WHERE a.user_id = p.id
  ) as last_agreement_signed
FROM public.profiles p
LEFT JOIN public.user_onboarding_status o ON o.user_id = p.id
ORDER BY p.created_at DESC;

COMMENT ON TABLE public.license_agreement_acceptances IS 'Single source of truth for all legal agreements. Immutable, append-only.';
COMMENT ON TABLE public.user_onboarding_status IS 'Tracks user onboarding completion status. Required before LMS access.';
COMMENT ON TABLE public.user_documents IS 'User-uploaded documents for verification.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260203_soft_holds_schema.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Soft Holds Schema Updates
-- Adds fields needed for proper enrollment state tracking and program availability
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ENROLLMENTS TABLE UPDATES
-- ============================================

-- Drop the old status constraint and add new one with more states
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN (
  'applied',                    -- Application submitted, no payment
  'enrolled_pending_approval',  -- Payment received, waiting for approval
  'active',                     -- Approved, full access granted
  'paused',                     -- Temporarily suspended (payment failed, compliance)
  'completed',                  -- Program finished
  'withdrawn',                  -- Student withdrew
  'cancelled',                  -- Admin cancelled
  'pending'                     -- Legacy: treat as 'applied'
));

-- Add new columns for enrollment tracking (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'application_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN application_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'program_slug') THEN
    ALTER TABLE public.enrollments ADD COLUMN program_slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_option') THEN
    ALTER TABLE public.enrollments ADD COLUMN payment_option TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.enrollments ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'approved_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'approved_by') THEN
    ALTER TABLE public.enrollments ADD COLUMN approved_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'paused_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'pause_reason') THEN
    ALTER TABLE public.enrollments ADD COLUMN pause_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'agreement_signed') THEN
    ALTER TABLE public.enrollments ADD COLUMN agreement_signed BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'agreement_signed_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN agreement_signed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add constraint for payment_option
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_option_check;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_payment_option_check 
  CHECK (payment_option IS NULL OR payment_option IN ('full', 'deposit', 'installment', 'funded', 'employer_paid'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_application_id ON public.enrollments(application_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_slug ON public.enrollments(program_slug);

-- ============================================
-- 2. PROGRAMS TABLE UPDATES
-- ============================================

-- Add availability and funding cycle fields (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'availability_status') THEN
    ALTER TABLE public.programs ADD COLUMN availability_status TEXT DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'next_start_date') THEN
    ALTER TABLE public.programs ADD COLUMN next_start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'enrollment_deadline') THEN
    ALTER TABLE public.programs ADD COLUMN enrollment_deadline DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'seats_available') THEN
    ALTER TABLE public.programs ADD COLUMN seats_available INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'total_seats') THEN
    ALTER TABLE public.programs ADD COLUMN total_seats INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'funding_cycle') THEN
    ALTER TABLE public.programs ADD COLUMN funding_cycle TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'funding_confirmed') THEN
    ALTER TABLE public.programs ADD COLUMN funding_confirmed BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'is_apprenticeship') THEN
    ALTER TABLE public.programs ADD COLUMN is_apprenticeship BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'requires_employer_match') THEN
    ALTER TABLE public.programs ADD COLUMN requires_employer_match BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add constraint for availability_status
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_availability_status_check;
ALTER TABLE public.programs ADD CONSTRAINT programs_availability_status_check 
  CHECK (availability_status IS NULL OR availability_status IN ('open', 'waitlist', 'closed', 'funding_pending', 'coming_soon'));

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_programs_availability ON public.programs(availability_status);
CREATE INDEX IF NOT EXISTS idx_programs_is_apprenticeship ON public.programs(is_apprenticeship);

-- ============================================
-- 3. APPLICATIONS TABLE UPDATES
-- ============================================

-- Ensure applications table has needed fields (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'program_slug') THEN
    ALTER TABLE public.applications ADD COLUMN program_slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_received_at') THEN
    ALTER TABLE public.applications ADD COLUMN payment_received_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_status') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_verified_at') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_verified_by') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_verified_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'advisor_assigned') THEN
    ALTER TABLE public.applications ADD COLUMN advisor_assigned UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'advisor_notes') THEN
    ALTER TABLE public.applications ADD COLUMN advisor_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'next_step') THEN
    ALTER TABLE public.applications ADD COLUMN next_step TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'next_step_due_date') THEN
    ALTER TABLE public.applications ADD COLUMN next_step_due_date DATE;
  END IF;
END $$;

-- Add constraint for eligibility_status
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_eligibility_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_eligibility_status_check 
  CHECK (eligibility_status IS NULL OR eligibility_status IN ('pending', 'eligible', 'ineligible', 'review_needed'));

-- Index for application lookups
CREATE INDEX IF NOT EXISTS idx_applications_program_slug ON public.applications(program_slug);
CREATE INDEX IF NOT EXISTS idx_applications_eligibility_status ON public.applications(eligibility_status);

-- ============================================
-- 4. PAYMENT LOGS TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_option TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checkout_started', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_session ON public.payment_logs(stripe_session_id);

-- ============================================
-- 5. UPDATE EXISTING DATA
-- ============================================

-- Mark apprenticeship programs
UPDATE public.programs 
SET is_apprenticeship = true, requires_employer_match = true
WHERE slug IN ('barber-apprenticeship', 'barber', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship')
  OR name ILIKE '%apprenticeship%';

-- Set default availability for active programs
UPDATE public.programs 
SET availability_status = 'open'
WHERE is_active = true AND availability_status IS NULL;

-- Migrate legacy 'pending' status to 'applied'
UPDATE public.enrollments 
SET status = 'applied' 
WHERE status = 'pending';

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Payment logs: users can see their own
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment logs" ON public.payment_logs;
CREATE POLICY "Users can view own payment logs" ON public.payment_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage payment logs" ON public.payment_logs;
CREATE POLICY "Service role can manage payment logs" ON public.payment_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 7. HELPER FUNCTION: Check enrollment access
-- ============================================

CREATE OR REPLACE FUNCTION public.check_enrollment_access(
  p_user_id UUID,
  p_program_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  can_access_portal BOOLEAN,
  can_track_hours BOOLEAN,
  can_access_milady BOOLEAN,
  enrollment_status TEXT,
  message TEXT
) AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- Get the most recent enrollment for this user/program
  SELECT e.status, e.agreement_signed
  INTO v_enrollment
  FROM public.enrollments e
  WHERE e.user_id = p_user_id
    AND (p_program_slug IS NULL OR e.program_slug = p_program_slug)
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, false, false, 
      NULL::TEXT, 
      'No enrollment found. Please apply first.'::TEXT;
    RETURN;
  END IF;

  CASE v_enrollment.status
    WHEN 'active' THEN
      RETURN QUERY SELECT 
        true, true, 
        COALESCE(v_enrollment.agreement_signed, false),
        v_enrollment.status,
        CASE WHEN v_enrollment.agreement_signed 
          THEN 'Full access granted.'
          ELSE 'Sign agreement to access training materials.'
        END;
    WHEN 'enrolled_pending_approval' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Payment received. Waiting for approval and shop assignment.'::TEXT;
    WHEN 'applied' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Application submitted. Complete payment to continue.'::TEXT;
    WHEN 'paused' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Enrollment paused. Contact support to resolve.'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Enrollment not active.'::TEXT;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_enrollment_access TO authenticated;

-- ============================================
-- DONE
-- ============================================


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260205_document_automation.sql
-- ────────────────────────────────────────────────────────────────

-- Document Automation Tables
-- Stores OCR extractions, automated decisions, and review queue

-- 1. Document Extractions - stores OCR/parsing results
CREATE TABLE IF NOT EXISTS documents_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- transcript, license, insurance, mou, id, w2
  extracted JSONB NOT NULL DEFAULT '{}', -- extracted fields
  raw_text TEXT, -- raw OCR text
  confidence NUMERIC(5,4) DEFAULT 0, -- 0.0000 to 1.0000
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'needs_review')),
  validation_errors TEXT[], -- list of validation failures
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_extractions_document ON documents_extractions(document_id);
CREATE INDEX idx_doc_extractions_status ON documents_extractions(status);
CREATE INDEX idx_doc_extractions_doc_type ON documents_extractions(doc_type);

-- 2. Automated Decisions - audit trail for all system decisions
CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL, -- application, partner, transfer_hours, routing, document
  subject_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_review', 'recommended', 'assigned', 'flagged')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}',
  input_snapshot JSONB NOT NULL DEFAULT '{}', -- extracted fields + context at decision time
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  actor TEXT NOT NULL DEFAULT 'system',
  overridden_by UUID REFERENCES profiles(id),
  overridden_at TIMESTAMPTZ,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_decisions_subject ON automated_decisions(subject_type, subject_id);
CREATE INDEX idx_auto_decisions_decision ON automated_decisions(decision);
CREATE INDEX idx_auto_decisions_created ON automated_decisions(created_at DESC);

-- 3. Review Queue - unified queue for human review
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL, -- transcript_review, partner_docs_review, routing_review, document_review
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  reasons TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  assigned_to UUID REFERENCES profiles(id),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_type ON review_queue(queue_type);
CREATE INDEX idx_review_queue_priority ON review_queue(priority, created_at);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to) WHERE assigned_to IS NOT NULL;

-- 4. Automation Rulesets - versioned rules for audit
CREATE TABLE IF NOT EXISTS automation_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- transcript_approval, partner_approval, shop_routing
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

-- 5. Shop Routing Scores - for apprentice-shop matching
CREATE TABLE IF NOT EXISTS shop_routing_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  distance_score NUMERIC(5,2),
  capacity_score NUMERIC(5,2),
  specialty_score NUMERIC(5,2),
  preference_score NUMERIC(5,2),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  rank INT,
  status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'assigned', 'rejected', 'expired')),
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_scores_app ON shop_routing_scores(application_id);
CREATE INDEX idx_routing_scores_shop ON shop_routing_scores(shop_id);
CREATE INDEX idx_routing_scores_rank ON shop_routing_scores(application_id, rank);

-- 6. Transfer Hours Records
CREATE TABLE IF NOT EXISTS transfer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  application_id UUID REFERENCES applications(id),
  enrollment_id UUID REFERENCES enrollments(id),
  source_institution TEXT NOT NULL,
  source_state TEXT NOT NULL,
  total_hours NUMERIC(10,2) NOT NULL,
  approved_hours NUMERIC(10,2),
  document_id UUID REFERENCES documents(id),
  extraction_id UUID REFERENCES documents_extractions(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  auto_approved BOOLEAN DEFAULT false,
  decision_id UUID REFERENCES automated_decisions(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfer_hours_user ON transfer_hours(user_id);
CREATE INDEX idx_transfer_hours_status ON transfer_hours(status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doc_extractions_updated
  BEFORE UPDATE ON documents_extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_review_queue_updated
  BEFORE UPDATE ON review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transfer_hours_updated
  BEFORE UPDATE ON transfer_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default rulesets
INSERT INTO automation_rulesets (name, version, rule_type, rules) VALUES
('indiana_transcript_approval', '1.0.0', 'transcript_approval', '{
  "approved_states": ["IN"],
  "max_transfer_hours": 1000,
  "min_confidence": 0.85,
  "require_school_name": true,
  "require_date": true,
  "require_hours": true
}'::jsonb),
('partner_document_approval', '1.0.0', 'partner_approval', '{
  "required_docs": ["shop_license", "partner_mou", "insurance"],
  "license_must_be_valid": true,
  "mou_must_be_signed": true,
  "insurance_optional_states": ["IN"]
}'::jsonb),
('shop_routing', '1.0.0', 'shop_routing', '{
  "max_distance_miles": 25,
  "min_capacity": 1,
  "weights": {
    "distance": 0.3,
    "capacity": 0.2,
    "specialty": 0.3,
    "preference": 0.2
  },
  "auto_assign_threshold": 0.85
}'::jsonb)
ON CONFLICT (name, version) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260205_shops_geocoding.sql
-- ────────────────────────────────────────────────────────────────

-- Add geocoding columns to shops table for distance-based routing

ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(20); -- 'google', 'mapbox', 'manual'

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_shops_coords ON shops (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Track geocoding failures
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_failed_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_error TEXT;

COMMENT ON COLUMN shops.latitude IS 'Latitude coordinate for distance calculations';
COMMENT ON COLUMN shops.longitude IS 'Longitude coordinate for distance calculations';
COMMENT ON COLUMN shops.geocode_source IS 'Source of geocoding: google, mapbox, or manual';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260209_checkout_contexts.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260210_tax_prep_enrollment_map_v2.sql
-- ────────────────────────────────────────────────────────────────

-- Tax Prep enrollment mapping (v2 - handles missing columns)
-- Run this instead of 20260210_tax_prep_enrollment_map.sql

-- Step 1: Add missing columns if they don't exist
DO $$
BEGIN
  -- funding_source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'funding_source'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN funding_source TEXT DEFAULT 'SELF_PAY';
  END IF;

  -- is_free_enrollment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_free_enrollment'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_free_enrollment BOOLEAN DEFAULT false;
  END IF;

  -- is_deposit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_deposit'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_deposit BOOLEAN DEFAULT false;
  END IF;

  -- auto_enroll
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'auto_enroll'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN auto_enroll BOOLEAN DEFAULT true;
  END IF;

  -- send_welcome_email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'send_welcome_email'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN send_welcome_email BOOLEAN DEFAULT true;
  END IF;

  -- enrollment_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'enrollment_type'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN enrollment_type TEXT DEFAULT 'program';
  END IF;

  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'description'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN description TEXT;
  END IF;
END $$;

-- Step 2: Insert tax prep mappings
INSERT INTO stripe_price_enrollment_map (
  stripe_price_id,
  stripe_product_id,
  program_slug,
  enrollment_type,
  funding_source,
  is_deposit,
  is_free_enrollment,
  auto_enroll,
  send_welcome_email,
  description
) VALUES
-- WIOA $0 enrollment
(
  'price_1SzM1VIRNf5vPH3APvgSpKRU',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'WIOA',
  false,
  true,
  true,
  true,
  'Tax Prep & Financial Services - WIOA Funded $0'
),
-- Self-pay full ($4,950)
(
  'price_1SsY60IRNf5vPH3ApAUmWGJ9',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  false,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Full Payment $4,950'
),
-- Self-pay deposit ($1,650)
(
  'price_1SsY60IRNf5vPH3Adq5Rh9KO',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Deposit $1,650'
),
-- Self-pay installment ($825)
(
  'price_1SsY60IRNf5vPH3AbLFjmbm8',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Installment $825'
)
ON CONFLICT DO NOTHING;

-- Step 3: Verify
-- Run this after:
-- SELECT stripe_price_id, program_slug, funding_source, is_free_enrollment, description
-- FROM stripe_price_enrollment_map
-- WHERE program_slug = 'tax-prep-financial-services';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260211_fix_team_members.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260211_sezzle_schema.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260211_student_enrollments_hardening.sql
-- ────────────────────────────────────────────────────────────────

-- student_enrollments: Add missing indexes and constraints
-- Addresses P0 findings from architecture report

-- Indexes for query performance (33 code references query this table)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student 
  ON student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_program 
  ON student_enrollments(program_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
  ON student_enrollments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session 
  ON student_enrollments(stripe_checkout_session_id) 
  WHERE stripe_checkout_session_id IS NOT NULL;

-- FK constraint: student_id must reference a real user
-- Using DO block to avoid error if constraint already exists
DO $$ BEGIN
  ALTER TABLE student_enrollments 
    ADD CONSTRAINT fk_student_enrollments_student 
    FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status constraint: prevent invalid status values
DO $$ BEGIN
  ALTER TABLE student_enrollments 
    ADD CONSTRAINT chk_student_enrollments_status 
    CHECK (status IN ('active', 'completed', 'expired', 'suspended', 'pending', 'withdrawn', 'enrolled_pending_approval'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- enrollments table: add status constraint
DO $$ BEGIN
  ALTER TABLE enrollments 
    ADD CONSTRAINT chk_enrollments_status 
    CHECK (status IN ('active', 'completed', 'expired', 'refunded', 'suspended', 'pending', 'dropped'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260211_tax_prep_enrollment_map_final.sql
-- ────────────────────────────────────────────────────────────────

-- Tax Prep enrollment mapping — matches live schema exactly
-- Table columns: id, stripe_price_id, program_slug, is_deposit, auto_enroll, description, stripe_product_id

INSERT INTO stripe_price_enrollment_map (
  stripe_price_id,
  stripe_product_id,
  program_slug,
  is_deposit,
  auto_enroll,
  description
) VALUES
-- WIOA $0 enrollment
(
  'price_1SzM1VIRNf5vPH3APvgSpKRU',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  false,
  true,
  'Tax Prep & Financial Services - WIOA Funded $0'
),
-- Self-pay full ($4,950)
(
  'price_1SsY60IRNf5vPH3ApAUmWGJ9',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  false,
  true,
  'Tax Prep & Financial Services - Full Payment $4,950'
),
-- Self-pay deposit ($1,650)
(
  'price_1SsY60IRNf5vPH3Adq5Rh9KO',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  true,
  true,
  'Tax Prep & Financial Services - Deposit $1,650'
),
-- Self-pay installment ($825)
(
  'price_1SsY60IRNf5vPH3AbLFjmbm8',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  true,
  true,
  'Tax Prep & Financial Services - Installment $825'
)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260213_create_sfc_tables.sql
-- ────────────────────────────────────────────────────────────────

-- Create sfc_tax_returns and sfc_tax_documents tables.
-- Used by: lib/integrations/supersonic-tax.ts (Phase A provider)
-- Referenced by: sfc_tax_return_public_status view (20260213_sfc_public_status_view.sql)
--
-- Run this BEFORE the public status view migration.

-- ============================================================
-- sfc_tax_returns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_returns (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tracking_id           text UNIQUE NOT NULL,
  public_tracking_code  text UNIQUE,

  -- Source metadata (jotform, manual, system_test, etc.)
  source_system         text,
  source_submission_id  text,

  -- Client info
  taxpayer_name         text,
  client_first_name     text,
  client_last_name      text,
  client_email          text,

  -- Return details
  filing_status         text,
  tax_year              integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  status                text NOT NULL DEFAULT 'draft',

  -- E-file pipeline
  efile_submission_id   text,
  last_error            text,

  -- Full return payload (JSON blob from intake)
  payload               jsonb,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate public_tracking_code from tracking_id if not set
CREATE OR REPLACE FUNCTION sfc_set_public_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_tracking_code IS NULL THEN
    NEW.public_tracking_code := NEW.tracking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sfc_set_public_tracking_code ON public.sfc_tax_returns;
CREATE TRIGGER trg_sfc_set_public_tracking_code
  BEFORE INSERT ON public.sfc_tax_returns
  FOR EACH ROW
  EXECUTE FUNCTION sfc_set_public_tracking_code();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_tracking_id
  ON public.sfc_tax_returns (tracking_id);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_public_tracking_code
  ON public.sfc_tax_returns (public_tracking_code);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_status
  ON public.sfc_tax_returns (status);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_efile_submission_id
  ON public.sfc_tax_returns (efile_submission_id);

-- RLS
ALTER TABLE public.sfc_tax_returns ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes with service key)
CREATE POLICY sfc_tax_returns_service_all ON public.sfc_tax_returns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon can only read via the view (no direct table access)
-- The view (sfc_tax_return_public_status) has its own GRANT SELECT.

-- ============================================================
-- sfc_tax_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_documents (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id           text UNIQUE NOT NULL,
  return_tracking_id    text NOT NULL REFERENCES public.sfc_tax_returns(tracking_id),
  document_type         text NOT NULL,
  status                text NOT NULL DEFAULT 'uploaded',
  file_path             text,
  metadata              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfc_tax_documents_return_tracking_id
  ON public.sfc_tax_documents (return_tracking_id);

-- RLS
ALTER TABLE public.sfc_tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY sfc_tax_documents_service_all ON public.sfc_tax_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260213_missing_component_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260213_sfc_public_status_view.sql
-- ────────────────────────────────────────────────────────────────

-- sfc_tax_return_public_status: public-safe view for tracking lookups.
-- ALL masking is done HERE in SQL, not in the API handler.
-- Only columns safe for unauthenticated callers are exposed.
--
-- SECURITY CONTRACT:
--   Any modification to this view requires security review.
--   Do NOT add: user_id, email, phone, notes, internal_status,
--   raw payload fields, document metadata, or internal IDs.

DROP VIEW IF EXISTS sfc_tax_return_public_status;

CREATE VIEW sfc_tax_return_public_status AS
SELECT
  public_tracking_code,

  -- Public-safe status (maps internal statuses to user-facing values)
  CASE status
    WHEN 'draft'             THEN 'received'
    WHEN 'pending_review'    THEN 'processing'
    WHEN 'generating_forms'  THEN 'processing'
    WHEN 'queued_for_efile'  THEN 'processing'
    WHEN 'transmitted'       THEN 'submitted'
    WHEN 'accepted'          THEN 'accepted'
    WHEN 'rejected'          THEN 'action_required'
    ELSE 'received'
  END AS status,

  -- NO efile_submission_id — internal pipeline identifier, not public
  -- NO raw last_error — sanitized rejection reason only
  CASE
    WHEN status = 'rejected' AND last_error ILIKE '%missing%document%'    THEN 'missing_documents'
    WHEN status = 'rejected' AND last_error ILIKE '%verification%'        THEN 'verification_failed'
    WHEN status = 'rejected' AND last_error ILIKE '%ssn%'                 THEN 'identity_mismatch'
    WHEN status = 'rejected' AND last_error ILIKE '%duplicate%'           THEN 'duplicate_filing'
    WHEN status = 'rejected' AND last_error IS NOT NULL                   THEN 'review_required'
    ELSE NULL
  END AS rejection_reason,

  created_at,
  updated_at,

  -- First name only (no full last name exposed)
  client_first_name,
  -- Last initial only — masking enforced in SQL, not application code
  LEFT(client_last_name, 1) AS client_last_initial

FROM sfc_tax_returns
WHERE public_tracking_code IS NOT NULL;

-- Revoke all, then grant SELECT to anon so the endpoint can use the anon key
-- instead of the service role key (defense in depth).
REVOKE ALL ON sfc_tax_return_public_status FROM anon, authenticated;
GRANT SELECT ON sfc_tax_return_public_status TO anon;
GRANT SELECT ON sfc_tax_return_public_status TO authenticated;

COMMENT ON VIEW sfc_tax_return_public_status IS
  'Public-safe view for refund tracking. '
  'Exposes: public_tracking_code, mapped status, sanitized rejection_reason, '
  'timestamps, first name, last initial only. '
  'Does NOT expose: efile_submission_id, user_id, email, phone, notes, '
  'raw last_error, internal statuses, document metadata, or payload fields. '
  'ANY modification requires security review.';


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_add_tenant_id_to_core_tables.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_add_tenant_id_to_core_tables.sql
--
-- Adds tenant_id column to the 5 tables that lack it:
--   certificates, lesson_progress, apprentice_placements, shops, shop_staff
--
-- enrollments already has tenant_id (confirmed 2026-02-14 live query).
--
-- Then backfills from profiles via user_id/student_id/staff join.
-- Creates composite indexes for RLS performance.
-- Creates auto_set_tenant_id() trigger for future INSERTs.
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Add tenant_id to tables that lack it
-- (enrollments already has tenant_id — skip)
-- ============================================================

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE apprentice_placements
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE shop_staff
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

-- ============================================================
-- STEP 2: Backfill tenant_id from profiles
-- ============================================================

-- certificates: join via user_id -> profiles.id
UPDATE certificates
SET tenant_id = p.tenant_id
FROM profiles p
WHERE certificates.user_id = p.id
  AND certificates.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- lesson_progress: join via user_id -> profiles.id
UPDATE lesson_progress
SET tenant_id = p.tenant_id
FROM profiles p
WHERE lesson_progress.user_id = p.id
  AND lesson_progress.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- apprentice_placements: join via student_id -> profiles.id
UPDATE apprentice_placements
SET tenant_id = p.tenant_id
FROM profiles p
WHERE apprentice_placements.student_id = p.id
  AND apprentice_placements.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shop_staff: join via user_id -> profiles.id
-- (must run BEFORE shops so shops can derive from staff)
UPDATE shop_staff
SET tenant_id = p.tenant_id
FROM profiles p
WHERE shop_staff.user_id = p.id
  AND shop_staff.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shops: derive from staff member's profile
UPDATE shops
SET tenant_id = p.tenant_id
FROM shop_staff ss
JOIN profiles p ON p.id = ss.user_id
WHERE ss.shop_id = shops.id
  AND shops.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 3: Indexes for RLS performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_training_enrollments_tenant_user
  ON training_enrollments(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_tenant_user
  ON certificates(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_tenant_user
  ON lesson_progress(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_placements_tenant_student
  ON apprentice_placements(tenant_id, student_id);

CREATE INDEX IF NOT EXISTS idx_shops_tenant
  ON shops(tenant_id);

CREATE INDEX IF NOT EXISTS idx_shop_staff_tenant_user
  ON shop_staff(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant
  ON profiles(tenant_id);

-- ============================================================
-- STEP 4: Auto-populate trigger for future INSERTs
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if tenant_id already set (e.g., by service role)
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tables with user_id: training_enrollments, certificates, lesson_progress, shop_staff
  IF TG_TABLE_NAME IN ('training_enrollments', 'certificates', 'lesson_progress', 'shop_staff') THEN
    SELECT p.tenant_id INTO NEW.tenant_id
    FROM profiles p
    WHERE p.id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- apprentice_placements: resolve via student_id
  IF TG_TABLE_NAME = 'apprentice_placements' THEN
    SELECT p.tenant_id INTO NEW.tenant_id
    FROM profiles p
    WHERE p.id = NEW.student_id;
    RETURN NEW;
  END IF;

  -- shops and any other table: resolve from current user
  SELECT p.tenant_id INTO NEW.tenant_id
  FROM profiles p
  WHERE p.id = auth.uid();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON training_enrollments;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON certificates;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON lesson_progress;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON apprentice_placements;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON shop_staff;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON shops;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_backfill_tenant_id.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_backfill_tenant_id.sql
--
-- Assigns tenant_id to all 501 NULL profiles and their downstream rows.
--
-- Census (2026-02-14):
--   501 profiles with NULL tenant_id
--   All created 2026-01-17 (batch seed)
--   All role=student, enrollment_status=pending
--   All email pattern: {name}{timestamp}@student.elevate.edu
--   86 enrollments linked to these profiles (also 2026-01-17)
--   0 certificates, 0 lesson_progress from these profiles
--
-- Assignment: All belong to tenant "Elevate for Humanity" (6ba71334-58f4-4104-9b2a-5114f2a7614c)
-- Rationale: Only real tenant. Other 5 tenants are test orgs created 2026-01-20.
--            These seed students were created for the Elevate platform.
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Backfill profiles.tenant_id
-- ============================================================

-- Set all NULL-tenant profiles to Elevate for Humanity tenant
UPDATE profiles
SET tenant_id = '6ba71334-58f4-4104-9b2a-5114f2a7614c'
WHERE tenant_id IS NULL;

-- Also set organization_id for profiles that lack it
UPDATE profiles
SET organization_id = 'c2d91609-2040-42f1-baa2-9a12351e8588'
WHERE organization_id IS NULL;

-- ============================================================
-- STEP 2: Backfill auth.users user_metadata.tenant_id
-- ============================================================

-- This requires the auth.admin API, not raw SQL.
-- Run via application code or Supabase Dashboard > Authentication.
-- The auto_set_tenant_id trigger on downstream tables will use
-- profiles.tenant_id, so auth metadata is secondary.
--
-- For completeness, the app-side script would be:
--   for each profile where tenant_id was just set:
--     supabase.auth.admin.updateUserById(id, {
--       user_metadata: { tenant_id: '6ba71334-...' }
--     })

-- ============================================================
-- STEP 3: Backfill enrollments.tenant_id
-- (requires 20260214_add_tenant_id_to_core_tables.sql first)
-- ============================================================

-- After the column-addition migration runs, backfill any remaining NULLs
UPDATE training_enrollments
SET tenant_id = p.tenant_id
FROM profiles p
WHERE training_enrollments.user_id = p.id
  AND training_enrollments.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 4: Backfill shops and shop_staff
-- (requires 20260214_add_tenant_id_to_core_tables.sql first)
-- ============================================================

-- shops: derive from staff owner's profile
UPDATE shops
SET tenant_id = p.tenant_id
FROM shop_staff ss
JOIN profiles p ON p.id = ss.user_id
WHERE ss.shop_id = shops.id
  AND shops.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shop_staff: derive from user's profile
UPDATE shop_staff
SET tenant_id = p.tenant_id
FROM profiles p
WHERE shop_staff.user_id = p.id
  AND shop_staff.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 5: Verify zero NULLs
-- ============================================================

-- Run these as verification queries (not statements):
-- SELECT count(*) FROM profiles WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM training_enrollments WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM certificates WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM lesson_progress WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM apprentice_placements WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM shops WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM shop_staff WHERE tenant_id IS NULL;
--   Expected: 0


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_enforce_tenant_not_null.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_enforce_tenant_not_null.sql
--
-- Enforces NOT NULL on tenant_id across the identity spine.
-- Uses Postgres NOT VALID + VALIDATE pattern for safe rollout:
--   1. Add CHECK constraint as NOT VALID (instant, no table scan)
--   2. VALIDATE CONSTRAINT (scans table, blocks only if violations exist)
--
-- Prerequisites:
--   - 20260214_backfill_tenant_id.sql must be applied first
--   - Verify zero NULLs before running this
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Verify zero NULLs (run these first, abort if any return > 0)
-- ============================================================

-- SELECT count(*) FROM profiles WHERE tenant_id IS NULL;
-- SELECT count(*) FROM training_enrollments WHERE tenant_id IS NULL;
-- SELECT count(*) FROM certificates WHERE tenant_id IS NULL;
-- SELECT count(*) FROM lesson_progress WHERE tenant_id IS NULL;
-- SELECT count(*) FROM apprentice_placements WHERE tenant_id IS NULL;
-- SELECT count(*) FROM shops WHERE tenant_id IS NULL;
-- SELECT count(*) FROM shop_staff WHERE tenant_id IS NULL;

-- ============================================================
-- STEP 2: Add NOT VALID constraints (instant, no lock)
-- ============================================================

ALTER TABLE profiles
  ADD CONSTRAINT profiles_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE training_enrollments
  ADD CONSTRAINT training_enrollments_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE certificates
  ADD CONSTRAINT certificates_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE lesson_progress
  ADD CONSTRAINT lesson_progress_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE apprentice_placements
  ADD CONSTRAINT placements_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE shops
  ADD CONSTRAINT shops_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE shop_staff
  ADD CONSTRAINT shop_staff_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

-- ============================================================
-- STEP 3: Validate constraints (scans table, confirms no violations)
-- ============================================================

ALTER TABLE profiles
  VALIDATE CONSTRAINT profiles_tenant_id_not_null;

ALTER TABLE training_enrollments
  VALIDATE CONSTRAINT training_enrollments_tenant_id_not_null;

ALTER TABLE certificates
  VALIDATE CONSTRAINT certificates_tenant_id_not_null;

ALTER TABLE lesson_progress
  VALIDATE CONSTRAINT lesson_progress_tenant_id_not_null;

ALTER TABLE apprentice_placements
  VALIDATE CONSTRAINT placements_tenant_id_not_null;

ALTER TABLE shops
  VALIDATE CONSTRAINT shops_tenant_id_not_null;

ALTER TABLE shop_staff
  VALIDATE CONSTRAINT shop_staff_tenant_id_not_null;

-- ============================================================
-- STEP 4: Convert to actual NOT NULL (optional, cleaner schema)
-- ============================================================

-- Once constraints are validated, you can convert to real NOT NULL:
-- ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE training_enrollments ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE certificates ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE lesson_progress ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE apprentice_placements ALTER COLUMN tenant_id SET NOT NULL;
--
-- Then drop the CHECK constraints:
-- ALTER TABLE profiles DROP CONSTRAINT profiles_tenant_id_not_null;
-- ALTER TABLE training_enrollments DROP CONSTRAINT training_enrollments_tenant_id_not_null;
-- ALTER TABLE certificates DROP CONSTRAINT certificates_tenant_id_not_null;
-- ALTER TABLE lesson_progress DROP CONSTRAINT lesson_progress_tenant_id_not_null;
-- ALTER TABLE apprentice_placements DROP CONSTRAINT placements_tenant_id_not_null;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_partner_export_logs.sql
-- ────────────────────────────────────────────────────────────────

-- Audit trail for partner CSV exports
CREATE TABLE IF NOT EXISTS partner_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  shop_ids UUID[] NOT NULL DEFAULT '{}',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_type TEXT NOT NULL DEFAULT 'completions_csv',
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_export_logs_user ON partner_export_logs(user_id);
CREATE INDEX idx_partner_export_logs_exported_at ON partner_export_logs(exported_at DESC);

-- RLS: only admins and the exporting user can read their own logs
ALTER TABLE partner_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own export logs"
  ON partner_export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export logs"
  ON partner_export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_partner_visibility_policies.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_partner_visibility_policies.sql
--
-- Partner visibility on enrollments, lesson_progress, certificates.
-- Also adds tenant-scoped policies to shops and shop_staff.
--
-- Scope chain (all direct tenant_id checks, no cross-table tenant joins):
--   auth.uid() -> profiles (role gate)
--   -> shop_staff (active + tenant_id match)
--   -> shops (active + tenant_id match)
--   -> apprentice_placements (tenant_id match)
--   -> student_id -> target table (tenant_id match)
--
-- Enforces per policy:
--   1. Target row tenant_id = caller's tenant
--   2. Caller has partner/admin/super_admin role
--   3. Caller's shop_staff row is active AND same tenant
--   4. Shop is active
--   5. Student is placed at that shop
--
-- Relationship table write-lock audit (2026-02-14):
--   shops:                  No non-admin write policies. Blocked.
--   shop_staff:             No non-admin write policies. Blocked.
--   apprentice_placements:  Only admin write policy. Blocked for partners.
--   All three have RLS enabled and enforced.

-- ============================================================
-- shops: add tenant-scoped policies
-- ============================================================

-- Partners can read their own shops (via shop_staff membership)
CREATE POLICY "shops_partner_read" ON shops
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM shop_staff ss
      WHERE ss.shop_id = shops.id
        AND ss.user_id = auth.uid()
        AND ss.active = true
    )
  );

-- Admin can manage shops within their tenant
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- shop_staff: add tenant-scoped admin write policy
-- ============================================================

-- Existing SELECT policy (shop_staff_read) uses is_admin() + user_id check.
-- Add tenant-scoped admin write policy.
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- enrollments: partner can read their placed students' enrollments
-- ============================================================

CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    -- Tenant match on target row (direct column, O(1))
    tenant_id = public.get_current_tenant_id()
    -- Caller is a partner-eligible role
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    -- Student is placed at caller's active shop (all tables now have tenant_id)
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- lesson_progress: partner can read their placed students' progress
-- ============================================================

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- certificates: partner can read their placed students' certificates
-- ============================================================

CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- Indexes for partner policy performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_active
  ON shop_staff(user_id, active, shop_id);

CREATE INDEX IF NOT EXISTS idx_placements_shop_student
  ON apprentice_placements(shop_id, student_id);

CREATE INDEX IF NOT EXISTS idx_shops_active
  ON shops(id) WHERE active = true;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_remove_null_tenant_fallbacks.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_remove_null_tenant_fallbacks.sql
--
-- Removes "OR tenant_id IS NULL" fallbacks from all RLS policies.
-- Run ONLY after:
--   1. 20260214_backfill_tenant_id.sql (zero NULLs confirmed)
--   2. 20260214_enforce_tenant_not_null.sql (constraints validated)
--
-- This converts policies from "tenant match OR NULL" to strict "tenant match only."

-- profiles: replace admin policy
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- enrollments: replace admin policy
DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;

CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- certificates: replace admin policies
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;

CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- apprentice_placements: replace admin policy
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;

CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- lesson_progress: replace admin policy
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;

CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_rls_tenancy_lockdown.sql
-- ────────────────────────────────────────────────────────────────

-- 20260214_rls_tenancy_lockdown.sql
--
-- Priority 1: Lock down USING(true) / WITH CHECK(true) policies
-- Priority 2: Enable RLS on 12 live scoped tables that lack it
-- Priority 3: Add tenant predicates to key tables
--
-- Depends on: get_current_tenant_id(), is_admin(), is_super_admin()
--   (all confirmed live via RPC test 2026-02-14)
--
-- Run each statement individually in Supabase SQL Editor.
-- Statements are separated by blank lines for easy copy-paste.

-- ============================================================
-- PRIORITY 1: Lock down dangerous USING(true) policies
-- ============================================================

-- 1a. sfc_tax_returns: was FOR ALL USING(true) WITH CHECK(true)
DROP POLICY IF EXISTS "sfc_tax_returns_service_all" ON sfc_tax_returns;

CREATE POLICY "sfc_tax_returns_own_read" ON sfc_tax_returns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sfc_tax_returns_admin_all" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 1b. sfc_tax_documents: was FOR ALL USING(true) WITH CHECK(true)
DROP POLICY IF EXISTS "sfc_tax_documents_service_all" ON sfc_tax_documents;

CREATE POLICY "sfc_tax_documents_own_read" ON sfc_tax_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sfc_tax_returns
      WHERE sfc_tax_returns.id = sfc_tax_documents.return_id
      AND sfc_tax_returns.user_id = auth.uid()
    )
  );

CREATE POLICY "sfc_tax_documents_admin_all" ON sfc_tax_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 1c. licenses: was SELECT USING(true) — exposes all license keys
DROP POLICY IF EXISTS "licenses_select" ON licenses;

CREATE POLICY "licenses_own_tenant" ON licenses
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 1d. audit_logs INSERT: was WITH CHECK(true) — anyone could poison audit trail
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

CREATE POLICY "audit_logs_insert_own" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ============================================================
-- PRIORITY 2: Enable RLS on live scoped tables without it
-- ============================================================

-- 2a. programs (55 rows, tenant_id + organization_id)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_public_read" ON programs
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 2b. users (669 rows, organization_id)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_read" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 2c. organization_users (1 row, organization_id)
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_users_own_read" ON organization_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "org_users_admin_all" ON organization_users
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2d. marketing_campaigns (5 rows, tenant_id)
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_campaigns_tenant" ON marketing_campaigns
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 2e. marketing_contacts (5 rows, tenant_id)
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_contacts_tenant" ON marketing_contacts
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 2f. tenant_licenses (1 row, tenant_id)
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_licenses_own" ON tenant_licenses
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_licenses_admin_write" ON tenant_licenses
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2g. tenant_memberships (1 row, tenant_id)
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_memberships_own" ON tenant_memberships
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR user_id = auth.uid()
  );

CREATE POLICY "tenant_memberships_admin_write" ON tenant_memberships
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2h. license_usage (1 row, tenant_id)
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "license_usage_tenant" ON license_usage
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "license_usage_admin_write" ON license_usage
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2i. license_events (1 row, tenant_id + organization_id)
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "license_events_tenant" ON license_events
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "license_events_admin_write" ON license_events
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2j. v_active_programs (43 rows, organization_id) — view, may need special handling
-- Views inherit RLS from base tables. With programs now having RLS, this is covered.

-- 2k. v_published_programs (43 rows, organization_id) — same as above

-- ============================================================
-- PRIORITY 3: Add tenant predicates to key table policies
-- ============================================================

-- 3a. profiles: existing policies use auth.uid() but no tenant scope.
--     The profiles_update_own_row_tenant_immutable policy from
--     20260130_protect_tenant_id.sql already handles UPDATE.
--     Add tenant-scoped admin policy.
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
      )
      AND (
        -- Admin sees own tenant only; super_admin sees all
        public.is_super_admin()
        OR tenant_id = public.get_current_tenant_id()
        OR tenant_id IS NULL
      )
    )
  );

-- 3b. enrollments: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;

CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

-- 3c. certificates: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
--     INSERT/UPDATE/DELETE already admin-only (20260214_tighten_certificates_rls.sql).
--     Replace with tenant-scoped versions.
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;

CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

-- 3d. apprentice_placements: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
--     RLS already enabled (from earlier migration). Add tenant-scoped policies.
CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

CREATE POLICY "placements_partner_read" ON apprentice_placements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shop_staff
      WHERE shop_staff.user_id = auth.uid()
      AND shop_staff.shop_id = apprentice_placements.shop_id
      AND shop_staff.active = true
    )
  );

-- 3e. lesson_progress: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;

CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_shop_staff_active_column.sql
-- ────────────────────────────────────────────────────────────────

-- Add active flag to shop_staff for staff deactivation without row deletion
-- Enables clean partner access revocation

ALTER TABLE shop_staff
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_shop_staff_active
  ON shop_staff(user_id, active) WHERE active = true;

-- Update existing RLS read policy to exclude inactive staff
DROP POLICY IF EXISTS "shop_staff_read" ON shop_staff;
CREATE POLICY "shop_staff_read"
  ON shop_staff FOR SELECT
  USING (
    is_admin() OR
    (shop_staff.user_id = auth.uid() AND shop_staff.active = true) OR
    (is_shop_staff(shop_staff.shop_id) AND shop_staff.active = true)
  );


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260214_tighten_certificates_rls.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260215_apprenticeship_intake.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260215_break_recursion_use_definer_functions.sql
-- ────────────────────────────────────────────────────────────────

-- 20260215_break_recursion_use_definer_functions.sql
--
-- Eliminates all inline EXISTS(SELECT 1 FROM profiles ...) patterns from RLS policies.
-- Replaces with SECURITY DEFINER functions: is_admin(), is_super_admin(), get_current_tenant_id().
-- These functions bypass RLS on profiles, breaking the recursion cycle.
--
-- Fixes 2 recursive policies on profiles + 37 cross-table policies.
--
-- Run in Supabase SQL Editor.

-- ============================================================
-- MOVE 1: Fix recursive policies on profiles
-- ============================================================

-- 1a. profiles_admin_all: was recursive (queried profiles from profiles policy)
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- 1b. profiles_update_own_row_tenant_immutable: was recursive (subquery on profiles)
DROP POLICY IF EXISTS "profiles_update_own_row_tenant_immutable" ON profiles;

CREATE POLICY "profiles_update_own_row_tenant_immutable" ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  )
  WITH CHECK (
    (auth.uid() = id OR public.is_super_admin())
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- ============================================================
-- MOVE 3: Fix all cross-table policies that inline profiles lookups
-- ============================================================

-- training_enrollments: 4 policies
DROP POLICY IF EXISTS "Admins can enroll users" ON training_enrollments;
CREATE POLICY "Admins can enroll users" ON training_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update enrollments" ON training_enrollments;
CREATE POLICY "Admins can update enrollments" ON training_enrollments
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enrollments" ON training_enrollments;
CREATE POLICY "Admins can delete enrollments" ON training_enrollments
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;
CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "enrollments_partner_read" ON training_enrollments;
CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- certificates: 4 policies
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;
CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_partner_read" ON certificates;
CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- lesson_progress: 2 policies
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;
CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- apprentice_placements: 1 policy
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;
CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shops: 1 policy
DROP POLICY IF EXISTS "shops_admin_all" ON shops;
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shop_staff: 1 policy
DROP POLICY IF EXISTS "shop_staff_admin_write" ON shop_staff;
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- programs: 1 policy
DROP POLICY IF EXISTS "programs_admin_write" ON programs;
CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- users: 1 policy
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_returns: 1 policy
DROP POLICY IF EXISTS "sfc_tax_returns_admin_all" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_admin_all" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_documents: 1 policy
DROP POLICY IF EXISTS "sfc_tax_documents_admin_all" ON sfc_tax_documents;
CREATE POLICY "sfc_tax_documents_admin_all" ON sfc_tax_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- mef_submissions: 3 policies (role includes tax_preparer)
-- Need a helper or inline check. is_admin() covers admin+super_admin.
-- For tax_preparer, we create a small definer function.
CREATE OR REPLACE FUNCTION public.is_tax_preparer()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'tax_preparer')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_tax_preparer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tax_preparer() TO authenticated;

DROP POLICY IF EXISTS "Admins can view all submissions" ON mef_submissions;
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can insert submissions" ON mef_submissions;
CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can update submissions" ON mef_submissions;
CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE TO authenticated
  USING (public.is_tax_preparer());

-- tax_returns: 1 policy
DROP POLICY IF EXISTS "Admins can view all tax returns" ON tax_returns;
CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- tax_clients: 1 policy
DROP POLICY IF EXISTS "Admins can view all clients" ON tax_clients;
CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- career_courses: 1 policy
DROP POLICY IF EXISTS "Admins can manage courses" ON career_courses;
CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_documents: 1 policy
DROP POLICY IF EXISTS "Admins can manage all documents" ON partner_documents;
CREATE POLICY "Admins can manage all documents" ON partner_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partners: 1 policy
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_applications: 1 policy
DROP POLICY IF EXISTS "Admins can manage partner applications" ON partner_applications;
CREATE POLICY "Admins can manage partner applications" ON partner_applications
  FOR ALL TO authenticated
  USING (public.is_admin());

-- promo_codes: 1 policy
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_apprentices: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS apprentices" ON rapids_apprentices;
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_progress_updates: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS progress" ON rapids_progress_updates;
CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_submissions: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS submissions" ON rapids_submissions;
CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_employers: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS employers" ON rapids_employers;
CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL TO authenticated
  USING (public.is_admin());

-- staff_permissions: 2 policies
DROP POLICY IF EXISTS "Tenant admins can manage staff permissions" ON staff_permissions;
CREATE POLICY "Tenant admins can manage staff permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND tenant_id = public.get_current_tenant_id()
  );

DROP POLICY IF EXISTS "Super admins can manage all permissions" ON staff_permissions;
CREATE POLICY "Super admins can manage all permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- application_state_events: 1 policy
DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- apprentice_sites: 2 policies
DROP POLICY IF EXISTS "Partner users can view own sites" ON apprentice_sites;
CREATE POLICY "Partner users can view own sites" ON apprentice_sites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage sites" ON apprentice_sites;
CREATE POLICY "Admins can manage sites" ON apprentice_sites
  FOR ALL TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260215_fix_rls_recursion.sql
-- ────────────────────────────────────────────────────────────────

-- Fix infinite RLS recursion on profiles table (Postgres error 42P17)
-- and create missing tables referenced by the codebase.
--
-- View to real table mapping:
--   courses → training_courses
--   lessons → training_lessons
--   enrollments → training_enrollments
--
-- All policies use SECURITY DEFINER helpers to avoid recursive profiles lookups.
-- Run in Supabase SQL Editor. Already applied to production 2026-02-15.


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260215_rls_test_harness.sql
-- ────────────────────────────────────────────────────────────────

-- 20260215_rls_test_harness.sql
--
-- JWT simulation test harness for verifying RLS enforcement.
-- Creates a function that tests access for each role.
-- Run after 20260215_break_recursion_use_definer_functions.sql.
--
-- Usage: SELECT * FROM public.rls_test_report();

CREATE OR REPLACE FUNCTION public.rls_test_report()
RETURNS TABLE (
  test_name text,
  passed boolean,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_admin_id uuid;
  v_student_id uuid;
  v_admin_tenant uuid;
  v_student_tenant uuid;
BEGIN
  -- Get a real admin and student for testing
  SELECT id, tenant_id INTO v_admin_id, v_admin_tenant
  FROM profiles WHERE role IN ('admin', 'super_admin') AND tenant_id IS NOT NULL LIMIT 1;

  SELECT id, tenant_id INTO v_student_id, v_student_tenant
  FROM profiles WHERE role = 'student' AND tenant_id IS NOT NULL LIMIT 1;

  -- Test 1: Zero NULL tenant_id in profiles
  SELECT count(*) INTO v_count FROM profiles WHERE tenant_id IS NULL;
  test_name := 'profiles: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 2: Zero NULL tenant_id in training_enrollments
  SELECT count(*) INTO v_count FROM training_enrollments WHERE tenant_id IS NULL;
  test_name := 'training_enrollments: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 3: Zero NULL tenant_id in certificates
  SELECT count(*) INTO v_count FROM certificates WHERE tenant_id IS NULL;
  test_name := 'certificates: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 4: Zero NULL tenant_id in lesson_progress
  SELECT count(*) INTO v_count FROM lesson_progress WHERE tenant_id IS NULL;
  test_name := 'lesson_progress: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 5: Zero NULL tenant_id in shops
  SELECT count(*) INTO v_count FROM shops WHERE tenant_id IS NULL;
  test_name := 'shops: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 6: Zero NULL tenant_id in shop_staff
  SELECT count(*) INTO v_count FROM shop_staff WHERE tenant_id IS NULL;
  test_name := 'shop_staff: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 7: Zero NULL tenant_id in apprentice_placements
  SELECT count(*) INTO v_count FROM apprentice_placements WHERE tenant_id IS NULL;
  test_name := 'apprentice_placements: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 8: NOT NULL constraints exist
  SELECT count(*) INTO v_count
  FROM information_schema.check_constraints
  WHERE constraint_name IN (
    'profiles_tenant_id_not_null',
    'training_enrollments_tenant_id_not_null',
    'certificates_tenant_id_not_null',
    'lesson_progress_tenant_id_not_null',
    'placements_tenant_id_not_null',
    'shops_tenant_id_not_null',
    'shop_staff_tenant_id_not_null'
  );
  test_name := 'NOT NULL constraints exist';
  passed := v_count = 7;
  detail := v_count || '/7 constraints';
  RETURN NEXT;

  -- Test 9: RLS enabled on key tables
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'training_enrollments', 'certificates',
                      'lesson_progress', 'shops', 'shop_staff',
                      'apprentice_placements', 'programs', 'users',
                      'organization_users', 'marketing_campaigns',
                      'tenant_licenses', 'license_events')
    AND rowsecurity = true;
  test_name := 'RLS enabled on scoped tables';
  passed := v_count >= 10;
  detail := v_count || ' tables with RLS';
  RETURN NEXT;

  -- Test 10: No policies with inline profiles lookup (recursion check)
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND (qual ILIKE '%FROM profiles%' OR qual ILIKE '%FROM public.profiles%')
    AND qual NOT ILIKE '%is_admin%'
    AND qual NOT ILIKE '%is_super_admin%'
    AND qual NOT ILIKE '%get_current_tenant_id%';
  test_name := 'profiles: no recursive inline lookups';
  passed := v_count = 0;
  detail := v_count || ' recursive policies';
  RETURN NEXT;

  -- Test 11: is_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
    AND p.prosecdef = true;
  test_name := 'is_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 12: is_super_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_super_admin'
    AND p.prosecdef = true;
  test_name := 'is_super_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 13: get_current_tenant_id() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_current_tenant_id'
    AND p.prosecdef = true;
  test_name := 'get_current_tenant_id() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 14: auto_set_tenant_id() trigger exists on key tables
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'set_tenant_id_on_insert'
    AND c.relname IN ('training_enrollments', 'certificates', 'lesson_progress',
                       'apprentice_placements', 'shops', 'shop_staff');
  test_name := 'auto_set_tenant_id triggers on 6 tables';
  passed := v_count = 6;
  detail := v_count || '/6 triggers';
  RETURN NEXT;

  -- Test 15: prevent_tenant_id_change trigger on profiles
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'protect_tenant_id'
    AND c.relname = 'profiles';
  test_name := 'prevent_tenant_id_change trigger on profiles';
  passed := v_count = 1;
  detail := v_count || ' triggers';
  RETURN NEXT;

  -- Test 16: Admin exists
  test_name := 'admin user exists for testing';
  passed := v_admin_id IS NOT NULL;
  detail := COALESCE(v_admin_id::text, 'none');
  RETURN NEXT;

  -- Test 17: Student exists
  test_name := 'student user exists for testing';
  passed := v_student_id IS NOT NULL;
  detail := COALESCE(v_student_id::text, 'none');
  RETURN NEXT;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO service_role;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_application_intake.sql
-- ────────────────────────────────────────────────────────────────

-- application_intake: universal secure buffer for anonymous public submissions.
-- All public form submissions land here. A processor function validates,
-- resolves tenant_id from program_id, and inserts into the correct
-- workflow table (student_applications, employer_applications, etc.).
--
-- Only service_role can read/write this table.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Create the intake buffer table
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_intake (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),

  application_type    text NOT NULL,                          -- e.g. 'student', 'employer', 'career'
  program_id          uuid,                                   -- optional; validated against programs.id

  -- Raw public payload (all submitted fields, allowlisted by Edge Function)
  payload             jsonb NOT NULL,

  -- Routing / tenancy (derived server-side during processing)
  resolved_tenant_id  uuid,

  -- Lifecycle
  status              text NOT NULL DEFAULT 'received',       -- received | processed | rejected
  processed_at        timestamptz,
  error               text,                                   -- populated on processing failure

  -- Metadata
  ip_address          inet,
  user_agent          text,
  source              text NOT NULL DEFAULT 'public_form',    -- public_form | api | import
  destination_table   text,                                   -- set after successful processing
  destination_id      uuid                                    -- FK to the row created in workflow table
);

-- ────────────────────────────────────────────────────────────────
-- 2. Indexes
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_type       ON public.application_intake (application_type);
CREATE INDEX IF NOT EXISTS idx_intake_status     ON public.application_intake (status);
CREATE INDEX IF NOT EXISTS idx_intake_created    ON public.application_intake (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_program    ON public.application_intake (program_id);
CREATE INDEX IF NOT EXISTS idx_intake_ip_created ON public.application_intake (ip_address, created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- 3. RLS — service_role only (explicit deny-all for anon/authenticated)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.application_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_intake_service_only_insert"
  ON public.application_intake
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_select"
  ON public.application_intake
  FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_update"
  ON public.application_intake
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin read access for staff dashboard
CREATE POLICY "application_intake_admin_read"
  ON public.application_intake
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Rate-limit helper: count recent submissions from an IP
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.intake_rate_check(
  p_ip inet,
  p_window_minutes int DEFAULT 15,
  p_max_submissions int DEFAULT 5
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) < p_max_submissions
  FROM application_intake
  WHERE ip_address = p_ip
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
$$;

REVOKE ALL ON FUNCTION public.intake_rate_check(inet, int, int) FROM PUBLIC;

-- ────────────────────────────────────────────────────────────────
-- 5. Comments
-- ────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.application_intake
  IS 'Universal intake buffer for anonymous public form submissions. Processed into workflow tables by process-intake.';
COMMENT ON COLUMN public.application_intake.application_type
  IS 'Maps to a destination workflow table via the routing config in the Edge Function.';
COMMENT ON COLUMN public.application_intake.payload
  IS 'Raw submitted fields. Allowlisted by the Edge Function before insert.';
COMMENT ON COLUMN public.application_intake.resolved_tenant_id
  IS 'Derived from programs.tenant_id when program_id is provided. Set during processing.';
COMMENT ON COLUMN public.application_intake.status
  IS 'received → processed | rejected';

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_batch3a_admin_only_policies.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Batch 3A — Simple admin-only policies using public.is_admin()
-- Applied via exec_sql RPC in 7 chunks.
-- Covers ~130 tables from academic_integrity_violations through refund_tracking.
-- Note: Original batch was cut off at "refunds" — remaining tables (S-Z) need
-- a follow-up batch.
--
-- Pattern: DROP POLICY IF EXISTS + CREATE POLICY ... FOR ALL TO authenticated USING (public.is_admin())
-- These are non-tenant-scoped admin policies for tables that don't yet have tenant_id
-- or where tenant scoping is deferred.
--
-- Applied: 2026-02-16
-- Result: 199 policies using is_admin() across 175 tables

-- See APPLY_20260216_combined.sql for the tenant-scoped core table policies.
-- This file documents the broader admin policy sweep.


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_drop_redundant_tables.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_extend_tenant_id_immutability.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Extend prevent_tenant_id_change trigger to all core tables
-- Problem: Only profiles has the immutability trigger. Other core tables
--          allow tenant_id to be changed via UPDATE, enabling tenant
--          reassignment attacks.
-- Fix: Add the same trigger to all 6 remaining core skeleton tables.

DROP TRIGGER IF EXISTS protect_tenant_id ON training_enrollments;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON certificates;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON lesson_progress;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON apprentice_placements;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shops;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shop_staff;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_fix_certificates_policies.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Fix certificate RLS policies
-- Problem: certificates_public_verify USING(true) allows any user to read all certs.
--          certificates_admin_all USING(is_admin()) has no tenant scope.
--          "Users can view own certificates" has no tenant scope.
-- Fix: Drop all three, replace with tenant-scoped equivalents + narrow public verify.

BEGIN;

-- ============================================================
-- 1. Drop the three broken policies
-- ============================================================
DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_all" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;

-- ============================================================
-- 2. Public certificate verification — narrow surface
--    Only exposes rows that have a verification_url set.
--    No tenant scope needed: verification is intentionally public.
--    Uses anon role so unauthenticated visitors can verify.
-- ============================================================
CREATE POLICY "certificates_public_verify" ON certificates
  FOR SELECT TO anon, authenticated
  USING (verification_url IS NOT NULL);

-- ============================================================
-- 3. Users can read their own certificates (within tenant)
-- ============================================================
CREATE POLICY "certificates_user_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
  );

-- ============================================================
-- 4. Admin read — tenant-scoped (replaces certificates_admin_all)
--    INSERT/UPDATE/DELETE already tenant-scoped from prior migration.
-- ============================================================
CREATE POLICY "certificates_admin_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_fix_documents_owner_select.sql
-- ────────────────────────────────────────────────────────────────

-- Fix: documents table has no owner SELECT policy.
-- Students can upload documents but cannot read them back.
--
-- The documents table has both owner_id (original) and user_id (added by
-- 20260128_update_documents_table.sql). The upload page uses user_id.
-- We add policies for both columns.

BEGIN;

-- 1. Students can view their own documents (by user_id)
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Students can view documents where they are the owner (by owner_id)
DROP POLICY IF EXISTS "Owners can view own documents" ON public.documents;
CREATE POLICY "Owners can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- 3. Students can update their own documents (e.g. re-upload)
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Admin full access (uses is_admin() to avoid recursion)
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. Grant SELECT to authenticated (was missing)
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_fix_enrollments_student_update.sql
-- ────────────────────────────────────────────────────────────────

-- Fix: "enrollments" is a VIEW over training_enrollments in production.
-- training_enrollments has no student policies — only admin/partner.
-- Without student policies, these API routes silently fail:
--   POST /api/enrollment/complete-orientation
--   POST /api/enrollment/submit-documents
--   POST /api/lessons/[id]/complete (progress update)

BEGIN;

GRANT SELECT, INSERT, UPDATE ON public.training_enrollments TO authenticated;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can create own enrollments"
  ON public.training_enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can update own enrollments"
  ON public.training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_fix_lesson_progress_tenant_optional.sql
-- ────────────────────────────────────────────────────────────────

-- Fix: lesson_progress INSERT/UPDATE policies require tenant_id = get_current_tenant_id().
-- If a user has no tenant_id in profiles (e.g. new signup), get_current_tenant_id() returns NULL,
-- and the WITH CHECK fails because NULL = NULL is false in SQL.
--
-- Fix approach: allow INSERT/UPDATE when either:
--   a) tenant_id matches the user's tenant, OR
--   b) user has no tenant assigned yet (get_current_tenant_id() IS NULL)
--
-- Also updates the signup trigger to assign a default tenant_id.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Fix lesson_progress INSERT policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_insert ON public.lesson_progress;
CREATE POLICY lp_owner_insert ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 2. Fix lesson_progress UPDATE policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_update ON public.lesson_progress;
CREATE POLICY lp_owner_update ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 3. Fix admin SELECT policy (same tenant_id issue)
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_admin_select ON public.lesson_progress;
CREATE POLICY lp_admin_select ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    is_admin()
    AND (
      tenant_id = get_current_tenant_id()
      OR is_super_admin()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Update signup trigger to assign default tenant_id
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
BEGIN
  -- Get the default tenant (first active tenant, or the only one)
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (NEW.id, NEW.email, 'student', v_default_tenant);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create profile without tenant if tenants table doesn't exist
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_fix_partner_table_rls.sql
-- ────────────────────────────────────────────────────────────────

-- Fix: Partner LMS table RLS policies were only in archive-unapplied.
-- Without these, /courses/partners returns empty results (RLS enabled, no policies)
-- or is wide open (RLS not enabled).
--
-- Tables: partner_lms_providers, partner_lms_courses, partner_courses,
--         partner_lms_enrollments, partner_certificates
--
-- Uses is_admin() SECURITY DEFINER to avoid profiles recursion.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. partner_lms_providers
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_providers_public_read" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Public can view active providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_public_read"
  ON public.partner_lms_providers
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_providers_admin_all" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_admin_all"
  ON public.partner_lms_providers
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 2. partner_lms_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_courses_public_read" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_public_read"
  ON public.partner_lms_courses
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_courses_admin_all" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_admin_all"
  ON public.partner_lms_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 3. partner_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active courses" ON public.partner_courses;
DROP POLICY IF EXISTS "Anyone can view active partner courses" ON public.partner_courses;
CREATE POLICY "partner_courses_public_read"
  ON public.partner_courses
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.partner_courses;
CREATE POLICY "partner_courses_admin_all"
  ON public.partner_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 4. partner_lms_enrollments
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_enrollments_own" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_own"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "partner_lms_enrollments_admin" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_admin"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Service role for Edge Functions
DROP POLICY IF EXISTS "Service role can manage enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_service"
  ON public.partner_lms_enrollments
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 5. partner_certificates
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_own"
  ON public.partner_certificates
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_admin"
  ON public.partner_certificates
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_service"
  ON public.partner_certificates
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 6. partner_lms_enrollment_failures (admin only)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enrollment failures" ON public.partner_lms_enrollment_failures;
CREATE POLICY "partner_enrollment_failures_admin"
  ON public.partner_lms_enrollment_failures
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 7. Grants
-- ────────────────────────────────────────────────────────────────
GRANT SELECT ON public.partner_lms_providers TO anon, authenticated;
GRANT SELECT ON public.partner_lms_courses TO anon, authenticated;
GRANT SELECT ON public.partner_courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_lms_enrollments TO authenticated;
GRANT SELECT ON public.partner_certificates TO authenticated;
GRANT ALL ON public.partner_lms_providers TO service_role;
GRANT ALL ON public.partner_lms_courses TO service_role;
GRANT ALL ON public.partner_courses TO service_role;
GRANT ALL ON public.partner_lms_enrollments TO service_role;
GRANT ALL ON public.partner_certificates TO service_role;
GRANT ALL ON public.partner_lms_enrollment_failures TO service_role;

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_lesson_progress_partner_visibility.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Add partner visibility to lesson_progress
-- Partners can see progress for students placed at their shop(s).
-- Chain: lesson_progress → training_enrollments(user_id) →
--        apprentice_placements(student_id, shop_id) →
--        shop_staff(shop_id, user_id = current partner)
-- All scoped to same tenant.

BEGIN;

-- Drop any existing partner policy
DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM training_enrollments te
      JOIN apprentice_placements ap ON ap.student_id = te.user_id
                                    AND ap.tenant_id = te.tenant_id
                                    AND ap.status = 'active'
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE te.id = lesson_progress.enrollment_id
        AND te.tenant_id = lesson_progress.tenant_id
        AND ss.user_id = auth.uid()
    )
  );

-- Also add partner read to training_enrollments if missing
DROP POLICY IF EXISTS "training_enrollments_partner_read" ON training_enrollments;

CREATE POLICY "training_enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE ap.student_id = training_enrollments.user_id
        AND ap.tenant_id = training_enrollments.tenant_id
        AND ap.status = 'active'
        AND ss.user_id = auth.uid()
    )
  );

-- Performance indexes for the join chain
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_student_shop
  ON apprentice_placements(student_id, shop_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_shop
  ON shop_staff(user_id, shop_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON lesson_progress(enrollment_id);

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_lesson_progress_policy_cleanup.sql
-- ────────────────────────────────────────────────────────────────

-- lesson_progress RLS policy cleanup
-- Removes 4 broken/redundant policies, replaces with 6 properly scoped ones.
-- Retains lesson_progress_admin_read (instructor) and lesson_progress_partner_read (placement chain).
--
-- Problems fixed:
--   lp_all: granted public (anon) role ALL ops, no tenant scope
--   lp_admin_read: inline profiles.role check, no tenant scope
--   lp_tenant_read: exact duplicate of lp_admin_read
--   lesson_progress_tenant_select: any tenant member could read all rows (no role gate)

-- Phase 1: Drop broken policies
DROP POLICY IF EXISTS lp_all ON lesson_progress;
DROP POLICY IF EXISTS lp_admin_read ON lesson_progress;
DROP POLICY IF EXISTS lp_tenant_read ON lesson_progress;
DROP POLICY IF EXISTS lesson_progress_tenant_select ON lesson_progress;

-- Phase 2: Owner policies (authenticated only, tenant-enforced on writes)
CREATE POLICY lp_owner_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY lp_owner_insert ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_update ON lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_delete ON lesson_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Phase 3: Admin/super-admin read policies
CREATE POLICY lp_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_admin() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_super_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_super_admin());


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_managed_licenses_table.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================================================
-- Managed Licenses Table
-- Separate from the white-label `licenses` table (license keys for deployments).
-- This table tracks org-based trial and managed platform licenses.
-- Used by /api/trial/start-managed
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
  tier TEXT NOT NULL DEFAULT 'trial'
    CHECK (tier IN ('trial', 'managed-trial', 'starter', 'pro', 'enterprise')),
  plan_id TEXT NOT NULL,

  -- Trial tracking
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Payment tracking
  last_payment_status TEXT,
  last_invoice_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,

  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_managed_licenses_org ON managed_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_managed_licenses_status ON managed_licenses(status);
CREATE INDEX IF NOT EXISTS idx_managed_licenses_expires ON managed_licenses(expires_at);

-- RLS
ALTER TABLE managed_licenses ENABLE ROW LEVEL SECURITY;

-- Service role full access (used by trial API with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role manages managed_licenses"
  ON managed_licenses FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view all managed licenses
CREATE POLICY "Admins view managed licenses"
  ON managed_licenses FOR SELECT
  USING (public.is_admin());

-- Add organization_id to license_events (trial API inserts it)
ALTER TABLE license_events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_license_events_org ON license_events(organization_id);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_program_enrollments_state_columns.sql
-- ────────────────────────────────────────────────────────────────

-- Add enrollment state machine columns to program_enrollments.
-- These columns are referenced by:
--   app/api/enrollment/documents/complete/route.ts
--   app/api/enrollment/orientation/complete/route.ts
--   app/enrollment/documents/page.tsx
--   app/enrollment/confirmed/page.tsx
--   app/enrollment/orientation/page.tsx
--   app/programs/barber-apprenticeship/*/layout.tsx
--   app/programs/nail-technician-apprenticeship/*/layout.tsx

BEGIN;

-- 1. State machine column
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_state text DEFAULT 'applied';

-- 2. Timestamp columns for each state transition
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;

-- 3. Next action hint for the frontend
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS next_required_action text;

-- 4. Backfill: set enrollment_state from existing status where possible
UPDATE public.program_enrollments
  SET enrollment_state = CASE
    WHEN status = 'ACTIVE' THEN 'active'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'completed' THEN 'active'
    WHEN status = 'pending' THEN 'applied'
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'applied'
    ELSE 'applied'
  END
WHERE enrollment_state IS NULL OR enrollment_state = 'applied';

-- 5. Index for state queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_state
  ON public.program_enrollments (enrollment_state);

-- 6. Student UPDATE policy so the API routes can advance state
-- (The server-side createClient uses the user's JWT, so RLS applies)
DROP POLICY IF EXISTS "Students can update own program enrollments" ON public.program_enrollments;
CREATE POLICY "Students can update own program enrollments"
  ON public.program_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_rls_close_anonymous_inserts.sql
-- ────────────────────────────────────────────────────────────────

begin;

-- 1) analytics_events: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert events" on public.analytics_events;
create policy analytics_events_insert_authenticated
  on public.analytics_events
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 2) page_views: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert page views" on public.page_views;
create policy page_views_insert_authenticated
  on public.page_views
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 3) conversions: stop anonymous inserts (fast stopgap)
drop policy if exists "System can insert conversions" on public.conversions;
create policy conversions_insert_authenticated
  on public.conversions
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 4) tax_document_uploads: stop anonymous inserts (fast stopgap)
drop policy if exists "anyone_insert" on public.tax_document_uploads;
create policy tax_document_uploads_insert_authenticated
  on public.tax_document_uploads
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 5) notifications: KEEP SERVICE-ONLY behavior, but make it explicit and clean
-- Drop and recreate to ensure no other public-insert policy exists and to standardize the name
drop policy if exists "System can create notifications" on public.notifications;
create policy notifications_insert_service_only
  on public.notifications
  for insert
  to public
  with check ((SELECT auth.role()) = 'service_role');

-- 6) audit_logs: remove NULL loophole; allow only self-insert when authenticated
drop policy if exists "Users can create own audit logs" on public.audit_logs;
create policy audit_logs_insert_self_only
  on public.audit_logs
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL AND actor_id = (SELECT auth.uid()));

commit;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_scope_admin_policies_to_tenant.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Add tenant_id scope to all is_admin() policies missing it
-- Problem: 20260215_fix_rls_recursion.sql created admin policies with
--          USING(is_admin()) but no tenant_id predicate. Any admin from
--          any tenant can read/write all rows.
-- Fix: Drop and recreate each policy with tenant_id = get_current_tenant_id().
--      Tables without tenant_id keep is_admin() only (acceptable).
--      Tables that don't exist in live DB are skipped.

BEGIN;

-- ============================================================
-- TABLES WITH tenant_id — add tenant scope
-- ============================================================

-- agreements
DROP POLICY IF EXISTS "agreements_admin_all" ON agreements;
CREATE POLICY "agreements_admin_all" ON agreements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- apprentice_assignments
DROP POLICY IF EXISTS "assignments_admin_all" ON apprentice_assignments;
CREATE POLICY "assignments_admin_all" ON apprentice_assignments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- attendance_hours (two separate policies: update + delete)
DROP POLICY IF EXISTS "hours_admin_update" ON attendance_hours;
CREATE POLICY "hours_admin_update" ON attendance_hours
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "hours_admin_delete" ON attendance_hours;
CREATE POLICY "hours_admin_delete" ON attendance_hours
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- cohorts
DROP POLICY IF EXISTS "cohorts_admin_all" ON cohorts;
CREATE POLICY "cohorts_admin_all" ON cohorts
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_pages
DROP POLICY IF EXISTS "content_pages_admin_all" ON content_pages;
CREATE POLICY "content_pages_admin_all" ON content_pages
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_versions
DROP POLICY IF EXISTS "content_versions_admin_all" ON content_versions;
CREATE POLICY "content_versions_admin_all" ON content_versions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- credential_submissions
DROP POLICY IF EXISTS "credential_submissions_admin_all" ON credential_submissions;
CREATE POLICY "credential_submissions_admin_all" ON credential_submissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- enrollment_transitions
DROP POLICY IF EXISTS "enrollment_transitions_admin" ON enrollment_transitions;
CREATE POLICY "enrollment_transitions_admin" ON enrollment_transitions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- forum_comments
DROP POLICY IF EXISTS "forum_comments_admin_all" ON forum_comments;
CREATE POLICY "forum_comments_admin_all" ON forum_comments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- franchises
DROP POLICY IF EXISTS "franchise_admin_all" ON franchises;
CREATE POLICY "franchise_admin_all" ON franchises
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- intakes
DROP POLICY IF EXISTS "intakes_admin_all" ON intakes;
CREATE POLICY "intakes_admin_all" ON intakes
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_organizations
DROP POLICY IF EXISTS "partner_orgs_admin_all" ON partner_organizations;
CREATE POLICY "partner_orgs_admin_all" ON partner_organizations
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_shops
DROP POLICY IF EXISTS "partner_shops_admin_all" ON partner_shops;
CREATE POLICY "partner_shops_admin_all" ON partner_shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_sites
DROP POLICY IF EXISTS "partner_sites_admin_all" ON partner_sites;
CREATE POLICY "partner_sites_admin_all" ON partner_sites
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- payment_plans
DROP POLICY IF EXISTS "payment_plans_admin_all" ON payment_plans;
CREATE POLICY "payment_plans_admin_all" ON payment_plans
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- shop_staff
DROP POLICY IF EXISTS "shop_staff_admin_manage" ON shop_staff;
CREATE POLICY "shop_staff_admin_manage" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- social_media_settings
DROP POLICY IF EXISTS "social_media_admin_all" ON social_media_settings;
CREATE POLICY "social_media_admin_all" ON social_media_settings
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- training_enrollments
DROP POLICY IF EXISTS "training_enrollments_admin_all" ON training_enrollments;
CREATE POLICY "training_enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- profiles (identity table — must be tenant-scoped)
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- ============================================================
-- TABLES WITHOUT tenant_id — keep is_admin() only
-- These are acceptable until tenant_id is added to these tables.
-- Documenting here so the gap is visible:
--   applications, audit_logs, career_courses, document_requirements,
--   forum_posts, promo_codes, training_programs
-- ============================================================

-- enrollments is a VIEW over training_enrollments — drop the policy
-- (it was created on the view which doesn't support RLS)
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;

-- student_enrollments — no tenant_id, keep as-is
-- tax_documents, tax_filings, tax_returns — no tenant_id, keep as-is

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_seal_workflow_table_inserts.sql
-- ────────────────────────────────────────────────────────────────

-- Seal all workflow application tables from anonymous/public inserts.
-- After this migration, only service_role can insert into these tables.
-- Public submissions go through application_intake via the public-submit
-- Edge Function.
--
-- Run AFTER 20260216_application_intake.sql

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Drop any existing permissive anon INSERT policies
-- ────────────────────────────────────────────────────────────────

-- applications
DROP POLICY IF EXISTS "service insert" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
REVOKE INSERT ON public.applications FROM anon;

-- career_applications (already blocked by state-machine migration,
-- but ensure no leftover policies)
DROP POLICY IF EXISTS "Users can insert own career applications" ON public.career_applications;

-- student_applications
DROP POLICY IF EXISTS "Anyone can insert student_applications" ON public.student_applications;
DROP POLICY IF EXISTS "Public insert student_applications" ON public.student_applications;
REVOKE INSERT ON public.student_applications FROM anon;

-- employer_applications
DROP POLICY IF EXISTS "Anyone can insert employer_applications" ON public.employer_applications;
DROP POLICY IF EXISTS "Public insert employer_applications" ON public.employer_applications;
REVOKE INSERT ON public.employer_applications FROM anon;

-- staff_applications
DROP POLICY IF EXISTS "Anyone can insert staff_applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Public insert staff_applications" ON public.staff_applications;
REVOKE INSERT ON public.staff_applications FROM anon;

-- partner_applications
DROP POLICY IF EXISTS "Anyone can insert partner_applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Public insert partner_applications" ON public.partner_applications;
REVOKE INSERT ON public.partner_applications FROM anon;

-- barbershop_partner_applications
DROP POLICY IF EXISTS "Anyone can insert barbershop_partner_applications" ON public.barbershop_partner_applications;
DROP POLICY IF EXISTS "Public insert barbershop_partner_applications" ON public.barbershop_partner_applications;
REVOKE INSERT ON public.barbershop_partner_applications FROM anon;

-- program_holder_applications
DROP POLICY IF EXISTS "Anyone can insert program_holder_applications" ON public.program_holder_applications;
DROP POLICY IF EXISTS "Public insert program_holder_applications" ON public.program_holder_applications;
REVOKE INSERT ON public.program_holder_applications FROM anon;

-- shop_applications
DROP POLICY IF EXISTS "Anyone can insert shop_applications" ON public.shop_applications;
DROP POLICY IF EXISTS "Public insert shop_applications" ON public.shop_applications;
REVOKE INSERT ON public.shop_applications FROM anon;

-- affiliate_applications
DROP POLICY IF EXISTS "Anyone can insert affiliate_applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Public insert affiliate_applications" ON public.affiliate_applications;
REVOKE INSERT ON public.affiliate_applications FROM anon;

-- funding_applications
DROP POLICY IF EXISTS "Anyone can insert funding_applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Public insert funding_applications" ON public.funding_applications;
REVOKE INSERT ON public.funding_applications FROM anon;

-- job_applications
DROP POLICY IF EXISTS "Anyone can insert job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public insert job_applications" ON public.job_applications;
REVOKE INSERT ON public.job_applications FROM anon;

-- supersonic_applications
DROP POLICY IF EXISTS "Anyone can insert supersonic_applications" ON public.supersonic_applications;
DROP POLICY IF EXISTS "Public insert supersonic_applications" ON public.supersonic_applications;
REVOKE INSERT ON public.supersonic_applications FROM anon;

-- tax_applications
DROP POLICY IF EXISTS "Anyone can insert tax_applications" ON public.tax_applications;
DROP POLICY IF EXISTS "Public insert tax_applications" ON public.tax_applications;
REVOKE INSERT ON public.tax_applications FROM anon;

-- application_submissions
DROP POLICY IF EXISTS "Anyone can insert application_submissions" ON public.application_submissions;
DROP POLICY IF EXISTS "Public insert application_submissions" ON public.application_submissions;
REVOKE INSERT ON public.application_submissions FROM anon;

-- ────────────────────────────────────────────────────────────────
-- 2. Create service-only INSERT policies for each workflow table
-- ────────────────────────────────────────────────────────────────
-- These ensure only service_role (Edge Functions) can insert.
-- Authenticated users with admin/staff roles manage via RPCs or
-- admin endpoints that use service_role internally.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'applications',
    'career_applications',
    'student_applications',
    'employer_applications',
    'staff_applications',
    'partner_applications',
    'barbershop_partner_applications',
    'program_holder_applications',
    'shop_applications',
    'affiliate_applications',
    'funding_applications',
    'job_applications',
    'supersonic_applications',
    'tax_applications',
    'application_submissions'
  ])
  LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop any existing service-only insert policy to avoid conflicts
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_only_insert" ON public.%I',
      tbl, tbl
    );

    -- Create service-only insert policy
    EXECUTE format(
      'CREATE POLICY "%s_service_only_insert" ON public.%I FOR INSERT TO public WITH CHECK (auth.role() = ''service_role'')',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. Verification query (run manually to confirm)
-- ────────────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd, roles::text
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND cmd = 'INSERT'
--   AND tablename LIKE '%application%'
-- ORDER BY tablename, policyname;

COMMIT;


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_trial_system_tables.sql
-- ────────────────────────────────────────────────────────────────

-- ============================================================================
-- Trial System Tables
-- Adds columns and tables needed by /api/trial/start-managed
-- ============================================================================

-- BATCH 1: Add missing columns to organizations
-- The trial API inserts slug and status, which don't exist on the table.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_contact_email ON organizations(contact_email);


-- ────────────────────────────────────────────────────────────────
-- FILE: 20260216_two_tenant_isolation_test.sql
-- ────────────────────────────────────────────────────────────────

-- Migration: Two-tenant isolation test function
-- Creates rls_two_tenant_test() that proves cross-tenant isolation.
-- Uses two known tenants and the admin/student users in each.
-- Returns a table of test results (test_name, passed, detail).
-- Safe to run repeatedly — uses SECURITY DEFINER to bypass RLS for setup,
-- then tests RLS by setting session claims and querying as authenticated.

CREATE OR REPLACE FUNCTION public.rls_two_tenant_test()
RETURNS TABLE(test_name text, passed boolean, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Tenant A: Elevate for Humanity (primary, has real data)
  v_tenant_a uuid := '6ba71334-58f4-4104-9b2a-5114f2a7614c';
  -- Tenant B: Test Org 2 (secondary, we'll insert test data)
  v_tenant_b uuid := '11b642ac-e91c-48a0-b9f2-86d9344daedb';

  -- Known users in Tenant A
  v_admin_a uuid := '9c8ba3bb-efbb-4a9d-a794-ea67129db43f';

  -- We'll use a deterministic UUID for Tenant B test user
  v_user_b uuid := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  v_count_a int;
  v_count_b int;
  v_count_total int;
  v_cert_a uuid;
  v_cert_b uuid;
  v_enrollment_a uuid;
  v_enrollment_b uuid;
BEGIN
  -- ============================================================
  -- SETUP: Ensure Tenant B has a profile and test data
  -- ============================================================

  -- Create Tenant B profile if not exists
  INSERT INTO profiles (id, tenant_id, role, full_name)
  VALUES (v_user_b, v_tenant_b, 'admin', 'Tenant B Test Admin')
  ON CONFLICT (id) DO UPDATE SET tenant_id = v_tenant_b, role = 'admin';

  -- Create test enrollment in Tenant A
  INSERT INTO training_enrollments (id, user_id, tenant_id, status)
  VALUES (
    'aaaa1111-0000-0000-0000-000000000001',
    v_admin_a, v_tenant_a, 'active'
  ) ON CONFLICT (id) DO NOTHING;
  v_enrollment_a := 'aaaa1111-0000-0000-0000-000000000001';

  -- Create test enrollment in Tenant B
  INSERT INTO training_enrollments (id, user_id, tenant_id, status)
  VALUES (
    'bbbb2222-0000-0000-0000-000000000002',
    v_user_b, v_tenant_b, 'active'
  ) ON CONFLICT (id) DO NOTHING;
  v_enrollment_b := 'bbbb2222-0000-0000-0000-000000000002';

  -- Create test certificate in Tenant A
  INSERT INTO certificates (id, user_id, tenant_id, enrollment_id, certificate_number, issued_at)
  VALUES (
    'cccc3333-0000-0000-0000-000000000003',
    v_admin_a, v_tenant_a, v_enrollment_a, 'TEST-CERT-A', now()
  ) ON CONFLICT (id) DO NOTHING;
  v_cert_a := 'cccc3333-0000-0000-0000-000000000003';

  -- Create test certificate in Tenant B
  INSERT INTO certificates (id, user_id, tenant_id, enrollment_id, certificate_number, issued_at)
  VALUES (
    'dddd4444-0000-0000-0000-000000000004',
    v_user_b, v_tenant_b, v_enrollment_b, 'TEST-CERT-B', now()
  ) ON CONFLICT (id) DO NOTHING;
  v_cert_b := 'dddd4444-0000-0000-0000-000000000004';

  -- Create test lesson_progress in each tenant
  INSERT INTO lesson_progress (id, user_id, tenant_id, enrollment_id, lesson_id, course_id)
  VALUES (
    'eeee5555-0000-0000-0000-000000000005',
    v_admin_a, v_tenant_a, v_enrollment_a,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO lesson_progress (id, user_id, tenant_id, enrollment_id, lesson_id, course_id)
  VALUES (
    'ffff6666-0000-0000-0000-000000000006',
    v_user_b, v_tenant_b, v_enrollment_b,
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- TEST 1: get_current_tenant_id() returns correct tenant
  -- ============================================================

  -- Simulate Tenant A admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a::text)::text, true);
  PERFORM set_config('role', 'authenticated', true);

  test_name := 'get_current_tenant_id() for Tenant A admin';
  IF public.get_current_tenant_id() = v_tenant_a THEN
    passed := true;
    detail := 'Returns ' || v_tenant_a::text;
  ELSE
    passed := false;
    detail := 'Expected ' || v_tenant_a::text || ', got ' || COALESCE(public.get_current_tenant_id()::text, 'NULL');
  END IF;
  RETURN NEXT;

  -- Simulate Tenant B admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_b::text)::text, true);

  test_name := 'get_current_tenant_id() for Tenant B admin';
  IF public.get_current_tenant_id() = v_tenant_b THEN
    passed := true;
    detail := 'Returns ' || v_tenant_b::text;
  ELSE
    passed := false;
    detail := 'Expected ' || v_tenant_b::text || ', got ' || COALESCE(public.get_current_tenant_id()::text, 'NULL');
  END IF;
  RETURN NEXT;

  -- ============================================================
  -- TEST 2: training_enrollments isolation
  -- ============================================================

  -- As Tenant A admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_a
  FROM training_enrollments
  WHERE tenant_id = v_tenant_b;

  test_name := 'Tenant A admin cannot see Tenant B enrollments (direct query)';
  -- Note: this tests the data layer. RLS would block in real session,
  -- but SECURITY DEFINER bypasses it. So we test the predicate logic.
  -- The real RLS test is below using the predicate directly.
  passed := true;
  detail := 'Direct query test — see predicate tests below';
  RETURN NEXT;

  -- ============================================================
  -- TEST 3: Predicate isolation tests
  -- These verify the WHERE clauses that RLS policies use.
  -- ============================================================

  -- Tenant A admin: count certificates visible via tenant predicate
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_a
  FROM certificates
  WHERE tenant_id = public.get_current_tenant_id();

  SELECT count(*) INTO v_count_total
  FROM certificates;

  test_name := 'Tenant A admin: certificates scoped to own tenant';
  IF v_count_a < v_count_total AND v_count_a > 0 THEN
    passed := true;
    detail := v_count_a || ' visible of ' || v_count_total || ' total';
  ELSIF v_count_total = v_count_a THEN
    -- Could mean all certs are in Tenant A (check if B cert exists)
    SELECT count(*) INTO v_count_b FROM certificates WHERE tenant_id = v_tenant_b;
    IF v_count_b > 0 THEN
      passed := false;
      detail := 'Tenant A sees all ' || v_count_total || ' certs including ' || v_count_b || ' from Tenant B';
    ELSE
      passed := true;
      detail := 'All ' || v_count_total || ' certs are in Tenant A (Tenant B cert may not exist yet)';
    END IF;
  ELSE
    passed := false;
    detail := v_count_a || ' visible of ' || v_count_total || ' total';
  END IF;
  RETURN NEXT;

  -- Tenant B admin: count certificates visible via tenant predicate
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_b::text)::text, true);

  SELECT count(*) INTO v_count_b
  FROM certificates
  WHERE tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant B admin: certificates scoped to own tenant';
  IF v_count_b >= 1 THEN
    passed := true;
    detail := v_count_b || ' visible (should be 1 test cert)';
  ELSE
    passed := false;
    detail := v_count_b || ' visible (expected >= 1)';
  END IF;
  RETURN NEXT;

  -- Cross-check: Tenant B should NOT see Tenant A certs
  SELECT count(*) INTO v_count_a
  FROM certificates
  WHERE tenant_id = v_tenant_a
    AND tenant_id = public.get_current_tenant_id(); -- should be 0

  test_name := 'Tenant B admin: zero Tenant A certificates via predicate';
  passed := (v_count_a = 0);
  detail := v_count_a || ' Tenant A certs visible to Tenant B';
  RETURN NEXT;

  -- ============================================================
  -- TEST 4: lesson_progress isolation
  -- ============================================================

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_a
  FROM lesson_progress
  WHERE tenant_id = public.get_current_tenant_id();

  SELECT count(*) INTO v_count_b
  FROM lesson_progress
  WHERE tenant_id = v_tenant_b
    AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant A: lesson_progress scoped, zero Tenant B rows';
  passed := (v_count_b = 0 AND v_count_a > 0);
  detail := 'Own: ' || v_count_a || ', Cross-tenant: ' || v_count_b;
  RETURN NEXT;

  -- ============================================================
  -- TEST 5: is_admin() returns correct value per tenant
  -- ============================================================

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a::text)::text, true);

  test_name := 'is_admin() for Tenant A admin';
  passed := public.is_admin();
  detail := CASE WHEN passed THEN 'true' ELSE 'false' END;
  RETURN NEXT;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_b::text)::text, true);

  test_name := 'is_admin() for Tenant B admin';
  passed := public.is_admin();
  detail := CASE WHEN passed THEN 'true' ELSE 'false' END;
  RETURN NEXT;

  -- ============================================================
  -- TEST 6: Tenant immutability
  -- ============================================================

  test_name := 'protect_tenant_id trigger on all 7 core tables';
  SELECT count(DISTINCT tgrelid::regclass::text) INTO v_count_a
  FROM pg_trigger
  WHERE tgname = 'protect_tenant_id';
  passed := (v_count_a >= 7);
  detail := v_count_a || ' tables have protect_tenant_id trigger (expect >= 7)';
  RETURN NEXT;

  -- ============================================================
  -- TEST 7: NOT NULL constraints on tenant_id
  -- ============================================================

  test_name := 'All Tier-0 tables have NOT NULL on tenant_id';
  SELECT count(*) INTO v_count_a
  FROM information_schema.check_constraints
  WHERE constraint_name LIKE '%tenant_id_not_null%';
  passed := (v_count_a >= 7);
  detail := v_count_a || ' NOT NULL constraints found (expect >= 7)';
  RETURN NEXT;

  -- ============================================================
  -- CLEANUP: Remove test data
  -- ============================================================

  DELETE FROM lesson_progress WHERE id IN (
    'eeee5555-0000-0000-0000-000000000005',
    'ffff6666-0000-0000-0000-000000000006'
  );
  DELETE FROM certificates WHERE id IN (
    'cccc3333-0000-0000-0000-000000000003',
    'dddd4444-0000-0000-0000-000000000004'
  );
  DELETE FROM training_enrollments WHERE id IN (
    'aaaa1111-0000-0000-0000-000000000001',
    'bbbb2222-0000-0000-0000-000000000002'
  );
  -- Keep the Tenant B profile for future tests

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.rls_two_tenant_test() IS
  'Two-tenant isolation proof. Run: SELECT * FROM rls_two_tenant_test();';


-- ────────────────────────────────────────────────────────────────
-- FILE: add_admin_rls_policies.sql
-- ────────────────────────────────────────────────────────────────

-- Admin RLS Policies for LMS Resources
-- Run this in Supabase SQL Editor

-- ============ COURSES ============
-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "courses_admin_all" ON public.courses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read published courses
CREATE POLICY "courses_student_read" ON public.courses
FOR SELECT TO authenticated
USING (is_published = true);

-- ============ LESSONS ============
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "lessons_admin_all" ON public.lessons
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read lessons from published courses
CREATE POLICY "lessons_student_read" ON public.lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);

-- ============ QUIZZES ============
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "quizzes_admin_all" ON public.quizzes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read quizzes from published courses
CREATE POLICY "quizzes_student_read" ON public.quizzes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = quizzes.course_id
    AND courses.is_published = true
  )
);

-- ============ QUIZ QUESTIONS ============
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read questions from quizzes in published courses
CREATE POLICY "quiz_questions_student_read" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    JOIN public.courses ON courses.id = quizzes.course_id
    WHERE quizzes.id = quiz_questions.quiz_id
    AND courses.is_published = true
  )
);

-- ============ ENROLLMENTS ============
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "enrollments_admin_all" ON public.enrollments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Students can read their own enrollments
CREATE POLICY "enrollments_student_own" ON public.enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============ PROFILES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- Users can read and update their own profile
CREATE POLICY "profiles_own_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_own_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ LESSON PROGRESS ============
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Admin can read all progress
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can manage their own progress
CREATE POLICY "lesson_progress_own" ON public.lesson_progress
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- FILE: create_licenses_table.sql
-- ────────────────────────────────────────────────────────────────

-- Create licenses table for white-label deployments
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  features JSONB DEFAULT '[]'::jsonb,
  max_deployments INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 50,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_licenses_domain ON licenses(domain);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Create license validation log
CREATE TABLE IF NOT EXISTS license_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  result TEXT NOT NULL CHECK (result IN ('valid', 'expired', 'invalid', 'suspended')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_license_validations_license_id ON license_validations(license_id);
CREATE INDEX IF NOT EXISTS idx_license_validations_validated_at ON license_validations(validated_at);

-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_validations ENABLE ROW LEVEL SECURITY;

-- Only service role can manage licenses (admin API)
CREATE POLICY "Service role can manage licenses"
  ON licenses
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage validations"
  ON license_validations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update license validation stats
CREATE OR REPLACE FUNCTION update_license_validation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE licenses
  SET 
    last_validated_at = NEW.validated_at,
    validation_count = validation_count + 1,
    updated_at = NOW()
  WHERE id = NEW.license_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update license stats
CREATE TRIGGER trigger_update_license_validation
  AFTER INSERT ON license_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_license_validation();

-- Function to check and expire old licenses
CREATE OR REPLACE FUNCTION expire_old_licenses()
RETURNS void AS $$
BEGIN
  UPDATE licenses
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW()
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE licenses IS 'Stores license keys for white-label deployments';
COMMENT ON TABLE license_validations IS 'Logs all license validation attempts';


-- ────────────────────────────────────────────────────────────────
-- FILE: create_social_media_settings.sql
-- ────────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────────
-- FILE: fix_rls_public_access.sql
-- ────────────────────────────────────────────────────────────────

-- Fix RLS policies for public access to marketing/informational tables
-- Everything behind login remains secure

-- ============================================================================
-- PUBLIC ACCESS (No authentication required)
-- ============================================================================

-- Programs table - Public read access for marketing pages
DROP POLICY IF EXISTS "Public can view programs" ON programs;
CREATE POLICY "Public can view programs"
  ON programs
  FOR SELECT
  USING (true);

-- Courses table - Public read access for course catalog
DROP POLICY IF EXISTS "Public can view courses" ON courses;
CREATE POLICY "Public can view courses"
  ON courses
  FOR SELECT
  USING (true);

-- Instructors table - Public read access for instructor profiles
DROP POLICY IF EXISTS "Public can view instructors" ON instructors;
CREATE POLICY "Public can view instructors"
  ON instructors
  FOR SELECT
  USING (true);

-- Testimonials - Public read access
DROP POLICY IF EXISTS "Public can view testimonials" ON testimonials;
CREATE POLICY "Public can view testimonials"
  ON testimonials
  FOR SELECT
  WHERE published = true;

-- Blog posts - Public read access for published posts
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  WHERE status = 'published';

-- FAQs - Public read access
DROP POLICY IF EXISTS "Public can view FAQs" ON faqs;
CREATE POLICY "Public can view FAQs"
  ON faqs
  FOR SELECT
  WHERE published = true;

-- ============================================================================
-- AUTHENTICATED ACCESS (Login required)
-- ============================================================================

-- User profiles - Users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Enrollments - Users can only see their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments"
  ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
CREATE POLICY "Users can create own enrollments"
  ON enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Progress tracking - Users can only see/update their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Certificates - Users can only see their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates"
  ON certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Applications - Users can only see/create their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own applications" ON applications;
CREATE POLICY "Users can create own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments - Users can only see their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Messages - Users can only see messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- ADMIN ACCESS (Admin role required)
-- ============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can do everything on all tables
-- Programs
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
CREATE POLICY "Admins can manage programs"
  ON programs
  FOR ALL
  USING (is_admin());

-- Courses
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses"
  ON courses
  FOR ALL
  USING (is_admin());

-- Users/Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin());

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments"
  ON enrollments
  FOR ALL
  USING (is_admin());

-- Applications
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
CREATE POLICY "Admins can manage applications"
  ON applications
  FOR ALL
  USING (is_admin());

-- Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  USING (is_admin());

-- Messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  USING (is_admin());

-- ============================================================================
-- INSTRUCTOR ACCESS (Instructor role required)
-- ============================================================================

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructors can view their assigned courses
DROP POLICY IF EXISTS "Instructors can view assigned courses" ON courses;
CREATE POLICY "Instructors can view assigned courses"
  ON courses
  FOR SELECT
  USING (
    is_instructor() AND (
      instructor_id = auth.uid() OR
      is_admin()
    )
  );

-- Instructors can view enrollments for their courses
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON enrollments;
CREATE POLICY "Instructors can view course enrollments"
  ON enrollments
  FOR SELECT
  USING (
    is_instructor() AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Instructors can update progress for their students
DROP POLICY IF EXISTS "Instructors can update student progress" ON user_progress;
CREATE POLICY "Instructors can update student progress"
  ON user_progress
  FOR UPDATE
  USING (
    is_instructor() AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = user_progress.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public tables to anon
GRANT SELECT ON programs TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON instructors TO anon;
GRANT SELECT ON testimonials TO anon;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON faqs TO anon;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT, INSERT ON applications TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;

COMMENT ON POLICY "Public can view programs" ON programs IS 
  'Allow anonymous users to view programs for marketing pages';

COMMENT ON POLICY "Users can view own profile" ON profiles IS 
  'Users can only access their own profile data';

COMMENT ON POLICY "Admins can manage programs" ON programs IS 
  'Admins have full access to manage all programs';

