-- funding_payments
INSERT INTO funding_payments (student_id, program_id, funding_source, stripe_checkout_session_id, stripe_payment_intent_id, status, amount, paid_at) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', 603.18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO funding_payments (student_id, program_id, funding_source, stripe_checkout_session_id, stripe_payment_intent_id, status, amount, paid_at) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', 749.17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO funding_payments (student_id, program_id, funding_source, stripe_checkout_session_id, stripe_payment_intent_id, status, amount, paid_at) VALUES (NULL, NULL, NULL, NULL, NULL, 'active', 1916.27, NULL) ON CONFLICT DO NOTHING;

-- generated_pages
INSERT INTO generated_pages (data, slug, title, content, template, is_published) VALUES ('{}'::jsonb, 'sample-generated_pages-1', 'Sample Generated Pages 1', 'Seed data for generated pages', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO generated_pages (data, slug, title, content, template, is_published) VALUES ('{}'::jsonb, 'sample-generated_pages-2', 'Sample Generated Pages 2', 'Seed data for generated pages', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO generated_pages (data, slug, title, content, template, is_published) VALUES ('{}'::jsonb, 'sample-generated_pages-3', 'Sample Generated Pages 3', 'Seed data for generated pages', NULL, false) ON CONFLICT DO NOTHING;

-- google_classroom_sync
INSERT INTO google_classroom_sync (data, user_id, last_sync_at, settings, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 'active') ON CONFLICT DO NOTHING;
INSERT INTO google_classroom_sync (data, user_id, last_sync_at, settings, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 'active') ON CONFLICT DO NOTHING;
INSERT INTO google_classroom_sync (data, user_id, last_sync_at, settings, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 'active') ON CONFLICT DO NOTHING;

-- grades
INSERT INTO grades (data, student_id, course_id, assignment_id, points, max_points, grade_type) VALUES ('{}'::jsonb, NULL, NULL, NULL, 9, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO grades (data, student_id, course_id, assignment_id, points, max_points, grade_type) VALUES ('{}'::jsonb, NULL, NULL, NULL, 61, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO grades (data, student_id, course_id, assignment_id, points, max_points, grade_type) VALUES ('{}'::jsonb, NULL, NULL, NULL, 16, 0, NULL) ON CONFLICT DO NOTHING;

-- grant_applications
INSERT INTO grant_applications (grant_id, submitted_by, status, amount_requested, amount_awarded, proposal_summary, documents, submitted_at, reviewed_at, reviewer_notes) VALUES (NULL, NULL, 'active', 0, 0, NULL, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO grant_applications (grant_id, submitted_by, status, amount_requested, amount_awarded, proposal_summary, documents, submitted_at, reviewed_at, reviewer_notes) VALUES (NULL, NULL, 'active', 0, 0, NULL, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO grant_applications (grant_id, submitted_by, status, amount_requested, amount_awarded, proposal_summary, documents, submitted_at, reviewed_at, reviewer_notes) VALUES (NULL, NULL, 'active', 0, 0, NULL, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- grant_sources
INSERT INTO grant_sources (name, code, base_url) VALUES ('Sample Grant Sources 1', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO grant_sources (name, code, base_url) VALUES ('Sample Grant Sources 2', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO grant_sources (name, code, base_url) VALUES ('Sample Grant Sources 3', '', NULL) ON CONFLICT DO NOTHING;

-- handbook_acknowledgments
INSERT INTO handbook_acknowledgments (user_id, tenant_id, handbook_version, handbook_hash, ip_address, user_agent, attendance_policy_ack, dress_code_ack, conduct_policy_ack, safety_policy_ack, grievance_policy_ack, full_acknowledgment, acknowledgment_statement, is_immutable) VALUES ('4b4766d5-a2da-4aa3-adc8-3c91aa6238c5', NULL, '', NULL, '', '', false, false, false, false, false, false, '', false) ON CONFLICT DO NOTHING;
INSERT INTO handbook_acknowledgments (user_id, tenant_id, handbook_version, handbook_hash, ip_address, user_agent, attendance_policy_ack, dress_code_ack, conduct_policy_ack, safety_policy_ack, grievance_policy_ack, full_acknowledgment, acknowledgment_statement, is_immutable) VALUES ('e84a5f98-7deb-4af0-b0c3-dbae58edd844', NULL, '', NULL, '', '', false, false, false, false, false, false, '', false) ON CONFLICT DO NOTHING;
INSERT INTO handbook_acknowledgments (user_id, tenant_id, handbook_version, handbook_hash, ip_address, user_agent, attendance_policy_ack, dress_code_ack, conduct_policy_ack, safety_policy_ack, grievance_policy_ack, full_acknowledgment, acknowledgment_statement, is_immutable) VALUES ('e210ebbb-2717-4bd0-8bbb-299aa8bb9878', NULL, '', NULL, '', '', false, false, false, false, false, false, '', false) ON CONFLICT DO NOTHING;

-- host_shop_applications
INSERT INTO host_shop_applications (shop_name, owner_name, email, phone, address, license_info, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', '', 'user1@example.com', '317-555-1000', 'Indianapolis, IN', '{}'::jsonb, '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO host_shop_applications (shop_name, owner_name, email, phone, address, license_info, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', '', 'user2@example.com', '317-555-1001', 'Indianapolis, IN', '{}'::jsonb, '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO host_shop_applications (shop_name, owner_name, email, phone, address, license_info, intake, status, submitted_at, approved_at, approved_by, rejected_at, rejected_reason) VALUES ('', '', 'user3@example.com', '317-555-1002', 'Indianapolis, IN', '{}'::jsonb, '{}'::jsonb, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- hour_entries
INSERT INTO hour_entries (apprentice_application_id, host_shop_application_id, source_type, source_entity_name, source_state, source_document_url, work_date, hours_claimed, accepted_hours, category, notes, evaluation_required, evaluation_decision, rule_set_id, rule_hash, evaluated_at, evaluated_by, evaluation_notes, entered_by_email, status, approved_by, approved_at, rejection_reason) VALUES ('4476e89b-b757-43a1-b21b-3828f8672064', NULL, '', NULL, NULL, NULL, CURRENT_DATE, 0, 0, 'general', 'Seed note for hour_entries', false, NULL, NULL, NULL, NULL, NULL, NULL, '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hour_entries (apprentice_application_id, host_shop_application_id, source_type, source_entity_name, source_state, source_document_url, work_date, hours_claimed, accepted_hours, category, notes, evaluation_required, evaluation_decision, rule_set_id, rule_hash, evaluated_at, evaluated_by, evaluation_notes, entered_by_email, status, approved_by, approved_at, rejection_reason) VALUES ('2b8fed10-3e64-45d3-9160-09af5ab13f69', NULL, '', NULL, NULL, NULL, CURRENT_DATE, 0, 0, 'general', 'Seed note for hour_entries', false, NULL, NULL, NULL, NULL, NULL, NULL, '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hour_entries (apprentice_application_id, host_shop_application_id, source_type, source_entity_name, source_state, source_document_url, work_date, hours_claimed, accepted_hours, category, notes, evaluation_required, evaluation_decision, rule_set_id, rule_hash, evaluated_at, evaluated_by, evaluation_notes, entered_by_email, status, approved_by, approved_at, rejection_reason) VALUES ('6660b707-7383-4118-ae4b-720b5265393b', NULL, '', NULL, NULL, NULL, CURRENT_DATE, 0, 0, 'general', 'Seed note for hour_entries', false, NULL, NULL, NULL, NULL, NULL, NULL, '', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- hour_transfer_requests
INSERT INTO hour_transfer_requests (apprentice_id, submitted_by, source, source_type, hours_requested, description, previous_employer, employment_dates, document_ids, docs_verified, docs_verified_at, status, hours_accepted, evaluation_decision, evaluation_notes, evaluated_by, evaluated_at, rule_set_id, rule_hash) VALUES ('5e3829dc-4f51-4c2d-bfcb-f0e8fe1393e9', 'bdce53d0-39c9-4f03-9f3e-27f12fa1e58d', '', '', 0, 'Seed data for hour transfer requests', NULL, NULL, NULL, false, NULL, 'active', 0, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hour_transfer_requests (apprentice_id, submitted_by, source, source_type, hours_requested, description, previous_employer, employment_dates, document_ids, docs_verified, docs_verified_at, status, hours_accepted, evaluation_decision, evaluation_notes, evaluated_by, evaluated_at, rule_set_id, rule_hash) VALUES ('629a4845-74fc-49f9-be6d-707795bc9058', 'e18ae41d-ddcd-4ead-8670-7a4355d79d27', '', '', 0, 'Seed data for hour transfer requests', NULL, NULL, NULL, false, NULL, 'active', 0, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hour_transfer_requests (apprentice_id, submitted_by, source, source_type, hours_requested, description, previous_employer, employment_dates, document_ids, docs_verified, docs_verified_at, status, hours_accepted, evaluation_decision, evaluation_notes, evaluated_by, evaluated_at, rule_set_id, rule_hash) VALUES ('c8d50f2d-6a46-40e1-8da2-699ba0a787e5', '0003942a-cf17-4c56-9196-67d0d7767515', '', '', 0, 'Seed data for hour transfer requests', NULL, NULL, NULL, false, NULL, 'active', 0, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- hsi_enrollment_queue
INSERT INTO hsi_enrollment_queue (student_name, student_email, course_type, amount_paid, payment_status, enrollment_status, hsi_student_id, hsi_enrollment_link, stripe_session_id, stripe_payment_intent, error_message, retry_count, processed_at, funding_source) VALUES ('', '', '', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hsi_enrollment_queue (student_name, student_email, course_type, amount_paid, payment_status, enrollment_status, hsi_student_id, hsi_enrollment_link, stripe_session_id, stripe_payment_intent, error_message, retry_count, processed_at, funding_source) VALUES ('', '', '', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO hsi_enrollment_queue (student_name, student_email, course_type, amount_paid, payment_status, enrollment_status, hsi_student_id, hsi_enrollment_link, stripe_session_id, stripe_payment_intent, error_message, retry_count, processed_at, funding_source) VALUES ('', '', '', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- individual_employment_plans
INSERT INTO individual_employment_plans (participant_id, primary_career_goal, secondary_career_goal, target_occupation_soc_code, target_wage_goal, identified_barriers, barrier_mitigation_strategies, assessment_services_needed, training_services_needed, supportive_services_needed, follow_up_services_needed, training_program_id, expected_training_start_date, expected_training_completion_date, credential_goal, job_search_activities, job_placement_assistance_needed, short_term_goals, long_term_goals, plan_status, plan_created_by, plan_approved_by, plan_approved_date, participant_signature_url, participant_signed_date, case_manager_signature_url, case_manager_signed_date) VALUES (NULL, '', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO individual_employment_plans (participant_id, primary_career_goal, secondary_career_goal, target_occupation_soc_code, target_wage_goal, identified_barriers, barrier_mitigation_strategies, assessment_services_needed, training_services_needed, supportive_services_needed, follow_up_services_needed, training_program_id, expected_training_start_date, expected_training_completion_date, credential_goal, job_search_activities, job_placement_assistance_needed, short_term_goals, long_term_goals, plan_status, plan_created_by, plan_approved_by, plan_approved_date, participant_signature_url, participant_signed_date, case_manager_signature_url, case_manager_signed_date) VALUES (NULL, '', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO individual_employment_plans (participant_id, primary_career_goal, secondary_career_goal, target_occupation_soc_code, target_wage_goal, identified_barriers, barrier_mitigation_strategies, assessment_services_needed, training_services_needed, supportive_services_needed, follow_up_services_needed, training_program_id, expected_training_start_date, expected_training_completion_date, credential_goal, job_search_activities, job_placement_assistance_needed, short_term_goals, long_term_goals, plan_status, plan_created_by, plan_approved_by, plan_approved_date, participant_signature_url, participant_signed_date, case_manager_signature_url, case_manager_signed_date) VALUES (NULL, '', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- inquiries
INSERT INTO inquiries (inquiry_type, data) VALUES ('', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO inquiries (inquiry_type, data) VALUES ('', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO inquiries (inquiry_type, data) VALUES ('', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- intakes
INSERT INTO intakes (full_name, email, phone, program_interest, funding_source, status, tenant_id, source, source_page, zip_code, notes, assigned_to, converted_to_application_id, program_id) VALUES ('James Johnson', 'user1@example.com', '317-555-1000', NULL, NULL, 'active', NULL, NULL, NULL, '46204', 'Seed note for intakes', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO intakes (full_name, email, phone, program_interest, funding_source, status, tenant_id, source, source_page, zip_code, notes, assigned_to, converted_to_application_id, program_id) VALUES ('Maria Garcia', 'user2@example.com', '317-555-1001', NULL, NULL, 'active', NULL, NULL, NULL, '46204', 'Seed note for intakes', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO intakes (full_name, email, phone, program_interest, funding_source, status, tenant_id, source, source_page, zip_code, notes, assigned_to, converted_to_application_id, program_id) VALUES ('David Williams', 'user3@example.com', '317-555-1002', NULL, NULL, 'active', NULL, NULL, NULL, '46204', 'Seed note for intakes', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- invoices
INSERT INTO invoices (tenant_id, invoice_number, amount, tax, total, currency, status, due_date, paid_at, items) VALUES (NULL, '', 2542.08, 0, 2477.8, NULL, 'active', CURRENT_DATE, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO invoices (tenant_id, invoice_number, amount, tax, total, currency, status, due_date, paid_at, items) VALUES (NULL, '', 815.65, 0, 386.43, NULL, 'active', CURRENT_DATE, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO invoices (tenant_id, invoice_number, amount, tax, total, currency, status, due_date, paid_at, items) VALUES (NULL, '', 3740.55, 0, 4933.66, NULL, 'active', CURRENT_DATE, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- job_applications
INSERT INTO job_applications (job_posting_id, student_id, resume_url, cover_letter, status, notes) VALUES (NULL, NULL, NULL, NULL, 'active', 'Seed note for job_applications') ON CONFLICT DO NOTHING;
INSERT INTO job_applications (job_posting_id, student_id, resume_url, cover_letter, status, notes) VALUES (NULL, NULL, NULL, NULL, 'active', 'Seed note for job_applications') ON CONFLICT DO NOTHING;
INSERT INTO job_applications (job_posting_id, student_id, resume_url, cover_letter, status, notes) VALUES (NULL, NULL, NULL, NULL, 'active', 'Seed note for job_applications') ON CONFLICT DO NOTHING;

-- job_placements
INSERT INTO job_placements (student_id, employer_id, job_title, start_date, end_date, status, hourly_wage) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', 0) ON CONFLICT DO NOTHING;
INSERT INTO job_placements (student_id, employer_id, job_title, start_date, end_date, status, hourly_wage) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', 0) ON CONFLICT DO NOTHING;
INSERT INTO job_placements (student_id, employer_id, job_title, start_date, end_date, status, hourly_wage) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', 0) ON CONFLICT DO NOTHING;

-- job_queue
INSERT INTO job_queue (type, payload, status, attempts, max_attempts, error, processed_at) VALUES ('general', '{}'::jsonb, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO job_queue (type, payload, status, attempts, max_attempts, error, processed_at) VALUES ('general', '{}'::jsonb, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO job_queue (type, payload, status, attempts, max_attempts, error, processed_at) VALUES ('general', '{}'::jsonb, 'active', 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- learning_activity
INSERT INTO learning_activity (student_id, activity_type, course_id, lesson_id, points_earned, metadata) VALUES ('16a86227-8f5f-4c60-9a4f-304cd82331ec', '', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO learning_activity (student_id, activity_type, course_id, lesson_id, points_earned, metadata) VALUES ('69af220c-7c00-40cc-9ed0-abad88b06e82', '', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO learning_activity (student_id, activity_type, course_id, lesson_id, points_earned, metadata) VALUES ('3a566d87-4db1-4c6a-ad3f-005f73938d6d', '', NULL, NULL, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- leave_balances
INSERT INTO leave_balances (employee_id, leave_type, balance_hours, accrued_hours, used_hours, year) VALUES (NULL, '', 0, 0, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO leave_balances (employee_id, leave_type, balance_hours, accrued_hours, used_hours, year) VALUES (NULL, '', 0, 0, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO leave_balances (employee_id, leave_type, balance_hours, accrued_hours, used_hours, year) VALUES (NULL, '', 0, 0, 0, 0) ON CONFLICT DO NOTHING;

-- leave_policies
INSERT INTO leave_policies (tenant_id, policy_name, leave_type, accrual_rate, max_balance, carryover_allowed) VALUES (NULL, '', '', 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO leave_policies (tenant_id, policy_name, leave_type, accrual_rate, max_balance, carryover_allowed) VALUES (NULL, '', '', 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO leave_policies (tenant_id, policy_name, leave_type, accrual_rate, max_balance, carryover_allowed) VALUES (NULL, '', '', 0, 0, false) ON CONFLICT DO NOTHING;

-- leave_requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at) VALUES (NULL, '', CURRENT_DATE, CURRENT_DATE, 0, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at) VALUES (NULL, '', CURRENT_DATE, CURRENT_DATE, 0, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at) VALUES (NULL, '', CURRENT_DATE, CURRENT_DATE, 0, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- lesson_completions
INSERT INTO lesson_completions (user_id, course_id, module_id, time_spent_minutes) VALUES (NULL, NULL, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO lesson_completions (user_id, course_id, module_id, time_spent_minutes) VALUES (NULL, NULL, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO lesson_completions (user_id, course_id, module_id, time_spent_minutes) VALUES (NULL, NULL, NULL, 0) ON CONFLICT DO NOTHING;

-- lesson_content_blocks
INSERT INTO lesson_content_blocks (lesson_id, block_type, content, order_index) VALUES (NULL, '', 'Seed data for lesson content blocks', 0) ON CONFLICT DO NOTHING;
INSERT INTO lesson_content_blocks (lesson_id, block_type, content, order_index) VALUES (NULL, '', 'Seed data for lesson content blocks', 0) ON CONFLICT DO NOTHING;
INSERT INTO lesson_content_blocks (lesson_id, block_type, content, order_index) VALUES (NULL, '', 'Seed data for lesson content blocks', 0) ON CONFLICT DO NOTHING;

-- license_purchases
INSERT INTO license_purchases (organization_name, contact_name, contact_email, license_type, product_slug, stripe_payment_intent_id, stripe_checkout_session_id, tenant_id, status, amount_cents, currency) VALUES ('', 'James', '', '', NULL, NULL, NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_purchases (organization_name, contact_name, contact_email, license_type, product_slug, stripe_payment_intent_id, stripe_checkout_session_id, tenant_id, status, amount_cents, currency) VALUES ('', 'Maria', '', '', NULL, NULL, NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_purchases (organization_name, contact_name, contact_email, license_type, product_slug, stripe_payment_intent_id, stripe_checkout_session_id, tenant_id, status, amount_cents, currency) VALUES ('', 'David', '', '', NULL, NULL, NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;

-- license_requests
INSERT INTO license_requests (user_id, license_type, status, approved_at, approved_by) VALUES (NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_requests (user_id, license_type, status, approved_at, approved_by) VALUES (NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_requests (user_id, license_type, status, approved_at, approved_by) VALUES (NULL, NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- license_validations
INSERT INTO license_validations (license_id, result) VALUES (NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_validations (license_id, result) VALUES (NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_validations (license_id, result) VALUES (NULL, NULL) ON CONFLICT DO NOTHING;

-- license_violations
INSERT INTO license_violations (tenant_id, violation_type, feature) VALUES (NULL, '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_violations (tenant_id, violation_type, feature) VALUES (NULL, '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO license_violations (tenant_id, violation_type, feature) VALUES (NULL, '', NULL) ON CONFLICT DO NOTHING;

-- live_chat_messages
INSERT INTO live_chat_messages (session_id, sender_type, sender_user_id, body, attachments) VALUES ('511ff04c-7bd9-49c4-83a3-c2b13b30a9f7', '', NULL, 'Seed data for live chat messages', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO live_chat_messages (session_id, sender_type, sender_user_id, body, attachments) VALUES ('7d12092d-17e3-41bc-a49e-c78422500828', '', NULL, 'Seed data for live chat messages', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO live_chat_messages (session_id, sender_type, sender_user_id, body, attachments) VALUES ('80ec2f58-0231-4e67-8ce5-8bb413a61e01', '', NULL, 'Seed data for live chat messages', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- live_chat_sessions
INSERT INTO live_chat_sessions (user_id, visitor_id, status, subject, metadata, closed_at) VALUES (NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_chat_sessions (user_id, visitor_id, status, subject, metadata, closed_at) VALUES (NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_chat_sessions (user_id, visitor_id, status, subject, metadata, closed_at) VALUES (NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- live_classes
INSERT INTO live_classes (course_id, title, description, instructor_id, meeting_url, meeting_id, meeting_password, scheduled_start, scheduled_end, actual_start, actual_end, status, max_participants, recording_url) VALUES (NULL, 'Sample Live Classes 1', 'Seed data for live classes', NULL, NULL, NULL, NULL, '', '', NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_classes (course_id, title, description, instructor_id, meeting_url, meeting_id, meeting_password, scheduled_start, scheduled_end, actual_start, actual_end, status, max_participants, recording_url) VALUES (NULL, 'Sample Live Classes 2', 'Seed data for live classes', NULL, NULL, NULL, NULL, '', '', NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_classes (course_id, title, description, instructor_id, meeting_url, meeting_id, meeting_password, scheduled_start, scheduled_end, actual_start, actual_end, status, max_participants, recording_url) VALUES (NULL, 'Sample Live Classes 3', 'Seed data for live classes', NULL, NULL, NULL, NULL, '', '', NULL, NULL, 'active', 0, NULL) ON CONFLICT DO NOTHING;

-- live_session_attendance
INSERT INTO live_session_attendance (data, session_id, user_id, left_at) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_session_attendance (data, session_id, user_id, left_at) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO live_session_attendance (data, session_id, user_id, left_at) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- lms_progress
INSERT INTO lms_progress (user_id, course_id, course_slug, status, completed_at, evidence_url, progress_percent) VALUES ('99b1271a-c7fe-4d94-8d7e-a8fbf87e2986', 'b3c621db-031a-4825-b148-4aa4550b9ce3', NULL, 'active', NULL, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO lms_progress (user_id, course_id, course_slug, status, completed_at, evidence_url, progress_percent) VALUES ('19e37599-788e-4f6c-abb4-e1951fff5f60', 'ce0f59a1-309a-4b1e-a945-2e8a5e34c2ab', NULL, 'active', NULL, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO lms_progress (user_id, course_id, course_slug, status, completed_at, evidence_url, progress_percent) VALUES ('b99d82a7-06b2-45e3-ac57-aea2a5e0c638', 'ff27689a-7cfc-4f88-a98e-cab7727a9892', NULL, 'active', NULL, NULL, 0) ON CONFLICT DO NOTHING;

-- lms_sync_log
INSERT INTO lms_sync_log (provider_id, sync_type, status, records_processed, records_failed, error_message, sync_data, completed_at) VALUES ('bc44c7f4-6631-4d36-8c11-c2e72c3a3c5c', '', 'active', 0, 0, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO lms_sync_log (provider_id, sync_type, status, records_processed, records_failed, error_message, sync_data, completed_at) VALUES ('188896d6-b1e5-4480-95b1-e96edafe9ab0', '', 'active', 0, 0, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO lms_sync_log (provider_id, sync_type, status, records_processed, records_failed, error_message, sync_data, completed_at) VALUES ('77da2442-d933-485e-bee5-a625a782d621', '', 'active', 0, 0, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- managed_licenses
INSERT INTO managed_licenses (organization_id, status, tier, plan_id, trial_started_at, trial_ends_at, expires_at, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, last_payment_status, last_invoice_url, canceled_at, suspended_at) VALUES ('f22199b7-7140-4e9c-ac45-3713d22703bb', 'active', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO managed_licenses (organization_id, status, tier, plan_id, trial_started_at, trial_ends_at, expires_at, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, last_payment_status, last_invoice_url, canceled_at, suspended_at) VALUES ('5090cc90-5497-45a9-a7cc-632fa6ef238a', 'active', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO managed_licenses (organization_id, status, tier, plan_id, trial_started_at, trial_ends_at, expires_at, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, last_payment_status, last_invoice_url, canceled_at, suspended_at) VALUES ('ba952b49-f55a-4c7d-bede-28eb09f5c5ec', 'active', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- marketing_campaign_sends
INSERT INTO marketing_campaign_sends (campaign_id, contact_id, opened_at, clicked_at, bounced) VALUES (NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO marketing_campaign_sends (campaign_id, contact_id, opened_at, clicked_at, bounced) VALUES (NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO marketing_campaign_sends (campaign_id, contact_id, opened_at, clicked_at, bounced) VALUES (NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;

-- marketing_pages
INSERT INTO marketing_pages (id, slug, title, subtitle, hero_image, hero_alt, published, created_at, updated_at) VALUES ('4abbe197-9d83-4231-92f6-7dfe5c01a903', 'sample-marketing_pages-1', 'Sample Marketing Pages 1', NULL, '', '', true, '', '') ON CONFLICT DO NOTHING;
INSERT INTO marketing_pages (id, slug, title, subtitle, hero_image, hero_alt, published, created_at, updated_at) VALUES ('7c190d79-b594-4953-bd54-a39eedd43655', 'sample-marketing_pages-2', 'Sample Marketing Pages 2', NULL, '', '', true, '', '') ON CONFLICT DO NOTHING;
INSERT INTO marketing_pages (id, slug, title, subtitle, hero_image, hero_alt, published, created_at, updated_at) VALUES ('b20f0b7c-6fd4-4f4c-8b67-09a0b7a87139', 'sample-marketing_pages-3', 'Sample Marketing Pages 3', NULL, '', '', true, '', '') ON CONFLICT DO NOTHING;

-- marketing_sections
INSERT INTO marketing_sections (page_id, heading, body, section_order) VALUES ('98c4d1c7-1983-4079-931e-bbd75852e3e4', '', 'Seed data for marketing sections', 0) ON CONFLICT DO NOTHING;
INSERT INTO marketing_sections (page_id, heading, body, section_order) VALUES ('15d8f85a-40fe-4279-b238-8f4a5e2f1ae3', '', 'Seed data for marketing sections', 0) ON CONFLICT DO NOTHING;
INSERT INTO marketing_sections (page_id, heading, body, section_order) VALUES ('6ebe72ba-fe91-4348-ab51-d331467c0623', '', 'Seed data for marketing sections', 0) ON CONFLICT DO NOTHING;

-- marketplace_creators
INSERT INTO marketplace_creators (user_id, display_name, bio, payout_method, payout_email, revenue_split, status, rejection_reason, rejected_at, rejected_by, approved_at, approved_by) VALUES (NULL, '', NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_creators (user_id, display_name, bio, payout_method, payout_email, revenue_split, status, rejection_reason, rejected_at, rejected_by, approved_at, approved_by) VALUES (NULL, '', NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_creators (user_id, display_name, bio, payout_method, payout_email, revenue_split, status, rejection_reason, rejected_at, rejected_by, approved_at, approved_by) VALUES (NULL, '', NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- marketplace_products
INSERT INTO marketplace_products (creator_id, title, description, price_cents, stripe_price_id, file_url, thumbnail_url, category, status, rejection_reason) VALUES (NULL, 'Sample Marketplace Products 1', 'Seed data for marketplace products', 0, NULL, NULL, NULL, 'general', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_products (creator_id, title, description, price_cents, stripe_price_id, file_url, thumbnail_url, category, status, rejection_reason) VALUES (NULL, 'Sample Marketplace Products 2', 'Seed data for marketplace products', 0, NULL, NULL, NULL, 'general', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_products (creator_id, title, description, price_cents, stripe_price_id, file_url, thumbnail_url, category, status, rejection_reason) VALUES (NULL, 'Sample Marketplace Products 3', 'Seed data for marketplace products', 0, NULL, NULL, NULL, 'general', 'active', NULL) ON CONFLICT DO NOTHING;

-- marketplace_sales
INSERT INTO marketplace_sales (product_id, creator_id, buyer_email, amount_cents, creator_earnings_cents, platform_earnings_cents, stripe_session_id, stripe_payment_intent_id, download_token, download_expires_at, paid_out, payout_date) VALUES (NULL, NULL, '', 0, 0, 0, NULL, NULL, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_sales (product_id, creator_id, buyer_email, amount_cents, creator_earnings_cents, platform_earnings_cents, stripe_session_id, stripe_payment_intent_id, download_token, download_expires_at, paid_out, payout_date) VALUES (NULL, NULL, '', 0, 0, 0, NULL, NULL, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO marketplace_sales (product_id, creator_id, buyer_email, amount_cents, creator_earnings_cents, platform_earnings_cents, stripe_session_id, stripe_payment_intent_id, download_token, download_expires_at, paid_out, payout_date) VALUES (NULL, NULL, '', 0, 0, 0, NULL, NULL, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;

-- media
INSERT INTO media (path, uploaded_by) VALUES ('', NULL) ON CONFLICT DO NOTHING;
INSERT INTO media (path, uploaded_by) VALUES ('', NULL) ON CONFLICT DO NOTHING;
INSERT INTO media (path, uploaded_by) VALUES ('', NULL) ON CONFLICT DO NOTHING;

-- meeting_action_items
INSERT INTO meeting_action_items (recap_id, label, due_date, completed_at, completed_by) VALUES ('791334b6-f9c6-4714-8709-002fc0d957d8', '', CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO meeting_action_items (recap_id, label, due_date, completed_at, completed_by) VALUES ('a3d7a4bc-b802-449d-9b81-7041006e57fa', '', CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO meeting_action_items (recap_id, label, due_date, completed_at, completed_by) VALUES ('79595e09-af92-48c6-bb0f-75bd85baec71', '', CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;

-- meeting_recaps
INSERT INTO meeting_recaps (organization_id, created_by, attendee_email, title, meeting_date, source, transcript, summary, key_points, decisions, follow_up_email) VALUES (NULL, NULL, NULL, 'Sample Meeting Recaps 1', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO meeting_recaps (organization_id, created_by, attendee_email, title, meeting_date, source, transcript, summary, key_points, decisions, follow_up_email) VALUES (NULL, NULL, NULL, 'Sample Meeting Recaps 2', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO meeting_recaps (organization_id, created_by, attendee_email, title, meeting_date, source, transcript, summary, key_points, decisions, follow_up_email) VALUES (NULL, NULL, NULL, 'Sample Meeting Recaps 3', NULL, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- mef_acknowledgments
INSERT INTO mef_acknowledgments (submission_id, status, dcn, accepted_at, rejected_at, errors) VALUES ('', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO mef_acknowledgments (submission_id, status, dcn, accepted_at, rejected_at, errors) VALUES ('', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO mef_acknowledgments (submission_id, status, dcn, accepted_at, rejected_at, errors) VALUES ('', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- mef_errors
INSERT INTO mef_errors (submission_id, error_code, error_category, error_message, field_name, rule_number, resolved, resolved_at) VALUES ('', '', '', '', NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO mef_errors (submission_id, error_code, error_category, error_message, field_name, rule_number, resolved, resolved_at) VALUES ('', '', '', '', NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO mef_errors (submission_id, error_code, error_category, error_message, field_name, rule_number, resolved, resolved_at) VALUES ('', '', '', '', NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;

-- mef_submissions
INSERT INTO mef_submissions (submission_id, user_id, efin, software_id, tax_year, submission_type, taxpayer_ssn_hash, taxpayer_name, return_data, xml_content, status, dcn, acknowledgment, error_message, resubmission_count, original_submission_id, transmitted_at, office_id, preparer_id, ero_id, preparer_ptin, client_fee, franchise_fee, preparer_commission, office_revenue) VALUES ('', NULL, '', NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, 'active', NULL, '{}'::jsonb, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO mef_submissions (submission_id, user_id, efin, software_id, tax_year, submission_type, taxpayer_ssn_hash, taxpayer_name, return_data, xml_content, status, dcn, acknowledgment, error_message, resubmission_count, original_submission_id, transmitted_at, office_id, preparer_id, ero_id, preparer_ptin, client_fee, franchise_fee, preparer_commission, office_revenue) VALUES ('', NULL, '', NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, 'active', NULL, '{}'::jsonb, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO mef_submissions (submission_id, user_id, efin, software_id, tax_year, submission_type, taxpayer_ssn_hash, taxpayer_name, return_data, xml_content, status, dcn, acknowledgment, error_message, resubmission_count, original_submission_id, transmitted_at, office_id, preparer_id, ero_id, preparer_ptin, client_fee, franchise_fee, preparer_commission, office_revenue) VALUES ('', NULL, '', NULL, 0, '', NULL, NULL, '{}'::jsonb, NULL, 'active', NULL, '{}'::jsonb, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0) ON CONFLICT DO NOTHING;

-- messages
INSERT INTO messages (sender_id, recipient_id, subject, body, read, read_at) VALUES (NULL, NULL, NULL, 'Seed data for messages', false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO messages (sender_id, recipient_id, subject, body, read, read_at) VALUES (NULL, NULL, NULL, 'Seed data for messages', false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO messages (sender_id, recipient_id, subject, body, read, read_at) VALUES (NULL, NULL, NULL, 'Seed data for messages', false, NULL) ON CONFLICT DO NOTHING;

-- moderation_actions
INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason) VALUES ('1d066a53-7b26-4fc5-af9b-2d75789d5316', '', 'cbff2fa5-aba8-476c-93c5-c433765d3826', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason) VALUES ('1f653c89-06ec-454a-a397-bfc98c303aee', '', 'bfa9d614-6cfa-429a-acd8-1c0feaff6837', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason) VALUES ('e0c53803-e7cc-4952-ab8d-03166f7862ca', '', 'a3065f11-24c5-4bf1-84c9-801905843dd0', '', NULL) ON CONFLICT DO NOTHING;

-- moderation_reports
INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, status, reviewed_by, reviewed_at) VALUES ('b63e5d49-8af1-46d2-a847-ddea25213807', '', '978a4d50-b06d-4f5f-9a53-f9ee0a543dd8', '', 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, status, reviewed_by, reviewed_at) VALUES ('d94c1093-1458-4b35-bd6b-39bc9ee57cd5', '', 'afc8f5cb-ebdd-469c-bd21-1c9d16c89f00', '', 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, status, reviewed_by, reviewed_at) VALUES ('ef2a89a8-8831-4576-9efc-e915b536a804', '', '6a1da207-bc81-4197-9005-7cd8b498b5ad', '', 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- moderation_rules
INSERT INTO moderation_rules (tenant_id, rule_name, rule_type, conditions, actions, is_active) VALUES (NULL, '', '', '{}'::jsonb, '{}'::jsonb, true) ON CONFLICT DO NOTHING;
INSERT INTO moderation_rules (tenant_id, rule_name, rule_type, conditions, actions, is_active) VALUES (NULL, '', '', '{}'::jsonb, '{}'::jsonb, true) ON CONFLICT DO NOTHING;
INSERT INTO moderation_rules (tenant_id, rule_name, rule_type, conditions, actions, is_active) VALUES (NULL, '', '', '{}'::jsonb, '{}'::jsonb, true) ON CONFLICT DO NOTHING;

-- module_certificates
INSERT INTO module_certificates (user_id, module_id, program_id, certificate_number, certificate_name, student_name, issued_by, issued_date, certificate_url, verification_url, is_partner_cert, partner_course_id) VALUES ('17de797d-c87a-49bd-a3ed-5fea8f146d44', NULL, NULL, '', '', NULL, '', CURRENT_DATE, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO module_certificates (user_id, module_id, program_id, certificate_number, certificate_name, student_name, issued_by, issued_date, certificate_url, verification_url, is_partner_cert, partner_course_id) VALUES ('c369efad-523f-44a6-a4e4-f0a38f31caf5', NULL, NULL, '', '', NULL, '', CURRENT_DATE, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO module_certificates (user_id, module_id, program_id, certificate_number, certificate_name, student_name, issued_by, issued_date, certificate_url, verification_url, is_partner_cert, partner_course_id) VALUES ('ec348767-4b95-4bd4-a1a7-c9a4755af848', NULL, NULL, '', '', NULL, '', CURRENT_DATE, NULL, NULL, false, NULL) ON CONFLICT DO NOTHING;

-- mou_signatures
INSERT INTO mou_signatures (student_record_id, signature_data, ip_address, user_agent) VALUES ('c8f7192e-71cd-4166-855a-f1fe03b4d533', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO mou_signatures (student_record_id, signature_data, ip_address, user_agent) VALUES ('c45d0f9d-ace9-4658-a3c4-8027a55067ac', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO mou_signatures (student_record_id, signature_data, ip_address, user_agent) VALUES ('20ce133c-19e9-4122-a020-f01937b40d64', '', NULL, NULL) ON CONFLICT DO NOTHING;

-- notification_events
INSERT INTO notification_events (user_id, channel, event_type, payload, status, error, processed_at) VALUES (NULL, '', '', '{}'::jsonb, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_events (user_id, channel, event_type, payload, status, error, processed_at) VALUES (NULL, '', '', '{}'::jsonb, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_events (user_id, channel, event_type, payload, status, error, processed_at) VALUES (NULL, '', '', '{}'::jsonb, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- notification_log
INSERT INTO notification_log (recipient_id, notification_type, subject, message, status, metadata) VALUES ('1b72c71a-31a8-4d7c-a449-6e6f647730f9', '', NULL, 'Seed note for notification_log', 'active', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO notification_log (recipient_id, notification_type, subject, message, status, metadata) VALUES ('67ea5c95-2776-4b6b-a423-089dc32ca1b7', '', NULL, 'Seed note for notification_log', 'active', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO notification_log (recipient_id, notification_type, subject, message, status, metadata) VALUES ('f293dcd2-6773-4aaf-9536-874091e274f2', '', NULL, 'Seed note for notification_log', 'active', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- notification_logs
INSERT INTO notification_logs (user_id, title, body, data, type, status, error_message, sent_at) VALUES ('d5c3811c-590c-46bb-b75f-f45d3a442737', 'Sample Notification Logs 1', 'Seed data for notification logs', '{}'::jsonb, 'general', 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_logs (user_id, title, body, data, type, status, error_message, sent_at) VALUES ('0b61ca4c-bd16-47b5-95bf-181461332df6', 'Sample Notification Logs 2', 'Seed data for notification logs', '{}'::jsonb, 'general', 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_logs (user_id, title, body, data, type, status, error_message, sent_at) VALUES ('bd08632a-3045-4e7c-a964-629bd5cde694', 'Sample Notification Logs 3', 'Seed data for notification logs', '{}'::jsonb, 'general', 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- notification_outbox
INSERT INTO notification_outbox (to_email, to_phone, channel, template_key, template_data, status, attempts, max_attempts, last_error, sent_at, entity_type, entity_id) VALUES (NULL, NULL, NULL, '', '{}'::jsonb, 'active', 0, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_outbox (to_email, to_phone, channel, template_key, template_data, status, attempts, max_attempts, last_error, sent_at, entity_type, entity_id) VALUES (NULL, NULL, NULL, '', '{}'::jsonb, 'active', 0, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_outbox (to_email, to_phone, channel, template_key, template_data, status, attempts, max_attempts, last_error, sent_at, entity_type, entity_id) VALUES (NULL, NULL, NULL, '', '{}'::jsonb, 'active', 0, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- notification_preferences
INSERT INTO notification_preferences (program_holder_id, email_enabled, sms_enabled, phone_e164, sms_consent, sms_consent_at, sms_opt_out, user_id) VALUES ('4994fb65-f429-41cb-baba-479eeecb69b9', false, false, NULL, false, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_preferences (program_holder_id, email_enabled, sms_enabled, phone_e164, sms_consent, sms_consent_at, sms_opt_out, user_id) VALUES ('b7619cc1-b04d-48f6-80fc-f807d4770753', false, false, NULL, false, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO notification_preferences (program_holder_id, email_enabled, sms_enabled, phone_e164, sms_consent, sms_consent_at, sms_opt_out, user_id) VALUES ('b9167074-4bf4-4c5b-8283-ada71c05a2d3', false, false, NULL, false, NULL, false, NULL) ON CONFLICT DO NOTHING;

-- notifications
INSERT INTO notifications (user_id, type, title, message, action_url, action_label, metadata, idempotency_key, read) VALUES (NULL, 'general', 'Sample Notifications 1', 'Seed note for notifications', NULL, NULL, '{}'::jsonb, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO notifications (user_id, type, title, message, action_url, action_label, metadata, idempotency_key, read) VALUES (NULL, 'general', 'Sample Notifications 2', 'Seed note for notifications', NULL, NULL, '{}'::jsonb, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO notifications (user_id, type, title, message, action_url, action_label, metadata, idempotency_key, read) VALUES (NULL, 'general', 'Sample Notifications 3', 'Seed note for notifications', NULL, NULL, '{}'::jsonb, NULL, false) ON CONFLICT DO NOTHING;

-- ocr_extractions
INSERT INTO ocr_extractions (client_id, file_name, file_type, document_type, confidence, processing_time_ms) VALUES (NULL, NULL, NULL, NULL, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO ocr_extractions (client_id, file_name, file_type, document_type, confidence, processing_time_ms) VALUES (NULL, NULL, NULL, NULL, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO ocr_extractions (client_id, file_name, file_type, document_type, confidence, processing_time_ms) VALUES (NULL, NULL, NULL, NULL, 0, 0) ON CONFLICT DO NOTHING;

-- ojt_hours_log
INSERT INTO ojt_hours_log (apprenticeship_id, student_id, work_date, check_in_time, check_out_time, total_hours, cuts_completed, approved) VALUES ('d947d41a-711a-470f-be27-29a318000c43', '064eb261-5cdb-439e-aa53-a66828610a58', CURRENT_DATE, '', NULL, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO ojt_hours_log (apprenticeship_id, student_id, work_date, check_in_time, check_out_time, total_hours, cuts_completed, approved) VALUES ('f4c9a948-2a66-455b-acc9-60db104db523', '4bbfdd04-ff10-42a5-973d-a40159eb4f1b', CURRENT_DATE, '', NULL, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO ojt_hours_log (apprenticeship_id, student_id, work_date, check_in_time, check_out_time, total_hours, cuts_completed, approved) VALUES ('f91e8129-0e49-428e-beed-7474de2a378e', '163c18d6-ed5c-4c0a-8d06-113e45037c41', CURRENT_DATE, '', NULL, 0, 0, false) ON CONFLICT DO NOTHING;

-- ojt_reimbursements
INSERT INTO ojt_reimbursements (apprentice_id, employer_id, wage_rate, reimbursement_rate, hours_worked, status, amount_due) VALUES (NULL, NULL, 0, 0, 0, 'active', 0) ON CONFLICT DO NOTHING;
INSERT INTO ojt_reimbursements (apprentice_id, employer_id, wage_rate, reimbursement_rate, hours_worked, status, amount_due) VALUES (NULL, NULL, 0, 0, 0, 'active', 0) ON CONFLICT DO NOTHING;
INSERT INTO ojt_reimbursements (apprentice_id, employer_id, wage_rate, reimbursement_rate, hours_worked, status, amount_due) VALUES (NULL, NULL, 0, 0, 0, 'active', 0) ON CONFLICT DO NOTHING;

-- onboarding_documents
INSERT INTO onboarding_documents (packet_id, title, document_url, requires_signature, sort_order) VALUES (NULL, 'Sample Onboarding Documents 1', NULL, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_documents (packet_id, title, document_url, requires_signature, sort_order) VALUES (NULL, 'Sample Onboarding Documents 2', NULL, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_documents (packet_id, title, document_url, requires_signature, sort_order) VALUES (NULL, 'Sample Onboarding Documents 3', NULL, false, 0) ON CONFLICT DO NOTHING;

-- onboarding_packets
INSERT INTO onboarding_packets (role, title, description, is_active) VALUES ('user', 'Sample Onboarding Packets 1', 'Seed data for onboarding packets', true) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_packets (role, title, description, is_active) VALUES ('user', 'Sample Onboarding Packets 2', 'Seed data for onboarding packets', true) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_packets (role, title, description, is_active) VALUES ('user', 'Sample Onboarding Packets 3', 'Seed data for onboarding packets', true) ON CONFLICT DO NOTHING;

-- onboarding_progress
INSERT INTO onboarding_progress (user_id, role, is_complete, current_step, completed_at, tenant_id, profile_completed, profile_completed_at, agreements_completed, agreements_completed_at, handbook_acknowledged, handbook_acknowledged_at, documents_uploaded, documents_uploaded_at, status) VALUES (NULL, 'user', false, 0, NULL, NULL, false, NULL, false, NULL, false, NULL, false, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO onboarding_progress (user_id, role, is_complete, current_step, completed_at, tenant_id, profile_completed, profile_completed_at, agreements_completed, agreements_completed_at, handbook_acknowledged, handbook_acknowledged_at, documents_uploaded, documents_uploaded_at, status) VALUES (NULL, 'user', false, 0, NULL, NULL, false, NULL, false, NULL, false, NULL, false, NULL, 'active') ON CONFLICT DO NOTHING;
INSERT INTO onboarding_progress (user_id, role, is_complete, current_step, completed_at, tenant_id, profile_completed, profile_completed_at, agreements_completed, agreements_completed_at, handbook_acknowledged, handbook_acknowledged_at, documents_uploaded, documents_uploaded_at, status) VALUES (NULL, 'user', false, 0, NULL, NULL, false, NULL, false, NULL, false, NULL, false, NULL, 'active') ON CONFLICT DO NOTHING;

-- onboarding_signatures
INSERT INTO onboarding_signatures (user_id, document_id, signature_data) VALUES (NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_signatures (user_id, document_id, signature_data) VALUES (NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_signatures (user_id, document_id, signature_data) VALUES (NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- onboarding_steps
INSERT INTO onboarding_steps (user_id, step_name, completed, completed_at, data) VALUES (NULL, '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_steps (user_id, step_name, completed, completed_at, data) VALUES (NULL, '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO onboarding_steps (user_id, step_name, completed, completed_at, data) VALUES (NULL, '', false, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- order_items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ('603af4af-b553-45c9-967a-4ecbbd594e4c', NULL, '', 0, 7) ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ('af030417-ea53-4296-8358-df9405764573', NULL, '', 0, 9) ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ('7798c59f-3858-4e7f-a1a3-eaab5d7dcda7', NULL, '', 0, 6) ON CONFLICT DO NOTHING;

-- orders
INSERT INTO orders (user_id, status, total, stripe_session_id) VALUES ('7c17b066-4dd8-44b7-ae58-e35441c7e679', 'active', 3618.87, NULL) ON CONFLICT DO NOTHING;
INSERT INTO orders (user_id, status, total, stripe_session_id) VALUES ('bc4ec642-00d3-4546-a618-719d62013afa', 'active', 3735.34, NULL) ON CONFLICT DO NOTHING;
INSERT INTO orders (user_id, status, total, stripe_session_id) VALUES ('00c53954-1f87-4209-a1f0-aa3c206a5469', 'active', 4267.61, NULL) ON CONFLICT DO NOTHING;

-- org_invites
INSERT INTO org_invites (organization_id, email, role, token, expires_at, created_by) VALUES ('39231bc7-6a63-477e-8c48-8af328d96bcf', 'user1@example.com', 'user', '', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO org_invites (organization_id, email, role, token, expires_at, created_by) VALUES ('5ff68d75-8b70-4b6a-abd6-26058db099e7', 'user2@example.com', 'user', '', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO org_invites (organization_id, email, role, token, expires_at, created_by) VALUES ('1690eda9-0279-4c7d-b234-72dc0092cc12', 'user3@example.com', 'user', '', '', NULL) ON CONFLICT DO NOTHING;

-- organization_roles
INSERT INTO organization_roles (organization_id, role_name, permissions) VALUES ('47da8dba-9f14-419e-a19c-5e3dc3e2b785', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO organization_roles (organization_id, role_name, permissions) VALUES ('e68fd01b-7975-40ad-9896-aa7e5bd718b5', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO organization_roles (organization_id, role_name, permissions) VALUES ('68703f75-8c5d-4a65-bd0a-3074a49fc770', '', NULL) ON CONFLICT DO NOTHING;

-- organization_subscriptions
INSERT INTO organization_subscriptions (organization_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_start, current_period_end, cancel_at_period_end, licenses_included, licenses_used) VALUES ('c46daa6c-fe75-4422-8475-6d2057e0db0e', NULL, NULL, '', 'active', NULL, NULL, false, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO organization_subscriptions (organization_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_start, current_period_end, cancel_at_period_end, licenses_included, licenses_used) VALUES ('b83d7f68-f498-4eca-b4ce-1c8c12227b9e', NULL, NULL, '', 'active', NULL, NULL, false, 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO organization_subscriptions (organization_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_start, current_period_end, cancel_at_period_end, licenses_included, licenses_used) VALUES ('e7843b6f-9ecf-407c-b204-df3a6619ee84', NULL, NULL, '', 'active', NULL, NULL, false, 0, 0) ON CONFLICT DO NOTHING;

-- page_versions
INSERT INTO page_versions (data, page_slug, version, content, published_by, published_at) VALUES ('{}'::jsonb, NULL, 0, 'Seed data for page versions', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO page_versions (data, page_slug, version, content, published_by, published_at) VALUES ('{}'::jsonb, NULL, 0, 'Seed data for page versions', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO page_versions (data, page_slug, version, content, published_by, published_at) VALUES ('{}'::jsonb, NULL, 0, 'Seed data for page versions', NULL, NULL) ON CONFLICT DO NOTHING;

-- page_views
INSERT INTO page_views (path, user_id, session_id, referrer, user_agent, ip_address) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO page_views (path, user_id, session_id, referrer, user_agent, ip_address) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO page_views (path, user_id, session_id, referrer, user_agent, ip_address) VALUES ('', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- participant_demographics
INSERT INTO participant_demographics (id, user_id, date_of_birth, gender, race_ethnicity, is_veteran, veteran_era, has_disability, disability_type, is_low_income, household_size, annual_household_income, highest_education, employment_status_at_entry, receiving_public_assistance, barriers, consent_to_share_data, consent_date, created_at, updated_at) VALUES (0, 0, CURRENT_DATE, NULL, NULL, false, NULL, false, NULL, false, 0, 0, NULL, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO participant_demographics (id, user_id, date_of_birth, gender, race_ethnicity, is_veteran, veteran_era, has_disability, disability_type, is_low_income, household_size, annual_household_income, highest_education, employment_status_at_entry, receiving_public_assistance, barriers, consent_to_share_data, consent_date, created_at, updated_at) VALUES (0, 0, CURRENT_DATE, NULL, NULL, false, NULL, false, NULL, false, 0, 0, NULL, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO participant_demographics (id, user_id, date_of_birth, gender, race_ethnicity, is_veteran, veteran_era, has_disability, disability_type, is_low_income, household_size, annual_household_income, highest_education, employment_status_at_entry, receiving_public_assistance, barriers, consent_to_share_data, consent_date, created_at, updated_at) VALUES (0, 0, CURRENT_DATE, NULL, NULL, false, NULL, false, NULL, false, 0, 0, NULL, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;

-- participant_eligibility
INSERT INTO participant_eligibility (user_id, date_of_birth, gender, ethnicity, race, is_veteran, veteran_verified_at, is_dislocated_worker, dislocated_worker_verified_at, is_low_income, low_income_verified_at, is_youth, youth_verified_at, has_disability, disability_verified_at, eligibility_status, approved_by, approved_at, expires_at) VALUES ('841b597d-795d-4fed-afed-90dfd92bd461', CURRENT_DATE, NULL, NULL, '{}'::jsonb, false, NULL, false, NULL, false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO participant_eligibility (user_id, date_of_birth, gender, ethnicity, race, is_veteran, veteran_verified_at, is_dislocated_worker, dislocated_worker_verified_at, is_low_income, low_income_verified_at, is_youth, youth_verified_at, has_disability, disability_verified_at, eligibility_status, approved_by, approved_at, expires_at) VALUES ('6a0a760f-f592-4f1e-916f-ba74e7871c8f', CURRENT_DATE, NULL, NULL, '{}'::jsonb, false, NULL, false, NULL, false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO participant_eligibility (user_id, date_of_birth, gender, ethnicity, race, is_veteran, veteran_verified_at, is_dislocated_worker, dislocated_worker_verified_at, is_low_income, low_income_verified_at, is_youth, youth_verified_at, has_disability, disability_verified_at, eligibility_status, approved_by, approved_at, expires_at) VALUES ('cc789a74-a7dc-40ae-8d5f-c40a6175a63c', CURRENT_DATE, NULL, NULL, '{}'::jsonb, false, NULL, false, NULL, false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- partner_applications
INSERT INTO partner_applications (shop_name, dba, owner_name, contact_email, phone, address_line1, city, state, zip, programs_requested, agreed_to_terms, status, intake, email, approval_status) VALUES ('', NULL, '', '', '317-555-1000', '', 'Indianapolis', 'IN', '46204', NULL, false, 'active', '{}'::jsonb, 'user1@example.com', NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (shop_name, dba, owner_name, contact_email, phone, address_line1, city, state, zip, programs_requested, agreed_to_terms, status, intake, email, approval_status) VALUES ('', NULL, '', '', '317-555-1001', '', 'Indianapolis', 'IN', '46204', NULL, false, 'active', '{}'::jsonb, 'user2@example.com', NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (shop_name, dba, owner_name, contact_email, phone, address_line1, city, state, zip, programs_requested, agreed_to_terms, status, intake, email, approval_status) VALUES ('', NULL, '', '', '317-555-1002', '', 'Indianapolis', 'IN', '46204', NULL, false, 'active', '{}'::jsonb, 'user3@example.com', NULL) ON CONFLICT DO NOTHING;

-- partner_audit_log
INSERT INTO partner_audit_log (partner_id, user_id, action, entity_type) VALUES (NULL, NULL, '', '') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit_log (partner_id, user_id, action, entity_type) VALUES (NULL, NULL, '', '') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit_log (partner_id, user_id, action, entity_type) VALUES (NULL, NULL, '', '') ON CONFLICT DO NOTHING;

-- partner_certificates
INSERT INTO partner_certificates (enrollment_id, student_id, partner_id, certificate_url, issued_date) VALUES ('eef83f5c-2290-4584-b6e1-533688b32377', 'd0856898-ac82-410c-b2f2-93e8c7c6154f', '70801ad9-adf2-4356-aaeb-533d37b163da', NULL, '') ON CONFLICT DO NOTHING;
INSERT INTO partner_certificates (enrollment_id, student_id, partner_id, certificate_url, issued_date) VALUES ('2cf11c28-9cc6-431b-8477-e7b7cc36909b', '5c09ce83-dff7-4e2c-a36b-26ea18d4a9b9', '1b9b673c-be3e-4961-9fc4-99c54ae17f40', NULL, '') ON CONFLICT DO NOTHING;
INSERT INTO partner_certificates (enrollment_id, student_id, partner_id, certificate_url, issued_date) VALUES ('73802816-527c-44fd-aac1-f697b65be1dd', '57efbba6-0d6e-4f0d-9e4e-faeefacc4510', '5a173256-7cab-46f0-b302-274ef094abeb', NULL, '') ON CONFLICT DO NOTHING;

-- partner_course_enrollments
INSERT INTO partner_course_enrollments (user_id, partner_course_id, partner_id, status, completed_at, progress_percent, funding_source, external_enrollment_id) VALUES ('e0cc85de-763f-4102-b7de-72cd733ee9de', NULL, NULL, 'active', NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_course_enrollments (user_id, partner_course_id, partner_id, status, completed_at, progress_percent, funding_source, external_enrollment_id) VALUES ('1f28d540-7f29-4d2c-be1d-305fafa2137b', NULL, NULL, 'active', NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_course_enrollments (user_id, partner_course_id, partner_id, status, completed_at, progress_percent, funding_source, external_enrollment_id) VALUES ('0a5d1071-4f1c-41e6-8df9-09ee3224f524', NULL, NULL, 'active', NULL, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- partner_course_mappings
INSERT INTO partner_course_mappings (partner_course_id, internal_program_id, internal_course_id, scorm_package_id, mapping_type, active, metadata) VALUES ('65b0ddd8-b0d2-44f9-b5d2-d376946cec6a', NULL, NULL, NULL, NULL, true, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_course_mappings (partner_course_id, internal_program_id, internal_course_id, scorm_package_id, mapping_type, active, metadata) VALUES ('f9297af8-c8bc-4db7-b4eb-0946ec089a89', NULL, NULL, NULL, NULL, true, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_course_mappings (partner_course_id, internal_program_id, internal_course_id, scorm_package_id, mapping_type, active, metadata) VALUES ('e75c2b03-fd34-4347-b488-229e137ea642', NULL, NULL, NULL, NULL, true, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- partner_documents
INSERT INTO partner_documents (organization_id, name, file_url, doc_type, status, tenant_id, partner_id, document_type, program_id, state, file_name) VALUES (NULL, 'Sample Partner Documents 1', NULL, NULL, 'active', NULL, NULL, NULL, NULL, 'IN', NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_documents (organization_id, name, file_url, doc_type, status, tenant_id, partner_id, document_type, program_id, state, file_name) VALUES (NULL, 'Sample Partner Documents 2', NULL, NULL, 'active', NULL, NULL, NULL, NULL, 'IN', NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_documents (organization_id, name, file_url, doc_type, status, tenant_id, partner_id, document_type, program_id, state, file_name) VALUES (NULL, 'Sample Partner Documents 3', NULL, NULL, 'active', NULL, NULL, NULL, NULL, 'IN', NULL) ON CONFLICT DO NOTHING;

-- partner_enrollments
INSERT INTO partner_enrollments (partner_id, student_id, program_id, enrollment_date, status, funding_source, metadata) VALUES (NULL, 'ca2b801d-fab6-48d5-80b6-a5cf3c8b2dfe', NULL, CURRENT_DATE, 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_enrollments (partner_id, student_id, program_id, enrollment_date, status, funding_source, metadata) VALUES (NULL, 'f841c5b9-0f25-4eb3-b7a3-90a865a0cd10', NULL, CURRENT_DATE, 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_enrollments (partner_id, student_id, program_id, enrollment_date, status, funding_source, metadata) VALUES (NULL, 'c93f3dc8-587e-4862-b89f-dc40b1fe6329', NULL, CURRENT_DATE, 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- partner_lms_enrollment_failures
INSERT INTO partner_lms_enrollment_failures (student_id, provider_id, course_id, program_id, error_code, error_message, payload, tenant_id) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, '18365dc0-8955-43b2-b5df-76e8c77ea61b') ON CONFLICT DO NOTHING;
INSERT INTO partner_lms_enrollment_failures (student_id, provider_id, course_id, program_id, error_code, error_message, payload, tenant_id) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, '0acf8118-8f63-4f8a-9f45-28871f5cdd8b') ON CONFLICT DO NOTHING;
INSERT INTO partner_lms_enrollment_failures (student_id, provider_id, course_id, program_id, error_code, error_message, payload, tenant_id) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, 'fd6f3633-a4a0-4107-8228-9036539dafe1') ON CONFLICT DO NOTHING;

-- partner_mous
INSERT INTO partner_mous (partner_id, mou_version, status, signed_at, signed_by, document_url, effective_date, expiry_date, terms) VALUES ('dec84d32-6d9c-4d83-b726-d8d23ff13724', '', 'active', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_mous (partner_id, mou_version, status, signed_at, signed_by, document_url, effective_date, expiry_date, terms) VALUES ('5cbe0135-ed09-4d1c-837f-ba4733ef96a6', '', 'active', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_mous (partner_id, mou_version, status, signed_at, signed_by, document_url, effective_date, expiry_date, terms) VALUES ('ea05a7b5-b13c-4b9b-84d3-38a633bb4cd7', '', 'active', NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- partner_program_access
INSERT INTO partner_program_access (partner_id, program_id) VALUES ('660c45b3-a66c-4d9d-a2bd-48cbedc7a5eb', '') ON CONFLICT DO NOTHING;
INSERT INTO partner_program_access (partner_id, program_id) VALUES ('b466085d-934b-4d4c-b9f1-e236d7258e90', '') ON CONFLICT DO NOTHING;
INSERT INTO partner_program_access (partner_id, program_id) VALUES ('4d38ee37-d6cb-4c03-9ed0-a5bf9a654719', '') ON CONFLICT DO NOTHING;

-- partner_sites
INSERT INTO partner_sites (organization_id, name, address, city, state, zip, status, tenant_id, partner_id, zip_code, capacity, current_apprentices, supervisor_name, supervisor_phone, programs_supported) VALUES (NULL, 'Sample Partner Sites 1', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', 'active', NULL, NULL, '46204', 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_sites (organization_id, name, address, city, state, zip, status, tenant_id, partner_id, zip_code, capacity, current_apprentices, supervisor_name, supervisor_phone, programs_supported) VALUES (NULL, 'Sample Partner Sites 2', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', 'active', NULL, NULL, '46204', 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_sites (organization_id, name, address, city, state, zip, status, tenant_id, partner_id, zip_code, capacity, current_apprentices, supervisor_name, supervisor_phone, programs_supported) VALUES (NULL, 'Sample Partner Sites 3', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', 'active', NULL, NULL, '46204', 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- partner_users
INSERT INTO partner_users (user_id, partner_id, role, status) VALUES ('e09b1c28-ac8e-4c1e-86ff-7e8c2292fd5d', 'c8509c4c-f51b-418e-972c-328f5ed2e6c3', 'user', 'active') ON CONFLICT DO NOTHING;
INSERT INTO partner_users (user_id, partner_id, role, status) VALUES ('775b424a-d75f-466b-b41a-295b17a2da25', 'bc0d8671-d059-4145-85ed-443af01093e1', 'user', 'active') ON CONFLICT DO NOTHING;
INSERT INTO partner_users (user_id, partner_id, role, status) VALUES ('c270f59e-2376-4f7a-aacf-4ddfc4730603', 'a36d91ac-7188-41b9-bfdb-f6047252be7d', 'user', 'active') ON CONFLICT DO NOTHING;

-- pay_stubs
INSERT INTO pay_stubs (payroll_run_id, employee_id, gross_pay, net_pay, federal_tax, state_tax, social_security, medicare, deductions) VALUES (NULL, NULL, 0, 0, 0, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO pay_stubs (payroll_run_id, employee_id, gross_pay, net_pay, federal_tax, state_tax, social_security, medicare, deductions) VALUES (NULL, NULL, 0, 0, 0, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO pay_stubs (payroll_run_id, employee_id, gross_pay, net_pay, federal_tax, state_tax, social_security, medicare, deductions) VALUES (NULL, NULL, 0, 0, 0, 0, 0, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- payment_logs
INSERT INTO payment_logs (user_id, application_id, enrollment_id, stripe_session_id, stripe_payment_intent_id, payment_option, amount, currency, status, metadata, completed_at) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, 3201.91, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payment_logs (user_id, application_id, enrollment_id, stripe_session_id, stripe_payment_intent_id, payment_option, amount, currency, status, metadata, completed_at) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, 3921.08, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payment_logs (user_id, application_id, enrollment_id, stripe_session_id, stripe_payment_intent_id, payment_option, amount, currency, status, metadata, completed_at) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, 1296.15, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- payment_records
INSERT INTO payment_records (user_id, amount, currency, status, stripe_payment_intent_id, description, metadata) VALUES (NULL, 4620.17, NULL, 'active', NULL, 'Seed data for payment records', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO payment_records (user_id, amount, currency, status, stripe_payment_intent_id, description, metadata) VALUES (NULL, 2582.76, NULL, 'active', NULL, 'Seed data for payment records', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO payment_records (user_id, amount, currency, status, stripe_payment_intent_id, description, metadata) VALUES (NULL, 2771.05, NULL, 'active', NULL, 'Seed data for payment records', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- payments
INSERT INTO payments (user_id, amount, currency, status, payment_method, stripe_payment_intent_id, description, metadata, organization_id, provider_order_id, provider_session_id, reference_id, customer_email) VALUES ('532893f6-73df-404a-b4f2-7b3b9dd98e9d', 2403.9, NULL, 'active', NULL, NULL, 'Seed data for payments', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payments (user_id, amount, currency, status, payment_method, stripe_payment_intent_id, description, metadata, organization_id, provider_order_id, provider_session_id, reference_id, customer_email) VALUES ('e61f2d6f-0f09-487f-93bb-80609e017e68', 2879.0, NULL, 'active', NULL, NULL, 'Seed data for payments', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payments (user_id, amount, currency, status, payment_method, stripe_payment_intent_id, description, metadata, organization_id, provider_order_id, provider_session_id, reference_id, customer_email) VALUES ('8d819558-7e71-463a-bb6e-64c025c1f01b', 4652.18, NULL, 'active', NULL, NULL, 'Seed data for payments', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- payout_rate_configs
INSERT INTO payout_rate_configs (role, rate_type, rate_amount, effective_date) VALUES ('user', NULL, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO payout_rate_configs (role, rate_type, rate_amount, effective_date) VALUES ('user', NULL, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO payout_rate_configs (role, rate_type, rate_amount, effective_date) VALUES ('user', NULL, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- payroll_profiles
INSERT INTO payroll_profiles (user_id, bank_name, account_type, routing_number, account_number_encrypted, tax_withholding, direct_deposit_enabled) VALUES (NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, false) ON CONFLICT DO NOTHING;
INSERT INTO payroll_profiles (user_id, bank_name, account_type, routing_number, account_number_encrypted, tax_withholding, direct_deposit_enabled) VALUES (NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, false) ON CONFLICT DO NOTHING;
INSERT INTO payroll_profiles (user_id, bank_name, account_type, routing_number, account_number_encrypted, tax_withholding, direct_deposit_enabled) VALUES (NULL, NULL, NULL, NULL, NULL, '{}'::jsonb, false) ON CONFLICT DO NOTHING;

-- payroll_runs
INSERT INTO payroll_runs (tenant_id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, processed_by, processed_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active', 0, 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payroll_runs (tenant_id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, processed_by, processed_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active', 0, 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO payroll_runs (tenant_id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, processed_by, processed_at) VALUES (NULL, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'active', 0, 0, 0, NULL, NULL) ON CONFLICT DO NOTHING;

-- peer_reviews
INSERT INTO peer_reviews (assignment_id, reviewer_id, reviewee_id, rating, feedback, status, submitted_at) VALUES (NULL, 'b83dc860-c918-4a0e-98cd-16965e3b306a', 'f03baf09-de0d-4a58-b25e-5b853865a0c1', 81, NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO peer_reviews (assignment_id, reviewer_id, reviewee_id, rating, feedback, status, submitted_at) VALUES (NULL, 'e0fab0fe-17b7-444c-af73-f19cfe844dd3', 'a8ebed5e-07bb-42c3-b10f-d385b02d74d5', 69, NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO peer_reviews (assignment_id, reviewer_id, reviewee_id, rating, feedback, status, submitted_at) VALUES (NULL, 'cd122ed0-3a04-46a1-bbc6-74727ff5dd23', '4eef86e1-a1d3-44dd-9a5d-5e9bc4e7067b', 73, NULL, 'active', NULL) ON CONFLICT DO NOTHING;

-- performance_metrics
INSERT INTO performance_metrics (metric_name, value, date, category, metadata) VALUES ('', 0, CURRENT_DATE, 'general', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO performance_metrics (metric_name, value, date, category, metadata) VALUES ('', 0, CURRENT_DATE, 'general', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO performance_metrics (metric_name, value, date, category, metadata) VALUES ('', 0, CURRENT_DATE, 'general', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- performance_reviews
INSERT INTO performance_reviews (employee_id, reviewer_id, review_period_start, review_period_end, overall_rating, strengths, areas_for_improvement, goals, status, completed_at) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO performance_reviews (employee_id, reviewer_id, review_period_start, review_period_end, overall_rating, strengths, areas_for_improvement, goals, status, completed_at) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO performance_reviews (employee_id, reviewer_id, review_period_start, review_period_end, overall_rating, strengths, areas_for_improvement, goals, status, completed_at) VALUES (NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, NULL, 'active', NULL) ON CONFLICT DO NOTHING;

-- phone_logs
INSERT INTO phone_logs (user_id, phone_number, call_type, direction, duration_seconds, status, recording_url, notes, created_by) VALUES (NULL, '', '', '', 0, 'active', NULL, 'Seed note for phone_logs', NULL) ON CONFLICT DO NOTHING;
INSERT INTO phone_logs (user_id, phone_number, call_type, direction, duration_seconds, status, recording_url, notes, created_by) VALUES (NULL, '', '', '', 0, 'active', NULL, 'Seed note for phone_logs', NULL) ON CONFLICT DO NOTHING;
INSERT INTO phone_logs (user_id, phone_number, call_type, direction, duration_seconds, status, recording_url, notes, created_by) VALUES (NULL, '', '', '', 0, 'active', NULL, 'Seed note for phone_logs', NULL) ON CONFLICT DO NOTHING;

-- platform_stats
INSERT INTO platform_stats (stat_date, key, value, metadata) VALUES (CURRENT_DATE, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO platform_stats (stat_date, key, value, metadata) VALUES (CURRENT_DATE, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO platform_stats (stat_date, key, value, metadata) VALUES (CURRENT_DATE, '', 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
