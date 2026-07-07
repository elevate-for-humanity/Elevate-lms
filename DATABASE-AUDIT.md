# 🔴 DATABASE AUDIT REPORT

**Date:** July 7, 2026  
**Status:** CRITICAL ISSUES FOUND

---

## SUMMARY

| Category | Count |
|----------|-------|
| Tables used in code | 560 |
| Tables in migrations | 1,269 |
| **MISSING from migrations** | **139** |
| Orphaned (unused) tables | 1,130 |

---

## ⚠️ CRITICAL: MISSING TABLES (139)

These tables are used in the code but NOT defined in migrations:

```
agreement_acceptances
agreement_versions
ai_conversation_memory
ai_guardrail_logs
announcements
application_payments
apprentice_applications
apprentice_placements
apprentice_sites
apprentice_skills
apprentices
automated_decisions
barber_subscriptions
blog_posts
calculator_usage
campaigns
career_course_purchases
career_courses
cert_revocation_log
certification_submissions
certifications
certiport_exam_requests
checkout_contexts
cohort_sessions
communications
compliance_alerts
compliance_audit_log
conversations
coupons
course-content
course-videos
course_generation_jobs
credential_attempts
credentials
cron_job_runs
curriculum_lessons
employer_documents
events
exam_authorizations
exam_events
exam_sessions
external_course_completions
external_credentials
grades
handbook_acknowledgments
handbooks
host_shop_applications
host_shop_partnerships
hour_entries
hour_transfer_requests
id_verifications
instructor_attestations
job_queue
knowledge_documents
knowledge_embeddings
leads
learner_credentials
lesson_completions
lesson_progress
license_events
license_validations
licenses
live_chat_messages
live_chat_sessions
lms_courses
managed_licenses
marketplace_products
marketplace_reports
module-certificates
module_certificates
mou_templates
nail_partner_applications
newsletter_subscribers
notification_outbox
ocr_extractions
organization_settings
partner_applications
partner_audit_log
partner_document_requirements
partner_export_logs
partner_mous
partner_program_access
partner_users
partners
payments
processed_webhook_events
program_completion
program_courses
program_credentials
program_enrollments
program_external_completions
program_external_courses
program_holder_call_log
program_outcomes
program_requirements
progress_entries
promo_codes
provider_applications
public_ai_tutor_logs
push_subscriptions
rapids_apprentices
review_queue
scheduled_messages
shop_recommendations
sim_attempts
site_settings
sms_messages
social_media_posts
social_media_settings
sop_templates
staff_attendance
staff_users
staffs
store_subscription_pricing
student_documents
student_tasks
studio_workspaces
study_group_members
study_groups
subscription_invoices
system_settings
testing_leads
testing_sessions
training_simulations
user_learning_paths
user_skills
verify_audit
w9_submissions
waitlist
wioa_compliance_reports
workflow_dead_letters
workflow_runs
workflow_step_logs
workflow_steps
workflow_triggers
workforce_analytics
workforce_cases
workforce_funding
workforce_participants
workone_checklist
```

---

## 🔍 ROOT CAUSE ANALYSIS

### Possible Causes:

1. **Dynamic table creation** - Tables might be created by external services
2. **Supabase built-in tables** - Some might be Supabase system tables
3. **Code from other branches** - Tables referenced but not yet migrated
4. **Legacy code** - Old tables no longer in migrations
5. **Missing migrations** - Migrations were deleted or not committed

---

## 📋 CRITICAL TABLES GROUPED BY FEATURE

### Apprenticeship System
- `apprentices`
- `apprentice_applications`
- `apprentice_placements`
- `apprentice_sites`
- `apprentice_skills`
- `hour_entries`
- `hour_transfer_requests`
- `rapids_apprentices`

### Education/LMS
- `certifications`
- `credential_attempts`
- `credentials`
- `curriculum_lessons`
- `external_course_completions`
- `external_credentials`
- `grades`
- `learner_credentials`
- `lesson_completions`
- `lesson_progress`
- `lms_courses`
- `module_certificates`
- `program_completion`
- `program_courses`
- `program_credentials`
- `program_enrollments`
- `program_external_courses`
- `program_requirements`
- `progress_entries`
- `user_learning_paths`

### Partner/Host Shop
- `agreement_acceptances`
- `agreement_versions`
- `host_shop_applications`
- `host_shop_partnerships`
- `mou_templates`
- `nail_partner_applications`
- `partner_applications`
- `partner_audit_log`
- `partner_document_requirements`
- `partner_export_logs`
- `partner_mous`
- `partner_program_access`
- `partner_users`
- `partners`
- `program_holder_call_log`

### Employer
- `employer_documents`

### Staff Portal
- `staff_attendance`
- `staff_users`
- `staffs`

### Admin/Platform
- `ai_conversation_memory`
- `ai_guardrail_logs`
- `blog_posts`
- `campaigns`
- `communications`
- `compliance_alerts`
- `compliance_audit_log`
- `conversations`
- `knowledge_documents`
- `knowledge_embeddings`
- `notification_outbox`
- `organization_settings`
- `processed_webhook_events`
- `scheduled_messages`
- `sms_messages`
- `social_media_posts`
- `social_media_settings`
- `sop_templates`
- `system_settings`

### E-Commerce/Payments
- `application_payments`
- `barber_subscriptions`
- `calculator_usage`
- `career_course_purchases`
- `career_courses`
- `checkout_contexts`
- `coupons`
- `promo_codes`
- `store_subscription_pricing`
- `subscription_invoices`

### Testing/Certifications
- `cert_revocation_log`
- `certification_submissions`
- `certiport_exam_requests`
- `exam_authorizations`
- `exam_events`
- `exam_sessions`
- `testing_leads`
- `testing_sessions`

### Compliance/Handbook
- `handbook_acknowledgments`
- `handbooks`
- `license_events`
- `license_validations`
- `licenses`
- `w9_submissions`
- `verify_audit`
- `wioa_compliance_reports`

### Chat/AI
- `live_chat_messages`
- `live_chat_sessions`
- `public_ai_tutor_logs`

### Other
- `announcements`
- `automated_decisions`
- `cohort_sessions`
- `course-content`
- `course-videos`
- `course_generation_jobs`
- `events`
- `id_verifications`
- `instructor_attestations`
- `job_queue`
- `leads`
- `managed_licenses`
- `marketplace_products`
- `marketplace_reports`
- `newsletter_subscribers`
- `ocr_extractions`
- `provider_applications`
- `push_subscriptions`
- `review_queue`
- `shop_recommendations`
- `sim_attempts`
- `site_settings`
- `student_documents`
- `student_tasks`
- `studio_workspaces`
- `study_group_members`
- `study_groups`
- `training_simulations`
- `user_skills`
- `waitlist`
- `workflow_dead_letters`
- `workflow_runs`
- `workflow_step_logs`
- `workflow_steps`
- `workflow_triggers`
- `workforce_analytics`
- `workforce_cases`
- `workforce_funding`
- `workforce_participants`
- `workone_checklist`

---

## ✅ ORPHANED TABLES (1,130)

Tables defined in migrations but NOT used in code. These should be reviewed for cleanup.

See full list in `/tmp/orphaned_tables.txt`

---

## 🎯 RECOMMENDED ACTIONS

### Priority 1: Create Migrations for Critical Tables

**Group A - Core Apprenticeship (10 tables)**
```sql
apprentices
apprentice_applications  
apprentice_placements
apprentice_sites
apprentice_skills
hour_entries
hour_transfer_requests
rapids_apprentices
```

**Group B - Education/LMS (20 tables)**
```sql
certifications
credentials
curriculum_lessons
lms_courses
module_certificates
program_enrollments
program_courses
program_completion
```

**Group C - Partner/Host Shop (15 tables)**
```sql
agreement_acceptances
agreement_versions
host_shop_applications
host_shop_partnerships
partner_applications
partner_users
partners
```

**Group D - Staff Portal (3 tables)**
```sql
staff_users
staffs
staff_attendance
```

### Priority 2: Verify External Services
Some tables might be from:
- Supabase Auth (handled by Supabase)
- Stripe (handled by Stripe)
- External APIs

### Priority 3: Clean Up Orphans
Review and remove unused tables after verifying they're not needed.

---

## 📊 PORTAL-SPECIFIC TABLE STATUS

| Portal | Tables Used | In Migrations | Missing |
|--------|------------|--------------|---------|
| Admin | ~200 | ~200 | ~50 |
| Employer | ~15 | ~15 | 1 (employer_documents) |
| Host Shop | ~25 | ~25 | ~10 |
| Apprentice | ~20 | ~20 | ~15 |
| Case Manager | ~15 | ~15 | ~5 |
| Staff Portal | ~10 | ~10 | ~5 |
| LMS | ~30 | ~30 | ~15 |

---

**Audit Complete:** July 7, 2026  
**Action Required:** Create migrations for 139 missing tables
