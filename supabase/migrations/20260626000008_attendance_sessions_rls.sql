-- Enable RLS on attendance_sessions and scope to host.
-- Table had RLS disabled — any authenticated user could read all sessions.

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY host_own_sessions ON public.attendance_sessions
  FOR ALL
  USING  (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY admin_all_sessions ON public.attendance_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
