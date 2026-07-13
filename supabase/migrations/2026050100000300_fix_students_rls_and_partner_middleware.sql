-- Fix 1: Grant SELECT on students to authenticated role so program_holder
-- pages can join student_enrollments → students via FK.
GRANT SELECT ON public.students TO authenticated;

-- Enable RLS on students if not already enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy first to avoid conflicts
DROP POLICY IF EXISTS authenticated_read_students ON public.students;

-- Allow any authenticated user to read students
CREATE POLICY authenticated_read_students ON public.students
  FOR SELECT TO authenticated USING (true);

-- Fix 2: partner_users has an infinite recursion in its RLS policy.
-- Drop all existing policies and replace with non-recursive ones.
GRANT SELECT ON public.partner_users TO authenticated;

ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partner_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.partner_users', pol.policyname);
  END LOOP;
END $$;

-- Users can read their own partner_users rows
CREATE POLICY partner_users_read_own ON public.partner_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all partner_users rows
CREATE POLICY partner_users_admin_read ON public.partner_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );
