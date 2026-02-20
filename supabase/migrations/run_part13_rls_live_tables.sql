-- RLS policies for 440 live DB tables that lacked migration files
-- Safe to run: uses IF EXISTS and exception handling for duplicates

ALTER TABLE IF EXISTS academic_integrity_violations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_academic_integrity_violations" ON academic_integrity_violations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS accessibility_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_accessibility_preferences" ON accessibility_preferences FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_achievements" ON achievements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS adaptive_learning_paths ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_adaptive_learning_paths" ON adaptive_learning_paths FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS admin_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_admin_alerts" ON admin_alerts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS admin_applications_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_admin_applications_queue" ON admin_applications_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS admin_compliance_status ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_admin_compliance_status" ON admin_compliance_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS affiliate_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_affiliate_applications" ON affiliate_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS affiliate_payouts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_affiliate_payouts" ON affiliate_payouts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS agreements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_agreements" ON agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ai_generated_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ai_generated_courses" ON ai_generated_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ai_instructors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ai_instructors" ON ai_instructors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS alert_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_alert_notifications" ON alert_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS analytics_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_analytics_events" ON analytics_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS api_request_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_api_request_logs" ON api_request_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS application_checklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_application_checklist" ON application_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS application_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_application_submissions" ON application_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_applications" ON applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_hour_totals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hour_totals" ON apprentice_hour_totals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_hours_by_shop ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hours_by_shop" ON apprentice_hours_by_shop FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_hours_by_source ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hours_by_source" ON apprentice_hours_by_source FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_notifications" ON apprentice_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_payroll ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_payroll" ON apprentice_payroll FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_wage_updates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_wage_updates" ON apprentice_wage_updates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprentice_weekly_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_weekly_reports" ON apprentice_weekly_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_enrollments" ON apprenticeship_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_hours ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_hours" ON apprenticeship_hours FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_hours_summary ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_hours_summary" ON apprenticeship_hours_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_intake ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_intake" ON apprenticeship_intake FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_portfolio ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_portfolio" ON apprenticeship_portfolio FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeship_programs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_programs" ON apprenticeship_programs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS apprenticeships ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeships" ON apprenticeships FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS assignment_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_assignment_submissions" ON assignment_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_assignments" ON assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS attendance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_attendance_records" ON attendance_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS audit_snapshot ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_audit_snapshot" ON audit_snapshot FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS badge_definitions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_badge_definitions" ON badge_definitions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_badges" ON badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS barber_shops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_barber_shops" ON barber_shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS barbershop_partner_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_barbershop_partner_applications" ON barbershop_partner_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS benefits_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_benefits_enrollments" ON benefits_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS benefits_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_benefits_plans" ON benefits_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS billing_cycles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_billing_cycles" ON billing_cycles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS calendar_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_calendar_events" ON calendar_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS call_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_call_requests" ON call_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS callback_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_callback_requests" ON callback_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS career_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_career_applications" ON career_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS cart_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_cart_items" ON cart_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS case_manager_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_case_manager_assignments" ON case_manager_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS case_managers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_case_managers" ON case_managers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS cash_advances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_cash_advances" ON cash_advances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_certificates" ON certificates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS chat_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_chat_conversations" ON chat_conversations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_chat_messages" ON chat_messages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_clients" ON clients FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS cobra_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_cobra_enrollments" ON cobra_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS community_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_community_events" ON community_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS competencies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_competencies" ON competencies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS competency_evidence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_competency_evidence" ON competency_evidence FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS complaints ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_complaints" ON complaints FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS content_approvals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_content_approvals" ON content_approvals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS content_library ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_content_library" ON content_library FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS content_pages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_content_pages" ON content_pages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS content_sync_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_content_sync_log" ON content_sync_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS conversions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_conversions" ON conversions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_access ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_access" ON course_access FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_competencies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_competencies" ON course_competencies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_credentials" ON course_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_modules" ON course_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_recommendations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_recommendations" ON course_recommendations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_syllabi ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_syllabi" ON course_syllabi FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_tasks" ON course_tasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_templates" ON course_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_courses" ON courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS credential_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_credential_submissions" ON credential_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS credential_verification ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_credential_verification" ON credential_verification FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS credentialing_partners ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_credentialing_partners" ON credentialing_partners FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_credentials" ON credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS credentials_attained ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_credentials_attained" ON credentials_attained FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS critical_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_critical_audit_logs" ON critical_audit_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS crm_interactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_crm_interactions" ON crm_interactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS cross_tenant_access ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_cross_tenant_access" ON cross_tenant_access FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS customer_service_protocols ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_customer_service_protocols" ON customer_service_protocols FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS customer_service_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_customer_service_tickets" ON customer_service_tickets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS daily_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_daily_activities" ON daily_activities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS data_retention_policies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_data_retention_policies" ON data_retention_policies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS data_sharing_agreements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_data_sharing_agreements" ON data_sharing_agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS delegate_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_delegate_assignments" ON delegate_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS delegates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_delegates" ON delegates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS delivery_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_delivery_logs" ON delivery_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_departments" ON departments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS dependents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_dependents" ON dependents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS digital_purchases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_digital_purchases" ON digital_purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS direct_deposit_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_direct_deposit_accounts" ON direct_deposit_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS discussion_forums ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_forums" ON discussion_forums FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS discussion_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_posts" ON discussion_posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS discussion_threads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_threads" ON discussion_threads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS dmca_takedown_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_dmca_takedown_requests" ON dmca_takedown_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS document_audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_document_audit_log" ON document_audit_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS document_signatures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_document_signatures" ON document_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS donations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_donations" ON donations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ecr_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ecr_snapshots" ON ecr_snapshots FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS email_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_email_notifications" ON email_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS email_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_email_queue" ON email_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employee_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employee_documents" ON employee_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employee_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employee_goals" ON employee_goals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employees" ON employees FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employer_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employer_applications" ON employer_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employer_onboarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employer_onboarding" ON employer_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employer_sponsors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employer_sponsors" ON employer_sponsors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employers" ON employers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS employment_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_employment_tracking" ON employment_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_agreements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_agreements" ON enrollment_agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_idempotency ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_idempotency" ON enrollment_idempotency FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_payments" ON enrollment_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_status_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_status_history" ON enrollment_status_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_steps" ON enrollment_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollment_transitions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_transitions" ON enrollment_transitions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_enrollments" ON enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS entities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_entities" ON entities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS etpl_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_etpl_metrics" ON etpl_metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS event_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_event_registrations" ON event_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS external_lms_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_external_lms_enrollments" ON external_lms_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS external_module_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_external_module_progress" ON external_module_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS external_modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_external_modules" ON external_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS external_partner_modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_external_partner_modules" ON external_partner_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS external_partner_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_external_partner_progress" ON external_partner_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS failed_login_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_failed_login_attempts" ON failed_login_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_access_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_access_log" ON ferpa_access_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_compliance_checklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_compliance_checklist" ON ferpa_compliance_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_consent_forms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_consent_forms" ON ferpa_consent_forms FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_disclosure_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_disclosure_log" ON ferpa_disclosure_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_student_acknowledgments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_student_acknowledgments" ON ferpa_student_acknowledgments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_training_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_training_records" ON ferpa_training_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ferpa_violation_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_violation_reports" ON ferpa_violation_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS followup_schedule ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_followup_schedule" ON followup_schedule FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forum_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forum_comments" ON forum_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forum_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forum_posts" ON forum_posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forum_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forum_reactions" ON forum_reactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forum_threads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forum_threads" ON forum_threads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forum_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forum_votes" ON forum_votes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS forums ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_forums" ON forums FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS franchises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_franchises" ON franchises FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS funding_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_funding_applications" ON funding_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS funding_cases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_funding_cases" ON funding_cases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS funding_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_funding_payments" ON funding_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS grade_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_grade_records" ON grade_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS grant_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_grant_sources" ON grant_sources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS help_articles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_help_articles" ON help_articles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS help_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_help_categories" ON help_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS holidays ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_holidays" ON holidays FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS hour_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_hour_tracking" ON hour_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS hsi_enrollment_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_hsi_enrollment_queue" ON hsi_enrollment_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS income_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_income_sources" ON income_sources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS indiana_hour_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_hour_categories" ON indiana_hour_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS indiana_timeclock_daily_export ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_timeclock_daily_export" ON indiana_timeclock_daily_export FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS indiana_timeclock_weekly_summary_export ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_timeclock_weekly_summary_export" ON indiana_timeclock_weekly_summary_export FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS individual_employment_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_individual_employment_plans" ON individual_employment_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS interactive_elements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_interactive_elements" ON interactive_elements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS interactive_quizzes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_interactive_quizzes" ON interactive_quizzes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_invoices" ON invoices FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ip_access_control ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ip_access_control" ON ip_access_control FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS job_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_job_applications" ON job_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS job_placements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_job_placements" ON job_placements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS job_postings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_job_postings" ON job_postings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS job_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_job_queue" ON job_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS leaderboard_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_leaderboard_entries" ON leaderboard_entries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learner_compliance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learner_compliance" ON learner_compliance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_activity ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_activity" ON learning_activity FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_activity_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_activity_streaks" ON learning_activity_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_analytics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_analytics" ON learning_analytics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_paths ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_paths" ON learning_paths FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_streaks" ON learning_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS leave_balances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_leave_balances" ON leave_balances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS leave_policies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_leave_policies" ON leave_policies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS leave_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_leave_requests" ON leave_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS legal_actions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_legal_actions" ON legal_actions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS lesson_content_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_lesson_content_blocks" ON lesson_content_blocks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS lesson_resources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_lesson_resources" ON lesson_resources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS license_purchases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_license_purchases" ON license_purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS license_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_license_requests" ON license_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS license_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_license_usage" ON license_usage FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS license_usage_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_license_usage_log" ON license_usage_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS license_violations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_license_violations" ON license_violations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS live_class_attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_live_class_attendance" ON live_class_attendance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS live_classes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_live_classes" ON live_classes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS lms_organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_lms_organizations" ON lms_organizations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS lms_sync_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_lms_sync_log" ON lms_sync_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS makeup_work_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_makeup_work_requests" ON makeup_work_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS marketing_campaign_sends ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_campaign_sends" ON marketing_campaign_sends FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS marketing_campaigns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_campaigns" ON marketing_campaigns FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS marketing_contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_contacts" ON marketing_contacts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS marketplace_creators ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_marketplace_creators" ON marketplace_creators FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS marketplace_sales ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_marketplace_sales" ON marketplace_sales FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS media ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_media" ON media FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS meeting_action_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_meeting_action_items" ON meeting_action_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS meeting_recaps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_meeting_recaps" ON meeting_recaps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_messages" ON messages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS migration_audit ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_migration_audit" ON migration_audit FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS milady_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_milady_enrollments" ON milady_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS moderation_actions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_actions" ON moderation_actions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS moderation_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_reports" ON moderation_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS moderation_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_rules" ON moderation_rules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_modules" ON modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS monitoring_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_monitoring_alerts" ON monitoring_alerts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS mou_signatures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_mou_signatures" ON mou_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS mou_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_mou_templates" ON mou_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS nds_course_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_nds_course_catalog" ON nds_course_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS notification_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_notification_log" ON notification_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS notification_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_notification_logs" ON notification_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_notifications" ON notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ojt_hours_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_hours_log" ON ojt_hours_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ojt_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_logs" ON ojt_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS ojt_reimbursements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_reimbursements" ON ojt_reimbursements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS onboarding_checklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_checklist" ON onboarding_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS onboarding_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_documents" ON onboarding_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS onboarding_packets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_packets" ON onboarding_packets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS onboarding_signatures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_signatures" ON onboarding_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS onboarding_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_steps" ON onboarding_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS open_timeclock_shifts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_open_timeclock_shifts" ON open_timeclock_shifts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_order_items" ON order_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_orders" ON orders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS org_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_org_invites" ON org_invites FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS organization_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_organization_subscriptions" ON organization_subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS organization_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_organization_users" ON organization_users FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_organizations" ON organizations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS page_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_page_views" ON page_views FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS participant_demographics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_participant_demographics" ON participant_demographics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS participant_eligibility ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_participant_eligibility" ON participant_eligibility FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_certificates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_certificates" ON partner_certificates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_completions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_completions" ON partner_completions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_course_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_course_enrollments" ON partner_course_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_course_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_course_mappings" ON partner_course_mappings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_courses" ON partner_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_courses_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_courses_catalog" ON partner_courses_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_credentials" ON partner_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_enrollment_summary ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_enrollment_summary" ON partner_enrollment_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_enrollments" ON partner_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_inquiries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_inquiries" ON partner_inquiries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_lms_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_courses" ON partner_lms_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_enrollment_failures" ON partner_lms_enrollment_failures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_lms_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_enrollments" ON partner_lms_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_lms_providers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_providers" ON partner_lms_providers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_program_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_program_courses" ON partner_program_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_shops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_shops" ON partner_shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS password_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_password_history" ON password_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS pay_stubs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_pay_stubs" ON pay_stubs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS payment_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_payment_plans" ON payment_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS payment_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_payment_records" ON payment_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS payout_rate_configs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_payout_rate_configs" ON payout_rate_configs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS payroll_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_payroll_profiles" ON payroll_profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS payroll_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_payroll_runs" ON payroll_runs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS peer_review_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_peer_review_assignments" ON peer_review_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS peer_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_peer_reviews" ON peer_reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS performance_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_performance_metrics" ON performance_metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS performance_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_performance_reviews" ON performance_reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS permission_audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_permission_audit_log" ON permission_audit_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS permission_group_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_permission_group_members" ON permission_group_members FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS permission_groups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_permission_groups" ON permission_groups FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_permissions" ON permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS phone_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_phone_logs" ON phone_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS platform_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_platform_stats" ON platform_stats FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS point_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_point_transactions" ON point_transactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS positions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_positions" ON positions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS process_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_process_steps" ON process_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS processed_stripe_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_processed_stripe_events" ON processed_stripe_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS processes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_processes" ON processes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS proctored_exams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_proctored_exams" ON proctored_exams FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS proctoring_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_proctoring_sessions" ON proctoring_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS product_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_product_reports" ON product_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_products" ON products FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_profiles" ON profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_catalog" ON program_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_courses" ON program_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_applications" ON program_holder_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_documents" ON program_holder_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_notes" ON program_holder_notes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_payouts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_payouts" ON program_holder_payouts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_students ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_students" ON program_holder_students FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holder_verification ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_verification" ON program_holder_verification FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_holders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_holders" ON program_holders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_licenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_licenses" ON program_licenses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_partner_lms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_partner_lms" ON program_partner_lms FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_required_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_required_courses" ON program_required_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS program_revenue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_program_revenue" ON program_revenue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS programs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_programs" ON programs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS provisioning_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_provisioning_events" ON provisioning_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_purchases" ON purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS push_notification_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_push_notification_tokens" ON push_notification_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS push_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_push_tokens" ON push_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS qa_checklist_completions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_qa_checklist_completions" ON qa_checklist_completions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS qa_checklists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_qa_checklists" ON qa_checklists FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS quarterly_performance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_quarterly_performance" ON quarterly_performance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS quiz_answer_options ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_quiz_answer_options" ON quiz_answer_options FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS rapids_apprentice_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_apprentice_data" ON rapids_apprentice_data FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS rapids_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_registrations" ON rapids_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS rapids_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_tracking" ON rapids_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS referral_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_referral_codes" ON referral_codes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_referrals" ON referrals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS refund_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_refund_tracking" ON refund_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS refunds ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_refunds" ON refunds FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS resource_downloads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_resource_downloads" ON resource_downloads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_reviews" ON reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS role_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_role_templates" ON role_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS salary_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_salary_history" ON salary_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sap_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sap_records" ON sap_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_completion_summary ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_completion_summary" ON scorm_completion_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_enrollments" ON scorm_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_packages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_packages" ON scorm_packages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_registrations" ON scorm_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_state ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_state" ON scorm_state FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scorm_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_tracking" ON scorm_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS scraping_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_scraping_attempts" ON scraping_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS security_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_security_audit_logs" ON security_audit_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS service_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_service_tickets" ON service_tickets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sfc_tax_return_public_status ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_return_public_status" ON sfc_tax_return_public_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sfc_tax_return_public_status_v2 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_return_public_status_v2" ON sfc_tax_return_public_status_v2 FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sfc_tax_returns_public_lookup ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_returns_public_lookup" ON sfc_tax_returns_public_lookup FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shift_schedules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shift_schedules" ON shift_schedules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_applications" ON shop_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_categories" ON shop_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_document_requirements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_document_requirements" ON shop_document_requirements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_documents" ON shop_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_onboarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_onboarding" ON shop_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_orders" ON shop_orders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_placements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_placements" ON shop_placements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_products" ON shop_products FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_reports" ON shop_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_required_docs_status ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_required_docs_status" ON shop_required_docs_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_signatures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_signatures" ON shop_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_staff ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_staff" ON shop_staff FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shop_supervisors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shop_supervisors" ON shop_supervisors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS shops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_shops" ON shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS signatures ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_signatures" ON signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sms_reminders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sms_reminders" ON sms_reminders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS social_media_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_social_media_accounts" ON social_media_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS social_media_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_social_media_queue" ON social_media_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sso_connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sso_connections" ON sso_connections FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sso_login_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sso_login_attempts" ON sso_login_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sso_providers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sso_providers" ON sso_providers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS sso_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_sso_sessions" ON sso_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS staff_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_staff_applications" ON staff_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS staff_processes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_staff_processes" ON staff_processes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS staff_training_modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_staff_training_modules" ON staff_training_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS staff_training_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_staff_training_progress" ON staff_training_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS state_board_readiness ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_state_board_readiness" ON state_board_readiness FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS state_compliance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_state_compliance" ON state_compliance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS store_branding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_store_branding" ON store_branding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS store_instances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_store_instances" ON store_instances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_applications" ON student_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_badges" ON student_badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_credentials" ON student_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_next_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_next_steps" ON student_next_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_onboarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_onboarding" ON student_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_points ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_points" ON student_points FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_progress" ON student_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS student_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_student_records" ON student_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_students" ON students FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_chat_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_chat_history" ON studio_chat_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_comments" ON studio_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_commit_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_commit_cache" ON studio_commit_cache FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_deploy_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_deploy_tokens" ON studio_deploy_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_favorites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_favorites" ON studio_favorites FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_recent_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_recent_files" ON studio_recent_files FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_repos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_repos" ON studio_repos FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_sessions" ON studio_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_settings" ON studio_settings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS studio_shares ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_studio_shares" ON studio_shares FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supersonic_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_applications" ON supersonic_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supersonic_appointments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_appointments" ON supersonic_appointments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supersonic_careers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_careers" ON supersonic_careers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supersonic_tax_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_tax_documents" ON supersonic_tax_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supersonic_training_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_training_keys" ON supersonic_training_keys FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS supportive_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_supportive_services" ON supportive_services FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tasks" ON tasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_applications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_applications" ON tax_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_calculations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_calculations" ON tax_calculations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_document_uploads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_document_uploads" ON tax_document_uploads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_documents" ON tax_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_filings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_filings" ON tax_filings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_intake ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_intake" ON tax_intake FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_payments" ON tax_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tax_withholdings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tax_withholdings" ON tax_withholdings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_branding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_branding" ON tenant_branding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_invitations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_invitations" ON tenant_invitations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_licenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_licenses" ON tenant_licenses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_members" ON tenant_members FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_memberships ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_memberships" ON tenant_memberships FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_settings" ON tenant_settings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_stripe_customers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_stripe_customers" ON tenant_stripe_customers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_subscriptions" ON tenant_subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_usage" ON tenant_usage FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenant_usage_daily ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_usage_daily" ON tenant_usage_daily FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_tenants" ON tenants FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_time_entries" ON time_entries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS timeclock_cron_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_timeclock_cron_runs" ON timeclock_cron_runs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS timeclock_ui_state ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_timeclock_ui_state" ON timeclock_ui_state FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS timesheets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_timesheets" ON timesheets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS training_courses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_training_courses" ON training_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS training_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_training_enrollments" ON training_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS training_lessons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_training_lessons" ON training_lessons FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS training_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_training_progress" ON training_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS transfer_hour_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_transfer_hour_requests" ON transfer_hour_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS trial_signups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_trial_signups" ON trial_signups FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS two_factor_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_two_factor_attempts" ON two_factor_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS two_factor_auth ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_two_factor_auth" ON two_factor_auth FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS unauthorized_access_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_unauthorized_access_log" ON unauthorized_access_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS uploaded_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_uploaded_documents" ON uploaded_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_activity_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_activity_events" ON user_activity_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_badges" ON user_badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_capabilities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_capabilities" ON user_capabilities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_onboarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_onboarding" ON user_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_permissions" ON user_permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_points ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_points" ON user_points FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_progress" ON user_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_resumes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_resumes" ON user_resumes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_sessions" ON user_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_streaks" ON user_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS user_tutorials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_user_tutorials" ON user_tutorials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_users" ON users FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS vendor_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_vendor_payments" ON vendor_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS verify_audit ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_verify_audit" ON verify_audit FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS video_captions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_video_captions" ON video_captions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS video_chapters ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_video_chapters" ON video_chapters FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS video_transcripts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_video_transcripts" ON video_transcripts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS vita_appointments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_vita_appointments" ON vita_appointments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS voicemails ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_voicemails" ON voicemails FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS webhook_deliveries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_webhook_deliveries" ON webhook_deliveries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS webhooks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_webhooks" ON webhooks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS welcome_packets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_welcome_packets" ON welcome_packets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS wioa_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_wioa_services" ON wioa_services FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS withdrawals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_withdrawals" ON withdrawals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS workone_checklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_workone_checklist" ON workone_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS wotc_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_wotc_tracking" ON wotc_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS xapi_statements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_xapi_statements" ON xapi_statements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
