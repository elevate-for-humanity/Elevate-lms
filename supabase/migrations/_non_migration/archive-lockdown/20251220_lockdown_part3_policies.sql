-- LOCKDOWN PART 3: Add Day-1 Allow Policies
-- Run this third - opens only essential tables
-- Only creates policies for tables that exist

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Profiles: Users can read/update their own
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "users_read_own_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE 'CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Programs: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'programs') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_programs" ON public.programs FOR SELECT TO anon, authenticated USING (is_active = true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Courses: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_courses" ON public.courses FOR SELECT TO anon, authenticated USING (is_published = true OR status = ''published'')';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Partner Courses: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_courses') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_partner_courses" ON public.partner_courses FOR SELECT TO anon, authenticated USING (active = true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Partner Providers: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_lms_providers') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_partner_providers" ON public.partner_lms_providers FOR SELECT TO anon, authenticated USING (active = true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Drug Testing Services: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drug_testing_services') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_drug_testing_services" ON public.drug_testing_services FOR SELECT TO anon, authenticated USING (is_active = true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Drug Testing Training: Public read
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drug_testing_training') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "public_read_drug_testing_training" ON public.drug_testing_training FOR SELECT TO anon, authenticated USING (is_active = true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Applications: Users can create and read their own
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "users_create_applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE 'CREATE POLICY "users_read_own_applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Enrollments: Users can read their own
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "users_read_own_enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id OR auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
  
END $$;
