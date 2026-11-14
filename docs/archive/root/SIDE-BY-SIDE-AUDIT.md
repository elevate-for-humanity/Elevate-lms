# SIDE-BY-SIDE CODEBASE AUDIT

**Generated:** July 7, 2026  
**Purpose:** Map entire codebase to avoid duplicates

---

## OVERVIEW

- **Total API Routes:** 1,065
- **Total Pages:** ~400+
- **Total Components:** 500+

This audit maps key systems to understand what's built.

---

# 1. ENROLLMENT SYSTEM

## Side-by-Side: All Enrollment-Related APIs

| What | Where | Status |
|------|-------|--------|
| **Decision Engine (NEW)** | `/api/enrollment/decision` | ✅ JUST CREATED |
| **Re-Evaluate (NEW)** | `/api/enrollment/reevaluate` | ✅ JUST CREATED |
| Main Enrollment | `/api/enrollment/route.ts` | ✅ |
| Enrollment Next Action | `/api/enrollment/next-action` | ✅ |
| Enrollment Submit | `/api/enrollment/submit` | ✅ |
| Enrollment Approve | `/api/enrollment/approve` | ✅ |
| Enrollment Documents | `/api/enrollment/documents` | ✅ |
| Enrollment Upload | `/api/enrollment/upload-document` | ✅ |
| Enrollment Orientation | `/api/enrollment/orientation` | ✅ |
| Enrollment Complete Orientation | `/api/enrollment/complete-orientation` | ✅ |
| Enrollment Save Progress | `/api/enrollment/save-progress` | ✅ |
| Enrollment Cron (AUTO)** | `/api/cron/enrollment-automation` | ✅ |
| V1 Enrollments | `/api/v1/enrollments` | ✅ |
| Enrollment Create | `/api/enrollments/create` | ✅ |
| Enrollment Checkout | `/api/enrollments/checkout` | ✅ |
| Enrollment Host Shop | `/api/enrollments/host-shop` | ✅ |
| Enrollment Apprentice | `/api/enrollments/apprentice` | ✅ |
| Enrollment Complete Program | `/api/enrollments/complete-program` | ✅ |
| Enrollment Stats | `/api/enrollment-stats` | ✅ |
| Enrollment Count | `/api/enrollment-count` | ✅ |
| Enrollment Status | `/api/lms/enrollment-status` | ✅ |

### ⚠️ POTENTIAL DUPLICATES FOUND:

| Duplicate? | File 1 | File 2 |
|------------|--------|--------|
| ❌ NO | `/api/enrollment/route.ts` | `/api/enrollments/route.ts` |
| **NOTE:** | Main enrollment entry | Main enrollments CRUD |

---

# 2. LEAD SYSTEM

## Side-by-Side: All Lead-Related APIs

| What | Where | Status |
|------|-------|--------|
| Lead Capture (Funnel) | `/api/funnel/lead` | ✅ |
| CRM Leads | `/api/crm/leads` | (needs check) |
| Exam Booking Leads | `/api/exam-booking-leads` | ✅ |
| Workforce Referral | `/api/workforce-referral` | ✅ |

### Lead Tables:

| Table | Migration | Status |
|-------|----------|--------|
| `leads` | `20260124200000_admin_tables_v2.sql` | ✅ EXISTS |
| `crm_leads` | `20260604000005_crm_leads.sql` | ✅ EXISTS |
| `sfc_leads` | `20260430000007_fix_failed_migrations.sql` | ✅ EXISTS |
| `exam_booking_leads` | `20260608000002_exam_booking_leads.sql` | ✅ EXISTS |

### ⚠️ DUPLICATE TABLES FOUND:

| Duplicate? | Table 1 | Table 2 |
|------------|--------|--------|
| ❌ NO | `leads` | `crm_leads` |
| **NOTE:** | Basic leads | CRM-extended leads |
| ❌ NO | `leads` | `sfc_leads` |
| **NOTE:** | General | SFC-specific |

---

# 3. APPLICATION SYSTEM

## Side-by-Side: All Application-Related APIs

| What | Where | Status |
|------|-------|--------|
| Application Submit | `/api/application/submit` | ✅ |
| Application Status | `/api/application/status` | ✅ |
| Application Fee Checkout | `/api/application-fee/checkout` | ✅ |
| Application Fee Webhook | `/api/application-fee/webhook` | ✅ |
| Application Review Queue (NEW) | `/admin/applications/queue` | ✅ JUST CREATED |

### Application Tables:

| Table | Migration | Status |
|-------|----------|--------|
| `applications` | `20260227000003_schema_governance_baseline.sql` | ✅ EXISTS |
| `apprentice_applications` | `20260128000001_barber_apprenticeship_system.sql` | ✅ EXISTS |
| `host_shop_applications` | `20260128000001_barber_apprenticeship_system.sql` | ✅ EXISTS |
| `partner_applications` | `20260124000002_partner_shop_system.sql` | ✅ EXISTS |
| `barbershop_partner_applications` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |
| `employer_applications` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |
| `funding_applications` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |
| `career_applications` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |

### Application Status ENUM:

| File | Status Values |
|------|--------------|
| `20260503000008_applications_status_enum.sql` | submitted, in_review, under_review, approved, rejected, enrolled, pending_workone, waitlisted |
| `20260707000001_expanded_enrollment_statuses.sql` (NEW) | + fee_required, documents_required, paris_required, eligibility_review, funding_verification, manual_review, ready_for_enrollment, auto_enrolled |

---

# 4. PARiS SYSTEM

## Side-by-Side: All PARiS-Related APIs

| What | Where | Status |
|------|-------|--------|
| PARiS Main | `/api/paris` | ✅ |
| PARiS Session | `/api/paris/session` | ✅ |
| Career Interviews | `/api/career/interviews` | ✅ |

### ✅ PARiS Tables (FOUND):

| Table | Migration | Status |
|-------|----------|--------|
| `ai_interview_sessions` | `20260705000001_paris_career_guidance.sql` | ✅ EXISTS |
| `ai_interview_messages` | `20260705000001_paris_career_guidance.sql` | ✅ EXISTS |
| `ai_interview_assessments` | `20260705000001_paris_career_guidance.sql` | ✅ EXISTS |
| `career_counseling_conversations` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |
| `interviews` | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |

**✅ DECISION ENGINE UPDATED to use `ai_interview_sessions` table.**

---

# 5. DOCUMENT SYSTEM

## Side-by-Side: All Document-Related APIs

| What | Where | Status |
|------|-------|--------|
| Document Upload | `/api/enrollment/upload-document` | ✅ |
| Document Submit | `/api/enrollment/submit-documents` | ✅ |
| Partner Upload | `/api/partners/upload-document` | ✅ |
| OCR Extract | `/api/ocr/extract` | ✅ |

### Document Tables:

| Table | Migration | Status |
|-------|----------|--------|
| `documents` | `20260227000003_schema_governance_baseline.sql` | ✅ EXISTS |
| `apprentice_documents` | `20260527000003_apprentice_document_system.sql` | ✅ EXISTS |
| `sos_generated_documents` | `20260527000010_submissions_os_packets_audit.sql` | ✅ EXISTS |

---

# 6. WORKFLOW SYSTEM

## Side-by-Side: All Workflow-Related APIs

| What | Where | Status |
|------|-------|--------|
| Workflows Main | `/api/workflows` | ✅ |
| Workflow Webhook | `/api/workflows/webhook` | ✅ |
| Email Workflows | `/api/email/workflows` | ✅ |
| Email Workflow Processor | `/api/email/workflows/processor` | ✅ |
| Intake Workflow | `/api/intake/workflow` | ✅ |
| Workflow Event Processor | `/api/internal/workflow-event-processor` | ✅ |
| Workflow Schedule Processor | `/api/internal/workflow-schedule-processor` | ✅ |
| Compliance Automation | `/api/compliance/automation` | ✅ |
| Content Automation | `/api/ecosystem/content-automation` | ✅ |
| Store Process Queue | `/api/store/process-queue` | ✅ |

### Workflow Tables:

| Table | Status |
|-------|--------|
| `workflows` | ✅ EXISTS |
| `email_workflows` | ✅ EXISTS |
| `workflow_events` | ✅ EXISTS |

---

# 7. DASHBOARD SYSTEM

## Side-by-Side: All Dashboards

| Dashboard | Route | Status |
|-----------|-------|--------|
| Admin Dashboard | `/admin/dashboard` | ✅ |
| Admin Applications | `/admin/applications` | ✅ |
| Admin CRM | `/admin/crm` | ✅ |
| Admin CRM Leads | `/admin/crm/leads` | ✅ |
| **Admin Queue (NEW)** | `/admin/applications/queue` | ✅ JUST CREATED |
| LMS Dashboard | `/lms/dashboard` | ✅ |
| Learner Dashboard | `/learner/dashboard` | ✅ |
| Employer Dashboard | `/employer/dashboard` | ✅ |
| Case Manager Dashboard | `/case-manager/dashboard` | ✅ |
| Partner Dashboard | `/partner/dashboard` | ✅ |
| Program Holder Dashboard | `/program-holder/dashboard` | ✅ |
| Host Shop Dashboard | `/host-shop/dashboard` | ❌ **STUB PAGE** |
| Workforce Board Dashboard | `/workforce-board/dashboard` | ✅ |

---

# 8. HOST SHOP SYSTEM

## Side-by-Side: Host Shop Routes

| What | Where | Status |
|------|-------|--------|
| Host Shop Landing | `/host-shop` | ✅ |
| Host Shop Dashboard | `/host-shop/dashboard` | ❌ **STUB PAGE** |
| Barber Host Shop | `/partners/barber-host-shop` | ✅ |
| Cosmetology Host Shop | `/partners/cosmetology-host-shop` | ✅ |
| Esthetician Host Shop | `/partners/esthetician-host-shop` | ✅ |
| Nail Host Shop | `/partners/nail-host-shop` | ✅ |

### Host Shop APIs:

| What | Where | Status |
|------|-------|--------|
| Barber Apply | `/api/partners/barber-host-shop/apply` | ✅ |
| Barber Sign MOU | `/api/partners/barber-host-shop/sign-mou` | ✅ |
| Cosmetology Apply | `/api/partners/cosmetology-host-shop/apply` | ✅ |
| Cosmetology Sign MOU | `/api/partners/cosmetology-host-shop/sign-mou` | ✅ |
| Esthetician Apply | `/api/partners/esthetician-apprenticeship/apply` | ✅ |
| Nail Apply | `/api/partners/nail-technician-apprenticeship/apply` | ✅ |

---

# 9. PAYMENT SYSTEM

## Side-by-Side: Payment APIs

| What | Where | Status |
|------|-------|--------|
| Stripe Checkout | `/api/stripe/checkout` | ✅ |
| Stripe Webhook | `/api/stripe/webhook` | ✅ |
| Stripe Connect | `/api/stripe/connect` | ✅ |
| Application Fee Checkout | `/api/application-fee/checkout` | ✅ |
| Application Fee Webhook | `/api/application-fee/webhook` | ✅ |
| Enrollment Checkout | `/api/enrollments/checkout` | ✅ |
| Checkout Create | `/api/checkout/create` | ✅ |
| Checkout Learner | `/api/checkout/learner` | ✅ |
| Checkout Program | `/api/checkout/program` | ✅ |
| Billing Portal | `/api/billing/portal` | ✅ |

### Payment Tables:

| Table | Status |
|-------|--------|
| `payments` | ✅ EXISTS |
| `payment_integrity_flags` | ✅ EXISTS |

---

# 10. EMAIL/SMS SYSTEM

## Side-by-Side: Communication APIs

| What | Where | Status |
|------|-------|--------|
| Email Service | `/lib/email/service.ts` | ✅ |
| Email Workflows | `/api/email/workflows` | ✅ |
| Email Workflow Processor | `/api/email/workflows/processor` | ✅ |
| SMS Service | `/lib/notifications/sms.ts` | ✅ TWILIO |
| Notification Send | `/api/notifications/send` | ✅ |
| Notification Broadcast | `/api/notifications/broadcast` | ✅ |
| Notification Subscribe | `/api/notifications/subscribe` | ✅ |
| Process Notifications Cron | `/api/cron/process-notifications` | ✅ |

### SMS Functions:

| Function | Location | Status |
|----------|----------|--------|
| sendSMS() | `lib/notifications/sms.ts` | ✅ |
| sendSMSNotifications() | `lib/communication/announcements.ts` | ✅ |
| sendSMSAlert() | `lib/security/real-time-alerts.ts` | ✅ |
| sendSMSNotification() | `lib/grants/notification-system.ts` | ✅ |

---

# 11. AI SYSTEM

## Side-by-Side: AI APIs

| What | Where | Status |
|------|-------|--------|
| PARiS AI | `/api/paris` | ✅ |
| AI Instructor | `/api/ai/instructor` | ✅ |
| AI Execute Task | `/lib/ai/execute-ai-task` | ✅ |
| AI Chat | `/api/chat` | ✅ |

---

# 12. STATE MACHINE SYSTEM

## Side-by-Side: State Machines

| What | Where | Status |
|------|-------|--------|
| Enrollment State Machine | `/lib/enrollment/state-machine.ts` | ✅ |
| Employer State Machine | `/lib/orchestration/state-machine.ts` | ✅ |
| Host Shop Onboarding | `/lib/partners/host-shop-onboarding.ts` | ✅ |

---

# DUPLICATE ANALYSIS

## Potential Duplicates Found:

| Issue | Location 1 | Location 2 | Action |
|-------|-----------|-----------|--------|
| None | - | - | ✅ CLEAN |

## Gaps Found:

| Gap | Status | Priority |
|-----|--------|----------|
| Host Shop Dashboard is stub | ❌ | CRITICAL |
| PARiS tables | ✅ FOUND | N/A |
| SMS Integration | ✅ FOUND | N/A |

---

# CRITICAL ACTIONS NEEDED

## 1. Host Shop Dashboard (CRITICAL)

**Current:** `/host-shop/dashboard/page.tsx` is a stub

**What exists for Host Shop:**
- Landing page: `/host-shop`
- Apply flows: `/partners/*-host-shop`
- Sign MOU: `/api/partners/*/sign-mou`
- Partner dashboard: `/partner/dashboard`
- SMS Integration: ✅ TWILIO
- PARiS Interview: ✅ `ai_interview_sessions`

**What is MISSING:**
- Real dashboard with apprentice management
- Hour tracking
- Competency management
- Schedule view
- Document management
- Reports

---

# FILE COUNT SUMMARY

| Category | Count |
|----------|-------|
| Total API Routes | 1,065 |
| Total Pages | ~400 |
| Total Components | ~500 |
| Total Migrations | 150+ |

---

**Report Version:** 1.0  
**Last Updated:** July 7, 2026
