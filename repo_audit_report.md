# Repository Audit Report

Generated: 2026-03-27  
Auditor: Ona

---

## System Size

| Metric | Count |
|--------|-------|
| `page.tsx` files | 1,486 |
| `route.ts` files (API) | 1,079 |
| `console.log` occurrences | 1,521 across 118 files |
| Supabase migration files | 278 |
| LMS app files (`app/lms/`) | 114 |
| `components/lms/` components | 50 |
| HVAC-specific lib files | 32 (`lib/courses/hvac-*`) |
| Curriculum blueprint files | 13 (`lib/curriculum/`) |
| Supabase storage buckets referenced | 8 |

---

## Frontend Route Inventory

### LMS Core Pages

| Route | File | Status |
|-------|------|--------|
| `/lms/courses/[courseId]/lessons/[lessonId]` | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` | Canonical — DB-driven + HVAC legacy path coexist |
| `/lms/courses/[courseId]` | `app/lms/(app)/courses/[courseId]/page.tsx` | Canonical |
| `/lms/courses/[courseId]/certification` | `app/lms/(app)/courses/[courseId]/certification/page.tsx` | Canonical — course end-state |
| `/lms/courses/[courseId]/complete` | `app/lms/(app)/courses/[courseId]/complete/page.tsx` | Legacy — pre-dates certification page |
| `/lms/dashboard` | `app/lms/(app)/dashboard/page.tsx` | Canonical |

### Hardcoded Program Pages (not DB-driven)

| Route | File | Problem |
|-------|------|---------|
| `/courses/hvac/module1/lesson1` | `app/courses/hvac/module1/lesson1/page.tsx` | Standalone hardcoded HVAC lesson. Imports `@/courses/hvac/module1/quiz1`. Not part of LMS engine. |
| `/lms/courses/healthcare-fundamentals` | `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` | Static marketing-style page. Not DB-driven. |
| `/store/courses/hvac-technician-course-license` | `app/store/courses/hvac-technician-course-license/page.tsx` | Hardcoded Supabase video URL. |

### Certificate / Verification Pages

| Route | File | Status |
|-------|------|--------|
| `/verify/[certificateId]` | `app/verify/[certificateId]/page.tsx` | Canonical public verification — queries `certificates` + fallbacks |
| `/cert/verify` | `app/cert/verify/page.tsx` | Redirect shim → `/verify` |
| `/verify-credential` | `app/verify-credential/page.tsx` | Possible duplicate of `/verify` |
| `/verify-credentials` | `app/verify-credentials/page.tsx` | Possible duplicate of `/verify` |
| `/lms/courses/[courseId]/certification` | `app/lms/(app)/courses/[courseId]/certification/page.tsx` | Learner-facing post-completion page |
| `/certificates/[certificateId]` | `app/certificates/[certificateId]/page.tsx` | Learner certificate view |

---

## API Route Inventory

### LMS / Lesson Routes

| Route | File | Status |
|-------|------|--------|
| `POST/DELETE /api/lessons/[lessonId]/complete` | `app/api/lessons/[lessonId]/complete/route.ts` | Canonical — marks complete, updates progress, triggers eligibility |
| `GET /api/lms/enrollment-status` | `app/api/lms/enrollment-status/route.ts` | Canonical |

### Certificate Routes (fragmented)

| Route | File | Notes |
|-------|------|-------|
| `POST /api/cert/issue` | `app/api/cert/issue/route.ts` | Canonical admin issuance — writes to `certificates` |
| `POST /api/certificates/issue` | `app/api/certificates/issue/route.ts` | Possible duplicate — verify |
| `POST /api/certificates/issue-program` | `app/api/certificates/issue-program/route.ts` | Program-level issuance |
| `GET /api/certificates/verify` | `app/api/certificates/verify/route.ts` | Verification API |
| `POST /api/cert/bulk-issue` | `app/api/cert/bulk-issue/route.ts` | Bulk admin issuance |
| `GET /api/cert/pdf` | `app/api/cert/pdf/route.ts` | PDF generation |

### Auth Routes (duplicates)

| Route | File | Status |
|-------|------|--------|
| `POST /api/auth/signin` | `app/api/auth/signin/route.ts` | **Canonical** — Zod validation, `withRateLimit` |
| `POST /api/auth/login` | `app/api/auth/login/route.ts` | **Duplicate** — uses deprecated `lib/rateLimit` (in-memory), manual validation |

### Routes Using Deprecated Rate Limiter (`lib/rateLimit`)

`app/api/contact/route.ts`, `app/api/applications/route.ts`, `app/api/marketplace/apply/route.ts`, `app/api/marketplace/report/route.ts`, `app/api/auth/login/route.ts`, `app/api/checkout/marketplace/route.ts`, `app/api/booking/schedule/route.ts`, `app/api/partners/barbershop-apprenticeship/apply/route.ts`, `app/api/blog/route.ts`, `app/api/upload/route.ts`, `app/api/inquiries/route.ts`

### Routes Returning `error.message` Directly (22 files)

`app/api/profile/update/route.ts`, `app/api/admin/barber-onboarding-blast/route.ts`, `app/api/admin/external-progress/update/route.ts`, `app/api/admin/courses/ai-builder/route.ts`, `app/api/admin/settings/route.ts`, `app/api/admin/monitoring/status/route.ts`, `app/api/admin/fix-enrollment-policies/route.ts`, `app/api/track-usage/route.ts`, `app/api/onboarding/complete/route.ts`, `app/api/wioa/support-services/[id]/approve/route.ts`, `app/api/wioa/iep/[id]/route.ts`, `app/api/cron/expire-credentials/route.ts`, `app/api/compliance/record/route.ts`, `app/api/auth/signin/route.ts`, `app/api/auth/signup/route.ts`, `app/api/intake/route.ts`, `app/api/ai/course-builder/route.ts`, `app/api/monitoring/stats/route.ts`, `app/api/testing/bookings/[id]/route.ts`, `app/api/ai-studio/generate-video/route.ts`, `app/api/proctor/sessions/route.ts`, `app/api/proctor/sessions/[id]/route.ts`

---

## LMS Inventory

### Data Flow (current)

```
programs → modules → curriculum_lessons (step_type) → lesson_progress
                                                     → checkpoint_scores  [MISSING]
                                                     → step_submissions   [MISSING]
```

### Key Tables

| Table | Code Refs | Role |
|-------|----------|------|
| `curriculum_lessons` | 15 | DB-driven lesson store with `step_type`, `module_order`, `lesson_order` |
| `training_lessons` | 97 | Legacy HVAC lesson store (94 rows) |
| `lms_lessons` (view) | 10 | Unified view: `curriculum_lessons` UNION `training_lessons` |
| `lesson_progress` | 44 | Per-user lesson completion |
| `training_enrollments` | 68 | Enrollment + progress % |
| `program_enrollments` | 449 | Canonical enrollment table |
| `modules` | 12 | Module definitions |

### Missing DB Objects

| Object | Required For |
|--------|-------------|
| `checkpoint_scores` table | Checkpoint gating — record pass/fail per checkpoint |
| `step_submissions` table | Lab/assignment submission + instructor sign-off |
| `passing_score` column on `curriculum_lessons` | Per-lesson pass threshold |

### Blueprint System

| File | Status |
|------|--------|
| `lib/curriculum/blueprints/prs-indiana.ts` | Active — registered in `index.ts` |
| `lib/curriculum/blueprints/hvac-epa-608.ts` | Present but **not registered** in `index.ts` |
| `lib/curriculum/blueprints/prs.ts` | Older PRS blueprint — possibly superseded |
| `lib/services/curriculum-generator.ts` | Active — idempotent, writes `curriculum_lessons` + `modules` |
| `lib/curriculum/builders/buildCourseFromBlueprint.ts` | Active — assembles course from DB |

### Certificate / Completion Chain

| Component | File | Status |
|-----------|------|--------|
| Lesson completion trigger | `app/api/lessons/[lessonId]/complete/route.ts` | Active |
| Eligibility check | `lib/services/exam-eligibility.ts` | Active — creates exam authorization |
| Completion rules engine | `lib/lms/completion-rules.ts` | Active — checks lessons, quizzes, hours |
| Auto-certificate on completion | Not wired | **Gap** — eligibility creates authorization, not certificate |
| Admin certificate issuance | `app/api/cert/issue/route.ts` | Active |
| Credly badge issuance | `lib/credentials/credly.ts` | Active |
| Public verification | `app/verify/[certificateId]/page.tsx` | Active |

---

## Database Inventory

### Most-Referenced Tables

| Table | References |
|-------|-----------|
| `profiles` | 1,041 |
| `program_enrollments` | 449 |
| `programs` | 209 |
| `training_courses` | 180 |
| `training_lessons` | 97 |
| `certificates` | 95 |
| `lesson_progress` | 44 |
| `training_enrollments` | 68 |

### Certificate Table Fragmentation (15+ tables)

| Table | References | Notes |
|-------|-----------|-------|
| `certificates` | 95 | Primary cert table |
| `certification_requests` | 18 | Workflow requests |
| `credential_registry` | 17 | External credential registry |
| `program_credentials` | 14 | Program→credential mapping |
| `learner_credentials` | 10 | Per-learner credential records |
| `issued_certificates` | 6 | Possible duplicate of `certificates` |
| `program_completion_certificates` | 1 | Used by `/verify/[certificateId]` |

**Problem:** Certificate issuance is split across multiple tables. The verification page queries several. Canonical cert table is `certificates`.

---

## Storage Inventory

### Supabase Storage Buckets

| Bucket | Code Refs | Used By |
|--------|----------|---------|
| `documents` | 7 | Document upload routes |
| `media` | 5 | Media upload/delete routes |
| `course-videos` | 2 | HVAC video URLs |
| `files` | 2 | Generic file upload |
| `videos` | 1 | Video storage |
| `mous` | 1 | `lib/mou-storage.ts` |
| `module-certificates` | 1 | Module certificate PDFs |
| `avatars` | 1 | User avatars |

### External Storage

| System | File | Bucket |
|--------|------|--------|
| Cloudflare R2 / AWS S3 | `lib/storage/file-storage.ts` | `elevate-media` (env: `R2_BUCKET`) |

### Storage Helper Files

| File | Bucket | Problem |
|------|--------|---------|
| `lib/mou-storage.ts` | `mous` | Uses `createBrowserClient` — wrong for server context |
| `lib/storage/complianceEvidence.ts` | `compliance-evidence` | Uses deprecated `lib/supabase-api` shim |
| `lib/storage/file-storage.ts` | R2/S3 | Canonical for digital downloads |

---

## Security Utility Inventory

### Rate Limiting

| File | Type | Importers | Status |
|------|------|-----------|--------|
| `lib/rate-limit.ts` | Upstash Redis | Many (via wrappers) | **Canonical** |
| `lib/api/withRateLimit.ts` | Tier wrapper | ~60 routes | **Canonical wrapper** |
| `lib/api/with-rate-limit.ts` | Alt wrapper | ~10 routes | Acceptable |
| `lib/rateLimit.ts` | In-memory, `@deprecated` | 11 routes | **Dead — migrate** |
| `lib/rateLimiter.ts` | `redis` npm client | 0 | **Dead — delete** |
| `lib/api/rate-limiter.ts` | In-memory Map | 0 | **Dead — delete** |

### Supabase Access

**Canonical** (`lib/supabase/`): `server.ts`, `client.ts`, `admin.ts`, `public.ts`, `server-db.ts`, `static.ts`, `index.ts`

**Deprecated shims** (78 active importers): `lib/supabaseServer.ts`, `lib/supabase-server.ts`, `lib/supabaseAdmin.ts`, `lib/supabase-admin.ts`, `lib/supabaseClient.ts`, `lib/supabaseClients.ts`, `lib/supabase.ts`, `lib/supabase-lazy.ts`, `lib/supabase-api.ts`, `lib/getSupabaseServerClient.ts`

### Auth Helpers

| File | Status |
|------|--------|
| `lib/auth.ts` | **Canonical** — `getCurrentUser()` |
| `lib/admin/guards.ts` | **Canonical** — `apiAuthGuard()`, `apiRequireAdmin()` |
| `lib/auth/lms-routes.ts` | Active — LMS role checks |
| `lib/auth-server.ts` | `@deprecated` |
| `lib/authAdapter.ts` | `@deprecated` |

### API Error Handling

| File | Status |
|------|--------|
| `lib/api/safe-error.ts` | **Canonical** — 19 importers |
| `lib/safe-error.ts` | Root duplicate — 0 importers, delete |

---

## Legacy Surface Area

### Code

| Path | Problem |
|------|---------|
| `lib/courses/hvac-*.ts` (32 files) | HVAC-only — must not be replicated for new programs |
| `lib/lms/hvac-enrichment.ts`, `lib/lms/hvac-simulations.ts` | HVAC-only LMS enrichment |
| `app/courses/hvac/` | Standalone hardcoded HVAC lesson, not in LMS engine |
| `app/api/auth/login/route.ts` | Duplicate of `/api/auth/signin`, uses dead rate limiter |
| `lib/curriculum/blueprints/hvac-epa-608.ts` | Not registered in blueprint index |
| `lib/curriculum/blueprints/prs.ts` | Possibly superseded by `prs-indiana.ts` |

### Database

| Item | Problem |
|------|---------|
| `training_lessons` | Legacy HVAC store — 97 code refs, should migrate to `curriculum_lessons` |
| `enrollments` | Legacy view → `program_enrollments` |
| `student_enrollments` | 36 refs — relationship to `program_enrollments` unclear |
| Certificate table fragmentation | 15+ cert tables, no single canonical record |
