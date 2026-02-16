-- Program Holder Student Access Control
-- Ensures program holders can only see students enrolled in their programs

-- Create program_holder_programs table to track which programs belong to which program holder
CREATE TABLE IF NOT EXISTS program_holder_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL,
  program_slug TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_holder_id, program_slug)
);

CREATE INDEX IF NOT EXISTS idx_program_holder_programs_holder ON program_holder_programs(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_program_holder_programs_slug ON program_holder_programs(program_slug);

-- Enable RLS
ALTER TABLE program_holder_programs ENABLE ROW LEVEL SECURITY;

-- Program holders can view their assigned programs
CREATE POLICY "Program holders can view their programs"
  ON program_holder_programs FOR SELECT
  TO authenticated
  USING (program_holder_id = auth.uid());

-- Admins can manage all program assignments
CREATE POLICY "Admins can manage program assignments"
  ON program_holder_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Update enrollments RLS policy for program holders
DROP POLICY IF EXISTS "Program holders can view students in their programs" ON enrollments;

CREATE POLICY "Program holders can view students in their programs"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'program_holder'
      AND EXISTS (
        SELECT 1 FROM program_holder_programs php
        INNER JOIN courses c ON c.category = php.program_slug OR c.slug LIKE php.program_slug || '%'
        WHERE php.program_holder_id = auth.uid()
        AND c.id = enrollments.course_id
      )
    )
  );

-- Update student_applications RLS for program holders
DROP POLICY IF EXISTS "Program holders can view applications for their programs" ON student_applications;

CREATE POLICY "Program holders can view applications for their programs"
  ON student_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'program_holder'
      AND EXISTS (
        SELECT 1 FROM program_holder_programs php
        WHERE php.program_holder_id = auth.uid()
        AND (
          student_applications.data->>'program_slug' = php.program_slug
          OR student_applications.data->>'program' ILIKE '%' || php.program_slug || '%'
        )
      )
    )
  );

-- Function to assign program to program holder
CREATE OR REPLACE FUNCTION assign_program_to_holder(
  p_holder_id UUID,
  p_program_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  -- Verify the user is a program holder
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_holder_id
    AND role = 'program_holder'
  ) THEN
    RAISE EXCEPTION 'User is not a program holder';
  END IF;

  INSERT INTO program_holder_programs (
    program_holder_id,
    program_slug
  ) VALUES (
    p_holder_id,
    p_program_slug
  )
  ON CONFLICT (program_holder_id, program_slug) DO NOTHING
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

-- Function to get students for program holder
CREATE OR REPLACE FUNCTION get_program_holder_students(p_holder_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  course_id UUID,
  course_title TEXT,
  enrollment_status TEXT,
  progress INTEGER,
  enrolled_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name as student_name,
    p.email as student_email,
    c.id as course_id,
    c.title as course_title,
    e.status as enrollment_status,
    e.progress,
    e.started_at as enrolled_at
  FROM enrollments e
  INNER JOIN profiles p ON p.id = e.user_id
  INNER JOIN courses c ON c.id = e.course_id
  INNER JOIN program_holder_programs php ON (
    c.category = php.program_slug 
    OR c.slug LIKE php.program_slug || '%'
  )
  WHERE php.program_holder_id = p_holder_id
  AND p.role = 'student'
  ORDER BY e.started_at DESC;
END;
$$;

-- Comments
COMMENT ON TABLE program_holder_programs IS 'Maps program holders to their assigned programs for access control';
COMMENT ON FUNCTION assign_program_to_holder IS 'Assigns a program to a program holder for student access';
COMMENT ON FUNCTION get_program_holder_students IS 'Returns all students enrolled in a program holders programs';
