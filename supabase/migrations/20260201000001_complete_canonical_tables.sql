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

-- Ensure unique constraint exists before ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name_unique ON public.roles(name);

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

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id TEXT;
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

-- Ensure unique constraint exists before ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS idx_funding_sources_code_unique ON public.funding_sources(code);

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
  program_id UUID NOT NULL ,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  coverage_percent INTEGER DEFAULT 100 CHECK (coverage_percent >= 0 AND coverage_percent <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, funding_source_id)
);

ALTER TABLE public.program_funding_links ADD COLUMN IF NOT EXISTS program_id UUID;
CREATE INDEX IF NOT EXISTS idx_program_funding_program ON public.program_funding_links(program_id);

-- ============ EVALUATIONS ============
-- Student evaluations by instructors

CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
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

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS enrollment_id UUID;
CREATE INDEX IF NOT EXISTS idx_evaluations_enrollment ON public.evaluations(enrollment_id);
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS evaluator_id TEXT;
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

ALTER TABLE public.document_verifications ADD COLUMN IF NOT EXISTS document_id TEXT;
CREATE INDEX IF NOT EXISTS idx_doc_verifications_document ON public.document_verifications(document_id);

-- ============ RLS POLICIES ============

-- Roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_public_read" ON public.roles;
CREATE POLICY "roles_public_read" ON public.roles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "roles_admin_all" ON public.roles;
CREATE POLICY "roles_admin_all" ON public.roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- User Roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Funding Sources table
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_sources_public_read" ON public.funding_sources;
CREATE POLICY "funding_sources_public_read" ON public.funding_sources
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "funding_sources_admin_all" ON public.funding_sources;
CREATE POLICY "funding_sources_admin_all" ON public.funding_sources
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Program Funding Links table
ALTER TABLE public.program_funding_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_funding_public_read" ON public.program_funding_links;
CREATE POLICY "program_funding_public_read" ON public.program_funding_links
FOR SELECT USING (true);

DROP POLICY IF EXISTS "program_funding_admin_all" ON public.program_funding_links;
CREATE POLICY "program_funding_admin_all" ON public.program_funding_links
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Evaluations table
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evaluations_student_read" ON public.evaluations;
CREATE POLICY "evaluations_student_read" ON public.evaluations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_enrollments
    WHERE training_enrollments.id = evaluations.enrollment_id
    AND training_enrollments.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "evaluations_instructor_all" ON public.evaluations;
CREATE POLICY "evaluations_instructor_all" ON public.evaluations
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'instructor'))
);

-- Document Verifications table
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_verifications_admin_all" ON public.document_verifications;
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
    'applications', 'training_enrollments', 'cohorts', 'attendance_hours',
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
