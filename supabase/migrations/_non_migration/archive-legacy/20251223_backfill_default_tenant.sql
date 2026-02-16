-- Backfill existing rows with default tenant
-- This ensures all existing data belongs to the "efh-core" tenant

-- Get or create default tenant
DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Get existing default tenant or create it
  SELECT id INTO default_tenant_id
  FROM tenants
  WHERE slug = 'efh-core'
  LIMIT 1;

  IF default_tenant_id IS NULL THEN
    INSERT INTO tenants (name, slug, active, license_type, created_at, updated_at)
    VALUES ('Elevate for Humanity', 'efh-core', true, 'enterprise', NOW(), NOW())
    RETURNING id INTO default_tenant_id;
    
    RAISE NOTICE 'Created default tenant: %', default_tenant_id;
  ELSE
    RAISE NOTICE 'Using existing default tenant: %', default_tenant_id;
  END IF;

  -- Backfill profiles (user_profiles table)
  UPDATE profiles
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % profiles', (SELECT COUNT(*) FROM profiles WHERE tenant_id = default_tenant_id);

  -- Backfill programs
  UPDATE programs
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % programs', (SELECT COUNT(*) FROM programs WHERE tenant_id = default_tenant_id);

  -- Backfill enrollments
  UPDATE enrollments
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % enrollments', (SELECT COUNT(*) FROM enrollments WHERE tenant_id = default_tenant_id);

  -- Backfill courses
  UPDATE courses
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % courses', (SELECT COUNT(*) FROM courses WHERE tenant_id = default_tenant_id);

  -- Backfill course_progress
  UPDATE course_progress
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % course_progress records', (SELECT COUNT(*) FROM course_progress WHERE tenant_id = default_tenant_id);

  -- Backfill certifications
  UPDATE certifications
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % certifications', (SELECT COUNT(*) FROM certifications WHERE tenant_id = default_tenant_id);

  -- Backfill job_postings
  UPDATE job_postings
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % job_postings', (SELECT COUNT(*) FROM job_postings WHERE tenant_id = default_tenant_id);

  -- Backfill job_applications
  UPDATE job_applications
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % job_applications', (SELECT COUNT(*) FROM job_applications WHERE tenant_id = default_tenant_id);

  -- Backfill job_placements
  UPDATE job_placements
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % job_placements', (SELECT COUNT(*) FROM job_placements WHERE tenant_id = default_tenant_id);

  -- Backfill compliance_reports
  UPDATE compliance_reports
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % compliance_reports', (SELECT COUNT(*) FROM compliance_reports WHERE tenant_id = default_tenant_id);

  -- Backfill compliance_scores
  UPDATE compliance_scores
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % compliance_scores', (SELECT COUNT(*) FROM compliance_scores WHERE tenant_id = default_tenant_id);

  -- Backfill student_verifications
  UPDATE student_verifications
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % student_verifications', (SELECT COUNT(*) FROM student_verifications WHERE tenant_id = default_tenant_id);

  -- Backfill employers
  UPDATE employers
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % employers', (SELECT COUNT(*) FROM employers WHERE tenant_id = default_tenant_id);

  -- Backfill program_holders
  UPDATE program_holders
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % program_holders', (SELECT COUNT(*) FROM program_holders WHERE tenant_id = default_tenant_id);

  -- Backfill apprentices
  UPDATE apprentices
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % apprentices', (SELECT COUNT(*) FROM apprentices WHERE tenant_id = default_tenant_id);

  -- Backfill apprenticeships
  UPDATE apprenticeships
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % apprenticeships', (SELECT COUNT(*) FROM apprenticeships WHERE tenant_id = default_tenant_id);

END $$;

-- Verify backfill
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM (
    SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'programs', COUNT(*) FROM programs WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'enrollments', COUNT(*) FROM enrollments WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'courses', COUNT(*) FROM courses WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'course_progress', COUNT(*) FROM course_progress WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'certifications', COUNT(*) FROM certifications WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'job_postings', COUNT(*) FROM job_postings WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'job_applications', COUNT(*) FROM job_applications WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'job_placements', COUNT(*) FROM job_placements WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'compliance_reports', COUNT(*) FROM compliance_reports WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'compliance_scores', COUNT(*) FROM compliance_scores WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'student_verifications', COUNT(*) FROM student_verifications WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'employers', COUNT(*) FROM employers WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'program_holders', COUNT(*) FROM program_holders WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'apprentices', COUNT(*) FROM apprentices WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'apprenticeships', COUNT(*) FROM apprenticeships WHERE tenant_id IS NULL
  ) counts
  WHERE count > 0;

  IF null_count > 0 THEN
    RAISE WARNING 'Backfill incomplete: % tables still have NULL tenant_id values', null_count;
  ELSE
    RAISE NOTICE 'Backfill complete: All tables have tenant_id values';
  END IF;
END $$;
