-- apprentice_payroll RLS audit and remediation.
--
-- Found on audit: RLS was already enabled with 7 policies, but one policy
-- (auth_read_apprentice_payroll, qual: true) allowed any authenticated user
-- to SELECT all payroll rows. Dropped that policy.
--
-- Remaining policies use is_admin() for admin/staff access and
-- student_id = auth.uid() for student read-own access.
--
-- Applied directly via Supabase Management API on 2026-04-08.
-- This file documents what was applied; do not re-run.

DROP POLICY IF EXISTS "auth_read_apprentice_payroll" ON public.apprentice_payroll;

-- Verified live policy set after remediation:
-- Admins can manage payroll  | ALL    | is_admin()
-- admin_bypass_select        | SELECT | is_admin()
-- admin_bypass_insert        | INSERT | WITH CHECK is_admin()
-- admin_bypass_update        | UPDATE | is_admin()
-- admin_bypass_delete        | DELETE | is_admin()
-- Users can view own payroll | SELECT | student_id = auth.uid()
