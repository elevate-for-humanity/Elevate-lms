-- point_transactions
INSERT INTO point_transactions (user_id, points, action_type, description, reference_id, reference_type) VALUES ('b151e37a-932e-4b68-a9ef-b31eac8c6814', 61, '', 'Seed data for point transactions', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO point_transactions (user_id, points, action_type, description, reference_id, reference_type) VALUES ('f9818f92-ac90-41be-b653-1f6f46c912ea', 37, '', 'Seed data for point transactions', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO point_transactions (user_id, points, action_type, description, reference_id, reference_type) VALUES ('64e92c7b-4c59-4a31-8c80-0ac04ca17357', 99, '', 'Seed data for point transactions', NULL, NULL) ON CONFLICT DO NOTHING;

-- portal_messages
INSERT INTO portal_messages (sender_id, recipient_id, conversation_id, subject, body, read_at, attachments) VALUES ('339fa871-6f86-4965-b6aa-0e83289886b8', '25d6c8a7-9535-4353-8229-0c4396cf164f', NULL, NULL, 'Seed data for portal messages', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO portal_messages (sender_id, recipient_id, conversation_id, subject, body, read_at, attachments) VALUES ('30623f6e-1eea-4ad0-84cb-9fe2f5ec121d', 'e9f99eb8-18da-424d-9bd1-a2f090bf790d', NULL, NULL, 'Seed data for portal messages', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO portal_messages (sender_id, recipient_id, conversation_id, subject, body, read_at, attachments) VALUES ('efcf5afb-9853-4fbb-b7ce-5a0a71cf1ed0', 'ba477a1f-bbdf-4f38-b704-43f56efac086', NULL, NULL, 'Seed data for portal messages', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- positions
INSERT INTO positions (tenant_id, title, description, department_id, min_salary, max_salary, is_active) VALUES (NULL, 'Sample Positions 1', 'Seed data for positions', NULL, 0, 0, true) ON CONFLICT DO NOTHING;
INSERT INTO positions (tenant_id, title, description, department_id, min_salary, max_salary, is_active) VALUES (NULL, 'Sample Positions 2', 'Seed data for positions', NULL, 0, 0, true) ON CONFLICT DO NOTHING;
INSERT INTO positions (tenant_id, title, description, department_id, min_salary, max_salary, is_active) VALUES (NULL, 'Sample Positions 3', 'Seed data for positions', NULL, 0, 0, true) ON CONFLICT DO NOTHING;

-- practice_test_attempts
INSERT INTO practice_test_attempts (test_id, user_id, score, passed, answers, completed_at, time_spent_seconds) VALUES ('cbeb48bc-45dd-4311-80a9-9d8ea4112e5d', 'e8b8cf3f-c716-4a98-aecf-5e71b5a7209e', 99, false, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO practice_test_attempts (test_id, user_id, score, passed, answers, completed_at, time_spent_seconds) VALUES ('01a79bf8-b563-4af7-9eb2-7a5611a3c9f8', '60b3cd6c-188e-4bf5-bd2c-00cf0426ba6e', 24, false, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO practice_test_attempts (test_id, user_id, score, passed, answers, completed_at, time_spent_seconds) VALUES ('7f3b68ad-de77-4c8b-8563-d988b913d4ca', '01907b88-3e1c-4bbd-8c29-bbc222c30623', 7, false, '{}'::jsonb, NULL, 0) ON CONFLICT DO NOTHING;

-- practice_tests
INSERT INTO practice_tests (program_id, title, description, passing_score, time_limit_minutes, question_count, is_published) VALUES (NULL, 'Sample Practice Tests 1', 'Seed data for practice tests', 0, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO practice_tests (program_id, title, description, passing_score, time_limit_minutes, question_count, is_published) VALUES (NULL, 'Sample Practice Tests 2', 'Seed data for practice tests', 0, 0, 0, false) ON CONFLICT DO NOTHING;
INSERT INTO practice_tests (program_id, title, description, passing_score, time_limit_minutes, question_count, is_published) VALUES (NULL, 'Sample Practice Tests 3', 'Seed data for practice tests', 0, 0, 0, false) ON CONFLICT DO NOTHING;

-- processed_stripe_events
INSERT INTO processed_stripe_events (stripe_event_id, payment_intent_id, event_type, metadata) VALUES ('', NULL, '', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO processed_stripe_events (stripe_event_id, payment_intent_id, event_type, metadata) VALUES ('', NULL, '', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO processed_stripe_events (stripe_event_id, payment_intent_id, event_type, metadata) VALUES ('', NULL, '', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- processes
INSERT INTO processes (name, description, documents_required, average_time, completion_rate, category, created_by) VALUES ('Sample Processes 1', 'Seed data for processes', NULL, 0, 0, 'general', NULL) ON CONFLICT DO NOTHING;
INSERT INTO processes (name, description, documents_required, average_time, completion_rate, category, created_by) VALUES ('Sample Processes 2', 'Seed data for processes', NULL, 0, 0, 'general', NULL) ON CONFLICT DO NOTHING;
INSERT INTO processes (name, description, documents_required, average_time, completion_rate, category, created_by) VALUES ('Sample Processes 3', 'Seed data for processes', NULL, 0, 0, 'general', NULL) ON CONFLICT DO NOTHING;

-- product_reports
INSERT INTO product_reports (product_id, reporter_email, reason, details, status, reviewed_by, reviewed_at) VALUES ('0d01b8f1-3673-48b6-b610-3835bba4ca4f', NULL, '', NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_reports (product_id, reporter_email, reason, details, status, reviewed_by, reviewed_at) VALUES ('e1751cdf-f9bd-482b-accb-c4a39754d279', NULL, '', NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_reports (product_id, reporter_email, reason, details, status, reviewed_by, reviewed_at) VALUES ('89c70c82-92b3-4229-bdbd-e8e225e8f6e5', NULL, '', NULL, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- product_reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, content, is_verified_purchase, is_approved, helpful_count) VALUES ('2a9c0e02-eff7-437b-975d-8099ef821e0c', NULL, 17, 'Sample Product Reviews 1', 'Seed data for product reviews', false, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO product_reviews (product_id, user_id, rating, title, content, is_verified_purchase, is_approved, helpful_count) VALUES ('6dd2fc8d-3d80-4f9f-86fd-7bc26897dcb6', NULL, 18, 'Sample Product Reviews 2', 'Seed data for product reviews', false, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO product_reviews (product_id, user_id, rating, title, content, is_verified_purchase, is_approved, helpful_count) VALUES ('fee28a3f-96b3-4a82-bcac-92c71f9e3734', NULL, 7, 'Sample Product Reviews 3', 'Seed data for product reviews', false, false, 0) ON CONFLICT DO NOTHING;

-- program_courses
INSERT INTO program_courses (program_id, course_id, is_required, order_index) VALUES ('911f3fac-bd1f-4dc4-beb1-5f5dc8502abd', 'ed6beb88-d30b-4d90-a42d-f45a2803c42f', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO program_courses (program_id, course_id, is_required, order_index) VALUES ('32fbb73c-2af4-4b9f-b8d3-22f34a1ae23a', '58c9f60c-7bc9-4fd9-a3f3-90cd7f25f61e', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO program_courses (program_id, course_id, is_required, order_index) VALUES ('b503ac0b-3a05-456a-8d0c-d484ac671555', '79a63d97-8190-4a3d-b5ae-8fcea39ccbc3', false, 0) ON CONFLICT DO NOTHING;

-- program_holder_documents
INSERT INTO program_holder_documents (user_id, organization_id, document_type, file_name, file_url, file_size, mime_type, description, uploaded_by, approved, approved_by, approved_at, approval_notes, status, reviewed_by, reviewed_at, rejection_reason) VALUES ('8f506d6d-24a6-4a89-b701-655d5195ed75', NULL, '', '', '', 0, NULL, 'Seed data for program holder documents', 'df850647-12c5-4214-8011-fc95917f442f', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_documents (user_id, organization_id, document_type, file_name, file_url, file_size, mime_type, description, uploaded_by, approved, approved_by, approved_at, approval_notes, status, reviewed_by, reviewed_at, rejection_reason) VALUES ('e2005a71-9f80-47e1-8a78-a4e61277ab0c', NULL, '', '', '', 0, NULL, 'Seed data for program holder documents', 'b35372e1-b504-45a4-a076-0222e0de90ba', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_documents (user_id, organization_id, document_type, file_name, file_url, file_size, mime_type, description, uploaded_by, approved, approved_by, approved_at, approval_notes, status, reviewed_by, reviewed_at, rejection_reason) VALUES ('ed34f59c-3b4b-4406-99f6-330a3c583d57', NULL, '', '', '', 0, NULL, 'Seed data for program holder documents', 'b73f8e67-ae96-4c3c-8989-cd39b623e3e7', false, NULL, NULL, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- program_holder_notes
INSERT INTO program_holder_notes (user_id, course_id, program_holder_id, status, note) VALUES ('068afc7d-3c96-4fe8-ad17-4460bb3b7c5c', 'f85bc62b-f9bb-408d-bd63-4c05c6c524a9', 'e314208b-347c-4ba8-9dca-34b87fd73ce0', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_notes (user_id, course_id, program_holder_id, status, note) VALUES ('1b70dd2c-3387-4957-8cd5-b31e2c4e89cb', 'e6931f08-d831-4c0f-b97f-ce65979405f0', '27b47a2b-5ff2-4b67-9b17-cff339f8e853', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_notes (user_id, course_id, program_holder_id, status, note) VALUES ('6c077afc-70bb-46bb-ad09-cf5aceef6468', 'ee23d5b7-d6a2-4543-be4a-95a16733f56f', '0886041c-9880-4e49-a9b9-c54bda6e3eb6', 'active', NULL) ON CONFLICT DO NOTHING;

-- program_holder_students
INSERT INTO program_holder_students (program_holder_id, student_id, program_id, status, notes) VALUES ('ea7e96c7-6bd3-4b0e-b59c-0db18f225e47', '89885e78-0b3f-4a08-b6d5-388c71e3fe69', NULL, 'active', 'Seed note for program_holder_students') ON CONFLICT DO NOTHING;
INSERT INTO program_holder_students (program_holder_id, student_id, program_id, status, notes) VALUES ('1f49fe5c-abe9-48a7-81a9-9940874b2def', 'e5c10caa-cb57-4a49-8d3f-3dc24f3f86cb', NULL, 'active', 'Seed note for program_holder_students') ON CONFLICT DO NOTHING;
INSERT INTO program_holder_students (program_holder_id, student_id, program_id, status, notes) VALUES ('49917b72-d727-41f3-bb19-0126d229d40c', '22723433-51d9-498d-91c4-b382e9c7a40e', NULL, 'active', 'Seed note for program_holder_students') ON CONFLICT DO NOTHING;

-- program_holder_verification
INSERT INTO program_holder_verification (user_id, verification_type, status, stripe_verification_session_id, verified_at, verified_by, notes, decision, reviewed_at, reviewed_by) VALUES ('12ee2953-07d1-4bb6-9a4a-8332c631f153', '', 'active', NULL, NULL, NULL, 'Seed note for program_holder_verification', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_verification (user_id, verification_type, status, stripe_verification_session_id, verified_at, verified_by, notes, decision, reviewed_at, reviewed_by) VALUES ('24bac2c1-2d65-4e78-ba63-8e88dc8714f5', '', 'active', NULL, NULL, NULL, 'Seed note for program_holder_verification', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO program_holder_verification (user_id, verification_type, status, stripe_verification_session_id, verified_at, verified_by, notes, decision, reviewed_at, reviewed_by) VALUES ('4bb68d86-78fa-49fc-8e40-84fa449a9876', '', 'active', NULL, NULL, NULL, 'Seed note for program_holder_verification', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- program_licenses
INSERT INTO program_licenses (program_id, license_holder_id, license_key, license_type, max_enrollments, current_enrollments, lms_model, external_lms_url, can_create_courses, can_upload_scorm, status, is_store_license, store_id, expires_at, metadata) VALUES ('9d553b13-b54a-47a2-8840-5e80b7f550f5', '6d133dc8-70f1-4299-9364-9a0e310879d8', '', '', 0, 0, '', NULL, false, false, 'active', false, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO program_licenses (program_id, license_holder_id, license_key, license_type, max_enrollments, current_enrollments, lms_model, external_lms_url, can_create_courses, can_upload_scorm, status, is_store_license, store_id, expires_at, metadata) VALUES ('abb32074-0fab-470d-a219-124512c96880', '022332b8-3bf3-4697-bdf7-fbcdd6604093', '', '', 0, 0, '', NULL, false, false, 'active', false, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO program_licenses (program_id, license_holder_id, license_key, license_type, max_enrollments, current_enrollments, lms_model, external_lms_url, can_create_courses, can_upload_scorm, status, is_store_license, store_id, expires_at, metadata) VALUES ('095f329b-ecb3-4754-a9c9-0a72b22c7107', '2748c539-9d08-45b6-87a5-89d5b5203e7c', '', '', 0, 0, '', NULL, false, false, 'active', false, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- program_modules
INSERT INTO program_modules (data, title, description, order_index, duration_hours, is_published, content) VALUES ('{}'::jsonb, 'Sample Program Modules 1', 'Seed data for program modules', 0, 0, false, 'Seed data for program modules') ON CONFLICT DO NOTHING;
INSERT INTO program_modules (data, title, description, order_index, duration_hours, is_published, content) VALUES ('{}'::jsonb, 'Sample Program Modules 2', 'Seed data for program modules', 0, 0, false, 'Seed data for program modules') ON CONFLICT DO NOTHING;
INSERT INTO program_modules (data, title, description, order_index, duration_hours, is_published, content) VALUES ('{}'::jsonb, 'Sample Program Modules 3', 'Seed data for program modules', 0, 0, false, 'Seed data for program modules') ON CONFLICT DO NOTHING;

-- program_outcomes
INSERT INTO program_outcomes (program_id, outcome, outcome_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO program_outcomes (program_id, outcome, outcome_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO program_outcomes (program_id, outcome, outcome_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;

-- program_requirements
INSERT INTO program_requirements (program_id, requirement, requirement_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO program_requirements (program_id, requirement, requirement_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO program_requirements (program_id, requirement, requirement_order) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;

-- progress_entries
INSERT INTO progress_entries (apprentice_id, partner_id, program_id, week_ending, hours_worked, notes, submitted_by, status, tasks_completed, submitted_at, verified_by, verified_at, updated_at, max_hours_per_week, work_date, site_id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, break_minutes, clock_in_lat, clock_in_lng, clock_in_accuracy_m, clock_out_lat, clock_out_lng, clock_out_accuracy_m, last_seen_at, last_seen_lat, last_seen_lng, last_seen_accuracy_m, last_seen_within_geofence, auto_clocked_out, auto_clock_out_reason, outside_geofence_since, last_geofence_check_at, last_known_lat, last_known_lng, last_location_at) VALUES ('f92d7b34-04dc-4c92-8e79-bdf226464cde', 'ef118e5f-d03d-412b-a9de-5f27da394bd5', '', CURRENT_DATE, 0, 'Seed note for progress_entries', 'ed98e289-3511-4331-8d20-df7fca6b6784', 'active', NULL, NULL, NULL, NULL, NULL, 0, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, false, false, NULL, NULL, NULL, 0, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO progress_entries (apprentice_id, partner_id, program_id, week_ending, hours_worked, notes, submitted_by, status, tasks_completed, submitted_at, verified_by, verified_at, updated_at, max_hours_per_week, work_date, site_id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, break_minutes, clock_in_lat, clock_in_lng, clock_in_accuracy_m, clock_out_lat, clock_out_lng, clock_out_accuracy_m, last_seen_at, last_seen_lat, last_seen_lng, last_seen_accuracy_m, last_seen_within_geofence, auto_clocked_out, auto_clock_out_reason, outside_geofence_since, last_geofence_check_at, last_known_lat, last_known_lng, last_location_at) VALUES ('40d58ffb-0d4d-4641-994e-9273eb35e057', '39234787-e160-4bf1-96f4-5405978f81c2', '', CURRENT_DATE, 0, 'Seed note for progress_entries', 'e182b316-7e93-4e67-a038-808a8fc73be0', 'active', NULL, NULL, NULL, NULL, NULL, 0, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, false, false, NULL, NULL, NULL, 0, 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO progress_entries (apprentice_id, partner_id, program_id, week_ending, hours_worked, notes, submitted_by, status, tasks_completed, submitted_at, verified_by, verified_at, updated_at, max_hours_per_week, work_date, site_id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, break_minutes, clock_in_lat, clock_in_lng, clock_in_accuracy_m, clock_out_lat, clock_out_lng, clock_out_accuracy_m, last_seen_at, last_seen_lat, last_seen_lng, last_seen_accuracy_m, last_seen_within_geofence, auto_clocked_out, auto_clock_out_reason, outside_geofence_since, last_geofence_check_at, last_known_lat, last_known_lng, last_location_at) VALUES ('d18d5e2b-63af-46a5-b893-4f3e637e1fe5', '7b64c51a-ac9f-4820-b549-6b58808fdc76', '', CURRENT_DATE, 0, 'Seed note for progress_entries', '0f1efcc5-0ca8-4a9d-9d66-f2b89d4141ee', 'active', NULL, NULL, NULL, NULL, NULL, 0, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, false, false, NULL, NULL, NULL, 0, 0, NULL) ON CONFLICT DO NOTHING;

-- promo_code_uses
INSERT INTO promo_code_uses (promo_code_id, user_id, email, order_id, discount_amount) VALUES (NULL, NULL, 'user1@example.com', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO promo_code_uses (promo_code_id, user_id, email, order_id, discount_amount) VALUES (NULL, NULL, 'user2@example.com', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO promo_code_uses (promo_code_id, user_id, email, order_id, discount_amount) VALUES (NULL, NULL, 'user3@example.com', NULL, 0) ON CONFLICT DO NOTHING;

-- provisioning_events
INSERT INTO provisioning_events (tenant_id, payment_intent_id, correlation_id, step, status, error, metadata) VALUES (NULL, NULL, NULL, '', 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO provisioning_events (tenant_id, payment_intent_id, correlation_id, step, status, error, metadata) VALUES (NULL, NULL, NULL, '', 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO provisioning_events (tenant_id, payment_intent_id, correlation_id, step, status, error, metadata) VALUES (NULL, NULL, NULL, '', 'active', NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- purchases
INSERT INTO purchases (email, product_id, repo) VALUES ('user1@example.com', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO purchases (email, product_id, repo) VALUES ('user2@example.com', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO purchases (email, product_id, repo) VALUES ('user3@example.com', NULL, NULL) ON CONFLICT DO NOTHING;

-- push_subscriptions
INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ('08d128d2-abfa-4199-9bab-8e54ba40c7ab', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ('5d51a3c4-67c1-4e7f-9487-b138d3d5ce4a', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ('16554de8-4f61-48d8-ad15-e5dd050bbebc', '', NULL, NULL) ON CONFLICT DO NOTHING;

-- qa_checklist_completions
INSERT INTO qa_checklist_completions (checklist_id, completed_by, entity_type, entity_id, items_completed, notes) VALUES (NULL, NULL, NULL, NULL, '{}'::jsonb, 'Seed note for qa_checklist_completions') ON CONFLICT DO NOTHING;
INSERT INTO qa_checklist_completions (checklist_id, completed_by, entity_type, entity_id, items_completed, notes) VALUES (NULL, NULL, NULL, NULL, '{}'::jsonb, 'Seed note for qa_checklist_completions') ON CONFLICT DO NOTHING;
INSERT INTO qa_checklist_completions (checklist_id, completed_by, entity_type, entity_id, items_completed, notes) VALUES (NULL, NULL, NULL, NULL, '{}'::jsonb, 'Seed note for qa_checklist_completions') ON CONFLICT DO NOTHING;

-- quarterly_performance
INSERT INTO quarterly_performance (id, quarter, year, program_id, total_enrolled, total_completed, total_dropped, completion_rate, total_employed, employed_in_field, median_wage, employment_rate, credentials_earned, credential_rate, retained_30_days, retained_90_days, retention_rate_90, participants_female, participants_male, participants_minority, participants_veteran, participants_disability, participants_low_income, generated_at, generated_by, report_file_url, created_at, updated_at) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO quarterly_performance (id, quarter, year, program_id, total_enrolled, total_completed, total_dropped, completion_rate, total_employed, employed_in_field, median_wage, employment_rate, credentials_earned, credential_rate, retained_30_days, retained_90_days, retention_rate_90, participants_female, participants_male, participants_minority, participants_veteran, participants_disability, participants_low_income, generated_at, generated_by, report_file_url, created_at, updated_at) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO quarterly_performance (id, quarter, year, program_id, total_enrolled, total_completed, total_dropped, completion_rate, total_employed, employed_in_field, median_wage, employment_rate, credentials_earned, credential_rate, retained_30_days, retained_90_days, retention_rate_90, participants_female, participants_male, participants_minority, participants_veteran, participants_disability, participants_low_income, generated_at, generated_by, report_file_url, created_at, updated_at) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- quiz_answers
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, order_index) VALUES (0, 0, '', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, order_index) VALUES (0, 0, '', false, 0) ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, order_index) VALUES (0, 0, '', false, 0) ON CONFLICT DO NOTHING;

-- quiz_attempt_answers
INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_answer_id, is_correct, points_earned) VALUES (0, 0, 0, 0, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_answer_id, is_correct, points_earned) VALUES (0, 0, 0, 0, false, 0) ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_answer_id, is_correct, points_earned) VALUES (0, 0, 0, 0, false, 0) ON CONFLICT DO NOTHING;

-- quiz_attempts
INSERT INTO quiz_attempts (id, quiz_id, user_id, attempt_number, started_at, submitted_at, time_spent_seconds, score, points_earned, points_possible, passed, status, ip_address, user_agent, created_at, updated_at, user_uuid) VALUES (0, 0, 0, 0, NULL, NULL, 0, 55, 0, 0, false, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (id, quiz_id, user_id, attempt_number, started_at, submitted_at, time_spent_seconds, score, points_earned, points_possible, passed, status, ip_address, user_agent, created_at, updated_at, user_uuid) VALUES (0, 0, 0, 0, NULL, NULL, 0, 5, 0, 0, false, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (id, quiz_id, user_id, attempt_number, started_at, submitted_at, time_spent_seconds, score, points_earned, points_possible, passed, status, ip_address, user_agent, created_at, updated_at, user_uuid) VALUES (0, 0, 0, 0, NULL, NULL, 0, 65, 0, 0, false, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- rapids_apprentices
INSERT INTO rapids_apprentices (user_id, enrollment_id, first_name, last_name, middle_name, suffix, ssn_encrypted, ssn_last_four, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, education_level, email, phone, address_line1, address_line2, city, state, zip_code, program_slug, occupation_code, occupation_title, rapids_registration_id, registration_date, registration_status, employer_name, employer_fein, employer_address, employer_city, employer_state, employer_zip, employer_contact_name, employer_contact_email, employer_contact_phone, mentor_name, mentor_license_number, mentor_years_experience, total_hours_required, related_instruction_hours_required, probationary_period_hours, ojt_hours_completed, rti_hours_completed, last_progress_update, wage_at_entry, current_wage, wage_schedule, status, completion_date, cancellation_date, cancellation_reason, credential_earned, credential_date, state_license_number, state_license_date, created_by, updated_by) VALUES (NULL, NULL, 'James', 'Johnson', NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, 'user1@example.com', '317-555-1000', NULL, NULL, 'Indianapolis', 'IN', '46204', '', '', '', NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, CURRENT_DATE, 0, 0, '{}'::jsonb, 'active', CURRENT_DATE, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO rapids_apprentices (user_id, enrollment_id, first_name, last_name, middle_name, suffix, ssn_encrypted, ssn_last_four, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, education_level, email, phone, address_line1, address_line2, city, state, zip_code, program_slug, occupation_code, occupation_title, rapids_registration_id, registration_date, registration_status, employer_name, employer_fein, employer_address, employer_city, employer_state, employer_zip, employer_contact_name, employer_contact_email, employer_contact_phone, mentor_name, mentor_license_number, mentor_years_experience, total_hours_required, related_instruction_hours_required, probationary_period_hours, ojt_hours_completed, rti_hours_completed, last_progress_update, wage_at_entry, current_wage, wage_schedule, status, completion_date, cancellation_date, cancellation_reason, credential_earned, credential_date, state_license_number, state_license_date, created_by, updated_by) VALUES (NULL, NULL, 'Maria', 'Garcia', NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, 'user2@example.com', '317-555-1001', NULL, NULL, 'Indianapolis', 'IN', '46204', '', '', '', NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, CURRENT_DATE, 0, 0, '{}'::jsonb, 'active', CURRENT_DATE, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO rapids_apprentices (user_id, enrollment_id, first_name, last_name, middle_name, suffix, ssn_encrypted, ssn_last_four, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, education_level, email, phone, address_line1, address_line2, city, state, zip_code, program_slug, occupation_code, occupation_title, rapids_registration_id, registration_date, registration_status, employer_name, employer_fein, employer_address, employer_city, employer_state, employer_zip, employer_contact_name, employer_contact_email, employer_contact_phone, mentor_name, mentor_license_number, mentor_years_experience, total_hours_required, related_instruction_hours_required, probationary_period_hours, ojt_hours_completed, rti_hours_completed, last_progress_update, wage_at_entry, current_wage, wage_schedule, status, completion_date, cancellation_date, cancellation_reason, credential_earned, credential_date, state_license_number, state_license_date, created_by, updated_by) VALUES (NULL, NULL, 'David', 'Williams', NULL, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, 'user3@example.com', '317-555-1002', NULL, NULL, 'Indianapolis', 'IN', '46204', '', '', '', NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, CURRENT_DATE, 0, 0, '{}'::jsonb, 'active', CURRENT_DATE, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL) ON CONFLICT DO NOTHING;

-- rapids_employers
INSERT INTO rapids_employers (business_name, dba_name, fein, address_line1, address_line2, city, state, zip_code, contact_name, contact_title, contact_email, contact_phone, industry_code, business_type, employee_count, max_apprentices, current_apprentice_count, is_active, verified, verified_date) VALUES ('', NULL, NULL, NULL, NULL, 'Indianapolis', 'IN', '46204', 'James', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, true, false, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO rapids_employers (business_name, dba_name, fein, address_line1, address_line2, city, state, zip_code, contact_name, contact_title, contact_email, contact_phone, industry_code, business_type, employee_count, max_apprentices, current_apprentice_count, is_active, verified, verified_date) VALUES ('', NULL, NULL, NULL, NULL, 'Indianapolis', 'IN', '46204', 'Maria', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, true, false, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO rapids_employers (business_name, dba_name, fein, address_line1, address_line2, city, state, zip_code, contact_name, contact_title, contact_email, contact_phone, industry_code, business_type, employee_count, max_apprentices, current_apprentice_count, is_active, verified, verified_date) VALUES ('', NULL, NULL, NULL, NULL, 'Indianapolis', 'IN', '46204', 'David', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, true, false, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- rapids_registrations
INSERT INTO rapids_registrations (student_id, enrollment_id, rapids_id, occupation_code, sponsor_id, registration_date, expected_completion_date, status, submitted_at, confirmed_at) VALUES ('b0ec3e22-0690-4d1e-80b2-d80573618cf5', NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO rapids_registrations (student_id, enrollment_id, rapids_id, occupation_code, sponsor_id, registration_date, expected_completion_date, status, submitted_at, confirmed_at) VALUES ('86715e77-46e4-4e2a-ab24-4e161f9e12f1', NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO rapids_registrations (student_id, enrollment_id, rapids_id, occupation_code, sponsor_id, registration_date, expected_completion_date, status, submitted_at, confirmed_at) VALUES ('17510c86-10c5-4fad-9783-1811fb57b835', NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- rapids_tracking
INSERT INTO rapids_tracking (apprentice_id, rapids_id, status, registration_date, completion_date) VALUES (NULL, NULL, 'active', CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO rapids_tracking (apprentice_id, rapids_id, status, registration_date, completion_date) VALUES (NULL, NULL, 'active', CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO rapids_tracking (apprentice_id, rapids_id, status, registration_date, completion_date) VALUES (NULL, NULL, 'active', CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- referral_codes
INSERT INTO referral_codes (user_id, code, discount_type, discount_value, max_uses, current_uses, expires_at, is_active) VALUES ('23ee60eb-a6d8-4f89-b0a0-babf8c998c3b', '', NULL, 0, 0, 0, NULL, true) ON CONFLICT DO NOTHING;
INSERT INTO referral_codes (user_id, code, discount_type, discount_value, max_uses, current_uses, expires_at, is_active) VALUES ('118aa0ea-7156-4b01-b273-7694fff0daef', '', NULL, 0, 0, 0, NULL, true) ON CONFLICT DO NOTHING;
INSERT INTO referral_codes (user_id, code, discount_type, discount_value, max_uses, current_uses, expires_at, is_active) VALUES ('7b4267f3-442c-4667-bde2-9725975aee25', '', NULL, 0, 0, 0, NULL, true) ON CONFLICT DO NOTHING;

-- referrals
INSERT INTO referrals (referred_user_id, referral_code, status, reward_amount, rewarded_at, source, program) VALUES (NULL, NULL, 'active', 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO referrals (referred_user_id, referral_code, status, reward_amount, rewarded_at, source, program) VALUES (NULL, NULL, 'active', 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO referrals (referred_user_id, referral_code, status, reward_amount, rewarded_at, source, program) VALUES (NULL, NULL, 'active', 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- review_queue
INSERT INTO review_queue (queue_type, subject_type, subject_id, priority, reasons, status, assigned_to, resolved_by, resolved_at, resolution, metadata, entity_type, entity_id, review_type, ai_recommendation, ai_confidence, human_decision, human_notes, decided_by, decided_at) VALUES ('', '', '9e067e30-5727-4ab4-9bd4-394b747b6f33', 0, '', 'active', NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, '{}'::jsonb, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO review_queue (queue_type, subject_type, subject_id, priority, reasons, status, assigned_to, resolved_by, resolved_at, resolution, metadata, entity_type, entity_id, review_type, ai_recommendation, ai_confidence, human_decision, human_notes, decided_by, decided_at) VALUES ('', '', 'f7287c74-2062-4c69-a445-7b2a36117fff', 0, '', 'active', NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, '{}'::jsonb, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO review_queue (queue_type, subject_type, subject_id, priority, reasons, status, assigned_to, resolved_by, resolved_at, resolution, metadata, entity_type, entity_id, review_type, ai_recommendation, ai_confidence, human_decision, human_notes, decided_by, decided_at) VALUES ('', '', 'c87d4629-8a4f-43a3-8816-63433505b85a', 0, '', 'active', NULL, NULL, NULL, NULL, '{}'::jsonb, NULL, NULL, NULL, '{}'::jsonb, 0, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- reviews
INSERT INTO reviews (user_id, reviewer_name, reviewer_email, rating, content, response, responded_by, responded_at, platform_synced, synced_platforms, moderation_status, moderated_by, moderated_at, is_featured) VALUES (NULL, '', NULL, 60, 'Seed data for reviews', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO reviews (user_id, reviewer_name, reviewer_email, rating, content, response, responded_by, responded_at, platform_synced, synced_platforms, moderation_status, moderated_by, moderated_at, is_featured) VALUES (NULL, '', NULL, 92, 'Seed data for reviews', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO reviews (user_id, reviewer_name, reviewer_email, rating, content, response, responded_by, responded_at, platform_synced, synced_platforms, moderation_status, moderated_by, moderated_at, is_featured) VALUES (NULL, '', NULL, 87, 'Seed data for reviews', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, false) ON CONFLICT DO NOTHING;

-- scorm_enrollments
INSERT INTO scorm_enrollments (scorm_package_id, user_id, enrollment_id, status, progress_percentage, score, attempts, time_spent_seconds, started_at, completed_at, last_accessed_at, suspend_data, cmi_data) VALUES ('2f3175ab-43d9-48da-bbc6-c48b4f36c580', '2b99f6bb-e377-4513-853b-475e36b270e2', NULL, 'active', 0, 37, 0, 0, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO scorm_enrollments (scorm_package_id, user_id, enrollment_id, status, progress_percentage, score, attempts, time_spent_seconds, started_at, completed_at, last_accessed_at, suspend_data, cmi_data) VALUES ('68eeb625-04e2-4b02-aec3-78a017e9c2b0', '3076dc00-c99a-498a-953d-20059a7f16fc', NULL, 'active', 0, 5, 0, 0, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO scorm_enrollments (scorm_package_id, user_id, enrollment_id, status, progress_percentage, score, attempts, time_spent_seconds, started_at, completed_at, last_accessed_at, suspend_data, cmi_data) VALUES ('6be0d4ba-8b96-400c-b2a3-6042ac900035', 'c126bd06-4e10-42bc-9516-34708f4792aa', NULL, 'active', 0, 90, 0, 0, NULL, NULL, NULL, '{}'::jsonb, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- scorm_packages
INSERT INTO scorm_packages (title, description, version, package_url, manifest_url, launch_url, duration_minutes, passing_score, max_attempts, active, metadata) VALUES ('Sample Scorm Packages 1', 'Seed data for scorm packages', NULL, '', NULL, '', 0, 0, 0, true, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO scorm_packages (title, description, version, package_url, manifest_url, launch_url, duration_minutes, passing_score, max_attempts, active, metadata) VALUES ('Sample Scorm Packages 2', 'Seed data for scorm packages', NULL, '', NULL, '', 0, 0, 0, true, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO scorm_packages (title, description, version, package_url, manifest_url, launch_url, duration_minutes, passing_score, max_attempts, active, metadata) VALUES ('Sample Scorm Packages 3', 'Seed data for scorm packages', NULL, '', NULL, '', 0, 0, 0, true, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- scorm_tracking
INSERT INTO scorm_tracking (scorm_enrollment_id, element, value) VALUES ('3f3f177e-b795-4d87-b464-50cf6e335158', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO scorm_tracking (scorm_enrollment_id, element, value) VALUES ('e6a2ca33-bdf4-4299-82e2-e00e2ae9211a', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO scorm_tracking (scorm_enrollment_id, element, value) VALUES ('5aab367b-3899-49b0-868e-7d6d27942285', '', NULL) ON CONFLICT DO NOTHING;

-- search_history
INSERT INTO search_history (user_id, query, results_count) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO search_history (user_id, query, results_count) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;
INSERT INTO search_history (user_id, query, results_count) VALUES (NULL, '', 0) ON CONFLICT DO NOTHING;

-- search_suggestions
INSERT INTO search_suggestions (term, weight, category) VALUES ('', 0, 'general') ON CONFLICT DO NOTHING;
INSERT INTO search_suggestions (term, weight, category) VALUES ('', 0, 'general') ON CONFLICT DO NOTHING;
INSERT INTO search_suggestions (term, weight, category) VALUES ('', 0, 'general') ON CONFLICT DO NOTHING;

-- service_tickets
INSERT INTO service_tickets (student_id, issue, priority, status, assigned_to, resolution, created_by, resolved_at) VALUES (NULL, '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO service_tickets (student_id, issue, priority, status, assigned_to, resolution, created_by, resolved_at) VALUES (NULL, '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO service_tickets (student_id, issue, priority, status, assigned_to, resolution, created_by, resolved_at) VALUES (NULL, '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- sezzle_card_events
INSERT INTO sezzle_card_events (session_id, order_uuid, event_type, card_token, amount_cents, customer_email, metadata) VALUES (NULL, NULL, '', NULL, 0, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO sezzle_card_events (session_id, order_uuid, event_type, card_token, amount_cents, customer_email, metadata) VALUES (NULL, NULL, '', NULL, 0, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO sezzle_card_events (session_id, order_uuid, event_type, card_token, amount_cents, customer_email, metadata) VALUES (NULL, NULL, '', NULL, 0, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- sfc_tax_documents
INSERT INTO sfc_tax_documents (tax_return_id, document_tracking_id, storage_bucket, storage_path, original_filename, content_type, file_size_bytes, document_type, status, ocr_payload, ocr_error) VALUES ('49c3c521-9699-4257-acd3-e45df9c270b7', '', '', '', NULL, NULL, 0, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_documents (tax_return_id, document_tracking_id, storage_bucket, storage_path, original_filename, content_type, file_size_bytes, document_type, status, ocr_payload, ocr_error) VALUES ('fe2e5e97-fd45-4265-a094-6b02d6841b64', '', '', '', NULL, NULL, 0, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_documents (tax_return_id, document_tracking_id, storage_bucket, storage_path, original_filename, content_type, file_size_bytes, document_type, status, ocr_payload, ocr_error) VALUES ('81dcbcd3-6e13-4b8a-b5de-3d40e586fcb1', '', '', '', NULL, NULL, 0, NULL, 'active', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- sfc_tax_return_public_status
INSERT INTO sfc_tax_return_public_status (tracking_id, status, rejection_reason, created_at, updated_at, client_first_name, client_last_initial) VALUES (NULL, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_return_public_status (tracking_id, status, rejection_reason, created_at, updated_at, client_first_name, client_last_initial) VALUES (NULL, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_return_public_status (tracking_id, status, rejection_reason, created_at, updated_at, client_first_name, client_last_initial) VALUES (NULL, 'active', NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- sfc_tax_returns
INSERT INTO sfc_tax_returns (tracking_id, source_system, source_submission_id, client_first_name, client_last_name, client_email, client_phone, status, efile_submission_id, intake_payload, calculation_payload, tax_return_payload, provider_metadata, last_error, last_error_at, is_deleted, deleted_at, submission_environment) VALUES ('', '', NULL, NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_returns (tracking_id, source_system, source_submission_id, client_first_name, client_last_name, client_email, client_phone, status, efile_submission_id, intake_payload, calculation_payload, tax_return_payload, provider_metadata, last_error, last_error_at, is_deleted, deleted_at, submission_environment) VALUES ('', '', NULL, NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sfc_tax_returns (tracking_id, source_system, source_submission_id, client_first_name, client_last_name, client_email, client_phone, status, efile_submission_id, intake_payload, calculation_payload, tax_return_payload, provider_metadata, last_error, last_error_at, is_deleted, deleted_at, submission_environment) VALUES ('', '', NULL, NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;

-- shop_applications
INSERT INTO shop_applications (shop_name, owner_name, email, phone, address, city, state, zip, ein, years_in_business, licensed_barbers, agree_supervision, agree_reporting, agree_wages, status, reviewed_by, reviewed_at, review_notes) VALUES ('', '', 'user1@example.com', '317-555-1000', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, 0, 0, false, false, false, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_applications (shop_name, owner_name, email, phone, address, city, state, zip, ein, years_in_business, licensed_barbers, agree_supervision, agree_reporting, agree_wages, status, reviewed_by, reviewed_at, review_notes) VALUES ('', '', 'user2@example.com', '317-555-1001', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, 0, 0, false, false, false, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_applications (shop_name, owner_name, email, phone, address, city, state, zip, ein, years_in_business, licensed_barbers, agree_supervision, agree_reporting, agree_wages, status, reviewed_by, reviewed_at, review_notes) VALUES ('', '', 'user3@example.com', '317-555-1002', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, 0, 0, false, false, false, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- shop_documents
INSERT INTO shop_documents (shop_id, document_type, file_url, uploaded_by, approved, approved_by, approved_at) VALUES ('0533cf68-040c-491f-acd2-3b46a0f4aa06', '', '', 'c25952fc-292a-492c-862d-7d084e7b6219', false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_documents (shop_id, document_type, file_url, uploaded_by, approved, approved_by, approved_at) VALUES ('b55e10b1-6de2-461a-a629-d21c1a4acf7d', '', '', '0188d35f-0440-499d-a322-37ad626ee866', false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_documents (shop_id, document_type, file_url, uploaded_by, approved, approved_by, approved_at) VALUES ('c8fe6a54-6d39-4e13-8270-0fcef646d7be', '', '', 'f5737e22-1e35-49f5-8755-8f3a8fe51c03', false, NULL, NULL) ON CONFLICT DO NOTHING;

-- shop_onboarding
INSERT INTO shop_onboarding (shop_id, handbook_ack, reporting_trained, apprentice_supervisor_assigned, rapids_reporting_ready, completed_at) VALUES ('f9567499-ca07-4970-907f-115802c4672b', false, false, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_onboarding (shop_id, handbook_ack, reporting_trained, apprentice_supervisor_assigned, rapids_reporting_ready, completed_at) VALUES ('cbfce698-e556-434b-a828-a32a63136ea0', false, false, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_onboarding (shop_id, handbook_ack, reporting_trained, apprentice_supervisor_assigned, rapids_reporting_ready, completed_at) VALUES ('09b8ba28-c756-4604-b6cd-f7e11c7fee96', false, false, false, false, NULL) ON CONFLICT DO NOTHING;

-- shop_orders
INSERT INTO shop_orders (shop_id, customer_id, order_number, total_amount, status, fulfilled_at) VALUES (NULL, NULL, NULL, 0, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_orders (shop_id, customer_id, order_number, total_amount, status, fulfilled_at) VALUES (NULL, NULL, NULL, 0, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_orders (shop_id, customer_id, order_number, total_amount, status, fulfilled_at) VALUES (NULL, NULL, NULL, 0, 'active', NULL) ON CONFLICT DO NOTHING;

-- shop_placements
INSERT INTO shop_placements (student_id, shop_name, shop_address, supervisor_name, supervisor_email, supervisor_phone, status, completed_at, notes) VALUES ('d732a261-c242-4f3c-8b5b-525604fdcd99', '', NULL, NULL, NULL, NULL, 'active', NULL, 'Seed note for shop_placements') ON CONFLICT DO NOTHING;
INSERT INTO shop_placements (student_id, shop_name, shop_address, supervisor_name, supervisor_email, supervisor_phone, status, completed_at, notes) VALUES ('3445a207-6b80-48df-9c34-1672602301f8', '', NULL, NULL, NULL, NULL, 'active', NULL, 'Seed note for shop_placements') ON CONFLICT DO NOTHING;
INSERT INTO shop_placements (student_id, shop_name, shop_address, supervisor_name, supervisor_email, supervisor_phone, status, completed_at, notes) VALUES ('9e2d1d59-fbac-4066-9d95-0769c1f2f55b', '', NULL, NULL, NULL, NULL, 'active', NULL, 'Seed note for shop_placements') ON CONFLICT DO NOTHING;

-- shop_recommendations
INSERT INTO shop_recommendations (application_id, shop_id, score, ranking, match_factors, distance_miles, factors) VALUES ('ae8d3858-3c10-47f4-810c-aaf8b4107a36', 'a1703605-1a10-429c-9e84-d9d4bd05870c', 59, 0, '{}'::jsonb, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO shop_recommendations (application_id, shop_id, score, ranking, match_factors, distance_miles, factors) VALUES ('9f87c208-0e90-4de7-8eaa-a1b10c029719', '11f0a643-5866-4a2f-8a78-09b5c1d4e8c9', 82, 0, '{}'::jsonb, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO shop_recommendations (application_id, shop_id, score, ranking, match_factors, distance_miles, factors) VALUES ('47d48014-7ae5-4f0f-8189-0b6db9e97ee1', 'b695df74-5002-4253-90e5-c2b5893be679', 54, 0, '{}'::jsonb, 0, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- shop_routing_scores
INSERT INTO shop_routing_scores (application_id, shop_id, total_score, distance_score, capacity_score, specialty_score, preference_score, score_breakdown, rank, status, assigned_at) VALUES ('f942b599-2f6f-45e2-a59e-8deb92300b29', '5a0b949a-3064-4aa0-8df9-8d5b883ddd20', 0, 0, 0, 0, 0, '{}'::jsonb, 0, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_routing_scores (application_id, shop_id, total_score, distance_score, capacity_score, specialty_score, preference_score, score_breakdown, rank, status, assigned_at) VALUES ('1c61cbb5-ef51-4238-8e81-f2b66a6fd300', 'cab4aa7a-273b-462b-a1c9-72d699b2b506', 0, 0, 0, 0, 0, '{}'::jsonb, 0, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO shop_routing_scores (application_id, shop_id, total_score, distance_score, capacity_score, specialty_score, preference_score, score_breakdown, rank, status, assigned_at) VALUES ('80b8a026-650f-4ce1-851b-f7fedac9cb18', '074d0bd6-0335-4ae5-b868-fb4819469b1f', 0, 0, 0, 0, 0, '{}'::jsonb, 0, 'active', NULL) ON CONFLICT DO NOTHING;

-- signatures
INSERT INTO signatures (user_id, document_type, document_id, signature_data, ip_address) VALUES (NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO signatures (user_id, document_type, document_id, signature_data, ip_address) VALUES (NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO signatures (user_id, document_type, document_id, signature_data, ip_address) VALUES (NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- sms_messages
INSERT INTO sms_messages (data, to_number, from_number, body, status, sent_at) VALUES ('{}'::jsonb, NULL, NULL, 'Seed data for sms messages', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO sms_messages (data, to_number, from_number, body, status, sent_at) VALUES ('{}'::jsonb, NULL, NULL, 'Seed data for sms messages', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO sms_messages (data, to_number, from_number, body, status, sent_at) VALUES ('{}'::jsonb, NULL, NULL, 'Seed data for sms messages', 'active', NULL) ON CONFLICT DO NOTHING;

-- sms_reminders
INSERT INTO sms_reminders (application_id, reminder_type, status) VALUES (NULL, '', 'active') ON CONFLICT DO NOTHING;
INSERT INTO sms_reminders (application_id, reminder_type, status) VALUES (NULL, '', 'active') ON CONFLICT DO NOTHING;
INSERT INTO sms_reminders (application_id, reminder_type, status) VALUES (NULL, '', 'active') ON CONFLICT DO NOTHING;

-- sms_templates
INSERT INTO sms_templates (created_at_legacy, data, name, body, variables) VALUES (NULL, '{}'::jsonb, 'Sample Sms Templates 1', 'Seed data for sms templates', NULL) ON CONFLICT DO NOTHING;
INSERT INTO sms_templates (created_at_legacy, data, name, body, variables) VALUES (NULL, '{}'::jsonb, 'Sample Sms Templates 2', 'Seed data for sms templates', NULL) ON CONFLICT DO NOTHING;
INSERT INTO sms_templates (created_at_legacy, data, name, body, variables) VALUES (NULL, '{}'::jsonb, 'Sample Sms Templates 3', 'Seed data for sms templates', NULL) ON CONFLICT DO NOTHING;

-- social_media_posts
INSERT INTO social_media_posts (platform, post_type, title, content, media_url, blog_post_id, scheduled_for, published_at, status, external_post_id, engagement_data, created_by) VALUES ('', NULL, 'Sample Social Media Posts 1', 'Seed data for social media posts', NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO social_media_posts (platform, post_type, title, content, media_url, blog_post_id, scheduled_for, published_at, status, external_post_id, engagement_data, created_by) VALUES ('', NULL, 'Sample Social Media Posts 2', 'Seed data for social media posts', NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO social_media_posts (platform, post_type, title, content, media_url, blog_post_id, scheduled_for, published_at, status, external_post_id, engagement_data, created_by) VALUES ('', NULL, 'Sample Social Media Posts 3', 'Seed data for social media posts', NULL, NULL, NULL, NULL, 'active', NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- sso_connections
INSERT INTO sso_connections (provider_id, user_id, external_user_id, email, metadata, last_login_at) VALUES (NULL, '53e03338-c78e-45b9-b8bb-6797269d17c3', '', 'user1@example.com', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sso_connections (provider_id, user_id, external_user_id, email, metadata, last_login_at) VALUES (NULL, '0e7fed1e-38a0-48db-9457-7f03f273bd07', '', 'user2@example.com', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO sso_connections (provider_id, user_id, external_user_id, email, metadata, last_login_at) VALUES (NULL, '3c846c9f-82b0-48a0-a11b-65aa0c6ddee8', '', 'user3@example.com', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- staff_training_progress
INSERT INTO staff_training_progress (user_id, module_id, status, started_at, completed_at, score) VALUES ('0e42ae59-f720-49e9-a582-1e56dd37e99c', NULL, 'active', NULL, NULL, 56) ON CONFLICT DO NOTHING;
INSERT INTO staff_training_progress (user_id, module_id, status, started_at, completed_at, score) VALUES ('38554633-dd1b-4a5d-9abd-6bcfe54b3d6e', NULL, 'active', NULL, NULL, 98) ON CONFLICT DO NOTHING;
INSERT INTO staff_training_progress (user_id, module_id, status, started_at, completed_at, score) VALUES ('243eb02a-967a-41bd-b147-8b9816a788a3', NULL, 'active', NULL, NULL, 89) ON CONFLICT DO NOTHING;

-- state_board_readiness
INSERT INTO state_board_readiness (student_id, enrollment_id, total_hours_completed, rti_hours_completed, ojt_hours_completed, milady_completed, practical_skills_verified, ready_for_exam, exam_scheduled_date, exam_location, written_exam_passed, written_exam_date, practical_exam_passed, practical_exam_date, license_number, license_issued_date) VALUES ('ada9544c-1611-4fe1-ae59-2c38891753df', NULL, 0, 0, 0, false, false, false, CURRENT_DATE, NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO state_board_readiness (student_id, enrollment_id, total_hours_completed, rti_hours_completed, ojt_hours_completed, milady_completed, practical_skills_verified, ready_for_exam, exam_scheduled_date, exam_location, written_exam_passed, written_exam_date, practical_exam_passed, practical_exam_date, license_number, license_issued_date) VALUES ('a606f595-d3f5-4753-abc5-8c1469290398', NULL, 0, 0, 0, false, false, false, CURRENT_DATE, NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO state_board_readiness (student_id, enrollment_id, total_hours_completed, rti_hours_completed, ojt_hours_completed, milady_completed, practical_skills_verified, ready_for_exam, exam_scheduled_date, exam_location, written_exam_passed, written_exam_date, practical_exam_passed, practical_exam_date, license_number, license_issued_date) VALUES ('1e960d15-aee6-428e-b970-dc7d9075a0bb', NULL, 0, 0, 0, false, false, false, CURRENT_DATE, NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- student_enrollments
INSERT INTO student_enrollments (student_id, program_id, stripe_checkout_session_id, status, transfer_hours, rapids_status, rapids_id, milady_enrolled, milady_enrolled_at, shop_id, supervisor_id, completed_at, hours_needed, total_program_fee, down_payment, amount_paid, balance_remaining, payment_plan_months, monthly_payment_amount, payment_status, stripe_subscription_id, next_payment_date, vendor_paid, vendor_paid_at, vendor_payment_amount, certificate_issued_at, program_slug, funding_source, case_id, region_id, payment_option, required_hours, has_host_shop, host_shop_name) VALUES ('45c21a25-bd0b-4983-a2e0-eb67277e9d7f', '41258c1a-6655-4a0f-98df-13cdb88d0b22', NULL, 'active', 0, NULL, NULL, false, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, CURRENT_DATE, false, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_enrollments (student_id, program_id, stripe_checkout_session_id, status, transfer_hours, rapids_status, rapids_id, milady_enrolled, milady_enrolled_at, shop_id, supervisor_id, completed_at, hours_needed, total_program_fee, down_payment, amount_paid, balance_remaining, payment_plan_months, monthly_payment_amount, payment_status, stripe_subscription_id, next_payment_date, vendor_paid, vendor_paid_at, vendor_payment_amount, certificate_issued_at, program_slug, funding_source, case_id, region_id, payment_option, required_hours, has_host_shop, host_shop_name) VALUES ('a1472ac5-8e67-49af-b56b-f4824ac557bf', '25b58c1b-9202-4034-84e0-ce3b74ba7ddc', NULL, 'active', 0, NULL, NULL, false, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, CURRENT_DATE, false, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_enrollments (student_id, program_id, stripe_checkout_session_id, status, transfer_hours, rapids_status, rapids_id, milady_enrolled, milady_enrolled_at, shop_id, supervisor_id, completed_at, hours_needed, total_program_fee, down_payment, amount_paid, balance_remaining, payment_plan_months, monthly_payment_amount, payment_status, stripe_subscription_id, next_payment_date, vendor_paid, vendor_paid_at, vendor_payment_amount, certificate_issued_at, program_slug, funding_source, case_id, region_id, payment_option, required_hours, has_host_shop, host_shop_name) VALUES ('74dd2590-da03-4dd1-be13-ac579e046412', 'c75797e4-d981-4075-ab53-d15aa350ba41', NULL, 'active', 0, NULL, NULL, false, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, CURRENT_DATE, false, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;

-- student_hours
INSERT INTO student_hours (enrollment_id, hours, verified) VALUES ('70e0bb0d-104c-4134-8312-c36c6fb07b3a', 25, false) ON CONFLICT DO NOTHING;
INSERT INTO student_hours (enrollment_id, hours, verified) VALUES ('c1565c3d-2f7f-4ee6-9418-daea965f6476', 27, false) ON CONFLICT DO NOTHING;
INSERT INTO student_hours (enrollment_id, hours, verified) VALUES ('c37cebc8-5cb7-44f6-be3a-6747e9095f93', 11, false) ON CONFLICT DO NOTHING;

-- student_next_steps
INSERT INTO student_next_steps (user_id, organization_id, program_id, inquiry_submitted, inquiry_submitted_at, icc_account_created, icc_username, workone_appointment_scheduled, workone_appointment_date, workone_appointment_time, workone_location, told_advisor_efh, advisor_docs_uploaded, advisor_docs_note, funding_status, funding_type, efh_onboarding_call_completed, efh_onboarding_call_date, program_start_confirmed, program_start_date, staff_notes) VALUES ('8aaa913b-4c1b-4bbe-b117-116251642cd5', NULL, NULL, false, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL, false, false, NULL, '', NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_next_steps (user_id, organization_id, program_id, inquiry_submitted, inquiry_submitted_at, icc_account_created, icc_username, workone_appointment_scheduled, workone_appointment_date, workone_appointment_time, workone_location, told_advisor_efh, advisor_docs_uploaded, advisor_docs_note, funding_status, funding_type, efh_onboarding_call_completed, efh_onboarding_call_date, program_start_confirmed, program_start_date, staff_notes) VALUES ('3044d018-d043-4c90-a2b7-5ff13a8385c9', NULL, NULL, false, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL, false, false, NULL, '', NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_next_steps (user_id, organization_id, program_id, inquiry_submitted, inquiry_submitted_at, icc_account_created, icc_username, workone_appointment_scheduled, workone_appointment_date, workone_appointment_time, workone_location, told_advisor_efh, advisor_docs_uploaded, advisor_docs_note, funding_status, funding_type, efh_onboarding_call_completed, efh_onboarding_call_date, program_start_confirmed, program_start_date, staff_notes) VALUES ('a72ec928-644a-4000-a76a-1fcee6fab883', NULL, NULL, false, NULL, false, NULL, false, CURRENT_DATE, NULL, NULL, false, false, NULL, '', NULL, false, CURRENT_DATE, false, CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;

-- student_onboarding
INSERT INTO student_onboarding (student_id, handbook_reviewed, milady_orientation_completed, ai_instructor_met, shop_placed, handbook_reviewed_at, milady_orientation_completed_at, ai_instructor_met_at, shop_placed_at) VALUES ('62f30a1b-8428-4bae-9886-2680aa773e36', false, false, false, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_onboarding (student_id, handbook_reviewed, milady_orientation_completed, ai_instructor_met, shop_placed, handbook_reviewed_at, milady_orientation_completed_at, ai_instructor_met_at, shop_placed_at) VALUES ('18c06d4c-a81a-42de-b54e-329483f21700', false, false, false, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_onboarding (student_id, handbook_reviewed, milady_orientation_completed, ai_instructor_met, shop_placed, handbook_reviewed_at, milady_orientation_completed_at, ai_instructor_met_at, shop_placed_at) VALUES ('dcc369b9-591f-494a-b959-bd9653cc1756', false, false, false, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- student_progress
INSERT INTO student_progress (student_id, course_id, module_id, lesson_id, progress_percentage, completed, last_accessed_at) VALUES (NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_progress (student_id, course_id, module_id, lesson_id, progress_percentage, completed, last_accessed_at) VALUES (NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_progress (student_id, course_id, module_id, lesson_id, progress_percentage, completed, last_accessed_at) VALUES (NULL, NULL, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;

-- student_tasks
INSERT INTO student_tasks (task_id, student_id, status, submitted_at) VALUES ('b0aa8df5-fdd0-44cc-8840-6d1f565d72d3', 'fd0e15b7-3e12-4d49-b379-95c30551d628', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_tasks (task_id, student_id, status, submitted_at) VALUES ('1c1c78f0-eb4e-45c5-b4c5-8861663b7314', 'f7823126-3d77-40ef-9f28-2bdb62722c26', 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO student_tasks (task_id, student_id, status, submitted_at) VALUES ('8b5fdd27-8d40-4de7-8328-f3564612cfda', '28dabb14-da33-4fa8-beb6-261657e0bd5d', 'active', NULL) ON CONFLICT DO NOTHING;

-- students
INSERT INTO students (id, date_of_birth, address, city, state, zip_code, county, funding_type, case_manager_name, case_manager_email, case_manager_phone, eligibility_verified, eligibility_verified_at, eligibility_verified_by, notes) VALUES ('0916fa7b-d538-4922-9d29-d7577cb09401', CURRENT_DATE, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, 'Seed note for students') ON CONFLICT DO NOTHING;
INSERT INTO students (id, date_of_birth, address, city, state, zip_code, county, funding_type, case_manager_name, case_manager_email, case_manager_phone, eligibility_verified, eligibility_verified_at, eligibility_verified_by, notes) VALUES ('0ac5299c-9ef0-4e45-a73d-c1e06fa5b802', CURRENT_DATE, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, 'Seed note for students') ON CONFLICT DO NOTHING;
INSERT INTO students (id, date_of_birth, address, city, state, zip_code, county, funding_type, case_manager_name, case_manager_email, case_manager_phone, eligibility_verified, eligibility_verified_at, eligibility_verified_by, notes) VALUES ('189a15f1-25d8-4aa4-86cf-324e70c1bf29', CURRENT_DATE, 'Indianapolis, IN', 'Indianapolis', 'IN', '46204', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, 'Seed note for students') ON CONFLICT DO NOTHING;

-- studio_chat_history
INSERT INTO studio_chat_history (user_id, repo_id, session_id, messages, file_context) VALUES ('4454ee19-32ba-4690-8b39-9ae3073a46e3', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_chat_history (user_id, repo_id, session_id, messages, file_context) VALUES ('6bfe222a-5f13-45b9-94d2-6cac083517cd', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_chat_history (user_id, repo_id, session_id, messages, file_context) VALUES ('1213e444-7169-4850-b4ff-ba6bb1044544', NULL, NULL, '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- studio_comments
INSERT INTO studio_comments (user_id, repo_id, file_path, branch, line_start, line_end, content, resolved) VALUES ('11cf01bc-b84f-4113-8b37-c87ab2c561fb', NULL, '', NULL, 0, 0, 'Seed data for studio comments', false) ON CONFLICT DO NOTHING;
INSERT INTO studio_comments (user_id, repo_id, file_path, branch, line_start, line_end, content, resolved) VALUES ('e33bd698-0cea-41b8-b22a-4f2bfc9a7a09', NULL, '', NULL, 0, 0, 'Seed data for studio comments', false) ON CONFLICT DO NOTHING;
INSERT INTO studio_comments (user_id, repo_id, file_path, branch, line_start, line_end, content, resolved) VALUES ('3c81b32e-3286-4ded-9d76-493679b0dbc9', NULL, '', NULL, 0, 0, 'Seed data for studio comments', false) ON CONFLICT DO NOTHING;

-- studio_deploy_tokens
INSERT INTO studio_deploy_tokens (id, user_id, provider, encrypted_token, project_id) VALUES ('ac2f9fa6-bee9-425f-86eb-97c0ea8dca17', 'f60f5539-9576-4c31-80ba-3527bbe1ccb1', '', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_deploy_tokens (id, user_id, provider, encrypted_token, project_id) VALUES ('c786b647-3ae9-4a14-9275-27a830cfda28', '58d94003-9a87-4932-a83c-72df9ce95be6', '', '', NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_deploy_tokens (id, user_id, provider, encrypted_token, project_id) VALUES ('7b8ed42b-fdaf-451d-8ac8-b9e77ce0ae89', '6168dad5-c20c-472f-8141-64353f51d32c', '', '', NULL) ON CONFLICT DO NOTHING;

-- studio_favorites
INSERT INTO studio_favorites (user_id, repo_id, file_path, line_number, label) VALUES ('6ee43273-f67d-404e-8ced-c0c8a5825bfd', NULL, '', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_favorites (user_id, repo_id, file_path, line_number, label) VALUES ('d30a2ebc-d50f-406d-8376-413b6ae089c5', NULL, '', 0, NULL) ON CONFLICT DO NOTHING;
INSERT INTO studio_favorites (user_id, repo_id, file_path, line_number, label) VALUES ('d4a525ff-0e28-4476-b422-935e42583adb', NULL, '', 0, NULL) ON CONFLICT DO NOTHING;

-- studio_recent_files
INSERT INTO studio_recent_files (user_id, repo_id, file_path, branch, access_count) VALUES ('c3665fb9-874d-4d23-9981-faeea43cf17a', NULL, '', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO studio_recent_files (user_id, repo_id, file_path, branch, access_count) VALUES ('0e6c3bf2-f8de-4de0-a5d5-9ea558c655ff', NULL, '', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO studio_recent_files (user_id, repo_id, file_path, branch, access_count) VALUES ('df0653ec-882f-4133-9bb8-8b1780972676', NULL, '', NULL, 0) ON CONFLICT DO NOTHING;

-- studio_repos
INSERT INTO studio_repos (user_id, repo_full_name, default_branch, is_favorite) VALUES ('bfee2eb9-58df-43a4-89dd-29a1d98f3676', '', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO studio_repos (user_id, repo_full_name, default_branch, is_favorite) VALUES ('8724ee41-45b3-4ad7-8f84-fb64cf051f2e', '', NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO studio_repos (user_id, repo_full_name, default_branch, is_favorite) VALUES ('e584b83b-b8e9-456d-9c6b-1c0f0d4cf259', '', NULL, false) ON CONFLICT DO NOTHING;

-- studio_sessions
INSERT INTO studio_sessions (user_id, repo_id, branch, open_files, active_file, cursor_positions) VALUES ('88a08d7f-636f-49aa-a0a1-920c3efd00c2', NULL, NULL, '{}'::jsonb, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO studio_sessions (user_id, repo_id, branch, open_files, active_file, cursor_positions) VALUES ('ce24c1ea-d992-479f-a2eb-10aec9a90ffa', NULL, NULL, '{}'::jsonb, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO studio_sessions (user_id, repo_id, branch, open_files, active_file, cursor_positions) VALUES ('99708fd2-509d-441c-9508-db587751529d', NULL, NULL, '{}'::jsonb, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- studio_settings
INSERT INTO studio_settings (user_id, theme, font_size, word_wrap, minimap, auto_save, keyboard_shortcuts) VALUES ('82ce77fc-695d-41ba-8578-35e90988e3b0', NULL, 0, false, false, false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO studio_settings (user_id, theme, font_size, word_wrap, minimap, auto_save, keyboard_shortcuts) VALUES ('e381908e-a861-47d2-9d6d-ce0094f5a16a', NULL, 0, false, false, false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO studio_settings (user_id, theme, font_size, word_wrap, minimap, auto_save, keyboard_shortcuts) VALUES ('5e7686a6-c343-49f4-9587-08df94dc8e46', NULL, 0, false, false, false, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- studio_shares
INSERT INTO studio_shares (user_id, repo_id, file_path, branch, line_start, line_end, share_code, expires_at, view_count) VALUES ('bb1bc23e-9658-4ad3-a7bc-6bfafb7eade6', NULL, '', NULL, 0, 0, '', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO studio_shares (user_id, repo_id, file_path, branch, line_start, line_end, share_code, expires_at, view_count) VALUES ('9055f6b6-e3c9-4688-87aa-8ccf38756603', NULL, '', NULL, 0, 0, '', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO studio_shares (user_id, repo_id, file_path, branch, line_start, line_end, share_code, expires_at, view_count) VALUES ('7af18fef-3894-4020-a6af-e733921fad6f', NULL, '', NULL, 0, 0, '', NULL, 0) ON CONFLICT DO NOTHING;

-- study_group_members
INSERT INTO study_group_members (data, study_group_id, user_id) VALUES ('{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO study_group_members (data, study_group_id, user_id) VALUES ('{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO study_group_members (data, study_group_id, user_id) VALUES ('{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;

-- study_groups
INSERT INTO study_groups (data, name, topic, description, next_session, max_members, is_active, created_by) VALUES ('{}'::jsonb, 'Sample Study Groups 1', NULL, 'Seed data for study groups', NULL, 0, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO study_groups (data, name, topic, description, next_session, max_members, is_active, created_by) VALUES ('{}'::jsonb, 'Sample Study Groups 2', NULL, 'Seed data for study groups', NULL, 0, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO study_groups (data, name, topic, description, next_session, max_members, is_active, created_by) VALUES ('{}'::jsonb, 'Sample Study Groups 3', NULL, 'Seed data for study groups', NULL, 0, true, NULL) ON CONFLICT DO NOTHING;

-- study_topics
INSERT INTO study_topics (program_id, category, title, content, sort_order, is_published) VALUES (NULL, 'general', 'Sample Study Topics 1', 'Seed data for study topics', 0, false) ON CONFLICT DO NOTHING;
INSERT INTO study_topics (program_id, category, title, content, sort_order, is_published) VALUES (NULL, 'general', 'Sample Study Topics 2', 'Seed data for study topics', 0, false) ON CONFLICT DO NOTHING;
INSERT INTO study_topics (program_id, category, title, content, sort_order, is_published) VALUES (NULL, 'general', 'Sample Study Topics 3', 'Seed data for study topics', 0, false) ON CONFLICT DO NOTHING;

-- subscriptions
INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, trial_start, trial_end) VALUES (NULL, '', 'active', CURRENT_DATE, CURRENT_DATE, false, NULL, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, trial_start, trial_end) VALUES (NULL, '', 'active', CURRENT_DATE, CURRENT_DATE, false, NULL, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, trial_start, trial_end) VALUES (NULL, '', 'active', CURRENT_DATE, CURRENT_DATE, false, NULL, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- supportive_services
INSERT INTO supportive_services (participant_id, service_type, service_description, amount_requested, amount_approved, amount_paid, request_status, requested_by, requested_date, approved_by, approved_date, denial_reason, payment_method, payment_date, payment_reference, supporting_documentation_url, receipt_url) VALUES (NULL, '', NULL, 0, 0, 0, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO supportive_services (participant_id, service_type, service_description, amount_requested, amount_approved, amount_paid, request_status, requested_by, requested_date, approved_by, approved_date, denial_reason, payment_method, payment_date, payment_reference, supporting_documentation_url, receipt_url) VALUES (NULL, '', NULL, 0, 0, 0, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO supportive_services (participant_id, service_type, service_description, amount_requested, amount_approved, amount_paid, request_status, requested_by, requested_date, approved_by, approved_date, denial_reason, payment_method, payment_date, payment_reference, supporting_documentation_url, receipt_url) VALUES (NULL, '', NULL, 0, 0, 0, NULL, NULL, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tax_applications
INSERT INTO tax_applications (student_id, tax_year, application_type, status, submitted_at, reviewed_at, reviewed_by) VALUES (NULL, 0, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_applications (student_id, tax_year, application_type, status, submitted_at, reviewed_at, reviewed_by) VALUES (NULL, 0, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_applications (student_id, tax_year, application_type, status, submitted_at, reviewed_at, reviewed_by) VALUES (NULL, 0, NULL, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tax_calculations
INSERT INTO tax_calculations (user_id, user_email, tax_year, filing_status, total_income, adjusted_gross_income, taxable_income, federal_tax, total_tax, federal_withholding, estimated_refund, is_refund, calculation_data) VALUES (NULL, NULL, 0, '', 0, 0, 0, 0, 0, 0, 0, false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO tax_calculations (user_id, user_email, tax_year, filing_status, total_income, adjusted_gross_income, taxable_income, federal_tax, total_tax, federal_withholding, estimated_refund, is_refund, calculation_data) VALUES (NULL, NULL, 0, '', 0, 0, 0, 0, 0, 0, 0, false, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO tax_calculations (user_id, user_email, tax_year, filing_status, total_income, adjusted_gross_income, taxable_income, federal_tax, total_tax, federal_withholding, estimated_refund, is_refund, calculation_data) VALUES (NULL, NULL, 0, '', 0, 0, 0, 0, 0, 0, 0, false, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- tax_clients
INSERT INTO tax_clients (first_name, last_name, email, phone, ssn_last4, preparer_id, tenant_id, ssn_hash, user_id, office_id, ssn_last_four) VALUES ('James', 'Johnson', 'user1@example.com', '317-555-1000', NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_clients (first_name, last_name, email, phone, ssn_last4, preparer_id, tenant_id, ssn_hash, user_id, office_id, ssn_last_four) VALUES ('Maria', 'Garcia', 'user2@example.com', '317-555-1001', NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_clients (first_name, last_name, email, phone, ssn_last4, preparer_id, tenant_id, ssn_hash, user_id, office_id, ssn_last_four) VALUES ('David', 'Williams', 'user3@example.com', '317-555-1002', NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tax_dependents
INSERT INTO tax_dependents (tax_return_id, client_id, first_name, last_name, ssn_hash, ssn_last4, date_of_birth, relationship, months_lived_with_taxpayer, child_tax_credit_eligible, other_dependent_credit_eligible) VALUES (NULL, NULL, 'James', 'Johnson', '', '', CURRENT_DATE, '', 0, false, false) ON CONFLICT DO NOTHING;
INSERT INTO tax_dependents (tax_return_id, client_id, first_name, last_name, ssn_hash, ssn_last4, date_of_birth, relationship, months_lived_with_taxpayer, child_tax_credit_eligible, other_dependent_credit_eligible) VALUES (NULL, NULL, 'Maria', 'Garcia', '', '', CURRENT_DATE, '', 0, false, false) ON CONFLICT DO NOTHING;
INSERT INTO tax_dependents (tax_return_id, client_id, first_name, last_name, ssn_hash, ssn_last4, date_of_birth, relationship, months_lived_with_taxpayer, child_tax_credit_eligible, other_dependent_credit_eligible) VALUES (NULL, NULL, 'David', 'Williams', '', '', CURRENT_DATE, '', 0, false, false) ON CONFLICT DO NOTHING;

-- tax_document_uploads
INSERT INTO tax_document_uploads (name, email, phone, filename, file_path, file_size, content_type, status, reviewed_by, reviewed_at, notes) VALUES ('Sample Tax Document Uploads 1', 'user1@example.com', '317-555-1000', '', '', 0, NULL, 'active', NULL, NULL, 'Seed note for tax_document_uploads') ON CONFLICT DO NOTHING;
INSERT INTO tax_document_uploads (name, email, phone, filename, file_path, file_size, content_type, status, reviewed_by, reviewed_at, notes) VALUES ('Sample Tax Document Uploads 2', 'user2@example.com', '317-555-1001', '', '', 0, NULL, 'active', NULL, NULL, 'Seed note for tax_document_uploads') ON CONFLICT DO NOTHING;
INSERT INTO tax_document_uploads (name, email, phone, filename, file_path, file_size, content_type, status, reviewed_by, reviewed_at, notes) VALUES ('Sample Tax Document Uploads 3', 'user3@example.com', '317-555-1002', '', '', 0, NULL, 'active', NULL, NULL, 'Seed note for tax_document_uploads') ON CONFLICT DO NOTHING;

-- tax_documents
INSERT INTO tax_documents (user_id, tax_year, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, metadata) VALUES ('35b5be13-3c46-4793-a918-cf9d366bff34', 0, '', '', 0, '', '', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO tax_documents (user_id, tax_year, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, metadata) VALUES ('2e335ba4-1aaa-4a04-b9ad-5003477002e6', 0, '', '', 0, '', '', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO tax_documents (user_id, tax_year, document_type, file_name, file_size, file_url, mime_type, status, uploaded_by, reviewed_by, reviewed_at, metadata) VALUES ('25fda021-b8fe-4126-bac1-961097c2d785', 0, '', '', 0, '', '', 'active', NULL, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- tax_filings
INSERT INTO tax_filings (student_id, tax_year, filing_type, status, preparer_id, vita_site, filing_date, refund_amount, documents, notes) VALUES (NULL, 0, NULL, 'active', NULL, NULL, CURRENT_DATE, 0, '{}'::jsonb, 'Seed note for tax_filings') ON CONFLICT DO NOTHING;
INSERT INTO tax_filings (student_id, tax_year, filing_type, status, preparer_id, vita_site, filing_date, refund_amount, documents, notes) VALUES (NULL, 0, NULL, 'active', NULL, NULL, CURRENT_DATE, 0, '{}'::jsonb, 'Seed note for tax_filings') ON CONFLICT DO NOTHING;
INSERT INTO tax_filings (student_id, tax_year, filing_type, status, preparer_id, vita_site, filing_date, refund_amount, documents, notes) VALUES (NULL, 0, NULL, 'active', NULL, NULL, CURRENT_DATE, 0, '{}'::jsonb, 'Seed note for tax_filings') ON CONFLICT DO NOTHING;

-- tax_intake
INSERT INTO tax_intake (service_type, diy_service, first_name, last_name, email, phone, notes, paid, stripe_session_id, ip_address, user_agent) VALUES ('', NULL, 'James', 'Johnson', 'user1@example.com', '317-555-1000', 'Seed note for tax_intake', false, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_intake (service_type, diy_service, first_name, last_name, email, phone, notes, paid, stripe_session_id, ip_address, user_agent) VALUES ('', NULL, 'Maria', 'Garcia', 'user2@example.com', '317-555-1001', 'Seed note for tax_intake', false, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_intake (service_type, diy_service, first_name, last_name, email, phone, notes, paid, stripe_session_id, ip_address, user_agent) VALUES ('', NULL, 'David', 'Williams', 'user3@example.com', '317-555-1002', 'Seed note for tax_intake', false, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tax_preparers
INSERT INTO tax_preparers (user_id, first_name, last_name, email, phone, ptin, ptin_expiration, office_id, certification_level, certifications, training_completed_at, annual_refresher_due, efin_authorized, ero_authorized, status, activated_at, suspended_at, suspension_reason, returns_prepared_lifetime, returns_prepared_current_season, rejection_rate, average_refund, compensation_type, per_return_rate, hourly_rate, commission_percent, created_by, notes) VALUES (NULL, 'James', 'Johnson', 'user1@example.com', '317-555-1000', '', CURRENT_DATE, NULL, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, 'active', NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for tax_preparers') ON CONFLICT DO NOTHING;
INSERT INTO tax_preparers (user_id, first_name, last_name, email, phone, ptin, ptin_expiration, office_id, certification_level, certifications, training_completed_at, annual_refresher_due, efin_authorized, ero_authorized, status, activated_at, suspended_at, suspension_reason, returns_prepared_lifetime, returns_prepared_current_season, rejection_rate, average_refund, compensation_type, per_return_rate, hourly_rate, commission_percent, created_by, notes) VALUES (NULL, 'Maria', 'Garcia', 'user2@example.com', '317-555-1001', '', CURRENT_DATE, NULL, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, 'active', NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for tax_preparers') ON CONFLICT DO NOTHING;
INSERT INTO tax_preparers (user_id, first_name, last_name, email, phone, ptin, ptin_expiration, office_id, certification_level, certifications, training_completed_at, annual_refresher_due, efin_authorized, ero_authorized, status, activated_at, suspended_at, suspension_reason, returns_prepared_lifetime, returns_prepared_current_season, rejection_rate, average_refund, compensation_type, per_return_rate, hourly_rate, commission_percent, created_by, notes) VALUES (NULL, 'David', 'Williams', 'user3@example.com', '317-555-1002', '', CURRENT_DATE, NULL, NULL, '{}'::jsonb, NULL, CURRENT_DATE, false, false, 'active', NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, NULL, 'Seed note for tax_preparers') ON CONFLICT DO NOTHING;

-- tax_returns
INSERT INTO tax_returns (user_id, tax_year, filing_status, service_type, status, drake_return_id, jotform_submission_id, has_w2, has_1099, has_self_employment, has_rental_income, wants_refund_advance, refund_method, federal_refund, state_refund, total_income, adjusted_gross_income, taxable_income, federal_tax, state_tax, filed_date, accepted_date, public_tracking_code) VALUES (NULL, 0, '', NULL, 'active', NULL, NULL, false, false, false, false, false, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_returns (user_id, tax_year, filing_status, service_type, status, drake_return_id, jotform_submission_id, has_w2, has_1099, has_self_employment, has_rental_income, wants_refund_advance, refund_method, federal_refund, state_refund, total_income, adjusted_gross_income, taxable_income, federal_tax, state_tax, filed_date, accepted_date, public_tracking_code) VALUES (NULL, 0, '', NULL, 'active', NULL, NULL, false, false, false, false, false, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tax_returns (user_id, tax_year, filing_status, service_type, status, drake_return_id, jotform_submission_id, has_w2, has_1099, has_self_employment, has_rental_income, wants_refund_advance, refund_method, federal_refund, state_refund, total_income, adjusted_gross_income, taxable_income, federal_tax, state_tax, filed_date, accepted_date, public_tracking_code) VALUES (NULL, 0, '', NULL, 'active', NULL, NULL, false, false, false, false, false, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tax_w2_income
INSERT INTO tax_w2_income (tax_return_id, employer_ein, employer_name, employer_address_street, employer_address_city, employer_address_state, employer_address_zip, wages, federal_withholding, social_security_wages, social_security_tax, medicare_wages, medicare_tax, state_wages, state_withholding, state_code, state_employer_id, local_wages, local_withholding, locality_name, retirement_plan) VALUES (NULL, '', '', NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO tax_w2_income (tax_return_id, employer_ein, employer_name, employer_address_street, employer_address_city, employer_address_state, employer_address_zip, wages, federal_withholding, social_security_wages, social_security_tax, medicare_wages, medicare_tax, state_wages, state_withholding, state_code, state_employer_id, local_wages, local_withholding, locality_name, retirement_plan) VALUES (NULL, '', '', NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO tax_w2_income (tax_return_id, employer_ein, employer_name, employer_address_street, employer_address_city, employer_address_state, employer_address_zip, wages, federal_withholding, social_security_wages, social_security_tax, medicare_wages, medicare_tax, state_wages, state_withholding, state_code, state_employer_id, local_wages, local_withholding, locality_name, retirement_plan) VALUES (NULL, '', '', NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, false) ON CONFLICT DO NOTHING;

-- tenant_branding
INSERT INTO tenant_branding (tenant_id, logo_url, logo_dark_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, font_family, heading_font, custom_css, email_header_url, email_footer_text) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tenant_branding (tenant_id, logo_url, logo_dark_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, font_family, heading_font, custom_css, email_header_url, email_footer_text) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO tenant_branding (tenant_id, logo_url, logo_dark_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, font_family, heading_font, custom_css, email_header_url, email_footer_text) VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- tenant_usage
INSERT INTO tenant_usage (tenant_id, active_users, total_courses, total_enrollments, storage_used_gb, api_requests_count, period_start, period_end) VALUES (NULL, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO tenant_usage (tenant_id, active_users, total_courses, total_enrollments, storage_used_gb, api_requests_count, period_start, period_end) VALUES (NULL, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO tenant_usage (tenant_id, active_users, total_courses, total_enrollments, storage_used_gb, api_requests_count, period_start, period_end) VALUES (NULL, 0, 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- time_entries
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out, break_minutes, total_hours, status, approved_by, approved_at) VALUES (NULL, CURRENT_DATE, '', NULL, 0, 0, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out, break_minutes, total_hours, status, approved_by, approved_at) VALUES (NULL, CURRENT_DATE, '', NULL, 0, 0, 'active', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out, break_minutes, total_hours, status, approved_by, approved_at) VALUES (NULL, CURRENT_DATE, '', NULL, 0, 0, 'active', NULL, NULL) ON CONFLICT DO NOTHING;

-- time_off_requests
INSERT INTO time_off_requests (user_id, request_type, start_date, end_date, status, reason, approved_by, approved_at) VALUES ('dfacb7c5-5514-4b41-bdfa-382b71c13344', NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO time_off_requests (user_id, request_type, start_date, end_date, status, reason, approved_by, approved_at) VALUES ('2cc1dafc-6874-4190-b0c4-715e5fe86ba3', NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO time_off_requests (user_id, request_type, start_date, end_date, status, reason, approved_by, approved_at) VALUES ('a4c55cc4-1f92-4ce7-b137-e6e2782c72ee', NULL, CURRENT_DATE, CURRENT_DATE, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- timeclock_shifts
INSERT INTO timeclock_shifts (apprentice_id, site_id, clock_out_at, lunch_start_at, lunch_end_at, clock_in_lat, clock_in_lng, clock_in_within_geofence, clock_out_lat, clock_out_lng, clock_out_within_geofence, total_hours, status, notes) VALUES ('96ed963d-25e3-4091-8603-e3a9aab9615c', '189b063a-0f0c-4063-828b-ba909a9a9081', NULL, NULL, NULL, 0, 0, false, 0, 0, false, 0, 'active', 'Seed note for timeclock_shifts') ON CONFLICT DO NOTHING;
INSERT INTO timeclock_shifts (apprentice_id, site_id, clock_out_at, lunch_start_at, lunch_end_at, clock_in_lat, clock_in_lng, clock_in_within_geofence, clock_out_lat, clock_out_lng, clock_out_within_geofence, total_hours, status, notes) VALUES ('e9ed03d0-755d-4052-876d-fdbb68a2ddc6', 'fb7efb2c-32b2-43a1-b41a-0aa38a7543ed', NULL, NULL, NULL, 0, 0, false, 0, 0, false, 0, 'active', 'Seed note for timeclock_shifts') ON CONFLICT DO NOTHING;
INSERT INTO timeclock_shifts (apprentice_id, site_id, clock_out_at, lunch_start_at, lunch_end_at, clock_in_lat, clock_in_lng, clock_in_within_geofence, clock_out_lat, clock_out_lng, clock_out_within_geofence, total_hours, status, notes) VALUES ('8aa3e2ca-3560-4008-8eb8-bceed5221333', '3540d573-b4dc-4be8-9ec2-2076ae7470cf', NULL, NULL, NULL, 0, 0, false, 0, 0, false, 0, 'active', 'Seed note for timeclock_shifts') ON CONFLICT DO NOTHING;

-- transfer_hour_requests
INSERT INTO transfer_hour_requests (student_id, enrollment_id, hours_requested, hours_approved, previous_school_name, previous_school_address, previous_school_phone, previous_school_license, completion_date, documentation_url, notes, status, reviewer_id, reviewer_notes, reviewed_at) VALUES ('718d8478-7d96-45ad-86d9-e0b59d9bc4d5', NULL, 0, 0, '', NULL, NULL, NULL, CURRENT_DATE, NULL, 'Seed note for transfer_hour_requests', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfer_hour_requests (student_id, enrollment_id, hours_requested, hours_approved, previous_school_name, previous_school_address, previous_school_phone, previous_school_license, completion_date, documentation_url, notes, status, reviewer_id, reviewer_notes, reviewed_at) VALUES ('9b5f0853-278d-4b5b-b9f2-6636f45bd229', NULL, 0, 0, '', NULL, NULL, NULL, CURRENT_DATE, NULL, 'Seed note for transfer_hour_requests', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfer_hour_requests (student_id, enrollment_id, hours_requested, hours_approved, previous_school_name, previous_school_address, previous_school_phone, previous_school_license, completion_date, documentation_url, notes, status, reviewer_id, reviewer_notes, reviewed_at) VALUES ('05b098de-bd2f-47b4-bf66-347ff573d43b', NULL, 0, 0, '', NULL, NULL, NULL, CURRENT_DATE, NULL, 'Seed note for transfer_hour_requests', 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- transfer_hours
INSERT INTO transfer_hours (student_id, course_id, hours_transferred, source_institution, approved_by, approved_at) VALUES (NULL, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfer_hours (student_id, course_id, hours_transferred, source_institution, approved_by, approved_at) VALUES (NULL, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfer_hours (student_id, course_id, hours_transferred, source_institution, approved_by, approved_at) VALUES (NULL, NULL, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
