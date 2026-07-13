-- RLS for assignment_submissions and support_tickets.
-- These tables had no policies. Both are learner-write surfaces.
-- Apply in Supabase Dashboard → SQL Editor.

-- ── assignment_submissions ────────────────────────────────────────────────────
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_submissions_own_read"   ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_own_insert" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_own_update" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_admin"      ON public.assignment_submissions;

-- Learners can read and write only their own submissions
CREATE POLICY "assignment_submissions_own_read" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "assignment_submissions_own_insert" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assignment_submissions_own_update" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and instructors can read all submissions
CREATE POLICY "assignment_submissions_admin" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'super_admin', 'instructor', 'staff')
    )
  );

-- ── support_tickets ───────────────────────────────────────────────────────────
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_own_read"   ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_own_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin"      ON public.support_tickets;

-- Learners can read their own tickets and create new ones
CREATE POLICY "support_tickets_own_read" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "support_tickets_own_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins and staff can read and update all tickets
CREATE POLICY "support_tickets_admin" ON public.support_tickets
  FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'super_admin', 'staff')
    )
  );
