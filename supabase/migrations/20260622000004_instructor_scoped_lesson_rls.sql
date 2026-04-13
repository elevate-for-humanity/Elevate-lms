-- Scope instructor read access on course_lessons to assigned programs only.
--
-- Before this migration, instructors had a global read policy on course_lessons
-- (same as admins), meaning any instructor could read quiz_questions and
-- passing_score for every course in the system.
--
-- After this migration:
--   - Admins / super_admin / staff / org_admin: unchanged — read all lessons
--   - Instructors: read only lessons belonging to courses in programs they are
--     assigned to via program_instructors
--   - Learners: unchanged — read published lessons for enrolled courses only
--
-- Join chain: course_lessons.course_id → courses.program_id → program_instructors
--
-- Apply in Supabase Dashboard → SQL Editor.

-- Drop the existing combined admin+instructor policy
DROP POLICY IF EXISTS "course_lessons_admin_read" ON public.course_lessons;

-- Admins/staff: unrestricted read (no instructor role here)
CREATE POLICY "course_lessons_admin_read"
  ON public.course_lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- Instructors: read only lessons for their assigned programs
CREATE POLICY "course_lessons_instructor_read"
  ON public.course_lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.program_instructors pi ON pi.instructor_id = p.id
      JOIN public.courses c ON c.program_id = pi.program_id
      WHERE p.id = auth.uid()
        AND p.role = 'instructor'
        AND c.id = course_lessons.course_id
    )
  );

-- Repeat for course_modules — same scoping logic
DROP POLICY IF EXISTS "course_modules_admin_read" ON public.course_modules;

CREATE POLICY "course_modules_admin_read"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

CREATE POLICY "course_modules_instructor_read"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.program_instructors pi ON pi.instructor_id = p.id
      JOIN public.courses c ON c.program_id = pi.program_id
      WHERE p.id = auth.uid()
        AND p.role = 'instructor'
        AND c.id = course_modules.course_id
    )
  );
