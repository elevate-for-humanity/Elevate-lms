# 🔴 CROSS-REFERENCE ANALYSIS: MISSING vs ORPHANED TABLES

**Date:** July 7, 2026

---

## SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│ MISSING TABLES (in code but NOT in migrations):     112    │
│ ORPHANED TABLES (in migrations but NOT in code):   848    │
│ OVERLAP (tables in both):                             0    │
└─────────────────────────────────────────────────────────────┘
```

---

## KEY FINDING

**There is ZERO overlap between missing tables and orphaned tables.**

- **112 missing tables:** Used in code but DO NOT EXIST in any migration
- **848 orphaned tables:** Exist in migrations but are NOT used by any code

**The gap is NOT between missing/orphaned - it's structural:**

| Gap Type | Tables | Action Required |
|----------|--------|----------------|
| Missing tables | 112 | CREATE new migrations |
| Orphaned tables | 848 | CREATE code to use them OR delete |

---

## 112 MISSING TABLES - MUST BE CREATED

These tables are referenced in code but **DO NOT EXIST** anywhere in migrations.

### Migration Created: 30 tables ✅
**File:** `supabase/migrations/20260707000001_critical_missing_tables.sql`

| Table | Category |
|-------|----------|
| apprentices | Apprenticeship |
| apprentice_applications | Apprenticeship |
| apprentice_placements | Apprenticeship |
| apprentice_sites | Apprenticeship |
| apprentice_skills | Apprenticeship |
| hour_entries | Apprenticeship |
| hour_transfer_requests | Apprenticeship |
| rapids_apprentices | Apprenticeship |
| certifications | Testing/Cert |
| credentials | Testing/Cert |
| program_enrollments | Education/LMS |
| partner_users | Partner |
| partners | Partner |
| agreement_acceptances | Partner |
| agreement_versions | Partner |
| lms_courses | Education/LMS |
| curriculum_lessons | Education/LMS |
| lesson_progress | Education/LMS |
| user_skills | Education/LMS |
| handbooks | Compliance |
| handbook_acknowledgments | Compliance |
| payments | E-Commerce |
| notifications | Social/Chat |
| conversations | Social/Chat |
| employer_documents | Partner |
| staff_users | Staff/HR |
| staff_attendance | Staff/HR |
| staffs | Staff/HR |

### Still Needed: 82 more tables ❌

#### Education/LMS (need 17 more)
```
module_certificates
program_courses
program_completion
program_credentials
program_requirements
program_outcomes
program_external_courses
program_external_completions
program_holder_call_log
progress_entries
course_generation_jobs
external_credentials
external_course_completions
credential_attempts
grades
user_learning_paths
```

#### Partner/Agreement (need 5 more)
```
partner_mous
mou_templates
host_shop_applications
host_shop_partnerships
partner_audit_log
```

#### Testing/Cert (need 7 more)
```
cert_revocation_log
certification_submissions
certiport_exam_requests
exam_events
exam_authorizations
exam_sessions
testing_leads
```

#### Admin/Platform (need 12)
```
announcements
campaigns
communications
blog_posts
newsletter_subscribers
waitlist
leads
calculator_usage
checkout_contexts
job_queue
cron_job_runs
processed_webhook_events
```

#### Compliance (need 4 more)
```
compliance_alerts
compliance_audit_log
license_events
license_validations
licenses
managed_licenses
id_verifications
verify_audit
```

#### E-Commerce (need 2 more)
```
application_payments
coupons
promo_codes
store_subscription_pricing
subscription_invoices
```

#### Workflow (need 4 more)
```
workflow_triggers
workflow_steps
workflow_runs
workflow_dead_letters
automated_decisions
```

#### Knowledge/AI (need 5)
```
knowledge_documents
knowledge_embeddings
ai_conversation_memory
ai_guardrail_logs
```

#### Other (need 8)
```
cohort_sessions
events
sim_attempts
shop_recommendations
study_groups
study_group_members
studio_workspaces
sms_messages
```

#### Social/Media (need 7)
```
live_chat_messages
live_chat_sessions
public_ai_tutor_logs
social_media_posts
social_media_settings
notification_outbox
```

#### Workforce/WIOA (need 5)
```
wioa_compliance_reports
workforce_analytics
workforce_cases
workforce_funding
workforce_participants
workone_checklist
```

---

## 848 ORPHANED TABLES - NEEDS CODE AUDIT

These tables exist in migrations but are **NOT referenced** in any code.

### Category Breakdown

| Category | Count | Tables |
|----------|-------|--------|
| AI/Machine Learning | 50+ | ai_agents, ai_tutor_interactions, ai_instructors, etc |
| Accreditation | 10 | accreditation_* |
| Assessment/Testing | 40+ | assessments, quiz_*, exam_* |
| Compliance | 30+ | compliance_*, ferpa_*, gdpr_* |
| Course/Curriculum | 50+ | course_*, curriculum_* |
| Credentialing | 30+ | credential_*, certification_* |
| Digital Binder | 15 | digital_binders |
| Franchise | 20 | franchise_* |
| Gamification | 10 | gamification_* |
| Grant/Funding | 30+ | grant_*, funding_* |
| Host Shop | 20 | host_shop_* |
| LMS/Organization | 20 | lms_*, organization_* |
| Milady | 10 | milady_*, milady_rise_* |
| Dev Studio | 50+ | devstudio_*, operator_* |
| Payroll/Staff | 40+ | payroll_*, staff_* |
| Platform/Config | 40+ | platform_*, settings |
| Program/Enrollment | 60+ | program_* |
| Reports/Analytics | 30+ | reporting_*, reports |
| SOS (Indiana) | 30+ | sos_* |
| Student/Participant | 60+ | student_*, participant_* |
| Studio/Workspace | 40+ | studio_* |
| Tax/SFC | 40+ | tax_*, sfc_*, supersonic_* |
| Training | 40+ | training_* |
| Workflow | 30+ | workflow_* |

### Subcategories with High Priority for Audit

**EXISTING FEATURES (should already be working):**
- `course_*` - Course management
- `program_*` - Program management
- `student_*` - Student management
- `training_*` - Training modules

**FUTURE FEATURES (may need implementation):**
- `ai_*` - AI tutoring, agents, automation
- `gamification_*` - Points, badges, streaks
- `workflow_*` - Automated workflows

**LEGACY CODE (should be removed):**
- `cmi_*` - Clinical Management Information (not used)
- `franchise_*` - Franchise system (not used)
- `sos_*` - State of Indiana system (not used)
- `tax_*` - Tax services (not used)
- `supersonic_*` - Supersonic program (not used)

---

## COMPLETE ORPHANED TABLES LIST (848)

```
academic_integrity_violations
accessibility_preferences
accreditation_evidence
accreditation_records
accreditation_reviews
accreditation_standards
accreditations
activity_feed
activity_progress
adaptive_learning_paths
addon_subscriptions
admin_audit_events
admin_audit_log
admin_compliance_status
admin_priority_queue
affiliate_applications
affiliate_payouts
affiliates
agency_referral_confirmations
agreement_signatures
ai_agents
ai_approvals
ai_chat_history
ai_code_patterns
ai_course_generation_log
ai_deployments
ai_diffs
ai_file_snapshots
ai_generated_courses
ai_generations
ai_instructor_assignments
ai_instructors
ai_interview_assessments
ai_job_matches
ai_memory
ai_messages
ai_operator_memory
ai_plan_executions
ai_planner_tasks
ai_task_logs
ai_task_steps
ai_tasks
ai_tutor_interactions
alert_notifications
ambient_music_log
announcement_recipients
api_keys
api_request_logs
app_screenshot_views
application_checklist
application_claim_log
application_compliance_checks
application_financials
application_followups
application_intake
application_submissions
appointment_types
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
approval_chain_definitions
approval_chain_steps
approval_tokens
assessment_attempts
assessment_questions
assessments
assignment_rubrics
attendance_hours
audio_preferences
audit_archive
audit_ddl_events
audit_export_log
audit_failures
automation_action_queue
automation_execution_log
automation_rules
automation_triggers
autopilot_logs
autopilot_settings
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
cmi_attendance
cmi_certificates
cmi_clinicals
cmi_competencies
cmi_students
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
competency_tests
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
creator_courses
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
critical_audit_logs
crm_interactions
crm_leads
cross_tenant_access
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
dashboards
data_deletion_requests
data_processing_jobs
data_retention_policies
data_sharing_agreements
delegate_assignments
delivery_logs
demo_analytics
departments
dependents
dev_audit_logs
dev_container_sessions
dev_terminal_logs
devstudio_chat_log
devstudio_documents
devstudio_jobs
digital_binders
digital_purchases
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
entitlements
entity_eligibility_checks
evaluations
exam_authorization_queue
exam_outcome_tracking
exam_ready_status
exam_session_events
external_course_access
external_lms_enrollments
external_module_progress
external_modules
external_partner_modules
external_partner_progress
failed_login_attempts
faq_search_analytics
features
feedback
feedback_votes
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
field_hours_logs
financial_assurance_records
financial_assurances
flashcard_progress
flashcard_sets
flashcards
focused_reviews
follow_up_reminders
followup_schedule
forum_comments
forum_members
forum_reactions
forum_subscriptions
forum_thread_views
forum_votes
foundation_services
franchises
fssa_attendance
fssa_budget
fssa_participants
fssa_program_components
funding_applications
funding_cases
funding_change_audit
funding_programs
funding_records
funding_tracking
funding_verification_escalations
gamification_events
gamification_points
gdpr_requests
generated_assets
generated_images
grade_records
grant_disbursements
grant_eligibility_results
grant_entities
grant_federal_forms
grant_notification_log
grant_packages
grant_programs
grant_submissions
group_messages
handbook_policies
health_check_log
health_logs
help_categories
help_search_log
holidays
host_shop_apprentices
host_shop_evaluations
host_shop_subscriptions
host_shops
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
leaderboard_entries
leaderboard_scores
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
mentorship_sessions
message_notifications
message_threads
migration_audit
milady_access
milady_email_logs
milady_enrollments
milady_license_codes
milady_orientation_status
milady_provisioning_queue
milady_rise_enrollments
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
operator_memory
org_invitations
org_role_normalization_log
org_settings
organization_addons
parent_student_links
participant_barriers
participant_demographics
participants
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
platform_knowledge_chunks
platform_products
platform_secrets
platform_snapshots
platform_state_snapshots
platform_stats
policies
portfolio_projects
positions
practice_activities
practice_attempts
practice_exam_blueprints
priority_scores
process_steps
processed_stripe_events
processes
proctored_exams
proctoring_sessions
product_images
product_page_views
product_reports
product_variants
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
provisioning_events
push_notification_tokens
push_tokens
qa_checklist_completions
qa_checklists
quarterly_performance
question_bank
question_banks
questions
quiz_answer_options
quiz_answers
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
reporting_enrollments
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
scorm_progress
scorm_registrations
scorm_sessions
scorm_state
scraper_detection_events
script_acknowledgments
script_deviations
search_analytics
search_logs
secure_identity
security_alerts
security_audit_logs
security_logs
seller_applications
service_tickets
settings
sfc_documents
sfc_leads
sfc_tax_documents
sfc_tax_return_public_status
sfc_tax_returns
sfc_tax_returns_public_lookup
shared_documents
shift_schedules
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
store_branding
store_instances
store_orders
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
subscription_plans
supersonic_applications
supersonic_appointments
supersonic_careers
supersonic_tax_documents
supersonic_training_keys
support_articles
support_groups
support_sessions
system_configuration
system_errors
tasks
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
updates
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
v_active_programs
v_app_slow_queries
v_applications
v_enrolled_not_paid
v_funding_verification_queue
v_paid_not_enrolled
v_payment_integrity_dashboard
v_published_programs
vendor_accounts
vendor_payments
vendor_payout_tasks
verification_actions
video_captions
video_chapters
video_generation_jobs
video_jobs
video_notes
video_transcripts
video_views
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

## ACTION ITEMS

### Priority 1: Create 82 Missing Tables ❌
- [ ] Create migration for remaining 82 tables
- [ ] Run migration in production
- [ ] Verify all tables exist

### Priority 2: Audit 848 Orphaned Tables 🔍
- [ ] Categorize each orphaned table:
  - Future feature (implement later)
  - Legacy code (delete)
  - External service (document)
  - Should be used (add to code)
- [ ] Delete unused legacy tables

### Priority 3: Verify External Services ⚠️
- [ ] All 7 services are implemented
- [ ] Just need API keys configured
