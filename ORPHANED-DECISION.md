# 🔴 ORPHANED TABLES DECISION LIST

**Date:** July 7, 2026  
**Total Orphaned:** 835 tables  
**Tables Renamed:** 87 (via migration)  
**Tables Created:** 22 (via migration)  
**TRULY ORPHANED Remaining:** ~748 tables

---

## WHAT TO DO WITH THESE TABLES

### OPTION A: DELETE (Legacy/Not Used)
These tables are for features that are NOT being built or are deprecated.

| # | Table | Why Delete |
|---|-------|-----------|
| 1 | `academic_integrity_violations` | Not part of current system |
| 2 | `accessibility_preferences` | Not implemented |
| 3 | `accreditation_*` (5 tables) | Accreditation not built |
| 4 | `affiliate_*` (3 tables) | Affiliate system not built |
| 5 | `ambient_music_log` | Not implemented |
| 6 | `api_keys` | Use Supabase auth instead |
| 7 | `api_request_logs` | Not used |
| 8 | `app_screenshot_views` | Not implemented |
| 9 | `appointment_types` | Not used |
| 10 | `assessment_*` (3 tables) | Testing system separate |
| 11 | `assignment_rubrics` | Not used |
| 12 | `attendance_hours` | Use staff_attendance |
| 13 | `audio_preferences` | Not implemented |
| 14 | `avatars` | Not implemented |
| 15 | `badge_definitions` | Gamification not built |
| 16 | `bank_accounts` | Banking not built |
| 17 | `banking_services` | Banking not built |
| 18 | `benefits_*` (2 tables) | Benefits not built |
| 19 | `billing_cycles` | Use Stripe instead |
| 20 | `bookings` | Not used |
| 21 | `captcha_attempts` | Use Cloudflare Turnstile |
| 22 | `cash_advance_*` (2 tables) | Not built |
| 23 | `certificate_funding_status_log` | Not used |
| 24 | `chat_conversations` | Use conversations (renamed) |
| 25 | `client_consents` | Use consent_records |
| 26 | `clinical_*` (5 tables) | CMI not built |
| 27 | `cobra_enrollments` | Not implemented |
| 28 | `code_examples` | Not used |
| 29 | `collaboration_*` (2 tables) | Not built |
| 30 | `community_*` (6 tables) | Community not built |
| 31 | `competency_tests` | Use existing assessments |
| 32 | `compliance_violations` | Not used |
| 33 | `contact_hours` | Not used |
| 34 | `contact_submissions` | Use inquiries |
| 35 | `content_approvals` | Not used |
| 36 | `content_library` | Not implemented |
| 37 | `content_pages` | Use pages table |
| 38 | `content_sync_log` | Not used |
| 39 | `contract_*` (5 tables) | Not built |
| 40 | `cookie_consent_log` | Use platform consent |
| 41 | `copilot_usage_log` | AI not used this way |
| 42 | `cta_clicks` | Analytics not built |
| 43 | `curriculum_*` (7 tables) | Curriculum builder not built |
| 44 | `curvature_reviews` | Not implemented |
| 45 | `customer_service_protocols` | Not used |
| 46 | `daily_activities` | Not used |
| 47 | `dashboards` | Not used |
| 48 | `data_deletion_requests` | Use Supabase auth |
| 49 | `data_processing_jobs` | Not used |
| 50 | `data_retention_policies` | Not implemented |
| 51 | `data_sharing_agreements` | Not built |
| 52 | `delegate_assignments` | Not used |
| 53 | `delivery_logs` | Not used |
| 54 | `demo_analytics` | Not used |
| 55 | `departments` | Use profiles/roles |
| 56 | `dependents` | Not built |
| 57 | `devstudio_*` (3 tables) | Dev tools not built |
| 58 | `digital_binders` | Digital binder not built |
| 59 | `direct_deposit_accounts` | Banking not built |
| 60 | `direct_messages` | Use conversations |
| 61 | `discussion_*` (4 tables) | Forum not built |
| 62 | `dmca_takedown_requests` | Not implemented |
| 63 | `donation_tiers` | Donations not built |
| 64 | `drug_test_*` (4 tables) | Drug testing not built |
| 65 | `ecr_*` (2 tables) | ECR not built |
| 66 | `email_automations` | Use workflows |
| 67 | `email_events` | Use notification logs |
| 68 | `employee_*` (2 tables) | Use staff tables |
| 69 | `employer_*` (4 tables) | Employer system separate |
| 70 | `entitlements` | Not used |
| 71 | `entity_eligibility_checks` | Not implemented |
| 72 | `evaluations` | Not built |
| 73 | `external_partner_*` (2 tables) | Not built |
| 74 | `failed_login_attempts` | Use auth logs |
| 75 | `faq_search_analytics` | Not used |
| 76 | `feedback` | Use reviews |
| 77 | `ferpa_*` (10 tables) | FERPA compliance not built |
| 78 | `field_hours_logs` | Use hour_entries |
| 79 | `financial_assurance_*` (2 tables) | Not built |
| 80 | `flashcard_*` (3 tables) | Flashcards not built |
| 81 | `focused_reviews` | Not used |
| 82 | `follow_up_reminders` | Use tasks |
| 83 | `followup_schedule` | Not used |
| 84 | `forum_*` (6 tables) | Forum not built |
| 85 | `foundation_services` | Not implemented |
| 86 | `franchises` | Franchise not built |
| 87 | `fssa_*` (5 tables) | FSSA not built |
| 88 | `gamification_*` (2 tables) | Gamification not built |
| 89 | `gdpr_requests` | Use data_deletion_requests |
| 90 | `generated_assets` | Not used |
| 91 | `generated_images` | AI not used this way |
| 92 | `group_messages` | Use conversations |
| 93 | `health_check_log` | Use platform monitoring |
| 94 | `health_logs` | Not used |
| 95 | `help_categories` | Use help_articles |
| 96 | `help_search_log` | Not used |
| 97 | `holidays` | Not used |
| 98 | `impact_*` (3 tables) | Not implemented |
| 99 | `incentives` | Not built |
| 100 | `income_sources` | Not used |
| 101 | `indiana_*` (6 tables) | Indiana system not built |
| 102 | `industries` | Use categories |
| 103 | `instructor_availability` | Use scheduling |
| 104 | `integration_*` (2 tables) | Not used |
| 105 | `interactive_elements` | Not used |
| 106 | `interview_schedules` | Use appointments |
| 107 | `ip_access_control` | Not built |
| 108 | `job_categories` | Use categories |
| 109 | `job_listings` | Use job_postings |
| 110 | `job_skills` | Use skills |
| 111 | `jri_participants` | JRI not built |
| 112 | `leaderboard_*` (2 tables) | Gamification not built |
| 113 | `learner_*` (6 tables) | Use student tables |
| 114 | `leave_*` (3 tables) | Leave management not built |
| 115 | `legal_actions` | Not implemented |
| 116 | `lesson_bookmarks` | Not used |
| 117 | `lesson_comments` | Use discussions |
| 118 | `lesson_enhancements` | Not used |
| 119 | `lesson_objectives` | Use competencies |
| 120 | `lesson_resources` | Use content_blocks |
| 121 | `library_resources` | Not used |
| 122 | `live_class_attendance` | Use attendance |
| 123 | `lms_organizations` | Not used |
| 124 | `makeup_work_requests` | Not built |
| 125 | `marketing_campaign_sends` | Use campaigns |
| 126 | `marketplace_*` (2 tables) | Marketplace not built |
| 127 | `media_assets` | Use files table |
| 128 | `mentorship_sessions` | Mentorship not built |
| 129 | `moderation_*` (3 tables) | Moderation not built |
| 130 | `module_*` (2 tables) | Use program_modules |
| 131 | `nds_course_catalog` | NDS not built |
| 132 | `news_articles` | Use blog_posts |
| 133 | `news_categories` | Use categories |
| 134 | `nonprofit_services` | Not used |
| 135 | `occupation_standards` | Use program_requirements |
| 136 | `offerings` | Use programs |
| 137 | `onboarding_*` (4 tables) | Use enrollment_steps |
| 138 | `open_timeclock_shifts` | Timeclock not built |
| 139 | `operator_memory` | Not used |
| 140 | `org_invitations` | Use invitations |
| 141 | `org_role_normalization_log` | Not used |
| 142 | `org_settings` | Use site_settings |
| 143 | `organization_addons` | Addons not built |
| 144 | `parent_student_links` | Family accounts not built |
| 145 | `participant_*` (3 tables) | Use students |
| 146 | `password_history` | Use auth |
| 147 | `pathways` | Use learning_paths |
| 148 | `payment_methods` | Use Stripe |
| 149 | `payment_plan_selections` | Use payment_plans |
| 150 | `payment_sessions` | Use checkout_contexts |
| 151 | `payout_*` (2 tables) | Payouts not built |
| 152 | `peer_review_*` (2 tables) | Peer review not built |
| 153 | `performance_*` (3 tables) | Performance not built |
| 154 | `permission_*` (3 tables) | Use RLS policies |
| 155 | `placement_outcomes` | Use job_placements |
| 156 | `plan_features` | Use plans |
| 157 | `policies` | Use handbooks |
| 158 | `portfolio_projects` | Portfolio not built |
| 159 | `practice_*` (3 tables) | Practice not built |
| 160 | `processed_stripe_events` | Use webhook_logs |
| 161 | `processes` | Use workflows |
| 162 | `proctoring_*` (2 tables) | Proctoring not built |
| 163 | `product_*` (4 tables) | Products not built |
| 164 | `program_ctas` | Use banners |
| 165 | `program_media` | Use content_blocks |
| 166 | `program_revenue` | Use analytics |
| 167 | `programs_for_holder` | Use programs |
| 168 | `provisioning_events` | Not used |
| 169 | `push_*` (2 tables) | Use notifications |
| 170 | `question_bank` | Use questions |
| 171 | `question_banks` | Use quizzes |
| 172 | `quiz_*` (4 tables) | Use exams |
| 173 | `recap_generation_log` | AI recap not built |
| 174 | `referral_codes` | Referrals not built |
| 175 | `refund_*` (3 tables) | Use Stripe dashboard |
| 176 | `reporting_*` (4 tables) | Reports not built |
| 177 | `required_documents` | Use document_requirements |
| 178 | `resource_bookmarks` | Not used |
| 179 | `resource_downloads` | Not used |
| 180 | `resource_library` | Not used |
| 181 | `resume_profiles` | Use profiles |
| 182 | `resumes` | Use documents |
| 183 | `rise_*` (2 tables) | RISE not built |
| 184 | `rubrics` | Use assignment_rubrics |
| 185 | `salary_history` | Use payroll |
| 186 | `sam_*` (3 tables) | SAM not built |
| 187 | `scorm_*` (9 tables) | SCORM not built |
| 188 | `scraper_detection_events` | Not used |
| 189 | `script_*` (2 tables) | Scripts not built |
| 190 | `search_*` (2 tables) | Use Supabase search |
| 191 | `secure_identity` | Use auth |
| 192 | `seller_applications` | Marketplace not built |
| 193 | `service_tickets` | Use support_tickets |
| 194 | `settings` | Use site_settings |
| 195 | `sfc_*` (6 tables) | SFC not built |
| 196 | `shared_documents` | Use documents |
| 197 | `shift_schedules` | Scheduling not built |
| 198 | `skills_checklist` | Use competencies |
| 199 | `slow_resources` | Performance not built |
| 200 | `sms_reminders` | Use notifications |
| 201 | `snap_outreach_log` | Outreach not built |
| 202 | `social_campaigns` | Use campaigns |
| 203 | `sos_*` (22 tables) | SOS not built |
| 204 | `sponsor_organizations` | Use employers |
| 205 | `sso_*` (4 tables) | SSO not built |
| 206 | `staff_processes` | Use workflows |
| 207 | `state_*` (3 tables) | State reporting not built |
| 208 | `store_*` (3 tables) | Store not built |
| 209 | `studio_*` (13 tables) | Dev studio not built |
| 210 | `supersonic_*` (4 tables) | Supersonic not built |
| 211 | `support_*` (3 tables) | Support not built |
| 212 | `tax_*` (16 tables) | Tax prep not built |
| 213 | `team_members` | Use profiles |
| 214 | `tenant_*` (6 tables) | Multi-tenant not built |
| 215 | `terminal_command_log` | Dev studio not built |
| 216 | `timeclock_*` (2 tables) | Timeclock not built |
| 217 | `timezone_names` | Use system |
| 218 | `training_access_keys` | Use enrollment |
| 219 | `training_partners` | Use partners |
| 220 | `training_videos` | Use course_videos |
| 221 | `transcript_search_log` | Not used |
| 222 | `transmission_statuses` | Not used |
| 223 | `trial_signups` | Use signups |
| 224 | `tts_*` (2 tables) | TTS not built |
| 225 | `tuition_*` (3 tables) | Tuition not built |
| 226 | `tutorials` | Use lessons |
| 227 | `two_factor_attempts` | Use auth logs |
| 228 | `updates` | Use announcements |
| 229 | `uploaded_documents` | Use documents |
| 230 | `user_access` | Use permissions |
| 231 | `user_activity_logs` | Use audit_logs |
| 232 | `user_capabilities` | Use roles |
| 233 | `user_compliance_status` | Use compliance |
| 234 | `user_connections` | Social not built |
| 235 | `user_consents` | Use consent_records |
| 236 | `user_files` | Use files |
| 237 | `user_onboarding` | Use onboarding |
| 238 | `user_onboarding_status` | Use enrollment |
| 239 | `user_permissions` | Use RLS |
| 240 | `user_preferences` | Use profiles |
| 241 | `user_progress` | Use progress_entries |
| 242 | `user_resumes` | Use documents |
| 243 | `user_roles` | Use profiles |
| 244 | `user_saved_grants` | Grants not built |
| 245 | `user_sessions` | Use auth |
| 246 | `v_*` (6 tables) | Views not used |
| 247 | `verification_actions` | Use verify_audit |
| 248 | `video_*` (5 tables) | Video not built |
| 249 | `vita_appointments` | VITA not built |
| 250 | `volunteer_*` (2 tables) | Volunteers not built |
| 251 | `web_vitals` | Use analytics |
| 252 | `webhook_health_log` | Use webhook_logs |
| 253 | `webhooks` | Use webhook_logs |
| 254 | `webinar_*` (2 tables) | Webinars not built |
| 255 | `website_pages` | Use pages |
| 256 | `welcome_packet_*` (2 tables) | Not built |
| 257 | `workforce_board_*` (3 tables) | Board not built |
| 258 | `workshop_*` (2 tables) | Workshops not built |
| 259 | `workspace_domains` | Use domains |

---

### OPTION B: KEEP FOR FUTURE (Planned Features)
These tables support planned future features.

| # | Table | Future Use |
|---|-------|-----------|
| 1 | `activity_feed` | User activity timeline |
| 2 | `activity_progress` | Progress tracking |
| 3 | `adaptive_learning_paths` | AI-powered learning |
| 4 | `addon_subscriptions` | Add-on features |
| 5 | `admin_priority_queue` | Admin tools |
| 6 | `approval_chain_*` (3 tables) | Approval workflows |
| 7 | `automation_*` (5 tables) | Automation system |
| 8 | `backups` | Backup system |
| 9 | `barber_*` (6 tables) | Barber apprenticeship |
| 10 | `campaigns` | Marketing campaigns |
| 11 | `career_applications` | Career services |
| 12 | `case_*` (4 tables) | Case management |
| 13 | `cmi_*` (5 tables) | Clinical management |
| 14 | `compliance_*` (5 tables) | Compliance system |
| 15 | `course_*` (21 tables) | Course builder |
| 16 | `credential_*` (10 tables) | Credentialing system |
| 17 | `curriculum_*` (7 tables) | Curriculum builder |
| 18 | `enrollment_*` (13 tables) | Enrollment system |
| 19 | `exam_*` (4 tables) | Exam system |
| 20 | `features` | Feature flags |
| 21 | `feedback_votes` | Community feedback |
| 22 | `funding_*` (7 tables) | Funding/grants |
| 23 | `grant_*` (8 tables) | Grant management |
| 24 | `host_shop_*` (4 tables) | Host shop management |
| 25 | `hour_*` (4 tables) | Hour tracking |
| 26 | `job_queue` | Background jobs |
| 27 | `leaderboard_*` (2 tables) | Gamification |
| 28 | `license_*` (6 tables) | License management |
| 29 | `milady_*` (7 tables) | Milady curriculum |
| 30 | `module_progress` | Module tracking |
| 31 | `newsletter_subscriptions` | Newsletter |
| 32 | `notifications` | Notification system |
| 33 | `ojt_*` (4 tables) | OJT tracking |
| 34 | `onboarding_*` (4 tables) | Onboarding flow |
| 35 | `partner_*` (18 tables) | Partner system |
| 36 | `payment_plan_selections` | Payment plans |
| 37 | `payments` | Payment tracking |
| 38 | `payroll_*` (3 tables) | Payroll system |
| 39 | `platform_*` (6 tables) | Platform settings |
| 40 | `practice_*` (3 tables) | Practice tests |
| 41 | `program_*` (35 tables) | Program builder |
| 42 | `question_banks` | Question bank |
| 43 | `quiz_*` (4 tables) | Quiz system |
| 44 | `reports` | Reporting |
| 45 | `resume_*` (2 tables) | Resume builder |
| 46 | `review_queue` | Review system |
| 47 | `scheduled_messages` | Scheduled comms |
| 48 | `shop_*` (10 tables) | Shop system |
| 49 | `sms_messages` | SMS system |
| 50 | `social_media_*` (4 tables) | Social integration |
| 51 | `staff_*` (5 tables) | Staff management |
| 52 | `student_*` (17 tables) | Student management |
| 53 | `subscription_*` (3 tables) | Subscriptions |
| 54 | `support_*` (3 tables) | Support system |
| 55 | `tasks` | Task management |
| 56 | `testing_*` (4 tables) | Testing system |
| 57 | `training_*` (10 tables) | Training system |
| 58 | `video_*` (5 tables) | Video content |
| 59 | `webhook_*` (3 tables) | Webhook system |
| 60 | `wioa_*` (5 tables) | WIOA compliance |
| 61 | `workflow_*` (5 tables) | Workflow system |

---

### OPTION C: MERGE WITH EXISTING
These tables can be merged into existing tables.

| Orphaned Table | Merge Into |
|---------------|-----------|
| `enrollment_acknowledgments` | `enrollment_documents` |
| `enrollment_agreements` | `agreements` |
| `enrollment_funding_records` | `enrollment_funding` |
| `enrollment_status_history` | `enrollments` |
| `enrollment_transitions` | `enrollments` |
| `external_course_access` | `courses` |
| `external_lms_enrollments` | `program_enrollments` |
| `external_module_progress` | `lesson_progress` |
| `external_modules` | `courses` |
| `module_progress` | `lesson_progress` |
| `payment_methods` | `billing_accounts` |
| `payment_plans` | `bridge_payment_plans` |
| `payment_transactions` | `payments` |
| `practice_attempts` | `exam_attempts` |
| `practice_exam_blueprints` | `exams` |
| `product_images` | `products` |
| `product_variants` | `products` |
| `program_course_activity` | `program_courses` |
| `program_course_versions` | `program_courses` |
| `program_ctas` | `programs` |
| `program_lessons` | `program_courses` |
| `program_modules` | `program_courses` |
| `question_banks` | `quiz_banks` |
| `questions` | `quiz_questions` |
| `quiz_answer_options` | `quiz_questions` |
| `resume_profiles` | `profiles` |
| `role_permissions` | `roles` |
| `scheduled_messages` | `communications` |
| `sms_messages` | `notifications` |
| `social_media_posts` | `social_media_queue` |
| `student_credentials` | `credentials` |
| `student_subscriptions` | `subscriptions` |
| `tasks` | `student_tasks` |
| `team_members` | `profiles` |
| `testing_leads` | `leads` |
| `training_access_keys` | `training_enrollments` |
| `training_lessons` | `training_modules` |
| `training_progress` | `lesson_progress` |
| `uploaded_documents` | `documents` |
| `user_files` | `documents` |
| `video_captions` | `videos` |
| `video_chapters` | `videos` |
| `webhook_logs` | `webhook_events` |
| `workforce_participants` | `participants` |

---

## RECOMMENDATION

### DELETE (~400 tables)
Tables for features NOT being built:
- Accreditation
- Affiliates
- Banking
- Benefits
- Clinical (CMI)
- Compliance (FERPA)
- Dev Studio
- Donations
- Franchise
- FSSA
- Gamification
- Indiana
- Marketplace
- Milady RISE
- Operator
- Payroll
- SAM
- SCORM
- SFC/Tax
- Social
- SOS
- Supersonic
- VITA
- Volunteer
- Webhooks

### KEEP (~200 tables)
Tables for CURRENT or PLANNED features:
- Apprenticeship
- Course/Program builder
- Credentialing
- Enrollment
- Host Shop
- LMS
- Notifications
- Partner
- Payments
- Staff
- Student
- Testing
- Training
- Workflow

### MERGE (~50 tables)
Tables that duplicate existing functionality.

---

## SQL TO DELETE ORPHANED TABLES (DANGEROUS!)

```sql
-- Only run this after confirming backups!
-- DELETE FROM public.academic_integrity_violations;
-- DROP TABLE IF EXISTS public.academic_integrity_violations;

-- Example: Delete tables in batches
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'accreditation_evidence',
            'accreditation_records',
            'accreditation_reviews',
            'accreditation_standards',
            'accreditations',
            'affiliate_applications',
            'affiliate_payouts',
            'affiliates'
            -- add more tables here
        )
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

---

## DECISION NEEDED

**Please review and decide:**

1. **DELETE:** Which orphaned tables should be deleted?
2. **KEEP:** Which should be kept for future features?
3. **MERGE:** Which should be merged into existing tables?

Once you decide, I can:
- Create a migration to DELETE the unwanted tables
- Create code to USE the kept tables
- Create migrations to MERGE duplicate tables
