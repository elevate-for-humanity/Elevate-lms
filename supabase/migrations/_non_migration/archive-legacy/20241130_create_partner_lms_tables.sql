-- Partner LMS System Tables
-- Migration: 20241130_create_partner_lms_tables
-- Description: Complete partner integration system for HSI, Certiport, CareerSafe, etc.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Partner LMS Providers (HSI, Certiport, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partner_lms_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'hsi', 'certiport', 'careersafe', 'milady', 'jri', 'nrf', 'nds'
  website_url TEXT,
  support_email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  api_config JSONB DEFAULT '{}'::jsonb, -- Store non-sensitive config
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_type
  ON public.partner_lms_providers (provider_type);

CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_active
  ON public.partner_lms_providers (active);

-- =====================================================
-- 2. Partner Courses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partner_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.partner_lms_providers (id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT, -- Internal code
  external_course_code TEXT, -- Partner's course ID
  description TEXT,
  hours NUMERIC,
  level TEXT, -- 'beginner', 'intermediate', 'advanced'
  credential_type TEXT, -- 'certificate', 'license', 'exam'
  price NUMERIC DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_courses_provider
  ON public.partner_courses (provider_id);

CREATE INDEX IF NOT EXISTS idx_partner_courses_active
  ON public.partner_courses (active);

CREATE INDEX IF NOT EXISTS idx_partner_courses_code
  ON public.partner_courses (course_code);

-- =====================================================
-- 3. Partner LMS Enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partner_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.partner_lms_providers (id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.partner_courses (id) ON DELETE RESTRICT,
  program_id UUID NULL, -- Optional link to programs table
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'failed'
  progress_percentage NUMERIC DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  
  external_enrollment_id TEXT NOT NULL,
  external_account_id TEXT NULL,
  external_certificate_id TEXT NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_student
  ON public.partner_lms_enrollments (student_id);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_status
  ON public.partner_lms_enrollments (status);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_provider
  ON public.partner_lms_enrollments (provider_id);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_course
  ON public.partner_lms_enrollments (course_id);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_external_id
  ON public.partner_lms_enrollments (external_enrollment_id);

-- =====================================================
-- 4. Partner LMS Enrollment Failures
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partner_lms_enrollment_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.partner_lms_providers (id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.partner_courses (id) ON DELETE RESTRICT,
  program_id UUID NULL,
  error_message TEXT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_enrollment_failures_student
  ON public.partner_lms_enrollment_failures (student_id);

CREATE INDEX IF NOT EXISTS idx_partner_enrollment_failures_resolved
  ON public.partner_lms_enrollment_failures (resolved);

-- =====================================================
-- 5. Partner Certificates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partner_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.partner_lms_enrollments (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partner_lms_providers (id) ON DELETE RESTRICT,
  
  certificate_number TEXT,
  certificate_url TEXT NOT NULL, -- URL in Supabase storage or external
  verification_url TEXT,
  issued_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_certificates_student
  ON public.partner_certificates (student_id);

CREATE INDEX IF NOT EXISTS idx_partner_certificates_enrollment
  ON public.partner_certificates (enrollment_id);

CREATE INDEX IF NOT EXISTS idx_partner_certificates_number
  ON public.partner_certificates (certificate_number);

-- =====================================================
-- 6. Update Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_lms_providers_updated_at
  BEFORE UPDATE ON public.partner_lms_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_courses_updated_at
  BEFORE UPDATE ON public.partner_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_lms_enrollments_updated_at
  BEFORE UPDATE ON public.partner_lms_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.partner_lms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_certificates ENABLE ROW LEVEL SECURITY;

-- Providers: Public read, admin write
CREATE POLICY "Public can view active providers"
  ON public.partner_lms_providers FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage providers"
  ON public.partner_lms_providers FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Courses: Public read active, admin write
CREATE POLICY "Public can view active courses"
  ON public.partner_courses FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage courses"
  ON public.partner_courses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Enrollments: Students see own, admins see all
CREATE POLICY "Students can view own enrollments"
  ON public.partner_lms_enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
  ON public.partner_lms_enrollments FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can manage enrollments"
  ON public.partner_lms_enrollments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Certificates: Students see own, admins see all
CREATE POLICY "Students can view own certificates"
  ON public.partner_certificates FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all certificates"
  ON public.partner_certificates FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can manage certificates"
  ON public.partner_certificates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Enrollment failures: Admin only
CREATE POLICY "Admins can view enrollment failures"
  ON public.partner_lms_enrollment_failures FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 8. Seed Data - Common Providers
-- =====================================================
INSERT INTO public.partner_lms_providers (provider_name, provider_type, website_url, support_email, active)
VALUES
  ('Health & Safety Institute', 'hsi', 'https://www.hsi.com', 'support@hsi.com', true),
  ('Certiport', 'certiport', 'https://www.certiport.com', 'support@certiport.com', true),
  ('CareerSafe', 'careersafe', 'https://www.careersafe.com', 'support@careersafe.com', true),
  ('Milady', 'milady', 'https://www.milady.com', 'support@milady.com', true),
  ('JRI', 'jri', 'https://www.jri.org', 'support@jri.org', true),
  ('NRF Foundation', 'nrf', 'https://www.nrffoundation.org', 'support@nrffoundation.org', true),
  ('National Dental Solutions', 'nds', 'https://www.ndsolutions.com', 'support@ndsolutions.com', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. Comments
-- =====================================================
COMMENT ON TABLE public.partner_lms_providers IS 'Third-party LMS providers (HSI, Certiport, etc.)';
COMMENT ON TABLE public.partner_courses IS 'Courses offered through partner platforms';
COMMENT ON TABLE public.partner_lms_enrollments IS 'Student enrollments in partner courses';
COMMENT ON TABLE public.partner_lms_enrollment_failures IS 'Failed enrollment attempts for retry/debugging';
COMMENT ON TABLE public.partner_certificates IS 'Certificates earned from partner courses';

COMMENT ON COLUMN public.partner_lms_enrollments.external_enrollment_id IS 'Enrollment ID from partner system';
COMMENT ON COLUMN public.partner_lms_enrollments.external_account_id IS 'Student account ID in partner system';
COMMENT ON COLUMN public.partner_lms_enrollments.metadata IS 'Stores partner-specific data like SSO URLs, login credentials, etc.';
