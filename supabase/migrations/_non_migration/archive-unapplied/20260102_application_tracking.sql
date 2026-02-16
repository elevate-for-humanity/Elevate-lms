-- Application Status Tracking System
-- Unified tracking for all application types

-- ============================================
-- APPLICATION STATUS ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'waitlisted',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ADD STATUS TRACKING TO APPLICATIONS
-- ============================================

-- Student applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_applications') THEN
    ALTER TABLE student_applications 
      ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS review_notes TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
    
    CREATE INDEX IF NOT EXISTS idx_student_applications_status ON student_applications(status);
    CREATE INDEX IF NOT EXISTS idx_student_applications_tracking ON student_applications(tracking_number);
  END IF;
END $$;

-- Program holder applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_holder_applications') THEN
    ALTER TABLE program_holder_applications 
      ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS review_notes TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
    
    CREATE INDEX IF NOT EXISTS idx_program_holder_applications_status ON program_holder_applications(status);
    CREATE INDEX IF NOT EXISTS idx_program_holder_applications_tracking ON program_holder_applications(tracking_number);
  END IF;
END $$;

-- Employer applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employer_applications') THEN
    ALTER TABLE employer_applications 
      ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS review_notes TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
    
    CREATE INDEX IF NOT EXISTS idx_employer_applications_status ON employer_applications(status);
    CREATE INDEX IF NOT EXISTS idx_employer_applications_tracking ON employer_applications(tracking_number);
  END IF;
END $$;

-- Staff applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_applications') THEN
    ALTER TABLE staff_applications 
      ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS review_notes TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
    
    CREATE INDEX IF NOT EXISTS idx_staff_applications_status ON staff_applications(status);
    CREATE INDEX IF NOT EXISTS idx_staff_applications_tracking ON staff_applications(tracking_number);
  END IF;
END $$;

-- ============================================
-- EMPLOYMENT TRACKING (WIOA Compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS employment_tracking (
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
  
  -- Follow-up tracking
  verified_2nd_quarter BOOLEAN DEFAULT false,
  verified_2nd_quarter_date DATE,
  wage_2nd_quarter DECIMAL(10,2),
  
  verified_4th_quarter BOOLEAN DEFAULT false,
  verified_4th_quarter_date DATE,
  wage_4th_quarter DECIMAL(10,2),
  
  -- UI-3 wage matching
  ui3_matched BOOLEAN DEFAULT false,
  ui3_match_date DATE,
  ui3_quarterly_wages JSONB,
  
  -- Verification
  verification_method TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verification_documents JSONB,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employment_tracking_student ON employment_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_enrollment ON employment_tracking(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_2nd_quarter ON employment_tracking(verified_2nd_quarter);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_4th_quarter ON employment_tracking(verified_4th_quarter);

-- ============================================
-- CREDENTIAL VERIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS credential_verification (
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
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  verified_date DATE,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT,
  verification_url TEXT,
  
  -- State database integration
  state_database_id TEXT,
  state_verified BOOLEAN DEFAULT false,
  state_verification_date DATE,
  
  -- Documents
  credential_document_url TEXT,
  verification_documents JSONB,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_verification_student ON credential_verification(student_id);
CREATE INDEX IF NOT EXISTS idx_credential_verification_status ON credential_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_credential_verification_state ON credential_verification(state_verified);

-- ============================================
-- FOLLOW-UP SCHEDULE
-- ============================================

CREATE TABLE IF NOT EXISTS follow_up_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Follow-up details
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN (
    '2nd_quarter_employment',
    '4th_quarter_employment',
    'credential_verification',
    'wage_verification',
    'satisfaction_survey'
  )),
  scheduled_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  completed_date DATE,
  completed_by UUID REFERENCES auth.users(id),
  
  -- Results
  result_data JSONB,
  notes TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_schedule_enrollment ON follow_up_schedule(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedule_student ON follow_up_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedule_date ON follow_up_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_schedule_status ON follow_up_schedule(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'APP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate tracking numbers
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all application tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_applications') THEN
    DROP TRIGGER IF EXISTS set_student_tracking_number ON student_applications;
    CREATE TRIGGER set_student_tracking_number
      BEFORE INSERT ON student_applications
      FOR EACH ROW EXECUTE FUNCTION set_tracking_number();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_holder_applications') THEN
    DROP TRIGGER IF EXISTS set_program_holder_tracking_number ON program_holder_applications;
    CREATE TRIGGER set_program_holder_tracking_number
      BEFORE INSERT ON program_holder_applications
      FOR EACH ROW EXECUTE FUNCTION set_tracking_number();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employer_applications') THEN
    DROP TRIGGER IF EXISTS set_employer_tracking_number ON employer_applications;
    CREATE TRIGGER set_employer_tracking_number
      BEFORE INSERT ON employer_applications
      FOR EACH ROW EXECUTE FUNCTION set_tracking_number();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_applications') THEN
    DROP TRIGGER IF EXISTS set_staff_tracking_number ON staff_applications;
    CREATE TRIGGER set_staff_tracking_number
      BEFORE INSERT ON staff_applications
      FOR EACH ROW EXECUTE FUNCTION set_tracking_number();
  END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Employment tracking
ALTER TABLE employment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own employment"
  ON employment_tracking FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all employment"
  ON employment_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage employment"
  ON employment_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Credential verification
ALTER TABLE credential_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own credentials"
  ON credential_verification FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all credentials"
  ON credential_verification FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage credentials"
  ON credential_verification FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Follow-up schedule
ALTER TABLE follow_up_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own follow-ups"
  ON follow_up_schedule FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Staff can view all follow-ups"
  ON follow_up_schedule FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Staff can manage follow-ups"
  ON follow_up_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE employment_tracking IS 'WIOA-compliant employment and wage tracking';
COMMENT ON TABLE credential_verification IS 'State credential verification and tracking';
COMMENT ON TABLE follow_up_schedule IS 'Automated follow-up scheduling for compliance';
COMMENT ON FUNCTION generate_tracking_number IS 'Generate unique application tracking numbers';
