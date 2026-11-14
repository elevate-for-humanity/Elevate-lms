-- SCORM learner data must be owner- or tenant-scoped. Retire permissive
-- authenticated read policies before production SCORM records are populated.

-- scorm_enrollments ---------------------------------------------------------
DROP POLICY IF EXISTS auth_read_scorm_enrollments ON public.scorm_enrollments;
DROP POLICY IF EXISTS admin_bypass_select ON public.scorm_enrollments;
DROP POLICY IF EXISTS admin_bypass_insert ON public.scorm_enrollments;
DROP POLICY IF EXISTS admin_bypass_update ON public.scorm_enrollments;
DROP POLICY IF EXISTS admin_bypass_delete ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_admin ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_view ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_insert ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_update ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_owner_select ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_owner_insert ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_owner_update ON public.scorm_enrollments;
DROP POLICY IF EXISTS scorm_enrollments_admin_all ON public.scorm_enrollments;
DROP POLICY IF EXISTS require_privileged_aal2 ON public.scorm_enrollments;

CREATE POLICY scorm_enrollments_owner_select ON public.scorm_enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY scorm_enrollments_owner_insert ON public.scorm_enrollments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY scorm_enrollments_owner_update ON public.scorm_enrollments
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY scorm_enrollments_admin_all ON public.scorm_enrollments
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = scorm_enrollments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = scorm_enrollments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY require_privileged_aal2 ON public.scorm_enrollments
AS RESTRICTIVE
FOR ALL TO authenticated
USING ((SELECT security_private.privileged_session_mfa_satisfied()))
WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()));

-- scorm_tracking ------------------------------------------------------------
DROP POLICY IF EXISTS auth_read_scorm_tracking ON public.scorm_tracking;
DROP POLICY IF EXISTS admin_bypass_select ON public.scorm_tracking;
DROP POLICY IF EXISTS admin_bypass_insert ON public.scorm_tracking;
DROP POLICY IF EXISTS admin_bypass_update ON public.scorm_tracking;
DROP POLICY IF EXISTS admin_bypass_delete ON public.scorm_tracking;
DROP POLICY IF EXISTS admins_only ON public.scorm_tracking;
DROP POLICY IF EXISTS scorm_tracking_owner_select ON public.scorm_tracking;
DROP POLICY IF EXISTS scorm_tracking_owner_insert ON public.scorm_tracking;
DROP POLICY IF EXISTS scorm_tracking_admin_all ON public.scorm_tracking;
DROP POLICY IF EXISTS require_privileged_aal2 ON public.scorm_tracking;

CREATE POLICY scorm_tracking_owner_select ON public.scorm_tracking
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scorm_enrollments se
    WHERE se.id = scorm_tracking.scorm_enrollment_id
      AND se.user_id = auth.uid()
  )
);

CREATE POLICY scorm_tracking_owner_insert ON public.scorm_tracking
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scorm_enrollments se
    WHERE se.id = scorm_tracking.scorm_enrollment_id
      AND se.user_id = auth.uid()
  )
);

CREATE POLICY scorm_tracking_admin_all ON public.scorm_tracking
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.scorm_enrollments se
      JOIN public.profiles subject ON subject.id = se.user_id
      WHERE se.id = scorm_tracking.scorm_enrollment_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.scorm_enrollments se
      JOIN public.profiles subject ON subject.id = se.user_id
      WHERE se.id = scorm_tracking.scorm_enrollment_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY require_privileged_aal2 ON public.scorm_tracking
AS RESTRICTIVE
FOR ALL TO authenticated
USING ((SELECT security_private.privileged_session_mfa_satisfied()))
WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()));
