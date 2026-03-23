# Elevate LMS — Agent Guidelines

## Project Overview

**Elevate LMS** is a workforce development / career training platform for [Elevate for Humanity](https://www.elevateforhumanity.org). It handles ETPL, DOL sponsorship, credentialing, enrollment, and payments. The owner also runs **SupersonicFastCash**, a tax preparation software company (Enrolled Agent with EFIN and PTIN).

## Tech Stack

- **Framework**: Next.js 16.1.6 with Turbopack, App Router
- **Database**: Supabase (project `cuxzzpsyufcewtmicszk`, 516+ tables)
- **Hosting**: Netlify with `@netlify/plugin-nextjs`
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
- `netlify/functions/` — Serverless functions (file-return.ts, refund-tracking.ts)
- `supabase/migrations/` — SQL migration files (applied manually — see Migrations section)
- `public/images/` — All site images

---

## Repository Size

| Metric | Count |
|--------|-------|
| `page.tsx` files | 1,486 |
| `route.ts` files (API) | 1,079 |
| Supabase migrations | 278 |
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

### Source of Truth — Canonical Course Tables

**`courses` / `course_modules` / `course_lessons` is the source of truth for all new programs.**

`curriculum_lessons` and `modules` are legacy tables retained for HVAC and PRS backward compatibility. Do not write new programs to them. Do not read from them for new features.

### Canonical Data Hierarchy

```
programs → courses → course_modules → course_lessons → lesson_progress
                   → module_completion_rules
```

### Adding a New Program — One Entry Point

```ts
import { createAndPublishProgram } from '@/lib/programs/create-and-publish-program';

const result = await createAndPublishProgram({
  program: { slug, title, description, category: 'workforce' },
  modules: [
    {
      slug: 'mod-1', title: 'Module 1', orderIndex: 1,
      lessons: [
        { slug: 'lesson-1', title: 'Lesson 1', orderIndex: 1, lessonType: 'lesson' },
        { slug: 'checkpoint-1', title: 'Checkpoint', orderIndex: 2, lessonType: 'checkpoint', passingScore: 80 },
      ],
    },
  ],
  publish: true,
});
// result: { programId, courseId, moduleCount, lessonCount, published }
```

This is the **only** path for creating new programs. No seed scripts. No hardcoded UUIDs. No manual DB inserts.

- **Input type:** `lib/programs/types.ts` — `ProgramCreateInput`
- **Pipeline:** `lib/programs/create-and-publish-program.ts`
- **API route:** `POST /api/admin/programs/create` (admin/super_admin/staff only)
- **Kill test:** `npx tsx scripts/test-generator-one-shot.ts --cleanup`
- **Hardening tests:** `SUPABASE_MANAGEMENT_TOKEN=<pat> npx tsx scripts/test-generator-hardening.ts --cleanup`

### Reading a Published Course

```ts
import { getPublishedCourseBySlug } from '@/lib/lms/course-repository';
const course = await getPublishedCourseBySlug(db, slug);
// Returns full module+lesson tree, sorted by order_index
```

`lib/lms/course-repository.ts` reads `courses → course_modules → course_lessons` only. Never falls back to `curriculum_lessons`.

### lms_lessons View

`lms_lessons` is a read-only projection from `course_lessons` (migration `20260504000001`). It exists for backward compatibility with renderer code that queries it by `course_id`. New code should use `course-repository.ts` directly.

### lesson_type Values

| Value | Rendering | Completion Rule |
|-------|-----------|-----------------|
| `lesson` | Reading / video | Mark complete button |
| `quiz` | Quiz player | Pass threshold (`passing_score`) |
| `checkpoint` | Quiz player | Pass threshold — gates next module |
| `lab` | Lab UI shell | Instructor sign-off |
| `assignment` | Assignment UI shell | Instructor sign-off |
| `exam` | Quiz player | Pass threshold |
| `certification` | Credential pathway page | Final step — redirects to `/certification` |

### Key DB Objects

| Object | Purpose |
|--------|---------|
| `courses` | Canonical course store — `slug`, `title`, `status`, `program_id` |
| `course_modules` | Module definitions — `title`, `order_index`, FK → `courses.id` |
| `course_lessons` | Lesson store — `lesson_type`, `order_index`, `passing_score`, `quiz_questions` |
| `module_completion_rules` | Per-module completion gates — one row per module |
| `lms_lessons` (view) | Projection from `course_lessons` — backward compat only |
| `curriculum_lessons` | Legacy content store (HVAC, PRS) — read-only, do not write new programs here |
| `training_lessons` | Legacy HVAC lesson store (94 rows) — archive only |
| `lesson_progress` | Per-user lesson completion |
| `checkpoint_scores` | Per-user checkpoint pass/fail records — drives module gating |
| `step_submissions` | Lab/assignment submissions with instructor sign-off |
| `program_completion_certificates` | Auto-issued on course completion when all checkpoints pass |

### Schema Integrity

The pipeline depends on these FKs being present in the live DB:

| Constraint | Table | References |
|-----------|-------|-----------|
| `course_modules_course_id_fkey` | `course_modules.course_id` | `courses.id` ON DELETE CASCADE |
| `course_lessons_course_id_fkey` | `course_lessons.course_id` | `courses.id` ON DELETE CASCADE |
| `course_lessons_module_id_fkey` | `course_lessons.module_id` | `course_modules.id` ON DELETE SET NULL |

Added live on 2026-05-04 and codified in migration `20260504000002_course_modules_fk.sql`. If PostgREST returns "relationship not found" errors, run:

```sql
NOTIFY pgrst, 'reload schema';
```

### Certification Chain

```
All lessons complete + all checkpoints passed
  → program_completion_certificates row auto-created
  → exam_funding_authorizations row created (via checkEligibilityAndAuthorize)
  → learner lands on /lms/courses/[courseId]/certification
  → public verification at /verify/[certificateId]
```

### HVAC Legacy Path — Do Not Replicate

HVAC was built before the DB-driven engine. These files must not be copied for new programs:

| File | Status |
|------|--------|
| `lib/courses/hvac-*.ts` (32 files) | HVAC-only — do not replicate |
| `lib/lms/hvac-enrichment.ts`, `lib/lms/hvac-simulations.ts` | HVAC-only |
| `app/courses/hvac/` | Standalone hardcoded HVAC lesson — not part of LMS engine |

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

**Pending migration (apply in Supabase Dashboard):**
- `20260401000005_curriculum_lessons_quiz_questions.sql` — adds `quiz_questions` column, backfills HVAC data, updates `lms_lessons` view

**Do not delete `training_lessons` for HVAC** — it is the archive source for `quiz_questions` backfill and a rollback reference.

---

## In Progress / Incomplete Work

### Migrations Pending (apply in Supabase Dashboard)

These files exist in `supabase/migrations/` but have **not** been applied to the live DB:

| File | Effect |
|------|--------|
| `20260401000005_curriculum_lessons_quiz_questions.sql` | Adds `quiz_questions` to `curriculum_lessons`, backfills HVAC data |
| `20260402000003_programs_lms_columns.sql` | Adds `short_description` and `display_order` to `programs` |

These files **have been applied** to the live DB (applied 2026-05-04):

| File | Effect |
|------|--------|
| `20260504000001_lms_lessons_canonical_view.sql` | Rebuilds `lms_lessons` as projection from `course_lessons` |
| `20260504000002_course_modules_fk.sql` | Adds `course_modules_course_id_fkey` FK; removes orphaned rows |

Until `20260401000005` is applied:
- `curriculum_lessons.quiz_questions` column does not exist
- HVAC checkpoint quiz player falls back to `HVAC_QUIZ_MAP` (still functional, but not DB-driven)

Until `20260402000003` is applied:
- `programs.short_description` column does not exist
- `lib/lms/api.ts` `getPrograms()` falls back to `excerpt` then `description` (functional, but verbose)
- `/lms/programs` catalog shows empty state if no `published=true` programs exist in DB

**Verify after applying `20260402000003`:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'programs'
  AND column_name IN ('short_description', 'display_order');
```

### Programs vs Courses — Tracked UX Debt

**Status:** Explicit debt. Not forgotten. Do not resolve casually.

The public LMS uses "Programs" (`/lms/programs`) while the authenticated app uses "Courses" (`/lms/courses`) for the same top-level student offering. This creates a terminology split that confuses users navigating between public and authenticated views.

**Root cause:** `/lms/courses` was established before the public LMS layer existed and has 20+ inbound links across the codebase. Renaming it requires:
1. Adding redirect rules: `/lms/courses` → `/lms/programs` (or vice versa)
2. Updating all 20+ inbound `href` references
3. Deciding canonical term: **Program** is correct (a student enrolls in a Program, not a Course)
4. Updating nav labels in `LmsAppShell.tsx` and `LMSNavigation.tsx`

**Do not rename without a migration plan.** Until resolved, use "Program" in all new public-facing UI and "Course" only where it refers to the internal `training_courses` table object.

### Legacy Programs Pending Canonical Migration

Three programs have `has_lms_course=false` because they were seeded via `curriculum_lessons` (old path) and never migrated to the canonical pipeline. They have zero live enrollments and fail safely (program page shows "No courses yet"). They must be rebuilt through `createAndPublishProgram()` before being re-enabled.

| Slug | Title | Blocker |
|------|-------|---------|
| `peer-recovery-specialist` | Peer Recovery Specialist | Empty — was always a dead slug. No content anywhere. Needs content authored from scratch. |
| `bookkeeping` | Bookkeeping | No content in `curriculum_lessons` or `training_lessons`. Needs content authored from scratch. |
| `cna` | Certified Nursing Assistant | No content in `curriculum_lessons` or `training_lessons`. Needs content authored from scratch. |

**These are not migration candidates — they are content authoring gaps.** There is nothing to migrate. Content must be authored first (via blueprint + `createAndPublishProgram()`), then `has_lms_course` set to `true` after `validate-lms-integrity.ts` passes.

**Proven migration pattern** (for programs that DO have content in `curriculum_lessons`): see `scripts/migrate-prs-jri-to-canonical.ts`. PRS-JRI was migrated this way — 8 modules, 39 lessons, published first pass.

### Lab / Assignment Instructor Sign-Off UI

`step_submissions` table exists (applied via earlier migration). The lesson page renders lab/assignment UI shells but instructor sign-off UI is not yet built.

### Admin Curriculum Builder Page

`components/admin/CurriculumLessonManager.tsx` is built and wired into `app/admin/curriculum/[courseId]/page.tsx`.

---

## Canonical Systems

### Supabase Access

**Canonical** (`lib/supabase/`): `server.ts`, `client.ts`, `admin.ts`, `public.ts`, `server-db.ts`, `static.ts`

Import from `@/lib/supabase/*`. The following deprecated shims still have 78 active importers — do not add new imports from them:

`lib/supabaseServer.ts`, `lib/supabase-server.ts`, `lib/supabaseAdmin.ts`, `lib/supabase-admin.ts`, `lib/supabaseClient.ts`, `lib/supabaseClients.ts`, `lib/supabase.ts`, `lib/supabase-lazy.ts`, `lib/supabase-api.ts`, `lib/getSupabaseServerClient.ts`

### Rate Limiting

Canonical: `lib/rate-limit.ts` (Upstash Redis) + `lib/api/withRateLimit.ts` (`applyRateLimit`)

```ts
import { applyRateLimit } from '@/lib/api/withRateLimit';
const rateLimited = await applyRateLimit(request, 'api');
if (rateLimited) return rateLimited;
```

| Tier | Limit | Use for |
|------|-------|---------|
| `strict` | 3 req / 5 min | Sensitive admin actions |
| `auth` | 5 req / 1 min | Login, signup, password reset |
| `payment` | 10 req / 1 min | Checkout, Stripe webhooks |
| `contact` | 3 req / 1 min | Contact forms, enrollment forms |
| `api` | 100 req / 1 min | General authenticated API |
| `public` | 10 req / 1 min | Public AI tutor, unauthenticated reads |

**Dead — do not import:**
- `lib/rateLimit.ts` — in-memory, broken in serverless, `@deprecated`. All importers migrated.
- `lib/rateLimiter.ts` — **deleted**
- `lib/api/rate-limiter.ts` — **deleted**

### API Auth Pattern

```ts
// Any authenticated user
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin or super_admin only
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

⚠️ **`apiRequireAdmin` previously only allowed `'admin'`** — this was fixed in PR #50. It now allows `['admin', 'super_admin', 'staff']`. If you see identity-only checks on admin routes, add an explicit role check:

```ts
const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

There is no root `middleware.ts`. Auth is enforced per-route. Every route that reads or writes user data must call one of the above before any DB access.

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

| Asset Type | Bucket | Access Pattern |
|-----------|--------|----------------|
| User documents | `documents` | `supabase.storage.from('documents')` via `lib/supabase/server.ts` |
| Media (images, video) | `media` | `supabase.storage.from('media')` |
| MOU PDFs | `mous` | `supabase.storage.from('mous').createSignedUrl(filename, 60)` |
| Certificate PDFs | `module-certificates` | `supabase.storage.from('module-certificates')` |
| Digital downloads | R2/S3 | `lib/storage/file-storage.ts` — `getDownloadUrl(key)` |
| Course videos | `course-videos` | Use `supabase.storage.from('course-videos').getPublicUrl(path)` |

**Rule:** Never hardcode Supabase project URLs. Always use the storage client to generate URLs.

---

## Enrollment Schema — Source of Truth

| Table | References | Status |
|-------|-----------|--------|
| `program_enrollments` | 449 | **Canonical** — use for all new code |
| `training_enrollments` | 68 | LMS operational (attendance, cohort, progress %) |
| `enrollments` | 24 | Legacy compatibility view → `program_enrollments` |
| `student_enrollments` | 36 | Apprenticeship-specific (hours tracking) — distinct purpose, keep |

---

## Canonical Portals by Role

| Role | Canonical path | Legacy (redirect-only) |
|------|---------------|------------------------|
| Learner / Student | `/learner/dashboard` | `/student-portal`, `/student` |
| Admin | `/admin/dashboard` | — |
| Instructor | `/instructor/dashboard` | — |
| Employer | `/employer/dashboard` | `/employer-portal` |
| Partner | `/partner/dashboard` | `/partner-portal` |
| Program Holder | `/program-holder/dashboard` | — |
| Staff | `/staff-portal/dashboard` | — |
| Mentor | `/mentor/dashboard` | — |

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
  | 'student' | 'instructor' | 'admin' | 'super_admin' | 'staff'
  | 'program_holder' | 'provider_admin' | 'case_manager'
  | 'employer' | 'partner' | 'delegate';
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

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/provider/programs/submit` | provider_admin | Submit program for review |
| `POST /api/provider/programs/[id]/review` | admin/staff | Approve or reject |
| `GET /api/provider/programs/list` | provider_admin/admin | List approvals |
| `GET/POST /api/placements` | admin/staff/case_manager | Placement records |
| `GET /api/employer/matches` | admin/employer | Employer-program matching |
| `GET /api/cron/expire-credentials` | CRON_SECRET | Expire stale credentials |
| `POST/DELETE /api/admin/impersonate` | admin/super_admin | Support impersonation |
| `POST /api/provider/export` | provider_admin | Queue CSV data export |

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
- `netlify/functions/file-return.ts` — Tax filing endpoint
- `netlify/functions/refund-tracking.ts` — Public tracking endpoint

---

## Document Generation (Partnership Proposals)

```js
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType,
        convertInchesToTwip } = require('docx');
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
- ✅ All blue-* → brand-blue-* across app/ and components/
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

## Remaining Technical Debt

- ~1,521 `console.log` calls — use `import { logger } from '@/lib/logger'`
- 78 files import from deprecated Supabase shims — migrate to `lib/supabase/*` gradually
- `lib/rateLimit.ts` still exists (`@deprecated`, 0 active importers) — delete when confirmed
- `lib/curriculum/blueprints/prs.ts` may be superseded by `prs-indiana.ts` — verify
- `app/api/auth/login/route.ts` — deprecated duplicate of `/api/auth/signin`
- 8 certificate-related tables have no migration source — verify in Supabase Dashboard
- `lib/mou-storage.ts` uses `createBrowserClient` in server context
- `lib/storage/complianceEvidence.ts` uses deprecated `lib/supabase-api` shim

---

## FUTURE TASKS

1. **Lab/assignment instructor sign-off UI** — `step_submissions` table is ready, UI not built
2. **Delete `lib/rateLimit.ts`** — confirm 0 importers, then delete
3. **Accessibility (WCAG 2.1 AA)** — skip-nav, aria labels, focus styles, keyboard nav
4. **JotForm webhook security** — add IP allowlist or HMAC check
5. **RLS hardening (when ready)** — migrate `recordCheckpointAttempt` and `issueCertificateIfEligible` to learner-scoped access or `SECURITY DEFINER` RPCs, then apply `FORCE ROW SECURITY` on `checkpoint_scores` and `program_completion_certificates`

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
