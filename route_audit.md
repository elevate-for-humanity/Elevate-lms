# Route Audit

Generated: 2026-03-27  
Auditor: Ona

---

## Frontend Routes

### Duplicate / Legacy

| Route | File | Problem | Action |
|-------|------|---------|--------|
| `/lms/courses/[courseId]/complete` | `app/lms/(app)/courses/[courseId]/complete/page.tsx` | Pre-dates certification end-state page. Learners should land on `/certification` instead. | Keep for backward compat redirect; add redirect to `/certification` |
| `/courses/hvac/module1/lesson1` | `app/courses/hvac/module1/lesson1/page.tsx` | Standalone hardcoded HVAC lesson. Not part of LMS engine. Imports `@/courses/hvac/module1/quiz1`. | Mark legacy; do not link from LMS nav |
| `/lms/courses/healthcare-fundamentals` | `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` | Static marketing page inside LMS route group. Not DB-driven. | Mark legacy |
| `/cert/verify` | `app/cert/verify/page.tsx` | Redirect shim to `/verify`. | Keep — redirect is correct |
| `/verify-credential` | `app/verify-credential/page.tsx` | Possible duplicate of `/verify/[certificateId]` | Verify callers; redirect if duplicate |
| `/verify-credentials` | `app/verify-credentials/page.tsx` | Possible duplicate of `/verify/[certificateId]` | Verify callers; redirect if duplicate |

---

## API Routes

### Duplicate Auth Endpoints

| Route | File | Problem | Action |
|-------|------|---------|--------|
| `POST /api/auth/login` | `app/api/auth/login/route.ts` | Duplicate of `/api/auth/signin`. Uses deprecated `lib/rateLimit` (in-memory). Manual validation. | Deprecate — add 301 redirect to `/api/auth/signin` |
| `POST /api/auth/signin` | `app/api/auth/signin/route.ts` | Canonical. Zod validation, `withRateLimit`. | Keep |

### Routes Using Deprecated Rate Limiter (11 files)

All 11 routes below import from `lib/rateLimit` (in-memory, broken in serverless). Each must be migrated to `applyRateLimit` from `lib/api/withRateLimit`.

| Route File | Tier to Use |
|-----------|-------------|
| `app/api/contact/route.ts` | `contact` |
| `app/api/applications/route.ts` | `api` |
| `app/api/marketplace/apply/route.ts` | `contact` |
| `app/api/marketplace/report/route.ts` | `contact` |
| `app/api/auth/login/route.ts` | (deprecate entire route) |
| `app/api/checkout/marketplace/route.ts` | `payment` |
| `app/api/booking/schedule/route.ts` | `contact` |
| `app/api/partners/barbershop-apprenticeship/apply/route.ts` | `contact` |
| `app/api/blog/route.ts` | `public` |
| `app/api/upload/route.ts` | `api` |
| `app/api/inquiries/route.ts` | `contact` |

### Routes Returning `error.message` Directly (22 files)

Each must replace `error.message` with `safeInternalError(error, 'context')` from `lib/api/safe-error.ts`.

| Route File |
|-----------|
| `app/api/profile/update/route.ts` |
| `app/api/admin/barber-onboarding-blast/route.ts` |
| `app/api/admin/external-progress/update/route.ts` |
| `app/api/admin/courses/ai-builder/route.ts` |
| `app/api/admin/settings/route.ts` |
| `app/api/admin/monitoring/status/route.ts` |
| `app/api/admin/fix-enrollment-policies/route.ts` |
| `app/api/track-usage/route.ts` |
| `app/api/onboarding/complete/route.ts` |
| `app/api/wioa/support-services/[id]/approve/route.ts` |
| `app/api/wioa/iep/[id]/route.ts` |
| `app/api/cron/expire-credentials/route.ts` |
| `app/api/compliance/record/route.ts` |
| `app/api/auth/signin/route.ts` |
| `app/api/auth/signup/route.ts` |
| `app/api/intake/route.ts` |
| `app/api/ai/course-builder/route.ts` |
| `app/api/monitoring/stats/route.ts` |
| `app/api/testing/bookings/[id]/route.ts` |
| `app/api/ai-studio/generate-video/route.ts` |
| `app/api/proctor/sessions/route.ts` |
| `app/api/proctor/sessions/[id]/route.ts` |

### Certificate Route Fragmentation

| Route | File | Notes |
|-------|------|-------|
| `POST /api/cert/issue` | `app/api/cert/issue/route.ts` | **Canonical** admin issuance |
| `POST /api/certificates/issue` | `app/api/certificates/issue/route.ts` | Verify — may duplicate `/api/cert/issue` |
| `POST /api/certificates/issue-program` | `app/api/certificates/issue-program/route.ts` | Program-level — verify distinct purpose |
| `POST /api/certificates/generate` | `app/api/certificates/generate/route.ts` | Verify — may duplicate |
| `GET /api/certificates/verify` | `app/api/certificates/verify/route.ts` | Verify — may duplicate `/verify/[certificateId]` page |

### Routes Using Deprecated Supabase Shims (78 files)

See `repo_audit_report.md` for full list. All must migrate to `lib/supabase/server.ts` or `lib/supabase/admin.ts`.

---

## Actions Taken

- `lib/rateLimit.ts` importers: migrated in Phase 10
- `error.message` returns: fixed in Phase 8 (for LMS routes) and Phase 10 (for remaining)
- Deprecated auth route: marked in Phase 10
