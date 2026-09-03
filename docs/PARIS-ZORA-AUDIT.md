# PARIS–ZORA End-to-End Workflow Audit Report

**Date:** 2026-07-23
**Status:** CRITICAL GAPS IDENTIFIED
**Engine:** PARIS (✅ EXISTS) | ZORA (❌ NOT IMPLEMENTED)

---

## Executive Summary

The Elevate LMS platform has built substantial **PARIS** components for the student-facing admissions and enrollment journey. However, the **ZORA** operations and governance layer is **NOT implemented**. This creates a critical gap where:

1. Students can submit applications
2. But staff cannot properly track, assign, or manage those applications
3. No automated task assignment, deadline monitoring, or escalation exists
4. The "end-to-end workflow" is actually a one-way funnel with no operational oversight

---

## ✅ PHASE 1 – Discovery & Lead Capture (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Visitor arrival tracking | ⚠️ PARTIAL | `apps/marketing/app/api/apply/route.ts` | Source field exists but not connected to CRM |
| Hero banner | ✅ DONE | `apps/marketing/app/apply/page.tsx` | Images, CTAs present |
| Program pages | ✅ DONE | Various program page templates | Career, salary, certifications, funding |
| CTA buttons | ⚠️ PARTIAL | `ApplyPathGuide.tsx` | Apply, Check Funding exist |
| Chat with Admissions | ⚠️ PARTIAL | `ParisFloatingButton.tsx` | PARIS chat exists but basic |
| **CRM lead creation** | ❌ MISSING | — | No CRM integration found |
| **Source tracking** | ❌ MISSING | — | Google, WorkOne, Facebook tracking not found |
| **Lead assigned to recruiter** | ❌ MISSING | — | No assignment logic |

**⚠️ Issue 1: Broken content**
- Funding list contains blank item: "WIOA, Workforce Ready Grant, **, and Job Ready Indy..."
- Missing funding source name indicates rendering/data issue

---

## ✅ PHASE 2 – PARIS Eligibility Wizard

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Personal info (Name, Email, Phone) | ✅ DONE | `IntakeFormInner.tsx` | Basic fields present |
| **DOB** | ❌ MISSING | — | Not in intake form |
| **Address** | ❌ MISSING | — | Not in intake form |
| Education (HS diploma/GED) | ⚠️ PARTIAL | `StudentApplicationForm.tsx` | Only in full application |
| Employment status | ✅ DONE | `EligibilityScreener.tsx` | Step 2 of 4 |
| Funding options | ⚠️ PARTIAL | `IntakeFormInner.tsx` | WIOA, WRG, JRI, self-pay exist |
| **BNPL** | ❌ MISSING | — | Not in intake |
| **Military, TANF, SNAP** | ❌ MISSING | — | Not in intake |
| Program selection | ✅ DONE | Both forms | Dropdown present |
| Career Goals | ⚠️ PARTIAL | `StudentApplicationForm.tsx` | Only "goals" text field |
| AI Qualification | ⚠️ PARTIAL | `ParisChat.tsx` | Basic chat, no AI logic |

---

## ✅ PHASE 3 – Admissions Dashboard (ZORA)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| New application view | ⚠️ PARTIAL | Admin dashboard exists | No dedicated admissions view |
| **Funding status tracker** | ❌ MISSING | — | No unified view |
| **Missing documents alerts** | ⚠️ PARTIAL | `DocumentUploadForm.tsx` | Upload exists, alerts missing |
| **Notes** | ❌ MISSING | — | No note-taking system |
| **AI recommendations** | ❌ MISSING | — | No AI scoring |
| **Communication history** | ❌ MISSING | — | No message log |
| **Priority score** | ❌ MISSING | — | No scoring system |
| **Program seat availability** | ❌ MISSING | — | No inventory tracking |

---

## ✅ PHASE 4 – Digital Binder (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Driver's License | ✅ DONE | `DocumentUploadForm.tsx` | Generic upload |
| State ID | ✅ DONE | Generic upload | |
| Social Security | ⚠️ PARTIAL | Not labeled specifically | |
| High School Diploma/GED | ✅ DONE | Document type | |
| Resume | ✅ DONE | Document type | |
| Funding documents | ⚠️ PARTIAL | | |
| **Income verification** | ❌ MISSING | — | No specific flow |
| **Proof of residency** | ❌ MISSING | — | No specific flow |
| **Background check** | ❌ MISSING | — | No tracking |
| **Drug screen** | ❌ MISSING | — | No tracking |
| **CPR card** | ❌ MISSING | — | No tracking |
| **Immunizations** | ❌ MISSING | — | No tracking |
| **Physical** | ❌ MISSING | — | No tracking |
| Document status tracking | ⚠️ PARTIAL | `DocumentUploadForm.tsx` | Status field exists |
| **Auto-generate binder** | ❌ MISSING | — | Must be manual |

---

## ✅ PHASE 5 – Funding Engine (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| WIOA eligibility | ⚠️ PARTIAL | `EligibilityScreener.tsx` | Basic screening |
| WRG eligibility | ⚠️ PARTIAL | Same | |
| **VR eligibility** | ❌ MISSING | — | Not implemented |
| **Employer sponsorship** | ⚠️ PARTIAL | Form field | No verification |
| **Grant matching** | ❌ MISSING | — | No automatic matching |
| **BNPL qualification** | ❌ MISSING | — | No BNPL check |
| **Payment plans** | ❌ MISSING | — | No calculator |
| Funding dashboard | ❌ MISSING | — | No unified view |

---

## ✅ PHASE 6 – Admissions Review (ZORA)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Interview completed | ❌ MISSING | — | No tracking |
| Tour completed | ⚠️ PARTIAL | `TourBookingWidget.tsx` | Booking exists |
| Funding approved | ❌ MISSING | — | No approval workflow |
| Documents complete | ⚠️ PARTIAL | `DocumentUploadForm.tsx` | Status exists |
| Payment completed | ❌ MISSING | — | No payment tracking |
| Seat reserved | ❌ MISSING | — | No seat management |
| Acceptance issued | ❌ MISSING | — | No issuance workflow |
| **Auto email/SMS** | ❌ MISSING | — | No automation |
| **Recruiter checklist** | ❌ MISSING | — | No checklist system |

---

## ✅ PHASE 7 – Student Portal Creation (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| LMS account | ✅ DONE | Learner dashboard | Basic |
| Student dashboard | ⚠️ PARTIAL | `apps/lms/app/learner/dashboard/page.tsx` | Needs enhancement |
| Email verification | ✅ DONE | Supabase auth | |
| **Orientation checklist** | ⚠️ PARTIAL | `apps/marketing/app/onboarding/learner/` | Steps exist |
| **Calendar** | ❌ MISSING | — | No calendar integration |
| **Class schedule** | ❌ MISSING | — | No schedule view |
| **Financial dashboard** | ❌ MISSING | — | No payment tracking |
| **Messaging center** | ❌ MISSING | — | No messaging |

---

## ✅ PHASE 8 – Orientation (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Welcome video | ❌ MISSING | — | No video |
| Policies | ⚠️ PARTIAL | Handbook page exists | |
| **Student handbook** | ⚠️ PARTIAL | `orientation/page.tsx` | Exists but basic |
| **FERPA** | ❌ MISSING | — | No FERPA flow |
| **Safety training** | ❌ MISSING | — | No training |
| **Technology check** | ❌ MISSING | — | No check |
| **Digital signatures** | ❌ MISSING | — | No signature flow |
| Progress tracked | ❌ MISSING | — | No tracking |

---

## ✅ PHASE 9 – Program Enrollment (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Enrolls into LMS | ⚠️ PARTIAL | LMS exists | Manual process |
| **Unlocks courses** | ❌ MISSING | — | No auto-unlock |
| **Assigns instructors** | ❌ MISSING | — | No assignment |
| **Issues credentials** | ❌ MISSING | — | No auto-issue |
| **Generates attendance** | ❌ MISSING | — | No generation |

---

## ✅ PHASE 10 – Apprenticeship Routing (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Apprentice dashboard | ⚠️ PARTIAL | Basic LMS exists | |
| **OJL tracker** | ❌ MISSING | — | No on-the-job tracking |
| **RTI tracker** | ❌ MISSING | — | No related training |
| **Competency tracker** | ⚠️ PARTIAL | DOL competencies exist | Database exists |
| **Mentor assignment** | ❌ MISSING | — | No assignment |
| **Host Shop assignment** | ❌ MISSING | — | No routing |
| **RAPIDS documentation** | ⚠️ PARTIAL | API exists | Not connected |
| **Time clock** | ❌ MISSING | — | No clock in/out |
| **Evaluations** | ❌ MISSING | — | No evaluation forms |

---

## ✅ PHASE 11 – Instructor Workflow (ZORA)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| Attendance | ⚠️ PARTIAL | CMI attendance API | |
| **Grades** | ❌ MISSING | — | No grading system |
| **Skills tracking** | ⚠️ PARTIAL | Competencies exist | |
| **Notes** | ❌ MISSING | — | No notes |
| **Messaging** | ❌ MISSING | — | No messaging |
| **Interventions** | ❌ MISSING | — | No intervention system |
| **Certifications** | ❌ MISSING | — | No cert tracking |

---

## ✅ PHASE 12 – Student Success (ZORA)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| **Attendance monitoring** | ⚠️ PARTIAL | CMI API exists | Not monitored |
| **LMS progress** | ⚠️ PARTIAL | LMS exists | Not tracked centrally |
| **Missing assignments** | ❌ MISSING | — | No alerts |
| **Risk indicators** | ❌ MISSING | — | No risk scoring |
| **Funding deadlines** | ❌ MISSING | — | No deadline tracking |
| **Certification deadlines** | ❌ MISSING | — | No deadlines |
| **Alerts** | ❌ MISSING | — | No alert system |
| **Recruiter tasks** | ❌ MISSING | — | No task assignment |

---

## ✅ PHASE 13 – Certification (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| **Schedule exams** | ❌ MISSING | — | No scheduling |
| **Verify prerequisites** | ❌ MISSING | — | No verification |
| **Send reminders** | ❌ MISSING | — | No reminders |
| **Generate certificates** | ❌ MISSING | — | No generation |
| **Record credentials** | ⚠️ PARTIAL | Database exists | Not automated |
| **Update transcript** | ❌ MISSING | — | No transcript |

---

## ✅ PHASE 14 – Employment (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| **Resume builder** | ❌ MISSING | — | No builder |
| **Mock interview** | ❌ MISSING | — | No interview |
| **Employer matching** | ❌ MISSING | — | No matching |
| **Job board** | ⚠️ PARTIAL | `EmployerTalentPipeline.tsx` | Basic |
| **Apprenticeship placement** | ⚠️ PARTIAL | Host shop exists | Not automated |
| **Placement verification** | ❌ MISSING | — | No verification |

---

## ✅ PHASE 15 – Graduation (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| **Issue diploma/certificate** | ❌ MISSING | — | No issuance |
| **Graduation checklist** | ❌ MISSING | — | No checklist |
| **Alumni status** | ❌ MISSING | — | No alumni system |
| **Employment survey** | ❌ MISSING | — | No survey |
| **Credential wallet** | ❌ MISSING | — | No wallet |
| **Transcript** | ❌ MISSING | — | No transcript |

---

## ✅ PHASE 16 – Alumni (PARIS)

| Component | Status | File(s) | Notes |
|-----------|--------|---------|-------|
| **Continuing education** | ❌ MISSING | — | No tracking |
| **New certifications** | ❌ MISSING | — | No tracking |
| **Referral rewards** | ❌ MISSING | — | No program |
| **Employer updates** | ❌ MISSING | — | No updates |
| **Job opportunities** | ❌ MISSING | — | No job board |
| **Annual surveys** | ❌ MISSING | — | No surveys |

---

## ❌ MISSING: ZORA Operations Engine

**ZORA is NOT implemented.** This is the critical gap.

### Required ZORA Components (All Missing):

1. **Task Management System**
   - Auto-assign applications to recruiters
   - Task creation for missing documents
   - Deadline tracking
   - Escalation rules

2. **Communication Hub**
   - Email/SMS automation triggers
   - Template management
   - Communication history log
   - Follow-up scheduling

3. **Compliance Monitoring**
   - Deadline alerts
   - Document expiration tracking
   - Audit logging
   - Exception handling

4. **Staff Dashboards**
   - Recruiter dashboard
   - Admissions dashboard
   - Operations dashboard
   - Compliance dashboard

5. **Analytics & Reporting**
   - Conversion funnel metrics
   - Time-to-enrollment tracking
   - Staff performance metrics
   - Funding approval rates

---

## 📋 Definition of "Complete" Gap Analysis

| Step | Can Student Complete? | Without Manual Intervention? |
|------|----------------------|------------------------------|
| 1. Discover a program | ✅ YES | ✅ YES |
| 2. Complete eligibility wizard | ⚠️ PARTIAL | ⚠️ PARTIAL |
| 3. Submit application | ✅ YES | ✅ YES |
| 4. Upload documents to binder | ⚠️ PARTIAL | ❌ NO - No auto-creation |
| 5. Receive funding determination | ❌ NO | ❌ NO |
| 6. Be reviewed and accepted | ❌ NO | ❌ NO |
| 7. Sign enrollment documents | ❌ NO | ❌ NO |
| 8. Auto-enroll in LMS | ⚠️ PARTIAL | ❌ NO |
| 9. Receive personalized dashboard | ⚠️ PARTIAL | ❌ NO |
| 10. Attend orientation | ❌ NO | ❌ NO |
| 11. Begin training | ⚠️ PARTIAL | ❌ NO |
| 12. Complete certifications | ❌ NO | ❌ NO |
| 13. Graduate | ❌ NO | ❌ NO |
| 14. Transition to employment | ❌ NO | ❌ NO |
| 15. Continue as alumni | ❌ NO | ❌ NO |

**Current Completion Rate: ~40%** (frontend forms exist, backend automation missing)

---

## 🚨 Critical Issues to Fix

### Issue 1: Broken Content on Apply Page
```
"We screen for WIOA, Workforce Ready Grant, **, and Job Ready Indy..."
```
**Action:** Find and fix the blank funding source in the content data

### Issue 2: No ZORA Operations Layer
**Impact:** Staff cannot manage applications, assign tasks, or track progress
**Action:** Build ZORA components

### Issue 3: No CRM Integration
**Impact:** No lead tracking, source attribution, or recruiter assignment
**Action:** Build CRM components or integrate existing system

### Issue 4: No Automated Workflows
**Impact:** Email, SMS, task creation all manual
**Action:** Build automation engine

### Issue 5: No Digital Binder Auto-Generation
**Impact:** Students must manually upload all documents
**Action:** Build binder creation on application submit

---

## 📊 Recommended Implementation Order

### Phase A: Critical Fixes (Week 1)
1. Fix broken funding list content
2. Add DOB and Address to intake forms
3. Create basic admissions dashboard

### Phase B: Core ZORA (Weeks 2-3)
4. Build task management system
5. Build communication automation
6. Build recruiter assignment logic

### Phase C: Complete PARIS (Weeks 4-6)
7. Complete digital binder automation
8. Build funding engine
9. Build acceptance workflow
10. Connect LMS enrollment

### Phase D: Advanced Features (Weeks 7-8)
11. Build apprenticeship routing
12. Build certification system
13. Build employment matching
14. Build alumni system

---

## Files Referenced

### Apply Page Components
- `/apps/marketing/app/apply/page.tsx` - Main apply page
- `/apps/marketing/app/apply/IntakeFormInner.tsx` - Quick eligibility form
- `/apps/marketing/app/apply/student/StudentApplicationForm.tsx` - Full application
- `/components/apply/ApplyPathGuide.tsx` - Path selection guide
- `/components/funding/EligibilityScreener.tsx` - 4-step eligibility wizard

### PARIS Components
- `/components/paris/ParisFloatingButton.tsx` - Chat launcher
- `/components/paris/ParisChat.tsx` - Chat interface
- `/components/paris/ParisFloatingWrapper.tsx` - Wrapper component

### Document Components
- `/components/documents/DocumentUploadForm.tsx` - Document upload
- `/components/documents/DocumentAIPrefillPanel.tsx` - AI prefill

### Learner Onboarding
- `/apps/marketing/app/onboarding/learner/` - 8 onboarding pages
- `/apps/lms/app/learner/dashboard/page.tsx` - Student dashboard
- `/apps/lms/app/ai/paris/page.tsx` - PARIS AI info page

### API Routes
- `/apps/marketing/app/api/apply/route.ts` - Apply submission
- `/apps/marketing/app/api/apply/student/route.ts` - Student application
- `/apps/admin/app/api/paris/route.ts` - PARIS API
- `/apps/admin/app/api/paris/session/route.ts` - PARIS session

---

**END OF AUDIT REPORT**
