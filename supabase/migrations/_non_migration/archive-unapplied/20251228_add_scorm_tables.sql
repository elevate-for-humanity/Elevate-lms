-- =====================================================
-- SCORM Integration Tables
-- Enables embedding SCORM packages for partner courses
-- =====================================================

-- SCORM Packages
CREATE TABLE IF NOT EXISTS public.scorm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version TEXT,
  storage_path TEXT NOT NULL, -- Path in Supabase storage
  manifest_data JSONB, -- Parsed imsmanifest.xml
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scorm_packages_created_at 
  ON public.scorm_packages(created_at DESC);

-- SCORM Enrollments (student progress in SCORM packages)
CREATE TABLE IF NOT EXISTS public.scorm_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorm_package_id UUID NOT NULL REFERENCES public.scorm_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID, -- Links to partner_lms_enrollments
  status TEXT NOT NULL DEFAULT 'not_attempted' 
    CHECK (status IN ('not_attempted', 'incomplete', 'completed', 'passed', 'failed')),
  score DECIMAL(5,2), -- 0-100
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scorm_package_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_user 
  ON public.scorm_enrollments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_package 
  ON public.scorm_enrollments(scorm_package_id);

-- Partner Course Mappings (links partner courses to SCORM packages)
CREATE TABLE IF NOT EXISTS public.partner_course_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_course_id UUID NOT NULL, -- References partner_lms_courses.id
  scorm_package_id UUID NOT NULL REFERENCES public.scorm_packages(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- For multiple packages per course
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_course_id, scorm_package_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_course_mappings_course 
  ON public.partner_course_mappings(partner_course_id, is_active);

CREATE INDEX IF NOT EXISTS idx_partner_course_mappings_package 
  ON public.partner_course_mappings(scorm_package_id);

-- SCORM State Data (CMI data for SCORM player)
CREATE TABLE IF NOT EXISTS public.scorm_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.scorm_enrollments(id) ON DELETE CASCADE,
  cmi_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full CMI state
  suspend_data TEXT, -- SCORM suspend_data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_scorm_state_enrollment 
  ON public.scorm_state(enrollment_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorm_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_course_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorm_state ENABLE ROW LEVEL SECURITY;

-- SCORM Packages: Admins can manage, everyone can view active packages
CREATE POLICY "Admins can manage SCORM packages"
  ON public.scorm_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Everyone can view SCORM packages"
  ON public.scorm_packages
  FOR SELECT
  TO authenticated
  USING (true);

-- SCORM Enrollments: Users can view/update their own, admins can view all
CREATE POLICY "Users can view their own SCORM enrollments"
  ON public.scorm_enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own SCORM enrollments"
  ON public.scorm_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create SCORM enrollments"
  ON public.scorm_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all SCORM enrollments"
  ON public.scorm_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Partner Course Mappings: Admins can manage, everyone can view active
CREATE POLICY "Admins can manage partner course mappings"
  ON public.partner_course_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Everyone can view active mappings"
  ON public.partner_course_mappings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SCORM State: Users can manage their own state
CREATE POLICY "Users can manage their own SCORM state"
  ON public.scorm_state
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scorm_enrollments
      WHERE scorm_enrollments.id = scorm_state.enrollment_id
      AND scorm_enrollments.user_id = auth.uid()
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.scorm_packages IS 'SCORM packages uploaded for partner courses';
COMMENT ON TABLE public.scorm_enrollments IS 'Student enrollments in SCORM packages';
COMMENT ON TABLE public.partner_course_mappings IS 'Links partner courses to SCORM packages';
COMMENT ON TABLE public.scorm_state IS 'SCORM player state data (CMI)';

COMMENT ON COLUMN public.scorm_packages.storage_path IS 'Path to SCORM package in Supabase storage (e.g., scorm/jri/package.zip)';
COMMENT ON COLUMN public.scorm_packages.manifest_data IS 'Parsed imsmanifest.xml as JSON';
COMMENT ON COLUMN public.scorm_enrollments.enrollment_id IS 'Optional link to partner_lms_enrollments';
COMMENT ON COLUMN public.scorm_state.cmi_data IS 'Full SCORM CMI data model as JSON';
COMMENT ON COLUMN public.scorm_state.suspend_data IS 'SCORM suspend_data for resuming';
