# 🔴 DUPLICATE TABLES & LEGACY ROUTES AUDIT

**Date:** July 7, 2026  
**Purpose:** Side-by-side comparison of duplicate tables + legacy routes

---

## PART 1: DUPLICATE TABLES REQUIRING MERGE ANALYSIS

### GROUP 1: DOCUMENTS (40+ tables → Should merge to 3-5)

| Current Table | Belongs To | Merge Into | Columns to Add |
|---------------|-----------|-----------|---------------|
| `apprentice_documents` | APPRENTICE | `documents` | Add `source = 'apprentice'` |
| `apprentice_uploads` | APPRENTICE | `documents` | Add `type = 'upload'` |
| `employee_documents` | STAFF | `documents` | Add `source = 'employee'` |
| `learner_documents` | LEARNER | `documents` | Add `source = 'learner'` |
| `user_documents` | USER | `documents` | Already renamed |
| `user_files` | USER | `documents` | Already renamed |
| `uploaded_documents` | DOCS | `documents` | Already renamed |
| `compliance_documents` | COMPLIANCE | `documents` | Add `category = 'compliance'` |
| `ferpa_documents` | COMPLIANCE | `documents` | Add `type = 'ferpa'` |
| `tax_documents` | PAYROLL/STRIPE | `documents` | Add `category = 'tax'` |
| `sfc_tax_documents` | STARTER REPO | `documents` | Already going to Starter |
| `supersonic_tax_documents` | STARTER REPO | `documents` | Already going to Starter |
| `mou_documents` | PARTNER | `documents` | Add `type = 'mou'` |
| `required_documents` | DOCS | `documents` | Already renamed |
| `document_signatures` | DOCS | `signatures` | Already renamed |
| `document_verifications` | DOCS | `verifications` | Already renamed |
| `document_audit_log` | DOCS | `audit_logs` | Already renamed |
| `shared_documents` | DOCS | `documents` | Add `shared = true` |
| `rag_documents` | AI | `documents` | Add `ai_generated = true` |
| `sam_documents` | APPP | `documents` | Already going to APPP |
| `partner_profiles` | PARTNER | `profiles` | Different - keep separate |
| `shop_profiles` | HOST SHOP | `profiles` | Different - keep separate |

**RECOMMENDATION:** 
- Create unified `documents` table with `source` column
- Merge: apprentice_documents, employee_documents, learner_documents, compliance_documents, ferpa_documents, tax_documents, mou_documents, shared_documents, rag_documents
- Delete: duplicated specific tables

---

### GROUP 2: ATTENDANCE (8 tables → Should merge to 2-3)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `staff_attendance` | STAFF | `attendance` (master) |
| `attendance_hours` | STAFF | `attendance` |
| `cmi_attendance` | DELETE | CMI not built |
| `fssa_attendance` | FSSA | `fssa_attendance` (archive) |
| `live_class_attendance` | LMS | `attendance` |
| `timeclock_cron_runs` | WORKFLOW | `cron_runs` (already renamed) |
| `timeclock_ui_state` | WORKFLOW | `ui_state` |
| `open_timeclock_shifts` | STAFF | `shifts` |

**RECOMMENDATION:**
- Master table: `attendance` with columns for type/source
- Merge: attendance_hours, live_class_attendance
- Keep separate: fssa_attendance (archive), timeclock_ui_state (UI state)

---

### GROUP 3: PROGRESS (20+ tables → Should merge to 5-8)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `student_progress` | LEARNER | `progress` (renamed) |
| `user_progress` | USER | `progress` |
| `course_progress` | LMS | `progress` |
| `module_progress` | LMS | `progress` |
| `student_module_progress` | LEARNER | `progress` |
| `enrollment_module_progress` | LMS | `progress` |
| `external_module_progress` | LMS | `progress` |
| `training_progress` | TRAINING | `progress` |
| `staff_training_progress` | STAFF | `progress` |
| `scorm_progress` | JTI | `scorm_progress` (export) |
| `activity_progress` | LEARNER | `progress` |
| `flashcard_progress` | LMS | `progress` |
| `completions` | LMS | `completion_records` |
| `barber_completions` | APPRENTICE | `completion_records` |
| `barber_lesson_progress` | APPRENTICE | `progress` |

**RECOMMENDATION:**
- Master table: `progress` with `type` column
- Separate: `completion_records` for completions
- Export: scorm_progress to JTI repo

---

### GROUP 4: ENROLLMENT (22 tables → Should merge to 5-8)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `program_enrollments` | APPLICATIONS | `enrollments` (renamed) |
| `partner_course_enrollments` | PARTNER | `enrollments` |
| `external_lms_enrollments` | LMS | `enrollments` |
| `training_enrollments` | TRAINING | `enrollments` |
| `milady_enrollments` | DELETE | Milady not used |
| `milady_rise_enrollments` | DELETE | Milady not used |
| `hsi_enrollment_queue` | APPLICATIONS | `enrollment_queue` |
| `benefits_enrollments` | STAFF | `benefits_enrollments` |
| `cobra_enrollments` | DELETE | COBRA not built |
| `enrollment_acknowledgments` | APPLICATIONS | `enrollments` |
| `enrollment_agreements` | APPLICATIONS | `enrollments` |
| `enrollment_status_history` | APPLICATIONS | `enrollments` |
| `enrollment_transitions` | APPLICATIONS | `enrollments` |
| `enrollment_funding_records` | PAYROLL/STRIPE | `funding_records` |
| `enrollment_payments` | PAYROLL/STRIPE | `payments` |
| `enrollment_voucher_audit` | PAYROLL/STRIPE | `voucher_audit` |
| `reporting_enrollments` | REPORTS | `reports` |

**RECOMMENDATION:**
- Master table: `enrollments` with `source` column
- Separate tables: `benefits_enrollments`, `funding_records`
- Delete: milady_*, cobra_enrollments

---

### GROUP 5: MODULES (16 tables → Should merge to 5-8)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `program_modules` | STUDIO | `modules` (master) |
| `program_curriculum_modules` | STUDIO | `modules` |
| `training_modules` | TRAINING | `modules` |
| `staff_training_modules` | STAFF | `modules` |
| `course_module_settings` | STUDIO | `module_settings` |
| `barber_module_hour_config` | APPRENTICE | `module_config` |
| `external_modules` | LMS | `external_modules` |
| `external_partner_modules` | PARTNER | `external_modules` |
| `module_competencies` | CHECK | `competencies` |
| `module_objectives` | STUDIO | `objectives` |
| `module_progress` | LMS | `progress` |
| `learner_module_gate_state` | LMS | `gate_state` |

**RECOMMENDATION:**
- Master table: `modules` with `source` column
- Separate: `module_settings`, `module_config`, `competencies`, `objectives`, `external_modules`

---

### GROUP 6: APPLICATIONS (23 tables → Should merge to 5-8)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `application_submissions` | APPLICATIONS | `applications` (master) |
| `student_applications` | APPLICATIONS | `applications` |
| `career_applications` | APPLICATIONS | `applications` |
| `employer_applications` | PARTNER | `applications` |
| `shop_applications` | HOST SHOP | `applications` |
| `staff_applications` | STAFF | `applications` |
| `seller_applications` | STORE | `applications` |
| `affiliate_applications` | DELETE | Affiliate not built |
| `cash_advance_applications` | PAYROLL/STRIPE | `advance_applications` |
| `funding_applications` | PAYROLL/STRIPE | `funding_applications` |
| `scholarship_applications` | PAYROLL/STRIPE | `scholarship_applications` |
| `tax_filing_applications` | STARTER REPO | `applications` |
| `supersonic_applications` | STARTER REPO | `applications` |
| `wioa_applications` | COMPLIANCE | `applications` |
| `program_holder_applications` | APPLICATIONS | `applications` |

**RECOMMENDATION:**
- Master table: `applications` with `type` column
- Separate: `advance_applications`, `funding_applications`, `scholarship_applications`
- Delete: affiliate_applications

---

### GROUP 7: REPORTS (14 tables → Should merge to 5-8)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `reports` | REPORTS | `reports` (master) |
| `reporting_completions` | REPORTS | `reports` |
| `reporting_enrollments` | REPORTS | `reports` |
| `reporting_funding` | REPORTS | `reports` |
| `reporting_progress` | REPORTS | `reports` |
| `reporting_verdicts` | REPORTS | `reports` |
| `moderation_reports` | ADMIN | `moderation_reports` |
| `product_reports` | STORE | `product_reports` |
| `shop_reports` | HOST SHOP | `reports` |
| `shop_weekly_reports` | HOST SHOP | `reports` |
| `program_holder_reports` | REPORTS | `reports` |
| `wioa_report_runs` | COMPLIANCE | `report_runs` |

**RECOMMENDATION:**
- Master table: `reports` with `category` column
- Separate: `moderation_reports`, `product_reports`, `report_runs`

---

### GROUP 8: SCHEDULES (5 tables → Should merge to 2-3)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `bookings` | NOTIFY | `appointments` (master) |
| `interview_schedules` | NOTIFY | `appointments` |
| `followup_schedule` | NOTIFY | `followups` |
| `shift_schedules` | STAFF | `schedules` |
| `open_timeclock_shifts` | STAFF | `shifts` |

**RECOMMENDATION:**
- Master table: `appointments` for bookings/interviews
- Separate: `followups`, `schedules`, `shifts`

---

### GROUP 9: CREDENTIALS (10 tables → Should merge to 3-5)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `credentials` | CHECK | `credentials` (master) |
| `credential_submissions` | CHECK | `credential_submissions` |
| `credential_blueprints` | CHECK | `credential_blueprints` |
| `credential_providers` | CHECK | `providers` |
| `student_credentials` | LEARNER | `credentials` (renamed) |
| `partner_credentials` | PARTNER | `credentials` |
| `credentialing_partners` | CHECK | `partners` |
| `student_credential_uploads` | LEARNER | `credential_uploads` |

**RECOMMENDATION:**
- Master table: `credentials` with `source` column
- Separate: `credential_submissions`, `credential_blueprints`, `providers`

---

### GROUP 10: PAYMENTS (10+ tables → Should merge to 3-5)

| Current Table | Belongs To | Merge Into |
|---------------|-----------|-----------|
| `payments` | PAYROLL/STRIPE | `payments` (master) |
| `payment_transactions` | PAYROLL/STRIPE | `payments` (renamed) |
| `student_payments` | LEARNER | `payments` |
| `enrollment_payments` | APPLICATIONS | `payments` |
| `partner_course_payments` | PARTNER | `payments` |
| `tuition_payments` | PAYROLL/STRIPE | `payments` |
| `vendor_payments` | PAYROLL/STRIPE | `vendor_payments` |
| `payroll` | STUDENT/QUICKBOOKS | `payroll` (keep separate) |
| `payroll_records` | STUDENT/QUICKBOOKS | `payroll_records` (keep separate) |
| `apprentice_payroll` | STUDENT/QUICKBOOKS | `payroll` |

**RECOMMENDATION:**
- Master table: `payments` with `source` column
- Keep separate: `payroll`, `payroll_records` (QuickBooks sync)

---

## PART 2: LEGACY ROUTES AUDIT

### ROUTES TO DELETE (Legacy/Not Used)

```
DELETE THESE LEGACY ROUTES:

app/api/accreditation/report/route.ts        - Accreditation not built
app/api/alert-scraper/route.ts             - Scraper detection not used
app/api/barber-competencies/                - Barber (use apprenticeship)
app/api/barber-documents/                  - Barber (use apprenticeship)
app/api/barber-hours/                      - Barber (use apprenticeship)
app/api/barber-license/                    - Barber (use credentials)
app/api/barber-shop/                       - Barber (use host shop)
app/api/barber-signoff/                    - Barber (use apprenticeship)
app/api/career-coach/                      - Career coach not built
app/api/cert-prep/                         - Cert prep not built
app/api/clinical-hours/                    - Clinical not built (CMI)
app/api/clinical-sites/                    - Clinical not built
app/api/cmi/                               - CMI not built
app/api/competency-tests/                   - Use testing center
app/api/contract-generator/                 - Contract gen not built
app/api/contract-sign/                      - Contract sign (use documents)
app/api/contract-templates/                - Contract templates (use sop_templates)
app/api/corporate-training/                 - Corporate not built
app/api/course-builder/                    - Use studio
app/api/digital-binder/                    - Digital binder not built
app/api/digital-purchase/                  - Digital purchase not built
app/api/discussion-forum/                  - Forum not built
app/api/eighteen-plus/                     - Age verification not built
app/api/employee-portal/                   - Use staff dashboard
app/api/employer-portal/                   - Use employer dashboard
app/api/enrollment-verification/           - Use enrollment
app/api/entry-exam/                        - Entry exam not built
app/api/ferpa/                             - FERPA not built
app/api/flashcards/                        - Flashcards not built
app/api/franchise/                         - Franchise not built
app/api/freshdesk/                         - Freshdesk not used
app/api/gamification/                     - Gamification (keep but integrate)
app/api/gdpr/                              - GDPR not built
app/api/grant-tracker/                     - Grants not built
app/api/group-mentorship/                  - Mentorship not built
app/api/guardian-consent/                  - Consent not built
app/api/hipaa/                             - HIPAA not built
app/api/hiring-fair/                       - Hiring fair not built
app/api/hsi-enrollment/                    - HSI not built
app/api/industry-partner/                  - Use partner dashboard
app/api/internship-portal/                 - Internship not built
app/api/job-board/                         - Job board (use Adzuna)
app/api/job-shadow/                        - Job shadow not built
app/api/jri/                               - JRI not built
app/api/leaderboard/                       - Leaderboard (keep for gamification)
app/api/mentor-match/                      - Mentor match not built
app/api/milady/                            - Milady not used
app/api/navigation/                        - Use admin
app/api/nds-catalog/                       - NDS not built
app/api/newsletter-signup/                 - Newsletter (use communications)
app/api/occupation-standard/               - Occupation standards not built
app/api/office-hours/                      - Office hours not built
app/api/ojt-log/                          - OJT (use apprenticeship)
app/api/onboarding-wizard/                 - Use enrollment
app/api/online-learning/                   - Online learning (use LMS)
app/api/parent-portal/                     - Parent portal not built
app/api/payment-plan/                      - Payment plan (use Stripe)
app/api/peer-review/                      - Peer review not built
app/api/peer-tutoring/                    - Peer tutoring not built
app/api/portfolio-builder/                 - Portfolio not built
app/api/practice-quiz/                    - Practice (use testing)
app/api/pre-apprenticeship/               - Pre-apprenticeship not built
app/api/professional-development/           - Prof dev not built
app/api/program-review/                   - Program review not built
app/api/pronoun-selection/                  - Pronouns not built
app/api/rapids/                            - RAPIDS (use apprenticeship)
app/api/refund-request/                    - Refund (use Stripe)
app/api/registration-wizard/               - Use enrollment
app/api/rise-enrollment/                   - RISE not built
app/api/sam-api/                           - SAM (use APPP)
app/api/scholarship-tracker/               - Scholarships not built
app/api/school-partnership/               - School partnership not built
app/api/scorm/                             - SCORM (export to JTI)
app/api/self-paced-course/                  - Self-paced (use LMS)
app/api/sfc-tax/                          - SFC (export to Starter)
app/api/skill-badges/                      - Badges (keep for gamification)
app/api/skill-bridge/                      - Skill bridge not built
app/api/snap-outreach/                     - Snap outreach not used
app/api/sos-api/                          - SOS (Indiana) not built
app/api/state-licensing/                   - State licensing (use credentials)
app/api/student-loan/                      - Student loan not built
app/api/student-wellness/                  - Wellness not built
app/api/supersonic/                        - Supersonic (export to Starter)
app/api/teacher-portal/                     - Teacher portal not built
app/api/time-clock/                        - Time clock (use attendance)
app/api/training-completion/                - Training (use LMS)
app/api/training-partner/                  - Training partner (use partner)
app/api/tutoring-center/                   - Tutoring not built
app/api/video-conference/                  - Video (use Zoom)
app/api/virtualCareer/                      - Virtual career not built
app/api/vita-tax/                          - VITA (export to Starter)
app/api/workforce-board/                   - Workforce board not built
app/api/work-study/                        - Work study not built
```

---

### ROUTES TO KEEP & ACTIVATE

```
KEEP THESE ROUTES (activate in proper dashboards):

ADMIN DASHBOARD:
app/api/admin/ai-assistant/route.ts           ✅
app/api/admin/audit-logs/route.ts              ✅
app/api/admin/site-health/route.ts             ✅
app/api/admin/workflows/route.ts              ✅
app/api/admin/reports/generate/route.ts       ✅

LEARNER DASHBOARD:
app/api/learner/competencies/route.ts          ✅
app/api/learner/apprenticeship/route.ts        ✅
app/api/learner/progress/route.ts             ✅

APPRENTICESHIP DASHBOARD:
app/api/apprenticeship/hours/route.ts         ✅
app/api/apprenticeship/daily-theory/route.ts  ✅
app/api/apprentice/hours-summary/route.ts     ✅

STUDIO (COURSE BUILDER):
app/api/admin/lms/courses/route.ts           ✅
app/api/ai/generate-course/route.ts            ✅

CHECK (CREDENTIALS):
app/api/credentialing/route.ts                ✅

TESTING CENTER:
app/api/admin/testing-center/route.ts         ✅

HOST SHOP DASHBOARD:
app/api/host-shop/                             ✅ (need to create)

PARTNER DASHBOARD:
app/api/partners/                             ✅ (need to create)

PAYROLL/STRIPE:
app/api/admin/stripe-apprentice-payments/     ✅
app/api/admin/quickbooks/                     ✅

STAFF DASHBOARD:
app/api/staff/qa-checklist/route.ts          ✅
app/api/staff/training/route.ts               ✅
```

---

### MISSING ROUTES TO CREATE

```
NEED TO CREATE THESE ROUTES:

LEARNER DASHBOARD:
app/api/learner/documents/route.ts
app/api/learner/attendance/route.ts
app/api/learner/certificates/route.ts
app/api/learner/grades/route.ts
app/api/learner/notifications/route.ts

APPRENTICESHIP DASHBOARD:
app/api/apprenticeship/competencies/route.ts
app/api/apprenticeship/documents/route.ts
app/api/apprenticeship/evaluations/route.ts
app/api/apprenticeship/host-shops/route.ts
app/api/apprenticeship/journey-plan/route.ts

HOST SHOP DASHBOARD:
app/api/host-shop/apprentices/route.ts
app/api/host-shop/hours/route.ts
app/api/host-shop/evaluations/route.ts
app/api/host-shop/calendar/route.ts
app/api/host-shop/documents/route.ts

PARTNER DASHBOARD:
app/api/partner/enrollments/route.ts
app/api/partner/courses/route.ts
app/api/partner/reports/route.ts
app/api/partner/documents/route.ts

STUDENT/QUICKBOOKS:
app/api/payroll/employees/route.ts
app/api/payroll/payments/route.ts
app/api/payroll/reports/route.ts
app/api/payroll/quickbooks-sync/route.ts

TESTING CENTER:
app/api/testing/schedule/route.ts
app/api/testing/results/route.ts
app/api/testing/authorization/route.ts

LMS DASHBOARD:
app/api/lms/courses/route.ts
app/api/lms/lessons/route.ts
app/api/lms/progress/route.ts
app/api/lms/grades/route.ts

GAMIFICATION:
app/api/gamification/points/route.ts
app/api/gamification/badges/route.ts
app/api/gamification/streaks/route.ts
app/api/gamification/leaderboard/route.ts
```

---

## PART 3: MERGE SUMMARY

### TABLES TO MERGE (Side-by-Side Comparison)

| Group | Tables | Action | New Table |
|-------|--------|--------|-----------|
| DOCUMENTS | 40+ | MERGE | `documents` with `source` |
| ATTENDANCE | 8 | MERGE | `attendance` with `type` |
| PROGRESS | 20+ | MERGE | `progress` with `category` |
| ENROLLMENTS | 22 | MERGE | `enrollments` with `source` |
| MODULES | 16 | MERGE | `modules` with `source` |
| APPLICATIONS | 23 | MERGE | `applications` with `type` |
| REPORTS | 14 | MERGE | `reports` with `category` |
| SCHEDULES | 5 | MERGE | `appointments` |
| CREDENTIALS | 10 | MERGE | `credentials` with `source` |
| PAYMENTS | 10+ | MERGE | `payments` with `source` |

### ROUTES TO DELETE: ~100+ legacy routes
### ROUTES TO CREATE: ~40+ missing routes
### ROUTES TO KEEP: ~1500 active routes

---

## NEXT STEPS

1. **Create merge migrations** for duplicate tables
2. **Delete legacy routes** from codebase
3. **Create missing routes** for all dashboards
4. **Test all integrations**

**Ready to proceed with merges?**