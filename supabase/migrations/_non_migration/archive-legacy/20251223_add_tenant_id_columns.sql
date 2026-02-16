-- Add tenant_id to all business-critical tables
-- This migration adds tenant_id columns but does NOT make them NOT NULL yet
-- Backfill migration will populate values, then constraints migration will enforce

-- profiles already has tenant_id from 20251218_white_label.sql
-- programs already has tenant_id from 20251218_white_label.sql
-- enrollments already has tenant_id from 20251218_white_label.sql

-- Add tenant_id to additional tables
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.course_progress
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.certifications
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.job_placements
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.compliance_reports
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.compliance_scores
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.student_verifications
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.employers
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.program_holders
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.apprentices
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.apprenticeships
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Create indexes for tenant_id columns
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_tenant ON course_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certifications_tenant ON certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_tenant ON job_postings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_tenant ON job_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_tenant ON job_placements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_tenant ON compliance_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scores_tenant ON compliance_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_verifications_tenant ON student_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employers_tenant ON employers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_program_holders_tenant ON program_holders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apprentices_tenant ON apprentices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeships_tenant ON apprenticeships(tenant_id);

-- Comments
COMMENT ON COLUMN courses.tenant_id IS 'Tenant isolation - courses belong to one tenant';
COMMENT ON COLUMN course_progress.tenant_id IS 'Tenant isolation - progress records belong to one tenant';
COMMENT ON COLUMN certifications.tenant_id IS 'Tenant isolation - certifications belong to one tenant';
COMMENT ON COLUMN job_postings.tenant_id IS 'Tenant isolation - job postings belong to one tenant';
COMMENT ON COLUMN job_applications.tenant_id IS 'Tenant isolation - applications belong to one tenant';
COMMENT ON COLUMN job_placements.tenant_id IS 'Tenant isolation - placements belong to one tenant';
COMMENT ON COLUMN compliance_reports.tenant_id IS 'Tenant isolation - reports belong to one tenant';
COMMENT ON COLUMN compliance_scores.tenant_id IS 'Tenant isolation - scores belong to one tenant';
COMMENT ON COLUMN student_verifications.tenant_id IS 'Tenant isolation - verifications belong to one tenant';
COMMENT ON COLUMN employers.tenant_id IS 'Tenant isolation - employers belong to one tenant';
COMMENT ON COLUMN program_holders.tenant_id IS 'Tenant isolation - program holders belong to one tenant';
COMMENT ON COLUMN apprentices.tenant_id IS 'Tenant isolation - apprentices belong to one tenant';
COMMENT ON COLUMN apprenticeships.tenant_id IS 'Tenant isolation - apprenticeships belong to one tenant';
