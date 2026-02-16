-- Indiana Barber Apprenticeship Schema Updates
-- Aligns with IPLA requirements and DOL RAPIDS

-- Add transfer hours and required hours to student_enrollments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'transfer_hours') THEN
    ALTER TABLE student_enrollments ADD COLUMN transfer_hours numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'required_hours') THEN
    ALTER TABLE student_enrollments ADD COLUMN required_hours numeric DEFAULT 1500;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'rapids_status') THEN
    ALTER TABLE student_enrollments ADD COLUMN rapids_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'rapids_id') THEN
    ALTER TABLE student_enrollments ADD COLUMN rapids_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'milady_enrolled') THEN
    ALTER TABLE student_enrollments ADD COLUMN milady_enrolled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'milady_enrolled_at') THEN
    ALTER TABLE student_enrollments ADD COLUMN milady_enrolled_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'shop_id') THEN
    ALTER TABLE student_enrollments ADD COLUMN shop_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'supervisor_id') THEN
    ALTER TABLE student_enrollments ADD COLUMN supervisor_id uuid;
  END IF;
END $$;

-- Transfer Hour Requests table
CREATE TABLE IF NOT EXISTS transfer_hour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE CASCADE,
  hours_requested numeric NOT NULL CHECK (hours_requested > 0 AND hours_requested <= 1500),
  hours_approved numeric,
  previous_school_name text NOT NULL,
  previous_school_address text,
  previous_school_phone text,
  previous_school_license text,
  completion_date date,
  documentation_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for transfer_hour_requests
CREATE INDEX IF NOT EXISTS idx_transfer_requests_student ON transfer_hour_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_enrollment ON transfer_hour_requests(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_hour_requests(status);

-- RLS for transfer_hour_requests
ALTER TABLE transfer_hour_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own transfer requests" ON transfer_hour_requests;
CREATE POLICY "Students can view own transfer requests"
  ON transfer_hour_requests FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create transfer requests" ON transfer_hour_requests;
CREATE POLICY "Students can create transfer requests"
  ON transfer_hour_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage transfer requests" ON transfer_hour_requests;
CREATE POLICY "Admins can manage transfer requests"
  ON transfer_hour_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Barber Shops table (for OJT tracking)
CREATE TABLE IF NOT EXISTS barber_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  address text,
  city text,
  state text DEFAULT 'IN',
  zip text,
  phone text,
  email text,
  owner_name text,
  owner_license text,
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_shops_license ON barber_shops(license_number);
CREATE INDEX IF NOT EXISTS idx_barber_shops_approved ON barber_shops(is_approved);

-- RLS for barber_shops
ALTER TABLE barber_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved shops" ON barber_shops;
CREATE POLICY "Anyone can view approved shops"
  ON barber_shops FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Admins can manage shops" ON barber_shops;
CREATE POLICY "Admins can manage shops"
  ON barber_shops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Shop Supervisors table
CREATE TABLE IF NOT EXISTS shop_supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES barber_shops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text,
  phone text,
  license_number text,
  license_type text, -- 'barber', 'master_barber', 'instructor'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supervisors_shop ON shop_supervisors(shop_id);
CREATE INDEX IF NOT EXISTS idx_supervisors_user ON shop_supervisors(user_id);

-- RLS for shop_supervisors
ALTER TABLE shop_supervisors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supervisors can view own record" ON shop_supervisors;
CREATE POLICY "Supervisors can view own record"
  ON shop_supervisors FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage supervisors" ON shop_supervisors;
CREATE POLICY "Admins can manage supervisors"
  ON shop_supervisors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Update apprentice_hours_log to include supervisor approval
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentice_hours_log' AND column_name = 'supervisor_id') THEN
    ALTER TABLE apprentice_hours_log ADD COLUMN supervisor_id uuid REFERENCES shop_supervisors(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentice_hours_log' AND column_name = 'supervisor_approved') THEN
    ALTER TABLE apprentice_hours_log ADD COLUMN supervisor_approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentice_hours_log' AND column_name = 'supervisor_approved_at') THEN
    ALTER TABLE apprentice_hours_log ADD COLUMN supervisor_approved_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentice_hours_log' AND column_name = 'shop_id') THEN
    ALTER TABLE apprentice_hours_log ADD COLUMN shop_id uuid REFERENCES barber_shops(id);
  END IF;
END $$;

-- Indiana IPLA Hour Categories
-- RTI = Related Technical Instruction (Theory - Milady)
-- OJT = On-the-Job Training (Hands-on at shop)
CREATE TABLE IF NOT EXISTS indiana_hour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  hour_type text NOT NULL CHECK (hour_type IN ('RTI', 'OJT')),
  min_hours numeric,
  max_hours numeric,
  created_at timestamptz DEFAULT now()
);

-- Insert Indiana barber hour categories
INSERT INTO indiana_hour_categories (code, name, description, hour_type, min_hours) VALUES
  ('SANITATION', 'Sanitation & Sterilization', 'Health and safety procedures', 'RTI', 75),
  ('HAIR_CUTTING', 'Hair Cutting & Styling', 'Clipper cuts, scissor cuts, fades, tapers', 'OJT', 500),
  ('SHAVING', 'Shaving & Facial Hair', 'Straight razor shaving, beard trimming', 'OJT', 200),
  ('CHEMISTRY', 'Hair & Scalp Chemistry', 'Chemical services, treatments', 'RTI', 50),
  ('BUSINESS', 'Business Practices', 'Shop management, client relations', 'RTI', 25),
  ('STATE_LAW', 'Indiana State Law', 'IPLA regulations, licensing requirements', 'RTI', 10),
  ('PRACTICAL', 'General Practical Training', 'Hands-on client services', 'OJT', 640)
ON CONFLICT (code) DO NOTHING;

-- Milady enrollment tracking
CREATE TABLE IF NOT EXISTS milady_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE CASCADE,
  milady_student_id text,
  milady_email text,
  enrolled_at timestamptz DEFAULT now(),
  courses_completed jsonb DEFAULT '[]',
  certificate_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milady_enrollments_student ON milady_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_milady_enrollments_enrollment ON milady_enrollments(enrollment_id);

-- RLS for milady_enrollments
ALTER TABLE milady_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own milady enrollment" ON milady_enrollments;
CREATE POLICY "Students can view own milady enrollment"
  ON milady_enrollments FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage milady enrollments" ON milady_enrollments;
CREATE POLICY "Admins can manage milady enrollments"
  ON milady_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- RAPIDS registration tracking
CREATE TABLE IF NOT EXISTS rapids_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE CASCADE,
  rapids_id text,
  occupation_code text DEFAULT '39-5011.00', -- Barbers
  sponsor_id text,
  registration_date date,
  expected_completion_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'active', 'completed', 'cancelled')),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rapids_student ON rapids_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_rapids_enrollment ON rapids_registrations(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_rapids_status ON rapids_registrations(status);

-- RLS for rapids_registrations
ALTER TABLE rapids_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own rapids registration" ON rapids_registrations;
CREATE POLICY "Students can view own rapids registration"
  ON rapids_registrations FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage rapids registrations" ON rapids_registrations;
CREATE POLICY "Admins can manage rapids registrations"
  ON rapids_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- State Board Exam Readiness tracking
CREATE TABLE IF NOT EXISTS state_board_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE CASCADE,
  total_hours_completed numeric DEFAULT 0,
  rti_hours_completed numeric DEFAULT 0,
  ojt_hours_completed numeric DEFAULT 0,
  milady_completed boolean DEFAULT false,
  practical_skills_verified boolean DEFAULT false,
  ready_for_exam boolean DEFAULT false,
  exam_scheduled_date date,
  exam_location text,
  written_exam_passed boolean,
  written_exam_date date,
  practical_exam_passed boolean,
  practical_exam_date date,
  license_number text,
  license_issued_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_board_student ON state_board_readiness(student_id);
CREATE INDEX IF NOT EXISTS idx_state_board_enrollment ON state_board_readiness(enrollment_id);

-- RLS for state_board_readiness
ALTER TABLE state_board_readiness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own state board status" ON state_board_readiness;
CREATE POLICY "Students can view own state board status"
  ON state_board_readiness FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage state board status" ON state_board_readiness;
CREATE POLICY "Admins can manage state board status"
  ON state_board_readiness FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Function to calculate apprentice progress
CREATE OR REPLACE FUNCTION calculate_apprentice_progress(p_enrollment_id uuid)
RETURNS TABLE (
  total_hours numeric,
  rti_hours numeric,
  ojt_hours numeric,
  transfer_hours numeric,
  required_hours numeric,
  remaining_hours numeric,
  progress_percentage numeric,
  ready_for_exam boolean
) AS $$
DECLARE
  v_transfer_hours numeric;
  v_required_hours numeric;
BEGIN
  -- Get enrollment settings
  SELECT 
    COALESCE(se.transfer_hours, 0),
    COALESCE(se.required_hours, 1500)
  INTO v_transfer_hours, v_required_hours
  FROM student_enrollments se
  WHERE se.id = p_enrollment_id;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(ahl.minutes) / 60.0, 0) as total_hours,
    COALESCE(SUM(CASE WHEN ahl.hour_type = 'RTI' THEN ahl.minutes ELSE 0 END) / 60.0, 0) as rti_hours,
    COALESCE(SUM(CASE WHEN ahl.hour_type = 'OJT' THEN ahl.minutes ELSE 0 END) / 60.0, 0) as ojt_hours,
    v_transfer_hours as transfer_hours,
    v_required_hours as required_hours,
    GREATEST(v_required_hours - v_transfer_hours - COALESCE(SUM(ahl.minutes) / 60.0, 0), 0) as remaining_hours,
    LEAST((v_transfer_hours + COALESCE(SUM(ahl.minutes) / 60.0, 0)) / v_required_hours * 100, 100) as progress_percentage,
    (v_transfer_hours + COALESCE(SUM(ahl.minutes) / 60.0, 0)) >= v_required_hours as ready_for_exam
  FROM apprentice_hours_log ahl
  WHERE ahl.enrollment_id = p_enrollment_id
    AND ahl.status IN ('APPROVED', 'SUBMITTED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION calculate_apprentice_progress(uuid) TO authenticated;

-- Comments
COMMENT ON TABLE transfer_hour_requests IS 'Requests to transfer hours from previous barber training';
COMMENT ON TABLE barber_shops IS 'Licensed barber shops approved for OJT training';
COMMENT ON TABLE shop_supervisors IS 'Licensed barbers who can supervise apprentices';
COMMENT ON TABLE indiana_hour_categories IS 'Indiana IPLA required hour categories for barber apprenticeship';
COMMENT ON TABLE milady_enrollments IS 'Tracks student enrollment in Milady theory courses';
COMMENT ON TABLE rapids_registrations IS 'DOL RAPIDS apprenticeship registration tracking';
COMMENT ON TABLE state_board_readiness IS 'Tracks student readiness for Indiana state board exam';
