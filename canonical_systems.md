# Canonical Systems

Generated: 2026-03-27  
Auditor: Ona

Each entry identifies the one canonical implementation for a subsystem, its related DB objects, where it is imported, and what must not be used instead.

---

## 1. LMS Lesson Rendering

**Canonical File:** `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Related DB Objects:**
- View: `public.lms_lessons` (unified: `curriculum_lessons` UNION `training_lessons`)
- Table: `lesson_progress`
- Table: `training_enrollments`

**Purpose:** Renders a single lesson. Routes UI by `step_type` (lesson / quiz / checkpoint / lab / assignment / exam / certification). Sidebar groups lessons by `module_title`. Auto-advances to next lesson on completion. Redirects to `/certification` page on final lesson.

**Import/Usage Locations:**
- Accessed directly by learners via Next.js routing
- Calls `GET /api/lms/enrollment-status` on load
- Calls `POST /api/lessons/[lessonId]/complete` on completion

**Deprecated Alternatives:**
- `app/courses/hvac/module1/lesson1/page.tsx` — standalone hardcoded HVAC lesson, not part of LMS engine. Do not add new lessons here.
- `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` — static marketing page, not DB-driven.

---

## 2. Curriculum Blueprint System

**Canonical Files:**
- `lib/curriculum/blueprints/index.ts` — registry, import from here only
- `lib/curriculum/blueprints/types.ts` — `CredentialBlueprint`, `BlueprintModule`, `BlueprintLessonRef`
- `lib/curriculum/blueprints/prs-indiana.ts` — PRS Indiana blueprint (only registered blueprint)
- `lib/curriculum/blueprints/validateBlueprint.ts` — blueprint validator
- `lib/services/curriculum-generator.ts` — idempotent generator: writes `curriculum_lessons` + `modules`
- `lib/curriculum/builders/buildCourseFromBlueprint.ts` — assembles course from DB using blueprint

**Related DB Objects:**
- Table: `curriculum_lessons` — identity key: `(program_id, lesson_slug)`
- Table: `modules` — identity key: `(program_id, slug)`
- Table: `credential_exam_domains` — domain linkage per lesson
- Table: `programs` — program record

**Purpose:** Defines course structure as a versioned blueprint. Generator reads blueprint, writes DB rows idempotently. Builder reads DB rows, assembles course in blueprint order. Slugs are the durable identity — never change after seeding.

**Import/Usage Locations:**
- `lib/curriculum/blueprints/index.ts` — `getBlueprintByCredentialSlug()`, `getAllBlueprints()`
- `lib/curriculum/builders/getBlueprintForProgram.ts`
- Scripts: `scripts/generate-all-lessons.ts`, `scripts/micro-release-lesson.ts`

**Deprecated Alternatives:**
- `lib/curriculum/blueprints/hvac-epa-608.ts` — present but **not registered** in `index.ts`. Must be registered before use.
- `lib/curriculum/blueprints/prs.ts` — older PRS blueprint, possibly superseded by `prs-indiana.ts`. Verify before deleting.
- `lib/courses/hvac-*.ts` (32 files) — HVAC-specific hardcoded content. Do not replicate for new programs.

---

## 3. Module / Lesson / Step Progression

**Canonical Files:**
- `lib/lms/completion-evaluator.ts` — evaluates completion rules for a course or program
- `lib/lms/completion-rules.ts` — rule definitions (lessons_complete, quizzes_passed, min_hours, external_modules)
- `app/api/lessons/[lessonId]/complete/route.ts` — POST: marks lesson complete, updates progress %, triggers eligibility

**Related DB Objects:**
- Table: `lesson_progress` — `(user_id, lesson_id, completed, completed_at)`
- Table: `training_enrollments` — `progress` column (0–100)
- Table: `curriculum_lessons` — `step_type`, `module_order`, `lesson_order`, `passing_score` (pending migration)
- View: `lms_lessons` — unified lesson source

**Purpose:** Records per-lesson completion, recalculates course progress percentage, evaluates program completion rules, triggers credential eligibility check on every lesson completion.

**Import/Usage Locations:**
- `app/api/lessons/[lessonId]/complete/route.ts`
- `app/api/courses/[courseId]/check-completion/route.ts`

**Deprecated Alternatives:**
- Manual "Mark Complete" button pattern — replaced by auto-advance + certification page redirect.

---

## 4. Checkpoint Enforcement

**Status: INCOMPLETE — migration and gate logic not yet implemented.**

**Canonical Files (to be created):**
- `supabase/migrations/20260327000003_checkpoint_gating.sql` — adds `checkpoint_scores`, `step_submissions`, `passing_score` column
- Gate logic in `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` — block next-lesson navigation until `checkpoint_scores` has a passing row

**Related DB Objects (pending):**
- Table: `checkpoint_scores` — `(user_id, lesson_id, score, passed, attempt_number)`
- Table: `step_submissions` — `(user_id, lesson_id, step_type, status, instructor_id)`
- Column: `curriculum_lessons.passing_score` — per-lesson pass threshold (default 70)

**Purpose:** Prevent learners from advancing past a checkpoint lesson without passing it. Block next module until current module's checkpoint is passed.

---

## 5. Certification Completion

**Canonical Files:**
- `lib/services/exam-eligibility.ts` — `checkEligibilityAndAuthorize()` — checks rules, creates exam authorization
- `lib/lms/completion-evaluator.ts` — evaluates whether all rules are satisfied
- `app/api/cert/issue/route.ts` — admin-triggered certificate issuance, writes to `certificates`
- `app/lms/(app)/courses/[courseId]/certification/page.tsx` — learner-facing end-state page
- `app/verify/[certificateId]/page.tsx` — public employer-facing verification page

**Related DB Objects:**
- Table: `certificates` — canonical cert record: `(user_id, course_id, enrollment_id, certificate_number, issued_at, pdf_url, verification_url, verification_code)`
- Table: `program_credentials` — maps program → credential
- Table: `exam_funding_authorizations` — created by eligibility check
- Table: `credential_registry` — external credential definitions

**Purpose:** On final lesson completion, eligibility check fires. If all rules pass, exam authorization is created. Admin then issues certificate via `/api/cert/issue`. Certificate is queryable at `/verify/[certificateId]`.

**Gap:** Auto-issuance on completion is not wired. Eligibility check creates authorization but does not issue certificate. This requires a completion→issuance bridge (Phase 8).

**Deprecated Alternatives:**
- `app/lms/(app)/courses/[courseId]/complete/page.tsx` — legacy completion page, pre-dates certification end-state.
- `app/api/certificates/issue/route.ts` — verify whether this duplicates `/api/cert/issue`.

---

## 6. API Response Wrapper

**Canonical File:** `lib/api/safe-error.ts`

**Exports:** `safeError(message, status)`, `safeInternalError(err, context)`, `safeDbError(error, context)`

**Purpose:** Prevents internal error details from leaking in API responses. Logs internally via `lib/logger.ts`. Returns `{ error: string }` shape.

**Import/Usage Locations:** 19 API route files currently import from here.

**Deprecated Alternatives:**
- `lib/safe-error.ts` — root-level duplicate, 0 importers. Delete.
- Direct `error.message` returns — 22 route files still do this. Must be replaced.

---

## 7. Supabase Access Layer

**Canonical Files (`lib/supabase/`):**
- `server.ts` — server components and API routes (cookie-based session)
- `client.ts` — client components
- `admin.ts` — service role (bypasses RLS) — use only for admin operations
- `public.ts` — anon key reads
- `server-db.ts` — server DB helper
- `static.ts` — static generation (no cookies)
- `index.ts` — re-exports

**Purpose:** Provides correctly-scoped Supabase clients. `admin.ts` uses service role key and bypasses RLS — only use for trusted server-side operations.

**Import/Usage Locations:** All new code must import from `@/lib/supabase/*`.

**Deprecated Alternatives (78 active importers — do not use):**
`lib/supabaseServer.ts`, `lib/supabase-server.ts`, `lib/supabaseAdmin.ts`, `lib/supabase-admin.ts`, `lib/supabaseClient.ts`, `lib/supabaseClients.ts`, `lib/supabase.ts`, `lib/supabase-lazy.ts`, `lib/supabase-api.ts`, `lib/getSupabaseServerClient.ts`

---

## 8. Rate Limiting

**Canonical Files:**
- `lib/rate-limit.ts` — Upstash Redis, tier definitions
- `lib/api/withRateLimit.ts` — `applyRateLimit(request, tier)` — use this in all new routes

**Tiers:** `strict` (3/5min), `auth` (5/1min), `payment` (10/1min), `contact` (3/1min), `api` (100/1min), `public` (10/1min)

**Purpose:** Redis-backed rate limiting that works in serverless. Fails closed on `auth`, `payment`, `strict` tiers when Redis is unavailable.

**Import/Usage Locations:** ~60 API routes import `applyRateLimit` from `lib/api/withRateLimit`.

**Deprecated Alternatives (do not import):**
- `lib/rateLimit.ts` — in-memory, broken in serverless, `@deprecated`. 11 active importers must be migrated.
- `lib/rateLimiter.ts` — uses `redis` npm client (not Upstash), 0 importers. Delete.
- `lib/api/rate-limiter.ts` — in-memory Map, 0 importers. Delete.

---

## 9. File Upload / Storage Access

**Canonical Files:**
- Supabase storage: call `supabase.storage.from('bucket-name')` using a client from `lib/supabase/server.ts` or `lib/supabase/admin.ts`
- R2/S3 digital downloads: `lib/storage/file-storage.ts`

**Supabase Buckets:**

| Bucket | Purpose |
|--------|---------|
| `documents` | User-uploaded documents (compliance, enrollment) |
| `media` | General media (images, videos) |
| `course-videos` | HVAC course video files |
| `mous` | Signed MOU PDFs |
| `module-certificates` | Module-level certificate PDFs |
| `avatars` | User avatar images |
| `files` | Generic file uploads |

**Purpose:** Supabase storage for user-generated content. R2/S3 for digital product downloads.

**Deprecated Alternatives:**
- `lib/storage/complianceEvidence.ts` — uses deprecated `lib/supabase-api` shim. Migrate to `lib/supabase/server.ts`.
- `lib/mou-storage.ts` — uses `createBrowserClient` in a server context. Migrate to `lib/supabase/server.ts`.

---

## 10. Auth / Permission Checks

**Canonical Files:**
- `lib/auth.ts` — `getCurrentUser()` for server components and API routes
- `lib/admin/guards.ts` — `apiAuthGuard(request)` (any auth), `apiRequireAdmin(request)` (admin/super_admin only)
- `lib/auth/lms-routes.ts` — LMS-specific role checks

**Purpose:** Every API route that reads or writes user data must call `apiAuthGuard` or `apiRequireAdmin` before any DB access. Do not call `supabase.auth.getUser()` directly in routes.

**Import/Usage Locations:** `lib/admin/guards.ts` is imported by ~40 admin API routes.

**Deprecated Alternatives:**
- `lib/auth-server.ts` — `@deprecated`
- `lib/authAdapter.ts` — `@deprecated`
- `lib/authGuards.ts` — status unclear, verify before deleting
- `lib/new-ecosystem-services/auth.ts` — status unclear, verify before deleting
