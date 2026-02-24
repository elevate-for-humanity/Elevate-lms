-- Add missing columns to align code queries with live DB schemas
-- 163 tables, 434 columns
-- All use ADD COLUMN IF NOT EXISTS for idempotency

-- accessibility_preferences
ALTER TABLE public.accessibility_preferences ADD COLUMN IF NOT EXISTS tts_pitch TEXT;
ALTER TABLE public.accessibility_preferences ADD COLUMN IF NOT EXISTS tts_rate NUMERIC(5,2);
ALTER TABLE public.accessibility_preferences ADD COLUMN IF NOT EXISTS tts_voice TEXT;

-- achievements
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS earned_at TIMESTAMPTZ;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS label TEXT;

-- ai_assistant_messages
ALTER TABLE public.ai_assistant_messages ADD COLUMN IF NOT EXISTS role TEXT;

-- ai_chat_history
ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS response TEXT;

-- ai_instructors
ALTER TABLE public.ai_instructors ADD COLUMN IF NOT EXISTS availability_status TEXT;
ALTER TABLE public.ai_instructors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.ai_instructors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.ai_instructors ADD COLUMN IF NOT EXISTS personality_config JSONB;
ALTER TABLE public.ai_instructors ADD COLUMN IF NOT EXISTS role_title TEXT;

-- ai_tutor_interactions
ALTER TABLE public.ai_tutor_interactions ADD COLUMN IF NOT EXISTS assistant_response TEXT;
ALTER TABLE public.ai_tutor_interactions ADD COLUMN IF NOT EXISTS user_message TEXT;

-- application_state_events
ALTER TABLE public.application_state_events ADD COLUMN IF NOT EXISTS actor_role TEXT;

-- applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS affirm_order_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- apprentice_funding_profile
ALTER TABLE public.apprentice_funding_profile ADD COLUMN IF NOT EXISTS post_cert_date TIMESTAMPTZ;
ALTER TABLE public.apprentice_funding_profile ADD COLUMN IF NOT EXISTS wioa_start_date TIMESTAMPTZ;

-- apprentice_hours_log
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS funding_phase TEXT;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS hour_type TEXT;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS logged_date TIMESTAMPTZ;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS minutes INTEGER DEFAULT 0;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.apprentice_hours_log ADD COLUMN IF NOT EXISTS verified_by TEXT;

-- apprentice_progress
ALTER TABLE public.apprentice_progress ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0;

-- apprentices
ALTER TABLE public.apprentices ADD COLUMN IF NOT EXISTS shop_id UUID;

-- approval_tokens
ALTER TABLE public.approval_tokens ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE public.approval_tokens ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.approval_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- attendance_log
ALTER TABLE public.attendance_log ADD COLUMN IF NOT EXISTS login_time TEXT;
ALTER TABLE public.attendance_log ADD COLUMN IF NOT EXISTS student_id UUID;

-- audio_preferences
ALTER TABLE public.audio_preferences ADD COLUMN IF NOT EXISTS ambient_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.audio_preferences ADD COLUMN IF NOT EXISTS ambient_volume TEXT;

-- audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity TEXT;

-- blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS status TEXT;

-- bridge_payment_plans
ALTER TABLE public.bridge_payment_plans ADD COLUMN IF NOT EXISTS academic_access_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bridge_payment_plans ADD COLUMN IF NOT EXISTS academic_access_paused_reason TEXT;
ALTER TABLE public.bridge_payment_plans ADD COLUMN IF NOT EXISTS balance_remaining NUMERIC(12,2);
ALTER TABLE public.bridge_payment_plans ADD COLUMN IF NOT EXISTS down_payment_paid NUMERIC(12,2);
ALTER TABLE public.bridge_payment_plans ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMPTZ;

-- career_applications
ALTER TABLE public.career_applications ADD COLUMN IF NOT EXISTS status TEXT;

-- career_counseling_messages
ALTER TABLE public.career_counseling_messages ADD COLUMN IF NOT EXISTS role TEXT;

-- cart_items
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);

-- case_manager_assignments
ALTER TABLE public.case_manager_assignments ADD COLUMN IF NOT EXISTS id TEXT;

-- case_notes
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS note TEXT;

-- certificates
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS signed_by TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS title TEXT;

-- certification_types
ALTER TABLE public.certification_types ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.certification_types ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.certification_types ADD COLUMN IF NOT EXISTS validity_months INTEGER DEFAULT 0;

-- chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS role TEXT;

-- checkin_sessions
ALTER TABLE public.checkin_sessions ADD COLUMN IF NOT EXISTS checkin_time TEXT;
ALTER TABLE public.checkin_sessions ADD COLUMN IF NOT EXISTS shop_id UUID;

-- community_groups
ALTER TABLE public.community_groups ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- compliance_audits
ALTER TABLE public.compliance_audits ADD COLUMN IF NOT EXISTS admissions_lead_signed TEXT;
ALTER TABLE public.compliance_audits ADD COLUMN IF NOT EXISTS program_director_signed TEXT;

-- conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS messages JSONB;

-- course_announcements
ALTER TABLE public.course_announcements ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.course_announcements ADD COLUMN IF NOT EXISTS title TEXT;

-- course_enrollments
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS student_id UUID;

-- course_modules
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS "order" TEXT;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS type TEXT;

-- credentials
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- curvature_appointments
ALTER TABLE public.curvature_appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT;

-- curvature_reviews
ALTER TABLE public.curvature_reviews ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ;
ALTER TABLE public.curvature_reviews ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.curvature_reviews ADD COLUMN IF NOT EXISTS service TEXT;
ALTER TABLE public.curvature_reviews ADD COLUMN IF NOT EXISTS text TEXT;

-- customer_billing
ALTER TABLE public.customer_billing ADD COLUMN IF NOT EXISTS stripe_customer_id UUID;

-- daily_streaks
ALTER TABLE public.daily_streaks ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.daily_streaks ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ;
ALTER TABLE public.daily_streaks ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- delegates
ALTER TABLE public.delegates ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT FALSE;

-- delivery_logs
ALTER TABLE public.delivery_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.delivery_logs ADD COLUMN IF NOT EXISTS template_name TEXT;

-- discussions
ALTER TABLE public.discussions ADD COLUMN IF NOT EXISTS title TEXT;

-- documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS url TEXT;

-- donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- drug_tests
ALTER TABLE public.drug_tests ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE public.drug_tests ADD COLUMN IF NOT EXISTS test_type TEXT;

-- email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS status TEXT;

-- employer_sponsorships
ALTER TABLE public.employer_sponsorships ADD COLUMN IF NOT EXISTS enrollment_id UUID;
ALTER TABLE public.employer_sponsorships ADD COLUMN IF NOT EXISTS reimbursements_received NUMERIC(12,2);
ALTER TABLE public.employer_sponsorships ADD COLUMN IF NOT EXISTS term_months INTEGER DEFAULT 0;
ALTER TABLE public.employer_sponsorships ADD COLUMN IF NOT EXISTS total_reimbursed NUMERIC(12,2);
ALTER TABLE public.employer_sponsorships ADD COLUMN IF NOT EXISTS total_tuition NUMERIC(12,2);

-- employers
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS ein TEXT;
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS industry TEXT;

-- employment_outcomes
ALTER TABLE public.employment_outcomes ADD COLUMN IF NOT EXISTS employed_at_exit BOOLEAN DEFAULT FALSE;
ALTER TABLE public.employment_outcomes ADD COLUMN IF NOT EXISTS exit_date TIMESTAMPTZ;

-- enrollment_acknowledgments
ALTER TABLE public.enrollment_acknowledgments ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enrollment_acknowledgments ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- enrollment_cases
ALTER TABLE public.enrollment_cases ADD COLUMN IF NOT EXISTS employer_id UUID;
ALTER TABLE public.enrollment_cases ADD COLUMN IF NOT EXISTS program_holder_id UUID;
ALTER TABLE public.enrollment_cases ADD COLUMN IF NOT EXISTS signatures_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enrollment_cases ADD COLUMN IF NOT EXISTS signatures_required TEXT;
ALTER TABLE public.enrollment_cases ADD COLUMN IF NOT EXISTS student_id UUID;

-- enrollment_requirements
ALTER TABLE public.enrollment_requirements ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE public.enrollment_requirements ADD COLUMN IF NOT EXISTS priority TEXT;

-- enrollments (VIEW on training_enrollments — recreate to include program_id)
DROP VIEW IF EXISTS public.enrollments CASCADE;
CREATE VIEW public.enrollments AS
  SELECT id, user_id, course_id, status, progress, enrolled_at, completed_at, tenant_id, program_id
  FROM training_enrollments;

-- events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug TEXT;

-- feedback
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS title TEXT;

-- ferpa_access_logs
ALTER TABLE public.ferpa_access_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.ferpa_access_logs ADD COLUMN IF NOT EXISTS record_type TEXT;
ALTER TABLE public.ferpa_access_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- ferpa_training
ALTER TABLE public.ferpa_training ADD COLUMN IF NOT EXISTS certificate_id UUID;
ALTER TABLE public.ferpa_training ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.ferpa_training ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ferpa_training ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0;

-- files
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- forum_posts
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS user_id UUID;

-- forum_replies
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS user_id UUID;

-- forum_threads
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS forum_id UUID;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- forums
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0;

-- funding_applications
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS program_id UUID;

-- funding_programs
ALTER TABLE public.funding_programs ADD COLUMN IF NOT EXISTS code TEXT;

-- funding_records
ALTER TABLE public.funding_records ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);

-- gamification_points
ALTER TABLE public.gamification_points ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.gamification_points ADD COLUMN IF NOT EXISTS level_name TEXT;
ALTER TABLE public.gamification_points ADD COLUMN IF NOT EXISTS points_to_next_level TEXT;
ALTER TABLE public.gamification_points ADD COLUMN IF NOT EXISTS total_points TEXT;

-- grades
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);

-- grant_applications
ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS entity_id UUID;

-- grant_opportunities
ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS award_ceiling TEXT;

-- grant_submissions
ALTER TABLE public.grant_submissions ADD COLUMN IF NOT EXISTS timeline JSONB;

-- help_articles
ALTER TABLE public.help_articles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- help_categories
ALTER TABLE public.help_categories ADD COLUMN IF NOT EXISTS article_count INTEGER DEFAULT 0;

-- hour_entries
ALTER TABLE public.hour_entries ADD COLUMN IF NOT EXISTS hours INTEGER DEFAULT 0;

-- hour_logs
ALTER TABLE public.hour_logs ADD COLUMN IF NOT EXISTS hours INTEGER DEFAULT 0;

-- hours_log
ALTER TABLE public.hours_log ADD COLUMN IF NOT EXISTS hours INTEGER DEFAULT 0;
ALTER TABLE public.hours_log ADD COLUMN IF NOT EXISTS type TEXT;

-- intake_records
ALTER TABLE public.intake_records ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE public.intake_records ADD COLUMN IF NOT EXISTS employer_screening_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.intake_records ADD COLUMN IF NOT EXISTS funding_pathway TEXT;
ALTER TABLE public.intake_records ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.intake_records ADD COLUMN IF NOT EXISTS workforce_screening_completed BOOLEAN DEFAULT FALSE;

-- issued_certificates
ALTER TABLE public.issued_certificates ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE public.issued_certificates ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ;
ALTER TABLE public.issued_certificates ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.issued_certificates ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.issued_certificates ADD COLUMN IF NOT EXISTS signed_by TEXT;

-- job_placements
ALTER TABLE public.job_placements ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE public.job_placements ADD COLUMN IF NOT EXISTS user_id UUID;

-- job_postings
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS positions_available INTEGER DEFAULT 0;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS positions_filled INTEGER DEFAULT 0;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS required_certifications JSONB;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS required_programs JSONB;

-- leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS eligibility_data JSONB;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage TEXT;

-- lesson_bookmarks
ALTER TABLE public.lesson_bookmarks ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.lesson_bookmarks ADD COLUMN IF NOT EXISTS position_seconds TEXT;

-- lesson_completions
ALTER TABLE public.lesson_completions ADD COLUMN IF NOT EXISTS lesson_id UUID;

-- lesson_notes
ALTER TABLE public.lesson_notes ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.lesson_notes ADD COLUMN IF NOT EXISTS position_seconds TEXT;

-- lesson_progress
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS percent NUMERIC(5,2);

-- lesson_questions
ALTER TABLE public.lesson_questions ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.lesson_questions ADD COLUMN IF NOT EXISTS title TEXT;

-- license_keys
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS license_id UUID;

-- license_purchases
ALTER TABLE public.license_purchases ADD COLUMN IF NOT EXISTS license_id UUID;

-- licenses
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS max_programs TEXT;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS valid_until TEXT;

-- locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS address TEXT;

-- login_events
ALTER TABLE public.login_events ADD COLUMN IF NOT EXISTS at TEXT;

-- marketing_sections
ALTER TABLE public.marketing_sections ADD COLUMN IF NOT EXISTS section_type TEXT;

-- marketplace_courses
ALTER TABLE public.marketplace_courses ADD COLUMN IF NOT EXISTS title TEXT;

-- mentorships
ALTER TABLE public.mentorships ADD COLUMN IF NOT EXISTS mentor_id UUID;

-- message_notifications
ALTER TABLE public.message_notifications ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by TEXT;

-- module_progress
ALTER TABLE public.module_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- mou_signatures
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMPTZ;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS signer_name TEXT;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS signer_title TEXT;

-- navigation_items
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS href TEXT;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS roles_allowed TEXT;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS sort_order TEXT;

-- ojt_placements
ALTER TABLE public.ojt_placements ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE public.ojt_placements ADD COLUMN IF NOT EXISTS position_title TEXT;
ALTER TABLE public.ojt_placements ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.ojt_placements ADD COLUMN IF NOT EXISTS total_hours_completed TEXT;
ALTER TABLE public.ojt_placements ADD COLUMN IF NOT EXISTS total_hours_required TEXT;

-- onboarding_documents
ALTER TABLE public.onboarding_documents ADD COLUMN IF NOT EXISTS content TEXT;

-- onboarding_packets
ALTER TABLE public.onboarding_packets ADD COLUMN IF NOT EXISTS version TEXT;

-- onboarding_progress
ALTER TABLE public.onboarding_progress ADD COLUMN IF NOT EXISTS step TEXT;

-- organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;

-- orientation_completions
ALTER TABLE public.orientation_completions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- partner_acknowledgments
ALTER TABLE public.partner_acknowledgments ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.partner_acknowledgments ADD COLUMN IF NOT EXISTS acknowledgment_key TEXT;

-- partner_lms_enrollments
ALTER TABLE public.partner_lms_enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- partner_lms_providers
ALTER TABLE public.partner_lms_providers ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2);
ALTER TABLE public.partner_lms_providers ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT FALSE;

-- partner_profiles
ALTER TABLE public.partner_profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.partner_profiles ADD COLUMN IF NOT EXISTS status TEXT;

-- partner_sites
ALTER TABLE public.partner_sites ADD COLUMN IF NOT EXISTS center_lat TEXT;
ALTER TABLE public.partner_sites ADD COLUMN IF NOT EXISTS center_lng TEXT;
ALTER TABLE public.partner_sites ADD COLUMN IF NOT EXISTS radius_m TEXT;

-- partner_users
ALTER TABLE public.partner_users ADD COLUMN IF NOT EXISTS organization_id UUID;

-- partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS onboarding_step TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS programs JSONB;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS type TEXT;

-- payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS enrollment_id UUID;

-- payout_rate_configs
ALTER TABLE public.payout_rate_configs ADD COLUMN IF NOT EXISTS max_rate NUMERIC(5,2);
ALTER TABLE public.payout_rate_configs ADD COLUMN IF NOT EXISTS min_rate NUMERIC(5,2);

-- payroll_profiles
ALTER TABLE public.payroll_profiles ADD COLUMN IF NOT EXISTS status TEXT;

-- platform_stats
ALTER TABLE public.platform_stats ADD COLUMN IF NOT EXISTS stat_name TEXT;
ALTER TABLE public.platform_stats ADD COLUMN IF NOT EXISTS stat_value TEXT;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_balance NUMERIC(12,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funding_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS graduation_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program_holder_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roles JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- program_enrollments
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS completed_lessons TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS delegate_id UUID;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS docs_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS funding_pathway TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS funding_program_id UUID;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS program_holder_id UUID;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS progress TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5,2);
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- program_holder_programs
ALTER TABLE public.program_holder_programs ADD COLUMN IF NOT EXISTS program_slug TEXT;

-- program_holders
ALTER TABLE public.program_holders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.program_holders ADD COLUMN IF NOT EXISTS mou_final_pdf_url TEXT;
ALTER TABLE public.program_holders ADD COLUMN IF NOT EXISTS mou_status TEXT;
ALTER TABLE public.program_holders ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.program_holders ADD COLUMN IF NOT EXISTS payout_share NUMERIC(5,2);

-- programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS accreditation_body TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS accreditation_expires TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS accreditation_status TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS blurb TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS delivery_mode TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS hours INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS occupation_code TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS rapids_required TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS required_skills JSONB;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS track TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS type TEXT;

-- progress
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS completed TEXT;

-- purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS user_id UUID;

-- quiz_attempts
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- scorm_packages
ALTER TABLE public.scorm_packages ADD COLUMN IF NOT EXISTS scorm_version TEXT;

-- scorm_sessions
ALTER TABLE public.scorm_sessions ADD COLUMN IF NOT EXISTS enrollment_id UUID;
ALTER TABLE public.scorm_sessions ADD COLUMN IF NOT EXISTS package_id UUID;
ALTER TABLE public.scorm_sessions ADD COLUMN IF NOT EXISTS user_id UUID;

-- search_analytics
ALTER TABLE public.search_analytics ADD COLUMN IF NOT EXISTS query TEXT;
ALTER TABLE public.search_analytics ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;

-- search_history
ALTER TABLE public.search_history ADD COLUMN IF NOT EXISTS searched_at TIMESTAMPTZ;

-- search_suggestions
ALTER TABLE public.search_suggestions ADD COLUMN IF NOT EXISTS suggestion TEXT;

-- settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value TEXT;

-- sfc_tax_returns
ALTER TABLE public.sfc_tax_returns ADD COLUMN IF NOT EXISTS preparer TEXT;

-- shop_checkin_codes
ALTER TABLE public.shop_checkin_codes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.shop_checkin_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.shop_checkin_codes ADD COLUMN IF NOT EXISTS shop_id UUID;

-- shop_documents
ALTER TABLE public.shop_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.shop_documents ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.shop_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- shop_weekly_reports
ALTER TABLE public.shop_weekly_reports ADD COLUMN IF NOT EXISTS hours_total TEXT;
ALTER TABLE public.shop_weekly_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.shop_weekly_reports ADD COLUMN IF NOT EXISTS week_end TEXT;
ALTER TABLE public.shop_weekly_reports ADD COLUMN IF NOT EXISTS week_start TEXT;

-- shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_id UUID;

-- sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS location TEXT;

-- staff
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS title TEXT;

-- store_entitlements
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS entitlement_key TEXT;

-- store_products
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS grants_course_access TEXT;

-- student_enrollments
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS enrollment_state TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS progress TEXT;

-- student_subscriptions
ALTER TABLE public.student_subscriptions ADD COLUMN IF NOT EXISTS weeks_paid TEXT;

-- students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS program_name TEXT;

-- studio_deploy_tokens
ALTER TABLE public.studio_deploy_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.studio_deploy_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- study_groups
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;

-- support_articles
ALTER TABLE public.support_articles ADD COLUMN IF NOT EXISTS title TEXT;

-- tax_clients
ALTER TABLE public.tax_clients ADD COLUMN IF NOT EXISTS preparation_fee NUMERIC(12,2);
ALTER TABLE public.tax_clients ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2);

-- tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS compliance_ferpa TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS compliance_hipaa TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS compliance_wioa TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS license_status TEXT;

-- testimonials
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2);

-- time_entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS minutes INTEGER DEFAULT 0;

-- training_courses
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS cert_valid_days INTEGER DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS certification_body TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS certification_name TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS delivery_mode TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS external_version TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS partner_url TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS rating NUMERIC(5,2);
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS title TEXT;

-- training_lessons
ALTER TABLE public.training_lessons ADD COLUMN IF NOT EXISTS html TEXT;
ALTER TABLE public.training_lessons ADD COLUMN IF NOT EXISTS idx TEXT;
ALTER TABLE public.training_lessons ADD COLUMN IF NOT EXISTS order_number TEXT;

-- training_programs
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS skill_level TEXT;

-- tuition_subscriptions
ALTER TABLE public.tuition_subscriptions ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0;
ALTER TABLE public.tuition_subscriptions ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 0;

-- two_factor_auth
ALTER TABLE public.two_factor_auth ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT FALSE;

-- user_access
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS current_period_end TEXT;
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS tier TEXT;

-- user_activity
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS metadata JSONB;

-- user_certifications
ALTER TABLE public.user_certifications ADD COLUMN IF NOT EXISTS certification_name TEXT;
ALTER TABLE public.user_certifications ADD COLUMN IF NOT EXISTS certification_type TEXT;

-- user_entitlements
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS product_id UUID;

-- user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS employer_id UUID;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS program_holder_id UUID;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role TEXT;

-- user_skills
ALTER TABLE public.user_skills ADD COLUMN IF NOT EXISTS proficiency_level TEXT;

-- user_streaks
ALTER TABLE public.user_streaks ADD COLUMN IF NOT EXISTS total_active_days INTEGER DEFAULT 0;

-- users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;

-- wioa_participants
ALTER TABLE public.wioa_participants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.wioa_participants ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.wioa_participants ADD COLUMN IF NOT EXISTS last_name TEXT;
