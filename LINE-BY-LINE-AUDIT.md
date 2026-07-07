# 🔴 LINE-BY-LINE TABLE AUDIT: WHERE EACH TABLE GOES

**Date:** July 7, 2026  
**Total Tables:** 835  
**Purpose:** Map every orphaned table to its proper destination

---

## DESTINATIONS

| Code | Destination |
|------|-------------|
| **DELETE** | Delete (not used) |
| **APPRENTICE** | Apprenticeship system (APPP) |
| **ADMIN** | Admin dashboard |
| **STORE** | Store/e-commerce |
| **AI** | AI/Course generation |
| **PROGRAM** | Program builder |
| **CREDENTIAL** | Credentialing system |
| **ENROLL** | Enrollment system |
| **STUDENT** | Student portal |
| **STUDENT/QUICKBOOKS** | Student container + QuickBooks payroll |
| **PARTNER** | Partner/Host Shop |
| **STAFF** | Staff portal |
| **TESTING** | Testing center |
| **COMPLIANCE** | Compliance/Legal |
| **LMS** | Learning system |
| **LMS/GAMIFICATION** | Gamification features |
| **FINANCE** | Finance/Payments |
| **HR** | HR/Payroll |
| **REPORTS** | Analytics/Reports |
| **NOTIFY** | Notifications |
| **DOCS** | Document management |
| **AUTO** | Automation/Workflow |
| **FSSA** | Archive for FSSA (Indiana) |
| **JTI** | JTI (Job Ready Indy) - SCORM |
| **APPP** | APPP - Apprenticeship for grants (SAMs) |
| **STARTER REPO** | Starter repository (VITA, Volunteer, Supersonic) |

---

## LINE-BY-LINE AUDIT

### 1-50

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 1 | academic_integrity_violations | **DELETE** | Not used |
| 2 | accessibility_preferences | **USER** → profiles | User preferences |
| 3 | accreditation_evidence | **DELETE** | Accreditation not built |
| 4 | accreditation_records | **DELETE** | Accreditation not built |
| 5 | accreditation_reviews | **DELETE** | Accreditation not built |
| 6 | accreditation_standards | **DELETE** | Accreditation not built |
| 7 | accreditations | **DELETE** | Accreditation not built |
| 8 | activity_feed | **STUDENT** → student_activity_log | Already exists |
| 9 | activity_progress | **LMS** → progress_entries | Learning progress |
| 10 | adaptive_learning_paths | **LMS** → learning_paths | AI-powered paths |
| 11 | addon_subscriptions | **STORE** → subscription_plans | Add-on features |
| 12 | admin_audit_events | **ADMIN** → audit_logs | Already renamed |
| 13 | admin_audit_log | **ADMIN** → audit_logs | Already renamed |
| 14 | admin_compliance_status | **ADMIN** → platform_settings | Admin settings |
| 15 | admin_priority_queue | **ADMIN** | Priority queue for admins |
| 16 | affiliate_applications | **DELETE** | Affiliates not built |
| 17 | affiliate_payouts | **DELETE** | Affiliates not built |
| 18 | affiliates | **DELETE** | Affiliates not built |
| 19 | agency_referral_confirmations | **ENROLL** → referrals | Agency referrals |
| 20 | agreement_signatures | **COMPLIANCE** → agreement_acceptances | Already renamed |
| 21 | ai_chat_history | **AI** → ai_conversation_memory | Already renamed |
| 22 | ai_course_generation_log | **AI** → course_generation_jobs | Already renamed |
| 23 | ai_generated_courses | **AI** → course_generation_jobs | Already renamed |
| 24 | ai_generations | **AI** | AI generation jobs |
| 25 | ai_instructor_assignments | **AI** → instructor_attestations | Already renamed |
| 26 | ai_instructors | **AI** | AI instructor records |
| 27 | ai_interview_assessments | **ENROLL** → interview_assessments | Interview data |
| 28 | ai_job_matches | **AI** | Job matching AI |
| 29 | ai_messages | **AI** | AI chat messages |
| 30 | ai_operator_memory | **ADMIN** → operator_memory | Operator memory |
| 31 | ai_plan_executions | **AUTO** | AI workflow execution |
| 32 | ai_planner_tasks | **AUTO** → workflow_steps | Already renamed |
| 33 | ai_tutor_interactions | **LMS** → public_ai_tutor_logs | Already renamed |
| 34 | alert_notifications | **NOTIFY** → notifications | Already renamed |
| 35 | ambient_music_log | **DELETE** | Not used |
| 36 | announcement_recipients | **NOTIFY** → announcements | Already renamed |
| 37 | api_keys | **ADMIN** | API key management |
| 38 | api_request_logs | **ADMIN** | API logging |
| 39 | app_screenshot_views | **DELETE** | Not used |
| 40 | application_checklist | **ENROLL** → enrollment_steps | Enrollment checklist |
| 41 | application_claim_log | **ENROLL** → application_events | Application tracking |
| 42 | application_compliance_checks | **COMPLIANCE** | Compliance checks |
| 43 | application_financials | **FINANCE** → applications | Application finances |
| 44 | application_followups | **ENROLL** → follow_ups | Follow-ups |
| 45 | application_intake | **ENROLL** → intakes | Intake forms |
| 46 | application_submissions | **ENROLL** → applications | Applications |
| 47 | appointment_types | **NOTIFY** → calendar_events | Appointment types |
| 48 | apprentice_agreements | **APPRENTICE** → agreements | Apprentice agreements |
| 49 | apprentice_assignments | **APPRENTICE** | Apprentice assignments |
| 50 | apprentice_documents | **APPRENTICE** → student_documents | Already renamed |

### 51-100

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 51 | apprentice_hour_totals | **APPRENTICE** → hour_entries | Hour totals |
| 52 | apprentice_hours_by_shop | **APPRENTICE** | Hours by shop |
| 53 | apprentice_hours_by_source | **APPRENTICE** | Hours by source |
| 54 | apprentice_hours_log | **APPRENTICE** → hour_entries | Already renamed |
| 55 | apprentice_notifications | **APPRENTICE** → notifications | Apprentice alerts |
| 56 | apprentice_payroll | **STUDENT/QUICKBOOKS** | ✅ Apprentice payroll (QuickBooks sync) |
| 57 | apprentice_service_logs | **APPRENTICE** | Service logs |
| 58 | apprentice_uploads | **APPRENTICE** → documents | Apprentice docs |
| 59 | apprentice_wage_updates | **HR** → payroll | Wage tracking |
| 60 | apprenticeship_hours_summary | **APPRENTICE** | Hours summary |
| 61 | apprenticeship_portfolio | **APPRENTICE** | Apprentice portfolio |
| 62 | apprenticeship_shop_drafts | **APPRENTICE** → host_shop_applications | Drafts |
| 63 | apprenticeship_shops | **APPRENTICE** → apprentice_sites | Already renamed |
| 64 | approval_chain_definitions | **AUTO** → workflow_definitions | Workflow defs |
| 65 | approval_chain_steps | **AUTO** → workflow_steps | Already renamed |
| 66 | approval_tokens | **AUTO** | Approval tokens |
| 67 | assessment_attempts | **TESTING** → credential_attempts | Already renamed |
| 68 | assessment_questions | **TESTING** → quiz_questions | Questions |
| 69 | assessments | **TESTING** | Assessment definitions |
| 70 | assignment_rubrics | **LMS** → rubrics | Grading rubrics |
| 71 | attendance_hours | **STAFF** → staff_attendance | Already renamed |
| 72 | audio_preferences | **USER** → profiles | User prefs |
| 73 | audit_archive | **ADMIN** → audit_logs | Archive logs |
| 74 | audit_ddl_events | **ADMIN** → audit_logs | DDL events |
| 75 | audit_export_log | **ADMIN** → audit_logs | Export logs |
| 76 | audit_failures | **ADMIN** → audit_logs | Failure logs |
| 77 | automation_action_queue | **AUTO** | Action queue |
| 78 | automation_execution_log | **AUTO** → workflow_runs | Already renamed |
| 79 | automation_rules | **AUTO** → automated_decisions | Already renamed |
| 80 | automation_triggers | **AUTO** → workflow_triggers | Already renamed |
| 81 | autopilot_logs | **AUTO** | Autopilot logs |
| 82 | autopilot_settings | **AUTO** → workflow_settings | Settings |
| 83 | avatars | **USER** → profiles | User avatars |
| 84 | backups | **ADMIN** | Backup management |
| 85 | badge_definitions | **LMS** → badges | Badge system |
| 86 | bank_accounts | **FINANCE** → billing_accounts | Banking |
| 87 | banking_services | **FINANCE** | Banking services |
| 88 | barber_competency_mappings | **APPRENTICE** → competencies | Barber comps |
| 89 | barber_completions | **APPRENTICE** → program_completion | Barber completion |
| 90 | barber_instructor_signoffs | **APPRENTICE** → competency_signoffs | Sign-offs |
| 91 | barber_lesson_progress | **APPRENTICE** → lesson_completions | Lesson progress |
| 92 | barber_module_hour_config | **APPRENTICE** → program_modules | Module config |
| 93 | barber_shops | **PARTNER** → host_shops | Already renamed |
| 94 | benefits_enrollments | **HR** → benefits_enrollments | Benefits |
| 95 | benefits_plans | **HR** → benefits_plans | Benefits plans |
| 96 | billing_cycles | **FINANCE** → billing_cycles | Billing |
| 97 | bookings | **NOTIFY** → appointments | Bookings |
| 98 | captcha_attempts | **DELETE** | Use Cloudflare |
| 99 | career_applications | **ENROLL** → job_applications | Career apps |
| 100 | case_events | **ADMIN** → events | Already renamed |

### 101-150

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 101 | case_managers | **ADMIN** | Case managers |
| 102 | case_notes | **ADMIN** → case_manager_notes | Case notes |
| 103 | case_studies | **LMS** → resources | Case studies |
| 104 | cases | **ADMIN** → workforce_cases | Already renamed |
| 105 | cash_advance_applications | **FINANCE** → advances | Cash advances |
| 106 | cash_advances | **FINANCE** → advances | Advances |
| 107 | certificate_funding_status_log | **CREDENTIAL** | Funding status |
| 108 | certification_audit_log | **CREDENTIAL** → cert_revocation_log | Already renamed |
| 109 | certification_bodies | **CREDENTIAL** → certifications | Already renamed |
| 110 | chat_conversations | **NOTIFY** → conversations | Already renamed |
| 111 | client_consents | **COMPLIANCE** → consent_records | Consents |
| 112 | clients | **ENROLL** → students | Students as clients |
| 113 | clinical_hours_logs | **APPRENTICE** → hour_entries | Clinical hours |
| 114 | clinical_placements | **APPRENTICE** → apprentice_placements | Placements |
| 115 | clinical_sites | **APPRENTICE** → apprentice_sites | Sites |
| 116 | cmi_attendance | **DELETE** | CMI not built |
| 117 | cmi_certificates | **DELETE** | CMI not built |
| 118 | cmi_clinicals | **DELETE** | CMI not built |
| 119 | cmi_competencies | **DELETE** | CMI not built |
| 120 | cmi_students | **DELETE** | CMI not built |
| 121 | cobra_enrollments | **DELETE** | COBRA not built |
| 122 | code_examples | **LMS** → resources | Code examples |
| 123 | collaboration_messages | **NOTIFY** → messages | Collaboration |
| 124 | collaboration_presence | **NOTIFY** | Online status |
| 125 | collection_sites | **PARTNER** → host_shops | Collection sites |
| 126 | community_event_rsvps | **NOTIFY** → event_registrations | RSVPs |
| 127 | community_group_members | **ENROLL** → study_groups | Group members |
| 128 | community_groups | **ENROLL** → study_groups | Groups |
| 129 | competency_evidence | **APPRENTICE** → apprentice_skills | Already renamed |
| 130 | competency_results | **APPRENTICE** → apprentice_skills | Already renamed |
| 131 | competency_signoffs | **APPRENTICE** → apprentice_skills | Signoffs |
| 132 | competency_tests | **TESTING** | Competency tests |
| 133 | complaints | **ADMIN** → support_tickets | Complaints |
| 134 | completions | **LMS** → course_completions | Course completions |
| 135 | compliance_documents | **COMPLIANCE** → compliance_audit_log | Already renamed |
| 136 | compliance_events | **COMPLIANCE** | Compliance events |
| 137 | compliance_flags | **COMPLIANCE** → compliance_alerts | Already renamed |
| 138 | compliance_profiles | **COMPLIANCE** → profiles | Compliance profiles |
| 139 | compliance_violations | **COMPLIANCE** | Violations |
| 140 | consent_preferences | **COMPLIANCE** → consent_records | Consents |
| 141 | consent_records | **COMPLIANCE** | Consent records |
| 142 | contact_hours | **ADMIN** → business_hours | Business hours |
| 143 | contact_submissions | **ENROLL** → inquiries | Inquiries |
| 144 | content_approvals | **PROGRAM** → approvals | Content approvals |
| 145 | content_blocks | **PROGRAM** → lesson_content | Lesson content |
| 146 | content_library | **PROGRAM** → resources | Resource library |
| 147 | content_pages | **PROGRAM** → pages | Static pages |
| 148 | content_sync_log | **PROGRAM** | Sync logs |
| 149 | contract_audit_logs | **COMPLIANCE** | Contract audits |
| 150 | contract_exports | **COMPLIANCE** → documents | Contract exports |

### 151-200

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 151 | contract_prefill_runs | **COMPLIANCE** | Prefill runs |
| 152 | contract_signature_fields | **COMPLIANCE** → signatures | Signature fields |
| 153 | contract_template_fields | **COMPLIANCE** → sop_templates | Already renamed |
| 154 | cookie_consent_log | **COMPLIANCE** | Cookie consent |
| 155 | copilot_usage_log | **AI** | AI usage logs |
| 156 | course_access | **LMS** → course_enrollments | Access control |
| 157 | course_accreditation_metadata | **CREDENTIAL** | Accreditation data |
| 158 | course_categories | **PROGRAM** → program_categories | Categories |
| 159 | course_competencies | **CREDENTIAL** → competencies | Course comps |
| 160 | course_credentials | **CREDENTIAL** → program_credentials | Already renamed |
| 161 | course_discussions | **LMS** → discussion_threads | Discussions |
| 162 | course_embeddings | **AI** → knowledge_embeddings | Already renamed |
| 163 | course_lesson_versions | **LMS** → curriculum_lessons | Already renamed |
| 164 | course_metrics | **REPORTS** → course_metrics | Analytics |
| 165 | course_module_settings | **PROGRAM** → course_settings | Settings |
| 166 | course_objectives | **PROGRAM** → learning_goals | Objectives |
| 167 | course_progress | **LMS** → progress | Progress tracking |
| 168 | course_publish_audits | **PROGRAM** | Publish audits |
| 169 | course_recommendations | **LMS** → recommendations | Recommendations |
| 170 | course_syllabi | **PROGRAM** → syllabi | Syllabi |
| 171 | course_tasks | **LMS** → tasks | Course tasks |
| 172 | course_templates | **PROGRAM** → templates | Templates |
| 173 | course_vendor_links | **PROGRAM** → vendor_links | Vendor links |
| 174 | course_version_lessons | **PROGRAM** → versions | Version lessons |
| 175 | course_version_modules | **PROGRAM** → versions | Version modules |
| 176 | course_videos | **LMS** | Course videos |
| 177 | creator_courses | **PROGRAM** → courses | Creator courses |
| 178 | credential_blueprint_competencies | **CREDENTIAL** | Blueprint comps |
| 179 | credential_blueprint_domains | **CREDENTIAL** | Blueprint domains |
| 180 | credential_blueprints | **CREDENTIAL** → credentials | Already renamed |
| 181 | credential_domains | **CREDENTIAL** | Credential domains |
| 182 | credential_exam_domains | **CREDENTIAL** → exam_domains | Exam domains |
| 183 | credential_generation_rules | **CREDENTIAL** | Generation rules |
| 184 | credential_providers | **CREDENTIAL** | Providers |
| 185 | credential_submissions | **CREDENTIAL** → certification_submissions | Already renamed |
| 186 | credential_validation_rules | **CREDENTIAL** | Validation rules |
| 187 | credentialing_partners | **CREDENTIAL** | Credentialing partners |
| 188 | critical_audit_logs | **ADMIN** → audit_logs | Critical logs |
| 189 | crm_interactions | **ENROLL** → communications | CRM interactions |
| 190 | crm_leads | **ENROLL** → leads | Already renamed |
| 191 | cross_tenant_access | **DELETE** | Multi-tenant not built |
| 192 | cta_clicks | **REPORTS** → analytics | CTA analytics |
| 193 | curriculum_alignment_audits | **PROGRAM** | Alignment audits |
| 194 | curriculum_compiler_jobs | **PROGRAM** | Compiler jobs |
| 195 | curriculum_generation_lessons | **PROGRAM** | Generated lessons |
| 196 | curriculum_generation_runs | **PROGRAM** | Generation runs |
| 197 | curriculum_lesson_competencies | **PROGRAM** | Lesson comps |
| 198 | curriculum_publish_log | **PROGRAM** | Publish logs |
| 199 | curriculum_validation_results | **PROGRAM** | Validation results |
| 200 | curvature_reviews | **DELETE** | Not used |

### 201-250

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 201 | customer_service_protocols | **ADMIN** → help_articles | Help articles |
| 202 | daily_activities | **STUDENT** → activity_log | Activity log |
| 203 | dashboards | **ADMIN** | Admin dashboards |
| 204 | data_deletion_requests | **COMPLIANCE** → gdpr_requests | GDPR requests |
| 205 | data_processing_jobs | **AUTO** → jobs | Processing jobs |
| 206 | data_retention_policies | **ADMIN** | Retention policies |
| 207 | data_sharing_agreements | **COMPLIANCE** | Sharing agreements |
| 208 | delegate_assignments | **ADMIN** → delegates | Delegation |
| 209 | delivery_logs | **NOTIFY** → notification_logs | Delivery logs |
| 210 | demo_analytics | **REPORTS** | Demo analytics |
| 211 | departments | **ADMIN** → organizations | Departments |
| 212 | dependents | **HR** → profiles | Dependent info |
| 213 | devstudio_chat_log | **ADMIN** → studio_logs | Admin logs |
| 214 | devstudio_documents | **ADMIN** → documents | Admin docs |
| 215 | devstudio_jobs | **ADMIN** → studio_jobs | Admin jobs |
| 216 | digital_binders | **DOCS** → binders | Digital binders |
| 217 | digital_purchases | **STORE** → purchases | Digital purchases |
| 218 | direct_deposit_accounts | **FINANCE** → bank_accounts | Direct deposit |
| 219 | direct_messages | **NOTIFY** → messages | Direct messages |
| 220 | discussion_forums | **LMS** → forums | Forums |
| 221 | discussion_replies | **LMS** → forum_posts | Forum replies |
| 222 | discussions | **LMS** → forums | Discussions |
| 223 | dmca_takedown_requests | **COMPLIANCE** | DMCA requests |
| 224 | document_audit_log | **DOCS** | Audit log |
| 225 | document_categories | **DOCS** → categories | Categories |
| 226 | document_field_mappings | **DOCS** | Field mappings |
| 227 | document_signatures | **DOCS** → signatures | Signatures |
| 228 | document_verifications | **DOCS** → verifications | Verifications |
| 229 | donation_tiers | **STORE** → donation_tiers | Donation tiers |
| 230 | drug_test_history | **COMPLIANCE** | Drug test history |
| 231 | drug_testing_orders | **COMPLIANCE** | Testing orders |
| 232 | drug_testing_policies | **COMPLIANCE** | Testing policies |
| 233 | drug_tests | **COMPLIANCE** | Drug tests |
| 234 | ecr_snapshots | **DELETE** | ECR not built |
| 235 | ecr_sync_logs | **DELETE** | ECR not built |
| 236 | efh_migrations | **ADMIN** | Migration tracking |
| 237 | email_automations | **AUTO** | Email automation |
| 238 | email_events | **NOTIFY** → email_logs | Email events |
| 239 | email_notifications | **NOTIFY** | Email notifications |
| 240 | employee_documents | **HR** → staff_documents | Already renamed |
| 241 | employee_goals | **HR** → goals | Goals |
| 242 | employer_agreements | **PARTNER** → agreements | Employer agreements |
| 243 | employer_applications | **PARTNER** → applications | Employer apps |
| 244 | employer_incentives | **PARTNER** → incentives | Employer incentives |
| 245 | employer_sponsors | **PARTNER** → sponsors | Sponsors |
| 246 | employment_tracking | **HR** | Employment tracking |
| 247 | enrollment_acknowledgments | **ENROLL** → acknowledgments | Acknowledgments |
| 248 | enrollment_agreements | **ENROLL** → agreements | Enrollment agreements |
| 249 | enrollment_bypass_allowlist | **ENROLL** → bypass_list | Bypass list |
| 250 | enrollment_funding_records | **FINANCE** → funding_records | Funding records |

### 251-300

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 251 | enrollment_funding_status_log | **FINANCE** → funding_status | Funding status |
| 252 | enrollment_insert_audit | **ENROLL** → audit_log | Insert audit |
| 253 | enrollment_jobs | **AUTO** → job_queue | Already renamed |
| 254 | enrollment_module_progress | **LMS** → module_progress | Module progress |
| 255 | enrollment_payments | **FINANCE** → application_payments | Already renamed |
| 256 | enrollment_status_history | **ENROLL** → status_history | Status history |
| 257 | enrollment_transitions | **ENROLL** → transitions | Transitions |
| 258 | enrollment_voucher_audit | **FINANCE** → voucher_audit | Voucher audit |
| 259 | entitlements | **HR** → entitlements | Entitlements |
| 260 | entity_eligibility_checks | **ENROLL** → eligibility | Eligibility checks |
| 261 | evaluations | **HR** → performance_reviews | Evaluations |
| 262 | exam_authorization_queue | **TESTING** → exam_authorizations | Already renamed |
| 263 | exam_outcome_tracking | **TESTING** → exam_events | Already renamed |
| 264 | exam_ready_status | **TESTING** | Ready status |
| 265 | exam_session_events | **TESTING** → exam_events | Already renamed |
| 266 | external_course_access | **LMS** → external_credentials | Already renamed |
| 267 | external_lms_enrollments | **ENROLL** → external_course_completions | Already renamed |
| 268 | external_module_progress | **LMS** → program_external_completions | Already renamed |
| 269 | external_modules | **LMS** → program_external_courses | Already renamed |
| 270 | external_partner_modules | **PARTNER** → modules | Partner modules |
| 271 | external_partner_progress | **PARTNER** → progress | Partner progress |
| 272 | failed_login_attempts | **ADMIN** → security_logs | Security logs |
| 273 | faq_search_analytics | **ADMIN** → search_logs | FAQ analytics |
| 274 | features | **ADMIN** → feature_flags | Feature flags |
| 275 | feedback | **ADMIN** → reviews | Reviews/feedback |
| 276 | feedback_votes | **ADMIN** → review_votes | Vote tracking |
| 277 | ferpa_access_requests | **COMPLIANCE** | FERPA access |
| 278 | ferpa_audit_log | **COMPLIANCE** | FERPA audit |
| 279 | ferpa_calendar_events | **COMPLIANCE** | FERPA events |
| 280 | ferpa_compliance_checklist | **COMPLIANCE** | FERPA checklist |
| 281 | ferpa_consent_forms | **COMPLIANCE** → legal_documents | Consent forms |
| 282 | ferpa_disclosure_log | **COMPLIANCE** | Disclosure log |
| 283 | ferpa_documents | **COMPLIANCE** → legal_documents | Legal documents |
| 284 | ferpa_student_acknowledgments | **COMPLIANCE** | Student acks |
| 285 | ferpa_training | **LMS** → training | FERPA training |
| 286 | ferpa_violation_reports | **COMPLIANCE** | Violation reports |
| 287 | field_hours_logs | **APPRENTICE** → hour_entries | Field hours |
| 288 | financial_assurance_records | **FINANCE** | Financial records |
| 289 | financial_assurances | **FINANCE** | Assurances |
| 290 | flashcard_progress | **LMS** → flashcard_progress | Flashcard progress |
| 291 | flashcard_sets | **LMS** → flashcard_sets | Flashcard sets |
| 292 | flashcards | **LMS** → flashcards | Flashcards |
| 293 | focused_reviews | **LMS** | Focused reviews |
| 294 | follow_up_reminders | **ENROLL** → follow_ups | Follow-ups |
| 295 | followup_schedule | **ENROLL** → schedules | Followup schedules |
| 296 | forum_comments | **LMS** → forum_posts | Forum comments |
| 297 | forum_members | **LMS** → forum_members | Forum members |
| 298 | forum_reactions | **LMS** → reactions | Forum reactions |
| 299 | forum_subscriptions | **LMS** → subscriptions | Forum subs |
| 300 | forum_thread_views | **LMS** → thread_views | Thread views |

### 301-350

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 301 | forum_votes | **LMS** → votes | Forum votes |
| 302 | foundation_services | **ADMIN** | Foundation services |
| 303 | franchises | **DELETE** | Franchise not built |
| 304 | fssa_attendance | **FSSA** | FSSA attendance |
| 305 | fssa_budget | **FSSA** | FSSA budget |
| 306 | fssa_participants | **FSSA** | FSSA participants |
| 307 | fssa_program_components | **FSSA** | FSSA programs |
| 308 | funding_applications | **FINANCE** → grant_applications | Funding apps |
| 309 | funding_cases | **FINANCE** → funding_cases | Funding cases |
| 310 | funding_change_audit | **FINANCE** | Change audit |
| 311 | funding_programs | **FINANCE** → funding_programs | Funding programs |
| 312 | funding_records | **FINANCE** → workforce_funding | Already renamed |
| 313 | funding_tracking | **FINANCE** | Funding tracking |
| 314 | funding_verification_escalations | **FINANCE** | Escalations |
| 315 | gamification_events | **LMS/GAMIFICATION** | ✅ KEEP - Gamification events |
| 317 | gdpr_requests | **COMPLIANCE** | GDPR requests |
| 318 | generated_assets | **PROGRAM** → assets | Generated assets |
| 319 | generated_images | **AI** → images | AI images |
| 320 | grade_records | **LMS** → grades | Already renamed |
| 321 | grant_disbursements | **FINANCE** → disbursements | Disbursements |
| 322 | grant_eligibility_results | **FINANCE** → eligibility | Eligibility |
| 323 | grant_entities | **FINANCE** → entities | Grant entities |
| 324 | grant_federal_forms | **FINANCE** → forms | Federal forms |
| 325 | grant_notification_log | **FINANCE** → notifications | Grant notifications |
| 326 | grant_packages | **FINANCE** → packages | Grant packages |
| 327 | grant_programs | **FINANCE** → programs | Grant programs |
| 328 | grant_submissions | **FINANCE** → submissions | Grant submissions |
| 329 | group_messages | **NOTIFY** → messages | Group messages |
| 330 | handbook_policies | **COMPLIANCE** → handbooks | Handbooks |
| 331 | health_check_log | **ADMIN** | Health checks |
| 332 | health_logs | **ADMIN** | Health logs |
| 333 | help_categories | **ADMIN** → help_categories | Help categories |
| 334 | help_search_log | **ADMIN** → search_logs | Help search |
| 335 | holidays | **ADMIN** → holidays | Holiday calendar |
| 336 | host_shop_apprentices | **APPRENTICE** → apprentices | Already renamed |
| 337 | host_shop_evaluations | **PARTNER** → host_shop_applications | Already renamed |
| 338 | host_shop_subscriptions | **PARTNER** → subscriptions | Already renamed |
| 339 | host_shops | **PARTNER** → host_shop_partnerships | Already renamed |
| 340 | hour_entry_status_history | **APPRENTICE** → hour_entries | Status history |
| 341 | hour_logs | **APPRENTICE** → hour_entries | Already renamed |
| 342 | hour_tracking | **APPRENTICE** → hour_entries | Hour tracking |
| 343 | hours_log | **APPRENTICE** → hour_entries | Already renamed |
| 344 | hours_logs | **APPRENTICE** → hour_entries | Already renamed |
| 345 | hsi_enrollment_queue | **ENROLL** → enrollment_queue | HSI queue |
| 346 | impact_metrics | **REPORTS** → metrics | Impact metrics |
| 347 | impact_statistics | **REPORTS** → statistics | Impact stats |
| 348 | impact_stats | **REPORTS** → stats | Impact stats |
| 349 | incentives | **PARTNER** → incentives | Partner incentives |
| 350 | income_sources | **FINANCE** → income_sources | Income sources |

### 351-400

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 351 | indiana_alerts_sent | **FSSA** | Indiana alerts |
| 352 | indiana_enforcement_actions | **FSSA** | Enforcement |
| 353 | indiana_hour_categories | **FSSA** | Hour categories |
| 354 | indiana_timeclock_daily_export | **FSSA** | Daily export |
| 355 | indiana_timeclock_weekly_summary_export | **FSSA** | Weekly export |
| 356 | industries | **ADMIN** → categories | Industry categories |
| 357 | instructor_assignments | **LMS** → instructor_assignments | Instructor assign |
| 358 | instructor_availability | **NOTIFY** → availability | Instructor avail |
| 359 | instructor_profiles | **LMS** → instructor_attestations | Already renamed |
| 360 | integration_configs | **ADMIN** → integrations | Integration configs |
| 361 | integration_tokens | **ADMIN** → tokens | API tokens |
| 362 | interactive_elements | **LMS** → interactive_quizzes | Interactive elements |
| 363 | interview_schedules | **NOTIFY** → interviews | Interview schedules |
| 364 | ip_access_control | **ADMIN** → access_control | IP control |
| 365 | job_categories | **ENROLL** → categories | Job categories |
| 366 | job_listings | **ENROLL** → job_postings | Job listings |
| 367 | job_skills | **ENROLL** → required_skills | Required skills |
| 368 | jri_participants | **DELETE** | JRI not built |
| 369 | leaderboard_entries | **LMS** → leaderboard | Leaderboard |
| 370 | leaderboard_scores | **LMS** → scores | Scores |
| 371 | learner_ai_policies | **LMS** → ai_policies | AI policies |
| 372 | learner_compliance | **COMPLIANCE** | Learner compliance |
| 373 | learner_documents | **DOCS** → student_documents | Already renamed |
| 374 | learner_goals | **LMS** → goals | Learner goals |
| 375 | learner_module_gate_state | **LMS** → module_gates | Module gates |
| 376 | learner_onboarding | **ENROLL** → onboarding | Learner onboarding |
| 377 | learning_activity_streaks | **LMS** → streaks | Learning streaks |
| 378 | learning_analytics | **REPORTS** → analytics | Analytics |
| 379 | learning_resources | **LMS** → resources | Resources |
| 380 | learning_streaks | **LMS** → streaks | Streaks |
| 381 | leave_balances | **HR** → leave_balances | Leave balances |
| 382 | leave_policies | **HR** → leave_policies | Leave policies |
| 383 | leave_requests | **HR** → leave_requests | Leave requests |
| 384 | legal_actions | **COMPLIANCE** → legal_actions | Legal actions |
| 385 | lesson_bookmarks | **LMS** → bookmarks | Bookmarks |
| 386 | lesson_comments | **LMS** → comments | Lesson comments |
| 387 | lesson_competency_map | **LMS** → competency_map | Comp map |
| 388 | lesson_enhancements | **LMS** → enhancements | Enhancements |
| 389 | lesson_objectives | **LMS** → objectives | Lesson objectives |
| 390 | lesson_resources | **LMS** → resources | Resources |
| 391 | library_resources | **LMS** → resources | Library |
| 392 | license_audit_log | **CREDENTIAL** → license_events | Already renamed |
| 393 | license_keys | **CREDENTIAL** → licenses | Already renamed |
| 394 | license_tiers | **CREDENTIAL** → license_tiers | License tiers |
| 395 | license_usage | **CREDENTIAL** → usage | License usage |
| 396 | license_usage_log | **CREDENTIAL** → license_validations | Already renamed |
| 397 | license_violations | **CREDENTIAL** → violations | Violations |
| 398 | live_class_attendance | **LMS** → live_class_attendance | Live class |
| 399 | lms_organizations | **LMS** → organizations | LMS orgs |
| 400 | makeup_work_requests | **ENROLL** → requests | Makeup requests |

### 401-450

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 401 | marketing_campaign_sends | **ADMIN** → campaign_sends | Campaign sends |
| 402 | marketing_campaigns | **ADMIN** → campaigns | Already renamed |
| 403 | marketplace_courses | **STORE** → marketplace_courses | Marketplace |
| 404 | marketplace_sellers | **STORE** → sellers | Marketplace sellers |
| 405 | media_assets | **DOCS** → media | Media assets |
| 406 | mentorship_sessions | **LMS** → mentorships | Mentorship sessions |
| 407 | message_notifications | **NOTIFY** → notifications | Already renamed |
| 408 | message_threads | **NOTIFY** → live_chat_sessions | Already renamed |
| 409 | migration_audit | **ADMIN** → migration_audit | Migration audit |
| 410 | milady_access | **DELETE** | Milady not used |
| 411 | milady_email_logs | **DELETE** | Milady not used |
| 412 | milady_enrollments | **DELETE** | Milady not used |
| 413 | milady_license_codes | **DELETE** | Milady not used |
| 414 | milady_orientation_status | **DELETE** | Milady not used |
| 415 | milady_provisioning_queue | **DELETE** | Milady not used |
| 416 | milady_rise_enrollments | **DELETE** | Milady RISE not used |
| 417 | moderation_actions | **ADMIN** → moderation | Moderation |
| 418 | moderation_queue | **ADMIN** → review_queue | Already renamed |
| 419 | moderation_reports | **ADMIN** → reports | Moderation reports |
| 420 | moderation_rules | **ADMIN** → rules | Moderation rules |
| 421 | module_competencies | **PROGRAM** → competencies | Module comps |
| 422 | module_objectives | **PROGRAM** → objectives | Module objectives |
| 423 | module_progress | **LMS** → progress_entries | Already renamed |
| 424 | mou_documents | **PARTNER** → partner_mous | Already renamed |
| 425 | navigation_categories | **ADMIN** → navigation | Navigation |
| 426 | navigation_items | **ADMIN** → navigation | Navigation items |
| 427 | nds_course_catalog | **PROGRAM** → catalog | NDS catalog |
| 428 | news_articles | **ADMIN** → blog_posts | Already renamed |
| 429 | news_categories | **ADMIN** → categories | News categories |
| 430 | nonprofit_services | **ADMIN** → services | Nonprofit services |
| 431 | occupation_standards | **PROGRAM** → standards | Occupation standards |
| 432 | offerings | **PROGRAM** → offerings | Program offerings |
| 433 | ojt_logs | **APPRENTICE** → hour_entries | OJT logs |
| 434 | ojt_notes | **APPRENTICE** → notes | OJT notes |
| 435 | ojt_placements | **APPRENTICE** → apprentice_placements | Already renamed |
| 436 | ojt_student_summary | **APPRENTICE** → summaries | Student summary |
| 437 | onboarding_checklist | **ENROLL** → checklist | Onboarding checklist |
| 438 | onboarding_events | **ENROLL** → events | Onboarding events |
| 439 | onboarding_resources | **ENROLL** → resources | Onboarding resources |
| 440 | onboarding_steps | **ENROLL** → steps | Onboarding steps |
| 441 | open_timeclock_shifts | **HR** → shifts | Open shifts |
| 442 | operator_memory | **AI** → ai_memory | AI memory |
| 443 | org_invitations | **ADMIN** → invitations | Org invitations |
| 444 | org_role_normalization_log | **ADMIN** → audit_log | Role normalization |
| 445 | org_settings | **ADMIN** → site_settings | Already renamed |
| 446 | organization_addons | **ADMIN** → addons | Organization addons |
| 447 | parent_student_links | **ENROLL** → family_links | Family links |
| 448 | participant_barriers | **ENROLL** → barriers | Participant barriers |
| 449 | participant_demographics | **ENROLL** → demographics | Demographics |
| 450 | participants | **ENROLL** → workforce_participants | Already renamed |

### 451-500

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 451 | partner_acknowledgment_items | **PARTNER** | Acknowledgment items |
| 452 | partner_acknowledgments | **PARTNER** → partner_applications | Already renamed |
| 453 | partner_course_enrollments | **PARTNER** → program_enrollments | Already renamed |
| 454 | partner_course_payments | **PARTNER** → payments | Partner payments |
| 455 | partner_courses_catalog | **PARTNER** → catalog | Partner catalog |
| 456 | partner_credentials | **CREDENTIAL** | Partner credentials |
| 457 | partner_lms_enrollment_failures | **PARTNER** → failures | LMS failures |
| 458 | partner_organizations | **PARTNER** → partners | Already renamed |
| 459 | partner_profiles | **PARTNER** → profiles | Partner profiles |
| 460 | partner_program_courses | **PARTNER** → program_courses | Partner courses |
| 461 | partner_seat_orders | **STORE** → seat_orders | Seat orders |
| 462 | partner_sessions | **PARTNER** → sessions | Partner sessions |
| 463 | partner_shops | **PARTNER** → shops | Partner shops |
| 464 | partner_site_inspections | **PARTNER** → inspections | Site inspections |
| 465 | partner_sites | **PARTNER** → sites | Partner sites |
| 466 | partner_types | **PARTNER** → types | Partner types |
| 467 | password_history | **ADMIN** → security_logs | Password history |
| 468 | pathways | **LMS** → learning_paths | Learning pathways |
| 469 | payment_methods | **FINANCE** → payment_methods | Payment methods |
| 470 | payment_options | **FINANCE** → options | Payment options |
| 471 | payment_plan_selections | **FINANCE** → plan_selections | Plan selections |
| 472 | payment_plans | **FINANCE** → bridge_payment_plans | Payment plans |
| 473 | payment_sessions | **FINANCE** → sessions | Payment sessions |
| 474 | payment_transactions | **FINANCE** → payments | Already renamed |
| 475 | payout_queue | **FINANCE** → payout_queue | Payout queue |
| 476 | payout_rate_configs | **FINANCE** → rate_configs | Rate configs |
| 477 | payroll | **STUDENT/QUICKBOOKS** | ✅ Payroll (QuickBooks integration) |
| 478 | payroll_records | **STUDENT/QUICKBOOKS** | ✅ Payroll records |
| 479 | peer_review_assignments | **LMS** → peer_reviews | Peer reviews |
| 480 | peer_reviews | **LMS** → peer_reviews | Peer reviews |
| 481 | performance_alerts | **HR** → alerts | Performance alerts |
| 482 | performance_metrics | **HR** → metrics | Performance metrics |
| 483 | performance_reviews | **HR** → reviews | Performance reviews |
| 484 | permission_audit_log | **ADMIN** → audit_log | Permission audit |
| 485 | permission_group_members | **ADMIN** → permission_groups | Group members |
| 486 | permission_groups | **ADMIN** → groups | Permission groups |
| 487 | permissions | **ADMIN** → permissions | Permissions |
| 488 | placement_outcomes | **ENROLL** → outcomes | Placement outcomes |
| 489 | placements | **ENROLL** → job_placements | Placements |
| 490 | plan_features | **STORE** → plan_features | Plan features |
| 491 | plans | **STORE** → plans | Subscription plans |
| 492 | platform_knowledge_chunks | **AI** → knowledge_documents | Already renamed |
| 493 | platform_products | **STORE** → products | Platform products |
| 494 | platform_secrets | **ADMIN** → secrets | Secrets |
| 495 | platform_snapshots | **ADMIN** → snapshots | Platform snapshots |
| 496 | platform_state_snapshots | **ADMIN** → snapshots | State snapshots |
| 497 | platform_stats | **REPORTS** → platform_stats | Platform stats |
| 498 | policies | **COMPLIANCE** → policies | Policies |
| 499 | portfolio_projects | **LMS** → portfolios | Portfolio projects |
| 500 | positions | **HR** → positions | Job positions |

### 501-550

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 501 | practice_activities | **TESTING** → activities | Practice activities |
| 502 | practice_attempts | **TESTING** → sim_attempts | Already renamed |
| 503 | practice_exam_blueprints | **TESTING** → blueprints | Practice blueprints |
| 504 | priority_scores | **ADMIN** → scores | Priority scores |
| 505 | process_steps | **AUTO** → workflow_steps | Already renamed |
| 506 | processed_stripe_events | **FINANCE** → processed_webhook_events | Already renamed |
| 507 | processes | **AUTO** | Workflow processes |
| 508 | proctored_exams | **TESTING** → exams | Proctored exams |
| 509 | proctoring_sessions | **TESTING** → sessions | Proctoring sessions |
| 510 | product_images | **STORE** → images | Product images |
| 511 | product_page_views | **REPORTS** → analytics | Page views |
| 512 | product_reports | **REPORTS** → product_reports | Product reports |
| 513 | product_variants | **STORE** → variants | Product variants |
| 514 | program_announcements | **PROGRAM** → announcements | Already renamed |
| 515 | program_banner_views | **REPORTS** | Banner views |
| 516 | program_catalog | **PROGRAM** → catalog | Program catalog |
| 517 | program_cohorts | **ENROLL** → cohort_sessions | Already renamed |
| 518 | program_completion_candidates | **PROGRAM** → program_completion | Already renamed |
| 519 | program_course_activity | **PROGRAM** → activity | Course activity |
| 520 | program_course_links | **PROGRAM** → program_courses | Already renamed |
| 521 | program_course_map | **PROGRAM** → course_map | Course map |
| 522 | program_course_versions | **PROGRAM** → versions | Course versions |
| 523 | program_ctas | **PROGRAM** → ctas | CTAs |
| 524 | program_curriculum_modules | **PROGRAM** → modules | Curriculum modules |
| 525 | program_enrollment_tracks | **ENROLL** → partner_program_access | Already renamed |
| 526 | program_funding | **FINANCE** → funding | Program funding |
| 527 | program_funding_links | **FINANCE** → funding_links | Funding links |
| 528 | program_funding_options | **FINANCE** → funding_options | Funding options |
| 529 | program_holder_applications | **PROGRAM** → holder_applications | Holder apps |
| 530 | program_holder_banking | **FINANCE** → banking | Holder banking |
| 531 | program_holder_payouts | **FINANCE** → payouts | Holder payouts |
| 532 | program_holder_reports | **REPORTS** → holder_reports | Holder reports |
| 533 | program_lessons | **PROGRAM** → lessons | Program lessons |
| 534 | program_media | **PROGRAM** → media | Program media |
| 535 | program_modules | **PROGRAM** → modules | Program modules |
| 536 | program_organizations | **PROGRAM** → organizations | Program orgs |
| 537 | program_partner_lms | **PROGRAM** → partner_lms | Partner LMS |
| 538 | program_phases | **PROGRAM** → phases | Program phases |
| 539 | program_required_courses | **PROGRAM** → program_requirements | Already renamed |
| 540 | program_requirement_rules | **PROGRAM** → requirement_rules | Requirement rules |
| 541 | program_revenue | **REPORTS** → revenue | Revenue reports |
| 542 | program_review_log | **PROGRAM** → review_log | Review log |
| 543 | program_reviews | **PROGRAM** → program_outcomes | Already renamed |
| 544 | program_sponsorships | **PROGRAM** → sponsorships | Sponsorships |
| 545 | program_tracks | **PROGRAM** → tracks | Program tracks |
| 546 | program_versions | **PROGRAM** → versions | Program versions |
| 547 | program_wioa_compliance_forms | **COMPLIANCE** → wioa_forms | WIOA forms |
| 548 | programs_for_holder | **PROGRAM** → programs | Programs for holder |
| 549 | provisioning_events | **ADMIN** → provisioning | Provisioning |
| 550 | push_notification_tokens | **NOTIFY** → tokens | Push tokens |

### 551-600

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 551 | push_tokens | **NOTIFY** → tokens | Push tokens |
| 552 | qa_checklist_completions | **ADMIN** → qa_completions | QA completions |
| 553 | qa_checklists | **ADMIN** → qa_checklists | QA checklists |
| 554 | quarterly_performance | **REPORTS** → quarterly | Quarterly reports |
| 555 | question_bank | **TESTING** → question_bank | Question bank |
| 556 | question_banks | **TESTING** → question_bank | Question banks |
| 557 | questions | **TESTING** → quiz_questions | Quiz questions |
| 558 | quiz_answer_options | **TESTING** → answer_options | Answer options |
| 559 | quiz_answers | **TESTING** → answers | Quiz answers |
| 560 | rag_documents | **AI** → rag_documents | RAG documents |
| 561 | rag_embeddings | **AI** → knowledge_embeddings | Already renamed |
| 562 | rapids_apprentice_data | **APPRENTICE** → apprentices | Already renamed |
| 563 | readiness_reports | **REPORTS** → readiness | Readiness reports |
| 564 | recap_generation_log | **AI** | AI recap generation |
| 565 | referral_codes | **ENROLL** → referral_codes | Referral codes |
| 566 | refund_advance_applications | **FINANCE** → refund_advances | Refund advances |
| 567 | refund_tracking | **FINANCE** → refunds | Refund tracking |
| 568 | refunds | **FINANCE** → refunds | Refunds |
| 569 | reporting_completions | **REPORTS** → completions | Completion reports |
| 570 | reporting_enrollments | **REPORTS** → enrollments | Enrollment reports |
| 571 | reporting_funding | **REPORTS** → funding | Funding reports |
| 572 | reporting_progress | **REPORTS** → progress | Progress reports |
| 573 | reporting_verdicts | **REPORTS** → verdicts | Reporting verdicts |
| 574 | reports | **REPORTS** | Reports |
| 575 | required_documents | **DOCS** → requirements | Required docs |
| 576 | resource_bookmarks | **LMS** → bookmarks | Resource bookmarks |
| 577 | resource_downloads | **LMS** → downloads | Resource downloads |
| 578 | resource_library | **LMS** → library | Resource library |
| 579 | resources | **LMS** → resources | Learning resources |
| 580 | resume_profiles | **ENROLL** → resumes | Resume profiles |
| 581 | resumes | **DOCS** → resumes | Resumes |
| 582 | rise_participants | **DELETE** | RISE not built |
| 583 | rise_programs | **DELETE** | RISE not built |
| 584 | role_permissions | **ADMIN** → permissions | Role permissions |
| 585 | role_templates | **ADMIN** → role_templates | Role templates |
| 586 | roles | **ADMIN** → roles | Roles |
| 587 | rubrics | **LMS** → rubrics | Grading rubrics |
| 588 | salary_history | **HR** → salary_history | Salary history |
| 589 | sam_alerts | **APPP** → sam_alerts | ✅ SAMs for APPP (grants) |
| 590 | sam_documents | **APPP** → documents | ✅ SAMs documents |
| 591 | sam_entities | **APPP** → entities | ✅ SAMs entities |
| 592 | sap_records | **DELETE** | SAP not built |
| 593 | scholarship_applications | **FINANCE** → scholarships | Scholarship apps |
| 594 | school_application_followups | **ENROLL** → followups | School followups |
| 595 | scorm_completion_summary | **JTI** → scorm_progress | ✅ SCORM for JTI (Job Ready Indy) |
| 596 | scorm_progress | **JTI** → progress | ✅ SCORM progress |
| 597 | scorm_registrations | **JTI** → registrations | ✅ SCORM registrations |
| 598 | scorm_sessions | **JTI** → sessions | ✅ SCORM sessions |
| 599 | scorm_state | **JTI** → scorm_state | ✅ SCORM state |
| 600 | scraper_detection_events | **ADMIN** | Scraping detection |

### 601-650

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 601 | script_acknowledgments | **LMS** → acknowledgments | Script acks |
| 602 | script_deviations | **LMS** → deviations | Script deviations |
| 603 | search_analytics | **REPORTS** → search | Search analytics |
| 604 | search_logs | **ADMIN** → logs | Search logs |
| 605 | secure_identity | **COMPLIANCE** → identity | Secure identity |
| 606 | security_alerts | **ADMIN** → alerts | Security alerts |
| 607 | security_audit_logs | **ADMIN** → audit_logs | Security logs |
| 608 | security_logs | **ADMIN** → logs | Security logs |
| 609 | seller_applications | **STORE** → seller_applications | Seller apps |
| 610 | service_tickets | **ADMIN** → support_tickets | Support tickets |
| 611 | settings | **ADMIN** → site_settings | Settings |
| 612 | sfc_documents | **DELETE** | SFC not built |
| 613 | sfc_leads | **DELETE** | SFC not built |
| 614 | sfc_tax_documents | **DELETE** | SFC not built |
| 615 | sfc_tax_return_public_status | **DELETE** | SFC not built |
| 616 | sfc_tax_returns | **DELETE** | SFC not built |
| 617 | sfc_tax_returns_public_lookup | **DELETE** | SFC not built |
| 618 | shared_documents | **DOCS** → shared | Shared documents |
| 619 | shift_schedules | **HR** → schedules | Shift schedules |
| 620 | shop_applications | **PARTNER** → provider_applications | Already renamed |
| 621 | shop_categories | **STORE** → categories | Shop categories |
| 622 | shop_document_requirements | **DOCS** → partner_document_requirements | Already renamed |
| 623 | shop_orders | **STORE** → orders | Shop orders |
| 624 | shop_products | **STORE** → products | Shop products |
| 625 | shop_profiles | **PARTNER** → profiles | Shop profiles |
| 626 | shop_reports | **REPORTS** → shop_reports | Already renamed |
| 627 | shop_required_docs_status | **DOCS** → doc_status | Doc status |
| 628 | shop_signatures | **DOCS** → signatures | Shop signatures |
| 629 | shop_weekly_reports | **REPORTS** → weekly_reports | Weekly reports |
| 630 | sites | **ADMIN** → sites | Sites |
| 631 | skill_assessments | **LMS** → assessments | Skill assessments |
| 632 | skill_badges | **LMS** → badges | Skill badges |
| 633 | skills_checklist | **LMS** → checklist | Skills checklist |
| 634 | slow_resources | **LMS** → resources | Slow resources |
| 635 | sms_reminders | **NOTIFY** → sms_messages | Already renamed |
| 636 | snap_outreach_log | **DELETE** | Not used |
| 637 | social_campaigns | **ADMIN** → campaigns | Social campaigns |
| 638 | social_media_accounts | **ADMIN** → social_media_settings | Already renamed |
| 639 | social_media_queue | **ADMIN** → social_media_posts | Already renamed |
| 640 | sos_attachment_library | **DELETE** | SOS not built |
| 641 | sos_brand_assets | **DELETE** | SOS not built |
| 642 | sos_compliance_records | **DELETE** | SOS not built |
| 643 | sos_content_blocks | **DELETE** | SOS not built |
| 644 | sos_document_data_sources | **DELETE** | SOS not built |
| 645 | sos_document_styles | **DELETE** | SOS not built |
| 646 | sos_document_templates | **DELETE** | SOS not built |
| 647 | sos_generated_documents | **DELETE** | SOS not built |
| 648 | sos_opportunities | **DELETE** | SOS not built |
| 649 | sos_opportunity_requirements | **DELETE** | SOS not built |
| 650 | sos_organization_profiles | **DELETE** | SOS not built |

### 651-700

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 651 | sos_partner_entities | **DELETE** | SOS not built |
| 652 | sos_past_performance | **DELETE** | SOS not built |
| 653 | sos_rate_sheets | **DELETE** | SOS not built |
| 654 | sos_requirement_mappings | **DELETE** | SOS not built |
| 655 | sos_review_tasks | **DELETE** | SOS not built |
| 656 | sos_source_document_sections | **DELETE** | SOS not built |
| 657 | sos_source_documents | **DELETE** | SOS not built |
| 658 | sos_source_links | **DELETE** | SOS not built |
| 659 | sos_submission_audit_logs | **DELETE** | SOS not built |
| 660 | sos_submission_packets | **DELETE** | SOS not built |
| 661 | sos_submission_runs | **DELETE** | SOS not built |
| 662 | sponsor_organizations | **PARTNER** → sponsors | Sponsor orgs |
| 663 | sso_connections | **ADMIN** → sso | SSO connections |
| 664 | sso_login_attempts | **ADMIN** → login_attempts | SSO login attempts |
| 665 | sso_providers | **ADMIN** → providers | SSO providers |
| 666 | sso_sessions | **ADMIN** → sessions | SSO sessions |
| 667 | staff_applications | **HR** → staffs | Already renamed |
| 668 | staff_notifications | **STAFF** → notifications | Staff notifications |
| 669 | staff_processes | **AUTO** → workflows | Staff workflows |
| 670 | staff_training_modules | **STAFF** → training_modules | Staff training |
| 671 | staff_training_progress | **STAFF** → progress | Staff progress |
| 672 | state_compliance | **COMPLIANCE** | State compliance |
| 673 | state_licensing | **CREDENTIAL** → licensing | State licensing |
| 674 | state_rules | **COMPLIANCE** → rules | State rules |
| 675 | statistics | **REPORTS** → statistics | Statistics |
| 676 | store_branding | **STORE** → branding | Store branding |
| 677 | store_instances | **STORE** → instances | Store instances |
| 678 | store_orders | **STORE** → orders | Store orders |
| 679 | student_activity_log | **STUDENT** | Student activity |
| 680 | student_ai_instructors | **LMS** → ai_instructors | AI instructors |
| 681 | student_applications | **ENROLL** → applications | Student apps |
| 682 | student_badges | **LMS** → badges | Student badges |
| 683 | student_credential_uploads | **CREDENTIAL** → uploads | Credential uploads |
| 684 | student_credentials | **CREDENTIAL** → learner_credentials | Already renamed |
| 685 | student_interventions | **ENROLL** → interventions | Interventions |
| 686 | student_milestones | **LMS** → milestones | Student milestones |
| 687 | student_module_progress | **LMS** → module_progress | Module progress |
| 688 | student_payments | **FINANCE** → payments | Student payments |
| 689 | student_points | **LMS** → points | Student points |
| 690 | student_progress | **LMS** → progress_entries | Already renamed |
| 691 | student_records | **STUDENT** → records | Student records |
| 692 | student_requirements | **ENROLL** → requirements | Requirements |
| 693 | student_resources | **LMS** → resources | Student resources |
| 694 | student_skill_signoffs | **APPRENTICE** → skill_signoffs | Already renamed |
| 695 | student_subscriptions | **STORE** → subscriptions | Student subs |
| 696 | studio_chat_history | **ADMIN** → chat_history | Admin chat |
| 697 | studio_comments | **ADMIN** → comments | Admin comments |
| 698 | studio_commit_cache | **ADMIN** → commit_cache | Commit cache |
| 699 | studio_deploy_tokens | **ADMIN** → deploy_tokens | Deploy tokens |
| 700 | studio_deployments | **ADMIN** → deployments | Admin deployments |

### 701-750

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 701 | studio_favorites | **ADMIN** → favorites | Favorites |
| 702 | studio_pr_tracking | **ADMIN** → pr_tracking | PR tracking |
| 703 | studio_recent_files | **ADMIN** → recent_files | Recent files |
| 704 | studio_repos | **ADMIN** → repos | Repos |
| 705 | studio_sessions | **ADMIN** → sessions | Admin sessions |
| 706 | studio_settings | **ADMIN** → settings | Admin settings |
| 707 | studio_shares | **ADMIN** → shares | Shares |
| 708 | studio_workflow_tracking | **ADMIN** → workflow_tracking | Workflow tracking |
| 709 | study_sessions | **LMS** → study_groups | Already renamed |
| 710 | subscription_plans | **STORE** → store_subscription_pranning | Already renamed |
| 711 | supersonic_applications | **STARTER REPO** | ✅ Supersonic applications |
| 712 | supersonic_appointments | **STARTER REPO** | ✅ Supersonic appointments |
| 713 | supersonic_careers | **STARTER REPO** | ✅ Supersonic careers |
| 714 | supersonic_tax_documents | **STARTER REPO** | ✅ Supersonic tax documents |
| 715 | supersonic_training_keys | **STARTER REPO** | ✅ Supersonic training keys |
| 716 | support_articles | **ADMIN** → articles | Support articles |
| 717 | support_groups | **ADMIN** → groups | Support groups |
| 718 | support_sessions | **ADMIN** → sessions | Support sessions |
| 719 | system_configuration | **ADMIN** → config | System config |
| 720 | system_errors | **ADMIN** → errors | System errors |
| 721 | tasks | **LMS** → student_tasks | Already renamed |
| 722 | tax_applications | **FINANCE** → tax_applications | Tax applications |
| 723 | tax_calculations | **FINANCE** → calculations | Tax calculations |
| 724 | tax_document_uploads | **DOCS** → tax_documents | Tax documents |
| 725 | tax_documents | **DOCS** → documents | Tax documents |
| 726 | tax_filing_applications | **FINANCE** → filings | Tax filings |
| 727 | tax_filings | **FINANCE** → filings | Tax filings |
| 728 | tax_firms | **FINANCE** → firms | Tax firms |
| 729 | tax_information | **FINANCE** → information | Tax info |
| 730 | tax_intake | **FINANCE** → intake | Tax intake |
| 731 | tax_interview_questions | **FINANCE** → questions | Tax questions |
| 732 | tax_payments | **FINANCE** → payments | Tax payments |
| 733 | tax_return_drafts | **FINANCE** → drafts | Tax drafts |
| 734 | tax_return_events | **FINANCE** → events | Tax events |
| 735 | tax_services | **FINANCE** → services | Tax services |
| 736 | tax_tools | **FINANCE** → tools | Tax tools |
| 737 | tax_withholdings | **FINANCE** → withholdings | Withholdings |
| 738 | team_members | **ADMIN** → team | Team members |
| 739 | tenant_compliance_records | **COMPLIANCE** → tenant_records | Tenant compliance |
| 740 | tenant_configurations | **ADMIN** → configs | Tenant configs |
| 741 | tenant_invitations | **ADMIN** → invitations | Tenant invites |
| 742 | tenant_licenses | **ADMIN** → licenses | Tenant licenses |
| 743 | tenant_members | **ADMIN** → members | Tenant members |
| 744 | tenant_stripe_customers | **FINANCE** → stripe_customers | Stripe customers |
| 745 | tenant_subscriptions | **STORE** → subscriptions | Tenant subs |
| 746 | tenant_usage_daily | **REPORTS** → usage | Daily usage |
| 747 | terminal_command_log | **ADMIN** → terminal_log | Terminal log |
| 748 | timeclock_cron_runs | **AUTO** → cron_job_runs | Already renamed |
| 749 | timeclock_ui_state | **HR** → ui_state | Timeclock UI |
| 750 | timesheets | **HR** → timesheets | Timesheets |

### 751-800

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 751 | timezone_names | **ADMIN** | Timezone names |
| 752 | training_access_keys | **LMS** → access_keys | Access keys |
| 753 | training_enrollments | **LMS** → enrollments | Training enrollments |
| 754 | training_hours | **LMS** → hours | Training hours |
| 755 | training_lessons | **LMS** → training_simulations | Already renamed |
| 756 | training_modules | **LMS** → modules | Training modules |
| 757 | training_partners | **PARTNER** → training_partners | Training partners |
| 758 | training_progress | **LMS** → progress | Training progress |
| 759 | training_providers | **PARTNER** → providers | Training providers |
| 760 | training_purchases | **STORE** → purchases | Training purchases |
| 761 | training_videos | **LMS** → course_videos | Training videos |
| 762 | transcript_search_log | **LMS** → search_log | Transcript search |
| 763 | transmission_statuses | **NOTIFY** → statuses | Transmission statuses |
| 764 | trial_signups | **ENROLL** → signups | Trial signups |
| 765 | tts_audio_files | **AI** → audio_files | TTS audio files |
| 766 | tts_usage_log | **AI** → usage_log | TTS usage log |
| 767 | tuition_options | **FINANCE** → options | Tuition options |
| 768 | tuition_payments | **FINANCE** → payments | Tuition payments |
| 769 | tuition_subscriptions | **FINANCE** → subscriptions | Tuition subs |
| 770 | tutorials | **LMS** → tutorials | Tutorials |
| 771 | two_factor_attempts | **ADMIN** → two_factor | 2FA attempts |
| 772 | updates | **ADMIN** → announcements | Updates |
| 773 | uploaded_documents | **DOCS** → documents | Uploaded docs |
| 774 | user_access | **ADMIN** → access | User access |
| 775 | user_activity_logs | **ADMIN** → activity_logs | Activity logs |
| 776 | user_capabilities | **USER** → capabilities | User capabilities |
| 777 | user_compliance_status | **COMPLIANCE** → status | User compliance |
| 778 | user_connections | **NOTIFY** → connections | User connections |
| 779 | user_consents | **COMPLIANCE** → consents | User consents |
| 780 | user_documents | **DOCS** → student_documents | Already renamed |
| 781 | user_files | **DOCS** → files | User files |
| 782 | user_onboarding | **ENROLL** → onboarding | User onboarding |
| 783 | user_onboarding_status | **ENROLL** → status | Onboarding status |
| 784 | user_permissions | **ADMIN** → permissions | User permissions |
| 785 | user_preferences | **USER** → preferences | User preferences |
| 786 | user_progress | **LMS** → progress | User progress |
| 787 | user_resumes | **DOCS** → resumes | User resumes |
| 788 | user_roles | **ADMIN** → roles | User roles |
| 789 | user_saved_grants | **FINANCE** → saved_grants | Saved grants |
| 790 | user_sessions | **ADMIN** → sessions | User sessions |
| 791 | v_active_programs | **REPORTS** → active_programs | Active programs view |
| 792 | v_app_slow_queries | **ADMIN** → slow_queries | Slow queries view |
| 793 | v_applications | **REPORTS** → applications | Applications view |
| 794 | v_enrolled_not_paid | **REPORTS** → enrolled_not_paid | Enrolled not paid view |
| 795 | v_funding_verification_queue | **REPORTS** → funding_queue | Funding queue view |
| 796 | v_paid_not_enrolled | **REPORTS** → paid_not_enrolled | Paid not enrolled view |
| 797 | v_payment_integrity_dashboard | **REPORTS** → integrity_dashboard | Payment integrity |
| 798 | v_published_programs | **REPORTS** → published_programs | Published programs |
| 799 | vendor_accounts | **STORE** → vendor_accounts | Vendor accounts |
| 800 | vendor_payments | **FINANCE** → vendor_payments | Vendor payments |

### 801-835

| # | Table | Destination | Notes |
|---|-------|------------|-------|
| 801 | vendor_payout_tasks | **FINANCE** → payout_tasks | Payout tasks |
| 802 | verification_actions | **COMPLIANCE** → verify_audit | Already renamed |
| 803 | video_captions | **LMS** → captions | Video captions |
| 804 | video_chapters | **LMS** → chapters | Video chapters |
| 805 | video_generation_jobs | **AI** → video_jobs | AI video generation |
| 806 | video_jobs | **AI** → jobs | Video jobs |
| 807 | video_notes | **LMS** → notes | Video notes |
| 808 | video_transcripts | **LMS** → transcripts | Video transcripts |
| 809 | video_views | **REPORTS** → views | Video views |
| 810 | vita_appointments | **STARTER REPO** | ✅ VITA - Volunteer Income Tax Assistance |
| 811 | volunteer_opportunities | **STARTER REPO** | ✅ Volunteer opportunities |
| 812 | volunteers | **STARTER REPO** | ✅ Volunteer management |
| 813 | waitlist_entries | **ENROLL** → waitlist | Already renamed |
| 814 | web_vitals | **REPORTS** → vitals | Web vitals |
| 815 | webhook_deliveries | **AUTO** → webhook_logs | Already renamed |
| 816 | webhook_health_log | **ADMIN** → health_log | Health log |
| 817 | webhook_logs | **AUTO** → processed_webhook_events | Already renamed |
| 818 | webhooks | **AUTO** → webhooks | Webhooks |
| 819 | webinar_registrations | **LMS** → registrations | Webinar reg |
| 820 | webinars | **LMS** → webinars | Webinars |
| 821 | website_pages | **PROGRAM** → pages | Website pages |
| 822 | welcome_packet_items | **ENROLL** → packets | Welcome items |
| 823 | welcome_packets | **ENROLL** → packets | Welcome packets |
| 824 | wioa_applications | **COMPLIANCE** → wioa_participant_records | Already renamed |
| 825 | wioa_documents | **COMPLIANCE** → wioa_compliance_reports | Already renamed |
| 826 | wioa_exports | **COMPLIANCE** → exports | WIOA exports |
| 827 | wioa_report_runs | **REPORTS** → wioa_runs | WIOA report runs |
| 828 | wioa_services | **COMPLIANCE** → services | WIOA services |
| 829 | withdrawals | **ENROLL** → withdrawals | Withdrawals |
| 830 | workforce_board_cases | **ADMIN** → board_cases | Board cases |
| 831 | workforce_board_notes | **ADMIN** → board_notes | Board notes |
| 832 | workforce_board_participants | **ADMIN** → board_participants | Board participants |
| 833 | workshop_categories | **LMS** → categories | Workshop categories |
| 834 | workshops | **LMS** → workshops | Workshops |
| 835 | workspace_domains | **ADMIN** → studio_workspaces | Already renamed |

---

## SUMMARY BY DESTINATION

| Destination | Count | Tables |
|-------------|-------|--------|
| **DELETE** | ~50 | Not used, deprecated, external |
| **ADMIN** | ~120 | Admin dashboard |
| **APPRENTICE** | ~35 | Apprenticeship system (APPP) |
| **LMS** | ~80 | Learning management |
| **LMS/GAMIFICATION** | ~20 | Gamification features |
| **PROGRAM** | ~50 | Program builder |
| **ENROLL** | ~50 | Enrollment system |
| **FINANCE** | ~45 | Finance/Payments |
| **CREDENTIAL** | ~25 | Credentialing |
| **PARTNER** | ~30 | Partner/Host Shop |
| **NOTIFY** | ~20 | Notifications |
| **DOCS** | ~15 | Documents |
| **AUTO** | ~20 | Automation |
| **STORE** | ~20 | E-commerce |
| **HR** | ~15 | HR/Payroll |
| **REPORTS** | ~35 | Analytics |
| **AI** | ~15 | AI features |
| **COMPLIANCE** | ~30 | Legal/Compliance |
| **TESTING** | ~15 | Testing center |
| **USER** | ~5 | User preferences |
| **STAFF** | ~5 | Staff portal |
| **STUDENT** | ~10 | Student portal |
| **STUDENT/QUICKBOOKS** | ~3 | QuickBooks payroll |
| **FSSA** | ~6 | Archive for FSSA (Indiana) |
| **JTI** | ~5 | JTI (Job Ready Indy) - SCORM |
| **APPP** | ~3 | APPP - Apprenticeship for grants |
| **STARTER REPO** | ~10 | Starter repository |

---

## DELETE LIST (~50 tables) - TO BE CONFIRMED

```
academic_integrity_violations
accreditation_evidence
accreditation_records
accreditation_reviews
accreditation_standards
accreditations
ambient_music_log
app_screenshot_views
captcha_attempts
cmi_attendance
cmi_certificates
cmi_clinicals
cmi_competencies
cmi_students
cobra_enrollments
cross_tenant_access
curvature_reviews
ecr_snapshots
ecr_sync_logs
franchises
jri_participants
milady_access
milady_email_logs
milady_enrollments
milady_license_codes
milady_orientation_status
milady_provisioning_queue
milady_rise_enrollments
sap_records
sfc_documents
sfc_leads
sfc_tax_documents
sfc_tax_return_public_status
sfc_tax_returns
sfc_tax_returns_public_lookup
snap_outreach_log
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

---

## OTHER REPOSITORIES (NOT DELETE - MOVE TO OTHER REPOS)

### STARTER REPO (~10 tables)
```
supersonic_applications
supersonic_appointments
supersonic_careers
supersonic_tax_documents
supersonic_training_keys
vita_appointments
volunteer_opportunities
volunteers
org_invitations (shared)
tenant_invitations (shared)
```

### JTI - Job Ready Indy (~5 tables)
```
scorm_completion_summary
scorm_progress
scorm_registrations
scorm_sessions
scorm_state
```

### APPP - Apprenticeship for Grants (~3 tables)
```
sam_alerts
sam_documents
sam_entities
```

### STUDENT/QUICKBOOKS (~3 tables)
```
payroll
payroll_records
apprentice_payroll
```

---

## NEXT STEPS

1. **Confirm DELETE list** - Review ~50 tables to delete
2. **Create migrations for RENAMES** - Tables that need to be renamed
3. **Create migration for DELETES** - Tables to delete from Elevate LMS
4. **Export to other repos** - Tables that go to other repos (JTI, APPP, Starter)
5. **Verify all destinations** - Make sure destinations exist in code
