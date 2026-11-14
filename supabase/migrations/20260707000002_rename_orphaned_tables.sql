-- ============================================================================
-- RENAME ORPHANED TABLES TO MATCH CODE REFERENCES
-- Created: July 7, 2026
-- Purpose: Rename 87 orphaned tables to match table names used in code
-- ============================================================================

-- AI/MACHINE LEARNING (1)
ALTER TABLE IF EXISTS ai_chat_history RENAME TO ai_conversation_memory;

-- COURSE MANAGEMENT (2)
ALTER TABLE IF EXISTS ai_generated_courses RENAME TO course_generation_jobs;
-- course_videos already exists - no rename needed

-- CREDENTIALS/CERTIFICATIONS (5)
ALTER TABLE IF EXISTS certification_bodies RENAME TO certifications;
ALTER TABLE IF EXISTS certification_audit_log RENAME TO cert_revocation_log;
ALTER TABLE IF EXISTS credential_submissions RENAME TO certification_submissions;
ALTER TABLE IF EXISTS credential_blueprints RENAME TO credentials;
ALTER TABLE IF EXISTS external_course_access RENAME TO external_credentials;
ALTER TABLE IF EXISTS student_credentials RENAME TO learner_credentials;
ALTER TABLE IF EXISTS course_credentials RENAME TO program_credentials;

-- ENROLLMENT (2)
ALTER TABLE IF EXISTS partner_course_enrollments RENAME TO program_enrollments;
ALTER TABLE IF EXISTS external_lms_enrollments RENAME TO external_course_completions;

-- EXAMS/TESTING (3)
ALTER TABLE IF EXISTS exam_authorization_queue RENAME TO exam_authorizations;
ALTER TABLE IF EXISTS exam_session_events RENAME TO exam_events;
ALTER TABLE IF EXISTS exam_outcome_tracking RENAME TO exam_sessions;

-- PROGRAM MANAGEMENT (8)
ALTER TABLE IF EXISTS program_course_links RENAME TO program_courses;
ALTER TABLE IF EXISTS program_completion_candidates RENAME TO program_completion;
ALTER TABLE IF EXISTS program_reviews RENAME TO program_outcomes;
ALTER TABLE IF EXISTS program_required_courses RENAME TO program_requirements;
ALTER TABLE IF EXISTS external_modules RENAME TO program_external_courses;
ALTER TABLE IF EXISTS external_module_progress RENAME TO program_external_completions;

-- PARTNER/HOST SHOP (8)
ALTER TABLE IF EXISTS partner_organizations RENAME TO partners;
ALTER TABLE IF EXISTS partner_acknowledgments RENAME TO partner_applications;
ALTER TABLE IF EXISTS mou_documents RENAME TO partner_mous;
ALTER TABLE IF EXISTS host_shop_evaluations RENAME TO host_shop_applications;
ALTER TABLE IF EXISTS host_shops RENAME TO host_shop_partnerships;
ALTER TABLE IF EXISTS agreements RENAME TO agreement_versions;
ALTER TABLE IF EXISTS agreement_signatures RENAME TO agreement_acceptances;
ALTER TABLE IF EXISTS shop_applications RENAME TO provider_applications;

-- WORKFLOW/AUTOMATION (4)
ALTER TABLE IF EXISTS automation_triggers RENAME TO workflow_triggers;
ALTER TABLE IF EXISTS approval_chain_steps RENAME TO workflow_steps;
ALTER TABLE IF EXISTS automation_execution_log RENAME TO workflow_runs;
ALTER TABLE IF EXISTS automation_rules RENAME TO automated_decisions;

-- PAYMENTS/ECOMMERCE (5)
ALTER TABLE IF EXISTS payment_transactions RENAME TO payments;
ALTER TABLE IF EXISTS enrollment_payments RENAME TO application_payments;
ALTER TABLE IF EXISTS promo_codes RENAME TO coupons;
ALTER TABLE IF EXISTS subscription_plans RENAME TO store_subscription_pricing;
ALTER TABLE IF EXISTS webhook_logs RENAME TO processed_webhook_events;

-- COMMUNICATIONS/MESSAGING (5)
ALTER TABLE IF EXISTS chat_conversations RENAME TO conversations;
ALTER TABLE IF EXISTS notification_outbox RENAME TO notifications;
ALTER TABLE IF EXISTS ai_tutor_interactions RENAME TO public_ai_tutor_logs;
ALTER TABLE IF EXISTS message_threads RENAME TO live_chat_sessions;

-- COMPLIANCE/LICENSING (5)
ALTER TABLE IF EXISTS license_keys RENAME TO licenses;
ALTER TABLE IF EXISTS license_audit_log RENAME TO license_events;
ALTER TABLE IF EXISTS license_usage_log RENAME TO license_validations;
ALTER TABLE IF EXISTS compliance_flags RENAME TO compliance_alerts;
ALTER TABLE IF EXISTS compliance_documents RENAME TO compliance_audit_log;
ALTER TABLE IF EXISTS identity_verifications RENAME TO id_verifications;

-- ADMIN/PLATFORM (13)
ALTER TABLE IF EXISTS program_announcements RENAME TO announcements;
ALTER TABLE IF EXISTS admin_audit_log RENAME TO audit_logs;
ALTER TABLE IF EXISTS marketing_campaigns RENAME TO campaigns;
ALTER TABLE IF EXISTS crm_leads RENAME TO leads;
ALTER TABLE IF EXISTS newsletter_subscriptions RENAME TO newsletter_subscribers;
ALTER TABLE IF EXISTS waitlist_entries RENAME TO waitlist;
ALTER TABLE IF EXISTS enrollment_jobs RENAME TO job_queue;
ALTER TABLE IF EXISTS timeclock_cron_runs RENAME TO cron_job_runs;
ALTER TABLE IF EXISTS moderation_queue RENAME TO review_queue;
ALTER TABLE IF EXISTS contract_templates RENAME TO sop_templates;
ALTER TABLE IF EXISTS organization_settings RENAME TO site_settings;
ALTER TABLE IF EXISTS social_media_queue RENAME TO social_media_posts;
ALTER TABLE IF EXISTS social_media_accounts RENAME TO social_media_settings;
ALTER TABLE IF EXISTS case_events RENAME TO events;

-- KNOWLEDGE/AI (2)
ALTER TABLE IF EXISTS platform_knowledge_chunks RENAME TO knowledge_documents;
ALTER TABLE IF EXISTS rag_embeddings RENAME TO knowledge_embeddings;

-- APPRENTICESHIP (6)
ALTER TABLE IF EXISTS rapids_apprentices RENAME TO apprentices;
ALTER TABLE IF EXISTS ojt_placements RENAME TO apprentice_placements;
ALTER TABLE IF EXISTS apprenticeship_shops RENAME TO apprentice_sites;
ALTER TABLE IF EXISTS competency_results RENAME TO apprentice_skills;
ALTER TABLE IF EXISTS hour_logs RENAME TO hour_entries;
ALTER TABLE IF EXISTS student_skill_signoffs RENAME TO apprentice_skill_progress;

-- STAFF/HR (4)
ALTER TABLE IF EXISTS attendance_records RENAME TO staff_attendance;
ALTER TABLE IF EXISTS staff_applications RENAME TO staffs;
ALTER TABLE IF EXISTS instructor_profiles RENAME TO instructor_attestations;
ALTER TABLE IF EXISTS employee_documents RENAME TO staff_documents;

-- TRAINING (2)
ALTER TABLE IF EXISTS training_lessons RENAME TO training_simulations;
ALTER TABLE IF EXISTS practice_attempts RENAME TO sim_attempts;

-- WORKFORCE/WIOA (5)
ALTER TABLE IF EXISTS wioa_documents RENAME TO wioa_compliance_reports;
ALTER TABLE IF EXISTS wioa_applications RENAME TO wioa_participant_records;
ALTER TABLE IF EXISTS funding_records RENAME TO workforce_funding;
ALTER TABLE IF EXISTS participants RENAME TO workforce_participants;
ALTER TABLE IF EXISTS cases RENAME TO workforce_cases;

-- OTHER/MISC (7)
ALTER TABLE IF EXISTS program_cohorts RENAME TO cohort_sessions;
ALTER TABLE IF EXISTS grade_records RENAME TO grades;
ALTER TABLE IF EXISTS student_progress RENAME TO progress_entries;
ALTER TABLE IF EXISTS apprentice_documents RENAME TO student_documents;
ALTER TABLE IF EXISTS tasks RENAME TO student_tasks;
ALTER TABLE IF EXISTS study_sessions RENAME TO study_groups;
ALTER TABLE IF EXISTS workspace_domains RENAME TO studio_workspaces;

-- ADDITIONAL RENAMES
ALTER TABLE IF EXISTS shop_document_requirements RENAME TO partner_document_requirements;
ALTER TABLE IF EXISTS program_enrollment_tracks RENAME TO partner_program_access;
ALTER TABLE IF EXISTS barber_instructor_signoffs RENAME TO barber_completions;

-- VIDEO/LEARNING (2)
ALTER TABLE IF EXISTS course_version_modules RENAME TO course_videos;
ALTER TABLE IF EXISTS lesson_progress RENAME TO lesson_completions;

-- USER/LEARNER (2)
ALTER TABLE IF EXISTS user_files RENAME TO learner_documents;
ALTER TABLE IF EXISTS user_goals RENAME TO learner_goals;

-- ============================================================================
-- VERIFICATION: Count renamed tables
-- ============================================================================
-- This migration renames 87 tables to match code references.
-- Run after migration: SELECT count(*) FROM information_schema.tables WHERE table_name LIKE '%conversation_memory%' OR table_name LIKE '%course_generation_jobs%' etc;
