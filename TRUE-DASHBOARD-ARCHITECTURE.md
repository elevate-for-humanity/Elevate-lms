# TRUE DASHBOARD ARCHITECTURE

**Generated:** July 7, 2026  
**Purpose:** Correct side-by-side showing ACTUAL routing and implementations

---

## THE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD ROUTING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  USER TYPE          →      DASHBOARD URL        →      ACTUAL CONTENT               │
│                                                                                      │
│  Admin              →      /admin/dashboard        DashboardShell (31k lines)       │
│                           ↕                                                      │
│                       /admin/applications              AdminAppsPage                  │
│                       /admin/crm/leads               AdminLeadsPage                 │
│                                                                                      │
│  Employer           →      /employer/dashboard      EmployerDashboard (430 lines)   │
│                           ↕                                                      │
│                       /employer/jobs                   EmployerJobs                   │
│                       /employer/candidates            EmployerCandidates             │
│                                                                                      │
│  Student/Learner    →      /learner/dashboard   →    /lms/dashboard               │
│                           (REDIRECT)                    LMSDashboard (132 lines)     │
│                           ↕                                                      │
│                       /lms/courses                   LMSCourses                     │
│                       /lms/assignments               LMSAssignments                 │
│                                                                                      │
│  Partner            →      /partner/dashboard         Router (routes elsewhere)     │
│                           ↕                                                      │
│                       /partner/attendance              PartnerAttendance             │
│                       /partner/hours                  PartnerHours                  │
│                       /partner/students               PartnerStudents               │
│                                                                                      │
│  Host Shop          →      /host-shop/dashboard        STUB (needs wrapper)          │
│                           ↕                                                      │
│                       /host-shop/dashboard/apprentices   HSApprentices (295 lines)   │
│                       /host-shop/dashboard/hours        HSHours (215 lines)         │
│                       /host-shop/dashboard/competencies HSCompetencies (304 lines)  │
│                       etc.                                                                          │
│                                                                                      │
│  Case Manager       →      /case-manager/dashboard     CaseManagerDashboard (322l)   │
│                           ↕                                                      │
│                       /case-manager/participants        CaseManagerParticipants       │
│                                                                                      │
│  Program Holder     →      /program-holder/dashboard   STUB (25 lines)              │
│                           ↕                                                      │
│                       ??? (no sub-pages)                                                │
│                                                                                      │
│  Workforce Board    →      /workforce-board/dashboard  ???                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SIDE-BY-SIDE: EACH DASHBOARD

### 1. ADMIN DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /admin/dashboard                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/admin/dashboard/page.tsx                    │ 21 lines (wrapper) │
│ ├── components/admin/dashboard/DashboardShell.tsx     │ 31,620 lines      │
│ ├── components/admin/dashboard/*.tsx                  │ 30+ components    │
│ └── lib/admin/get-admin-dashboard-data.ts             │ EXISTS             │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /admin/dashboard         → DashboardShell                           │
│ ├── /admin/applications      → AdminAppsPage                           │
│ ├── /admin/crm/leads        → AdminLeadsPage                          │
│ ├── /admin/crm               → AdminCRMPage                            │
│ └── /admin/[...path]         → NOT FOUND (404)                        │
│                                                                          │
│ IMPLEMENTATION:                                                         │
│ • page.tsx imports DashboardShell                                       │
│ • DashboardShell has sidebar + KPIs + enrollment funnel                │
│ • Full data fetching from Supabase                                      │
│ • State machine for user progression                                    │
│                                                                          │
│ STATUS: ✅ WORKING                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. EMPLOYER DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /employer/dashboard                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/employer/dashboard/page.tsx                 │ 430 lines       │
│ ├── app/employer/[...path]/page.tsx                   │ 5 lines (redirect)│
│ ├── components/employer/*.tsx                         │ 10+ components   │
│ └── lib/orchestration/state-machine.ts               │ EXISTS           │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /employer/dashboard      → EmployerDashboard (430 lines)           │
│ ├── /employer/jobs           → EmployerJobsPage                        │
│ ├── /employer/candidates     → EmployerCandidatesPage                 │
│ ├── /employer/apprentices    → EmployerApprenticesPage                 │
│ ├── /employer/applications   → EmployerApplicationsPage               │
│ └── /employer/[...path]      → /employer/dashboard (redirect)          │
│                                                                          │
│ IMPLEMENTATION:                                                         │
│ • 430 lines self-contained                                              │
│ • Auth check (requireRole)                                              │
│ • State machine (getEmployerState)                                       │
│ • Data fetching (postings, applications, programs)                      │
│ • Conditional rendering (verified vs pending)                             │
│ • Metrics, sections, alerts                                             │
│ • Quick actions, tool grid                                               │
│ • Live Workforce Widget                                                  │
│                                                                          │
│ STATUS: ✅ WORKING                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3. LMS / LEARNER DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /lms/dashboard (actual) /learner/dashboard (redirects here)       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/lms/page.tsx                            │ 25 lines (stub)      │
│ ├── app/lms/dashboard/page.tsx                  │ 132 lines            │
│ ├── app/learner/dashboard/page.tsx               │ 10 lines (redirect)  │
│ ├── components/lms/dashboard/*.tsx               │ 6 components         │
│ └── components/lms/LMSSidebar.tsx               │ EXISTS               │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /lms                   → STUB (25 lines)                          │
│ ├── /lms/dashboard         → LMSDashboard (132 lines)                 │
│ ├── /learner/dashboard     → REdirect to /lms/dashboard               │
│ ├── /lms/courses           → LMSCoursesPage                           │
│ ├── /lms/assignments       → LMSAssignmentsPage                       │
│ ├── /lms/grades            → LMSGradesPage                            │
│ ├── /lms/calendar          → LMSCalendarPage                          │
│ └── /lms/certificates      → LMSCertificatesPage                       │
│                                                                          │
│ IMPLEMENTATION:                                                         │
│ • /learner/dashboard redirects to /lms                                  │
│ • /lms also stubs to "Back to Home"                                     │
│ • /lms/dashboard has real implementation                                │
│ • Data fetching from Supabase (enrollments, programs)                   │
│ • Progress tracking, stats, quick actions                              │
│ • Empty state for no enrollments                                        │
│ • Sidebar imported inside page                                          │
│                                                                          │
│ GAPS:                                                                  │
│ • /lms landing page doesn't redirect to /lms/dashboard                 │
│ • /learner/dashboard redirects to /lms (not /lms/dashboard)           │
│                                                                          │
│ STATUS: ⚠️ PARTIAL (working but routing unclear)                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4. PARTNER DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /partner/dashboard                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/partner/dashboard/page.tsx               │ 115 lines (router) │
│ ├── app/partner/[...path]/page.tsx                 │ 5 lines (redirect) │
│ ├── app/partner/attendance/page.tsx               │ EXISTS             │
│ ├── app/partner/hours/page.tsx                     │ EXISTS             │
│ ├── app/partner/students/page.tsx                   │ EXISTS             │
│ └── lib/partners/host-shop-onboarding.ts           │ EXISTS             │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /partner/dashboard    → Router (routes based on onboarding state)  │
│ ├── /partner/attendance    → PartnerAttendancePage                      │
│ ├── /partner/hours        → PartnerHoursPage                            │
│ ├── /partner/students      → PartnerStudentsPage                        │
│ ├── /partner/board        → PartnerBoardPage                           │
│ └── /partner/[...path]     → /partner/dashboard (redirect)             │
│                                                                          │
│ ROUTER LOGIC:                                                          │
│ • Not authed         → /partner/login                                  │
│ • Wrong role         → /unauthorized                                    │
│ • Not approved       → /partner/onboarding                             │
│ • No partner record  → Barber host shop application flow               │
│ • Approved           → /partner/attendance                              │
│                                                                          │
│ NOTE: This is a ROUTER, not a dashboard. Content is elsewhere.         │
│                                                                          │
│ STATUS: ✅ WORKING (as a router)                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. HOST SHOP DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /host-shop/dashboard                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/host-shop/dashboard/page.tsx             │ 25 lines (STUB)    │
│ ├── app/host-shop/dashboard/apprentices/page.tsx  │ 295 lines          │
│ ├── app/host-shop/dashboard/competencies/page.tsx│ 304 lines          │
│ ├── app/host-shop/dashboard/documents/page.tsx   │ 178 lines          │
│ ├── app/host-shop/dashboard/hours/page.tsx       │ 215 lines          │
│ ├── app/host-shop/dashboard/messages/page.tsx    │ 198 lines          │
│ ├── app/host-shop/dashboard/profile/page.tsx     │ 297 lines          │
│ ├── app/host-shop/dashboard/reports/page.tsx     │ 204 lines          │
│ ├── app/host-shop/dashboard/schedule/page.tsx     │ 217 lines          │
│ ├── app/host-shop/dashboard/store/page.tsx       │ 203 lines          │
│ ├── app/host-shop/dashboard/subscription/page.tsx│ 25 lines           │
│ └── app/host-shop/dashboard/apprentices/new/page.tsx│ 25 lines        │
│                                                                          │
│ TOTAL: 2,186 lines across 12 pages                                     │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /host-shop/dashboard           → STUB (Back to Home)               │
│ ├── /host-shop/dashboard/apprentices → HSApprentices (full)             │
│ ├── /host-shop/dashboard/competencies → HSCompetencies (full)          │
│ ├── /host-shop/dashboard/hours      → HSHours (full)                  │
│ ├── /host-shop/dashboard/schedule   → HSSchedule (full)                │
│ ├── /host-shop/dashboard/documents  → HS Documents (full)               │
│ └── /host-shop/dashboard/profile    → HSProfile (full)                 │
│                                                                          │
│ PROBLEM:                                                               │
│ • page.tsx (dashboard root) is STUB                                     │
│ • Sub-pages ARE fully implemented                                       │
│ • NO shared layout/wrapper (each page is standalone)                    │
│ • No sidebar navigation between sub-pages                                │
│                                                                          │
│ NEEDS:                                                                 │
│ 1. Create app/host-shop/dashboard/layout.tsx with sidebar             │
│ 2. Update app/host-shop/dashboard/page.tsx to show dashboard shell     │
│ 3. Wire sub-pages into navigation                                       │
│                                                                          │
│ STATUS: ⚠️ PARTIAL (content exists, need layout wrapper)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 6. CASE MANAGER DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /case-manager/dashboard                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/case-manager/dashboard/page.tsx          │ 322 lines          │
│ ├── app/case-manager/[...path]/page.tsx            │ 5 lines (redirect) │
│ ├── app/case-manager/participants/page.tsx         │ EXISTS             │
│ └── app/case-manager/reports/wioa/page.tsx        │ EXISTS             │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /case-manager/dashboard     → CaseManagerDashboard (322 lines)      │
│ ├── /case-manager/participants   → CaseManagerParticipantsPage         │
│ ├── /case-manager/reports/wioa    → WIOAReportsPage                     │
│ └── /case-manager/[...path]       → /case-manager/dashboard (redirect) │
│                                                                          │
│ IMPLEMENTATION:                                                         │
│ • 322 lines self-contained                                              │
│ • Auth + role check                                                     │
│ • Participant management                                                 │
│ • WIOA reporting                                                       │
│ • Placements tracking                                                   │
│                                                                          │
│ STATUS: ✅ WORKING                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 7. PROGRAM HOLDER DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /program-holder/dashboard                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/program-holder/dashboard/page.tsx        │ 25 lines (STUB)     │
│ ├── app/program-holder/[...path]/page.tsx        │ 5 lines (404)       │
│ ├── app/program-holder/onboarding/page.tsx       │ EXISTS              │
│ ├── app/program-holder/sign-mou/page.tsx         │ EXISTS              │
│ └── app/program-holder/rights-responsibilities/page.tsx │ EXISTS        │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /program-holder/dashboard    → STUB (Back to Home)                  │
│ ├── /program-holder/onboarding   → ProgramHolderOnboarding              │
│ ├── /program-holder/sign-mou      → ProgramHolderSignMOU                 │
│ ├── /program-holder/rights-responsibilities → ProgramHolderRights        │
│ └── /program-holder/[...path]    → notFound() (404)                     │
│                                                                          │
│ PROBLEM:                                                               │
│ • page.tsx is STUB                                                      │
│ • Catch-all returns 404                                                 │
│ • No dashboard shell implemented                                         │
│ • No routing logic for different states                                 │
│                                                                          │
│ NEEDS:                                                                 │
│ 1. Create dashboard implementation similar to EmployerDashboard         │
│ 2. Add routing logic for onboarding states                              │
│ 3. Create sub-pages for program management                              │
│                                                                          │
│ STATUS: 🔴 MISSING                                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 8. WORKFORCE BOARD DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URL: /workforce-board/dashboard                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FILE STRUCTURE:                                                         │
│ ├── app/workforce-board/dashboard/page.tsx       │ ??? lines           │
│ ├── app/workforce-board/page.tsx                  │ EXISTS              │
│ └── app/workforce-board/employment/page.tsx       │ EXISTS              │
│                                                                          │
│ ROUTING:                                                               │
│ ├── /workforce-board           → WorkforceBoardLanding                  │
│ ├── /workforce-board/dashboard  → NEEDS CHECK                           │
│ └── /workforce-board/employment → WorkforceEmploymentPage                │
│                                                                          │
│ STATUS: ⚠️ NEEDS VERIFICATION                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY TABLE

| Dashboard | Route | Page Lines | Sub-pages | Type | Status |
|-----------|-------|-----------|-----------|------|--------|
| Admin | /admin/dashboard | 21 (wrapper) | 50+ pages | Shell | ✅ |
| Employer | /employer/dashboard | 430 | 20+ pages | Self-contained | ✅ |
| LMS | /lms/dashboard | 132 | 10+ pages | Components | ✅ |
| Learner | /learner/dashboard | 10 (redirect) | Redirects | Redirect | ✅ |
| Partner | /partner/dashboard | 115 | 15+ pages | Router | ✅ |
| Host Shop | /host-shop/dashboard | 25 (stub) | 11 pages | Needs wrapper | ⚠️ |
| Case Manager | /case-manager/dashboard | 322 | 5+ pages | Self-contained | ✅ |
| Program Holder | /program-holder/dashboard | 25 (stub) | 3 pages | Missing | 🔴 |
| Workforce Board | /workforce-board/dashboard | ??? | 2 pages | Unknown | ⚠️ |

---

## ACTUAL ISSUES

### 1. Host Shop Dashboard
- **Issue:** Sub-pages exist but no shared layout
- **Fix:** Create `app/host-shop/dashboard/layout.tsx` with sidebar
- **Hours:** 8

### 2. Program Holder Dashboard
- **Issue:** Stub page + catch-all 404s
- **Fix:** Full implementation needed
- **Hours:** 40

### 3. LMS Routing
- **Issue:** `/learner/dashboard` → `/lms` (not `/lms/dashboard`)
- **Issue:** `/lms` landing doesn't redirect to `/lms/dashboard`
- **Fix:** Fix redirects
- **Hours:** 1

### 4. Workforce Board
- **Issue:** Unknown state
- **Fix:** Verify implementation
- **Hours:** TBD

---

## CORRECTED SUMMARY

| # | Dashboard | Status | Hours |
|---|-----------|--------|-------|
| 1 | Admin | ✅ Working | 0 |
| 2 | Employer | ✅ Working | 0 |
| 3 | LMS/Learner | ✅ Working | 1 |
| 4 | Partner | ✅ Working (router) | 0 |
| 5 | Case Manager | ✅ Working | 0 |
| 6 | Host Shop | ⚠️ Partial | 8 |
| 7 | Program Holder | 🔴 Missing | 40 |
| 8 | Workforce Board | ⚠️ Unknown | TBD |

**Total:** 49 hours + verification

---

**Report Version:** 3.0 (True Architecture)  
**Last Updated:** July 7, 2026
