-- Migration: Create lms_modules unified view + activate training_lessons writes
-- Combines program modules (modules), course modules (course_modules), and
-- staff training modules (training_modules) into a single queryable view.

DO $$
BEGIN
  -- Check if modules table has duration_hours column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND table_schema = 'public'
    AND column_name = 'duration_hours'
  ) THEN
    -- View with duration_hours from modules
    EXECUTE $body$
      CREATE OR REPLACE VIEW public.lms_modules WITH (security_invoker = true) AS
        SELECT m.id, m.title, m.description, m.program_id, NULL::uuid AS course_id,
          m.module_type, m.order_index, m.duration_hours, m.is_required,
          m.created_at, m.updated_at, 'program' AS source
        FROM public.modules m
        UNION ALL
        SELECT cm.id, cm.title, cm.description, NULL::uuid AS program_id, cm.course_id,
          'course' AS module_type, cm.order_index, NULL::double precision AS duration_hours,
          true AS is_required, cm.created_at, cm.updated_at, 'course' AS source
        FROM public.course_modules cm
        UNION ALL
        SELECT tm.id, tm.title, tm.description, NULL::uuid AS program_id, NULL::uuid AS course_id,
          'training' AS module_type, tm.order_index, (tm.duration_minutes / 60.0)::double precision AS duration_hours,
          tm.is_required, tm.created_at, tm.updated_at, 'staff_training' AS source
        FROM public.training_modules tm
    $body$;
  ELSE
    -- View without duration_hours from modules
    EXECUTE $body$
      CREATE OR REPLACE VIEW public.lms_modules WITH (security_invoker = true) AS
        SELECT m.id, m.title, m.description, m.program_id, NULL::uuid AS course_id,
          m.module_type, m.order_index, NULL::double precision AS duration_hours, m.is_required,
          m.created_at, m.updated_at, 'program' AS source
        FROM public.modules m
        UNION ALL
        SELECT cm.id, cm.title, cm.description, NULL::uuid AS program_id, cm.course_id,
          'course' AS module_type, cm.order_index, NULL::double precision AS duration_hours,
          true AS is_required, cm.created_at, cm.updated_at, 'course' AS source
        FROM public.course_modules cm
        UNION ALL
        SELECT tm.id, tm.title, tm.description, NULL::uuid AS program_id, NULL::uuid AS course_id,
          'training' AS module_type, tm.order_index, (tm.duration_minutes / 60.0)::double precision AS duration_hours,
          tm.is_required, tm.created_at, tm.updated_at, 'staff_training' AS source
        FROM public.training_modules tm
    $body$;
  END IF;
END $$;

GRANT SELECT ON public.lms_modules TO authenticated;

-- Enable training_lessons writes for admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_lessons'
    AND policyname = 'training_lessons_admin_write'
  ) THEN
    CREATE POLICY training_lessons_admin_write ON public.training_lessons
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
      );
  END IF;
END $$;

COMMENT ON VIEW public.lms_modules IS 'Unified module view: program + course + staff training modules.';
