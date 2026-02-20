-- ============================================================================
-- PHASE 1d: ENABLE RLS ON ALL REMAINING TENANT_ID TABLES (71 tables)
-- ============================================================================
-- Run AFTER run_part19_rls_core_tables.sql
-- Uses the same get_current_tenant_id() and is_super_admin() functions.
-- Standard pattern: tenant-scoped SELECT/INSERT/UPDATE + super_admin bypass.
-- ============================================================================

-- agreements
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY agreements_tenant_select ON agreements FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY agreements_tenant_insert ON agreements FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY agreements_tenant_update ON agreements FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- ai_generated_courses
ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_generated_courses_tenant_select ON ai_generated_courses FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY ai_generated_courses_tenant_insert ON ai_generated_courses FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY ai_generated_courses_tenant_update ON ai_generated_courses FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_tenant_select ON api_keys FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY api_keys_tenant_insert ON api_keys FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY api_keys_tenant_update ON api_keys FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- apprentice_assignments
ALTER TABLE apprentice_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY apprentice_assignments_tenant_select ON apprentice_assignments FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY apprentice_assignments_tenant_insert ON apprentice_assignments FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY apprentice_assignments_tenant_update ON apprentice_assignments FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- apprentice_placements
ALTER TABLE apprentice_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY apprentice_placements_tenant_select ON apprentice_placements FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY apprentice_placements_tenant_insert ON apprentice_placements FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY apprentice_placements_tenant_update ON apprentice_placements FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- attendance_hours
ALTER TABLE attendance_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_hours_tenant_select ON attendance_hours FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY attendance_hours_tenant_insert ON attendance_hours FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY attendance_hours_tenant_update ON attendance_hours FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- benefits_plans
ALTER TABLE benefits_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY benefits_plans_tenant_select ON benefits_plans FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY benefits_plans_tenant_insert ON benefits_plans FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY benefits_plans_tenant_update ON benefits_plans FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- billing_cycles
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_cycles_tenant_select ON billing_cycles FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY billing_cycles_tenant_insert ON billing_cycles FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY billing_cycles_tenant_update ON billing_cycles FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- cohorts
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY cohorts_tenant_select ON cohorts FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY cohorts_tenant_insert ON cohorts FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY cohorts_tenant_update ON cohorts FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- compliance_alerts
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY compliance_alerts_tenant_select ON compliance_alerts FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY compliance_alerts_tenant_insert ON compliance_alerts FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY compliance_alerts_tenant_update ON compliance_alerts FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- compliance_audit_log
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY compliance_audit_log_tenant_select ON compliance_audit_log FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY compliance_audit_log_tenant_insert ON compliance_audit_log FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY compliance_audit_log_tenant_update ON compliance_audit_log FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- content_pages
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_pages_tenant_select ON content_pages FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY content_pages_tenant_insert ON content_pages FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY content_pages_tenant_update ON content_pages FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- credential_submissions
ALTER TABLE credential_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credential_submissions_tenant_select ON credential_submissions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY credential_submissions_tenant_insert ON credential_submissions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY credential_submissions_tenant_update ON credential_submissions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- data_retention_policies
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_retention_policies_tenant_select ON data_retention_policies FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY data_retention_policies_tenant_insert ON data_retention_policies FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY data_retention_policies_tenant_update ON data_retention_policies FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY departments_tenant_select ON departments FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY departments_tenant_insert ON departments FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY departments_tenant_update ON departments FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_tenant_select ON employees FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY employees_tenant_insert ON employees FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY employees_tenant_update ON employees FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- employer_applications
ALTER TABLE employer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY employer_applications_tenant_select ON employer_applications FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY employer_applications_tenant_insert ON employer_applications FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY employer_applications_tenant_update ON employer_applications FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- enrollment_transitions
ALTER TABLE enrollment_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollment_transitions_tenant_select ON enrollment_transitions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY enrollment_transitions_tenant_insert ON enrollment_transitions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY enrollment_transitions_tenant_update ON enrollment_transitions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- franchises
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
CREATE POLICY franchises_tenant_select ON franchises FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY franchises_tenant_insert ON franchises FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY franchises_tenant_update ON franchises FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- handbook_acknowledgments
ALTER TABLE handbook_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY handbook_acknowledgments_tenant_select ON handbook_acknowledgments FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY handbook_acknowledgments_tenant_insert ON handbook_acknowledgments FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY handbook_acknowledgments_tenant_update ON handbook_acknowledgments FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY holidays_tenant_select ON holidays FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY holidays_tenant_insert ON holidays FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY holidays_tenant_update ON holidays FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- intakes
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY intakes_tenant_select ON intakes FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY intakes_tenant_insert ON intakes FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY intakes_tenant_update ON intakes FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_select ON invoices FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY invoices_tenant_insert ON invoices FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY invoices_tenant_update ON invoices FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- ip_access_control
ALTER TABLE ip_access_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY ip_access_control_tenant_select ON ip_access_control FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY ip_access_control_tenant_insert ON ip_access_control FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY ip_access_control_tenant_update ON ip_access_control FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- leave_policies
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY leave_policies_tenant_select ON leave_policies FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY leave_policies_tenant_insert ON leave_policies FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY leave_policies_tenant_update ON leave_policies FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- license_events
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY license_events_tenant_select ON license_events FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_events_tenant_insert ON license_events FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_events_tenant_update ON license_events FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- license_purchases
ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY license_purchases_tenant_select ON license_purchases FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_purchases_tenant_insert ON license_purchases FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_purchases_tenant_update ON license_purchases FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- license_usage
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY license_usage_tenant_select ON license_usage FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_usage_tenant_insert ON license_usage FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_usage_tenant_update ON license_usage FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- license_violations
ALTER TABLE license_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY license_violations_tenant_select ON license_violations FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_violations_tenant_insert ON license_violations FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY license_violations_tenant_update ON license_violations FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- licenses
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY licenses_tenant_select ON licenses FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY licenses_tenant_insert ON licenses FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY licenses_tenant_update ON licenses FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- marketing_campaigns
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketing_campaigns_tenant_select ON marketing_campaigns FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY marketing_campaigns_tenant_insert ON marketing_campaigns FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY marketing_campaigns_tenant_update ON marketing_campaigns FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- marketing_contacts
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketing_contacts_tenant_select ON marketing_contacts FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY marketing_contacts_tenant_insert ON marketing_contacts FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY marketing_contacts_tenant_update ON marketing_contacts FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- moderation_rules
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY moderation_rules_tenant_select ON moderation_rules FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY moderation_rules_tenant_insert ON moderation_rules FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY moderation_rules_tenant_update ON moderation_rules FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY onboarding_progress_tenant_select ON onboarding_progress FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY onboarding_progress_tenant_insert ON onboarding_progress FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY onboarding_progress_tenant_update ON onboarding_progress FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- partner_documents
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_documents_tenant_select ON partner_documents FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_documents_tenant_insert ON partner_documents FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_documents_tenant_update ON partner_documents FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- partner_lms_enrollment_failures
ALTER TABLE partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_lms_enrollment_failures_tenant_select ON partner_lms_enrollment_failures FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_lms_enrollment_failures_tenant_insert ON partner_lms_enrollment_failures FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_lms_enrollment_failures_tenant_update ON partner_lms_enrollment_failures FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- partner_organizations
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_organizations_tenant_select ON partner_organizations FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_organizations_tenant_insert ON partner_organizations FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_organizations_tenant_update ON partner_organizations FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- partner_shops
ALTER TABLE partner_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_shops_tenant_select ON partner_shops FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_shops_tenant_insert ON partner_shops FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_shops_tenant_update ON partner_shops FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- partner_sites
ALTER TABLE partner_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_sites_tenant_select ON partner_sites FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_sites_tenant_insert ON partner_sites FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY partner_sites_tenant_update ON partner_sites FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- payment_plans
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_plans_tenant_select ON payment_plans FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY payment_plans_tenant_insert ON payment_plans FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY payment_plans_tenant_update ON payment_plans FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- payroll_runs
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_runs_tenant_select ON payroll_runs FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY payroll_runs_tenant_insert ON payroll_runs FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY payroll_runs_tenant_update ON payroll_runs FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- permission_groups
ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY permission_groups_tenant_select ON permission_groups FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY permission_groups_tenant_insert ON permission_groups FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY permission_groups_tenant_update ON permission_groups FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY positions_tenant_select ON positions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY positions_tenant_insert ON positions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY positions_tenant_update ON positions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- program_holder_applications
ALTER TABLE program_holder_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY program_holder_applications_tenant_select ON program_holder_applications FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY program_holder_applications_tenant_insert ON program_holder_applications FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY program_holder_applications_tenant_update ON program_holder_applications FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- provisioning_events
ALTER TABLE provisioning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY provisioning_events_tenant_select ON provisioning_events FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY provisioning_events_tenant_insert ON provisioning_events FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY provisioning_events_tenant_update ON provisioning_events FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- rapids_apprentice_data
ALTER TABLE rapids_apprentice_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY rapids_apprentice_data_tenant_select ON rapids_apprentice_data FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY rapids_apprentice_data_tenant_insert ON rapids_apprentice_data FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY rapids_apprentice_data_tenant_update ON rapids_apprentice_data FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- shop_staff
ALTER TABLE shop_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY shop_staff_tenant_select ON shop_staff FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY shop_staff_tenant_insert ON shop_staff FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY shop_staff_tenant_update ON shop_staff FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY shops_tenant_select ON shops FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY shops_tenant_insert ON shops FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY shops_tenant_update ON shops FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- social_media_settings
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_media_settings_tenant_select ON social_media_settings FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY social_media_settings_tenant_insert ON social_media_settings FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY social_media_settings_tenant_update ON social_media_settings FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- sso_providers
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY sso_providers_tenant_select ON sso_providers FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY sso_providers_tenant_insert ON sso_providers FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY sso_providers_tenant_update ON sso_providers FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- staff_applications
ALTER TABLE staff_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_applications_tenant_select ON staff_applications FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY staff_applications_tenant_insert ON staff_applications FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY staff_applications_tenant_update ON staff_applications FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- staff_permissions
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_permissions_tenant_select ON staff_permissions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY staff_permissions_tenant_insert ON staff_permissions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY staff_permissions_tenant_update ON staff_permissions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- student_applications
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_applications_tenant_select ON student_applications FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY student_applications_tenant_insert ON student_applications FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY student_applications_tenant_update ON student_applications FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_tenant_select ON subscriptions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY subscriptions_tenant_insert ON subscriptions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY subscriptions_tenant_update ON subscriptions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tax_clients
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_clients_tenant_select ON tax_clients FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tax_clients_tenant_insert ON tax_clients FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tax_clients_tenant_update ON tax_clients FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tax_payments
ALTER TABLE tax_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_payments_tenant_select ON tax_payments FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tax_payments_tenant_insert ON tax_payments FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tax_payments_tenant_update ON tax_payments FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_branding
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_branding_tenant_select ON tenant_branding FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_branding_tenant_insert ON tenant_branding FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_branding_tenant_update ON tenant_branding FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_domains
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_domains_tenant_select ON tenant_domains FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_domains_tenant_insert ON tenant_domains FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_domains_tenant_update ON tenant_domains FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_invitations
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_invitations_tenant_select ON tenant_invitations FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_invitations_tenant_insert ON tenant_invitations FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_invitations_tenant_update ON tenant_invitations FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_licenses
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_licenses_tenant_select ON tenant_licenses FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_licenses_tenant_insert ON tenant_licenses FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_licenses_tenant_update ON tenant_licenses FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_members
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_members_tenant_select ON tenant_members FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_members_tenant_insert ON tenant_members FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_members_tenant_update ON tenant_members FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_memberships
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_memberships_tenant_select ON tenant_memberships FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_memberships_tenant_insert ON tenant_memberships FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_memberships_tenant_update ON tenant_memberships FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_settings
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_settings_tenant_select ON tenant_settings FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_settings_tenant_insert ON tenant_settings FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_settings_tenant_update ON tenant_settings FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_stripe_customers
ALTER TABLE tenant_stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_stripe_customers_tenant_select ON tenant_stripe_customers FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_stripe_customers_tenant_insert ON tenant_stripe_customers FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_stripe_customers_tenant_update ON tenant_stripe_customers FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_subscriptions
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_subscriptions_tenant_select ON tenant_subscriptions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_subscriptions_tenant_insert ON tenant_subscriptions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_subscriptions_tenant_update ON tenant_subscriptions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_usage
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_usage_tenant_select ON tenant_usage FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_usage_tenant_insert ON tenant_usage FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_usage_tenant_update ON tenant_usage FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- tenant_usage_daily
ALTER TABLE tenant_usage_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_usage_daily_tenant_select ON tenant_usage_daily FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_usage_daily_tenant_insert ON tenant_usage_daily FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY tenant_usage_daily_tenant_update ON tenant_usage_daily FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- training_enrollments
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_enrollments_tenant_select ON training_enrollments FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY training_enrollments_tenant_insert ON training_enrollments FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY training_enrollments_tenant_update ON training_enrollments FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- user_permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_permissions_tenant_select ON user_permissions FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY user_permissions_tenant_insert ON user_permissions FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY user_permissions_tenant_update ON user_permissions FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_tenant_select ON user_roles FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY user_roles_tenant_insert ON user_roles FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY user_roles_tenant_update ON user_roles FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

-- wioa_participant_records
ALTER TABLE wioa_participant_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY wioa_participant_records_tenant_select ON wioa_participant_records FOR SELECT
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY wioa_participant_records_tenant_insert ON wioa_participant_records FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());
CREATE POLICY wioa_participant_records_tenant_update ON wioa_participant_records FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());
