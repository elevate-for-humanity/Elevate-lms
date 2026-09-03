# 🔴 TABLE MAPPING: MISSING vs ORPHANED - SIDE BY SIDE

**Date:** July 7, 2026  
**Purpose:** Map orphaned tables to fill missing tables

---

## SUMMARY

```
TABLES IN CODE:          560
TABLES IN MIGRATIONS:  1,280

NEED TO CREATE:           115 (missing tables)
CAN USE EXISTING:         835 (orphaned tables)

AFTER MAPPING:
- CAN FILL FROM ORPHANED:  ~80
- STILL NEED TO CREATE:     ~35
```

---

## PART 1: TABLE MAPPING BY CATEGORY

### 🔵 AI/MACHINE LEARNING

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `ai_conversation_memory` | `ai_chat_history`, `ai_messages` | USE `ai_chat_history` |
| `ai_guardrail_logs` | `ai_tutor_interactions` | USE or CREATE |

**Available orphaned:** ai_chat_history, ai_course_generation_log, ai_generated_courses, ai_generations, ai_instructor_assignments, ai_instructors, ai_interview_assessments, ai_job_matches, ai_messages, ai_operator_memory, ai_plan_executions, ai_planner_tasks, ai_tutor_interactions

---

### 🔵 COURSE MANAGEMENT

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `course-content` | (use `course_videos`) | USE `course_videos` |
| `course-videos` | `course_videos` | **EXACT MATCH** |
| `course_generation_jobs` | `ai_course_generation_log`, `ai_generated_courses` | USE `ai_generated_courses` |

**Available orphaned:** course_access, course_accreditation_metadata, course_categories, course_competencies, course_credentials, course_discussions, course_embeddings, course_lesson_versions, course_metrics, course_module_settings, course_objectives, course_progress, course_publish_audits, course_recommendations, course_syllabi, course_tasks, course_templates, course_vendor_links, course_version_lessons, course_version_modules, **course_videos**

---

### 🔵 CREDENTIALS/CERTIFICATIONS

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `certifications` | `certification_bodies`, `credentialing_partners` | USE `certification_bodies` |
| `cert_revocation_log` | `certification_audit_log` | USE `certification_audit_log` |
| `certification_submissions` | `credential_submissions` | **RENAME** `credential_submissions` → `certification_submissions` |
| `credentials` | `credential_blueprints`, `credential_submissions` | USE `credential_blueprints` |
| `credential_attempts` | `assessment_attempts`, `quiz_attempts` | USE `assessment_attempts` |
| `external_credentials` | `external_course_access`, `external_modules` | USE `external_course_access` |
| `learner_credentials` | `student_credentials` | **RENAME** `student_credentials` → `learner_credentials` |
| `program_credentials` | `course_credentials`, `credential_submissions` | USE `course_credentials` |

**Available orphaned:** course_credentials, credential_blueprint_competencies, credential_blueprint_domains, **credential_blueprints**, credential_domains, credential_exam_domains, credential_generation_rules, credential_providers, **credential_submissions**, credential_validation_rules, credentialing_partners, partner_credentials, **student_credentials**

---

### 🔵 ENROLLMENT

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `program_enrollments` | `partner_course_enrollments`, `enrollment_*` tables | **USE `partner_course_enrollments`** |
| `external_course_completions` | `external_lms_enrollments` | USE `external_lms_enrollments` |

**Available orphaned:** benefits_enrollments, cobra_enrollments, enrollment_acknowledgments, enrollment_agreements, enrollment_bypass_allowlist, enrollment_funding_records, enrollment_funding_status_log, enrollment_insert_audit, enrollment_jobs, enrollment_module_progress, enrollment_payments, enrollment_status_history, enrollment_transitions, enrollment_voucher_audit, external_lms_enrollments, hsi_enrollment_queue, milady_enrollments, milady_rise_enrollments, **partner_course_enrollments**, partner_lms_enrollment_failures, program_enrollment_tracks, reporting_enrollments, training_enrollments

---

### 🔵 EXAMS/TESTING

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `exam_authorizations` | `exam_authorization_queue` | **RENAME** `exam_authorization_queue` → `exam_authorizations` |
| `exam_events` | (use `exam_session_events`) | USE `exam_session_events` |
| `exam_sessions` | `exam_session_events` | **RENAME** `exam_session_events` → `exam_sessions` |
| `testing_leads` | (no match) | CREATE NEW |
| `certiport_exam_requests` | (no match) | CREATE NEW |

**Available orphaned:** exam_authorization_queue, **exam_outcome_tracking**, **exam_ready_status**, **exam_session_events**

---

### 🔵 PROGRAMS

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `program_courses` | `program_course_links`, `program_course_map` | **USE** `program_course_links` |
| `program_completion` | `program_completion_candidates` | **RENAME** `program_completion_candidates` → `program_completion` |
| `program_outcomes` | (no exact match) | CREATE or USE `program_reviews` |
| `program_requirements` | `program_required_courses` | **RENAME** `program_required_courses` → `program_requirements` |
| `program_external_courses` | `external_modules` | USE `external_modules` |
| `program_external_completions` | `external_module_progress` | USE `external_module_progress` |
| `program_holder_call_log` | (no match) | CREATE NEW |
| `module_certificates` | `module_certificates` | **EXACT MATCH - in code already** |
| `lesson_completions` | `course_lesson_versions`, `lesson_completions` | **EXACT MATCH** |

**Available orphaned:** program_announcements, program_banner_views, program_catalog, program_cohorts, **program_completion_candidates**, program_course_activity, **program_course_links**, **program_course_map**, program_course_versions, program_ctas, program_curriculum_modules, program_enrollment_tracks, program_funding, program_funding_links, program_funding_options, program_holder_applications, program_holder_banking, program_holder_payouts, program_holder_reports, program_lessons, program_media, program_modules, program_organizations, program_partner_lms, program_phases, **program_required_courses**, program_requirement_rules, program_revenue, program_review_log, program_reviews, program_sponsorships, program_tracks, program_versions, program_wioa_compliance_forms, programs_for_holder

---

### 🔵 PARTNER/HOST SHOP

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `partners` | `partner_organizations`, `partner_profiles` | USE `partner_organizations` |
| `partner_applications` | `partner_acknowledgments` | **RENAME** `partner_acknowledgments` → `partner_applications` |
| `partner_users` | (already in code) | ✅ EXISTS |
| `partner_mous` | `mou_documents` | **RENAME** `mou_documents` → `partner_mous` |
| `mou_templates` | (no match) | CREATE NEW |
| `host_shop_applications` | `host_shop_apprentices`, `host_shop_evaluations` | **RENAME** `host_shop_evaluations` → `host_shop_applications` |
| `host_shop_partnerships` | `host_shop_subscriptions`, `host_shops` | **USE** `host_shops` |
| `provider_applications` | (use `partner_applications`) | USE `partner_applications` |
| `barber_subscriptions` | (use `host_shop_subscriptions`) | USE `host_shop_subscriptions` |
| `nail_partner_applications` | (use `partner_applications`) | USE `partner_applications` |
| `agreement_acceptances` | `agreement_signatures` | **RENAME** `agreement_signatures` → `agreement_acceptances` |
| `agreement_versions` | (use `agreements`) | USE `agreements` |

**Available orphaned:** partner_acknowledgment_items, **partner_acknowledgments**, partner_course_enrollments, partner_course_payments, partner_courses_catalog, partner_credentials, partner_lms_enrollment_failures, **partner_organizations**, **partner_profiles**, partner_program_courses, partner_seat_orders, partner_sessions, **partner_shops**, partner_site_inspections, partner_sites, partner_types, **host_shop_apprentices**, **host_shop_evaluations**, **host_shop_subscriptions**, **host_shops**, shop_applications, shop_categories, shop_document_requirements, shop_orders, shop_products, shop_profiles, shop_reports, shop_required_docs_status, shop_signatures, shop_weekly_reports

---

### 🔵 WORKFLOW/AUTOMATION

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `workflow_triggers` | `automation_triggers` | **RENAME** `automation_triggers` → `workflow_triggers` |
| `workflow_steps` | `approval_chain_steps` | **RENAME** `approval_chain_steps` → `workflow_steps` |
| `workflow_runs` | `automation_execution_log` | **RENAME** `automation_execution_log` → `workflow_runs` |
| `workflow_dead_letters` | (no match) | CREATE NEW |
| `automated_decisions` | `automation_rules` | **RENAME** `automation_rules` → `automated_decisions` |

**Available orphaned:** approval_chain_definitions, **approval_chain_steps**, approval_tokens, **automation_action_queue**, **automation_execution_log**, **automation_rules**, **automation_triggers**, autopilot_logs, autopilot_settings, process_steps, processes

---

### 🔵 PAYMENTS/ECOMMERCE

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `payments` | `payment_transactions`, `payment_records` | USE `payment_transactions` |
| `application_payments` | `enrollment_payments` | **RENAME** `enrollment_payments` → `application_payments` |
| `coupons` | `promo_codes` | **RENAME** `promo_codes` → `coupons` |
| `store_subscription_pricing` | `subscription_plans` | **RENAME** `subscription_plans` → `store_subscription_pricing` |
| `subscription_invoices` | (no exact match) | CREATE NEW |
| `processed_webhook_events` | `webhook_logs`, `webhook_deliveries` | USE `webhook_logs` |

**Available orphaned:** payment_methods, payment_options, payment_plan_selections, payment_plans, **payment_records**, payment_sessions, **payment_transactions**, payouts, payroll, payroll_records, **promo_codes**, **subscription_plans**, tender, **webhook_deliveries**, **webhook_logs**, webhooks

---

### 🔵 COMMUNICATIONS/MESSAGING

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `conversations` | `chat_conversations`, `direct_messages` | **RENAME** `chat_conversations` → `conversations` |
| `live_chat_messages` | (use `messages`) | USE `messages` |
| `live_chat_sessions` | (use `chat_conversations`) | USE `chat_conversations` |
| `notifications` | `notification_outbox` (close match) | **RENAME** `notification_outbox` → `notifications` |
| `sms_messages` | (no match) | CREATE NEW |
| `public_ai_tutor_logs` | `ai_tutor_interactions` | **RENAME** `ai_tutor_interactions` → `public_ai_tutor_logs` |
| `scheduled_messages` | (no match) | CREATE NEW |

**Available orphaned:** announcement_recipients, **chat_conversations**, collaboration_messages, direct_messages, group_messages, live_chat_messages, message_notifications, message_threads, messages, **notification_outbox**, push_notification_tokens, push_notification_send_log, push_tokens, sms_reminders

---

### 🔵 COMPLIANCE/LICENSING

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `licenses` | `license_keys`, `license_tiers` | USE `license_keys` |
| `license_events` | `license_audit_log` | **RENAME** `license_audit_log` → `license_events` |
| `license_validations` | `license_usage_log` | **RENAME** `license_usage_log` → `license_validations` |
| `managed_licenses` | (use `license_keys`) | USE `license_keys` |
| `compliance_alerts` | `compliance_flags` | **RENAME** `compliance_flags` → `compliance_alerts` |
| `compliance_audit_log` | `compliance_documents` | **RENAME** `compliance_documents` → `compliance_audit_log` |
| `id_verifications` | `identity_verifications` | **RENAME** `identity_verifications` → `id_verifications` |
| `verify_audit` | (no match) | CREATE NEW |
| `license_agreement_acceptances` | `agreement_signatures` | USE `agreement_signatures` |

**Available orphaned:** compliance_documents, compliance_events, compliance_flags, compliance_profiles, compliance_violations, license_audit_log, license_keys, license_tiers, license_usage, **license_usage_log**, license_violations, identity_verifications

---

### 🔵 ADMIN/PLATFORM

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `announcements` | `program_announcements` | **RENAME** `program_announcements` → `announcements` |
| `audit_logs` | `admin_audit_log` | **RENAME** `admin_audit_log` → `audit_logs` |
| `blog_posts` | (no match) | CREATE NEW |
| `campaigns` | `marketing_campaigns` | **RENAME** `marketing_campaigns` → `campaigns` |
| `communications` | (use `announcements`) | USE `announcements` |
| `events` | `case_events`, `compliance_events` | USE `case_events` |
| `leads` | `crm_leads` | **RENAME** `crm_leads` → `leads` |
| `newsletter_subscribers` | `newsletter_subscriptions` | **RENAME** `newsletter_subscriptions` → `newsletter_subscribers` |
| `waitlist` | `waitlist_entries` | **RENAME** `waitlist_entries` → `waitlist` |
| `calculator_usage` | (no match) | CREATE NEW |
| `checkout_contexts` | (no match) | CREATE NEW |
| `job_queue` | `enrollment_jobs` | **RENAME** `enrollment_jobs` → `job_queue` |
| `cron_job_runs` | `timeclock_cron_runs` | **RENAME** `timeclock_cron_runs` → `cron_job_runs` |
| `review_queue` | `moderation_queue` | **RENAME** `moderation_queue` → `review_queue` |
| `shop_recommendations` | (use `course_recommendations`) | USE `course_recommendations` |
| `sop_templates` | `contract_templates` | **RENAME** `contract_templates` → `sop_templates` |
| `site_settings` | `organization_settings` | **RENAME** `organization_settings` → `site_settings` |
| `social_media_posts` | `social_media_queue` | **RENAME** `social_media_queue` → `social_media_posts` |
| `social_media_settings` | `social_media_accounts` | **RENAME** `social_media_accounts` → `social_media_settings` |

**Available orphaned:** **admin_audit_events**, **admin_audit_log**, **admin_priority_queue**, announcement_recipients, api_keys, api_request_logs, **case_events**, checkout_contexts, **contract_templates**, **crm_leads**, **enrollment_jobs**, **marketing_campaigns**, **moderation_queue**, **newsletter_subscriptions**, **organization_settings**, **program_announcements**, **social_media_accounts**, **social_media_queue**, **timeclock_cron_runs**, **waitlist_entries**

---

### 🔵 KNOWLEDGE/AI

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `knowledge_documents` | `platform_knowledge_chunks` | **RENAME** `platform_knowledge_chunks` → `knowledge_documents` |
| `knowledge_embeddings` | `rag_embeddings` | **RENAME** `rag_embeddings` → `knowledge_embeddings` |
| `ocr_extractions` | (no match) | CREATE NEW |

**Available orphaned:** knowledge_base, **platform_knowledge_chunks**, **rag_embeddings**, sos_document_data_sources, sos_document_templates

---

### 🔵 APPRENTICESHIP

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `apprentices` | `rapids_apprentices` | **RENAME** `rapids_apprentices` → `apprentices` |
| `apprentice_applications` | (use `partner_applications`) | USE `partner_applications` |
| `apprentice_placements` | `ojt_placements` | **RENAME** `ojt_placements` → `apprentice_placements` |
| `apprentice_sites` | `apprenticeship_shops` | **RENAME** `apprenticeship_shops` → `apprentice_sites` |
| `apprentice_skills` | `competency_results` | **RENAME** `competency_results` → `apprentice_skills` |
| `hour_entries` | `hour_logs`, `hours_logs` | USE `hour_logs` |
| `hour_transfer_requests` | (no match) | CREATE NEW |
| `rapids_apprentices` | (will be renamed to `apprentices`) | **ALREADY MAPPED** |

**Available orphaned:** apprentice_agreements, apprentice_assignments, **apprentice_documents**, **apprentice_hour_totals**, apprentice_hours_by_shop, apprentice_hours_by_source, **apprentice_hours_log**, apprentice_notifications, **apprentice_payroll**, apprentice_service_logs, apprentice_uploads, apprentice_wage_updates, apprenticeship_hours_summary, apprenticeship_portfolio, apprenticeship_shop_drafts, **apprenticeship_shops**, barber_instructor_signoffs, **competency_results**, competency_signoffs, **hour_logs**, **hours_logs**, **ojt_logs**, **ojt_notes**, **ojt_placements**, rapids_apprentice_data, student_skill_signoffs

---

### 🔵 STAFF/HR

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `staff_users` | (already created in migration) | ✅ DONE |
| `staff_attendance` | `attendance_records` | **RENAME** `attendance_records` → `staff_attendance` |
| `staffs` | `staff_applications` | **RENAME** `staff_applications` → `staffs` |
| `instructor_attestations` | `instructor_profiles` | **RENAME** `instructor_profiles` → `instructor_attestations` |

**Available orphaned:** **attendance_records**, staff_applications, staff_notifications, staff_processes, staff_training_modules, staff_training_progress, **instructor_profiles**

---

### 🔵 TRAINING

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `training_simulations` | `training_lessons` | **RENAME** `training_lessons` → `training_simulations` |
| `sim_attempts` | `practice_attempts` | **RENAME** `practice_attempts` → `sim_attempts` |

**Available orphaned:** training_access_keys, training_enrollments, training_hours, **training_lessons**, training_modules, training_partners, training_progress, training_providers, training_purchases, training_videos, **practice_attempts**, practice_exam_blueprints

---

### 🔵 WORKFORCE/WIOA

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `wioa_compliance_reports` | `wioa_documents` | **RENAME** `wioa_documents` → `wioa_compliance_reports` |
| `wioa_participant_records` | `wioa_applications` | **RENAME** `wioa_applications` → `wioa_participant_records` |
| `workforce_analytics` | (no match) | CREATE NEW |
| `workforce_cases` | (use `cases`) | USE `cases` |
| `workforce_funding` | `funding_records` | **RENAME** `funding_records` → `workforce_funding` |
| `workforce_participants` | `participants` | **RENAME** `participants` → `workforce_participants` |
| `workone_checklist` | (no match) | CREATE NEW |

**Available orphaned:** funding_applications, funding_cases, funding_change_audit, funding_programs, **funding_records**, funding_tracking, funding_verification_escalations, **cases**, **participants**, **wioa_applications**, **wioa_documents**, wioa_exports, wioa_report_runs, wioa_services

---

### 🔵 OTHER/MISC

| MISSING TABLE | ORPHANED TABLE(S) AVAILABLE | ACTION |
|--------------|---------------------------|--------|
| `cohort_sessions` | `program_cohorts` | **RENAME** `program_cohorts` → `cohort_sessions` |
| `grades` | `grade_records` | **RENAME** `grade_records` → `grades` |
| `progress_entries` | `student_progress` | **RENAME** `student_progress` → `progress_entries` |
| `student_documents` | `apprentice_documents`, `user_documents` | **RENAME** `apprentice_documents` → `student_documents` |
| `student_tasks` | `tasks` | **RENAME** `tasks` → `student_tasks` |
| `study_groups` | `study_sessions` | **RENAME** `study_sessions` → `study_groups` |
| `study_group_members` | `study_group_members` | **EXACT MATCH** |
| `studio_workspaces` | `workspace_domains` | **RENAME** `workspace_domains` → `studio_workspaces` |
| `partner_audit_log` | `admin_audit_log` | **RENAME** `admin_audit_log` → `partner_audit_log` |
| `partner_document_requirements` | `shop_document_requirements` | **RENAME** `shop_document_requirements` → `partner_document_requirements` |
| `partner_export_logs` | (no match) | CREATE NEW |
| `partner_program_access` | `program_enrollment_tracks` | **RENAME** `program_enrollment_tracks` → `partner_program_access` |

**Available orphaned:** **grade_records**, **student_progress**, **study_sessions**, **workspace_domains**, **admin_audit_log**, **shop_document_requirements**, **program_enrollment_tracks**, study_group_members

---

## PART 2: TABLES THAT CAN BE RENAMED/MAPPED (~80)

| # | MISSING (CODE) | ORPHANED (MIGRATION) | ACTION |
|---|---------------|---------------------|--------|
| 1 | ai_conversation_memory | ai_chat_history | RENAME |
| 2 | course-content | course_videos | USE |
| 3 | course-videos | course_videos | ✅ EXACT |
| 4 | course_generation_jobs | ai_generated_courses | RENAME |
| 5 | certifications | certification_bodies | RENAME |
| 6 | cert_revocation_log | certification_audit_log | RENAME |
| 7 | certification_submissions | credential_submissions | RENAME |
| 8 | credentials | credential_blueprints | USE |
| 9 | credential_attempts | assessment_attempts | USE |
| 10 | external_credentials | external_course_access | RENAME |
| 11 | learner_credentials | student_credentials | RENAME |
| 12 | program_credentials | course_credentials | USE |
| 13 | program_enrollments | partner_course_enrollments | RENAME |
| 14 | external_course_completions | external_lms_enrollments | RENAME |
| 15 | exam_authorizations | exam_authorization_queue | RENAME |
| 16 | exam_events | exam_session_events | RENAME |
| 17 | exam_sessions | exam_session_events | RENAME |
| 18 | program_courses | program_course_links | USE |
| 19 | program_completion | program_completion_candidates | RENAME |
| 20 | program_outcomes | program_reviews | RENAME |
| 21 | program_requirements | program_required_courses | RENAME |
| 22 | program_external_courses | external_modules | USE |
| 23 | program_external_completions | external_module_progress | RENAME |
| 24 | partners | partner_organizations | RENAME |
| 25 | partner_applications | partner_acknowledgments | RENAME |
| 26 | partner_mous | mou_documents | RENAME |
| 27 | host_shop_applications | host_shop_evaluations | RENAME |
| 28 | host_shop_partnerships | host_shops | RENAME |
| 29 | agreement_acceptances | agreement_signatures | RENAME |
| 30 | agreement_versions | agreements | RENAME |
| 31 | workflow_triggers | automation_triggers | RENAME |
| 32 | workflow_steps | approval_chain_steps | RENAME |
| 33 | workflow_runs | automation_execution_log | RENAME |
| 34 | automated_decisions | automation_rules | RENAME |
| 35 | payments | payment_transactions | RENAME |
| 36 | application_payments | enrollment_payments | RENAME |
| 37 | coupons | promo_codes | RENAME |
| 38 | store_subscription_pricing | subscription_plans | RENAME |
| 39 | processed_webhook_events | webhook_logs | RENAME |
| 40 | conversations | chat_conversations | RENAME |
| 41 | notifications | notification_outbox | RENAME |
| 42 | public_ai_tutor_logs | ai_tutor_interactions | RENAME |
| 43 | licenses | license_keys | RENAME |
| 44 | license_events | license_audit_log | RENAME |
| 45 | license_validations | license_usage_log | RENAME |
| 46 | compliance_alerts | compliance_flags | RENAME |
| 47 | compliance_audit_log | compliance_documents | RENAME |
| 48 | id_verifications | identity_verifications | RENAME |
| 49 | announcements | program_announcements | RENAME |
| 50 | audit_logs | admin_audit_log | RENAME |
| 51 | campaigns | marketing_campaigns | RENAME |
| 52 | leads | crm_leads | RENAME |
| 53 | newsletter_subscribers | newsletter_subscriptions | RENAME |
| 54 | waitlist | waitlist_entries | RENAME |
| 55 | job_queue | enrollment_jobs | RENAME |
| 56 | cron_job_runs | timeclock_cron_runs | RENAME |
| 57 | review_queue | moderation_queue | RENAME |
| 58 | sop_templates | contract_templates | RENAME |
| 59 | site_settings | organization_settings | RENAME |
| 60 | social_media_posts | social_media_queue | RENAME |
| 61 | social_media_settings | social_media_accounts | RENAME |
| 62 | knowledge_documents | platform_knowledge_chunks | RENAME |
| 63 | knowledge_embeddings | rag_embeddings | RENAME |
| 64 | apprentices | rapids_apprentices | RENAME |
| 65 | apprentice_placements | ojt_placements | RENAME |
| 66 | apprentice_sites | apprenticeship_shops | RENAME |
| 67 | apprentice_skills | competency_results | RENAME |
| 68 | hour_entries | hour_logs | RENAME |
| 69 | staff_attendance | attendance_records | RENAME |
| 70 | staffs | staff_applications | RENAME |
| 71 | instructor_attestations | instructor_profiles | RENAME |
| 72 | training_simulations | training_lessons | RENAME |
| 73 | sim_attempts | practice_attempts | RENAME |
| 74 | wioa_compliance_reports | wioa_documents | RENAME |
| 75 | wioa_participant_records | wioa_applications | RENAME |
| 76 | workforce_funding | funding_records | RENAME |
| 77 | workforce_participants | participants | RENAME |
| 78 | cohort_sessions | program_cohorts | RENAME |
| 79 | grades | grade_records | RENAME |
| 80 | progress_entries | student_progress | RENAME |
| 81 | student_documents | apprentice_documents | RENAME |
| 82 | student_tasks | tasks | RENAME |
| 83 | study_groups | study_sessions | RENAME |
| 84 | studio_workspaces | workspace_domains | RENAME |
| 85 | partner_audit_log | admin_audit_log | RENAME |
| 86 | partner_document_requirements | shop_document_requirements | RENAME |
| 87 | partner_program_access | program_enrollment_tracks | RENAME |

---

## PART 3: TABLES STILL NEED TO CREATE (~28)

These tables have NO orphaned match and MUST be created:

| # | Table Name | Category |
|---|-----------|----------|
| 1 | testing_leads | Testing |
| 2 | certiport_exam_requests | Testing |
| 3 | program_holder_call_log | Program |
| 4 | mou_templates | Partner |
| 5 | workflow_dead_letters | Workflow |
| 6 | subscription_invoices | E-Commerce |
| 7 | sms_messages | Communications |
| 8 | scheduled_messages | Communications |
| 9 | verify_audit | Compliance |
| 10 | blog_posts | Admin |
| 11 | calculator_usage | Admin |
| 12 | checkout_contexts | Admin |
| 13 | shop_recommendations | Admin |
| 14 | ocr_extractions | Knowledge |
| 15 | hour_transfer_requests | Apprenticeship |
| 16 | apprentice_applications | Apprenticeship |
| 17 | barber_subscriptions | Partner |
| 18 | nail_partner_applications | Partner |
| 19 | provider_applications | Partner |
| 20 | workforce_analytics | Workforce |
| 21 | workone_checklist | Workforce |
| 22 | partner_export_logs | Partner |
| 23 | license_agreement_acceptances | Compliance |
| 24 | managed_licenses | Compliance |
| 25 | workforce_cases | Workforce |
| 26 | communications | Admin |
| 27 | events | Admin |
| 28 | staff_users | Staff |
| 29 | staffs | Staff |
| 30 | module_certificates | Program |

**Note:** `staff_users` and `staffs` are already in the migration I created earlier.

---

## PART 4: TABLES THAT EXIST AND ARE ALREADY IN CODE (445)

These tables exist in BOTH migrations AND code - no action needed.

---

## ACTION ITEMS

### DO NOW: Rename orphaned tables to match code

```sql
-- Rename orphaned tables to match code references
ALTER TABLE ai_chat_history RENAME TO ai_conversation_memory;
ALTER TABLE course_videos RENAME TO course_videos;  -- Already correct
ALTER TABLE ai_generated_courses RENAME TO course_generation_jobs;
ALTER TABLE certification_bodies RENAME TO certifications;
-- ... etc
```

### DO LATER: Create missing tables

Create migrations for the 28 tables that have no orphaned equivalent.

### VERIFY: Run the application and check for errors

After renaming, run typecheck and build to verify all tables match.
