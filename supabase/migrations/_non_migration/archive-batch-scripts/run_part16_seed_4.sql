-- turnstile_verifications
INSERT INTO turnstile_verifications (data, token, success, ip_address, hostname) VALUES ('{}'::jsonb, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO turnstile_verifications (data, token, success, ip_address, hostname) VALUES ('{}'::jsonb, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO turnstile_verifications (data, token, success, ip_address, hostname) VALUES ('{}'::jsonb, NULL, false, NULL, NULL) ON CONFLICT DO NOTHING;

-- two_factor_auth
INSERT INTO two_factor_auth (user_id, method, secret, backup_codes, is_enabled, verified_at) VALUES ('0de02c92-1be7-4e9f-a4fd-9d4c68279304', '', '', NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO two_factor_auth (user_id, method, secret, backup_codes, is_enabled, verified_at) VALUES ('e7473686-3d23-4d7a-a9bd-c65d0bd358b1', '', '', NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO two_factor_auth (user_id, method, secret, backup_codes, is_enabled, verified_at) VALUES ('368b66d6-2238-46ab-92ba-5c095841cca6', '', '', NULL, false, NULL) ON CONFLICT DO NOTHING;

-- unauthorized_access_log
INSERT INTO unauthorized_access_log (id, domain, url, referrer, ip_address, user_agent, country, city, detected_at, logged_at, screenshot_url, html_snapshot, status, cease_desist_sent, cease_desist_date, dmca_filed, dmca_filed_date, legal_action_taken, legal_action_date, notes, assigned_to, resolved, resolved_at, resolution_notes, created_at, updated_at) VALUES (0, '', 'https://www.elevateforhumanity.org', NULL, NULL, NULL, 'US', 'Indianapolis', '', NULL, NULL, NULL, 'active', false, CURRENT_DATE, false, CURRENT_DATE, false, CURRENT_DATE, 'Seed note for unauthorized_access_log', 0, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO unauthorized_access_log (id, domain, url, referrer, ip_address, user_agent, country, city, detected_at, logged_at, screenshot_url, html_snapshot, status, cease_desist_sent, cease_desist_date, dmca_filed, dmca_filed_date, legal_action_taken, legal_action_date, notes, assigned_to, resolved, resolved_at, resolution_notes, created_at, updated_at) VALUES (0, '', 'https://www.elevateforhumanity.org', NULL, NULL, NULL, 'US', 'Indianapolis', '', NULL, NULL, NULL, 'active', false, CURRENT_DATE, false, CURRENT_DATE, false, CURRENT_DATE, 'Seed note for unauthorized_access_log', 0, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO unauthorized_access_log (id, domain, url, referrer, ip_address, user_agent, country, city, detected_at, logged_at, screenshot_url, html_snapshot, status, cease_desist_sent, cease_desist_date, dmca_filed, dmca_filed_date, legal_action_taken, legal_action_date, notes, assigned_to, resolved, resolved_at, resolution_notes, created_at, updated_at) VALUES (0, '', 'https://www.elevateforhumanity.org', NULL, NULL, NULL, 'US', 'Indianapolis', '', NULL, NULL, NULL, 'active', false, CURRENT_DATE, false, CURRENT_DATE, false, CURRENT_DATE, 'Seed note for unauthorized_access_log', 0, false, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- user_achievements
INSERT INTO user_achievements (user_id, achievement_id) VALUES ('20009b87-26cf-458a-a677-09f57b65f4fc', '18203c11-1336-4e77-97cb-b4782a2c4d15') ON CONFLICT DO NOTHING;
INSERT INTO user_achievements (user_id, achievement_id) VALUES ('b4a361ca-9e43-413c-915e-d10147d7006b', '456679f5-a616-4070-8a97-2e42cc9232f1') ON CONFLICT DO NOTHING;
INSERT INTO user_achievements (user_id, achievement_id) VALUES ('3bac5472-4f90-4d3b-87e7-384ea0102135', '06f9d818-d835-4c06-800a-b33bc666a7fd') ON CONFLICT DO NOTHING;

-- user_activity
INSERT INTO user_activity (data, user_id, activity_type, details) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO user_activity (data, user_id, activity_type, details) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO user_activity (data, user_id, activity_type, details) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb) ON CONFLICT DO NOTHING;

-- user_activity_events
INSERT INTO user_activity_events (user_id, event_type, event_data, page_url, referrer_url, session_id, ip_address, user_agent) VALUES ('738a3d61-1573-4d15-8efe-353565cc04a7', '', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_activity_events (user_id, event_type, event_data, page_url, referrer_url, session_id, ip_address, user_agent) VALUES ('2a8cd4e1-2ba7-4514-9c98-5ca5e9a8e112', '', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_activity_events (user_id, event_type, event_data, page_url, referrer_url, session_id, ip_address, user_agent) VALUES ('bacb2892-1c35-4a03-9c3f-52c33d126c03', '', '{}'::jsonb, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- user_badges
INSERT INTO user_badges (user_id, badge_id, progress_data) VALUES ('78cffbff-cbad-4fc5-8fd2-fd98b535064a', 'b672704e-62db-4c56-adea-35d68622a67c', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO user_badges (user_id, badge_id, progress_data) VALUES ('16bec942-95b9-4765-a8c0-10361cbc0a6f', 'c7d3ce44-f731-4245-beb8-40cee3760737', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO user_badges (user_id, badge_id, progress_data) VALUES ('0f0ffec0-d27b-42cd-a3f3-b0771c605310', 'e84dcd47-d463-4b18-b97b-8e8c69557722', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- user_documents
INSERT INTO user_documents (user_id, document_type, file_url, file_name, status, verified_by, verified_at, rejection_reason, expires_at) VALUES ('a5b06638-4420-4f65-8551-939586dd7795', '', '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_documents (user_id, document_type, file_url, file_name, status, verified_by, verified_at, rejection_reason, expires_at) VALUES ('a74cd9cf-4eae-4b3a-9ec8-0ca27e31ce05', '', '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_documents (user_id, document_type, file_url, file_name, status, verified_by, verified_at, rejection_reason, expires_at) VALUES ('d4f90ed7-e3e8-4525-acf3-c308168ee2fa', '', '', NULL, 'active', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- user_learning_paths
INSERT INTO user_learning_paths (data, user_id, path_name, modules, progress, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 79, 'active') ON CONFLICT DO NOTHING;
INSERT INTO user_learning_paths (data, user_id, path_name, modules, progress, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 22, 'active') ON CONFLICT DO NOTHING;
INSERT INTO user_learning_paths (data, user_id, path_name, modules, progress, status) VALUES ('{}'::jsonb, NULL, NULL, '{}'::jsonb, 24, 'active') ON CONFLICT DO NOTHING;

-- user_onboarding
INSERT INTO user_onboarding (user_id, flow_id, current_step, completed_steps, completed, skipped, completed_at) VALUES ('34abdcee-9bf4-431a-8267-188f627ac94a', '', 0, NULL, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_onboarding (user_id, flow_id, current_step, completed_steps, completed, skipped, completed_at) VALUES ('772f378a-28c3-4d92-a8cb-a763c9f09848', '', 0, NULL, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_onboarding (user_id, flow_id, current_step, completed_steps, completed, skipped, completed_at) VALUES ('d44b6ff3-b367-4227-b4f2-6e705331d5f7', '', 0, NULL, false, false, NULL) ON CONFLICT DO NOTHING;

-- user_onboarding_status
INSERT INTO user_onboarding_status (user_id, status, profile_complete, agreements_signed, documents_uploaded, documents_verified, orientation_complete, completed_at, notes, reviewed_by) VALUES ('9ffb2ab0-e2f5-4404-b85d-16d35679112e', 'active', false, false, false, false, false, NULL, 'Seed note for user_onboarding_status', NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_onboarding_status (user_id, status, profile_complete, agreements_signed, documents_uploaded, documents_verified, orientation_complete, completed_at, notes, reviewed_by) VALUES ('c86e1f17-7929-4f89-8dfe-9fcf08e8f9e1', 'active', false, false, false, false, false, NULL, 'Seed note for user_onboarding_status', NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_onboarding_status (user_id, status, profile_complete, agreements_signed, documents_uploaded, documents_verified, orientation_complete, completed_at, notes, reviewed_by) VALUES ('6559d27d-b844-4847-9c6f-5f903f23afa1', 'active', false, false, false, false, false, NULL, 'Seed note for user_onboarding_status', NULL) ON CONFLICT DO NOTHING;

-- user_points
INSERT INTO user_points (user_id, total_points, level, level_name, points_to_next_level) VALUES ('5dc37f18-ac7b-4d33-b0a4-0e2b1bc574ae', 0, 0, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO user_points (user_id, total_points, level, level_name, points_to_next_level) VALUES ('d70f38a1-7c4d-44b4-8f28-dc0cc50f5956', 0, 0, NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO user_points (user_id, total_points, level, level_name, points_to_next_level) VALUES ('2bebd5ff-8f41-4275-bab7-c4b21cdb8534', 0, 0, NULL, 0) ON CONFLICT DO NOTHING;

-- user_profiles
INSERT INTO user_profiles (user_id, bio, avatar_url, phone, address, city, state, zip_code) VALUES (NULL, NULL, NULL, '317-555-1000', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204') ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, bio, avatar_url, phone, address, city, state, zip_code) VALUES (NULL, NULL, NULL, '317-555-1001', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204') ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, bio, avatar_url, phone, address, city, state, zip_code) VALUES (NULL, NULL, NULL, '317-555-1002', 'Indianapolis, IN', 'Indianapolis', 'IN', '46204') ON CONFLICT DO NOTHING;

-- user_progress
INSERT INTO user_progress (user_id, enrollment_id, program_id, total_lessons, completed_lessons, total_quizzes, completed_quizzes, total_resources, downloaded_resources, progress_percentage, estimated_completion_date) VALUES ('ba38b800-0472-4959-b064-498be744aa70', '6a7b813f-33d8-4181-a916-60dfd7e6178e', 'e3fe3a27-2993-44db-8bca-249048f458cb', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO user_progress (user_id, enrollment_id, program_id, total_lessons, completed_lessons, total_quizzes, completed_quizzes, total_resources, downloaded_resources, progress_percentage, estimated_completion_date) VALUES ('3f4de34e-21c9-4ba7-9396-b486d20b037e', '8e0dfd3b-b5f6-4b0b-89ab-cffc84dd6bcb', 'de16fcc3-9174-4124-8822-7b81445d0bbf', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO user_progress (user_id, enrollment_id, program_id, total_lessons, completed_lessons, total_quizzes, completed_quizzes, total_resources, downloaded_resources, progress_percentage, estimated_completion_date) VALUES ('9a66e1ff-0b7f-4c0e-a75c-390be14e2e91', '462c6907-e734-4023-89b3-beecb74e92a9', '18b1502c-08be-4578-9354-a1db2f489a5e', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- user_roles
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, expires_at) VALUES ('b4ec65ae-e972-4ebc-bb6d-04cf48cd7844', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, expires_at) VALUES ('f402a12a-489f-44d9-8f7f-df373c229d00', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, expires_at) VALUES ('0796a56e-9f55-404a-9e00-432b707febbc', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- user_skills
INSERT INTO user_skills (data, user_id, skill_name, proficiency, verified, verified_at) VALUES ('{}'::jsonb, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_skills (data, user_id, skill_name, proficiency, verified, verified_at) VALUES ('{}'::jsonb, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_skills (data, user_id, skill_name, proficiency, verified, verified_at) VALUES ('{}'::jsonb, NULL, NULL, 0, false, NULL) ON CONFLICT DO NOTHING;

-- user_streaks
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ('e6530607-4b9d-4e6e-8592-d3c33c5a2ef6', 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ('86d54b7d-a087-4dfb-8e2b-04bf8e2dc9c5', 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ('ea30ee92-5e69-4563-9d23-0a458138963f', 0, 0, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- user_tutorials
INSERT INTO user_tutorials (user_id, tutorial_id, current_step, completed_steps, completed, completed_at) VALUES ('b6f64d05-40a9-4974-bbe5-f3c4d519bf55', '', 0, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_tutorials (user_id, tutorial_id, current_step, completed_steps, completed, completed_at) VALUES ('197209b2-4012-4c69-a037-6c33651bc317', '', 0, NULL, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO user_tutorials (user_id, tutorial_id, current_step, completed_steps, completed, completed_at) VALUES ('002ecce2-2021-4b30-bc4a-6eaacfbe8fb8', '', 0, NULL, false, NULL) ON CONFLICT DO NOTHING;

-- vendor_payments
INSERT INTO vendor_payments (enrollment_id, vendor_name, amount, status, payment_method, invoice_id, paid_at) VALUES ('933dfb8c-042d-4a19-8396-2e90a494a7af', '', 4372.34, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO vendor_payments (enrollment_id, vendor_name, amount, status, payment_method, invoice_id, paid_at) VALUES ('b9d87a68-a978-4d54-b7ba-4f6cdc719b3c', '', 1343.37, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO vendor_payments (enrollment_id, vendor_name, amount, status, payment_method, invoice_id, paid_at) VALUES ('3d6ad578-2c2e-4ada-9d12-2809549fb75e', '', 3635.78, 'active', NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- verify_audit
INSERT INTO verify_audit (id, ip_hash, credential_id, result) VALUES (0, '', '', '') ON CONFLICT DO NOTHING;
INSERT INTO verify_audit (id, ip_hash, credential_id, result) VALUES (0, '', '', '') ON CONFLICT DO NOTHING;
INSERT INTO verify_audit (id, ip_hash, credential_id, result) VALUES (0, '', '', '') ON CONFLICT DO NOTHING;

-- video_chapters
INSERT INTO video_chapters (video_id, title, start_time, end_time) VALUES ('c575c015-1511-4202-a89c-5e7947b450d6', 'Sample Video Chapters 1', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO video_chapters (video_id, title, start_time, end_time) VALUES ('a39de2b2-9883-4a4e-a21d-636b6248646a', 'Sample Video Chapters 2', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO video_chapters (video_id, title, start_time, end_time) VALUES ('9e4157c8-635c-4bb8-aa3f-4744375c3c13', 'Sample Video Chapters 3', 0, 0) ON CONFLICT DO NOTHING;

-- video_engagement
INSERT INTO video_engagement (data, video_src, user_id, event_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO video_engagement (data, video_src, user_id, event_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO video_engagement (data, video_src, user_id, event_type) VALUES ('{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- video_progress
INSERT INTO video_progress (user_id, lesson_id, progress_seconds, total_seconds) VALUES ('9c073be4-35b2-4792-9edb-5d9e2843f1d4', 'c73224b4-bfe9-4de7-909c-4f2536134e5d', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO video_progress (user_id, lesson_id, progress_seconds, total_seconds) VALUES ('30476683-7219-4b33-b6d6-5bf1d59a25cc', '81e28905-1bfa-45b2-8abb-1b3a3c7182ed', 0, 0) ON CONFLICT DO NOTHING;
INSERT INTO video_progress (user_id, lesson_id, progress_seconds, total_seconds) VALUES ('c2625726-f0d0-4153-89a0-d8ee101b0a7f', 'bb3575d7-0fa2-4e2d-a1c7-f44be009e223', 0, 0) ON CONFLICT DO NOTHING;

-- video_transcripts
INSERT INTO video_transcripts (lesson_id, language, transcript_text, vtt_url, srt_url) VALUES ('4bc5a50e-ca7d-4bf4-b339-00f207573644', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO video_transcripts (lesson_id, language, transcript_text, vtt_url, srt_url) VALUES ('358a2e66-8571-4ea5-aaaf-4c16274fb881', '', '', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO video_transcripts (lesson_id, language, transcript_text, vtt_url, srt_url) VALUES ('e3750cc0-af19-4b8a-82b0-81ceb4112fe1', '', '', NULL, NULL) ON CONFLICT DO NOTHING;

-- voicemails
INSERT INTO voicemails (user_id, phone_number, recording_url, duration_seconds, transcription, is_read) VALUES (NULL, '', '', 0, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO voicemails (user_id, phone_number, recording_url, duration_seconds, transcription, is_read) VALUES (NULL, '', '', 0, NULL, false) ON CONFLICT DO NOTHING;
INSERT INTO voicemails (user_id, phone_number, recording_url, duration_seconds, transcription, is_read) VALUES (NULL, '', '', 0, NULL, false) ON CONFLICT DO NOTHING;

-- webhook_deliveries
INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, response_body, error, delivered_at) VALUES ('53d55d80-f999-48dc-81ab-4d7725e3f1ac', '', '{}'::jsonb, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, response_body, error, delivered_at) VALUES ('5b88aab6-5172-415d-b4a2-467caf1f84f7', '', '{}'::jsonb, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, response_body, error, delivered_at) VALUES ('44bd234d-47b0-4b21-a4e6-331ac9c5d9ab', '', '{}'::jsonb, 0, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- webhooks
INSERT INTO webhooks (url, events, secret, enabled, description, headers, retry_count, last_triggered_at, created_by) VALUES ('https://www.elevateforhumanity.org', '', '', true, 'Seed data for webhooks', '{}'::jsonb, 0, NULL, 'e1dc2b3c-44a0-4465-96b5-0027ea0941ca') ON CONFLICT DO NOTHING;
INSERT INTO webhooks (url, events, secret, enabled, description, headers, retry_count, last_triggered_at, created_by) VALUES ('https://www.elevateforhumanity.org', '', '', true, 'Seed data for webhooks', '{}'::jsonb, 0, NULL, '932a9159-e860-4e81-af8e-a969b23d81db') ON CONFLICT DO NOTHING;
INSERT INTO webhooks (url, events, secret, enabled, description, headers, retry_count, last_triggered_at, created_by) VALUES ('https://www.elevateforhumanity.org', '', '', true, 'Seed data for webhooks', '{}'::jsonb, 0, NULL, 'bda3aebd-6fbb-4fe9-93fe-ba920fd15229') ON CONFLICT DO NOTHING;

-- welcome_packets
INSERT INTO welcome_packets (student_record_id, pdf_url, status, acknowledged_at) VALUES ('8d9aaa88-9774-4a95-8083-4db0c354dbe4', NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO welcome_packets (student_record_id, pdf_url, status, acknowledged_at) VALUES ('988a458f-e4f5-4316-90a6-03ee2663f1c5', NULL, 'active', NULL) ON CONFLICT DO NOTHING;
INSERT INTO welcome_packets (student_record_id, pdf_url, status, acknowledged_at) VALUES ('dcf46c87-327c-4e2d-93e4-c9998217a60f', NULL, 'active', NULL) ON CONFLICT DO NOTHING;

-- wioa_compliance_reports
INSERT INTO wioa_compliance_reports (report_type, quarter, fiscal_year, status, data, submitted_at, submitted_by) VALUES ('', '', 0, 'active', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wioa_compliance_reports (report_type, quarter, fiscal_year, status, data, submitted_at, submitted_by) VALUES ('', '', 0, 'active', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wioa_compliance_reports (report_type, quarter, fiscal_year, status, data, submitted_at, submitted_by) VALUES ('', '', 0, 'active', '{}'::jsonb, NULL, NULL) ON CONFLICT DO NOTHING;

-- wioa_participant_records
INSERT INTO wioa_participant_records (participant_id, tenant_id, program_id, reporting_period_start, reporting_period_end, ssn_last4, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, employment_status_at_entry, education_level_at_entry, program_entry_date, program_exit_date, employed_q2_after_exit, employed_q4_after_exit, median_earnings_q2, credential_attained, measurable_skill_gain) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, NULL, CURRENT_DATE, CURRENT_DATE, false, false, 0, false, false) ON CONFLICT DO NOTHING;
INSERT INTO wioa_participant_records (participant_id, tenant_id, program_id, reporting_period_start, reporting_period_end, ssn_last4, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, employment_status_at_entry, education_level_at_entry, program_entry_date, program_exit_date, employed_q2_after_exit, employed_q4_after_exit, median_earnings_q2, credential_attained, measurable_skill_gain) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, NULL, CURRENT_DATE, CURRENT_DATE, false, false, 0, false, false) ON CONFLICT DO NOTHING;
INSERT INTO wioa_participant_records (participant_id, tenant_id, program_id, reporting_period_start, reporting_period_end, ssn_last4, date_of_birth, gender, race_ethnicity, veteran_status, disability_status, employment_status_at_entry, education_level_at_entry, program_entry_date, program_exit_date, employed_q2_after_exit, employed_q4_after_exit, median_earnings_q2, credential_attained, measurable_skill_gain) VALUES (NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE, NULL, CURRENT_DATE, NULL, NULL, false, false, NULL, NULL, CURRENT_DATE, CURRENT_DATE, false, false, 0, false, false) ON CONFLICT DO NOTHING;

-- wioa_participants
INSERT INTO wioa_participants (user_id, date_of_birth, gender, ethnicity, race, us_citizen, work_authorized, work_authorization_type, work_authorization_expiry, selective_service_registered, selective_service_exempt, selective_service_exempt_reason, is_veteran, veteran_type, veteran_dd214_url, is_military_spouse, is_low_income, household_size, annual_income, income_verification_url, income_verification_date, income_verification_method, receives_tanf, receives_snap, receives_ssi, receives_ssdi, receives_general_assistance, is_dislocated_worker, layoff_date, layoff_reason, warn_notice_received, ui_exhausted, self_employed_now_unemployed, displaced_homemaker, military_spouse_displaced, is_youth, youth_in_school, youth_out_of_school, is_displaced_homemaker, is_homeless, homeless_type, is_runaway_youth, is_foster_care_youth, foster_care_age_out, is_pregnant_parenting, number_of_children, is_ex_offender, offender_type, has_disability, disability_types, disability_documentation_url, requires_accommodation, accommodation_needs, highest_education_level, school_status, employment_status_at_entry, employed_at_entry, is_basic_skills_deficient, basic_skills_assessment_date, basic_skills_assessment_type, basic_skills_reading_level, basic_skills_math_level, is_english_language_learner, primary_language, is_long_term_unemployed, unemployment_duration_weeks, is_migrant_farmworker, is_seasonal_farmworker, is_single_parent, has_cultural_barriers, cultural_barrier_description, eligibility_status, eligibility_determined_by, eligibility_determined_date, eligibility_notes, wioa_program, funding_source) VALUES (NULL, CURRENT_DATE, NULL, NULL, NULL, false, false, NULL, CURRENT_DATE, false, false, NULL, false, NULL, NULL, false, false, 0, 0, NULL, CURRENT_DATE, NULL, false, false, false, false, false, false, CURRENT_DATE, NULL, false, false, false, false, false, false, false, false, false, false, NULL, false, false, false, false, 0, false, NULL, false, NULL, NULL, false, NULL, NULL, NULL, NULL, false, false, CURRENT_DATE, NULL, NULL, NULL, false, NULL, false, 0, false, false, false, false, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wioa_participants (user_id, date_of_birth, gender, ethnicity, race, us_citizen, work_authorized, work_authorization_type, work_authorization_expiry, selective_service_registered, selective_service_exempt, selective_service_exempt_reason, is_veteran, veteran_type, veteran_dd214_url, is_military_spouse, is_low_income, household_size, annual_income, income_verification_url, income_verification_date, income_verification_method, receives_tanf, receives_snap, receives_ssi, receives_ssdi, receives_general_assistance, is_dislocated_worker, layoff_date, layoff_reason, warn_notice_received, ui_exhausted, self_employed_now_unemployed, displaced_homemaker, military_spouse_displaced, is_youth, youth_in_school, youth_out_of_school, is_displaced_homemaker, is_homeless, homeless_type, is_runaway_youth, is_foster_care_youth, foster_care_age_out, is_pregnant_parenting, number_of_children, is_ex_offender, offender_type, has_disability, disability_types, disability_documentation_url, requires_accommodation, accommodation_needs, highest_education_level, school_status, employment_status_at_entry, employed_at_entry, is_basic_skills_deficient, basic_skills_assessment_date, basic_skills_assessment_type, basic_skills_reading_level, basic_skills_math_level, is_english_language_learner, primary_language, is_long_term_unemployed, unemployment_duration_weeks, is_migrant_farmworker, is_seasonal_farmworker, is_single_parent, has_cultural_barriers, cultural_barrier_description, eligibility_status, eligibility_determined_by, eligibility_determined_date, eligibility_notes, wioa_program, funding_source) VALUES (NULL, CURRENT_DATE, NULL, NULL, NULL, false, false, NULL, CURRENT_DATE, false, false, NULL, false, NULL, NULL, false, false, 0, 0, NULL, CURRENT_DATE, NULL, false, false, false, false, false, false, CURRENT_DATE, NULL, false, false, false, false, false, false, false, false, false, false, NULL, false, false, false, false, 0, false, NULL, false, NULL, NULL, false, NULL, NULL, NULL, NULL, false, false, CURRENT_DATE, NULL, NULL, NULL, false, NULL, false, 0, false, false, false, false, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wioa_participants (user_id, date_of_birth, gender, ethnicity, race, us_citizen, work_authorized, work_authorization_type, work_authorization_expiry, selective_service_registered, selective_service_exempt, selective_service_exempt_reason, is_veteran, veteran_type, veteran_dd214_url, is_military_spouse, is_low_income, household_size, annual_income, income_verification_url, income_verification_date, income_verification_method, receives_tanf, receives_snap, receives_ssi, receives_ssdi, receives_general_assistance, is_dislocated_worker, layoff_date, layoff_reason, warn_notice_received, ui_exhausted, self_employed_now_unemployed, displaced_homemaker, military_spouse_displaced, is_youth, youth_in_school, youth_out_of_school, is_displaced_homemaker, is_homeless, homeless_type, is_runaway_youth, is_foster_care_youth, foster_care_age_out, is_pregnant_parenting, number_of_children, is_ex_offender, offender_type, has_disability, disability_types, disability_documentation_url, requires_accommodation, accommodation_needs, highest_education_level, school_status, employment_status_at_entry, employed_at_entry, is_basic_skills_deficient, basic_skills_assessment_date, basic_skills_assessment_type, basic_skills_reading_level, basic_skills_math_level, is_english_language_learner, primary_language, is_long_term_unemployed, unemployment_duration_weeks, is_migrant_farmworker, is_seasonal_farmworker, is_single_parent, has_cultural_barriers, cultural_barrier_description, eligibility_status, eligibility_determined_by, eligibility_determined_date, eligibility_notes, wioa_program, funding_source) VALUES (NULL, CURRENT_DATE, NULL, NULL, NULL, false, false, NULL, CURRENT_DATE, false, false, NULL, false, NULL, NULL, false, false, 0, 0, NULL, CURRENT_DATE, NULL, false, false, false, false, false, false, CURRENT_DATE, NULL, false, false, false, false, false, false, false, false, false, false, NULL, false, false, false, false, 0, false, NULL, false, NULL, NULL, false, NULL, NULL, NULL, NULL, false, false, CURRENT_DATE, NULL, NULL, NULL, false, NULL, false, 0, false, false, false, false, NULL, NULL, NULL, CURRENT_DATE, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- workone_checklist
INSERT INTO workone_checklist (organization_id, user_id, step_key, step_label, status, notes, due_date, completed_at) VALUES (NULL, NULL, '', '', 'active', 'Seed note for workone_checklist', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO workone_checklist (organization_id, user_id, step_key, step_label, status, notes, due_date, completed_at) VALUES (NULL, NULL, '', '', 'active', 'Seed note for workone_checklist', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;
INSERT INTO workone_checklist (organization_id, user_id, step_key, step_label, status, notes, due_date, completed_at) VALUES (NULL, NULL, '', '', 'active', 'Seed note for workone_checklist', CURRENT_DATE, NULL) ON CONFLICT DO NOTHING;

-- wotc_applications
INSERT INTO wotc_applications (employee_first_name, employee_last_name, employee_ssn_hash, employee_dob, employer_name, employer_ein, employer_contact_phone, job_offer_date, start_date, starting_wage, position, target_groups, status, certification_received, tax_credit_amount, documents, submitted_at, reviewed_at, created_by) VALUES ('', '', NULL, CURRENT_DATE, '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, 'active', false, 0, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wotc_applications (employee_first_name, employee_last_name, employee_ssn_hash, employee_dob, employer_name, employer_ein, employer_contact_phone, job_offer_date, start_date, starting_wage, position, target_groups, status, certification_received, tax_credit_amount, documents, submitted_at, reviewed_at, created_by) VALUES ('', '', NULL, CURRENT_DATE, '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, 'active', false, 0, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO wotc_applications (employee_first_name, employee_last_name, employee_ssn_hash, employee_dob, employer_name, employer_ein, employer_contact_phone, job_offer_date, start_date, starting_wage, position, target_groups, status, certification_received, tax_credit_amount, documents, submitted_at, reviewed_at, created_by) VALUES ('', '', NULL, CURRENT_DATE, '', NULL, NULL, CURRENT_DATE, CURRENT_DATE, 0, NULL, NULL, 'active', false, 0, '{}'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- wotc_tracking
INSERT INTO wotc_tracking (employer_id, apprentice_id, hire_date, submitted, eligible, deadline) VALUES (NULL, NULL, CURRENT_DATE, false, false, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO wotc_tracking (employer_id, apprentice_id, hire_date, submitted, eligible, deadline) VALUES (NULL, NULL, CURRENT_DATE, false, false, CURRENT_DATE) ON CONFLICT DO NOTHING;
INSERT INTO wotc_tracking (employer_id, apprentice_id, hire_date, submitted, eligible, deadline) VALUES (NULL, NULL, CURRENT_DATE, false, false, CURRENT_DATE) ON CONFLICT DO NOTHING;

-- xapi_statements
INSERT INTO xapi_statements (actor, verb, object, result, context, timestamp, authority, version) VALUES ('{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO xapi_statements (actor, verb, object, result, context, timestamp, authority, version) VALUES ('{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO xapi_statements (actor, verb, object, result, context, timestamp, authority, version) VALUES ('{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '', '{}'::jsonb, NULL) ON CONFLICT DO NOTHING;
