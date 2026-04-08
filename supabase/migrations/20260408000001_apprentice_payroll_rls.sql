-- Enable RLS on apprentice_payroll table.
-- Previously had no row-level security — any authenticated user could read all payroll rows.
-- Admin/staff can read all rows. Students can only read their own.

ALTER TABLE public.apprentice_payroll ENABLE ROW LEVEL SECURITY;

-- Admins and staff can read all payroll records
CREATE POLICY "payroll_admin_read" ON public.apprentice_payroll
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- Admins and staff can write payroll records
CREATE POLICY "payroll_admin_write" ON public.apprentice_payroll
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- Students can read only their own payroll records
CREATE POLICY "payroll_student_read_own" ON public.apprentice_payroll
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());
