-- Enable RLS on partner_attendance.
-- Table had RLS disabled — any authenticated user could read all weekly hour records.

ALTER TABLE public.partner_attendance ENABLE ROW LEVEL SECURITY;

-- Students see and manage their own records
DO $$ BEGIN CREATE POLICY student_own_attendance ON public.partner_attendance
  FOR ALL
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Partners, staff, and admins see all records
DO $$ BEGIN CREATE POLICY admin_all_attendance ON public.partner_attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'partner')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
