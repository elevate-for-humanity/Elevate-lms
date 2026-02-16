-- Staff Portal RLS Policies
-- Enable staff role to access staff portal features

-- Helper function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- QA Checklists - Staff can view and manage
ALTER TABLE IF EXISTS public.qa_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_qa_checklists" ON public.qa_checklists;
CREATE POLICY "staff_view_qa_checklists" ON public.qa_checklists
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "staff_manage_qa_checklists" ON public.qa_checklists;
CREATE POLICY "staff_manage_qa_checklists" ON public.qa_checklists
  FOR ALL USING (is_staff());

-- QA Checklist Completions - Staff can view and manage
ALTER TABLE IF EXISTS public.qa_checklist_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_qa_completions" ON public.qa_checklist_completions;
CREATE POLICY "staff_view_qa_completions" ON public.qa_checklist_completions
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "staff_manage_qa_completions" ON public.qa_checklist_completions;
CREATE POLICY "staff_manage_qa_completions" ON public.qa_checklist_completions
  FOR ALL USING (is_staff());

-- Staff Processes - Staff can view and manage
ALTER TABLE IF EXISTS public.staff_processes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_processes" ON public.staff_processes;
CREATE POLICY "staff_view_processes" ON public.staff_processes
  FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "staff_manage_processes" ON public.staff_processes;
CREATE POLICY "staff_manage_processes" ON public.staff_processes
  FOR ALL USING (is_staff());

-- Staff can view all students (enrollments)
DROP POLICY IF EXISTS "staff_view_all_enrollments" ON public.enrollments;
CREATE POLICY "staff_view_all_enrollments" ON public.enrollments
  FOR SELECT USING (is_staff());

-- Staff can view all courses
DROP POLICY IF EXISTS "staff_view_all_courses" ON public.courses;
CREATE POLICY "staff_view_all_courses" ON public.courses
  FOR SELECT USING (is_staff());

-- Staff can view all user profiles
DROP POLICY IF EXISTS "staff_view_all_profiles" ON public.profiles;
CREATE POLICY "staff_view_all_profiles" ON public.profiles
  FOR SELECT USING (is_staff());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_checklists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_checklist_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_processes TO authenticated;

COMMENT ON FUNCTION public.is_staff() IS 
  'Check if current user has staff, admin, or super_admin role';
