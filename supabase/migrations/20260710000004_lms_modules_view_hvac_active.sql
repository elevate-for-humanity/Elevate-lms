-- Migration: Create lms_modules unified view + activate training_lessons writes
-- Combines program modules (modules), course modules (course_modules), and
-- staff training modules (staff_training_modules) into a single queryable view.

-- Drop existing object if it exists (use dynamic SQL to handle either view or table)
DO $$
BEGIN
  EXECUTE 'DROP VIEW IF EXISTS public.lms_modules';
EXCEPTION WHEN OTHERS THEN
  EXECUTE 'DROP TABLE IF EXISTS public.lms_modules';
END $$;

-- Create view - query columns that exist in the actual tables
CREATE VIEW public.lms_modules WITH (security_invoker = true) AS
  SELECT 
    m.id, 
    m.title, 
    m.description,
    m.program_id, 
    NULL::uuid AS course_id,
    NULL::uuid AS training_module_id,
    'program' AS source,
    m.order_index,
    m.created_at,
    m.updated_at
  FROM public.modules m
  UNION ALL
  SELECT 
    cm.id, 
    cm.title, 
    cm.description,
    NULL::uuid AS program_id, 
    cm.course_id,
    NULL::uuid AS training_module_id,
    'course' AS source,
    cm.order_index,
    cm.created_at,
    cm.updated_at
  FROM public.course_modules cm
  UNION ALL
  SELECT 
    stm.id, 
    stm.title, 
    stm.description,
    NULL::uuid AS program_id, 
    NULL::uuid AS course_id,
    stm.id AS training_module_id,
    'staff_training' AS source,
    stm.order_index,
    stm.created_at,
    stm.updated_at
  FROM public.staff_training_modules stm;

GRANT SELECT ON public.lms_modules TO authenticated;

-- Enable training_lessons writes for admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'training_lessons' AND policyname = 'training_lessons_admin_write'
  ) THEN
    CREATE POLICY training_lessons_admin_write ON public.training_lessons FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

COMMENT ON VIEW public.lms_modules IS 'Unified module view: program + course + staff training modules.';
