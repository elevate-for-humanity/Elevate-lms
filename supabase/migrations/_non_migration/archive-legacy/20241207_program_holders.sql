-- ============================================================================
-- PROGRAM HOLDERS SYSTEM
-- Tables for managing program holder organizations and their students
-- ============================================================================

-- Program holder organizations
CREATE TABLE IF NOT EXISTS program_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT, -- nonprofit, government, workforce_board, etc.
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'IN',
  zip TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, suspended
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_holders_user ON program_holders(user_id);
CREATE INDEX IF NOT EXISTS idx_program_holders_status ON program_holders(status);

-- Link program holders to their students
CREATE TABLE IF NOT EXISTS program_holder_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES program_holders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, completed, withdrawn, suspended
  completion_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_holder_id, student_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_ph_students_holder ON program_holder_students(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_students_student ON program_holder_students(student_id);
CREATE INDEX IF NOT EXISTS idx_ph_students_program ON program_holder_students(program_id);
CREATE INDEX IF NOT EXISTS idx_ph_students_status ON program_holder_students(status);

-- Program holder applications
CREATE TABLE IF NOT EXISTS program_holder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'IN',
  zip TEXT,
  programs_interested TEXT[],
  estimated_students INTEGER,
  how_heard_about_us TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_applications_user ON program_holder_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ph_applications_status ON program_holder_applications(status);

-- Row Level Security Policies

-- Program holders can view their own record
ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Program holders can view own record"
  ON program_holders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all program holders"
  ON program_holders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert program holders"
  ON program_holders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update program holders"
  ON program_holders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Program holder students policies
ALTER TABLE program_holder_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Program holders can view their students"
  ON program_holder_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holders
      WHERE program_holders.id = program_holder_students.program_holder_id
      AND program_holders.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own records"
  ON program_holder_students FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all program holder students"
  ON program_holder_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Program holders can insert their students"
  ON program_holder_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_holders
      WHERE program_holders.id = program_holder_students.program_holder_id
      AND program_holders.user_id = auth.uid()
      AND program_holders.status = 'approved'
    )
  );

CREATE POLICY "Program holders can update their students"
  ON program_holder_students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM program_holders
      WHERE program_holders.id = program_holder_students.program_holder_id
      AND program_holders.user_id = auth.uid()
    )
  );

-- Program holder applications policies
ALTER TABLE program_holder_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON program_holder_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON program_holder_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON program_holder_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update applications"
  ON program_holder_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to automatically create program holder record when application is approved
CREATE OR REPLACE FUNCTION create_program_holder_from_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO program_holders (
      user_id,
      organization_name,
      organization_type,
      contact_name,
      contact_email,
      contact_phone,
      address,
      city,
      state,
      zip,
      status,
      approved_at,
      approved_by
    ) VALUES (
      NEW.user_id,
      NEW.organization_name,
      NEW.organization_type,
      NEW.contact_name,
      NEW.contact_email,
      NEW.contact_phone,
      NEW.address,
      NEW.city,
      NEW.state,
      NEW.zip,
      'approved',
      NOW(),
      auth.uid()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Update user role to program_holder
    UPDATE profiles
    SET role = 'program_holder'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_approved
  AFTER UPDATE ON program_holder_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_program_holder_from_application();

-- Comments
COMMENT ON TABLE program_holders IS 'Organizations that manage students in training programs';
COMMENT ON TABLE program_holder_students IS 'Links program holders to their enrolled students';
COMMENT ON TABLE program_holder_applications IS 'Applications from organizations to become program holders';
