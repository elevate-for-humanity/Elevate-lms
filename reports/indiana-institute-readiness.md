# Indiana Institute Readiness Report

**Generated:** 2026-01-16  
**Domain:** www.elevateforhumanity.org  
**Legal Entity:** 2EXCLUSIVE LLC-S

---

## Executive Summary

### What Is Ready
- ✅ Legal entity properly identified in structured data (JSON-LD)
- ✅ Physical Indiana address displayed (7009 East 56th Street, Suite EE1, Indianapolis, IN 46226)
- ✅ Contact information present (+1-317-314-3757)
- ✅ Core legal pages exist (Privacy Policy, Terms of Service, Accessibility, Refund Policy, Grievance)
- ✅ Hybrid delivery tracking infrastructure exists (30+ tracking tables in database)
- ✅ Auth flows for admin and student exist
- ✅ /api/health endpoint returns 200
- ✅ Program data structure includes required fields (duration, delivery, credential, outcomes)

### What Is Risky / Missing
- ❌ No Student Consumer Information / Disclosures hub page
- ❌ Missing Tuition & Fees schedule page (404)
- ❌ Missing Enrollment Agreement page (404)
- ❌ Missing Attendance Policy page (404)
- ❌ Missing Satisfactory Academic Progress (SAP) policy
- ⚠️ "Certification" language used loosely in 40+ places (compliance risk)
- ⚠️ LMS demo mode shows "sample data" banner (needs production toggle)

---

## A. Entity & Identity

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Legal entity name on site | ✅ PASS | JSON-LD: `"legalName":"2EXCLUSIVE LLC-S"` |
| Physical Indiana address | ✅ PASS | JSON-LD: `"streetAddress":"7009 East 56th Street, Suite EE1"` |
| Contact phone | ✅ PASS | JSON-LD: `"telephone":"+1-317-314-3757"` |
| Contact email | ✅ PASS | `Elevate4humanityedu@gmail.com` in contact page |
| Footer legal links | ✅ PASS | Privacy, Terms, Accessibility in `SiteFooter.tsx:146-158` |
| Student Consumer Info hub | ❌ FAIL | `/disclosures` returns 404, `/consumer-information` returns 404 |

---

## B. Student Protection Policies

| Policy | Route | Status | Source File |
|--------|-------|--------|-------------|
| Privacy Policy | /privacy-policy | ✅ 200 | `app/privacy-policy/page.tsx` |
| Terms of Service | /terms-of-service | ✅ 200 | `app/terms-of-service/page.tsx` |
| Accessibility | /accessibility | ✅ 200 | `app/accessibility/page.tsx` |
| Refund/Cancellation | /refund-policy | ✅ 200 | `app/refund-policy/page.tsx` |
| Grievance Process | /grievance | ✅ 200 | `app/grievance/page.tsx` |
| Tuition & Fees | /tuition-fees | ❌ 404 | **MISSING** |
| Enrollment Agreement | /enrollment-agreement | ❌ 404 | **MISSING** |
| Attendance Policy | /attendance-policy | ❌ 404 | **MISSING** |
| SAP Policy | /satisfactory-academic-progress | ❌ 404 | **MISSING** |

---

## C. Program Documentation

### Program Data Structure (app/data/programs.ts)

The `Program` type includes all required fields:

```typescript
type Program = {
  slug: string;
  name: string;
  duration: string;        // ✅ Length
  delivery: string;        // ✅ Delivery method
  credential: string;      // ✅ Credential awarded
  outcomes: string[];      // ✅ Learning outcomes
  whatYouLearn: string[];  // ✅ Curriculum
  requirements: string[];  // ✅ Prerequisites
  // ...
}
```

### Program Inventory

| Program | Duration | Delivery | Credential | Outcomes |
|---------|----------|----------|------------|----------|
| HVAC Technician | ✅ 4-9 months | ✅ Hybrid | ✅ Certificate + EPA 608 prep | ✅ Listed |
| Barber Apprenticeship | ✅ 12 months | ✅ Hybrid | ✅ Certificate | ✅ Listed |
| CNA | ✅ 4-6 weeks | ✅ Hybrid | ✅ Certificate | ✅ Listed |
| Medical Assistant | ✅ 12 weeks | ✅ Hybrid | ✅ Certificate | ✅ Listed |
| CDL | ✅ 4-6 weeks | ✅ In-person | ✅ CDL License | ✅ Listed |

**Note:** All programs in `programs.ts` have required fields populated.

---

## D. Risky Language Findings

### High Risk: "Certification" Claims

| File | Line | Excerpt | Risk | Safer Replacement |
|------|------|---------|------|-------------------|
| `app/staff-portal/training/page.tsx` | 14 | "earn certifications" | Implies state/board certification | "earn completion certificates" |
| `app/onboarding/staff/page.tsx` | 100 | "Industry-standard certifications" | Vague, could imply licensure | "Industry-recognized training credentials" |
| `app/career-services/job-placement/page.tsx` | 140 | "earn your certification" | Implies external certification | "complete your training" |
| `app/enroll/PayNowSection.tsx` | 161 | "certifications, and support" | Vague | "completion certificates and support" |

### Medium Risk: Other Terms

| Term | Count | Risk Level | Action |
|------|-------|------------|--------|
| "certified" | 40+ | Medium | Review each usage - distinguish between "certified by external body" vs "certificate of completion" |
| "accredited" | 0 | N/A | Not found - good |
| "state approved" | 0 | N/A | Not found - good |
| "guaranteed job" | 0 | N/A | Not found - good |
| "licensed school" | 0 | N/A | Not found - good |

---

## E. Hybrid Delivery Tracking

### Database Tables (Evidence of Tracking Capability)

| Table | Purpose | Status |
|-------|---------|--------|
| `attendance_records` | Track student attendance | ✅ EXISTS |
| `lesson_progress` | Track lesson completion | ✅ EXISTS (5 rows) |
| `quiz_attempts` | Track assessment attempts | ✅ EXISTS |
| `assignment_submissions` | Track assignment submissions | ✅ EXISTS |
| `live_class_attendance` | Track synchronous sessions | ✅ EXISTS |
| `hour_tracking` | Track clock hours | ✅ EXISTS |
| `ojt_hours_log` | Track on-the-job training | ✅ EXISTS |
| `lms_progress` | Overall LMS progress | ✅ EXISTS |

### API Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/partner/attendance` | Attendance tracking | ✅ EXISTS |
| `/api/staff/training` | Staff training progress | ✅ EXISTS |
| `/api/onboarding/submit` | Onboarding progress | ✅ EXISTS |

**Verdict:** ✅ PASS - Hybrid delivery tracking infrastructure is in place.

---

## F. Financial Assurance Readiness

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Admin settings for bond/LOC metadata | ⚠️ NOT VERIFIED | No dedicated admin page found |
| Internal documentation | ⚠️ NOT VERIFIED | No `/docs/financial-assurance.md` found |

**Recommendation:** Create `/admin/compliance/financial-assurance` page to track:
- Bond type and amount
- LOC details
- Renewal dates
- Documentation uploads

---

## G. Operational Integrity

| Check | Status | Evidence |
|-------|--------|----------|
| /api/health returns 200 | ✅ PASS | Verified |
| Auth flows exist | ✅ PASS | `/app/login`, `/app/admin/login` exist |
| build.json exists | ✅ PASS | `/public/build.json` present |
| No mock data in critical flows | ⚠️ PARTIAL | LMS has demo mode banner: "Demo Mode — Exploring LMS features with sample data" |

---

## P0/P1/P2 Remediation Plan

### P0 - Blocking for Authorization (Must Fix Before Demo)

1. **Create Student Consumer Information Hub**
   - Route: `/disclosures` or `/student-consumer-information`
   - Content: Links to all required policies
   - File: `app/disclosures/page.tsx`

2. **Create Tuition & Fees Page**
   - Route: `/tuition-fees`
   - Content: Per-program cost breakdown, payment options
   - File: `app/tuition-fees/page.tsx`

3. **Create Enrollment Agreement Page**
   - Route: `/enrollment-agreement`
   - Content: Template agreement with all required disclosures
   - File: `app/enrollment-agreement/page.tsx`

4. **Create Attendance Policy Page**
   - Route: `/attendance-policy`
   - Content: Attendance requirements for hybrid programs
   - File: `app/attendance-policy/page.tsx`

### P1 - Important for Compliance (Fix Within 2 Weeks)

5. **Create SAP Policy Page**
   - Route: `/satisfactory-academic-progress`
   - Content: Progress requirements, warning/probation process
   - File: `app/satisfactory-academic-progress/page.tsx`

6. **Fix "Certification" Language**
   - Files: 40+ files identified above
   - Action: Replace "certification" with "certificate of completion" where appropriate
   - Distinguish between external certifications (EPA 608, CDL) and internal completion certificates

7. **Remove/Toggle LMS Demo Mode Banner**
   - File: `app/lms/(app)/layout.tsx:19-71`
   - Action: Add environment check to hide demo banner in production

### P2 - Nice to Have (Fix Within 30 Days)

8. **Create Financial Assurance Admin Page**
   - Route: `/admin/compliance/financial-assurance`
   - Content: Track bond/LOC status, renewal dates

9. **Add Clock Hours to All Program Pages**
   - Ensure every program displays total clock hours (not just weeks/months)

10. **Create Program Catalog PDF Generator**
    - For state submission requirements

---

## Appendix: Commands Run

```bash
# Entity check
grep -rn "2EXCLUSIVE\|Elevate for Humanity" components/layout

# Policy routes
curl -s -o /dev/null -w "%{http_code}" "https://www.elevateforhumanity.org/tuition-fees"

# Risky language
grep -rn "certified\|certification" --include="*.tsx" app/

# Tracking tables
curl -s "https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/" | grep -i "attendance\|progress"

# Health check
curl -s -o /dev/null -w "%{http_code}" "https://www.elevateforhumanity.org/api/health"
```

---

## Summary

| Category | Score | Status |
|----------|-------|--------|
| Entity & Identity | 5/6 | ⚠️ Missing disclosures hub |
| Student Protections | 5/9 | ❌ 4 policies missing |
| Program Documentation | 5/5 | ✅ Complete |
| Safe Language | 3/5 | ⚠️ "Certification" overuse |
| Hybrid Tracking | 5/5 | ✅ Complete |
| Operational | 4/5 | ⚠️ Demo mode visible |

**Overall Readiness: 27/35 (77%)**

**Blocking Issues:** 4 missing policy pages must be created before Indiana authorization demo.

---

*Report generated by Ona compliance audit*
