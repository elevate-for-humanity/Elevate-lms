-- ============================================================
-- LMS ACTIVATION CHAIN FIX
-- Fixes the broken enrollment→course→lesson pipeline:
--   1. Grant VIEW permissions to authenticated/anon roles
--   2. Add RLS policies for student read access
--   3. Add program_id to training_courses
--   4. Create trigger: program enrollment → auto-enroll in courses
--   5. Backfill program_id on existing enrollments
-- ============================================================

-- ============================================================
-- 1. GRANT VIEW PERMISSIONS
-- The courses and enrollments VIEWs exist but authenticated
-- users cannot read them (permission denied for view).
-- ============================================================

GRANT SELECT ON courses TO authenticated;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON enrollments TO authenticated;

-- Also grant on lessons view if it exists
DO $$ BEGIN
  EXECUTE 'GRANT SELECT ON lessons TO authenticated';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 2. RLS POLICIES FOR STUDENT READ ACCESS
-- Ensure students can read their own enrollments and
-- all published courses.
-- ============================================================

-- training_enrollments: students read own rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_enrollments' 
    AND policyname = 'students_read_own_enrollments'
  ) THEN
    CREATE POLICY students_read_own_enrollments ON training_enrollments
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- training_enrollments: admins/staff read all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_enrollments' 
    AND policyname = 'staff_read_all_enrollments'
  ) THEN
    CREATE POLICY staff_read_all_enrollments ON training_enrollments
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'staff', 'instructor', 'program_holder')
        )
      );
  END IF;
END $$;

-- training_courses: everyone reads active courses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_courses' 
    AND policyname = 'anyone_read_active_courses'
  ) THEN
    CREATE POLICY anyone_read_active_courses ON training_courses
      FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_courses' 
    AND policyname = 'anon_read_active_courses'
  ) THEN
    CREATE POLICY anon_read_active_courses ON training_courses
      FOR SELECT TO anon
      USING (is_active = true);
  END IF;
END $$;

-- lesson_progress: students read/write own progress
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lesson_progress' 
    AND policyname = 'students_read_own_progress'
  ) THEN
    CREATE POLICY students_read_own_progress ON lesson_progress
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lesson_progress' 
    AND policyname = 'students_write_own_progress'
  ) THEN
    CREATE POLICY students_write_own_progress ON lesson_progress
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lesson_progress' 
    AND policyname = 'students_update_own_progress'
  ) THEN
    CREATE POLICY students_update_own_progress ON lesson_progress
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 3. ADD program_id TO training_courses
-- Links courses to programs so we can auto-enroll.
-- ============================================================

ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
CREATE INDEX IF NOT EXISTS idx_training_courses_program_id ON training_courses(program_id);

-- ============================================================
-- 4. AUTO-ENROLL TRIGGER
-- When a training_enrollment is inserted with a program_id,
-- automatically set course_id to the first active course
-- in that program (if not already set).
-- ============================================================

CREATE OR REPLACE FUNCTION auto_enroll_course_from_program()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Only act if program_id is set and course_id is null
  IF NEW.program_id IS NOT NULL AND NEW.course_id IS NULL THEN
    SELECT id INTO v_course_id
    FROM training_courses
    WHERE program_id = NEW.program_id
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_course_id IS NOT NULL THEN
      NEW.course_id := v_course_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_enroll_course ON training_enrollments;
CREATE TRIGGER trg_auto_enroll_course
  BEFORE INSERT ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_course_from_program();

-- ============================================================
-- 5. BACKFILL: Link existing enrollments to programs
-- Match enrollments to programs via the course they're in.
-- Since program_id on enrollments is NULL, we try to match
-- via course_id → training_courses.program_id (once set).
-- For now, match by program_slug if available.
-- ============================================================

-- First, try to link courses to programs by name matching
UPDATE training_courses tc
SET program_id = p.id
FROM programs p
WHERE tc.program_id IS NULL
  AND (
    LOWER(tc.course_name) LIKE '%' || LOWER(SPLIT_PART(p.name, ' ', 1)) || '%'
    OR LOWER(p.name) LIKE '%' || LOWER(SPLIT_PART(tc.course_name, ' ', 1)) || '%'
  );

-- Then backfill enrollment program_id from course → program link
UPDATE training_enrollments te
SET program_id = tc.program_id
FROM training_courses tc
WHERE te.course_id = tc.id
  AND te.program_id IS NULL
  AND tc.program_id IS NOT NULL;

-- ============================================================
-- 6. ENSURE lessons TABLE/VIEW EXISTS
-- The course player queries 'lessons' but it may not exist.
-- ============================================================

-- Check if lessons table exists, if not create a view from course_modules or similar
DO $$ BEGIN
  -- Try to check if lessons exists
  PERFORM 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'lessons';
  
  IF NOT FOUND THEN
    -- Check if course_modules exists
    PERFORM 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'course_modules';
    
    IF FOUND THEN
      CREATE OR REPLACE VIEW lessons AS
      SELECT 
        id,
        title,
        description,
        course_id,
        order_index,
        duration_minutes,
        content_type,
        content_url,
        is_published,
        created_at,
        updated_at
      FROM course_modules;
      
      GRANT SELECT ON lessons TO authenticated;
      GRANT SELECT ON lessons TO anon;
    ELSE
      -- Create lessons table if nothing exists
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        course_id UUID REFERENCES training_courses(id),
        order_index INTEGER DEFAULT 0,
        duration_minutes INTEGER DEFAULT 0,
        content_type TEXT DEFAULT 'text',
        content_url TEXT,
        content_body TEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      
      ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY lessons_read_all ON lessons
        FOR SELECT TO authenticated
        USING (is_published = true);
      
      CREATE POLICY lessons_read_anon ON lessons
        FOR SELECT TO anon
        USING (is_published = true);
      
      GRANT SELECT ON lessons TO authenticated;
      GRANT SELECT ON lessons TO anon;
    END IF;
  ELSE
    -- Table exists, just ensure grants
    GRANT SELECT ON lessons TO authenticated;
    GRANT SELECT ON lessons TO anon;
  END IF;
END $$;
