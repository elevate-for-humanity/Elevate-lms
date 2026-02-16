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
ALTER TABLE rapids_apprentices ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_user ON rapids_apprentices(user_id);
ALTER TABLE rapids_apprentices ADD COLUMN IF NOT EXISTS program_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_program ON rapids_apprentices(program_slug);
ALTER TABLE rapids_apprentices ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_status ON rapids_apprentices(status);
ALTER TABLE rapids_apprentices ADD COLUMN IF NOT EXISTS registration_status TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_apprentices_registration ON rapids_apprentices(registration_status);

-- RAPIDS progress updates (for quarterly reporting)
CREATE TABLE IF NOT EXISTS rapids_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID,
  
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

ALTER TABLE rapids_progress_updates ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_progress_apprentice ON rapids_progress_updates(apprentice_id);
ALTER TABLE rapids_progress_updates ADD COLUMN IF NOT EXISTS reporting_period TEXT;
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

ALTER TABLE rapids_employers ADD COLUMN IF NOT EXISTS fein TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_employers_fein ON rapids_employers(fein);
ALTER TABLE rapids_employers ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_rapids_employers_active ON rapids_employers(is_active);

-- RLS Policies
ALTER TABLE rapids_apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_employers ENABLE ROW LEVEL SECURITY;

-- Admin access to all RAPIDS data
DROP POLICY IF EXISTS "Admins can manage RAPIDS apprentices" ON rapids_apprentices;
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage RAPIDS progress" ON rapids_progress_updates;
CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage RAPIDS submissions" ON rapids_submissions;
CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage RAPIDS employers" ON rapids_employers;
CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own RAPIDS record
DROP POLICY IF EXISTS "Users can view own RAPIDS record" ON rapids_apprentices;
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
