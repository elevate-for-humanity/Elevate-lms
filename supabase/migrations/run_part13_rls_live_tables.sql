-- RLS policies for 440 live DB tables that lacked migration files
-- Safe to run: uses IF EXISTS and exception handling for duplicates

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='academic_integrity_violations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE academic_integrity_violations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_academic_integrity_violations" ON academic_integrity_violations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='accessibility_preferences' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE accessibility_preferences ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_accessibility_preferences" ON accessibility_preferences FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='achievements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE achievements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_achievements" ON achievements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='adaptive_learning_paths' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE adaptive_learning_paths ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_adaptive_learning_paths" ON adaptive_learning_paths FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='admin_alerts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_admin_alerts" ON admin_alerts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='admin_applications_queue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE admin_applications_queue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_admin_applications_queue" ON admin_applications_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='admin_compliance_status' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE admin_compliance_status ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_admin_compliance_status" ON admin_compliance_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='affiliate_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_affiliate_applications" ON affiliate_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='affiliate_payouts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_affiliate_payouts" ON affiliate_payouts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='agreements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE agreements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_agreements" ON agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ai_generated_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ai_generated_courses" ON ai_generated_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ai_instructors' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ai_instructors ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ai_instructors" ON ai_instructors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='alert_notifications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_alert_notifications" ON alert_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='analytics_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_analytics_events" ON analytics_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='api_request_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_api_request_logs" ON api_request_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='application_checklist' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE application_checklist ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_application_checklist" ON application_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='application_submissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE application_submissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_application_submissions" ON application_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_applications" ON applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_hour_totals' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_hour_totals ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hour_totals" ON apprentice_hour_totals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_hours_by_shop' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_hours_by_shop ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hours_by_shop" ON apprentice_hours_by_shop FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_hours_by_source' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_hours_by_source ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_hours_by_source" ON apprentice_hours_by_source FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_notifications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_notifications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_notifications" ON apprentice_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_payroll' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_payroll ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_payroll" ON apprentice_payroll FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_wage_updates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_wage_updates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_wage_updates" ON apprentice_wage_updates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprentice_weekly_reports' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprentice_weekly_reports ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprentice_weekly_reports" ON apprentice_weekly_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_enrollments" ON apprenticeship_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_hours' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_hours ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_hours" ON apprenticeship_hours FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_hours_summary' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_hours_summary ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_hours_summary" ON apprenticeship_hours_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_intake' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_intake ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_intake" ON apprenticeship_intake FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_portfolio' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_portfolio ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_portfolio" ON apprenticeship_portfolio FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeship_programs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeship_programs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeship_programs" ON apprenticeship_programs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='apprenticeships' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE apprenticeships ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_apprenticeships" ON apprenticeships FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='assignment_submissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_assignment_submissions" ON assignment_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='assignments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE assignments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_assignments" ON assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='attendance_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_attendance_records" ON attendance_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='audit_snapshot' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE audit_snapshot ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_audit_snapshot" ON audit_snapshot FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='badge_definitions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_badge_definitions" ON badge_definitions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='badges' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE badges ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_badges" ON badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='bank_accounts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='barber_shops' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE barber_shops ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_barber_shops" ON barber_shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='barbershop_partner_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE barbershop_partner_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_barbershop_partner_applications" ON barbershop_partner_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='benefits_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE benefits_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_benefits_enrollments" ON benefits_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='benefits_plans' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE benefits_plans ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_benefits_plans" ON benefits_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='billing_cycles' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_billing_cycles" ON billing_cycles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='calendar_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_calendar_events" ON calendar_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='call_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE call_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_call_requests" ON call_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='callback_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_callback_requests" ON callback_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='career_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_career_applications" ON career_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='cart_items' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_cart_items" ON cart_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='case_manager_assignments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE case_manager_assignments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_case_manager_assignments" ON case_manager_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='case_managers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE case_managers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_case_managers" ON case_managers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='cash_advances' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE cash_advances ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_cash_advances" ON cash_advances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='certificates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE certificates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_certificates" ON certificates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='chat_conversations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_chat_conversations" ON chat_conversations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='chat_messages' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_chat_messages" ON chat_messages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='clients' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE clients ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_clients" ON clients FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='cobra_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE cobra_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_cobra_enrollments" ON cobra_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='community_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE community_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_community_events" ON community_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='competencies' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE competencies ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_competencies" ON competencies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='competency_evidence' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE competency_evidence ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_competency_evidence" ON competency_evidence FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='complaints' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE complaints ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_complaints" ON complaints FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='content_approvals' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_content_approvals" ON content_approvals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='content_library' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE content_library ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_content_library" ON content_library FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='content_pages' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_content_pages" ON content_pages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='content_sync_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE content_sync_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_content_sync_log" ON content_sync_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='conversions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE conversions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_conversions" ON conversions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_access' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_access ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_access" ON course_access FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_competencies' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_competencies ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_competencies" ON course_competencies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_credentials' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_credentials ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_credentials" ON course_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_modules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_modules" ON course_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_recommendations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_recommendations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_recommendations" ON course_recommendations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_syllabi' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_syllabi ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_syllabi" ON course_syllabi FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_tasks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_tasks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_tasks" ON course_tasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='course_templates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_course_templates" ON course_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_courses" ON courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='credential_submissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE credential_submissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_credential_submissions" ON credential_submissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='credential_verification' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE credential_verification ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_credential_verification" ON credential_verification FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='credentialing_partners' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE credentialing_partners ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_credentialing_partners" ON credentialing_partners FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='credentials' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE credentials ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_credentials" ON credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='credentials_attained' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE credentials_attained ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_credentials_attained" ON credentials_attained FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='critical_audit_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE critical_audit_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_critical_audit_logs" ON critical_audit_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='crm_interactions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_crm_interactions" ON crm_interactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='cross_tenant_access' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE cross_tenant_access ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_cross_tenant_access" ON cross_tenant_access FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='customer_service_protocols' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE customer_service_protocols ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_customer_service_protocols" ON customer_service_protocols FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='customer_service_tickets' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE customer_service_tickets ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_customer_service_tickets" ON customer_service_tickets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='daily_activities' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_daily_activities" ON daily_activities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='data_retention_policies' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_data_retention_policies" ON data_retention_policies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='data_sharing_agreements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE data_sharing_agreements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_data_sharing_agreements" ON data_sharing_agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='delegate_assignments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE delegate_assignments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_delegate_assignments" ON delegate_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='delegates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE delegates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_delegates" ON delegates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='delivery_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_delivery_logs" ON delivery_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='departments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE departments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_departments" ON departments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='dependents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE dependents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_dependents" ON dependents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='digital_purchases' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE digital_purchases ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_digital_purchases" ON digital_purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='direct_deposit_accounts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE direct_deposit_accounts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_direct_deposit_accounts" ON direct_deposit_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='discussion_forums' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE discussion_forums ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_forums" ON discussion_forums FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='discussion_posts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_posts" ON discussion_posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='discussion_threads' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_discussion_threads" ON discussion_threads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='dmca_takedown_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE dmca_takedown_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_dmca_takedown_requests" ON dmca_takedown_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='document_audit_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_document_audit_log" ON document_audit_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='document_signatures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_document_signatures" ON document_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='donations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE donations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_donations" ON donations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ecr_snapshots' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ecr_snapshots ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ecr_snapshots" ON ecr_snapshots FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='email_notifications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_email_notifications" ON email_notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='email_queue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_email_queue" ON email_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employee_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employee_documents" ON employee_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employee_goals' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employee_goals" ON employee_goals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employees' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employees ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employees" ON employees FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employer_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employer_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employer_applications" ON employer_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employer_onboarding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employer_onboarding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employer_onboarding" ON employer_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employer_sponsors' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employer_sponsors ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employer_sponsors" ON employer_sponsors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employers" ON employers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='employment_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE employment_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_employment_tracking" ON employment_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_agreements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_agreements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_agreements" ON enrollment_agreements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_idempotency' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_idempotency ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_idempotency" ON enrollment_idempotency FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_payments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_payments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_payments" ON enrollment_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_status_history' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_status_history ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_status_history" ON enrollment_status_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_steps' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_steps ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_steps" ON enrollment_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollment_transitions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollment_transitions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollment_transitions" ON enrollment_transitions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_enrollments" ON enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='entities' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE entities ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_entities" ON entities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='etpl_metrics' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE etpl_metrics ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_etpl_metrics" ON etpl_metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='event_registrations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_event_registrations" ON event_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='external_lms_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE external_lms_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_external_lms_enrollments" ON external_lms_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='external_module_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE external_module_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_external_module_progress" ON external_module_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='external_modules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE external_modules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_external_modules" ON external_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='external_partner_modules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE external_partner_modules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_external_partner_modules" ON external_partner_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='external_partner_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE external_partner_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_external_partner_progress" ON external_partner_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='failed_login_attempts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_failed_login_attempts" ON failed_login_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_access_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_access_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_access_log" ON ferpa_access_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_compliance_checklist' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_compliance_checklist ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_compliance_checklist" ON ferpa_compliance_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_consent_forms' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_consent_forms ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_consent_forms" ON ferpa_consent_forms FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_disclosure_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_disclosure_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_disclosure_log" ON ferpa_disclosure_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_student_acknowledgments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_student_acknowledgments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_student_acknowledgments" ON ferpa_student_acknowledgments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_training_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_training_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_training_records" ON ferpa_training_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ferpa_violation_reports' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ferpa_violation_reports ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ferpa_violation_reports" ON ferpa_violation_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='followup_schedule' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE followup_schedule ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_followup_schedule" ON followup_schedule FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forum_comments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forum_comments" ON forum_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forum_posts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forum_posts" ON forum_posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forum_reactions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forum_reactions" ON forum_reactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forum_threads' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forum_threads" ON forum_threads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forum_votes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forum_votes" ON forum_votes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='forums' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE forums ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_forums" ON forums FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='franchises' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE franchises ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_franchises" ON franchises FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='funding_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE funding_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_funding_applications" ON funding_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='funding_cases' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE funding_cases ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_funding_cases" ON funding_cases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='funding_payments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE funding_payments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_funding_payments" ON funding_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='grade_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_grade_records" ON grade_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='grant_sources' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE grant_sources ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_grant_sources" ON grant_sources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='help_articles' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_help_articles" ON help_articles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='help_categories' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_help_categories" ON help_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='holidays' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE holidays ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_holidays" ON holidays FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='hour_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE hour_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_hour_tracking" ON hour_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='hsi_enrollment_queue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE hsi_enrollment_queue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_hsi_enrollment_queue" ON hsi_enrollment_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='income_sources' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_income_sources" ON income_sources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='indiana_hour_categories' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE indiana_hour_categories ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_hour_categories" ON indiana_hour_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='indiana_timeclock_daily_export' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE indiana_timeclock_daily_export ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_timeclock_daily_export" ON indiana_timeclock_daily_export FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='indiana_timeclock_weekly_summary_export' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE indiana_timeclock_weekly_summary_export ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_indiana_timeclock_weekly_summary_export" ON indiana_timeclock_weekly_summary_export FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='individual_employment_plans' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE individual_employment_plans ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_individual_employment_plans" ON individual_employment_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='interactive_elements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE interactive_elements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_interactive_elements" ON interactive_elements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='interactive_quizzes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE interactive_quizzes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_interactive_quizzes" ON interactive_quizzes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='invoices' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE invoices ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_invoices" ON invoices FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ip_access_control' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ip_access_control ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ip_access_control" ON ip_access_control FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='job_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_job_applications" ON job_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='job_placements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_job_placements" ON job_placements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='job_postings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_job_postings" ON job_postings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='job_queue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_job_queue" ON job_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='leaderboard_entries' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_leaderboard_entries" ON leaderboard_entries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learner_compliance' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learner_compliance ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learner_compliance" ON learner_compliance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learning_activity' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learning_activity" ON learning_activity FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learning_activity_streaks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learning_activity_streaks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learning_activity_streaks" ON learning_activity_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learning_analytics' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learning_analytics" ON learning_analytics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learning_paths' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learning_paths" ON learning_paths FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='learning_streaks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_learning_streaks" ON learning_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='leave_balances' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_leave_balances" ON leave_balances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='leave_policies' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_leave_policies" ON leave_policies FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='leave_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_leave_requests" ON leave_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='legal_actions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE legal_actions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_legal_actions" ON legal_actions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='lesson_content_blocks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE lesson_content_blocks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_lesson_content_blocks" ON lesson_content_blocks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='lesson_resources' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_lesson_resources" ON lesson_resources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='license_purchases' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_license_purchases" ON license_purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='license_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_license_requests" ON license_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='license_usage' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_license_usage" ON license_usage FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='license_usage_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE license_usage_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_license_usage_log" ON license_usage_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='license_violations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE license_violations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_license_violations" ON license_violations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='live_class_attendance' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE live_class_attendance ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_live_class_attendance" ON live_class_attendance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='live_classes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_live_classes" ON live_classes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='lms_organizations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE lms_organizations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_lms_organizations" ON lms_organizations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='lms_sync_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE lms_sync_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_lms_sync_log" ON lms_sync_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='makeup_work_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE makeup_work_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_makeup_work_requests" ON makeup_work_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='marketing_campaign_sends' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE marketing_campaign_sends ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_campaign_sends" ON marketing_campaign_sends FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='marketing_campaigns' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_campaigns" ON marketing_campaigns FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='marketing_contacts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_marketing_contacts" ON marketing_contacts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='marketplace_creators' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE marketplace_creators ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_marketplace_creators" ON marketplace_creators FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='marketplace_sales' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE marketplace_sales ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_marketplace_sales" ON marketplace_sales FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='media' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE media ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_media" ON media FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='meeting_action_items' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_meeting_action_items" ON meeting_action_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='meeting_recaps' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE meeting_recaps ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_meeting_recaps" ON meeting_recaps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='messages' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_messages" ON messages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='migration_audit' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE migration_audit ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_migration_audit" ON migration_audit FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='milady_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE milady_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_milady_enrollments" ON milady_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='moderation_actions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_actions" ON moderation_actions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='moderation_reports' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_reports" ON moderation_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='moderation_rules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_moderation_rules" ON moderation_rules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='modules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE modules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_modules" ON modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='monitoring_alerts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_monitoring_alerts" ON monitoring_alerts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='mou_signatures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE mou_signatures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_mou_signatures" ON mou_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='mou_templates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE mou_templates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_mou_templates" ON mou_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='nds_course_catalog' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE nds_course_catalog ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_nds_course_catalog" ON nds_course_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='notification_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_notification_log" ON notification_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='notification_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_notification_logs" ON notification_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='notifications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_notifications" ON notifications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ojt_hours_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ojt_hours_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_hours_log" ON ojt_hours_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ojt_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ojt_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_logs" ON ojt_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='ojt_reimbursements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE ojt_reimbursements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_ojt_reimbursements" ON ojt_reimbursements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='onboarding_checklist' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_checklist" ON onboarding_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='onboarding_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_documents" ON onboarding_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='onboarding_packets' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE onboarding_packets ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_packets" ON onboarding_packets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='onboarding_signatures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE onboarding_signatures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_signatures" ON onboarding_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='onboarding_steps' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_onboarding_steps" ON onboarding_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='open_timeclock_shifts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE open_timeclock_shifts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_open_timeclock_shifts" ON open_timeclock_shifts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='order_items' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_order_items" ON order_items FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='orders' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE orders ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_orders" ON orders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='org_invites' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_org_invites" ON org_invites FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='organization_subscriptions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_organization_subscriptions" ON organization_subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='organization_users' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_organization_users" ON organization_users FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='organizations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE organizations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_organizations" ON organizations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='page_views' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE page_views ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_page_views" ON page_views FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='participant_demographics' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE participant_demographics ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_participant_demographics" ON participant_demographics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='participant_eligibility' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE participant_eligibility ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_participant_eligibility" ON participant_eligibility FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_certificates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_certificates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_certificates" ON partner_certificates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_completions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_completions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_completions" ON partner_completions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_course_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_course_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_course_enrollments" ON partner_course_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_course_mappings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_course_mappings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_course_mappings" ON partner_course_mappings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_courses" ON partner_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_courses_catalog' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_courses_catalog ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_courses_catalog" ON partner_courses_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_credentials' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_credentials ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_credentials" ON partner_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_enrollment_summary' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_enrollment_summary ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_enrollment_summary" ON partner_enrollment_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_enrollments" ON partner_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_inquiries' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_inquiries" ON partner_inquiries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_lms_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_lms_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_courses" ON partner_lms_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_lms_enrollment_failures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_enrollment_failures" ON partner_lms_enrollment_failures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_lms_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_lms_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_enrollments" ON partner_lms_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_lms_providers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_lms_providers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_lms_providers" ON partner_lms_providers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_program_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_program_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_program_courses" ON partner_program_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='partner_shops' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE partner_shops ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_partner_shops" ON partner_shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='password_history' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE password_history ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_password_history" ON password_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='pay_stubs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE pay_stubs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_pay_stubs" ON pay_stubs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='payment_plans' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_payment_plans" ON payment_plans FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='payment_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_payment_records" ON payment_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='payout_rate_configs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE payout_rate_configs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_payout_rate_configs" ON payout_rate_configs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='payroll_profiles' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE payroll_profiles ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_payroll_profiles" ON payroll_profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='payroll_runs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_payroll_runs" ON payroll_runs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='peer_review_assignments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE peer_review_assignments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_peer_review_assignments" ON peer_review_assignments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='peer_reviews' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_peer_reviews" ON peer_reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='performance_metrics' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_performance_metrics" ON performance_metrics FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='performance_reviews' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_performance_reviews" ON performance_reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='permission_audit_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_permission_audit_log" ON permission_audit_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='permission_group_members' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE permission_group_members ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_permission_group_members" ON permission_group_members FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='permission_groups' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_permission_groups" ON permission_groups FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='permissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE permissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_permissions" ON permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='phone_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE phone_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_phone_logs" ON phone_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='platform_stats' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_platform_stats" ON platform_stats FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='point_transactions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_point_transactions" ON point_transactions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='positions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE positions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_positions" ON positions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='process_steps' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_process_steps" ON process_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='processed_stripe_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_processed_stripe_events" ON processed_stripe_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='processes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE processes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_processes" ON processes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='proctored_exams' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE proctored_exams ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_proctored_exams" ON proctored_exams FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='proctoring_sessions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE proctoring_sessions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_proctoring_sessions" ON proctoring_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='product_reports' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE product_reports ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_product_reports" ON product_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='products' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE products ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_products" ON products FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='profiles' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_profiles" ON profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_catalog' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_catalog ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_catalog" ON program_catalog FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_courses" ON program_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_applications" ON program_holder_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_documents" ON program_holder_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_notes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_notes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_notes" ON program_holder_notes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_payouts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_payouts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_payouts" ON program_holder_payouts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_students' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_students ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_students" ON program_holder_students FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holder_verification' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holder_verification ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holder_verification" ON program_holder_verification FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_holders' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_holders" ON program_holders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_licenses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_licenses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_licenses" ON program_licenses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_partner_lms' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_partner_lms ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_partner_lms" ON program_partner_lms FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_required_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_required_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_required_courses" ON program_required_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='program_revenue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE program_revenue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_program_revenue" ON program_revenue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='programs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE programs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_programs" ON programs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='provisioning_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE provisioning_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_provisioning_events" ON provisioning_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='purchases' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE purchases ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_purchases" ON purchases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='push_notification_tokens' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_push_notification_tokens" ON push_notification_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='push_tokens' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_push_tokens" ON push_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='qa_checklist_completions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE qa_checklist_completions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_qa_checklist_completions" ON qa_checklist_completions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='qa_checklists' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE qa_checklists ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_qa_checklists" ON qa_checklists FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='quarterly_performance' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE quarterly_performance ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_quarterly_performance" ON quarterly_performance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='quiz_answer_options' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE quiz_answer_options ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_quiz_answer_options" ON quiz_answer_options FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='rapids_apprentice_data' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE rapids_apprentice_data ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_apprentice_data" ON rapids_apprentice_data FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='rapids_registrations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE rapids_registrations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_registrations" ON rapids_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='rapids_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE rapids_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_rapids_tracking" ON rapids_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='referral_codes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_referral_codes" ON referral_codes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='referrals' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE referrals ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_referrals" ON referrals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='refund_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE refund_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_refund_tracking" ON refund_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='refunds' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE refunds ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_refunds" ON refunds FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='resource_downloads' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_resource_downloads" ON resource_downloads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='reviews' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_reviews" ON reviews FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='role_permissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='role_templates' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_role_templates" ON role_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='salary_history' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_salary_history" ON salary_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sap_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sap_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sap_records" ON sap_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_completion_summary' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_completion_summary ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_completion_summary" ON scorm_completion_summary FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_enrollments" ON scorm_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_packages' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_packages ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_packages" ON scorm_packages FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_registrations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_registrations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_registrations" ON scorm_registrations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_state' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_state ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_state" ON scorm_state FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scorm_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scorm_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scorm_tracking" ON scorm_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='scraping_attempts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE scraping_attempts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_scraping_attempts" ON scraping_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='security_audit_logs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_security_audit_logs" ON security_audit_logs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='service_tickets' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_service_tickets" ON service_tickets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sfc_tax_return_public_status' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sfc_tax_return_public_status ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_return_public_status" ON sfc_tax_return_public_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sfc_tax_return_public_status_v2' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sfc_tax_return_public_status_v2 ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_return_public_status_v2" ON sfc_tax_return_public_status_v2 FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sfc_tax_returns_public_lookup' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sfc_tax_returns_public_lookup ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sfc_tax_returns_public_lookup" ON sfc_tax_returns_public_lookup FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shift_schedules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shift_schedules" ON shift_schedules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_applications" ON shop_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_categories' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_categories" ON shop_categories FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_document_requirements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_document_requirements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_document_requirements" ON shop_document_requirements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_documents" ON shop_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_onboarding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_onboarding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_onboarding" ON shop_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_orders' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_orders" ON shop_orders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_placements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_placements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_placements" ON shop_placements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_products' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_products" ON shop_products FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_reports' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_reports ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_reports" ON shop_reports FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_required_docs_status' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_required_docs_status ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_required_docs_status" ON shop_required_docs_status FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_signatures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_signatures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_signatures" ON shop_signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_staff' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_staff ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_staff" ON shop_staff FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shop_supervisors' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shop_supervisors ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shop_supervisors" ON shop_supervisors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='shops' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE shops ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_shops" ON shops FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='signatures' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE signatures ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_signatures" ON signatures FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sms_reminders' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sms_reminders ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sms_reminders" ON sms_reminders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='social_media_accounts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_social_media_accounts" ON social_media_accounts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='social_media_queue' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE social_media_queue ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_social_media_queue" ON social_media_queue FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sso_connections' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sso_connections ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sso_connections" ON sso_connections FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sso_login_attempts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sso_login_attempts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sso_login_attempts" ON sso_login_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sso_providers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sso_providers" ON sso_providers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='sso_sessions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_sso_sessions" ON sso_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='staff_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE staff_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_staff_applications" ON staff_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='staff_processes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE staff_processes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_staff_processes" ON staff_processes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='staff_training_modules' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE staff_training_modules ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_staff_training_modules" ON staff_training_modules FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='staff_training_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE staff_training_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_staff_training_progress" ON staff_training_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='state_board_readiness' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE state_board_readiness ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_state_board_readiness" ON state_board_readiness FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='state_compliance' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE state_compliance ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_state_compliance" ON state_compliance FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='store_branding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE store_branding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_store_branding" ON store_branding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='store_instances' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE store_instances ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_store_instances" ON store_instances FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_applications" ON student_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_badges' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_badges" ON student_badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_credentials' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_credentials" ON student_credentials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_next_steps' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_next_steps ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_next_steps" ON student_next_steps FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_onboarding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_onboarding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_onboarding" ON student_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_points' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_points ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_points" ON student_points FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_progress" ON student_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='student_records' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE student_records ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_student_records" ON student_records FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='students' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE students ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_students" ON students FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_chat_history' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_chat_history ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_chat_history" ON studio_chat_history FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_comments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_comments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_comments" ON studio_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_commit_cache' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_commit_cache ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_commit_cache" ON studio_commit_cache FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_deploy_tokens' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_deploy_tokens ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_deploy_tokens" ON studio_deploy_tokens FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_favorites' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_favorites ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_favorites" ON studio_favorites FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_recent_files' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_recent_files ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_recent_files" ON studio_recent_files FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_repos' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_repos ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_repos" ON studio_repos FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_sessions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_sessions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_sessions" ON studio_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_settings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_settings" ON studio_settings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='studio_shares' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE studio_shares ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_studio_shares" ON studio_shares FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='subscriptions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supersonic_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supersonic_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_applications" ON supersonic_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supersonic_appointments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supersonic_appointments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_appointments" ON supersonic_appointments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supersonic_careers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supersonic_careers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_careers" ON supersonic_careers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supersonic_tax_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supersonic_tax_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_tax_documents" ON supersonic_tax_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supersonic_training_keys' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supersonic_training_keys ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supersonic_training_keys" ON supersonic_training_keys FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='supportive_services' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE supportive_services ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_supportive_services" ON supportive_services FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tasks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tasks" ON tasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_applications' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_applications ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_applications" ON tax_applications FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_calculations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_calculations" ON tax_calculations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_document_uploads' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_document_uploads ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_document_uploads" ON tax_document_uploads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_documents" ON tax_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_filings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_filings" ON tax_filings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_intake' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_intake ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_intake" ON tax_intake FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_payments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_payments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_payments" ON tax_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tax_withholdings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tax_withholdings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tax_withholdings" ON tax_withholdings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_branding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_branding" ON tenant_branding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_invitations' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_invitations" ON tenant_invitations FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_licenses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_licenses" ON tenant_licenses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_members' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_members" ON tenant_members FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_memberships' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_memberships" ON tenant_memberships FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_settings' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_settings" ON tenant_settings FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_stripe_customers' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_stripe_customers ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_stripe_customers" ON tenant_stripe_customers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_subscriptions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_subscriptions" ON tenant_subscriptions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_usage' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_usage" ON tenant_usage FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenant_usage_daily' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenant_usage_daily ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenant_usage_daily" ON tenant_usage_daily FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='tenants' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_tenants" ON tenants FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='time_entries' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_time_entries" ON time_entries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='timeclock_cron_runs' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE timeclock_cron_runs ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_timeclock_cron_runs" ON timeclock_cron_runs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='timeclock_ui_state' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE timeclock_ui_state ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_timeclock_ui_state" ON timeclock_ui_state FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='timesheets' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_timesheets" ON timesheets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='training_courses' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_training_courses" ON training_courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='training_enrollments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_training_enrollments" ON training_enrollments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='training_lessons' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_training_lessons" ON training_lessons FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='training_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_training_progress" ON training_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='transfer_hour_requests' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE transfer_hour_requests ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_transfer_hour_requests" ON transfer_hour_requests FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='trial_signups' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE trial_signups ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_trial_signups" ON trial_signups FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='two_factor_attempts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_two_factor_attempts" ON two_factor_attempts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='two_factor_auth' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_two_factor_auth" ON two_factor_auth FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='unauthorized_access_log' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE unauthorized_access_log ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_unauthorized_access_log" ON unauthorized_access_log FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='uploaded_documents' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_uploaded_documents" ON uploaded_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_achievements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_activity_events' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_activity_events ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_activity_events" ON user_activity_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_badges' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_badges" ON user_badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_capabilities' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_capabilities ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_capabilities" ON user_capabilities FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_onboarding' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_onboarding" ON user_onboarding FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_permissions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_permissions" ON user_permissions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_points' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_points ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_points" ON user_points FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_profiles' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_progress' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_progress" ON user_progress FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_resumes' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_resumes" ON user_resumes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_sessions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_sessions" ON user_sessions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_streaks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_streaks" ON user_streaks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='user_tutorials' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE user_tutorials ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_user_tutorials" ON user_tutorials FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='users' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE users ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_users" ON users FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='vendor_payments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_vendor_payments" ON vendor_payments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='verify_audit' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE verify_audit ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_verify_audit" ON verify_audit FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='video_captions' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE video_captions ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_video_captions" ON video_captions FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='video_chapters' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE video_chapters ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_video_chapters" ON video_chapters FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='video_transcripts' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_video_transcripts" ON video_transcripts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='vita_appointments' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE vita_appointments ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_vita_appointments" ON vita_appointments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='voicemails' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE voicemails ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_voicemails" ON voicemails FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='webhook_deliveries' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_webhook_deliveries" ON webhook_deliveries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='webhooks' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_webhooks" ON webhooks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='welcome_packets' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE welcome_packets ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_welcome_packets" ON welcome_packets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='wioa_services' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE wioa_services ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_wioa_services" ON wioa_services FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='withdrawals' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_withdrawals" ON withdrawals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='workone_checklist' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE workone_checklist ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_workone_checklist" ON workone_checklist FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='wotc_tracking' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE wotc_tracking ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_wotc_tracking" ON wotc_tracking FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='xapi_statements' AND n.nspname='public' AND c.relkind='r') THEN EXECUTE 'ALTER TABLE xapi_statements ENABLE ROW LEVEL SECURITY'; END IF; END $$;
DO $$ BEGIN CREATE POLICY "auth_read_xapi_statements" ON xapi_statements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN wrong_object_type THEN NULL; END $$;
