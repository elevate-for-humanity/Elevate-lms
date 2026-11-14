# EXISTING CODE AUDIT - SIDE BY SIDE COMPARISON

**Generated:** July 7, 2026  
**Status:** MOSTLY BUILT - Need wiring

---

## EXECUTIVE SUMMARY

**MOST COMPONENTS ALREADY EXIST.** We need to:
1. Wire existing pieces together
2. Add missing pre-conditions to enrollment automation
3. Build missing UI components

---

# ✅ EXISTING DATABASE TABLES

| Table | File | Status |
|-------|------|--------|
| applications | `20260227000003_schema_governance_baseline.sql` | ✅ EXISTS |
| documents | `20260227000003_schema_governance_baseline.sql` | ✅ EXISTS |
| leads | `20260124200000_admin_tables_v2.sql` | ✅ EXISTS |
| admin_applications_queue | `20260601000005_baseline_untracked_tables.sql` | ✅ EXISTS |
| program_enrollments | `20260201000005_training_programs_stripe.sql` | ✅ EXISTS |

---

# ✅ EXISTING API ROUTES

## Enrollment APIs
| Route | Status |
|-------|--------|
| `/api/enrollment/route.ts` | ✅ |
| `/api/enrollment/next-action` | ✅ |
| `/api/enrollment/submit` | ✅ |
| `/api/enrollment/approve` | ✅ |
| `/api/enrollment/documents` | ✅ |
| `/api/enrollment/upload-document` | ✅ |
| `/api/enrollment/orientation` | ✅ |
| `/api/enrollment/complete-orientation` | ✅ |
| `/api/cron/enrollment-automation` | ✅ **WORKING** |

## Workflow APIs
| Route | Status |
|-------|--------|
| `/api/workflows/route.ts` | ✅ |
| `/api/email/workflows` | ✅ |
| `/api/workflows/webhook` | ✅ |

## PARiS APIs
| Route | Status |
|-------|--------|
| `/api/paris` | ✅ AI Career Interview |
| `/api/paris/session` | ✅ |

---

# ✅ EXISTING ADMIN DASHBOARDS

| Dashboard | Status |
|----------|--------|
| `/admin/applications/page.tsx` | ✅ |
| `/admin/crm/leads/page.tsx` | ✅ |
| `/admin/crm/page.tsx` | ✅ |
| `/lms/dashboard/page.tsx` | ✅ |
| `/employer/dashboard/page.tsx` | ✅ |

---

# ✅ EXISTING LOGIC

## Enrollment State Machine (EXISTS)
```typescript
// lib/enrollment/state-machine.ts
export type EnrollmentState =
  | 'applied'
  | 'waitlist'
  | 'approved'
  | 'onboarding'
  | 'payment_required'
  | 'pending_funding_verification'
  | 'enrolled'
  | 'active'
  | 'revoked';
```

## Current Enrollment Automation (EXISTS & WORKS)
```typescript
// app/api/cron/enrollment-automation/route.ts
// Finds: status = 'approved' AND enrolled_at IS NULL
// Creates: program_enrollments
// Sends: Welcome email
// Emits: enrollment.auto_created event
```

---

# ❌ WHAT'S MISSING

## 1. Enrollment Decision Logic (CRITICAL)

**Current Problem:** Auto-enrollment does NOT check:
- ❌ PARiS completion
- ❌ Document approval
- ❌ Funding verification

**Need:** Add decision engine BEFORE auto-enrolling

## 2. Application Statuses (NEED EXPANSION)

**Current:** submitted, in_review, approved, rejected, enrolled, waitlisted

**Need to ADD:**
- fee_required
- documents_required
- paris_required
- eligibility_review
- funding_verification
- manual_review
- ready_for_enrollment

## 3. Review Queue UI

Queue table EXISTS but NO UI to manage it.

## 4. Re-Evaluation Engine

When requirement completes, should auto re-check eligibility.

---

# EXECUTION PRIORITY

## STEP 1: Migration (DONE ✅)
File: `supabase/migrations/20260707000001_expanded_enrollment_statuses.sql`

## STEP 2: Decision Engine API (2 hours)
File: `app/api/enrollment/decision/route.ts`

## STEP 3: Update Enrollment Cron (1 hour)
File: `app/api/cron/enrollment-automation/route.ts`

## STEP 4: Review Queue UI (4 hours)
File: `app/admin/applications/queue/page.tsx`

## STEP 5: Re-Evaluation API (2 hours)
File: `app/api/enrollment/reevaluate/route.ts`

---

# TOTAL: ~10 hours of wiring

Most infrastructure exists. Just need to connect the dots.

---

**Report Version:** 2.0  
**Last Updated:** July 7, 2026
