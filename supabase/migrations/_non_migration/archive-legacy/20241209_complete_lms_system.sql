-- Complete LMS System for Elevate For Humanity
-- Supports: SCORM, JRI, External Partners, AI Instructors, Funding, Apprenticeships
-- Run this migration to create all tables

-- ============================================================================
-- 1. PROGRAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  delivery_mode text DEFAULT 'hybrid', -- 'online', 'in-person', 'hybrid'
  location_state text,
  total_hours integer,
  
  -- Compliance flags
  etpl_status text DEFAULT 'not_submitted', -- 'not_submitted', 'pending', 'approved', 'denied'
  etpl_number text,
  wrg_eligible boolean DEFAULT false,
  wioa_ita_eligible boolean DEFAULT false,
  apprenticeship_flag boolean DEFAULT false,
  jri_required boolean DEFAULT false,
  
  -- Admin organization
  admin_folder_id text, -- Path to ETPL folder in storage
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_slug ON programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_etpl_status ON programs(etpl_status);

-- ============================================================================
-- 2. AI INSTRUCTORS TABLE (Already exists, but ensuring it's here)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  avatar_image_url text,
  cloned_from_user text,
  bio text,
  voice_style text, -- 'inspirational', 'clinical', 'practical', 'mentor'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. MODULES TABLE (Supports 5 types: SCORM, External, JRI, AI, Assignment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  
  title text NOT NULL,
  short_code text,
  description text,
  order_index integer NOT NULL,
  
  -- Module type determines how it's delivered
  module_type text NOT NULL CHECK (module_type IN ('scorm', 'external', 'jri', 'ai', 'assignment')),
  
  -- SCORM-specific fields
  scorm_file_path text, -- Path in Supabase storage: /scorm/{programId}/{moduleId}/
  scorm_version text, -- '1.2', '2004'
  
  -- External partner fields
  external_url text,
  partner_name text,
  
  -- AI instructor fields
  ai_instructor_id uuid REFERENCES ai_instructors(id),
  
  -- General fields
  required boolean DEFAULT true,
  hours integer,
  requires_proof boolean DEFAULT false, -- Does student need to upload certificate?
  passing_score integer DEFAULT 70, -- Percentage needed to pass
  
  implementation_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_program ON modules(program_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(program_id, order_index);
CREATE INDEX IF NOT EXISTS idx_modules_type ON modules(module_type);

-- ============================================================================
-- 4. FUNDING SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS funding_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL, -- 'WRG', 'WIOA-ITA', 'PELL', 'SELF-PAY', etc.
  description text,
  
  -- What does this funding cover?
  covers_tuition boolean DEFAULT false,
  covers_wages boolean DEFAULT false,
  covers_stipend boolean DEFAULT false,
  
  -- Default rates (can be overridden per student)
  default_hourly_rate numeric(10,2),
  default_stipend_amount numeric(10,2),
  reimbursement_percent numeric(5,2), -- For employer reimbursement models
  
  -- Eligibility requirements
  eligibility_notes text,
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funding_sources_code ON funding_sources(code);
CREATE INDEX IF NOT EXISTS idx_funding_sources_active ON funding_sources(active);

-- ============================================================================
-- 5. ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL, -- References auth.users(id)
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  
  -- Enrollment status
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'dropped', 'suspended')),
  
  -- Dates
  start_date date DEFAULT CURRENT_DATE,
  expected_completion_date date,
  actual_completion_date date,
  
  -- Stripe integration
  stripe_checkout_session_id text,
  stripe_customer_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_session ON enrollments(stripe_checkout_session_id);

-- Unique constraint: one active enrollment per student per program
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique_active 
  ON enrollments(student_id, program_id) 
  WHERE status = 'active';

-- ============================================================================
-- 6. STUDENT FUNDING ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_funding_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  funding_source_id uuid REFERENCES funding_sources(id),
  
  -- Manual entry fields (override defaults from funding_sources)
  hourly_wage numeric(10,2),
  stipend_amount numeric(10,2),
  reimbursement_percent numeric(5,2),
  
  -- Employer of record
  employer_of_record text DEFAULT 'Elevate For Humanity',
  employer_ein text,
  
  -- Payment tracking
  total_paid numeric(10,2) DEFAULT 0,
  last_payment_date date,
  
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_funding_enrollment ON student_funding_assignments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_funding_source ON student_funding_assignments(funding_source_id);

-- ============================================================================
-- 7. MODULE PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Progress status
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'awaiting_proof', 'completed', 'failed')),
  
  -- SCORM-specific tracking
  scorm_score numeric(5,2), -- Percentage score
  scorm_completion_status text, -- 'incomplete', 'completed', 'passed', 'failed'
  scorm_session_time interval, -- Total time spent
  scorm_suspend_data text, -- SCORM bookmark data
  
  -- External partner tracking
  external_proof_url text, -- URL to uploaded certificate in Supabase storage
  external_verified_by uuid, -- Admin who verified the certificate
  external_verified_at timestamptz,
  
  -- General tracking
  attempts integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  
  -- Reminders
  last_reminder_sent_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_progress_enrollment ON module_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_status ON module_progress(status);

-- Unique constraint: one progress record per enrollment per module
CREATE UNIQUE INDEX IF NOT EXISTS idx_module_progress_unique 
  ON module_progress(enrollment_id, module_id);

-- ============================================================================
-- 8. APPRENTICESHIPS TABLE (RAPIDS-ready)
-- ============================================================================
CREATE TABLE IF NOT EXISTS apprenticeships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL, -- References auth.users(id)
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- RAPIDS integration
  rapids_id text UNIQUE,
  rapids_status text, -- 'pending', 'active', 'completed', 'cancelled'
  
  -- Hour requirements
  ojl_hours_required integer, -- On-the-Job Learning
  ojl_hours_completed integer DEFAULT 0,
  ri_hours_required integer, -- Related Instruction (classroom)
  ri_hours_completed integer DEFAULT 0,
  
  -- Program holder (employer/sponsor)
  program_holder_id uuid, -- References program_holders table (create separately)
  program_holder_name text,
  
  -- Wage progression
  starting_wage numeric(10,2),
  current_wage numeric(10,2),
  target_wage numeric(10,2),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  
  -- Dates
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprenticeships_student ON apprenticeships(student_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeships_program ON apprenticeships(program_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeships_enrollment ON apprenticeships(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeships_rapids ON apprenticeships(rapids_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeships_status ON apprenticeships(status);

-- ============================================================================
-- 9. PROGRAM HOLDERS TABLE (Barbershops, Clinics, Employers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  
  -- Business information
  business_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text,
  
  -- Address
  address text,
  city text,
  state text,
  zip text,
  
  -- Licensing
  license_number text,
  license_type text,
  license_expiration date,
  
  -- Mentor information
  mentor_name text,
  mentor_license text,
  mentor_years_experience integer,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  
  -- Capacity
  max_apprentices integer DEFAULT 1,
  current_apprentices integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_holders_program ON program_holders(program_id);
CREATE INDEX IF NOT EXISTS idx_program_holders_status ON program_holders(status);
CREATE INDEX IF NOT EXISTS idx_program_holders_email ON program_holders(email);

-- ============================================================================
-- 10. APPRENTICE HOURS LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS apprentice_hours_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id uuid REFERENCES apprenticeships(id) ON DELETE CASCADE,
  program_holder_id uuid REFERENCES program_holders(id),
  
  -- Date and hours
  log_date date NOT NULL,
  ojl_hours numeric(4,2) DEFAULT 0,
  ri_hours numeric(4,2) DEFAULT 0,
  
  -- Services performed (for barber, healthcare, etc.)
  services_performed jsonb, -- { "haircuts": 5, "beard_trims": 3, "client_consultations": 8 }
  
  -- Verification
  notes text,
  verified_by text, -- Mentor name
  verified_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_apprenticeship ON apprentice_hours_log(apprenticeship_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_holder ON apprentice_hours_log(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_date ON apprentice_hours_log(log_date);

-- ============================================================================
-- 11. SERVICE REQUIREMENTS TABLE (State board minimums)
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id uuid REFERENCES apprenticeships(id) ON DELETE CASCADE,
  
  service_type text NOT NULL, -- 'basic_haircuts', 'clipper_cuts', 'patient_care_hours', etc.
  required_count integer NOT NULL,
  completed_count integer DEFAULT 0,
  
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requirements_apprenticeship ON service_requirements(apprenticeship_id);
CREATE INDEX IF NOT EXISTS idx_service_requirements_type ON service_requirements(service_type);

-- Unique constraint: one requirement per service type per apprenticeship
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_requirements_unique 
  ON service_requirements(apprenticeship_id, service_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_funding_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprenticeships ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_hours_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requirements ENABLE ROW LEVEL SECURITY;

-- Public read access for programs, modules, AI instructors
CREATE POLICY "Public can view active programs"
  ON programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view modules"
  ON modules FOR SELECT
  USING (true);

CREATE POLICY "Public can view AI instructors"
  ON ai_instructors FOR SELECT
  USING (true);

CREATE POLICY "Public can view active funding sources"
  ON funding_sources FOR SELECT
  USING (active = true);

-- Students can view their own enrollments and progress
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can view own module progress"
  ON module_progress FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own module progress"
  ON module_progress FOR UPDATE
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own apprenticeships"
  ON apprenticeships FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can view own funding assignments"
  ON student_funding_assignments FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

-- Program holders can view their apprentices
CREATE POLICY "Program holders can view their apprentices"
  ON apprenticeships FOR SELECT
  USING (
    program_holder_id IN (
      SELECT id FROM program_holders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Program holders can log hours"
  ON apprentice_hours_log FOR INSERT
  WITH CHECK (
    program_holder_id IN (
      SELECT id FROM program_holders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admin full access (assumes admin role in user metadata)
CREATE POLICY "Admins have full access to programs"
  ON programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- SEED DEFAULT FUNDING SOURCES
-- ============================================================================

INSERT INTO funding_sources (id, name, code, description, covers_tuition, covers_wages, covers_stipend, default_hourly_rate, active)
VALUES 
  ('f0000001-0001-0001-0001-000000000001', 'Workforce Ready Grant (WRG)', 'WRG', 'Indiana Workforce Ready Grant covering tuition and fees', true, false, false, NULL, true),
  ('f0000002-0002-0002-0002-000000000002', 'WIOA Individual Training Account', 'WIOA-ITA', 'WIOA funding for eligible training programs', true, false, false, NULL, true),
  ('f0000003-0003-0003-0003-000000000003', 'Apprenticeship Wages', 'APPRENTICE-WAGE', 'Employer-paid wages during apprenticeship', false, true, false, 15.00, true),
  ('f0000004-0004-0004-0004-000000000004', 'Training Stipend', 'STIPEND', 'Stipend for students during training', false, false, true, NULL, true),
  ('f0000005-0005-0005-0005-000000000005', 'Self-Pay', 'SELF-PAY', 'Student pays out of pocket', true, false, false, NULL, true),
  ('f0000006-0006-0006-0006-000000000006', 'Pell Grant', 'PELL', 'Federal Pell Grant', true, false, false, NULL, true),
  ('f0000007-0007-0007-0007-000000000007', 'Employer Sponsorship', 'EMPLOYER-SPONSOR', 'Employer pays for employee training', true, false, false, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE programs IS 'All training programs offered by Elevate For Humanity';
COMMENT ON TABLE modules IS 'Course modules supporting SCORM, external partners, JRI, AI, and assignments';
COMMENT ON TABLE enrollments IS 'Student enrollment records per program';
COMMENT ON TABLE module_progress IS 'Student progress through each module';
COMMENT ON TABLE funding_sources IS 'Available funding sources (WRG, WIOA, stipends, etc.)';
COMMENT ON TABLE student_funding_assignments IS 'Funding assigned to specific student enrollments';
COMMENT ON TABLE apprenticeships IS 'Apprenticeship tracking with RAPIDS integration';
COMMENT ON TABLE program_holders IS 'Employers/sponsors hosting apprentices';
COMMENT ON TABLE apprentice_hours_log IS 'Daily hours and services log for apprentices';
COMMENT ON TABLE service_requirements IS 'State board service minimums tracking';

-- ============================================================================
-- FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Function to auto-create module_progress rows when student enrolls
CREATE OR REPLACE FUNCTION create_module_progress_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO module_progress (enrollment_id, module_id, status)
  SELECT NEW.id, m.id, 'not_started'
  FROM modules m
  WHERE m.program_id = NEW.program_id
  AND m.required = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_module_progress
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION create_module_progress_on_enrollment();

-- Function to update apprenticeship hours when log is created
CREATE OR REPLACE FUNCTION update_apprenticeship_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE apprenticeships
  SET 
    ojl_hours_completed = ojl_hours_completed + NEW.ojl_hours,
    ri_hours_completed = ri_hours_completed + NEW.ri_hours,
    updated_at = now()
  WHERE id = NEW.apprenticeship_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_apprenticeship_hours
  AFTER INSERT ON apprentice_hours_log
  FOR EACH ROW
  EXECUTE FUNCTION update_apprenticeship_hours();

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Migration complete! All tables, indexes, RLS policies, and triggers created.
