# Elevate LMS — Agent Guidelines

## Project Overview

**Elevate LMS** is a workforce development / career training platform for [Elevate for Humanity](https://www.elevateforhumanity.org). It handles ETPL, DOL sponsorship, credentialing, enrollment, and payments, including IRS-aligned tax preparation workflows (Enrolled Agent with EFIN and PTIN).

## Tech Stack

- **Framework**: Next.js 16.1.6 with Turbopack, App Router
- **Database**: Supabase (project `cuxzzpsyufcewtmicszk`, 516+ tables)
- **Hosting**: Northflank combined services — `elevate-lms` uses `Dockerfile.northflank-lms`; `elevate-admin` uses `Dockerfile.northflank-admin`
- **Package Manager**: pnpm
- **Build**: `pnpm next build` — must complete with zero errors (page count grows as features are added — do not hardcode it)

## Common Commands

- `pnpm next build` — Build for production (verify zero errors)
- `pnpm next dev --turbopack` — Start dev server
- `pnpm lint` — Run linter

## Key Directories

- `app/` — Next.js App Router pages
- `components/` — Reusable UI components
- `components/marketing/PublicLandingPage.tsx` — Config-driven marketing page template
- `components/admin/CurriculumLessonManager.tsx` — Admin UI for editing `curriculum_lessons` rows
- `data/team.ts` — Team member data (7 real members)
- `lib/tax-software/` — MeF tax stack
- `lib/curriculum/` — Blueprint system and course generator
- `scripts/northflank/` — Northflank service configuration, env sync, DNS, and deploy helpers
- `aws/` — legacy hosting task definitions/buildspecs retained only as migration reference; do not use for new deploys
- `supabase/migrations/` — SQL migration files (applied manually — see Migrations section)
- `public/images/` — All site images

---

## Repository Size

| Metric                    | Count                                                 |
| ------------------------- | ----------------------------------------------------- |
| `page.tsx` files          | 1,293                                                 |
| `route.ts` files (API)    | 1,186                                                 |
| Supabase migrations       | 685                                                   |
| `console.log` occurrences | ~1,521 across 118 files — use `lib/logger.ts` instead |

---

## Migrations

Files go in `supabase/migrations/`. Naming: `YYYYMMDD000NNN_description.sql`. Increment the suffix for same-day migrations.

**Migrations are NOT auto-applied.** After writing a migration file:

1. Open Supabase Dashboard → SQL Editor
2. Paste and run the migration manually
3. Verify the schema change before marking work complete

Never assume a migration is live just because the file exists in `supabase/migrations/`.

---

## LMS Architecture

### Course Engine — DB-Driven, Program-Agnostic

The course engine routes rendering and completion rules by `step_type`, a column on `curriculum_lessons`. Do not write per-program hardcoded logic — set `step_type` in the DB and the renderer handles it automatically.

### Data Hierarchy

```
programs → modules → curriculum_lessons (step_type) → lesson_progress
                                                     → checkpoint_scores
                                                     → step_submissions
```

### step_type Values

| Value           | Rendering               | Completion Rule                            |
| --------------- | ----------------------- | ------------------------------------------ |
| `lesson`        | Reading / video         | Mark complete button                       |
| `quiz`          | Quiz player             | Pass threshold (`passing_score`)           |
| `checkpoint`    | Quiz player             | Pass threshold — gates next module         |
| `lab`           | Lab UI shell            | Instructor sign-off                        |
| `assignment`    | Assignment UI shell     | Instructor sign-off                        |
| `exam`          | Quiz player             | Pass threshold                             |
| `certification` | Credential pathway page | Final step — redirects to `/certification` |

### Key DB Objects

| Object                            | Purpose                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `curriculum_lessons`              | Canonical lesson store — `step_type`, `module_order`, `lesson_order`, `passing_score`      |
| `training_lessons`                | Legacy HVAC lesson store (94 rows) — **read-only archive, do not write**                   |
| `course_lessons`                  | Canonical lesson write target for all new courses — blueprint engine, Studio, LMS engine   |
| `lms_lessons` (view)              | Unified lesson read source: `curriculum_lessons` (priority) UNION `training_lessons`       |
| `courses`                         | Canonical course table — all new courses write here                                        |
| `training_courses`                | Legacy course table — **do not write new courses here**                                    |
| `lms_courses` (view)              | Unified course read source: `courses` (priority) UNION `training_courses` (fallback)       |
| `course_modules`                  | Course-scoped modules — linked via `course_id`. Used by Studio, blueprint engine, LMS engine |
| `modules`                         | Program-scoped modules — linked via `program_id`. Used by transcript, analytics, mobile API. **Different scope from `course_modules` — not a duplicate** |
| `lesson_progress`                 | Per-lesson completion — one row per user+lesson. Canonical for checkpoint gating           |
| `lms_progress`                    | Per-course summary — one row per user+course. Tracks `status`, `progress_percent`, `last_activity_at`. **Not a duplicate of `lesson_progress`** |
| `progress_entries`                | OJT apprenticeship timeclock — clock-in/out, geofencing. Unrelated to lesson progress      |
| `checkpoint_scores`               | Per-user checkpoint pass/fail records — drives module gating                               |
| `step_submissions`                | Lab/assignment submissions with instructor sign-off                                        |
| `completion_rules`                | Per-course/program completion rule definitions                                             |
| `program_completion_certificates` | Auto-issued on course completion when all checkpoints pass                                 |

**Progress table contract — do not create new progress tables:**
- Lesson-level completion → `lesson_progress`
- Course-level summary (started/completed/percent) → `lms_progress`
- OJT hours / timeclock → `progress_entries`

### Checkpoint Gating

When a learner completes a checkpoint lesson, a `checkpoint_scores` row is written. The next module is locked until the checkpoint for the previous module has a passing row. This is enforced in the lesson page — do not bypass it.

**Requires migration `20260327000003_checkpoint_gating.sql` to be applied in Supabase Dashboard.**

### Certification Chain

```
All lessons complete + all checkpoints passed
  → program_completion_certificates row auto-created
  → exam_funding_authorizations row created (via checkEligibilityAndAuthorize)
  → learner lands on /lms/courses/[courseId]/certification
  → public verification at /verify/[certificateId]
```

### Blueprint-Driven Course Engine (canonical path)

> Full specification: `docs/COURSE_ENGINE.md`
> Blueprint template: `lib/curriculum/blueprints/_template.ts`

Every course is defined by a `CredentialBlueprint` in `lib/curriculum/blueprints/`. The blueprint is the single source of truth for structure, video format, and activity menu. No per-program code is written — the engine reads the blueprint and renders automatically.

**Write path:**

```
CredentialBlueprint
  → buildCanonicalCourseFromBlueprint()
  → courses + course_modules + course_lessons
  → lms_lessons view → lesson page → learner
```

**What gets stored on every `course_lessons` row:**

- `lesson_type` — inferred from slug suffix (`-checkpoint`, `-lab`, `-exam`, etc.)
- `activities` JSONB — NHA-style activity menu (video, reading, flashcards, lab, practice, checkpoint)
- `video_config` JSONB — locked video format from `blueprint.videoConfig`

**Activity menu per step_type (stored in `activities` column):**

| step_type       | Activities                                                            |
| --------------- | --------------------------------------------------------------------- |
| `lesson`        | Video · Reading · Flashcards · Practice                               |
| `checkpoint`    | Video · Reading · Flashcards · Practice · **Checkpoint Quiz** (gated) |
| `lab`           | Video · Reading · **Hands-On Lab**                                    |
| `quiz` / `exam` | Video · Flashcards · Practice · **Quiz**                              |

**Lesson page activity routing:**

- URL param `?activity=video|reading|flashcards|lab|practice|checkpoint` switches the active tab
- `CourseModuleAccordion` links each activity directly: `/lms/courses/[id]/lessons/[id]?activity=video`
- Checkpoint tab is always last and gated until prior required activities are done

### Adding a New Program

1. Create `lib/curriculum/blueprints/[program].ts` — copy `hvac-epa-608.ts` as template
2. Define all modules with `lessons[]` arrays (slugs are the durable identity)
3. Add `videoConfig` to lock the video format for all lessons in this program
4. Register in `lib/curriculum/blueprints/index.ts`
5. Run the seeder: `pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint <id> --program <programId>`
6. Seeder writes `courses` → `course_modules` → `course_lessons` with activities + video_config
7. LMS renders the course automatically — no new code required

**Seeder flags:**

```bash
# Safe re-run (skips existing lessons)
pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint hvac-epa608-v1 --program 4226f7f6-fbc1-44b5-83e8-b12ea149e4c7

# Full rebuild (wipes and re-seeds)
pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint hvac-epa608-v1 --program 4226f7f6-fbc1-44b5-83e8-b12ea149e4c7 --mode replace

# Dry run (prints what would be written)
pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint hvac-epa608-v1 --program 4226f7f6-fbc1-44b5-83e8-b12ea149e4c7 --dry-run

# List all registered blueprints
pnpm tsx scripts/seed-course-from-blueprint.ts --list
```

### Course Landing Page — NHA Style

`app/lms/(app)/courses/[courseId]/page.tsx` renders:

- Hero image with course title and credential badge
- Stats strip (lessons, duration, checkpoints, certificate)
- **Module accordion** (`components/lms/CourseModuleAccordion.tsx`) — each module expands to show lessons
- Each lesson row expands to show its **activity menu** (NHA-style: Video, Reading, Flashcards, Lab, Practice, Checkpoint)
- Sidebar: progress card, course details, "Each Lesson Includes" list, credential

### Lesson Page — Activity Tabs

`app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` renders:

- Tab bar driven by `lesson.activities` JSONB (falls back to defaults by step_type)
- `?activity=` URL param sets the active tab — links from the accordion go directly to the right tab
- Each tab renders the appropriate component:
  - `video` → `HvacLessonVideo` (HVAC) or `InteractiveVideoPlayer` (other)
  - `reading` → sanitized HTML content + AI reading aids
  - `flashcards` → `SpacedRepetitionReview`
  - `lab` → `StepSubmissionForm`
  - `practice` → `QuizPlayer` (HVAC_QUICK_CHECKS or lesson.quiz_questions, passing 60%)
  - `checkpoint` → `QuizPlayer` (lesson.quiz_questions, passing_score from DB)
  - `notes` → `NoteTaking`
  - `resources` → downloadable resource list

### HVAC Legacy Path — Do Not Replicate

HVAC was built before the DB-driven engine. These files must not be copied for new programs:

| File                                                        | Status                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `lib/courses/hvac-*.ts` (32 files)                          | HVAC-only — do not replicate                              |
| `lib/lms/hvac-enrichment.ts`, `lib/lms/hvac-simulations.ts` | HVAC-only                                                 |
| `app/courses/hvac/`                                         | Standalone hardcoded HVAC lesson — not part of LMS engine |

The lesson page runs both paths in parallel for backward compatibility. New programs use only the DB-driven path.

### HVAC Source of Truth — MIGRATED (2025-Q2)

**Course ID:** `f0593164-55be-5867-98e7-8a86770a8dd0`
**Program ID:** `4226f7f6-fbc1-44b5-83e8-b12ea149e4c7` (slug: `hvac-technician`)
**Content source:** `curriculum_lessons` — migration complete as of 2025-Q2

**curriculum_lessons state (live):**

- 95 rows, all `status='published'`
- 85 `lesson` type + 10 `checkpoint` type (one quiz per module) — 21 total lessons with `quiz_questions` populated
- Pass threshold: **70%** on all checkpoint/quiz lessons (EPA 608 standard)
- Lesson slugs: `hvac-lesson-1` through `hvac-lesson-95`
- `quiz_questions` backfilled from `training_lessons` via migration `20260401000005`

**training_lessons:** 95 rows retained as **read-only archive**. Do not write to or delete from this table.

**lms_lessons view:** `curriculum_lessons` rows take priority (UNION ALL with NOT EXISTS guard). HVAC learners are served from `curriculum_lessons`. The view now exposes `cl.quiz_questions` and `cl.passing_score` directly (fixed in migration `20260401000005`).

**Do not delete `training_lessons` for HVAC** — it is the archive source for `quiz_questions` backfill and a rollback reference.

---

## In Progress / Incomplete Work

### Migrations Pending (apply in Supabase Dashboard)

The following migrations exist in `supabase/migrations/` but require manual application in the Supabase Dashboard SQL Editor:

- `20260702000009_normalize_two_factor_auth.sql` — merges `is_enabled`→`enabled`, adds FK/unique/index
- `20260702000010_onboarding_progress_unique.sql` — adds UNIQUE(user_id, step) to `onboarding_progress`
- `20260702000011_ensure_storage_buckets.sql` — idempotent bucket creation for all referenced buckets
- `20260702000012_external_courses_support_fee.sql` — adds `elevate_fee_cents`, `fee_label`, `support_included` to `program_external_courses`

All are idempotent — safe to re-run.

### Programs vs Courses — RESOLVED (2026-05)

**Canonical term:** "Program" — a student enrolls in a Program, not a Course.

**Resolution applied:**
- `/lms/programs` redirects to `/lms/courses` (permanent redirect in `next.config.mjs`)
- Nav labels updated: "My Courses" → "My Programs" in `LMSNavigation.tsx`, `LmsAppShell.tsx`, breadcrumbs, sidebar, portal config, learner layout
- `/lms/courses` remains the canonical authenticated route (106 inbound links preserved)
- Use "Program" in all public-facing UI; "Course" only when referring to the internal `training_courses` DB table

### Lab / Assignment Instructor Sign-Off UI — COMPLETE (2026-Q2)

Full stack is built and wired:

| Layer | File |
|---|---|
| Learner submission | `components/lms/StepSubmissionForm.tsx` |
| Submission API | `app/api/lms/submissions/route.ts` |
| Review API | `app/api/lms/submissions/review/route.ts` |
| Instructor list | `apps/admin/app/instructor/submissions/page.tsx` |
| Instructor detail | `apps/admin/app/instructor/submissions/[submissionId]/page.tsx` |
| Lesson page | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` — renders `StepSubmissionForm` for `lab` and `assignment` step types |

### Admin Curriculum Builder Page

`components/admin/CurriculumLessonManager.tsx` is built and wired into `app/admin/curriculum/[courseId]/page.tsx`.

---

## Canonical Systems

### Supabase Access

**Canonical** (`lib/supabase/`): `server.ts`, `client.ts`, `admin.ts`, `public.ts`, `server-db.ts`, `static.ts`

Import from `@/lib/supabase/*`. All 10 deprecated root-level shims (`lib/supabaseServer.ts`, `lib/supabase-server.ts`, `lib/supabaseAdmin.ts`, `lib/supabase-admin.ts`, `lib/supabaseClient.ts`, `lib/supabaseClients.ts`, `lib/supabase.ts`, `lib/supabase-lazy.ts`, `lib/supabase-api.ts`, `lib/getSupabaseServerClient.ts`) were deleted in 2026-Q2. Do not re-introduce them.

### Rate Limiting

Canonical: `lib/rate-limit.ts` (Upstash Redis) + `lib/api/withRateLimit.ts` (`applyRateLimit`)

```ts
import { applyRateLimit } from '@/lib/api/withRateLimit';
const rateLimited = await applyRateLimit(request, 'api');
if (rateLimited) return rateLimited;
```

| Tier      | Limit           | Use for                                |
| --------- | --------------- | -------------------------------------- |
| `strict`  | 3 req / 5 min   | Sensitive admin actions                |
| `auth`    | 5 req / 1 min   | Login, signup, password reset          |
| `payment` | 10 req / 1 min  | Checkout, Stripe webhooks              |
| `contact` | 3 req / 1 min   | Contact forms, enrollment forms        |
| `api`     | 100 req / 1 min | General authenticated API              |
| `public`  | 10 req / 1 min  | Public AI tutor, unauthenticated reads |

**Dead — do not import:**

- `lib/rateLimit.ts` — in-memory, broken in serverless, `@deprecated`. All importers migrated.
- `lib/rateLimiter.ts` — **deleted**
- `lib/api/rate-limiter.ts` — **deleted**

### API Auth Pattern

**Canonical — use this for all new routes:**

```ts
// Any authenticated user
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin routes (admin | super_admin | staff | org_admin)
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;

// Instructor or admin
import { apiRequireInstructor } from '@/lib/admin/guards';
const auth = await apiRequireInstructor(request);
if (auth.error) return auth.error;
```

**Legacy patterns — do not use in new routes, do not remove from existing ones without testing:**

- `withAuth({ roles: ['admin', 'super_admin'] })` from `@/lib/with-auth` — 23 routes, correct but non-canonical
- `getCurrentUser()` + inline role array check — 12 routes, correct but non-canonical
- Inline `supabase.auth.getUser()` + `profiles` role check — **265 files** (audited 2026-06), correct but non-canonical

All three legacy patterns check the same role set. Do not refactor them unless you are also adding tests. Silent regressions from mass-refactors are worse than style inconsistency.

**Phase 2 migration target (do not start without test coverage):**

The 265 files using inline `supabase.auth.getUser()` + `.from('profiles').select('role')` should migrate to `requireUser()` from `@/lib/auth/require-user.ts` (page files) or `apiAuthGuard` / `apiRequireAdmin` from `@/lib/admin/guards` (API routes). The canonical loaders already exist — the debt is adoption, not implementation.

Migrate in bounded batches by portal (e.g. all `app/employer/*` pages first), verify each batch builds and passes smoke tests before moving to the next. Do not mass-migrate in a single PR.

**AI service pattern:**

All AI completions must go through `lib/ai/ai-service.ts` → `aiChat()`. Do not instantiate `new OpenAI()` or `new GoogleGenerativeAI()` directly in route handlers. The service handles provider fallback, error normalization, and logging.

```ts
import { aiChat } from '@/lib/ai/ai-service';

const result = await aiChat({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'system', content: systemPrompt }, ...history],
  temperature: 0.7,
  maxTokens: 500,
});
const reply = result.content ?? fallback;
```

Exception: `app/api/ai-chat/route.ts` (public prospective-student chatbot) uses direct `fetch` intentionally — it has an offline fallback response tree for when no API key is present. Do not refactor it to use `aiChat()`.

**Middleware perimeter** (`proxy.ts` — the root Next.js middleware) handles multi-domain routing, auth perimeter, admin namespace gating, and role enforcement for protected routes. Do NOT create a separate `middleware.ts` — it will conflict with `proxy.ts` and break the build. All middleware logic goes in `proxy.ts`.

**Page-level guards** — `apps/admin/app/admin/layout.tsx` calls `getUser()` and enforces `super_admin` role before rendering. All admin pages under the admin subdomain inherit this. The main app's `app/admin/[[...path]]/page.tsx` is a catch-all that redirects `/admin/*` requests on `www.elevateforhumanity.org` to `admin.elevateforhumanity.org`. Do not add redundant page-level guards inside `apps/admin/app/admin/` unless a page sits outside the layout subtree.

Every route that reads or writes user data must call one of the above before any DB access. If a route is intentionally public, add a comment: `// PUBLIC ROUTE: <reason>`

### Audit Scripts

Three scripts in `scripts/` produce repeatable, evidence-based reports. Run before any data-dependent feature work.

```bash
bash scripts/audit-schema-refs.sh   # DB table gaps: code refs with no CREATE TABLE in migrations
bash scripts/audit-auth-gaps.sh     # Auth gaps: no-auth routes, role-blind admin routes, error leaks
bash scripts/audit-env-vars.sh      # Env var gaps: referenced in code but absent from .env.example
```

Current counts (as of 2026-03-16 audit):

- Schema gaps (≥5 refs, no migration): **126 tables** — requires live DB diff to resolve
- Routes with no auth check: **62**
- Admin routes with identity-only auth (no role check): **13** (3 generate routes fixed in PR #50)
- Routes leaking `error.message`: **33**

**Before writing any new data-dependent route**, run this in Supabase Dashboard SQL editor to confirm the table exists live:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### API Error Response Shape

All API error responses must use `{ error: string }`. Use `lib/api/safe-error.ts`:

```ts
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

return safeError('Program not found', 404);
return safeInternalError(err, 'Failed to enroll');
if (error) return safeDbError(error, 'DB query failed');
```

Never return `error.message` directly in a response body. `lib/safe-error.ts` (root) has been deleted — import only from `@/lib/api/safe-error`.

### Auth Redirect Parameter

Use `?redirect=<path>` (not `?next=`):

```ts
redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
```

---

## Storage Conventions

| Asset Type            | Bucket                | Access Pattern                                                    |
| --------------------- | --------------------- | ----------------------------------------------------------------- |
| User documents        | `documents`           | `supabase.storage.from('documents')` via `lib/supabase/server.ts` |
| Media (images, video) | `media`               | `supabase.storage.from('media')`                                  |
| MOU PDFs              | `mous`                | `supabase.storage.from('mous').createSignedUrl(filename, 60)`     |
| Certificate PDFs      | `module-certificates` | `supabase.storage.from('module-certificates')`                    |
| Digital downloads     | R2/S3                 | `lib/storage/file-storage.ts` — `getDownloadUrl(key)`             |
| Course videos         | `course-videos`       | Use `supabase.storage.from('course-videos').getPublicUrl(path)`   |

**Rule:** Never hardcode Supabase project URLs. Always use the storage client to generate URLs.

---

## Enrollment Schema — Source of Truth

| Table                  | References | Status                                                            |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| `program_enrollments`  | 449        | **Canonical** — use for all new code                              |
| `training_enrollments` | 68         | LMS operational (attendance, cohort, progress %)                  |
| `enrollments`          | 24         | Legacy compatibility view → `program_enrollments`                 |
| `student_enrollments`  | 36         | Apprenticeship-specific (hours tracking) — distinct purpose, keep |

---

## Canonical Portals by Role

| Role              | Canonical path              | Legacy (redirect-only)        |
| ----------------- | --------------------------- | ----------------------------- |
| Learner / Student | `/learner/dashboard`        | `/student-portal`, `/student` |
| Admin             | `/admin/dashboard`          | —                             |
| Instructor        | `/instructor/dashboard`     | —                             |
| Employer          | `/employer/dashboard`       | `/employer-portal`            |
| Partner           | `/partner/dashboard`        | `/partner-portal`             |
| Program Holder    | `/program-holder/dashboard` | —                             |
| Staff             | `/staff-portal/dashboard`   | —                             |
| Mentor            | `/mentor/dashboard`         | —                             |

---

## Hero Banner Standard — Non-Negotiable

All hero banners on Elevate for Humanity must use the shared premium video system. These rules are not suggestions.

**Prohibited:**

- Gradient overlays on the video frame (`bg-gradient-to-t`, `from-black`, `before:`/`after:` pseudo-element overlays, dark opacity wash layers)
- Headlines, subheadlines, paragraphs, checklists, or CTAs rendered on top of the video
- Text baked into the video asset
- Page-specific custom hero markup that bypasses the shared component

**Required:**

- Use `components/marketing/HeroVideo.tsx` for every hero banner
- Define all per-page content (headlines, CTAs, transcripts, video sources) in `content/heroBanners.ts`
- All primary messaging renders **below the video frame**, never on it
- Provide a `posterImage` on every hero (reduced-motion and load-failure fallback)
- Provide a `transcript` for every hero with a voiceover

**Allowed on the video frame only:**

- Discreet sound toggle (bottom-right)
- Play/pause control (bottom-right)
- Micro-label of 2–4 words max (bottom-left)
- Small brand bug if explicitly required (top-left)

Full specification: `docs/hero-video-standard.md`

---

## CTA System — Non-Negotiable

Every program page must have these CTAs in this order:

1. **Apply Now** — `cta.applyHref`
2. **Request Information** — `cta.requestInfoHref` (defaults to `/contact?program=<slug>`)
3. **Indiana Career Connect** — `cta.careerConnectHref` — **only on WIOA/apprenticeship pages**, opens in new tab

Rules:

- No `href="#"` anywhere
- No buttons without routes
- No conflicting CTAs on the same page
- Payment plan note required on every self-pay program page
- `requestInfoHref` and `careerConnectHref` are set in the program data file (`data/programs/<slug>.ts`), not hardcoded in components
- Indiana Career Connect is never shown on non-WIOA programs (e.g. CPR, short courses)

---

## Brand Color Convention

Use `brand-blue-*`, `brand-red-*`, `brand-orange-*`, `brand-green-*` for brand elements. Semantic colors (indigo, teal, purple, emerald, cyan) are kept for UI state differentiation.

---

## Multi-Provider Hub

### Role Model

```ts
export type UserRole =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'super_admin'
  | 'staff'
  | 'program_holder'
  | 'provider_admin'
  | 'case_manager'
  | 'employer'
  | 'partner'
  | 'delegate';
```

`provider_admin` — scoped to a single `tenant_id`.
`case_manager` — scoped to assigned learners via `case_manager_assignments`.

### Tenant Architecture

- `tenants.type` enum: `elevate | partner_provider | employer | workforce_agency`
- RLS helpers (all `SECURITY DEFINER`): `get_my_tenant_id()`, `is_provider_admin()`, `is_case_manager()`, `get_my_assigned_learner_ids()`, `get_my_role()`, `is_admin_role()`

### Admin IP Guard

```ts
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
const blocked = checkAdminIP(request);
if (blocked) return blocked;
```

Controlled by `ADMIN_IP_ALLOWLIST` env var. No-op if unset.

### Key New Routes

| Route                                     | Auth                     | Purpose                   |
| ----------------------------------------- | ------------------------ | ------------------------- |
| `POST /api/provider/programs/submit`      | provider_admin           | Submit program for review |
| `POST /api/provider/programs/[id]/review` | admin/staff              | Approve or reject         |
| `GET /api/provider/programs/list`         | provider_admin/admin     | List approvals            |
| `GET/POST /api/placements`                | admin/staff/case_manager | Placement records         |
| `GET /api/employer/matches`               | admin/employer           | Employer-program matching |
| `GET /api/cron/expire-credentials`        | CRON_SECRET              | Expire stale credentials  |
| `POST/DELETE /api/admin/impersonate`      | admin/super_admin        | Support impersonation     |
| `POST /api/provider/export`               | provider_admin           | Queue CSV data export     |

---

## Credential Authority Separation

- Platform stores credential records and verification links
- Certifications are issued by their respective authorities (EPA, PTCB, CompTIA, NCCER, Indiana SDOH)
- Elevate does not issue credentials it does not legally control
- External verification: `lib/credentials/verification.ts`
- Badge issuance: `lib/credentials/credly.ts` + `lib/jobs/handlers/credly-badge.ts`

---

## Key Components

- `components/marketing/PublicLandingPage.tsx` — Config-driven landing page template
- `components/admin/CurriculumLessonManager.tsx` — Admin UI for `curriculum_lessons` rows
- `data/team.ts` — Team data with FOUNDER and TEAM_PREVIEW exports

## Key Pages

- `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` — Canonical lesson renderer
- `app/lms/(app)/courses/[courseId]/certification/page.tsx` — Course end-state
- `app/verify/[certificateId]/page.tsx` — Public certificate verification
- `app/admin/impersonate/page.tsx` — Admin impersonation UI

## Key Lib Files

- `lib/curriculum/blueprints/index.ts` — Blueprint registry (import from here only)
- `lib/services/curriculum-generator.ts` — Idempotent course generator
- `lib/lms/completion-evaluator.ts` — Completion rule evaluator
- `lib/services/exam-eligibility.ts` — Eligibility check + exam authorization
- `app/api/tax/file-return/route.ts` — Tax filing endpoint
- `app/api/tax/refund-tracking/route.ts` — Public refund tracking endpoint

---

## Document Generation (Partnership Proposals)

```js
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  ShadingType,
  convertInchesToTwip,
} = require('docx');
```

- Logo: `public/images/Elevate_for_Humanity_logo_81bf0fab.jpg` — render at 60×90px
- Brand colors: `DARK = '1E293B'`, `RED = 'DC2626'`, `GRAY = '6B7280'`
- Page margins: 1in top/bottom, 1.25in left/right
- Font: Arial throughout, body size 22 (11pt), headings size 28 (14pt)
- Output to `/tmp/` then attach to SendGrid email
- From: `noreply@elevateforhumanity.org` / Reply-to: `elevate4humanityedu@gmail.com`

---

## Cleanup Status

- ✅ All stock images replaced with local workforce images
- ✅ All "Join thousands" template CTAs eliminated
- ✅ All inline SVG Learn/Certify/Work cards → Lucide icons
- ✅ All pexels image references → local images
- ✅ All empty alt="" attributes → descriptive alt text
- ✅ All blue-_ → brand-blue-_ across app/ and components/
- ✅ 27+ public pages rewritten with real content
- ✅ Auth flow: signin/signup redirect to real forms
- ✅ Dead rate limit files deleted (`lib/rateLimiter.ts`, `lib/api/rate-limiter.ts`)
- ✅ Dead error helper deleted (`lib/safe-error.ts` root duplicate)
- ✅ 11 routes migrated from dead `lib/rateLimit` to canonical `applyRateLimit`
- ✅ Checkpoint gating migration written (`20260327000003_checkpoint_gating.sql`)
- ✅ Checkpoint gate enforced in lesson page
- ✅ Auto-certificate issuance wired in lesson completion route
- ✅ `CurriculumLessonManager` component built

## Governance Status

Remaining governance items have been resolved to decision state.

### 1. Admin curriculum builder

**Status: DONE**
Staff guard aligned with `[courseId]` page. Missing `curriculum_lessons_admin_write` RLS policy added (browser client saves were silently rejected). Page is operational.

### 2. HVAC blueprint registration

**Status: DONE**
Registry was already correct — `HVAC_EPA608_BLUEPRINT` exported via `getHvacBlueprint()` in `index.ts`. Incorrect `CredentialBlueprint` type annotation removed from `hvac-epa-608.ts`.

### 3. FORCE ROW SECURITY on `checkpoint_scores` and `program_completion_certificates`

**Status: DEFERRED BY DESIGN**
Inventory (`scripts/inventory-privileged-write-paths.cjs`) confirmed live service-role write paths:

- `checkpoint_scores` — written by `recordCheckpointAttempt` via `createAdminClient()`
- `program_completion_certificates` — written by `issueCertificateIfEligible` via `createAdminClient()`

Applying `FORCE ROW SECURITY` now would break checkpoint recording and certificate issuance.

**Prerequisite to reopen:** migrate these writes to learner-scoped access or `SECURITY DEFINER` RPCs, then add explicit authenticated policies. Do not put this on a near-term checklist without also committing to that refactor.

### 4. `lesson_progress` super_admin RLS tightening

**Status: PRODUCT DECISION REQUIRED — current model is intentional**
`lesson_progress_insert` / `lesson_progress_update` policies allow super_admin JWT to write for any `user_id`. This is actively used: `app/admin/enrollments/EnrollmentManagementClient.tsx` deletes another user's progress rows when an admin removes an enrollment.

Do not tighten without replacing admin remediation and enrollment-management behavior with a formal override workflow.

### Approved current governance posture

- DB triggers enforce progression integrity on all write paths including service_role
- Audit triggers capture checkpoint passes, certificate issuance, and admin completion overrides
- Privileged override capability is intentional, documented, and monitored via `audit_logs`

---

## Quiz Model — Two Parallel Systems (Do Not Conflate)

There are two distinct quiz systems. They serve different purposes and must not be merged.

**Model A — Standalone Quiz Engine** (`quizzes` + `quiz_questions` + `quiz_attempts` tables)
- Full quiz objects with their own IDs, separate from lessons
- Used by: `/lms/quizzes/[quizId]`, quiz submit/start API routes, admin quiz management pages
- `quiz_attempts` written on every submission
- Studio `QuizPanel` loads from this model
- Write path: `POST /api/lms/quizzes/[quizId]/start` → `quiz_attempts` → `POST /api/lms/quizzes/[quizId]/submit`

**Model B — Inline Lesson Questions** (`course_lessons.quiz_questions` JSONB column)
- Questions stored as JSONB on the lesson row — no separate quiz object
- Used by: lesson page `QuizPlayer`, checkpoint gating, `lms_lessons` view
- Completion written to `lesson_progress` and `checkpoint_scores` (not `quiz_attempts`)
- Blueprint engine writes questions here via `activities` JSONB
- Write path: lesson page → `POST /api/lms/progress/complete` → `lesson_progress` + `checkpoint_scores`

**Rule**: Do not create a third quiz model. New inline lesson assessments use Model B. New standalone assessable quizzes (e.g. practice exams, standalone assessments) use Model A.

---

## Remaining Technical Debt

- `console.log` calls remain in some non-runtime areas — prefer `import { logger } from '@/lib/logger'` for new code
- 8 certificate-related tables have no migration source — verify in Supabase Dashboard
- One migration requires superuser application: `20260417000013_documents_bucket_policies.sql` (`storage.objects` ownership)
- ~60 files still read `training_courses` directly — should migrate to `lms_courses` view incrementally
- `training_courses` write path in `lib/db/courses.ts` `createCourseFromBlueprint()` still targets `training_courses` for the course row (lesson rows now fixed) — migrate to `courses` table when ready

---

## FUTURE TASKS

1. **Accessibility (WCAG 2.1 AA)** — foundations and automated CI gate are in place: `<html lang="en">`, `SkipToContent` in root layout, `#main-content` landmark in all major layouts (PublicLayout, LmsAppShell, admin, mentor, case-manager, staff-portal), `*:focus-visible` styling, and `prefers-reduced-motion` handling. Axe-core WCAG 2.1 AA scan runs on every PR via the `accessibility` job in `.github/workflows/compliance-gate.yml` (test source: `tests/e2e/accessibility.spec.ts`). Remaining work is page-by-page remediation as failures surface — not a bulk sweep.
2. **RLS hardening (when ready)** — migrate `recordCheckpointAttempt` and `issueCertificateIfEligible` to learner-scoped access or `SECURITY DEFINER` RPCs, then apply `FORCE ROW SECURITY` on `checkpoint_scores` and `program_completion_certificates`

Lab/assignment instructor sign-off UI is implemented: `apps/admin/app/instructor/submissions/`, `app/api/lms/submissions/review/route.ts`, migration `20260601000006_step_submissions_review_columns.sql`, with full audit trail via `competency_audit_log` and auto lesson_progress completion via the competency gate.

JotForm webhook auth is implemented via shared secret in the URL (`JOTFORM_WEBHOOK_SECRET`) with timing-safe comparison. JotForm does not support HMAC and does not publish a stable IP list, so the shared-secret approach is the canonical design.

---

## Page Design System — Non-Negotiable

All student-facing marketing and program pages must follow the locked design system.
Full specification: `docs/page-design-standard.md`
Hero video rules: `docs/hero-video-standard.md`
Design tokens: `lib/page-design-tokens.ts`

### Required for every new student-facing page

1. Use `ProgramDetailPage`, `ProgramPageLayout`, or `ProgramCategoryPage` — do not build custom page layouts
2. Hero: clean media only, no text/gradient overlay, content in white panel below
3. Hero height: `h-[45vh] min-h-[280px] max-h-[560px]`
4. Typography: `text-slate-*` only — never `text-gray-*`
5. Dark CTA sections: `bg-slate-900` — never `bg-white text-white`
6. Step numbers: `bg-brand-red-600 text-white` — never `bg-white text-white`
7. List bullets: `w-1.5 h-1.5 rounded-full bg-brand-red-500` dot — never `CheckCircle2` or `✓`
8. Program cards: use `components/programs/ProgramCard.tsx` — no custom card layouts
9. Indiana Career Connect block required on all WIOA/apprenticeship-eligible pages
10. Funding section required on all program pages — WIOA, WRG, JRI, self-pay, BNPL

### Prohibited patterns

- `text-gray-*` → use `text-slate-*`
- `CheckCircle2`, `Award`, `Briefcase`, `GraduationCap` as content icons
- Green checkmarks (`✓`) as list bullets
- `bg-green-*` / `text-green-*` → use `brand-green-*`
- Gradient overlays on hero images/videos
- `text-white` or `text-white/90` on white/light backgrounds
- `bg-white/10 border-white/10` on white backgrounds
- `muted` or `autoPlay` attributes on hero `<video>` elements — use `useHeroVideo` hook
- Sparse pages (hero + cards + CTA with no explanatory content)
- Icon-led content sections (icons replacing real images or text)

### Hero video

All hero videos use `useHeroVideo` hook. No `muted`/`autoPlay` attributes on `<video>` elements.
The hook attempts unmuted play and falls back silently. No mute button shown.

---

## Docs

- `docs/platform-readiness-implementation-plan.md` — audit findings and execution plan
- `docs/platform-readiness-completion-report.md` — full completion report with deployment steps
- `docs/page-design-standard.md` — **non-negotiable rules for every page**: hero system, program page section order, CTA system, Indiana Career Connect rules, typography, invisible text patterns, shared component requirements, form completeness, routing, mobile. All new pages must comply.
- `repo_audit_report.md` — full platform inventory (2026-03-27)
- `canonical_systems.md` — canonical implementation for each subsystem
- `lms_architecture.md` — LMS data model, rendering flow, certification chain
- `schema_audit.md` — DB table audit with migration sources
- `storage_audit.md` — storage bucket audit and conventions
- `dead_code_candidates.md` — dead/deprecated files with recommended actions
- `legacy_program_paths.md` — HVAC legacy path documentation

---

## Cursor Cloud specific instructions

### Environment setup

- **Node.js 20.19.2** required (pinned in `.node-version`). Use `nvm use 20.19.2`.
- **pnpm 10.28.2** is the package manager — `corepack enable` activates it.
- **No local database** — the app connects to hosted Supabase. A `.env.local` with placeholder keys is enough to start the dev server; DB-dependent features fail gracefully at runtime.
- Minimum `.env.local` for dev server startup:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
  SUPABASE_SERVICE_ROLE_KEY=placeholder
  NEXTAUTH_SECRET=dev-secret
  NEXT_TELEMETRY_DISABLED=1
  SKIP_ENV_VALIDATION=true
  ```

### Running services

| Service | Command | Port |
|---------|---------|------|
| LMS dev server | `pnpm dev` (or `pnpm next dev --turbopack`) | 3000 |
| Admin app | `pnpm dev:admin` (or `cd apps/admin && pnpm dev`) | 3001 |

### Key commands

- `pnpm lint` — ESLint (expect ~37 pre-existing `no-console` errors in non-app files)
- `pnpm test` — Vitest unit tests (74 test files, 1634 tests)
- `pnpm typecheck` — TypeScript type check (requires `--max-old-space-size=8192`)
- `pnpm build` — Full production build (requires `--max-old-space-size=6144`, 2600+ pages)

### Gotchas

- **Middleware auth prefixes:** `AUTH_REQUIRED_ROUTES` uses segment-aware matching (`pathMatchesAuthPrefix` in `proxy.ts`). Never use bare `/apprentice` with `pathname.startsWith` — it incorrectly gates public `/apprenticeships`. Public marketing prefixes are listed in `PUBLIC_MARKETING_PREFIXES` (`/apprenticeships`, `/programs/`, `/partners/`, etc.).
- The `predev` script runs `scripts/setup-env-auto.sh` which will fail if `.env.local` doesn't exist. Create it first or set `SKIP_ENV_VALIDATION=true`.
- Dev server logs `Failed to load from app_secrets` and `Failed to load from platform_secrets` with placeholder Supabase keys — this is expected and does not block the server.
- Northflank Dockerfiles require real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time. Runtime must also inject real keys via the `elevate-production-env` secret group. Admin `/api/health` returns 500 with `supabaseAnonKeyLooksPlaceholder` when the anon key is still a placeholder. URL must be `https://<ref>.supabase.co`, not `db.<ref>.supabase.co`.
- **Login "site configuration" error:** The browser needs real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. They are injected from Northflank runtime env via `SupabasePublicConfigScript` in root layout. Local dev: use real keys in `.env.local`, not `placeholder`. `/api/public/supabase-config` is the fallback hydrate endpoint used by `/login`.
- ESLint uses flat config (`eslint.config.mjs`). The `--ext` flag in `pnpm lint` is legacy but still works.
- `pnpm approve-builds` is interactive — do not run in CI/agent. Build dependencies are already allowlisted in `pnpm.onlyBuiltDependencies`.
- The admin app shares `lib/`, `components/`, and `data/` with the root via tsconfig path aliases (`@/*` → `../../*`).
- **Beauty apprenticeships** (barber, cosmetology, nail, esthetician): daily theory quiz **70%** required before RTI hours credit (`apprenticeship_daily_theory` table + `POST /api/apprenticeship/daily-theory`). Host shops must align with published syllabus (`HostShopSyllabusRequirement` on host-shops pages). Barber program map: `BarberWorkforceNetworkMap` + `lib/beauty-apprenticeship/workforce-network-locations.ts`.
- Marketing heroes are **video-only** (no `posterImage` in `public/data/hero-banners.json`). `HeroVideo` uses a slate frame until the video plays. Re-apply video defaults with `node scripts/patch-hero-banners-video-only.mjs` after regenerating banners.
- **Program/marketing images:** use `getProgramCardImage()` / `getProgramHeroImage()` from `lib/images/programImages.ts` and `resolveSiteImagePath()` from `lib/images/site-image-paths.ts` for legacy `.webp` paths. `HeroPicture` / `HeroVideo` use `hero.imageWrap` from `lib/page-design-tokens.ts` (`clamp(190px,32vw,360px)`). Run `pnpm audit:image-assets` and `pnpm audit:visual-layout` before large marketing changes; full report in `docs/audits/VISUAL_LAYOUT_AUDIT.md`.

### Northflank production DNS (Durable — no apex ALIAS)

Durable cannot CNAME-flatten apex to Northflank. **Do not** use apex **A** → Northflank IP (wrong TLS on mobile). Use **`www` CNAME** → Northflank + **apex URL redirect** → `https://www.elevateforhumanity.org` in Durable. App canonical host is `www` (`proxy.ts` 308 apex→www). Runbook: `docs/northflank-dns-durable.md`.

### Northflank deploy (LMS + admin)

- **Build disk (`ERR_PNPM_ENOSPC`):** Set build ephemeral storage to **32768 MB (32 GB)** minimum via `pnpm tsx scripts/northflank/configure-services.ts --execute` (or `patch-ephemeral-storage.ts --execute`). PATCH must target `/services/combined/{id}` (plain `/services/{id}` returns 405). Northflank only allows 16384, 32768, 65536, … — there is no 40960. **65536** may require a higher project build-resource quota on your Northflank plan. If the UI still shows **0 MB**, refresh the build settings page after a new build starts — the list API often omits storage even when PATCH succeeded.
- **pnpm in Docker:** Store dir is **`/app/.pnpm-store`** (same filesystem as `/app/node_modules` for hardlinks). Never use `--package-import-method=copy` in Northflank Dockerfiles — it duplicates the full store into `node_modules` and triggers ENOSPC even when the registry cache mount works. Flow: `pnpm fetch` after copying workspace manifests, `COPY . .`, then `pnpm install --offline`.
- **Build context:** `.dockerignore` excludes `node_modules`, `.next`, `supabase/`, `tests/`, `docs/`, etc. Verify with `tar -cf - --exclude-from=.dockerignore . | wc -c` (expect well under 1 GB).
- **LMS:** service `elevate-lms`, Dockerfile `Dockerfile.northflank-lms`, branch `main`, readiness path `/api/ping`
- **Admin (Northflank):** service `elevate-admin`, Dockerfile `Dockerfile.northflank-admin`, branch `main`, readiness path `/api/ping`. Same pnpm fetch/offline flow as LMS (no `--package-import-method=copy`). After `next build`, **`node scripts/prune-admin-standalone.mjs`**. Lesson video/TTS output → **Supabase `course-videos`** (`lib/video/upload-lesson-media.ts`), not `public/generated/`. Runtime image copies slim `public/` subtrees + `remotion-src/` only. Northflank secret group `elevate-production-env`: canonical **`NORTHFLANK_API_TOKEN`** only (no `NORTHFLANK_API_KEY` / `NF_API_TOKEN` duplicates); set **`DEVSTUDIO_DEVCONTAINER_MODE=github-only`**. Sync: `pnpm tsx scripts/northflank/sync-env.ts --execute`.

**Admin runtime disk (line-by-line — do not write under `public/` in production):**

| Route | Writes | Cleaned? |
|-------|--------|----------|
| `POST /api/admin/generate-lesson-videos` | `os.tmpdir()` during Remotion/TTS; durable → Supabase `course-videos/generated-lessons/` | Yes — temp removed after upload (`lib/video/remotion-render.ts`, `upload-lesson-media.ts`) |
| `POST /api/admin/courses/[id]/generate-videos` | `os.tmpdir()/vid-gen-*` | Yes — `rmSync` in `finally` |
| `POST /api/admin/preview-slide` | `os.tmpdir()/elevate-slide-cache/`; durable cache → Supabase `course-videos/slide-cache/` | Yes — temp per request (`lib/video/slide-image-cache.ts`) |
| `POST /api/admin/wioa/pirl-export` | `os.tmpdir()/pirl-*` | Yes — after upload |
| `PUT /api/devstudio/devcontainer` | `.devcontainer/` only in `local-only` without `GITHUB_TOKEN` | Blocked in prod (`github-only`) |
| Dashboard UI (`app/admin/*`, WIOA ETPL) | None | N/A — API → Supabase only |

Full audit: `docs/audits/ADMIN_DASHBOARD_STORAGE_AUDIT.md` §6. LMS video jobs: `POST /api/videos/generate` uses the same Supabase upload path (no `public/generated/`).
- **Admin (AWS ECS, legacy):** `elevate-admin-service` on `elevate-cluster`, `Dockerfile.admin`, CodeBuild `elevate-admin-build`. Deploy: `.github/workflows/deploy-admin.yml` on `main`.
- `apps/admin/server.js` must load `.next/required-server-files.json` at startup.
- **BuildKit cache:** `pnpm tsx scripts/northflank/ensure-build-cache.ts --execute` (10GB `useCache` on both services)
- **Deploy both:** `DEPLOY_BRANCH=main pnpm tsx scripts/northflank/deploy-live.ts --execute`
- **DNS:** `docs/northflank-dns-durable.md`

### Admin dashboard architecture (Dev Studio, AI, Settings, Container)

Four configuration stores exist — they are **intentionally separate** and do NOT overlap:

| Store | Table | UI surface | Purpose |
|-------|-------|------------|---------|
| **platform_secrets** | `platform_secrets` | Dev Studio → Secrets | Encrypted API keys; highest runtime priority |
| **app_secrets** | `app_secrets` | Dev Studio → Container (env section) | Dev environment secrets |
| **platform_settings** | `platform_settings` | Env Manager + Settings hub | Plaintext config, integration keys |
| **process.env** | Northflank secret group / `.env.local` | Dev Studio → Container (Northflank push) | Base layer |

Precedence at runtime: `platform_secrets > app_secrets > process.env`

**AI Console vs Dev Studio Command tab:** both use `/api/devstudio/execute` — AI Console is the standalone page, Dev Studio embeds the same in an IDE-like shell. Not a conflict.

**Dev Studio AI Chat** (`/api/devstudio/chat`) uses Groq/Gemini with tool calling for platform operations. This is separate from `lib/ai/ai-service.ts` (`aiChat()`) which is for course content generation.

### Stripe webhooks (production)

- **Canonical URL:** `https://www.elevateforhumanity.org/api/webhooks/stripe` — register in Stripe Dashboard (live), then set signing secret in the Northflank production secret group for the **LMS** service.
- **Barber apprenticeship** events may also use `/api/barber/webhook` with `STRIPE_WEBHOOK_SECRET_BARBER` — keep both endpoints’ secrets in Northflank if both are registered.
- Handler tries all configured `STRIPE_WEBHOOK_SECRET*` env vars (`lib/stripe/construct-webhook-event.ts`) so a mismatched secondary endpoint secret does not cause repeated 400s.
- After fixing webhook secrets, redeploy LMS and **Enable** the endpoint in Stripe Dashboard. `GET /api/webhooks/stripe` returns `{ ok: true }` for smoke checks.
- **Jordan / Natalia weekly billing (manual):** `POST /api/admin/stripe-apprentice-payments` (admin auth) or `pnpm tsx scripts/run-apprentice-stripe-billing.ts` with live `STRIPE_SECRET_KEY`. Defaults to customers `cus_UGFxoJKjtlNoy8` and `cus_UTVa6pmsYlWBsp`.
