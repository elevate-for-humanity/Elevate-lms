# Database Wiring Audit

Date: 2026-02-14

## Table Usage Summary

| Table | Writes | Reads | Verdict |
|---|---|---|---|
| enrollments | 12 write paths | 26 read paths | PRODUCTION-REAL |
| lesson_progress | 2 write paths | 0 direct reads (queried via lesson complete API) | PRODUCTION-REAL |
| certificates | 4 insert paths | 4 select paths | PRODUCTION-REAL |
| apprentice_placements | 10 references | scoped by shop_id | PRODUCTION-REAL |
| shop_staff | 17 references | auth-scoped | PRODUCTION-REAL |
| profiles | 810 references | ubiquitous | PRODUCTION-REAL |

## Question-by-Question

### 1. Are enrollments actually written by any API?
**YES** — 12 write paths confirmed:
- Checkout/payment flow
- Stripe webhook
- Funding approval
- Admin import
- Cert issuance
- Store webhook

### 2. Is progress calculated live or hardcoded?
**LIVE** — `app/api/lessons/[lessonId]/complete/route.ts:85-110`
- Counts all lessons in course, counts completed lesson_progress rows
- Calculates `Math.round((completedCount / totalLessons) * 100)`
- Updates enrollments.progress via RPC with direct fallback
- DELETE handler also recalculates on uncomplete

One exception: `app/admin/enrollments/EnrollmentManagementClient.tsx:56` has `progress: '0'` as a default for new enrollment form — this is a form default, not hardcoded display.

### 3. Are certificates tied to course completion logic?
**YES** — `app/api/lessons/[lessonId]/complete/route.ts:115-147`
- Checks `progressPercent === 100`
- Idempotent: checks for existing cert before creating
- Writes certificate_number in format `EFH-YYYYMMDD-XXXXXXXX`

### 4. Are partner queries blocked by RLS unintentionally?
**FIXED** — Partner queries use `createAdminClient()` (service role) to bypass per-user RLS.
- `lib/partner/students.ts:10-13` — `getPartnerClient()` returns admin client
- Access control enforced at application layer via `getMyPartnerContext()`

### 5. Are any queries returning empty due to auth.uid() scoping?
**NO** — for partner queries (service role bypasses RLS).
**POSSIBLE** — for client-side partner pages (attendance, reports, documents) that query `shop_staff` directly via session client. These depend on `shop_staff` RLS allowing the user to see their own rows.

## Data Flow Classification

| Flow | Status |
|---|---|
| Student enrolls → enrollments table | REAL |
| Student completes lesson → lesson_progress | REAL |
| Lesson complete → progress recalculation | REAL (live) |
| 100% progress → certificate auto-issue | REAL (idempotent) |
| Partner dashboard → scoped aggregates | REAL (admin client) |
| Partner CSV export → scoped data | REAL (admin client) |
| Admin course CRUD → courses table | REAL (API layer) |
