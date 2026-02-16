-- Ensure Employment Tracking and Credential Verification Tables Exist
-- These tables are critical for WIOA compliance reporting

-- ============================================================================
-- EMPLOYMENT TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID,
  
  -- Employment details
  employer_name TEXT,
  job_title TEXT,
  employment_start_date DATE,
  employment_end_date DATE,
  
  -- Wage information
  hourly_wage DECIMAL(10,2),
  hours_per_week DECIMAL(5,2),
  annual_salary DECIMAL(12,2),
  
  -- Follow-up tracking (WIOA requirement)
  verified_2nd_quarter BOOLEAN DEFAULT false,
  verified_2nd_quarter_date DATE,
  wage_2nd_quarter DECIMAL(10,2),
  
  verified_4th_quarter BOOLEAN DEFAULT false,
  verified_4th_quarter_date DATE,
  wage_4th_quarter DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employment_tracking_student ON public.employment_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_enrollment ON public.employment_tracking(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_start_date ON public.employment_tracking(employment_start_date);

-- Enable RLS
ALTER TABLE public.employment_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_view_own_employment_tracking" ON public.employment_tracking;
CREATE POLICY "users_view_own_employment_tracking" ON public.employment_tracking
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admins_manage_employment_tracking" ON public.employment_tracking;
CREATE POLICY "admins_manage_employment_tracking" ON public.employment_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- CREDENTIAL VERIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credential_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID,
  
  -- Credential details
  credential_type TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  credential_number TEXT,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  
  -- Verification
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')) DEFAULT 'pending',
  verified_date DATE,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT,
  verification_url TEXT,
  
  -- State database integration
  state_registry_id TEXT,
  state_registry_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credential_verification_student ON public.credential_verification(student_id);
CREATE INDEX IF NOT EXISTS idx_credential_verification_enrollment ON public.credential_verification(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_credential_verification_status ON public.credential_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_credential_verification_expiration ON public.credential_verification(expiration_date);

-- Enable RLS
ALTER TABLE public.credential_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_view_own_credential_verification" ON public.credential_verification;
CREATE POLICY "users_view_own_credential_verification" ON public.credential_verification
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admins_manage_credential_verification" ON public.credential_verification;
CREATE POLICY "admins_manage_credential_verification" ON public.credential_verification
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.employment_tracking TO authenticated;
GRANT SELECT ON public.credential_verification TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.employment_tracking IS 
  'Tracks student employment for WIOA compliance reporting';

COMMENT ON TABLE public.credential_verification IS 
  'Verifies student credentials against state registries';

COMMENT ON COLUMN public.employment_tracking.verified_2nd_quarter IS 
  'WIOA requires 2nd quarter follow-up (4-6 months after exit)';

COMMENT ON COLUMN public.employment_tracking.verified_4th_quarter IS 
  'WIOA requires 4th quarter follow-up (10-12 months after exit)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Employment tracking and credential verification tables ensured';
END $$;
