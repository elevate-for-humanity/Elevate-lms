-- Harden financial and credential tables against permissive authenticated
-- reads and same-tenant writes by non-admin users. Server-side service_role
-- processing remains unaffected by RLS.

-- invoices -----------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.invoices;
DROP POLICY IF EXISTS admin_all ON public.invoices;
DROP POLICY IF EXISTS admin_bypass_select ON public.invoices;
DROP POLICY IF EXISTS admin_bypass_insert ON public.invoices;
DROP POLICY IF EXISTS admin_bypass_update ON public.invoices;
DROP POLICY IF EXISTS admin_bypass_delete ON public.invoices;
DROP POLICY IF EXISTS admins_only ON public.invoices;
DROP POLICY IF EXISTS auth_read_invoices ON public.invoices;
DROP POLICY IF EXISTS invoices_tenant_select ON public.invoices;
DROP POLICY IF EXISTS invoices_tenant_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_tenant_update ON public.invoices;
DROP POLICY IF EXISTS invoices_admin_all ON public.invoices;
CREATE POLICY invoices_admin_all ON public.invoices FOR ALL TO authenticated
USING (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()))
WITH CHECK (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()));
-- user_own SELECT remains in force.

-- subscriptions ------------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.subscriptions;
DROP POLICY IF EXISTS admin_bypass_insert ON public.subscriptions;
DROP POLICY IF EXISTS admin_bypass_update ON public.subscriptions;
DROP POLICY IF EXISTS admin_bypass_delete ON public.subscriptions;
DROP POLICY IF EXISTS admins_only ON public.subscriptions;
DROP POLICY IF EXISTS auth_read_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_tenant_select ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_tenant_insert ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_tenant_update ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_admin_all ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_user_read ON public.subscriptions;
CREATE POLICY subscriptions_user_read ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY subscriptions_admin_all ON public.subscriptions FOR ALL TO authenticated
USING (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()))
WITH CHECK (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()));

-- payment_plans ------------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.payment_plans;
DROP POLICY IF EXISTS admin_bypass_insert ON public.payment_plans;
DROP POLICY IF EXISTS admin_bypass_update ON public.payment_plans;
DROP POLICY IF EXISTS admin_bypass_delete ON public.payment_plans;
DROP POLICY IF EXISTS auth_read_payment_plans ON public.payment_plans;
DROP POLICY IF EXISTS payment_plans_admin_all ON public.payment_plans;
DROP POLICY IF EXISTS payment_plans_tenant_select ON public.payment_plans;
DROP POLICY IF EXISTS payment_plans_tenant_insert ON public.payment_plans;
DROP POLICY IF EXISTS payment_plans_tenant_update ON public.payment_plans;
DROP POLICY IF EXISTS payment_plans_user_read ON public.payment_plans;
CREATE POLICY payment_plans_user_read ON public.payment_plans FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY payment_plans_admin_all ON public.payment_plans FOR ALL TO authenticated
USING (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()))
WITH CHECK (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()));

-- billing_cycles -----------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.billing_cycles;
DROP POLICY IF EXISTS admin_bypass_insert ON public.billing_cycles;
DROP POLICY IF EXISTS admin_bypass_update ON public.billing_cycles;
DROP POLICY IF EXISTS admin_bypass_delete ON public.billing_cycles;
DROP POLICY IF EXISTS admins_only ON public.billing_cycles;
DROP POLICY IF EXISTS auth_read_billing_cycles ON public.billing_cycles;
DROP POLICY IF EXISTS billing_cycles_tenant_select ON public.billing_cycles;
DROP POLICY IF EXISTS billing_cycles_tenant_insert ON public.billing_cycles;
DROP POLICY IF EXISTS billing_cycles_tenant_update ON public.billing_cycles;
DROP POLICY IF EXISTS billing_cycles_admin_all ON public.billing_cycles;
CREATE POLICY billing_cycles_admin_all ON public.billing_cycles FOR ALL TO authenticated
USING (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()))
WITH CHECK (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()));

-- credential_submissions ---------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.credential_submissions;
DROP POLICY IF EXISTS admin_bypass_insert ON public.credential_submissions;
DROP POLICY IF EXISTS admin_bypass_update ON public.credential_submissions;
DROP POLICY IF EXISTS admin_bypass_delete ON public.credential_submissions;
DROP POLICY IF EXISTS auth_read_credential_submissions ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_admin_all ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_tenant_select ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_tenant_insert ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_tenant_update ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_user_select ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_user_insert ON public.credential_submissions;
DROP POLICY IF EXISTS credential_submissions_user_update ON public.credential_submissions;
CREATE POLICY credential_submissions_user_select ON public.credential_submissions FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY credential_submissions_user_insert ON public.credential_submissions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND tenant_id = rpc_private.get_current_tenant_id());
CREATE POLICY credential_submissions_user_update ON public.credential_submissions FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND tenant_id = rpc_private.get_current_tenant_id())
WITH CHECK (user_id = auth.uid() AND tenant_id = rpc_private.get_current_tenant_id());
DROP POLICY IF EXISTS credential_submissions_admin_tenant_all ON public.credential_submissions;
CREATE POLICY credential_submissions_admin_tenant_all ON public.credential_submissions FOR ALL TO authenticated
USING (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()))
WITH CHECK (rpc_private.is_super_admin() OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id()));
