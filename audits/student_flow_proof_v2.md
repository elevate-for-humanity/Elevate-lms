# Student Flow End-to-End Proof

Date: 2026-02-14

## Chain: Login → Enroll → Lesson → Complete → Progress → Certificate

### 1. Enrollment — PRODUCTION-REAL
Multiple write paths confirmed:
- `app/api/checkout/create/route.ts:123` — enrollments.insert after payment
- `app/api/webhooks/stripe/route.ts:1204` — enrollments.upsert on webhook
- `app/api/cert/issue/route.ts:69` — enrollments.upsert on cert issue
- `app/api/funding/admin/confirm/route.ts:90` — enrollments.upsert on funding approval
- `app/api/admin/import/route.ts:245` — bulk import
- `app/api/webhooks/store/route.ts:30` — store webhook
- `lib/admin/bulk-import.ts:275` — admin bulk import

**Verdict: PRODUCTION-REAL** — 7+ write paths to enrollments table

### 2. Lesson Completion — PRODUCTION-REAL
- `app/api/lessons/[lessonId]/complete/route.ts` — POST handler
  - Writes to `lesson_progress` table (upsert with completed=true)
  - Line 55: `supabase.from('lesson_progress').upsert({...})`
- `app/api/courses/[courseId]/lessons/[lessonId]/complete/route.ts:24` — alternate path
  - `supabase.from('lesson_progress').upsert({...})`

**Verdict: PRODUCTION-REAL** — writes to lesson_progress on completion

### 3. Progress Recalculation — PRODUCTION-REAL
- `app/api/lessons/[lessonId]/complete/route.ts:85-110`
  - Queries all lessons for course, counts completed, calculates percentage
  - Calls `rpc('update_enrollment_progress_manual')` with fallback to direct update
  - `enrollments.update({ progress: progressPercent })`
- DELETE handler (line 171) also recalculates on uncomplete

**Verdict: PRODUCTION-REAL** — live calculation, not cached

### 4. Certificate Auto-Issuance at 100% — PRODUCTION-REAL
- `app/api/lessons/[lessonId]/complete/route.ts:115-147`
  - Checks `progressPercent === 100`
  - Checks for existing certificate (idempotent)
  - Creates new certificate with `certificate_number` format: `EFH-YYYYMMDD-XXXXXXXX`
  - Writes to `certificates` table
  - Returns certificate in API response

**Verdict: PRODUCTION-REAL** — auto-issues on 100%, idempotent

### 5. Certificate Re-download — PRODUCTION-REAL
- `app/api/certificates/[certificateId]/download/route.ts` — download endpoint exists
- `app/api/certificates/download/route.ts` — alternate download path
- `app/certificates/[certificateId]/page.tsx` — certificate view page
- `app/lms/(app)/certificates/page.tsx` — student certificate list
- `app/certificates/verify/[certificateId]/page.tsx` — public verification

**Verdict: PRODUCTION-REAL** — multiple access paths, not one-time

### 6. Uncomplete/Undo — PRODUCTION-REAL
- DELETE handler at line 171 of lesson complete route
- Updates lesson_progress.completed = false
- Recalculates enrollment progress downward

**Verdict: PRODUCTION-REAL**

## DB Tables Used

| Table | Written By | Read By |
|---|---|---|
| enrollments | checkout, stripe webhook, funding, import, cert issue | lesson player, dashboard, partner queries |
| lesson_progress | lesson complete API (POST/DELETE) | progress calculation, partner queries |
| certificates | lesson complete API (at 100%), cert issue/bulk-issue/replace | certificate pages, partner CSV export |
| profiles | auth signup | everywhere |

## Overall Student Flow Verdict: PRODUCTION-REAL
Every step in the chain writes to real DB tables via real API endpoints.
Progress is calculated live. Certificates are auto-issued and re-downloadable.
