# PROGRAM-HOLDER GAP AUDIT
## The Real Missing Pages

**Generated:** July 7, 2026  
**Issue Found:** 17 pages missing from `/program-holder/`

---

## THE MISMATCH

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           PROGRAM-HOLDER vs PARTNER                                          │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                │
│  PARTNER (Host Shops)            PROGRAM-HOLDER (Training Providers)                           │
│  ──────────────────────────────────────────────────────────────────────────────────────       │
│  18 pages ACTUAL               5 pages ACTUAL vs 19 pages EXPECTED                            │
│                                                                                                │
│  Partner = Barber shops,        Program Holder = Schools, Community Colleges,                 │
│  salons that host apprentices    Workforce Boards who HOLD programs                            │
│                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## EXPECTED PAGES (from test files)

```
/program-holder/dashboard              - Dashboard (STUB - 25 lines)
/program-holder/students              - Student management
/program-holder/students/pending      - Pending students
/program-holder/students/at-risk      - At-risk students
/program-holder/programs             - Program management
/program-holder/grades               - Grade management
/program-holder/analytics            - Analytics dashboard
/program-holder/payroll              - Payroll management
/program-holder/reports              - Reports center
/program-holder/compliance           - Compliance tracking
/program-holder/documents            - Document center
/program-holder/notifications        - Notifications
/program-holder/campaigns            - Campaign management
/program-holder/mou                  - MOU management
/program-holder/handbook             - Handbook
/program-holder/onboarding           - Onboarding flow
/program-holder/settings             - Settings
/program-holder/verification         - Verification
/program-holder/portal               - Portal
/program-holder/portal/students     - Portal students
/program-holder/portal/attendance   - Portal attendance
/program-holder/portal/messages     - Portal messages
```

---

## ACTUAL PAGES

| Page | File | Status |
|------|------|--------|
| `/program-holder/dashboard` | `app/program-holder/dashboard/page.tsx` | 🔴 STUB (25 lines) |
| `/program-holder/onboarding` | `app/program-holder/onboarding/page.tsx` | 🔴 Redirect to `/program-holder` |
| `/program-holder/sign-mou` | `app/program-holder/sign-mou/page.tsx` | 🔴 Redirect to `/legal/program-host-agreement` |
| `/program-holder/rights-responsibilities` | `app/program-holder/rights-responsibilities/page.tsx` | 🔴 Redirect to `/program-holder` |
| `/program-holder/[...path]` | `app/program-holder/[...path]/page.tsx` | 🔴 Returns 404 (notFound) |

---

## MISSING PAGES (17)

| Page | What It Should Do |
|------|-------------------|
| `/program-holder/students` | List all students in programs |
| `/program-holder/students/pending` | Show pending enrollment requests |
| `/program-holder/students/at-risk` | Track at-risk students |
| `/program-holder/programs` | Manage programs offered |
| `/program-holder/grades` | Grade book / grade management |
| `/program-holder/analytics` | Analytics dashboard |
| `/program-holder/payroll` | Payroll tracking |
| `/program-holder/reports` | WIOA, compliance reports |
| `/program-holder/compliance` | Apprenticeship compliance |
| `/program-holder/documents` | Document center |
| `/program-holder/notifications` | Notification center |
| `/program-holder/campaigns` | Marketing campaigns |
| `/program-holder/mou` | MOU signing flow |
| `/program-holder/handbook` | Program handbook |
| `/program-holder/settings` | Account settings |
| `/program-holder/verification` | Partner verification |
| `/program-holder/portal` | Public-facing portal |
| `/program-holder/portal/students` | Portal student view |
| `/program-holder/portal/attendance` | Portal attendance |
| `/program-holder/portal/messages` | Portal messaging |

---

## WHY IT'S BROKEN

### 1. Catch-all returns 404
```tsx
// app/program-holder/[...path]/page.tsx
export default function ProgramHolderCatchAll({ params }: PageProps) {
  const path = params.path?.join('/') || '';
  notFound(); // ← ALL unmatched routes 404!
}
```

### 2. Dashboard is a stub
```tsx
// app/program-holder/dashboard/page.tsx
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Link href="/">Back to Home</Link>  ← NO CONTENT!
    </div>
  );
}
```

### 3. Onboarding redirects back
```tsx
// app/program-holder/onboarding/page.tsx
export default function ProgramHolderOnboardingPage() {
  redirect('/program-holder');  // ← Goes to stub!
}
```

---

## THE DIFFERENCE: PARTNER vs PROGRAM-HOLDER

| Feature | Partner (Host Shops) | Program Holder (Training Providers) |
|---------|---------------------|-----------------------------------|
| Role | Host apprenticeship | Hold programs |
| Users | Barber shops, salons | Schools, colleges |
| Students | Apprentices | Enrolled learners |
| Programs | Limited to apprenticeship | Full program catalog |
| Compliance | RTI, OJL tracking | WIOA reporting |
| Portal | Internal management | Public + internal |

---

## SIMILAR PAGES EXIST IN PARTNER

These could be TEMPLATES for program-holder:

| Partner Page | Program-Holder Should Have |
|--------------|---------------------------|
| `/partner/students` | `/program-holder/students` |
| `/partner/programs` | `/program-holder/programs` |
| `/partner/attendance` | (similar to hours tracking) |
| `/partner/documents` | `/program-holder/documents` |
| `/partner/settings` | `/program-holder/settings` |

---

## FIX PLAN

### Option A: Copy Partner pages as templates
1. Copy `/partner/students/page.tsx` → `/program-holder/students/page.tsx`
2. Copy `/partner/programs/page.tsx` → `/program-holder/programs/page.tsx`
3. Copy `/partner/documents/page.tsx` → `/program-holder/documents/page.tsx`
4. Etc.

### Option B: Create shared components
1. Create `components/program-holder/`
2. Build each page with program-holder specific data fetching
3. Use similar layout to Partner

### Option C: Delete program-holder
If program-holder is not needed:
1. Remove `/program-holder/` folder
2. Redirect all routes to `/partner/`

---

## RECOMMENDATION

**Option A is fastest:** Copy Partner pages and modify for program-holder specific logic.

Estimated work: **40-80 hours** to build all missing pages.

---

**Report Version:** 1.0  
**Last Updated:** July 7, 2026
