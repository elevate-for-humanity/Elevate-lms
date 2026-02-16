-- LOCKDOWN PART 4: Student Learning & Engagement Tables (SMART VERSION)
-- Detects actual column names before creating policies

DO $$
DECLARE
  table_exists BOOLEAN;
  has_user_id BOOLEAN;
  has_student_id BOOLEAN;
  has_author_id BOOLEAN;
  user_column TEXT;
BEGIN
  
  -- ============================================================================
  -- COURSE CONTENT (Public Read for Enrolled Students)
  -- ============================================================================
  
  -- Lessons: Students can read lessons
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lessons') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_lessons" ON public.lessons FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Modules: Students can read modules
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modules') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_modules" ON public.modules FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- ============================================================================
  -- LESSON PROGRESS (Detect column name)
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lesson_progress') INTO table_exists;
  IF table_exists THEN
    -- Detect which column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'student_id') INTO has_student_id;
    
    IF has_student_id THEN
      user_column := 'student_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "users_read_own_lesson_progress" ON public.lesson_progress FOR SELECT TO authenticated USING (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE format('CREATE POLICY "users_insert_own_lesson_progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE format('CREATE POLICY "users_update_own_lesson_progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (%I = auth.uid()) WITH CHECK (%I = auth.uid())', user_column, user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- LEARNING ACTIVITY (Detect column name)
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_activity') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'learning_activity' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'learning_activity' AND column_name = 'student_id') INTO has_student_id;
    
    IF has_student_id THEN
      user_column := 'student_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "users_read_own_activity" ON public.learning_activity FOR SELECT TO authenticated USING (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE format('CREATE POLICY "users_insert_own_activity" ON public.learning_activity FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- CERTIFICATES (Detect column name)
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'certificates') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'student_id') INTO has_student_id;
    
    IF has_student_id THEN
      user_column := 'student_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "users_read_own_certificates" ON public.certificates FOR SELECT TO authenticated USING (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- APPRENTICESHIP HOURS (Detect column name)
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'apprenticeship_hours') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'apprenticeship_hours' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'apprenticeship_hours' AND column_name = 'student_id') INTO has_student_id;
    
    IF has_student_id THEN
      user_column := 'student_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "users_read_own_hours" ON public.apprenticeship_hours FOR SELECT TO authenticated USING (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE format('CREATE POLICY "users_insert_own_hours" ON public.apprenticeship_hours FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE format('CREATE POLICY "users_update_own_hours" ON public.apprenticeship_hours FOR UPDATE TO authenticated USING (%I = auth.uid()) WITH CHECK (%I = auth.uid())', user_column, user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- ATTENDANCE RECORDS (Detect column name)
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'student_id') INTO has_student_id;
    
    IF has_student_id THEN
      user_column := 'student_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "users_read_own_attendance" ON public.attendance_records FOR SELECT TO authenticated USING (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- DISCUSSIONS (Detect column name)
  -- ============================================================================
  
  -- Discussion Threads
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discussion_threads') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_discussions" ON public.discussion_threads FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discussion_threads' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discussion_threads' AND column_name = 'author_id') INTO has_author_id;
    
    IF has_author_id THEN
      user_column := 'author_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "students_create_discussions" ON public.discussion_threads FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- Discussion Posts
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discussion_posts') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_posts" ON public.discussion_posts FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discussion_posts' AND column_name = 'user_id') INTO has_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discussion_posts' AND column_name = 'author_id') INTO has_author_id;
    
    IF has_author_id THEN
      user_column := 'author_id';
    ELSIF has_user_id THEN
      user_column := 'user_id';
    ELSE
      user_column := NULL;
    END IF;
    
    IF user_column IS NOT NULL THEN
      BEGIN
        EXECUTE format('CREATE POLICY "students_create_posts" ON public.discussion_posts FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', user_column);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- STUDY GROUPS
  -- ============================================================================
  
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'study_groups') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_study_groups" ON public.study_groups FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'study_group_members') INTO table_exists;
  IF table_exists THEN
    BEGIN
      EXECUTE 'CREATE POLICY "students_read_group_members" ON public.study_group_members FOR SELECT TO authenticated USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'study_group_members' AND column_name = 'user_id') INTO has_user_id;
    
    IF has_user_id THEN
      BEGIN
        EXECUTE 'CREATE POLICY "students_manage_own_membership" ON public.study_group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      BEGIN
        EXECUTE 'CREATE POLICY "students_leave_groups" ON public.study_group_members FOR DELETE TO authenticated USING (user_id = auth.uid())';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- ============================================================================
  -- GAMIFICATION
  -- ============================================================================
  
  -- User Points
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_points') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_points' AND column_name = 'user_id') INTO has_user_id;
    IF has_user_id THEN
      BEGIN
        EXECUTE 'CREATE POLICY "users_read_own_points" ON public.user_points FOR SELECT TO authenticated USING (user_id = auth.uid())';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- Daily Streaks
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_streaks') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_streaks' AND column_name = 'user_id') INTO has_user_id;
    IF has_user_id THEN
      BEGIN
        EXECUTE 'CREATE POLICY "users_read_own_streaks" ON public.daily_streaks FOR SELECT TO authenticated USING (user_id = auth.uid())';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

  -- Learning Goals
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_goals') INTO table_exists;
  IF table_exists THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'learning_goals' AND column_name = 'user_id') INTO has_user_id;
    IF has_user_id THEN
      BEGIN
        EXECUTE 'CREATE POLICY "users_manage_own_goals" ON public.learning_goals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;

END $$;
