-- Seed data for 335 empty tables that code queries
-- 3 rows per table to provide initial data
-- Uses ON CONFLICT DO NOTHING for idempotent re-runs

-- access_tokens
INSERT INTO access_tokens (token, purpose, apprentice_application_id, host_shop_application_id, expires_at, max_uses, uses_count) VALUES ('', '', NULL, NULL, '', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO access_tokens (token, purpose, apprentice_application_id, host_shop_application_id, expires_at, max_uses, uses_count) VALUES ('', '', NULL, NULL, '', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO access_tokens (token, purpose, apprentice_application_id, host_shop_application_id, expires_at, max_uses, uses_count) VALUES ('', '', NULL, NULL, '', 0, 0) ON CONFLICT DO NOTHING;

-- accessibility_preferences
INSERT INTO accessibility_preferences (user_id, high_contrast, large_text, screen_reader, keyboard_navigation, reduced_motion, color_blind_mode, font_size, preferences) VALUES ('f38d3d8d-4115-4a0c-90eb-1ea3c88b2251', false, false, false, false, false, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO accessibility_preferences (user_id, high_contrast, large_text, screen_reader, keyboard_navigation, reduced_motion, color_blind_mode, font_size, preferences) VALUES ('0d8b10a2-34dc-4cbe-bfe9-9df82a2273a7', false, false, false, false, false, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO accessibility_preferences (user_id, high_contrast, large_text, screen_reader, keyboard_navigation, reduced_motion, color_blind_mode, font_size, preferences) VALUES ('cb4ab9d8-4429-4320-8c3f-97b51c5e17c0', false, false, false, false, false, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- admin_activity_log
INSERT INTO admin_activity_log (admin_user_id, action, entity_type, entity_id, details, ip, user_agent) VALUES (NULL, '', NULL, NULL, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO admin_activity_log (admin_user_id, action, entity_type, entity_id, details, ip, user_agent) VALUES (NULL, '', NULL, NULL, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO admin_activity_log (admin_user_id, action, entity_type, entity_id, details, ip, user_agent) VALUES (NULL, '', NULL, NULL, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;

-- admin_alerts
INSERT INTO admin_alerts (alert_type, severity, partner_id, apprentice_id, progress_entry_id, site_id, message, metadata, resolved_at, resolved_by) VALUES ('', '', NULL, NULL, NULL, NULL, 'Seed note for admin_alerts', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO admin_alerts (alert_type, severity, partner_id, apprentice_id, progress_entry_id, site_id, message, metadata, resolved_at, resolved_by) VALUES ('', '', NULL, NULL, NULL, NULL, 'Seed note for admin_alerts', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO admin_alerts (alert_type, severity, partner_id, apprentice_id, progress_entry_id, site_id, message, metadata, resolved_at, resolved_by) VALUES ('', '', NULL, NULL, NULL, NULL, 'Seed note for admin_alerts', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;

-- admin_checkout_sessions
INSERT INTO admin_checkout_sessions (admin_id, expires_at, used, used_at, metadata) VALUES ('6c39a213-ce22-470b-8085-b385c03982b8', '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO admin_checkout_sessions (admin_id, expires_at, used, used_at, metadata) VALUES ('531d52d9-aeea-41d2-ac9d-ef0c0cb0a9fb', '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO admin_checkout_sessions (admin_id, expires_at, used, used_at, metadata) VALUES ('b3d302b1-ca64-4f53-8153-25d6fcac9f7d', '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- admin_notifications
INSERT INTO admin_notifications (data, admin_id, title, message, type, read) VALUES ('{}'::jsonb, NULL, 'Sample Admin Notifications 1', 'Seed note for admin_notifications', 'general', false) ON CONFLICT DO NOTHING;
INSERT INTO admin_notifications (data, admin_id, title, message, type, read) VALUES ('{}'::jsonb, NULL, 'Sample Admin Notifications 2', 'Seed note for admin_notifications', 'general', false) ON CONFLICT DO NOTHING;
INSERT INTO admin_notifications (data, admin_id, title, message, type, read) VALUES ('{}'::jsonb, NULL, 'Sample Admin Notifications 3', 'Seed note for admin_notifications', 'general', false) ON CONFLICT DO NOTHING;

-- affiliate_applications
INSERT INTO affiliate_applications (user_id, company_name, website, audience_size, marketing_channels, status, reviewed_by, reviewed_at, approved_at, rejected_reason) VALUES ('b8cd40a4-d6ae-47f3-a5cb-4c6429f4f98b', NULL, 'https://www.elevateforhumanity.org', 0, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO affiliate_applications (user_id, company_name, website, audience_size, marketing_channels, status, reviewed_by, reviewed_at, approved_at, rejected_reason) VALUES ('0e9226d3-e181-4f49-9de8-98eddf8d4f6b', NULL, 'https://www.elevateforhumanity.org', 0, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO affiliate_applications (user_id, company_name, website, audience_size, marketing_channels, status, reviewed_by, reviewed_at, approved_at, rejected_reason) VALUES ('f8f4c6fe-b282-49f8-a955-7ab28c6b54cf', NULL, 'https://www.elevateforhumanity.org', 0, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- affiliate_payouts
INSERT INTO affiliate_payouts (affiliate_id, amount, currency, period_start, period_end, referral_count, status, paid_at, payment_method, transaction_id) VALUES ('17a91631-c6d2-4d14-9516-9ef39eb97f04', 2041.31, NULL, CURRENT_DATE, CURRENT_DATE, 0, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO affiliate_payouts (affiliate_id, amount, currency, period_start, period_end, referral_count, status, paid_at, payment_method, transaction_id) VALUES ('5f8a184b-4e87-4b1c-b433-f656f34b2313', 4764.13, NULL, CURRENT_DATE, CURRENT_DATE, 0, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO affiliate_payouts (affiliate_id, amount, currency, period_start, period_end, referral_count, status, paid_at, payment_method, transaction_id) VALUES ('ee0f3f47-caab-4724-a32f-dbf3154ffdbc', 2937.79, NULL, CURRENT_DATE, CURRENT_DATE, 0, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- agreement_acceptances
INSERT INTO agreement_acceptances (subject_type, subject_id, agreement_key, agreement_version, accepted_name, accepted_email, accepted_ip, user_agent) VALUES ('', 'e7bfa9d0-564e-44c5-9a86-26edac725db2', '', '', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO agreement_acceptances (subject_type, subject_id, agreement_key, agreement_version, accepted_name, accepted_email, accepted_ip, user_agent) VALUES ('', 'b21b731b-3fc0-4d89-be65-dde66160070d', '', '', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO agreement_acceptances (subject_type, subject_id, agreement_key, agreement_version, accepted_name, accepted_email, accepted_ip, user_agent) VALUES ('', '6f73772d-8816-4d6f-9edb-c02d32415016', '', '', '', '', NULL, NULL) ON CONFLICT DO NOTHING;

-- agreements
INSERT INTO agreements (name, version, content, required_for, is_active, tenant_id) VALUES ('Sample Agreements 1', NULL, 'Seed data for agreements', NULL, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO agreements (name, version, content, required_for, is_active, tenant_id) VALUES ('Sample Agreements 2', NULL, 'Seed data for agreements', NULL, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO agreements (name, version, content, required_for, is_active, tenant_id) VALUES ('Sample Agreements 3', NULL, 'Seed data for agreements', NULL, true, NULL) ON CONFLICT DO NOTHING;

-- ai_generated_courses
INSERT INTO ai_generated_courses (tenant_id, topic, level, output) VALUES (NULL, '', NULL, '') ON CONFLICT DO NOTHING;
INSERT INTO ai_generated_courses (tenant_id, topic, level, output) VALUES (NULL, '', NULL, '') ON CONFLICT DO NOTHING;
INSERT INTO ai_generated_courses (tenant_id, topic, level, output) VALUES (NULL, '', NULL, '') ON CONFLICT DO NOTHING;

-- alert_notifications
INSERT INTO alert_notifications (id, alert_type, severity, title, message, related_log_id, related_url, sent, sent_at, sent_to, acknowledged, acknowledged_by, acknowledged_at, action_required, action_taken, action_taken_by, action_taken_at, created_at, updated_at) VALUES (0, '', NULL, 'Sample Alert Notifications 1', 'Seed note for alert_notifications', 0, NULL, false, NULL, NULL, false, 0, NULL, false, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO alert_notifications (id, alert_type, severity, title, message, related_log_id, related_url, sent, sent_at, sent_to, acknowledged, acknowledged_by, acknowledged_at, action_required, action_taken, action_taken_by, action_taken_at, created_at, updated_at) VALUES (0, '', NULL, 'Sample Alert Notifications 2', 'Seed note for alert_notifications', 0, NULL, false, NULL, NULL, false, 0, NULL, false, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO alert_notifications (id, alert_type, severity, title, message, related_log_id, related_url, sent, sent_at, sent_to, acknowledged, acknowledged_by, acknowledged_at, action_required, action_taken, action_taken_by, action_taken_at, created_at, updated_at) VALUES (0, '', NULL, 'Sample Alert Notifications 3', 'Seed note for alert_notifications', 0, NULL, false, NULL, NULL, false, 0, NULL, false, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- api_keys
INSERT INTO api_keys (tenant_id, name, key_hash, permissions, last_used_at, expires_at, is_active, created_by, user_id, status) VALUES (NULL, 'Sample Api Keys 1', '', NULL, NULL, NULL, true, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO api_keys (tenant_id, name, key_hash, permissions, last_used_at, expires_at, is_active, created_by, user_id, status) VALUES (NULL, 'Sample Api Keys 2', '', NULL, NULL, NULL, true, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO api_keys (tenant_id, name, key_hash, permissions, last_used_at, expires_at, is_active, created_by, user_id, status) VALUES (NULL, 'Sample Api Keys 3', '', NULL, NULL, NULL, true, NULL, NULL, 'active') ON CONFLICT DO NOTHING;

-- api_request_logs
INSERT INTO api_request_logs (api_key_id, endpoint, method, status_code, response_time_ms, ip_address) VALUES (NULL, '', '', 0, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO api_request_logs (api_key_id, endpoint, method, status_code, response_time_ms, ip_address) VALUES (NULL, '', '', 0, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO api_request_logs (api_key_id, endpoint, method, status_code, response_time_ms, ip_address) VALUES (NULL, '', '', 0, 0, NULL) ON CONFLICT DO NOTHING;

-- apprentice_applications
INSERT INTO apprentice_applications (program_slug, full_name, email, phone, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', 'James Johnson', 'user1@example.com', '317-555-1000', '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_applications (program_slug, full_name, email, phone, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', 'Maria Garcia', 'user2@example.com', '317-555-1001', '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_applications (program_slug, full_name, email, phone, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', 'David Williams', 'user3@example.com', '317-555-1002', '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- apprentice_milestones
INSERT INTO apprentice_milestones (apprentice_id, program_id, milestone_name, description, hours_required, hours_completed, status, completed_at, badge_awarded) VALUES ('b0b98d34-7768-4a9a-b455-1bc88f021351', NULL, '', 'Seed data for apprentice milestones', 0, 0, 'active', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_milestones (apprentice_id, program_id, milestone_name, description, hours_required, hours_completed, status, completed_at, badge_awarded) VALUES ('5d6153b7-6f9c-4d36-9ed1-eef5f2683f86', NULL, '', 'Seed data for apprentice milestones', 0, 0, 'active', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_milestones (apprentice_id, program_id, milestone_name, description, hours_required, hours_completed, status, completed_at, badge_awarded) VALUES ('b41915e7-ad43-4234-8cac-e2da4f8adc1f', NULL, '', 'Seed data for apprentice milestones', 0, 0, 'active', NULL, false) ON CONFLICT DO NOTHING;

-- apprentice_notifications
INSERT INTO apprentice_notifications (apprenticeship_id, student_id, notification_type, scheduled_time, days_of_week, enabled, last_sent_at) VALUES ('2bcd201f-1a68-47e1-8f74-ef6d3cfea04e', 'a0a58854-f052-48cd-bca1-4cff76a1e64f', '', '', NULL, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_notifications (apprenticeship_id, student_id, notification_type, scheduled_time, days_of_week, enabled, last_sent_at) VALUES ('e073b905-b9d2-4865-ac65-2e9aa82e93c7', 'd7cbd40c-f0e2-4526-b236-77ae1cabcd4a', '', '', NULL, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprentice_notifications (apprenticeship_id, student_id, notification_type, scheduled_time, days_of_week, enabled, last_sent_at) VALUES ('3c7dab49-328f-404d-9cd1-cf880c5a1b75', '05190acc-9d1b-4ec2-9aa2-9ee10a533d8e', '', '', NULL, true, NULL) ON CONFLICT DO NOTHING;

-- apprentice_payroll
INSERT INTO apprentice_payroll (apprenticeship_id, student_id, pay_period_start, pay_period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes) VALUES ('75d638c2-e204-4663-83ee-8add9d804cea', '0e34c9d5-2448-459c-bd5b-e5a2cd8f8bfb', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 'active', NULL, 'Seed note for apprentice_payroll') ON CONFLICT DO NOTHING;
INSERT INTO apprentice_payroll (apprenticeship_id, student_id, pay_period_start, pay_period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes) VALUES ('4097dc3c-1051-4c09-8900-d5b4150e0d61', '5a7c9a32-1333-4ab4-ba98-c92da3c22c70', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 'active', NULL, 'Seed note for apprentice_payroll') ON CONFLICT DO NOTHING;
INSERT INTO apprentice_payroll (apprenticeship_id, student_id, pay_period_start, pay_period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes) VALUES ('fa306460-82e7-4f30-a6ea-5df05be4834f', 'bc42b09f-2260-44b7-b749-a5bf2bcbf536', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 'active', NULL, 'Seed note for apprentice_payroll') ON CONFLICT DO NOTHING;

-- apprenticeship_enrollments
INSERT INTO apprenticeship_enrollments (student_id, program_id, employer_name, supervisor_name, start_date, status, total_hours_required, total_hours_completed, employer_id, site_id) VALUES ('946cdd6a-f944-47f2-9083-b97aac5e5de4', '35bfd79a-4a2c-43a2-bd61-b72403459fa3', '', '', CURRENT_DATE, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_enrollments (student_id, program_id, employer_name, supervisor_name, start_date, status, total_hours_required, total_hours_completed, employer_id, site_id) VALUES ('0d81e160-db88-4199-8548-1806d1fb5291', '757507fb-0d85-422b-96fb-b0ae6501621d', '', '', CURRENT_DATE, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_enrollments (student_id, program_id, employer_name, supervisor_name, start_date, status, total_hours_required, total_hours_completed, employer_id, site_id) VALUES ('700763be-e0cf-4510-bbe5-b57a3dfc1514', '538eb225-e50a-4a38-a6c2-838bb587adff', '', '', CURRENT_DATE, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- apprenticeship_hours
INSERT INTO apprenticeship_hours (id, student_id, shop_id, partner_id, date_worked, date, week_ending, hours, hours_worked, program_slug, program_id, category, description, notes, approved, approved_by, approved_at, rejection_reason, status, submitted_by, submitted_at, created_at, updated_at) VALUES ('d2ed5551-ce56-49b1-b1ef-759969de9950', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 19, 0, NULL, NULL, 'general', 'Seed data for apprenticeship hours', 'Seed note for apprenticeship_hours', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_hours (id, student_id, shop_id, partner_id, date_worked, date, week_ending, hours, hours_worked, program_slug, program_id, category, description, notes, approved, approved_by, approved_at, rejection_reason, status, submitted_by, submitted_at, created_at, updated_at) VALUES ('18835839-5550-489c-a9ee-1a041d51da9b', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 25, 0, NULL, NULL, 'general', 'Seed data for apprenticeship hours', 'Seed note for apprenticeship_hours', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_hours (id, student_id, shop_id, partner_id, date_worked, date, week_ending, hours, hours_worked, program_slug, program_id, category, description, notes, approved, approved_by, approved_at, rejection_reason, status, submitted_by, submitted_at, created_at, updated_at) VALUES ('fc85dc0e-9120-4757-a09e-721761dfba2b', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 10, 0, NULL, NULL, 'general', 'Seed data for apprenticeship hours', 'Seed note for apprenticeship_hours', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- apprenticeship_intake
INSERT INTO apprenticeship_intake (full_name, email, phone, city, state, interested_in_barbering, employment_status, funding_needed, workforce_connection, referral_source, probation_or_reentry, preferred_location, notes, status) VALUES ('James Johnson', 'user1@example.com', '317-555-1000', 'Indianapolis', 'IN', false, NULL, false, NULL, NULL, false, NULL, 'Seed note for apprenticeship_intake', 'active') ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_intake (full_name, email, phone, city, state, interested_in_barbering, employment_status, funding_needed, workforce_connection, referral_source, probation_or_reentry, preferred_location, notes, status) VALUES ('Maria Garcia', 'user2@example.com', '317-555-1001', 'Indianapolis', 'IN', false, NULL, false, NULL, NULL, false, NULL, 'Seed note for apprenticeship_intake', 'active') ON CONFLICT DO NOTHING;
INSERT INTO apprenticeship_intake (full_name, email, phone, city, state, interested_in_barbering, employment_status, funding_needed, workforce_connection, referral_source, probation_or_reentry, preferred_location, notes, status) VALUES ('David Williams', 'user3@example.com', '317-555-1002', 'Indianapolis', 'IN', false, NULL, false, NULL, NULL, false, NULL, 'Seed note for apprenticeship_intake', 'active') ON CONFLICT DO NOTHING;

-- apprenticeships
INSERT INTO apprenticeships (employer_id, program_id, title, description, duration_months, wage_progression, requirements, benefits, mentor_assigned, status) VALUES (NULL, NULL, 'Sample Apprenticeships 1', 'Seed data for apprenticeships', 0, '{}'::jsonb, NULL, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO apprenticeships (employer_id, program_id, title, description, duration_months, wage_progression, requirements, benefits, mentor_assigned, status) VALUES (NULL, NULL, 'Sample Apprenticeships 2', 'Seed data for apprenticeships', 0, '{}'::jsonb, NULL, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO apprenticeships (employer_id, program_id, title, description, duration_months, wage_progression, requirements, benefits, mentor_assigned, status) VALUES (NULL, NULL, 'Sample Apprenticeships 3', 'Seed data for apprenticeships', 0, '{}'::jsonb, NULL, NULL, NULL, 'active') ON CONFLICT DO NOTHING;

-- approved_payment_links
INSERT INTO approved_payment_links (created_by, expires_at, max_uses, use_count, active, product_id, metadata) VALUES ('66c77082-b863-4a46-83cf-a428ecdcb646', NULL, 0, 0, true, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO approved_payment_links (created_by, expires_at, max_uses, use_count, active, product_id, metadata) VALUES ('64168f51-4738-49dc-a9e8-222ad9c0dea6', NULL, 0, 0, true, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO approved_payment_links (created_by, expires_at, max_uses, use_count, active, product_id, metadata) VALUES ('50cf6db5-abc5-4aef-9f34-2cfd71226a60', NULL, 0, 0, true, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- assignment_submissions
INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, submission_url, file_paths, status, submitted_at, graded_at, grade, feedback, graded_by) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, submission_url, file_paths, status, submitted_at, graded_at, grade, feedback, graded_by) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, submission_url, file_paths, status, submitted_at, graded_at, grade, feedback, graded_by) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- attendance_hours
INSERT INTO attendance_hours (user_id, cohort_id, date, hours_worked, verified_by, status, tenant_id, enrollment_id, assignment_id, hours_logged, type, logged_by, verified, verified_at, notes) VALUES (NULL, NULL, CURRENT_DATE, 0, NULL, 'active', NULL, NULL, NULL, 0, 'general', NULL, false, NULL, 'Seed note for attendance_hours') ON CONFLICT DO NOTHING;
INSERT INTO attendance_hours (user_id, cohort_id, date, hours_worked, verified_by, status, tenant_id, enrollment_id, assignment_id, hours_logged, type, logged_by, verified, verified_at, notes) VALUES (NULL, NULL, CURRENT_DATE, 0, NULL, 'active', NULL, NULL, NULL, 0, 'general', NULL, false, NULL, 'Seed note for attendance_hours') ON CONFLICT DO NOTHING;
INSERT INTO attendance_hours (user_id, cohort_id, date, hours_worked, verified_by, status, tenant_id, enrollment_id, assignment_id, hours_logged, type, logged_by, verified, verified_at, notes) VALUES (NULL, NULL, CURRENT_DATE, 0, NULL, 'active', NULL, NULL, NULL, 0, 'general', NULL, false, NULL, 'Seed note for attendance_hours') ON CONFLICT DO NOTHING;

-- attendance_records
INSERT INTO attendance_records (student_record_id, date, status, check_in_time, check_out_time, notes) VALUES ('dd81b8bc-9ed4-4a01-9b35-d7b0867fc7a0', CURRENT_DATE, 'active', NULL, NULL, 'Seed note for attendance_records') ON CONFLICT DO NOTHING;
INSERT INTO attendance_records (student_record_id, date, status, check_in_time, check_out_time, notes) VALUES ('a8770b02-a1e1-4268-bdf1-10c16cb6ef42', CURRENT_DATE, 'active', NULL, NULL, 'Seed note for attendance_records') ON CONFLICT DO NOTHING;
INSERT INTO attendance_records (student_record_id, date, status, check_in_time, check_out_time, notes) VALUES ('d1c04ac7-d381-4936-a980-a2ad088e7803', CURRENT_DATE, 'active', NULL, NULL, 'Seed note for attendance_records') ON CONFLICT DO NOTHING;

-- automated_decisions
INSERT INTO automated_decisions (subject_type, subject_id, decision, reason_codes, input_snapshot, ruleset_version, actor, overridden_by, overridden_at, override_reason, decision_type, entity_type, entity_id, outcome, confidence, reasoning, rules_applied, override_by, processing_time_ms) VALUES ('', '0bc5f40e-1e08-4950-a21e-4c8133794f87', '', '', '{}'::jsonb, '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '{}'::jsonb, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO automated_decisions (subject_type, subject_id, decision, reason_codes, input_snapshot, ruleset_version, actor, overridden_by, overridden_at, override_reason, decision_type, entity_type, entity_id, outcome, confidence, reasoning, rules_applied, override_by, processing_time_ms) VALUES ('', 'b8199425-4007-4e9e-b688-95a04a177a7b', '', '', '{}'::jsonb, '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '{}'::jsonb, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO automated_decisions (subject_type, subject_id, decision, reason_codes, input_snapshot, ruleset_version, actor, overridden_by, overridden_at, override_reason, decision_type, entity_type, entity_id, outcome, confidence, reasoning, rules_applied, override_by, processing_time_ms) VALUES ('', '12a88753-f3e2-4372-a027-f93969b7aaec', '', '', '{}'::jsonb, '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '{}'::jsonb, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;

-- bank_accounts
INSERT INTO bank_accounts (client_id, routing_number, account_number, account_type, is_primary) VALUES (NULL, '', '', '', false) ON CONFLICT DO NOTHING;
INSERT INTO bank_accounts (client_id, routing_number, account_number, account_type, is_primary) VALUES (NULL, '', '', '', false) ON CONFLICT DO NOTHING;
INSERT INTO bank_accounts (client_id, routing_number, account_number, account_type, is_primary) VALUES (NULL, '', '', '', false) ON CONFLICT DO NOTHING;

-- banner_analytics
INSERT INTO banner_analytics (data, banner_id, user_id, event_type, video_src) VALUES ('{}'::jsonb, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO banner_analytics (data, banner_id, user_id, event_type, video_src) VALUES ('{}'::jsonb, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO banner_analytics (data, banner_id, user_id, event_type, video_src) VALUES ('{}'::jsonb, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- barbershop_partner_applications
INSERT INTO barbershop_partner_applications (status, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, employment_model, has_workers_comp, can_supervise_and_verify, mou_acknowledged, consent_acknowledged, notes, source_url, user_agent, ip_hash, internal_notes, reviewed_by, reviewed_at) VALUES ('active', '', NULL, '', 'James', '', '', '', NULL, '', '', '', '', '', '', 0, '', false, false, false, false, 'Seed note for barbershop_partner_applications', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO barbershop_partner_applications (status, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, employment_model, has_workers_comp, can_supervise_and_verify, mou_acknowledged, consent_acknowledged, notes, source_url, user_agent, ip_hash, internal_notes, reviewed_by, reviewed_at) VALUES ('active', '', NULL, '', 'Maria', '', '', '', NULL, '', '', '', '', '', '', 0, '', false, false, false, false, 'Seed note for barbershop_partner_applications', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO barbershop_partner_applications (status, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, employment_model, has_workers_comp, can_supervise_and_verify, mou_acknowledged, consent_acknowledged, notes, source_url, user_agent, ip_hash, internal_notes, reviewed_by, reviewed_at) VALUES ('active', '', NULL, '', 'David', '', '', '', NULL, '', '', '', '', '', '', 0, '', false, false, false, false, 'Seed note for barbershop_partner_applications', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- benefits_enrollments
INSERT INTO benefits_enrollments (employee_id, plan_id, enrollment_date, effective_date, termination_date, status) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active') ON CONFLICT DO NOTHING;
INSERT INTO benefits_enrollments (employee_id, plan_id, enrollment_date, effective_date, termination_date, status) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active') ON CONFLICT DO NOTHING;
INSERT INTO benefits_enrollments (employee_id, plan_id, enrollment_date, effective_date, termination_date, status) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active') ON CONFLICT DO NOTHING;

-- benefits_plans
INSERT INTO benefits_plans (tenant_id, plan_name, plan_type, description, provider, employee_cost, employer_cost, is_active) VALUES (NULL, '', '', 'Seed data for benefits plans', NULL, 0, 0, true) ON CONFLICT DO NOTHING;
INSERT INTO benefits_plans (tenant_id, plan_name, plan_type, description, provider, employee_cost, employer_cost, is_active) VALUES (NULL, '', '', 'Seed data for benefits plans', NULL, 0, 0, true) ON CONFLICT DO NOTHING;
INSERT INTO benefits_plans (tenant_id, plan_name, plan_type, description, provider, employee_cost, employer_cost, is_active) VALUES (NULL, '', '', 'Seed data for benefits plans', NULL, 0, 0, true) ON CONFLICT DO NOTHING;

-- billing_cycles
INSERT INTO billing_cycles (tenant_id, cycle_start, cycle_end, amount_due, amount_paid, status, due_date, paid_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 'active', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO billing_cycles (tenant_id, cycle_start, cycle_end, amount_due, amount_paid, status, due_date, paid_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 'active', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO billing_cycles (tenant_id, cycle_start, cycle_end, amount_due, amount_paid, status, due_date, paid_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 'active', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;

-- calendar_events
INSERT INTO calendar_events (user_id, title, description, date, time, duration, color, event_type, location, reminder_minutes, is_recurring, recurrence_rule) VALUES (NULL, 'Sample Calendar Events 1', 'Seed data for calendar events', CURRENT_DATE, NULL, 20, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO calendar_events (user_id, title, description, date, time, duration, color, event_type, location, reminder_minutes, is_recurring, recurrence_rule) VALUES (NULL, 'Sample Calendar Events 2', 'Seed data for calendar events', CURRENT_DATE, NULL, 28, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO calendar_events (user_id, title, description, date, time, duration, color, event_type, location, reminder_minutes, is_recurring, recurrence_rule) VALUES (NULL, 'Sample Calendar Events 3', 'Seed data for calendar events', CURRENT_DATE, NULL, 14, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;

-- call_requests
INSERT INTO call_requests (user_id, name, email, phone, preferred_time, reason, status, assigned_to, called_at, notes) VALUES (NULL, 'Sample Call Requests 1', 'user1@example.com', '317-555-1000', NULL, NULL, 'active', NULL, NULL, 'Seed note for call_requests') ON CONFLICT DO NOTHING;
INSERT INTO call_requests (user_id, name, email, phone, preferred_time, reason, status, assigned_to, called_at, notes) VALUES (NULL, 'Sample Call Requests 2', 'user2@example.com', '317-555-1001', NULL, NULL, 'active', NULL, NULL, 'Seed note for call_requests') ON CONFLICT DO NOTHING;
INSERT INTO call_requests (user_id, name, email, phone, preferred_time, reason, status, assigned_to, called_at, notes) VALUES (NULL, 'Sample Call Requests 3', 'user3@example.com', '317-555-1002', NULL, NULL, 'active', NULL, NULL, 'Seed note for call_requests') ON CONFLICT DO NOTHING;

-- callback_requests
INSERT INTO callback_requests (user_id, phone, preferred_time, reason, status, assigned_to, completed_at) VALUES (NULL, '317-555-1000', NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO callback_requests (user_id, phone, preferred_time, reason, status, assigned_to, completed_at) VALUES (NULL, '317-555-1001', NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO callback_requests (user_id, phone, preferred_time, reason, status, assigned_to, completed_at) VALUES (NULL, '317-555-1002', NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- career_course_purchases
INSERT INTO career_course_purchases (user_id, course_id, email, amount_paid, stripe_payment_id, stripe_session_id, status) VALUES (NULL, NULL, 'user1@example.com', 0, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO career_course_purchases (user_id, course_id, email, amount_paid, stripe_payment_id, stripe_session_id, status) VALUES (NULL, NULL, 'user2@example.com', 0, NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO career_course_purchases (user_id, course_id, email, amount_paid, stripe_payment_id, stripe_session_id, status) VALUES (NULL, NULL, 'user3@example.com', 0, NULL, NULL, 'active') ON CONFLICT DO NOTHING;

-- cart_items
INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('2f59246a-8379-4972-8069-d7d2eeee6ffd', '97b03421-cb0f-45f6-9714-4c4eed48c430', 4) ON CONFLICT DO NOTHING;
INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('307056f8-02ea-4713-b910-67ecd5f454ba', '9559488a-111f-4ef7-9292-e8a2ffa31c2c', 8) ON CONFLICT DO NOTHING;
INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('820fdf3e-bf62-4c1e-969a-9b1c7ec8bb58', '9abdcf53-3cb1-4678-809b-3469de623967', 5) ON CONFLICT DO NOTHING;

-- case_manager_assignments
INSERT INTO case_manager_assignments (application_id, case_manager_id) VALUES ('3e301051-8e11-4d3a-9a3f-f392974477f3', 'ffd635c5-927b-4cf8-86a5-25d152415468') ON CONFLICT DO NOTHING;
INSERT INTO case_manager_assignments (application_id, case_manager_id) VALUES ('f145a9d7-1ede-4d47-bdca-551de35e4abb', 'f9556f2f-1fde-4937-be92-bf74ef6e5a00') ON CONFLICT DO NOTHING;
INSERT INTO case_manager_assignments (application_id, case_manager_id) VALUES ('360f6507-fa78-4aab-b08d-60b863b13641', 'e2f62b60-d891-474d-b1b5-48bc1cf0d76a') ON CONFLICT DO NOTHING;

-- cash_advances
INSERT INTO cash_advances (student_id, amount, status, approved_at, approved_by, disbursed_at, repayment_status) VALUES (NULL, 3924.62, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO cash_advances (student_id, amount, status, approved_at, approved_by, disbursed_at, repayment_status) VALUES (NULL, 4881.76, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO cash_advances (student_id, amount, status, approved_at, approved_by, disbursed_at, repayment_status) VALUES (NULL, 830.87, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- certificate_downloads
INSERT INTO certificate_downloads (data, certificate_id, user_id, format) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO certificate_downloads (data, certificate_id, user_id, format) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO certificate_downloads (data, certificate_id, user_id, format) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- chat_messages
INSERT INTO chat_messages (conversation_id, sender_id, content, message_type, is_ai_generated) VALUES (NULL, '86ed8f84-bc6a-4d29-bc70-e03579617eda', 'Seed data for chat messages', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO chat_messages (conversation_id, sender_id, content, message_type, is_ai_generated) VALUES (NULL, '09e17874-f0ea-4b6f-b37c-b74bde46e09a', 'Seed data for chat messages', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO chat_messages (conversation_id, sender_id, content, message_type, is_ai_generated) VALUES (NULL, '8314ac6b-f01c-4e61-bb4b-bc9e2d276f76', 'Seed data for chat messages', NULL, false) ON CONFLICT DO NOTHING;

-- clients
INSERT INTO clients (first_name, last_name, middle_name, ssn, date_of_birth, email, phone, address_street, address_city, address_state, address_zip, filing_status, jotform_submission_id) VALUES ('James', 'Johnson', NULL, '', CURRENT_DATE, 'user1@example.com', '317-555-1000', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO clients (first_name, last_name, middle_name, ssn, date_of_birth, email, phone, address_street, address_city, address_state, address_zip, filing_status, jotform_submission_id) VALUES ('Maria', 'Garcia', NULL, '', CURRENT_DATE, 'user2@example.com', '317-555-1001', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO clients (first_name, last_name, middle_name, ssn, date_of_birth, email, phone, address_street, address_city, address_state, address_zip, filing_status, jotform_submission_id) VALUES ('David', 'Williams', NULL, '', CURRENT_DATE, 'user3@example.com', '317-555-1002', NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- community_posts
INSERT INTO community_posts (data, user_id, content, tags, likes_count, comments_count) VALUES ('{}'::jsonb, NULL, 'Seed data for community posts', '{}'::jsonb, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO community_posts (data, user_id, content, tags, likes_count, comments_count) VALUES ('{}'::jsonb, NULL, 'Seed data for community posts', '{}'::jsonb, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO community_posts (data, user_id, content, tags, likes_count, comments_count) VALUES ('{}'::jsonb, NULL, 'Seed data for community posts', '{}'::jsonb, 0, 0) ON CONFLICT DO NOTHING;

-- compliance_alerts
INSERT INTO compliance_alerts (alert_type, severity, title, description, entity_type, entity_id, tenant_id, status, resolved_at, resolved_by, resolution_notes) VALUES ('', NULL, 'Sample Compliance Alerts 1', 'Seed data for compliance alerts', NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO compliance_alerts (alert_type, severity, title, description, entity_type, entity_id, tenant_id, status, resolved_at, resolved_by, resolution_notes) VALUES ('', NULL, 'Sample Compliance Alerts 2', 'Seed data for compliance alerts', NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO compliance_alerts (alert_type, severity, title, description, entity_type, entity_id, tenant_id, status, resolved_at, resolved_by, resolution_notes) VALUES ('', NULL, 'Sample Compliance Alerts 3', 'Seed data for compliance alerts', NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- compliance_audit_log
INSERT INTO compliance_audit_log (event_type, user_id, user_email, user_role, target_table, target_id, tenant_id, organization_id, details, ip_address, user_agent, request_path, is_immutable) VALUES ('', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO compliance_audit_log (event_type, user_id, user_email, user_role, target_table, target_id, tenant_id, organization_id, details, ip_address, user_agent, request_path, is_immutable) VALUES ('', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO compliance_audit_log (event_type, user_id, user_email, user_role, target_table, target_id, tenant_id, organization_id, details, ip_address, user_agent, request_path, is_immutable) VALUES ('', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;

-- content_library
INSERT INTO content_library (title, description, content_type, file_url, thumbnail_url, duration_seconds, file_size_bytes, tags, is_public, created_by) VALUES ('Sample Content Library 1', 'Seed data for content library', '', NULL, NULL, 0, 0, '{}'::jsonb, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO content_library (title, description, content_type, file_url, thumbnail_url, duration_seconds, file_size_bytes, tags, is_public, created_by) VALUES ('Sample Content Library 2', 'Seed data for content library', '', NULL, NULL, 0, 0, '{}'::jsonb, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO content_library (title, description, content_type, file_url, thumbnail_url, duration_seconds, file_size_bytes, tags, is_public, created_by) VALUES ('Sample Content Library 3', 'Seed data for content library', '', NULL, NULL, 0, 0, '{}'::jsonb, false, NULL) ON CONFLICT DO NOTHING;

-- content_views
INSERT INTO content_views (data, content_id, user_id, content_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO content_views (data, content_id, user_id, content_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO content_views (data, content_id, user_id, content_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- conversations
INSERT INTO conversations (participants, title, last_message_at) VALUES ('', 'Sample Conversations 1', NULL) ON CONFLICT DO NOTHING;
INSERT INTO conversations (participants, title, last_message_at) VALUES ('', 'Sample Conversations 2', NULL) ON CONFLICT DO NOTHING;
INSERT INTO conversations (participants, title, last_message_at) VALUES ('', 'Sample Conversations 3', NULL) ON CONFLICT DO NOTHING;

-- conversions
INSERT INTO conversions (user_id, conversion_type, value, metadata) VALUES (NULL, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO conversions (user_id, conversion_type, value, metadata) VALUES (NULL, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO conversions (user_id, conversion_type, value, metadata) VALUES (NULL, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- copilot_deployments
INSERT INTO copilot_deployments (copilot_type, status, config, deployed_by) VALUES ('', 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO copilot_deployments (copilot_type, status, config, deployed_by) VALUES ('', 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO copilot_deployments (copilot_type, status, config, deployed_by) VALUES ('', 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- course_progress
INSERT INTO course_progress (id, enrollment_id, user_id, course_id, status, progress_percentage, completed_lessons, current_lesson, last_accessed, completed_at) VALUES (0, NULL, 'eabd6341-e73c-4bb1-a6ab-cda847a397a3', '48ba4e41-0630-4421-b254-45a3a10bc490', 'active', 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO course_progress (id, enrollment_id, user_id, course_id, status, progress_percentage, completed_lessons, current_lesson, last_accessed, completed_at) VALUES (0, NULL, '5979bec5-1127-464c-b36c-1021dce8fda1', '1d1f4bc4-b651-4b04-8eaf-49b7a7356123', 'active', 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO course_progress (id, enrollment_id, user_id, course_id, status, progress_percentage, completed_lessons, current_lesson, last_accessed, completed_at) VALUES (0, NULL, '62cec827-44d0-4c34-85e1-b5c1c6a4a783', '24035ad9-2dee-492d-853b-20734ee13ce2', 'active', 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- credential_verification
INSERT INTO credential_verification (student_id, enrollment_id, credential_type, credential_name, credential_number, issuing_organization, issue_date, expiration_date, verification_status, verified_date, verified_by, verification_method, verification_url, state_registry_id, state_registry_url, notes) VALUES (NULL, NULL, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 'Seed note for credential_verification') ON CONFLICT DO NOTHING;
INSERT INTO credential_verification (student_id, enrollment_id, credential_type, credential_name, credential_number, issuing_organization, issue_date, expiration_date, verification_status, verified_date, verified_by, verification_method, verification_url, state_registry_id, state_registry_url, notes) VALUES (NULL, NULL, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 'Seed note for credential_verification') ON CONFLICT DO NOTHING;
INSERT INTO credential_verification (student_id, enrollment_id, credential_type, credential_name, credential_number, issuing_organization, issue_date, expiration_date, verification_status, verified_date, verified_by, verification_method, verification_url, state_registry_id, state_registry_url, notes) VALUES (NULL, NULL, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 'Seed note for credential_verification') ON CONFLICT DO NOTHING;

-- credentials_attained
INSERT INTO credentials_attained (id, user_id, program_id, credential_type, credential_name, issuing_organization, credential_number, issue_date, expiration_date, status, is_industry_recognized, is_stackable, verification_url, verification_code, verified, verified_at, certificate_file_url, notes, created_at, updated_at) VALUES (0, 0, 0, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', false, false, NULL, NULL, false, NULL, NULL, 'Seed note for credentials_attained', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO credentials_attained (id, user_id, program_id, credential_type, credential_name, issuing_organization, credential_number, issue_date, expiration_date, status, is_industry_recognized, is_stackable, verification_url, verification_code, verified, verified_at, certificate_file_url, notes, created_at, updated_at) VALUES (0, 0, 0, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', false, false, NULL, NULL, false, NULL, NULL, 'Seed note for credentials_attained', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO credentials_attained (id, user_id, program_id, credential_type, credential_name, issuing_organization, credential_number, issue_date, expiration_date, status, is_industry_recognized, is_stackable, verification_url, verification_code, verified, verified_at, certificate_file_url, notes, created_at, updated_at) VALUES (0, 0, 0, '', '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', false, false, NULL, NULL, false, NULL, NULL, 'Seed note for credentials_attained', NULL, NULL) ON CONFLICT DO NOTHING;

-- crm_appointments
INSERT INTO crm_appointments (contact_id, staff_id, appointment_type, scheduled_at, duration_minutes, status, location, notes) VALUES (NULL, NULL, NULL, '', 0, 'active', NULL, 'Seed note for crm_appointments') ON CONFLICT DO NOTHING;
INSERT INTO crm_appointments (contact_id, staff_id, appointment_type, scheduled_at, duration_minutes, status, location, notes) VALUES (NULL, NULL, NULL, '', 0, 'active', NULL, 'Seed note for crm_appointments') ON CONFLICT DO NOTHING;
INSERT INTO crm_appointments (contact_id, staff_id, appointment_type, scheduled_at, duration_minutes, status, location, notes) VALUES (NULL, NULL, NULL, '', 0, 'active', NULL, 'Seed note for crm_appointments') ON CONFLICT DO NOTHING;

-- crm_contacts
INSERT INTO crm_contacts (first_name, last_name, email, phone, company, title, source, status, assigned_to, tags, custom_fields, job_title, contact_type, address_street, address_city, address_state, address_zip, notes) VALUES ('James', 'Johnson', 'user1@example.com', '317-555-1000', NULL, 'Sample Crm Contacts 1', NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'Seed note for crm_contacts') ON CONFLICT DO NOTHING;
INSERT INTO crm_contacts (first_name, last_name, email, phone, company, title, source, status, assigned_to, tags, custom_fields, job_title, contact_type, address_street, address_city, address_state, address_zip, notes) VALUES ('Maria', 'Garcia', 'user2@example.com', '317-555-1001', NULL, 'Sample Crm Contacts 2', NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'Seed note for crm_contacts') ON CONFLICT DO NOTHING;
INSERT INTO crm_contacts (first_name, last_name, email, phone, company, title, source, status, assigned_to, tags, custom_fields, job_title, contact_type, address_street, address_city, address_state, address_zip, notes) VALUES ('David', 'Williams', 'user3@example.com', '317-555-1002', NULL, 'Sample Crm Contacts 3', NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, 'Seed note for crm_contacts') ON CONFLICT DO NOTHING;

-- crm_deals
INSERT INTO crm_deals (contact_id, title, stage, value, probability, expected_close_date, assigned_to, notes, closed_at) VALUES (NULL, 'Sample Crm Deals 1', NULL, 0, 0, CURRENT_DATE, NULL, 'Seed note for crm_deals', NULL) ON CONFLICT DO NOTHING;
INSERT INTO crm_deals (contact_id, title, stage, value, probability, expected_close_date, assigned_to, notes, closed_at) VALUES (NULL, 'Sample Crm Deals 2', NULL, 0, 0, CURRENT_DATE, NULL, 'Seed note for crm_deals', NULL) ON CONFLICT DO NOTHING;
INSERT INTO crm_deals (contact_id, title, stage, value, probability, expected_close_date, assigned_to, notes, closed_at) VALUES (NULL, 'Sample Crm Deals 3', NULL, 0, 0, CURRENT_DATE, NULL, 'Seed note for crm_deals', NULL) ON CONFLICT DO NOTHING;

-- crm_follow_ups
INSERT INTO crm_follow_ups (contact_id, assigned_to, follow_up_type, due_date, status, notes, completed_at) VALUES ('f7a88e9f-e758-443b-aa8f-e8f7e3a27375', NULL, NULL, CURRENT_DATE, 'active', 'Seed note for crm_follow_ups', NULL) ON CONFLICT DO NOTHING;
INSERT INTO crm_follow_ups (contact_id, assigned_to, follow_up_type, due_date, status, notes, completed_at) VALUES ('d7d55c90-12bc-4150-8aea-96af8c9fe6f3', NULL, NULL, CURRENT_DATE, 'active', 'Seed note for crm_follow_ups', NULL) ON CONFLICT DO NOTHING;
INSERT INTO crm_follow_ups (contact_id, assigned_to, follow_up_type, due_date, status, notes, completed_at) VALUES ('40592f25-d897-47e4-8757-b70206e3dd12', NULL, NULL, CURRENT_DATE, 'active', 'Seed note for crm_follow_ups', NULL) ON CONFLICT DO NOTHING;

-- customer_service_protocols
INSERT INTO customer_service_protocols (category, dos, donts, examples, escalation_rules) VALUES ('general', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO customer_service_protocols (category, dos, donts, examples, escalation_rules) VALUES ('general', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO customer_service_protocols (category, dos, donts, examples, escalation_rules) VALUES ('general', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- customer_service_tickets
INSERT INTO customer_service_tickets (student_id, staff_id, subject, description, status, priority, category, resolution, resolved_at, resolved_by) VALUES (NULL, NULL, '', 'Seed data for customer service tickets', 'active', NULL, 'general', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO customer_service_tickets (student_id, staff_id, subject, description, status, priority, category, resolution, resolved_at, resolved_by) VALUES (NULL, NULL, '', 'Seed data for customer service tickets', 'active', NULL, 'general', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO customer_service_tickets (student_id, staff_id, subject, description, status, priority, category, resolution, resolved_at, resolved_by) VALUES (NULL, NULL, '', 'Seed data for customer service tickets', 'active', NULL, 'general', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- delegates
INSERT INTO delegates (user_id, name, email, phone, organization, is_active) VALUES ('f661eae5-6e73-48c7-a9ce-80aa1b5536f6', 'Sample Delegates 1', 'user1@example.com', '317-555-1000', NULL, true) ON CONFLICT DO NOTHING;
INSERT INTO delegates (user_id, name, email, phone, organization, is_active) VALUES ('285d70f9-90f6-4830-b4db-983b8d21f9cd', 'Sample Delegates 2', 'user2@example.com', '317-555-1001', NULL, true) ON CONFLICT DO NOTHING;
INSERT INTO delegates (user_id, name, email, phone, organization, is_active) VALUES ('97c65445-85b5-4c3d-98b3-ff3130a3f0d7', 'Sample Delegates 3', 'user3@example.com', '317-555-1002', NULL, true) ON CONFLICT DO NOTHING;

-- delivery_logs
INSERT INTO delivery_logs (notification_id, channel, recipient, status, provider_message_id, error_message, sent_at) VALUES (NULL, '', '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO delivery_logs (notification_id, channel, recipient, status, provider_message_id, error_message, sent_at) VALUES (NULL, '', '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO delivery_logs (notification_id, channel, recipient, status, provider_message_id, error_message, sent_at) VALUES (NULL, '', '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- departments
INSERT INTO departments (tenant_id, name, description, manager_id, parent_department_id) VALUES (NULL, 'Sample Departments 1', 'Seed data for departments', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO departments (tenant_id, name, description, manager_id, parent_department_id) VALUES (NULL, 'Sample Departments 2', 'Seed data for departments', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO departments (tenant_id, name, description, manager_id, parent_department_id) VALUES (NULL, 'Sample Departments 3', 'Seed data for departments', NULL, NULL) ON CONFLICT DO NOTHING;

-- dependents
INSERT INTO dependents (client_id, tax_return_id, first_name, last_name, ssn, date_of_birth, relationship) VALUES (NULL, NULL, 'James', 'Johnson', '', CURRENT_DATE, '') ON CONFLICT DO NOTHING;
INSERT INTO dependents (client_id, tax_return_id, first_name, last_name, ssn, date_of_birth, relationship) VALUES (NULL, NULL, 'Maria', 'Garcia', '', CURRENT_DATE, '') ON CONFLICT DO NOTHING;
INSERT INTO dependents (client_id, tax_return_id, first_name, last_name, ssn, date_of_birth, relationship) VALUES (NULL, NULL, 'David', 'Williams', '', CURRENT_DATE, '') ON CONFLICT DO NOTHING;

-- discussion_posts
INSERT INTO discussion_posts (thread_id, user_id, content, is_solution) VALUES ('0ad6ddb2-ab47-4319-bbc9-52f76364037d', 'f3bba423-7978-4892-9612-8b53b9e92fb9', 'Seed data for discussion posts', false) ON CONFLICT DO NOTHING;
INSERT INTO discussion_posts (thread_id, user_id, content, is_solution) VALUES ('d2c9f6e1-1b3f-45f1-be70-339c70224ae5', '95185662-b0e7-45dc-9d7d-f1e8106ae17d', 'Seed data for discussion posts', false) ON CONFLICT DO NOTHING;
INSERT INTO discussion_posts (thread_id, user_id, content, is_solution) VALUES ('b30d6a1d-f0b5-4505-9407-0385893afd08', '24ab09a7-bddd-47a6-a599-07603f0a809d', 'Seed data for discussion posts', false) ON CONFLICT DO NOTHING;

-- discussion_threads
INSERT INTO discussion_threads (forum_id, user_id, title, content, is_pinned, is_locked, view_count) VALUES ('33048049-d0dd-45d6-af8f-4b785bdf2b68', 'c3569aad-fb6e-45a6-854c-f4487141514d', 'Sample Discussion Threads 1', 'Seed data for discussion threads', false, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO discussion_threads (forum_id, user_id, title, content, is_pinned, is_locked, view_count) VALUES ('b5c104a6-cd7a-4131-b9d5-689c14f6f240', 'fbe4b191-5eb7-480d-a418-921648462feb', 'Sample Discussion Threads 2', 'Seed data for discussion threads', false, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO discussion_threads (forum_id, user_id, title, content, is_pinned, is_locked, view_count) VALUES ('b933314a-71c2-4782-801a-0bd79c84466a', 'dfa0db81-382d-402c-bf11-1faea88c6cbd', 'Sample Discussion Threads 3', 'Seed data for discussion threads', false, false, 0) ON CONFLICT DO NOTHING;

-- document_signatures
INSERT INTO document_signatures (document_type, document_id, signer_id, signature_data, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO document_signatures (document_type, document_id, signer_id, signature_data, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO document_signatures (document_type, document_id, signer_id, signature_data, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- documents
INSERT INTO documents (user_id, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, rejection_reason, expiration_date, metadata, enrollment_id, application_id, verification_status, verified_by, verified_at, requirement_id, owner_type, owner_id, file_path, file_size_bytes, verified, verification_notes) VALUES ('686efd7b-28bc-47e8-8033-a1fb9e15a343', '', '', 0, '', '', 'active', NULL, NULL, NULL, NULL, CURRENT_DATE, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO documents (user_id, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, rejection_reason, expiration_date, metadata, enrollment_id, application_id, verification_status, verified_by, verified_at, requirement_id, owner_type, owner_id, file_path, file_size_bytes, verified, verification_notes) VALUES ('ac0370c9-9448-48dc-a7ec-779bda22cee9', '', '', 0, '', '', 'active', NULL, NULL, NULL, NULL, CURRENT_DATE, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO documents (user_id, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, rejection_reason, expiration_date, metadata, enrollment_id, application_id, verification_status, verified_by, verified_at, requirement_id, owner_type, owner_id, file_path, file_size_bytes, verified, verification_notes) VALUES ('e6ebfce6-5e5b-4593-9485-bdc489ebf233', '', '', 0, '', '', 'active', NULL, NULL, NULL, NULL, CURRENT_DATE, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;

-- documents_extractions
INSERT INTO documents_extractions (document_id, doc_type, extracted, raw_text, confidence, status, validation_errors, ruleset_version, processed_at) VALUES ('094cdac6-4d5b-4ceb-9ab7-b04390f0b11b', '', '{}'::jsonb, NULL, 0, 'active', NULL, '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO documents_extractions (document_id, doc_type, extracted, raw_text, confidence, status, validation_errors, ruleset_version, processed_at) VALUES ('3fbcdb42-a2aa-49a0-add4-fb3892fc1b93', '', '{}'::jsonb, NULL, 0, 'active', NULL, '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO documents_extractions (document_id, doc_type, extracted, raw_text, confidence, status, validation_errors, ruleset_version, processed_at) VALUES ('cacc97b8-50c5-4867-8e52-e838368ecca3', '', '{}'::jsonb, NULL, 0, 'active', NULL, '', NULL) ON CONFLICT DO NOTHING;

-- ecr_snapshots
INSERT INTO ecr_snapshots (student_record_id, theory_hours, practical_hours, total_hours, gpa, attendance_percentage, sap_status, progress_percentage, milady_data) VALUES ('0619c0ca-fbfb-4a34-a899-fd4e2cc13a41', 0, 0, 0, 0, 0, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO ecr_snapshots (student_record_id, theory_hours, practical_hours, total_hours, gpa, attendance_percentage, sap_status, progress_percentage, milady_data) VALUES ('c05ddbc1-6c0f-4b75-bac2-b330dd1a1e87', 0, 0, 0, 0, 0, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO ecr_snapshots (student_record_id, theory_hours, practical_hours, total_hours, gpa, attendance_percentage, sap_status, progress_percentage, milady_data) VALUES ('650fd887-0c00-438a-b662-2190dd2c551f', 0, 0, 0, 0, 0, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- email_queue
INSERT INTO email_queue (recipient_email, subject, body, status, sent_at, error_message, retry_count, metadata) VALUES ('', '', 'Seed data for email queue', 'active', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO email_queue (recipient_email, subject, body, status, sent_at, error_message, retry_count, metadata) VALUES ('', '', 'Seed data for email queue', 'active', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO email_queue (recipient_email, subject, body, status, sent_at, error_message, retry_count, metadata) VALUES ('', '', 'Seed data for email queue', 'active', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- employee_documents
INSERT INTO employee_documents (employee_id, document_type, document_name, file_url, uploaded_by, expires_at) VALUES (NULL, '', '', '', NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO employee_documents (employee_id, document_type, document_name, file_url, uploaded_by, expires_at) VALUES (NULL, '', '', '', NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO employee_documents (employee_id, document_type, document_name, file_url, uploaded_by, expires_at) VALUES (NULL, '', '', '', NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- employees
INSERT INTO employees (user_id, tenant_id, employee_number, first_name, last_name, email, phone, date_of_birth, hire_date, termination_date, employment_status, job_title, department_id, manager_id, salary, pay_frequency, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone) VALUES (NULL, NULL, NULL, 'James', 'Johnson', 'user1@example.com', '317-555-1000', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, NULL, NULL, NULL, NULL, 4216.47, NULL, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO employees (user_id, tenant_id, employee_number, first_name, last_name, email, phone, date_of_birth, hire_date, termination_date, employment_status, job_title, department_id, manager_id, salary, pay_frequency, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone) VALUES (NULL, NULL, NULL, 'Maria', 'Garcia', 'user2@example.com', '317-555-1001', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, NULL, NULL, NULL, NULL, 4281.73, NULL, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO employees (user_id, tenant_id, employee_number, first_name, last_name, email, phone, date_of_birth, hire_date, termination_date, employment_status, job_title, department_id, manager_id, salary, pay_frequency, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone) VALUES (NULL, NULL, NULL, 'David', 'Williams', 'user3@example.com', '317-555-1002', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, NULL, NULL, NULL, NULL, 3887.98, NULL, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL) ON CONFLICT DO NOTHING;

-- employer_onboarding
INSERT INTO employer_onboarding (employer_id, status, documents, notes) VALUES (NULL, 'active', '{}'::jsonb, 'Seed note for employer_onboarding') ON CONFLICT DO NOTHING;
INSERT INTO employer_onboarding (employer_id, status, documents, notes) VALUES (NULL, 'active', '{}'::jsonb, 'Seed note for employer_onboarding') ON CONFLICT DO NOTHING;
INSERT INTO employer_onboarding (employer_id, status, documents, notes) VALUES (NULL, 'active', '{}'::jsonb, 'Seed note for employer_onboarding') ON CONFLICT DO NOTHING;

-- employer_profiles
INSERT INTO employer_profiles (data, company_name, industry, hiring_rate, logo_url, website, is_featured, is_active, description) VALUES ('{}'::jsonb, NULL, NULL, 0, NULL, 'https://www.elevateforhumanity.org', false, true, 'Seed data for employer profiles') ON CONFLICT DO NOTHING;
INSERT INTO employer_profiles (data, company_name, industry, hiring_rate, logo_url, website, is_featured, is_active, description) VALUES ('{}'::jsonb, NULL, NULL, 0, NULL, 'https://www.elevateforhumanity.org', false, true, 'Seed data for employer profiles') ON CONFLICT DO NOTHING;
INSERT INTO employer_profiles (data, company_name, industry, hiring_rate, logo_url, website, is_featured, is_active, description) VALUES ('{}'::jsonb, NULL, NULL, 0, NULL, 'https://www.elevateforhumanity.org', false, true, 'Seed data for employer profiles') ON CONFLICT DO NOTHING;

-- employment_outcomes
INSERT INTO employment_outcomes (id, user_id, program_id, employed, employment_date, employer_name, job_title, industry, hourly_wage, annual_salary, hours_per_week, benefits_offered, employment_type, is_career_pathway, retained_30_days, retained_90_days, retained_180_days, retained_1_year, last_contact_date, next_followup_date, notes, verification_method, verified_by, verified_at, created_at, updated_at) VALUES (0, 0, 0, false, CURRENT_DATE, NULL, NULL, NULL, 0, 0, 0, false, NULL, false, false, false, false, false, CURRENT_DATE, CURRENT_DATE, 'Seed note for employment_outcomes', NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO employment_outcomes (id, user_id, program_id, employed, employment_date, employer_name, job_title, industry, hourly_wage, annual_salary, hours_per_week, benefits_offered, employment_type, is_career_pathway, retained_30_days, retained_90_days, retained_180_days, retained_1_year, last_contact_date, next_followup_date, notes, verification_method, verified_by, verified_at, created_at, updated_at) VALUES (0, 0, 0, false, CURRENT_DATE, NULL, NULL, NULL, 0, 0, 0, false, NULL, false, false, false, false, false, CURRENT_DATE, CURRENT_DATE, 'Seed note for employment_outcomes', NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO employment_outcomes (id, user_id, program_id, employed, employment_date, employer_name, job_title, industry, hourly_wage, annual_salary, hours_per_week, benefits_offered, employment_type, is_career_pathway, retained_30_days, retained_90_days, retained_180_days, retained_1_year, last_contact_date, next_followup_date, notes, verification_method, verified_by, verified_at, created_at, updated_at) VALUES (0, 0, 0, false, CURRENT_DATE, NULL, NULL, NULL, 0, 0, 0, false, NULL, false, false, false, false, false, CURRENT_DATE, CURRENT_DATE, 'Seed note for employment_outcomes', NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- employment_tracking
INSERT INTO employment_tracking (student_id, enrollment_id, employer_name, job_title, employment_start_date, employment_end_date, hourly_wage, hours_per_week, annual_salary, verified_2nd_quarter, verified_2nd_quarter_date, wage_2nd_quarter, verified_4th_quarter, verified_4th_quarter_date, wage_4th_quarter, created_by, notes) VALUES (NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 0, false, CURRENT_DATE, 0, false, CURRENT_DATE, 0, NULL, 'Seed note for employment_tracking') ON CONFLICT DO NOTHING;
INSERT INTO employment_tracking (student_id, enrollment_id, employer_name, job_title, employment_start_date, employment_end_date, hourly_wage, hours_per_week, annual_salary, verified_2nd_quarter, verified_2nd_quarter_date, wage_2nd_quarter, verified_4th_quarter, verified_4th_quarter_date, wage_4th_quarter, created_by, notes) VALUES (NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 0, false, CURRENT_DATE, 0, false, CURRENT_DATE, 0, NULL, 'Seed note for employment_tracking') ON CONFLICT DO NOTHING;
INSERT INTO employment_tracking (student_id, enrollment_id, employer_name, job_title, employment_start_date, employment_end_date, hourly_wage, hours_per_week, annual_salary, verified_2nd_quarter, verified_2nd_quarter_date, wage_2nd_quarter, verified_4th_quarter, verified_4th_quarter_date, wage_4th_quarter, created_by, notes) VALUES (NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, 0, 0, false, CURRENT_DATE, 0, false, CURRENT_DATE, 0, NULL, 'Seed note for employment_tracking') ON CONFLICT DO NOTHING;

-- enrollment_idempotency
INSERT INTO enrollment_idempotency (idempotency_key, enrollment_id, user_id) VALUES ('', '', 'c84e2d97-000a-4456-9bca-7372f9093111') ON CONFLICT DO NOTHING;
INSERT INTO enrollment_idempotency (idempotency_key, enrollment_id, user_id) VALUES ('', '', '15003f92-58cb-4cd1-af2d-9a0ecef1dfbb') ON CONFLICT DO NOTHING;
INSERT INTO enrollment_idempotency (idempotency_key, enrollment_id, user_id) VALUES ('', '', 'b57d71d4-822b-44f9-942b-5e566f633089') ON CONFLICT DO NOTHING;

-- enrollment_requirements
INSERT INTO enrollment_requirements (enrollment_id, requirement_type, title, description, status, due_date, completed_at, verified_by, document_url) VALUES ('8cf37187-c306-4fa5-80f2-5eed59208c7c', '', 'Sample Enrollment Requirements 1', 'Seed data for enrollment requirements', 'active', CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO enrollment_requirements (enrollment_id, requirement_type, title, description, status, due_date, completed_at, verified_by, document_url) VALUES ('c5d06317-07ed-4b5b-90a8-917734949f7c', '', 'Sample Enrollment Requirements 2', 'Seed data for enrollment requirements', 'active', CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO enrollment_requirements (enrollment_id, requirement_type, title, description, status, due_date, completed_at, verified_by, document_url) VALUES ('7db3bcd4-37f5-49d4-b020-acbe39acaa92', '', 'Sample Enrollment Requirements 3', 'Seed data for enrollment requirements', 'active', CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- entities
INSERT INTO entities (name, uei, cage, ein, entity_type, naics_list, capability_narrative, org_history, key_personnel) VALUES ('Sample Entities 1', NULL, NULL, NULL, '', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO entities (name, uei, cage, ein, entity_type, naics_list, capability_narrative, org_history, key_personnel) VALUES ('Sample Entities 2', NULL, NULL, NULL, '', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO entities (name, uei, cage, ein, entity_type, naics_list, capability_narrative, org_history, key_personnel) VALUES ('Sample Entities 3', NULL, NULL, NULL, '', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- event_registrations
INSERT INTO event_registrations (event_id, user_id, status, attended) VALUES (NULL, 'a8ade26e-afdb-4f72-a8bc-d1f7591af8c8', 'active', false) ON CONFLICT DO NOTHING;
INSERT INTO event_registrations (event_id, user_id, status, attended) VALUES (NULL, '5c38f51c-bbb6-4b7b-97f6-2a8933f40d4e', 'active', false) ON CONFLICT DO NOTHING;
INSERT INTO event_registrations (event_id, user_id, status, attended) VALUES (NULL, '3da5f4be-fce4-4a94-9e49-f2694254c751', 'active', false) ON CONFLICT DO NOTHING;

-- external_modules
INSERT INTO external_modules (course_id, title, description, external_url, provider, duration_minutes, sort_order, is_required) VALUES (NULL, 'Sample External Modules 1', 'Seed data for external modules', NULL, NULL, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO external_modules (course_id, title, description, external_url, provider, duration_minutes, sort_order, is_required) VALUES (NULL, 'Sample External Modules 2', 'Seed data for external modules', NULL, NULL, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO external_modules (course_id, title, description, external_url, provider, duration_minutes, sort_order, is_required) VALUES (NULL, 'Sample External Modules 3', 'Seed data for external modules', NULL, NULL, 0, 0, false) ON CONFLICT DO NOTHING;

-- external_partner_progress
INSERT INTO external_partner_progress (module_id, user_id, status, proof_file_url, notes, external_enrollment_id, external_account_id, progress_percentage, completed_at, certificate_url, certificate_number, approved_by, approved_at) VALUES ('14e7955d-56f3-4d3f-aac0-9f93151abd77', '7fe1d05c-1548-4576-a892-2f77015a8e17', 'active', NULL, 'Seed note for external_partner_progress', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_partner_progress (module_id, user_id, status, proof_file_url, notes, external_enrollment_id, external_account_id, progress_percentage, completed_at, certificate_url, certificate_number, approved_by, approved_at) VALUES ('d72113f8-1c9a-490b-b5eb-5c443ec9fadb', '64d8bf8d-3fbe-413e-8a2b-89a119b1c9bd', 'active', NULL, 'Seed note for external_partner_progress', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_partner_progress (module_id, user_id, status, proof_file_url, notes, external_enrollment_id, external_account_id, progress_percentage, completed_at, certificate_url, certificate_number, approved_by, approved_at) VALUES ('99247b7a-4889-49bc-99db-a49e16aad583', '98d23c3c-84dd-49dc-a770-67b1862b18e2', 'active', NULL, 'Seed note for external_partner_progress', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- ferpa_access_logs
INSERT INTO ferpa_access_logs (accessor_id, student_id, access_type, reason, records_accessed, ip_address) VALUES ('eece8645-111b-471a-bdab-64e26701068d', '7511a23b-2ea1-40a2-a313-0eab4d120674', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO ferpa_access_logs (accessor_id, student_id, access_type, reason, records_accessed, ip_address) VALUES ('69daabc7-c2e7-4bee-bab3-2372958f3829', '8bf41b81-cd65-42cf-888a-3eb17db593af', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO ferpa_access_logs (accessor_id, student_id, access_type, reason, records_accessed, ip_address) VALUES ('2a75b696-a217-43ef-bbfc-4fe7867cc23f', 'f2446835-564b-40a9-ab89-73e3a3e4f4bf', '', '', NULL, NULL) ON CONFLICT DO NOTHING;

-- ferpa_training_records
INSERT INTO ferpa_training_records (id, user_id, quiz_score, quiz_answers, training_signature, confidentiality_signature, training_acknowledged, confidentiality_acknowledged, expires_at, ip_address, user_agent, status) VALUES ('', '5bf42642-4dda-4624-b328-4cd58496635a', 0, '{}'::jsonb, '', '', false, false, '', NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO ferpa_training_records (id, user_id, quiz_score, quiz_answers, training_signature, confidentiality_signature, training_acknowledged, confidentiality_acknowledged, expires_at, ip_address, user_agent, status) VALUES ('', '207b6195-f7de-49be-bdd7-09e96dc35416', 0, '{}'::jsonb, '', '', false, false, '', NULL, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO ferpa_training_records (id, user_id, quiz_score, quiz_answers, training_signature, confidentiality_signature, training_acknowledged, confidentiality_acknowledged, expires_at, ip_address, user_agent, status) VALUES ('', '410e945e-4a85-4616-8de0-bb297e9f467c', 0, '{}'::jsonb, '', '', false, false, '', NULL, NULL, 'active') ON CONFLICT DO NOTHING;

-- financial_aid_calculations
INSERT INTO financial_aid_calculations (data, user_id, program_id, total_cost, aid_amount, out_of_pocket, funding_sources) VALUES ('{}'::jsonb, NULL, NULL, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO financial_aid_calculations (data, user_id, program_id, total_cost, aid_amount, out_of_pocket, funding_sources) VALUES ('{}'::jsonb, NULL, NULL, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO financial_aid_calculations (data, user_id, program_id, total_cost, aid_amount, out_of_pocket, funding_sources) VALUES ('{}'::jsonb, NULL, NULL, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- followup_schedule
INSERT INTO followup_schedule (id, user_id, program_id, followup_type, scheduled_date, status, completed_date, completed_by, contact_method, contact_attempts, outcome_notes, still_employed, needs_support, created_at, updated_at) VALUES (0, 0, 0, '', CURRENT_DATE, 'active', CURRENT_DATE, 0, NULL, 0, NULL, false, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO followup_schedule (id, user_id, program_id, followup_type, scheduled_date, status, completed_date, completed_by, contact_method, contact_attempts, outcome_notes, still_employed, needs_support, created_at, updated_at) VALUES (0, 0, 0, '', CURRENT_DATE, 'active', CURRENT_DATE, 0, NULL, 0, NULL, false, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO followup_schedule (id, user_id, program_id, followup_type, scheduled_date, status, completed_date, completed_by, contact_method, contact_attempts, outcome_notes, still_employed, needs_support, created_at, updated_at) VALUES (0, 0, 0, '', CURRENT_DATE, 'active', CURRENT_DATE, 0, NULL, 0, NULL, false, false, NULL, NULL) ON CONFLICT DO NOTHING;

-- forum_posts
INSERT INTO forum_posts (thread_id, content, author_id, is_solution, attachments) VALUES (NULL, 'Seed data for forum posts', '744c6beb-11b0-4c62-a8ae-24ed5fbaba0f', false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO forum_posts (thread_id, content, author_id, is_solution, attachments) VALUES (NULL, 'Seed data for forum posts', 'bfea7084-e70d-46aa-9740-3e7fd0ca7c06', false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO forum_posts (thread_id, content, author_id, is_solution, attachments) VALUES (NULL, 'Seed data for forum posts', '83b40522-b974-4ae5-8c38-e1c5264e2c5a', false, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- forum_replies
INSERT INTO forum_replies (topic_id, author_id, parent_id, content, is_solution, upvotes) VALUES (NULL, NULL, NULL, 'Seed data for forum replies', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO forum_replies (topic_id, author_id, parent_id, content, is_solution, upvotes) VALUES (NULL, NULL, NULL, 'Seed data for forum replies', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO forum_replies (topic_id, author_id, parent_id, content, is_solution, upvotes) VALUES (NULL, NULL, NULL, 'Seed data for forum replies', false, 0) ON CONFLICT DO NOTHING;

-- forums
INSERT INTO forums (program_id, title) VALUES (NULL, 'Sample Forums 1') ON CONFLICT DO NOTHING;
INSERT INTO forums (program_id, title) VALUES (NULL, 'Sample Forums 2') ON CONFLICT DO NOTHING;
INSERT INTO forums (program_id, title) VALUES (NULL, 'Sample Forums 3') ON CONFLICT DO NOTHING;

-- franchise_audit_log
INSERT INTO franchise_audit_log (action, entity_type, entity_id, office_id, actor_id, details, old_values, new_values, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO franchise_audit_log (action, entity_type, entity_id, office_id, actor_id, details, old_values, new_values, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO franchise_audit_log (action, entity_type, entity_id, office_id, actor_id, details, old_values, new_values, ip_address, user_agent) VALUES ('', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;

-- franchise_clients
INSERT INTO franchise_clients (office_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, filing_status, dependents_count, ssn_encrypted, ssn_last_four, ssn_hash, spouse_first_name, spouse_last_name, spouse_ssn_encrypted, spouse_ssn_last_four, preferred_preparer_id, client_since, returns_filed, total_fees_paid, last_return_date, last_return_id, status, notes) VALUES ('48d1b324-27ec-47a7-bb67-a5facbad3ccf', 'James', 'Johnson', 'user1@example.com', '317-555-1000', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, 0, 0, CURRENT_DATE, NULL, 'active', 'Seed note for franchise_clients') ON CONFLICT DO NOTHING;
INSERT INTO franchise_clients (office_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, filing_status, dependents_count, ssn_encrypted, ssn_last_four, ssn_hash, spouse_first_name, spouse_last_name, spouse_ssn_encrypted, spouse_ssn_last_four, preferred_preparer_id, client_since, returns_filed, total_fees_paid, last_return_date, last_return_id, status, notes) VALUES ('177d9cfe-6df6-4e6c-85e5-1c07a6752c95', 'Maria', 'Garcia', 'user2@example.com', '317-555-1001', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, 0, 0, CURRENT_DATE, NULL, 'active', 'Seed note for franchise_clients') ON CONFLICT DO NOTHING;
INSERT INTO franchise_clients (office_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, filing_status, dependents_count, ssn_encrypted, ssn_last_four, ssn_hash, spouse_first_name, spouse_last_name, spouse_ssn_encrypted, spouse_ssn_last_four, preferred_preparer_id, client_since, returns_filed, total_fees_paid, last_return_date, last_return_id, status, notes) VALUES ('7d2573d8-8e4b-4444-be32-ca2181a472d0', 'David', 'Williams', 'user3@example.com', '317-555-1002', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, 0, 0, CURRENT_DATE, NULL, 'active', 'Seed note for franchise_clients') ON CONFLICT DO NOTHING;

-- franchise_ero_configs
INSERT INTO franchise_ero_configs (office_id, ero_preparer_id, efin, firm_name, firm_ein, firm_address, signature_pin, is_active) VALUES ('f0271b3c-0419-42b9-ae51-afdb2209ed3e', '395a1ca9-dd8f-4016-a5e9-e804284b0b29', '', '', NULL, '{}'::jsonb, '', true) ON CONFLICT DO NOTHING;
INSERT INTO franchise_ero_configs (office_id, ero_preparer_id, efin, firm_name, firm_ein, firm_address, signature_pin, is_active) VALUES ('5b04cf3c-0a46-4a7d-be48-3f7cf0057eb2', 'a2d612a9-88da-4a47-9380-276a71935e24', '', '', NULL, '{}'::jsonb, '', true) ON CONFLICT DO NOTHING;
INSERT INTO franchise_ero_configs (office_id, ero_preparer_id, efin, firm_name, firm_ein, firm_address, signature_pin, is_active) VALUES ('9fa54220-01ba-4a2e-b938-c5d8cf35a367', '52cbf991-c430-4b26-83f2-7108797e7dad', '', '', NULL, '{}'::jsonb, '', true) ON CONFLICT DO NOTHING;

-- franchise_fee_schedules
INSERT INTO franchise_fee_schedules (office_id, name, is_default, base_fee_1040, base_fee_1040_ez, fee_schedule_a, fee_schedule_c, fee_schedule_d, fee_schedule_e, fee_schedule_se, fee_per_w2, fee_per_1099, fee_per_dependent, fee_state_return, fee_eitc, fee_ctc, fee_refund_transfer, fee_refund_advance, returning_client_discount_percent, referral_discount, senior_discount_percent, military_discount_percent, effective_from, effective_to) VALUES ('e241e2b3-19bd-4a82-99a7-93c2282e37bb', 'Sample Franchise Fee Schedules 1', false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO franchise_fee_schedules (office_id, name, is_default, base_fee_1040, base_fee_1040_ez, fee_schedule_a, fee_schedule_c, fee_schedule_d, fee_schedule_e, fee_schedule_se, fee_per_w2, fee_per_1099, fee_per_dependent, fee_state_return, fee_eitc, fee_ctc, fee_refund_transfer, fee_refund_advance, returning_client_discount_percent, referral_discount, senior_discount_percent, military_discount_percent, effective_from, effective_to) VALUES ('43a22dd5-e8f8-44e0-b03a-44bb60ff7680', 'Sample Franchise Fee Schedules 2', false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO franchise_fee_schedules (office_id, name, is_default, base_fee_1040, base_fee_1040_ez, fee_schedule_a, fee_schedule_c, fee_schedule_d, fee_schedule_e, fee_schedule_se, fee_per_w2, fee_per_1099, fee_per_dependent, fee_state_return, fee_eitc, fee_ctc, fee_refund_transfer, fee_refund_advance, returning_client_discount_percent, referral_discount, senior_discount_percent, military_discount_percent, effective_from, effective_to) VALUES ('0e53a14d-101e-4a3b-8341-2180fc48ff2f', 'Sample Franchise Fee Schedules 3', false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- franchise_offices
INSERT INTO franchise_offices (office_code, office_name, owner_id, owner_name, owner_email, owner_phone, address_street, address_city, address_state, address_zip, business_ein, state_license, efin, parent_efin, status, activated_at, suspended_at, suspension_reason, franchise_fee, per_return_fee, revenue_share_percent, contract_start_date, contract_end_date, max_preparers, max_returns_per_season, created_by, notes) VALUES ('', '', NULL, '', '', NULL, '', '', '', '', NULL, NULL, NULL, '', 'active', NULL, NULL, NULL, 0, 0, 0, CURRENT_DATE, CURRENT_DATE, 0, 0, NULL, 'Seed note for franchise_offices') ON CONFLICT DO NOTHING;
INSERT INTO franchise_offices (office_code, office_name, owner_id, owner_name, owner_email, owner_phone, address_street, address_city, address_state, address_zip, business_ein, state_license, efin, parent_efin, status, activated_at, suspended_at, suspension_reason, franchise_fee, per_return_fee, revenue_share_percent, contract_start_date, contract_end_date, max_preparers, max_returns_per_season, created_by, notes) VALUES ('', '', NULL, '', '', NULL, '', '', '', '', NULL, NULL, NULL, '', 'active', NULL, NULL, NULL, 0, 0, 0, CURRENT_DATE, CURRENT_DATE, 0, 0, NULL, 'Seed note for franchise_offices') ON CONFLICT DO NOTHING;
INSERT INTO franchise_offices (office_code, office_name, owner_id, owner_name, owner_email, owner_phone, address_street, address_city, address_state, address_zip, business_ein, state_license, efin, parent_efin, status, activated_at, suspended_at, suspension_reason, franchise_fee, per_return_fee, revenue_share_percent, contract_start_date, contract_end_date, max_preparers, max_returns_per_season, created_by, notes) VALUES ('', '', NULL, '', '', NULL, '', '', '', '', NULL, NULL, NULL, '', 'active', NULL, NULL, NULL, 0, 0, 0, CURRENT_DATE, CURRENT_DATE, 0, 0, NULL, 'Seed note for franchise_offices') ON CONFLICT DO NOTHING;

-- franchise_preparer_payouts
INSERT INTO franchise_preparer_payouts (preparer_id, office_id, period_start, period_end, returns_count, gross_earnings, deductions, net_earnings, status, paid_at, payment_method, payment_reference, approved_by, approved_at, notes) VALUES ('dd4579d7-510a-4e93-be41-6b5307075b24', 'c31b4e11-f0f2-49ab-b8b7-a8dc77d0c219', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'Seed note for franchise_preparer_payouts') ON CONFLICT DO NOTHING;
INSERT INTO franchise_preparer_payouts (preparer_id, office_id, period_start, period_end, returns_count, gross_earnings, deductions, net_earnings, status, paid_at, payment_method, payment_reference, approved_by, approved_at, notes) VALUES ('a414b5a3-e0ff-4989-931b-b12458d20322', '6d707a31-53e3-46c5-b2f5-3453dfcc05fc', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'Seed note for franchise_preparer_payouts') ON CONFLICT DO NOTHING;
INSERT INTO franchise_preparer_payouts (preparer_id, office_id, period_start, period_end, returns_count, gross_earnings, deductions, net_earnings, status, paid_at, payment_method, payment_reference, approved_by, approved_at, notes) VALUES ('f53cb34e-3517-4674-b1ef-78ed7c48c282', '5842f377-1de7-4bcf-8c29-76eb87ef7f93', CURRENT_DATE, CURRENT_DATE, 0, 0, 0, 0, 'active', NULL, NULL, NULL, NULL, NULL, 'Seed note for franchise_preparer_payouts') ON CONFLICT DO NOTHING;

-- franchise_preparers
INSERT INTO franchise_preparers (user_id, office_id, first_name, last_name, email, phone, ptin, ptin_expiration, certification_level, certifications, training_completed_at, annual_refresher_due, is_efin_authorized, is_ero_authorized, signature_pin, status, activated_at, suspended_at, suspension_reason, returns_filed, returns_rejected, average_refund, commission_type, per_return_fee, hourly_rate, commission_rate, created_by, notes) VALUES (NULL, '7faa72fb-7da2-4821-93b8-5cd606989af5', 'James', 'Johnson', 'user1@example.com', '317-555-1000', '', CURRENT_DATE, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, NULL, 'active', NULL, NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for franchise_preparers') ON CONFLICT DO NOTHING;
INSERT INTO franchise_preparers (user_id, office_id, first_name, last_name, email, phone, ptin, ptin_expiration, certification_level, certifications, training_completed_at, annual_refresher_due, is_efin_authorized, is_ero_authorized, signature_pin, status, activated_at, suspended_at, suspension_reason, returns_filed, returns_rejected, average_refund, commission_type, per_return_fee, hourly_rate, commission_rate, created_by, notes) VALUES (NULL, '3d4e6a8f-6b23-4cb5-8e81-3f1a62c1e4d9', 'Maria', 'Garcia', 'user2@example.com', '317-555-1001', '', CURRENT_DATE, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, NULL, 'active', NULL, NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for franchise_preparers') ON CONFLICT DO NOTHING;
INSERT INTO franchise_preparers (user_id, office_id, first_name, last_name, email, phone, ptin, ptin_expiration, certification_level, certifications, training_completed_at, annual_refresher_due, is_efin_authorized, is_ero_authorized, signature_pin, status, activated_at, suspended_at, suspension_reason, returns_filed, returns_rejected, average_refund, commission_type, per_return_fee, hourly_rate, commission_rate, created_by, notes) VALUES (NULL, 'd1100f4a-8ee0-471f-9923-2592c2fd3aeb', 'David', 'Williams', 'user3@example.com', '317-555-1002', '', CURRENT_DATE, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, NULL, 'active', NULL, NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for franchise_preparers') ON CONFLICT DO NOTHING;

-- franchise_return_submissions
INSERT INTO franchise_return_submissions (submission_id, office_id, preparer_id, client_id, preparer_ptin, preparer_name, ero_id, ero_signature, ero_signed_at, tax_year, efin, return_type, filing_status, return_data, taxpayer_ssn_hash, xml_content, client_fee, franchise_fee, preparer_commission, office_revenue, status, irs_submission_id, irs_status, irs_status_date, irs_errors, submitted_at, notes) VALUES ('', '8173acfb-c506-45ee-85b3-4e39b2ee2dd3', '4ae957d7-e00b-4f10-b41e-50d255223321', NULL, '', NULL, NULL, '{}'::jsonb, NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, NULL, 0, 0, 0, 0, 'active', NULL, NULL, NULL, '{}'::jsonb, NULL, 'Seed note for franchise_return_submissions') ON CONFLICT DO NOTHING;
INSERT INTO franchise_return_submissions (submission_id, office_id, preparer_id, client_id, preparer_ptin, preparer_name, ero_id, ero_signature, ero_signed_at, tax_year, efin, return_type, filing_status, return_data, taxpayer_ssn_hash, xml_content, client_fee, franchise_fee, preparer_commission, office_revenue, status, irs_submission_id, irs_status, irs_status_date, irs_errors, submitted_at, notes) VALUES ('', '90b1ff2d-0041-4efd-ae75-1d4b042a65b8', '3129ee08-6262-4e10-8cc8-bba63b519dd0', NULL, '', NULL, NULL, '{}'::jsonb, NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, NULL, 0, 0, 0, 0, 'active', NULL, NULL, NULL, '{}'::jsonb, NULL, 'Seed note for franchise_return_submissions') ON CONFLICT DO NOTHING;
INSERT INTO franchise_return_submissions (submission_id, office_id, preparer_id, client_id, preparer_ptin, preparer_name, ero_id, ero_signature, ero_signed_at, tax_year, efin, return_type, filing_status, return_data, taxpayer_ssn_hash, xml_content, client_fee, franchise_fee, preparer_commission, office_revenue, status, irs_submission_id, irs_status, irs_status_date, irs_errors, submitted_at, notes) VALUES ('', 'f79a7471-aef8-45ef-b582-b156ef3d1fc0', '197983e9-2138-478e-8b98-befa98b10cf6', NULL, '', NULL, NULL, '{}'::jsonb, NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, NULL, 0, 0, 0, 0, 'active', NULL, NULL, NULL, '{}'::jsonb, NULL, 'Seed note for franchise_return_submissions') ON CONFLICT DO NOTHING;

-- funding_applications
INSERT INTO funding_applications (user_id, course_id, program_type, status, personal_info, employment_info, education_info, funding_info, documents, signature, reviewed_at, reviewed_by, review_notes) VALUES ('d8b5d93f-e594-4db2-a0ce-2a3a70114982', '1d4d7a66-7413-4fd0-b9ee-319100fb4fe2', '', 'active', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO funding_applications (user_id, course_id, program_type, status, personal_info, employment_info, education_info, funding_info, documents, signature, reviewed_at, reviewed_by, review_notes) VALUES ('c860279a-58c0-4c0e-a9ed-713d75cffcd3', '060977d4-e52e-41f9-beb6-11fce439f487', '', 'active', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO funding_applications (user_id, course_id, program_type, status, personal_info, employment_info, education_info, funding_info, documents, signature, reviewed_at, reviewed_by, review_notes) VALUES ('786a7fed-9ea6-4161-850c-5a3f8ec31b7b', '173c4116-8f1e-4e79-8076-5700e65af7a7', '', 'active', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- funding_cases
INSERT INTO funding_cases (apprentice_id, funding_source, ita_number, approved_amount, status, case_manager, workone_region, approval_date) VALUES (NULL, NULL, NULL, 0, 'active', NULL, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO funding_cases (apprentice_id, funding_source, ita_number, approved_amount, status, case_manager, workone_region, approval_date) VALUES (NULL, NULL, NULL, 0, 'active', NULL, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO funding_cases (apprentice_id, funding_source, ita_number, approved_amount, status, case_manager, workone_region, approval_date) VALUES (NULL, NULL, NULL, 0, 'active', NULL, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
