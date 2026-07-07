# 🔴 ORPHANED TABLES AUDIT - LINE BY LINE CATEGORIZATION

**Date:** July 7, 2026  
**Purpose:** Categorize 835 orphaned tables to determine what they're for

---

## SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│ TABLES IN CODE:                                    560       │
│ TABLES IN MIGRATIONS:                           1,280       │
│ ─────────────────────────────────────────────────────────── │
│ CORRECT (in both):                                 445       │
│ MISSING (in code, not in migrations):               115      │
│ ORPHANED (in migrations, not in code):             835       │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 1: MISSING TABLES (115) - Need New Migrations

These tables are used in code but DO NOT EXIST in migrations.

### Education/LMS (28)
```
ai_conversation_memory
ai_guardrail_logs
course-content
course-videos
course_generation_jobs
credential_attempts
external_course_completions
external_credentials
grades
learner_credentials
lesson_completions
module-certificates
module_certificates
progress_entries
program_completion
program_courses
program_credentials
program_external_completions
program_external_courses
program_holder_call_log
program_outcomes
program_requirements
public_ai_tutor_logs
sim_attempts
training_simulations
user_learning_paths
```

### Apprenticeship (10)
```
barber_subscriptions
host_shop_applications
host_shop_partnerships
nail_partner_applications
partner_applications
partner_mous
mou_templates
provider_applications
rapids_apprentices
```

### Testing/Cert (8)
```
cert_revocation_log
certification_submissions
certiport_exam_requests
exam_authorizations
exam_events
exam_sessions
testing_leads
```

### Admin/Platform (20)
```
announcements
audit_logs
automated_decisions
blog_posts
campaigns
calculator_usage
checkout_contexts
communications
coupons
cron_job_runs
events
job_queue
leads
newsletter_subscribers
processed_webhook_events
promo_codes
review_queue
scheduled_messages
sms_messages
waitlist
```

### Compliance (8)
```
compliance_alerts
compliance_audit_log
id_verifications
license_agreement_acceptances
license_events
license_validations
licenses
managed_licenses
verify_audit
```

### Partner/Agreement (8)
```
host_shop_applications
host_shop_partnerships
partner_audit_log
partner_document_requirements
partner_export_logs
partner_program_access
```

### Social/Media (8)
```
live_chat_messages
live_chat_sessions
notification_outbox
organization_settings
shop_recommendations
site_settings
social_media_posts
social_media_settings
sop_templates
```

### Workflow (6)
```
workflow_dead_letters
workflow_runs
workflow_step_logs
workflow_steps
workflow_triggers
```

### Other (19)
```
application_payments
cohort_sessions
knowledge_documents
knowledge_embeddings
ocr_extractions
push_subscriptions
store_subscription_pricing
student_documents
student_tasks
studio_workspaces
study_group_members
study_groups
subscription_invoices
system_settings
wioa_compliance_reports
wioa_participant_records
workforce_analytics
workforce_cases
workforce_funding
workforce_participants
workone_checklist
```

---

## PART 2: ORPHANED TABLES (835) - LINE BY LINE AUDIT

### Category Breakdown

| Category | Count | Status |
|----------|-------|--------|
| **Active Features** | 180+ | Should be used |
| **Future Features** | 200+ | Planned but not implemented |
| **Legacy/External** | 450+ | May be deprecated or external |
| **TOTAL** | **835** | |

---

### CATEGORY 1: ACTIVE FEATURES - Tables that SHOULD be used (180+)

#### AI/Machine Learning (13)
```
ai_chat_history
ai_course_generation_log
ai_generated_courses
ai_generations
ai_instructor_assignments
ai_instructors
ai_interview_assessments
ai_job_matches
ai_messages
ai_operator_memory
ai_plan_executions
ai_planner_tasks
ai_tutor_interactions
```
**Purpose:** AI tutoring, course generation, automation
**Action:** Implement AI features or remove tables

#### Course Management (21)
```
course_access
course_accreditation_metadata
course_categories
course_competencies
course_credentials
course_discussions
course_embeddings
course_lesson_versions
course_metrics
course_module_settings
course_objectives
course_progress
course_publish_audits
course_recommendations
course_syllabi
course_tasks
course_templates
course_vendor_links
course_version_lessons
course_version_modules
course_videos
```
**Purpose:** Course content management
**Action:** Use for course builder functionality

#### Credential/Certification (10)
```
credential_blueprint_competencies
credential_blueprint_domains
credential_blueprints
credential_domains
credential_exam_domains
credential_generation_rules
credential_providers
credential_submissions
credential_validation_rules
credentialing_partners
```
**Purpose:** Credential management system
**Action:** Use for certification tracking

#### Enrollment Related (23)
```
benefits_enrollments
cobra_enrollments
enrollment_acknowledgments
enrollment_agreements
enrollment_bypass_allowlist
enrollment_funding_records
enrollment_funding_status_log
enrollment_insert_audit
enrollment_jobs
enrollment_module_progress
enrollment_payments
enrollment_status_history
enrollment_transitions
enrollment_voucher_audit
external_lms_enrollments
hsi_enrollment_queue
milady_enrollments
milady_rise_enrollments
partner_course_enrollments
partner_lms_enrollment_failures
program_enrollment_tracks
reporting_enrollments
training_enrollments
```
**Purpose:** Enrollment tracking and management
**Action:** Use for enrollment workflows

#### Program Management (35)
```
program_announcements
program_banner_views
program_catalog
program_cohorts
program_completion_candidates
program_course_activity
program_course_links
program_course_map
program_course_versions
program_ctas
program_curriculum_modules
program_enrollment_tracks
program_funding
program_funding_links
program_funding_options
program_holder_applications
program_holder_banking
program_holder_payouts
program_holder_reports
program_lessons
program_media
program_modules
program_organizations
program_partner_lms
program_phases
program_required_courses
program_requirement_rules
program_revenue
program_review_log
program_reviews
program_sponsorships
program_tracks
program_versions
program_wioa_compliance_forms
programs_for_holder
```
**Purpose:** Program management and curriculum
**Action:** Use for program builder

#### Student/Participant (17)
```
student_activity_log
student_ai_instructors
student_applications
student_badges
student_credential_uploads
student_credentials
student_interventions
student_milestones
student_module_progress
student_payments
student_points
student_progress
student_records
student_requirements
student_resources
student_skill_signoffs
student_subscriptions
```
**Purpose:** Student tracking
**Action:** Use for student dashboard

#### Training (10)
```
training_access_keys
training_enrollments
training_hours
training_lessons
training_modules
training_partners
training_progress
training_providers
training_purchases
training_videos
```
**Purpose:** Training module system
**Action:** Use for training content

#### Partner/Host Shop (30)
```
host_shop_apprentices
host_shop_evaluations
host_shop_subscriptions
host_shops
partner_acknowledgment_items
partner_acknowledgments
partner_course_enrollments
partner_course_payments
partner_courses_catalog
partner_credentials
partner_lms_enrollment_failures
partner_organizations
partner_profiles
partner_program_courses
partner_seat_orders
partner_sessions
partner_shops
partner_site_inspections
partner_sites
partner_types
shop_applications
shop_categories
shop_document_requirements
shop_orders
shop_products
shop_profiles
shop_reports
shop_required_docs_status
shop_signatures
shop_weekly_reports
```
**Purpose:** Partner/host shop management
**Action:** Use for host shop portal

#### Apprenticeship (16)
```
apprentice_agreements
apprentice_assignments
apprentice_documents
apprentice_hour_totals
apprentice_hours_by_shop
apprentice_hours_by_source
apprentice_hours_log
apprentice_notifications
apprentice_payroll
apprentice_service_logs
apprentice_uploads
apprentice_wage_updates
apprenticeship_hours_summary
apprenticeship_portfolio
apprenticeship_shop_drafts
apprenticeship_shops
```
**Purpose:** Apprenticeship tracking
**Action:** Use for apprenticeship system

#### Exam/Assessment (7)
```
assessment_attempts
assessment_questions
assessments
competency_tests
practice_attempts
practice_exam_blueprints
quiz_answer_options
```
**Purpose:** Testing and assessment
**Action:** Use for testing center

---

### CATEGORY 2: FUTURE FEATURES - Not yet implemented (200+)

#### Accreditation (5)
```
accreditation_evidence
accreditation_records
accreditation_reviews
accreditation_standards
accreditations
```
**Purpose:** Accreditation tracking
**Action:** Keep for future accreditation system

#### Gamification (2)
```
gamification_events
gamification_points
```
**Purpose:** Points, badges, streaks
**Action:** Keep for gamification features

#### Grant/Funding (15)
```
funding_applications
funding_cases
funding_change_audit
funding_programs
funding_records
funding_tracking
funding_verification_escalations
grant_applications
grant_disbursements
grant_eligibility_results
grant_entities
grant_federal_forms
grant_notification_log
grant_packages
grant_programs
grant_submissions
```
**Purpose:** Grant management
**Action:** Keep for funding/grants system

#### Compliance - FERPA/GDPR (10)
```
ferpa_access_requests
ferpa_audit_log
ferpa_calendar_events
ferpa_compliance_checklist
ferpa_consent_forms
ferpa_disclosure_log
ferpa_documents
ferpa_student_acknowledgments
ferpa_training
ferpa_violation_reports
```
**Purpose:** FERPA compliance
**Action:** Keep for compliance requirements

#### Franchise (1)
```
franchises
```
**Purpose:** Franchise management
**Action:** Keep for franchise system

#### Forum/Community (6)
```
forum_comments
forum_members
forum_reactions
forum_subscriptions
forum_thread_views
forum_votes
```
**Purpose:** Community forum
**Action:** Keep for community features

#### Leaderboard (2)
```
leaderboard_entries
leaderboard_scores
```
**Purpose:** Gamification
**Action:** Keep for leaderboard features

#### Mentor (1)
```
mentorship_sessions
```
**Purpose:** Mentorship tracking
**Action:** Keep for mentor system

#### Workflow (27)
```
approval_chain_definitions
approval_chain_steps
approval_tokens
automation_action_queue
automation_execution_log
automation_rules
automation_triggers
autopilot_logs
autopilot_settings
process_steps
processes
workflow_dead_letters
workflow_runs
workflow_step_logs
workflow_steps
workflow_triggers
```
**Purpose:** Workflow automation
**Action:** Keep for workflow system

---

### CATEGORY 3: LEGACY/EXTERNAL - May be deprecated (450+)

#### Operator/Dev Studio (17)
```
dev_audit_logs
dev_container_sessions
dev_terminal_logs
devstudio_chat_log
devstudio_documents
devstudio_jobs
operator_memory
operator_tasks
```
**Purpose:** Developer tools
**Action:** Remove if not used

#### Clinical Management (CMI) (5)
```
cmi_attendance
cmi_certificates
cmi_clinicals
cmi_competencies
cmi_students
```
**Purpose:** Clinical management information
**Action:** Remove if not used

#### SOS - State of Indiana (22)
```
sos_attachment_library
sos_brand_assets
sos_compliance_records
sos_content_blocks
sos_document_data_sources
sos_document_styles
sos_document_templates
sos_generated_documents
sos_opportunities
sos_opportunity_requirements
sos_organization_profiles
sos_partner_entities
sos_past_performance
sos_rate_sheets
sos_requirement_mappings
sos_review_tasks
sos_source_document_sections
sos_source_documents
sos_source_links
sos_submission_audit_logs
sos_submission_packets
sos_submission_runs
```
**Purpose:** State Opportunity System
**Action:** Remove if not used

#### Tax/SFC/Supersonic (32)
```
sfc_documents
sfc_leads
sfc_tax_documents
sfc_tax_return_public_status
sfc_tax_returns
sfc_tax_returns_public_lookup
supersonic_applications
supersonic_appointments
supersonic_careers
supersonic_tax_documents
supersonic_training_keys
tax_applications
tax_calculations
tax_document_uploads
tax_documents
tax_filing_applications
tax_filings
tax_firms
tax_information
tax_intake
tax_interview_questions
tax_payments
tax_return_drafts
tax_return_events
tax_services
tax_tools
tax_withholdings
```
**Purpose:** Tax preparation services
**Action:** Remove if not used

#### Milady/Milady RISE (7)
```
milady_access
milady_email_logs
milady_enrollments
milady_license_codes
milady_orientation_status
milady_provisioning_queue
milady_rise_enrollments
```
**Purpose:** Milady curriculum integration
**Action:** Keep if using Milady curriculum

#### Store/E-Commerce (6)
```
store_branding
store_instances
store_orders
```
**Purpose:** E-commerce store
**Action:** Keep for store system

#### Subscription (1)
```
subscription_plans
```
**Purpose:** Subscription management
**Action:** Keep for subscription billing

#### Video/Streaming (7)
```
video_captions
video_chapters
video_generation_jobs
video_jobs
video_notes
video_transcripts
video_views
```
**Purpose:** Video content management
**Action:** Keep for video features

#### SCORM (5)
```
scorm_attempts
scorm_cmi_data
scorm_enrollments
scorm_packages
scorm_progress
scorm_registrations
scorm_sessions
scorm_state
scorm_tracking
```
**Purpose:** SCORM e-learning standard
**Action:** Keep for SCORM support

#### Platform/Admin (30+)
```
api_keys
api_request_logs
audit_archive
audit_ddl_events
audit_export_log
audit_failures
backup
critical_audit_logs
dashboards
data_deletion_requests
data_processing_jobs
data_retention_policies
data_sharing_agreements
health_check_log
health_logs
migration_audit
platform_knowledge_chunks
platform_products
platform_secrets
platform_snapshots
platform_state_snapshots
platform_stats
security_alerts
security_audit_logs
security_logs
system_configuration
system_errors
updates
v_active_programs
v_app_slow_queries
```
**Purpose:** Platform administration
**Action:** Keep for admin dashboard

#### Other Legacy (100+)
```
academic_integrity_violations
accessibility_preferences
activity_feed
activity_progress
adaptive_learning_paths
addon_subscriptions
affiliate_applications
affiliate_payouts
affiliates
agency_referral_confirmations
announcement_recipients
appointment_types
assistance_programs
audio_preferences
avatars
backups
badge_definitions
bank_accounts
banking_services
barber_competency_mappings
barber_completions
barber_instructor_signoffs
barber_lesson_progress
barber_module_hour_config
barber_shops
benefits_enrollments
benefits_plans
billing_cycles
bookings
captcha_attempts
career_applications
case_events
case_managers
case_notes
case_studies
cases
cash_advance_applications
cash_advances
certificate_funding_status_log
certification_audit_log
certification_bodies
chat_conversations
client_consents
clients
clinical_hours_logs
clinical_placements
clinical_sites
cobra_enrollments
code_examples
collaboration_messages
collaboration_presence
collection_sites
community_event_rsvps
community_group_members
community_groups
competency_evidence
competency_results
competency_signoffs
complaints
completions
compliance_documents
compliance_events
compliance_flags
compliance_profiles
compliance_violations
consent_preferences
consent_records
contact_hours
contact_submissions
content_approvals
content_blocks
content_library
content_pages
content_sync_log
contract_audit_logs
contract_exports
contract_prefill_runs
contract_signature_fields
contract_template_fields
cookie_consent_log
copilot_usage_log
course_access
course_recommendations
cta_clicks
curriculum_alignment_audits
curriculum_compiler_jobs
curriculum_generation_lessons
curriculum_generation_runs
curriculum_lesson_competencies
curriculum_publish_log
curriculum_validation_results
curvature_reviews
customer_service_protocols
daily_activities
departments
dependents
digital_binders
direct_deposit_accounts
direct_messages
discussion_forums
discussion_replies
discussions
dmca_takedown_requests
document_audit_log
document_categories
document_field_mappings
document_signatures
document_verifications
donation_tiers
drug_test_history
drug_testing_orders
drug_testing_policies
drug_tests
ecr_snapshots
ecr_sync_logs
efh_migrations
email_automations
email_events
email_notifications
employee_documents
employee_goals
employer_agreements
employer_applications
employer_incentives
employer_sponsors
employment_tracking
entitlements
entity_eligibility_checks
evaluations
exam_authorization_queue
exam_outcome_tracking
exam_ready_status
exam_session_events
external_course_access
external_modules
external_partner_modules
external_partner_progress
failed_login_attempts
faq_search_analytics
features
feedback
feedback_votes
field_hours_logs
financial_assurance_records
financial_assurances
flashcard_progress
flashcard_sets
flashcards
focused_reviews
follow_up_reminders
followup_schedule
foundation_services
fssa_attendance
fssa_budget
fssa_participants
fssa_program_components
generated_assets
generated_images
grade_records
group_messages
handbook_policies
help_categories
help_search_log
holidays
hour_entry_status_history
hour_logs
hour_tracking
hours_log
hours_logs
hsi_enrollment_queue
impact_metrics
impact_statistics
impact_stats
incentives
income_sources
indiana_alerts_sent
indiana_enforcement_actions
indiana_hour_categories
indiana_timeclock_daily_export
indiana_timeclock_weekly_summary_export
industries
instructor_assignments
instructor_availability
instructor_profiles
integration_configs
integration_tokens
interactive_elements
interview_schedules
ip_access_control
job_categories
job_listings
job_skills
jri_participants
learner_ai_policies
learner_compliance
learner_documents
learner_goals
learner_module_gate_state
learner_onboarding
learning_activity_streaks
learning_analytics
learning_resources
learning_streaks
leave_balances
leave_policies
leave_requests
legal_actions
lesson_bookmarks
lesson_comments
lesson_competency_map
lesson_enhancements
lesson_objectives
lesson_resources
library_resources
license_audit_log
license_keys
license_tiers
license_usage
license_usage_log
license_violations
live_class_attendance
lms_organizations
makeup_work_requests
marketing_campaign_sends
marketing_campaigns
marketplace_courses
marketplace_sellers
media_assets
message_notifications
message_threads
moderation_actions
moderation_queue
moderation_reports
moderation_rules
module_competencies
module_objectives
module_progress
mou_documents
navigation_categories
navigation_items
nds_course_catalog
news_articles
news_categories
nonprofit_services
occupation_standards
offerings
ojt_logs
ojt_notes
ojt_placements
ojt_student_summary
onboarding_checklist
onboarding_events
onboarding_resources
onboarding_steps
open_timeclock_shifts
org_invitations
org_role_normalization_log
org_settings
organization_addons
parent_student_links
participant_barriers
participant_demographics
participants
password_history
pathways
payment_methods
payment_options
payment_plan_selections
payment_plans
payment_sessions
payment_transactions
payout_queue
payout_rate_configs
payroll
payroll_records
peer_review_assignments
peer_reviews
performance_alerts
performance_metrics
performance_reviews
permission_audit_log
permission_group_members
permission_groups
permissions
placement_outcomes
placements
plan_features
plans
policies
portfolio_projects
positions
practice_activities
processed_stripe_events
proctored_exams
proctoring_sessions
product_images
product_page_views
product_reports
product_variants
provisioning_events
push_notification_tokens
push_tokens
qa_checklist_completions
qa_checklists
quarterly_performance
question_bank
question_banks
questions
quiz_attempt_answers
quiz_attempts
quiz_questions
quiz_submissions
quizzes
rag_documents
rag_embeddings
rapids_apprentice_data
readiness_reports
recap_generation_log
referral_codes
refund_advance_applications
refund_tracking
refunds
reporting_completions
reporting_funding
reporting_progress
reporting_verdicts
reports
required_documents
resource_bookmarks
resource_downloads
resource_library
resources
resume_profiles
resumes
rise_participants
rise_programs
role_permissions
role_templates
roles
rubrics
salary_history
sam_alerts
sam_documents
sam_entities
sap_records
scholarship_applications
school_application_followups
scorm_completion_summary
scraper_detection_events
script_acknowledgments
script_deviations
search_analytics
search_logs
secure_identity
seller_applications
service_tickets
settings
shared_documents
shift_schedules
sites
skill_assessments
skill_badges
skills_checklist
slow_resources
sms_reminders
snap_outreach_log
social_campaigns
social_media_accounts
social_media_queue
sponsor_organizations
sso_connections
sso_login_attempts
sso_providers
sso_sessions
staff_applications
staff_notifications
staff_processes
staff_training_modules
staff_training_progress
state_compliance
state_licensing
state_rules
statistics
student_activity_log
studio_chat_history
studio_comments
studio_commit_cache
studio_deploy_tokens
studio_deployments
studio_favorites
studio_pr_tracking
studio_recent_files
studio_repos
studio_sessions
studio_settings
studio_shares
studio_workflow_tracking
study_sessions
supersonic_applications
support_articles
support_groups
support_sessions
tasks
team_members
tenant_compliance_records
tenant_configurations
tenant_invitations
tenant_licenses
tenant_members
tenant_stripe_customers
tenant_subscriptions
tenant_usage_daily
terminal_command_log
timeclock_cron_runs
timeclock_ui_state
timesheets
timezone_names
transcript_search_log
transmission_statuses
trial_signups
tts_audio_files
tts_usage_log
tuition_options
tuition_payments
tuition_subscriptions
tutorials
two_factor_attempts
uploaded_documents
user_access
user_activity_logs
user_capabilities
user_compliance_status
user_connections
user_consents
user_documents
user_files
user_onboarding
user_onboarding_status
user_permissions
user_preferences
user_progress
user_resumes
user_roles
user_saved_grants
user_sessions
vendor_accounts
vendor_payments
vendor_payout_tasks
verification_actions
vita_appointments
volunteer_opportunities
volunteers
waitlist_entries
web_vitals
webhook_deliveries
webhook_health_log
webhook_logs
webhooks
webinar_registrations
webinars
website_pages
welcome_packet_items
welcome_packets
wioa_applications
wioa_documents
wioa_exports
wioa_report_runs
wioa_services
withdrawals
workforce_board_cases
workforce_board_notes
workforce_board_participants
workshop_categories
workshops
workspace_domains
```

---

## PART 3: CROSS-REFERENCE - Can orphaned fill missing?

### MISSING TABLE → POTENTIAL ORPHANED REPLACEMENT

| Missing Table | Potential Orphaned Table | Notes |
|--------------|------------------------|-------|
| course_generation_jobs | ai_course_generation_log | Similar purpose |
| program_courses | program_course_links, program_course_map | Related tables exist |
| credentials | credential_blueprints, credential_submissions | Credential system exists |
| certifications | certification_bodies, credentialing_partners | Related tables exist |
| program_enrollments | partner_course_enrollments, enrollment_* | Many enrollment tables |
| testing_sessions | assessment_attempts, competency_tests | Assessment system exists |
| student_documents | apprentice_documents, learner_documents | Document tables exist |
| licenses | license_keys, license_tiers | License system exists |
| course_videos | course_version_modules, video_* | Video tables exist |
| announcements | announcement_recipients | Related table exists |

---

## ACTION ITEMS

### Priority 1: Use Existing Orphaned Tables (Recommended)
Many orphaned tables could fill in for missing tables:
- [ ] Review `credential_*` tables instead of creating `credentials`
- [ ] Review `enrollment_*` tables instead of creating `program_enrollments`
- [ ] Review `program_course_*` tables instead of creating `program_courses`
- [ ] Review `video_*` tables instead of creating course video tables

### Priority 2: Create Missing Tables That Have No Replacement
- [ ] Create 30 core tables that have no orphaned equivalent
- [ ] Run migration

### Priority 3: Audit Legacy Tables for Cleanup
- [ ] Review SOS/Tax tables (remove if not used)
- [ ] Review Operator/Dev tables (remove if not used)
- [ ] Review Milady tables (keep if using Milady curriculum)

### Priority 4: Implement Future Features
- [ ] Accreditation system (5 tables ready)
- [ ] Workflow automation (27 tables ready)
- [ ] Gamification (2 tables ready)
- [ ] Forum/Community (6 tables ready)
