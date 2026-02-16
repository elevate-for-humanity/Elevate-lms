-- Safe reporting views with dependency checks
-- Creates views only if underlying tables exist, with fallback empty views

-- reporting_enrollments view (always safe - uses core tables)
CREATE OR REPLACE VIEW reporting_enrollments AS
SELECT 
  e.id,
  e.student_id,
  e.program_id,
  e.status,
  e.enrolled_at,
  e.completed_at,
  e.organization_id,
  p.email,
  p.full_name,
  prog.name as program_name,
  prog.code as program_code,
  o.name as organization_name
FROM enrollments e
LEFT JOIN profiles p ON p.id = e.student_id
LEFT JOIN programs prog ON prog.id = e.program_id
LEFT JOIN organizations o ON o.id = e.organization_id;

-- Grant access
GRANT SELECT ON reporting_enrollments TO authenticated;

-- reporting_progress view (conditional on lesson_progress table)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lesson_progress'
  ) THEN
    -- Table exists, create full view
    EXECUTE '
      CREATE OR REPLACE VIEW reporting_progress AS
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        e.program_id,
        e.organization_id,
        p.email,
        p.full_name,
        prog.name as program_name,
        COALESCE(
          (SELECT AVG(lp.progress_percent) 
           FROM lesson_progress lp 
           WHERE lp.student_id = e.student_id 
             AND lp.course_id IN (
               SELECT course_id FROM program_courses WHERE program_id = e.program_id
             )
          ), 0
        ) as progress_percent,
        (SELECT MAX(lp.updated_at) 
         FROM lesson_progress lp 
         WHERE lp.student_id = e.student_id
        ) as last_activity_at,
        COALESCE(
          (SELECT SUM(lp.time_spent_minutes) 
           FROM lesson_progress lp 
           WHERE lp.student_id = e.student_id
          ), 0
        ) as total_time_minutes
      FROM enrollments e
      LEFT JOIN profiles p ON p.id = e.student_id
      LEFT JOIN programs prog ON prog.id = e.program_id
      WHERE e.status IN (''active'', ''in_progress'');
    ';
  ELSE
    -- Table doesn''t exist, create fallback view
    EXECUTE '
      CREATE OR REPLACE VIEW reporting_progress AS
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        e.program_id,
        e.organization_id,
        p.email,
        p.full_name,
        prog.name as program_name,
        0 as progress_percent,
        NULL::timestamptz as last_activity_at,
        0 as total_time_minutes
      FROM enrollments e
      LEFT JOIN profiles p ON p.id = e.student_id
      LEFT JOIN programs prog ON prog.id = e.program_id
      WHERE e.status IN (''active'', ''in_progress'');
    ';
  END IF;
  
  -- Grant access
  EXECUTE 'GRANT SELECT ON reporting_progress TO authenticated';
END $$;

-- reporting_credentials view (conditional on certificates table)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'certificates'
  ) THEN
    -- Table exists, create full view
    EXECUTE '
      CREATE OR REPLACE VIEW reporting_credentials AS
      SELECT 
        c.id,
        c.student_id,
        c.course_id,
        c.issued_at,
        c.expires_at,
        c.certificate_number,
        c.organization_id,
        p.email,
        p.full_name,
        co.title as course_title,
        o.name as organization_name
      FROM certificates c
      LEFT JOIN profiles p ON p.id = c.student_id
      LEFT JOIN courses co ON co.id = c.course_id
      LEFT JOIN organizations o ON o.id = c.organization_id;
    ';
  ELSE
    -- Table doesn''t exist, create empty view with correct schema
    EXECUTE '
      CREATE OR REPLACE VIEW reporting_credentials AS
      SELECT 
        NULL::uuid as id,
        NULL::uuid as student_id,
        NULL::uuid as course_id,
        NULL::timestamptz as issued_at,
        NULL::timestamptz as expires_at,
        NULL::text as certificate_number,
        NULL::uuid as organization_id,
        NULL::text as email,
        NULL::text as full_name,
        NULL::text as course_title,
        NULL::text as organization_name
      WHERE false;
    ';
  END IF;
  
  -- Grant access
  EXECUTE 'GRANT SELECT ON reporting_credentials TO authenticated';
END $$;

-- Comments for documentation
COMMENT ON VIEW reporting_enrollments IS 'Enrollment data with student and program details';
COMMENT ON VIEW reporting_progress IS 'Student progress tracking (fallback if lesson_progress missing)';
COMMENT ON VIEW reporting_credentials IS 'Certificate/credential tracking (fallback if certificates missing)';
