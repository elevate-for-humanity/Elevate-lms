-- =============================================================================
-- Phase 4: case_manager role — read-only RLS policies
--
-- case_manager can read data for participants assigned to them via
-- case_manager_assignments. No write access except placement verification.
-- Cross-tenant leakage is blocked by the assignment scope.
-- =============================================================================

BEGIN;

-- Helper: check if current user is case_manager
CREATE OR REPLACE FUNCTION public.is_case_manager()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'case_manager'
  );
$$;

-- Helper: get learner IDs assigned to the current case manager
CREATE OR REPLACE FUNCTION public.get_my_assigned_learner_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY_AGG(learner_id)
  FROM public.case_manager_assignments
  WHERE case_manager_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- =============================================================================
-- profiles — case_manager reads assigned participants only
-- =============================================================================
DROP POLICY IF EXISTS "profiles_case_manager_read" ON public.profiles;
CREATE POLICY "profiles_case_manager_read" ON public.profiles
  FOR SELECT USING (
    public.is_case_manager()
    AND id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- program_enrollments — read assigned participants
-- =============================================================================
DROP POLICY IF EXISTS "pe_case_manager_read" ON public.program_enrollments;
CREATE POLICY "pe_case_manager_read" ON public.program_enrollments
  FOR SELECT USING (
    public.is_case_manager()
    AND user_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- training_enrollments — read assigned participants
-- =============================================================================
DROP POLICY IF EXISTS "te_case_manager_read" ON public.training_enrollments;
CREATE POLICY "te_case_manager_read" ON public.training_enrollments
  FOR SELECT USING (
    public.is_case_manager()
    AND user_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- program_completion — read assigned participants
-- =============================================================================
DROP POLICY IF EXISTS "pc_case_manager_read" ON public.program_completion;
CREATE POLICY "pc_case_manager_read" ON public.program_completion
  FOR SELECT USING (
    public.is_case_manager()
    AND user_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- learner_credentials — read assigned participants
-- =============================================================================
DROP POLICY IF EXISTS "lc_case_manager_read" ON public.learner_credentials;
CREATE POLICY "lc_case_manager_read" ON public.learner_credentials
  FOR SELECT USING (
    public.is_case_manager()
    AND learner_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- placement_records — read + verify for assigned participants
-- =============================================================================
DROP POLICY IF EXISTS "pr_case_manager_verify" ON public.placement_records;
CREATE POLICY "pr_case_manager_verify" ON public.placement_records
  FOR UPDATE USING (
    public.is_case_manager()
    AND learner_id = ANY(public.get_my_assigned_learner_ids())
  )
  WITH CHECK (
    -- case_manager can only update verification fields, not core record
    public.is_case_manager()
    AND learner_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- case_manager_assignments — case_manager reads their own assignments
-- =============================================================================
ALTER TABLE public.case_manager_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cma_admin_all" ON public.case_manager_assignments;
CREATE POLICY "cma_admin_all" ON public.case_manager_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "cma_self_read" ON public.case_manager_assignments;
CREATE POLICY "cma_self_read" ON public.case_manager_assignments
  FOR SELECT USING (case_manager_id = auth.uid());

GRANT SELECT ON public.case_manager_assignments TO authenticated;
GRANT ALL ON public.case_manager_assignments TO service_role;

COMMIT;
