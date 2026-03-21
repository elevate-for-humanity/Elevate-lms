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

---

## No-Drift PR Validation SOP

This repository must be operated as a production system, not a patch-and-chase workspace. No pull request is considered reviewable, mergeable, or diagnosable until the working branch is synchronized with `origin/main` and validated from the latest branch head.

### 1. Branch sync is mandatory before any diagnosis

Before reviewing CI, Netlify, lint, test, integrity, accessibility, E2E, or runtime issues, run:

```bash
git fetch origin
git checkout <feature-branch>
git log --oneline HEAD..origin/main
```

If any commits are listed, the branch is behind main. Stop all debugging and synchronize first:

```bash
git merge origin/main
```

Resolve conflicts immediately. Do not continue evaluation on a stale branch.

After merge resolution:

```bash
git push origin <feature-branch>
```

Only the CI and deploy results from this updated branch head are valid for review.

### 2. Cherry-pick is not routine branch maintenance

Do not use cherry-pick as the default method to keep a feature branch current. Cherry-pick is allowed only when all three conditions are true:

- the fix already exists and is proven on another branch
- the change is isolated and low-risk
- the transfer is intentional and explicitly justified

Otherwise, merge `origin/main` into the feature branch. Repeated cherry-picking is a process failure and creates hidden branch drift.

### 3. Branch health and feature correctness are separate

Do not confuse them.

**Branch health** means: branch is current with `origin/main`, dependencies install, lint passes, build passes, deploy starts successfully, no unresolved conflicts.

**Feature correctness** means: the changed route/page/component behaves correctly, the business logic works, the database state is correct, the UX is complete and coherent.

A green build does not prove feature correctness. A failed build does not always mean the feature is wrong. Stale-branch failures must be eliminated before feature diagnosis begins.

### 4. Every fix claim must include evidence

No one may say "fixed," "resolved," "good," "non-blocking," or "ready to merge" without attaching the evidence category.

Allowed evidence categories:
- code diff
- green build on the latest branch commit
- runtime verification on the affected surface
- live database validation for DB-affecting work
- proof that a failing check is pre-existing on `origin/main`

Unsupported claims are not accepted.

### 5. Required validation sequence for every PR

**Step A — Synchronize branch with main**

```bash
git fetch origin
git checkout <feature-branch>
git log --oneline HEAD..origin/main
git merge origin/main
git push origin <feature-branch>
```

If the branch was already current, `git log --oneline HEAD..origin/main` returns no output.

**Step B — Inspect changed surface**

```bash
git diff --name-only origin/main...HEAD
```

This defines the actual review surface. Use it to determine whether later failures are likely regressions or unrelated baseline issues.

**Step C — Run branch health checks**

```bash
pnpm install
pnpm lint
pnpm build
```

If project-specific checks exist, run them too (e.g. `pnpm test`, `pnpm validate:lms`).

**Step D — Review CI and deploys only from latest head**

GitHub checks must be evaluated on the newest commit after sync. Netlify preview must correspond to the newest commit after sync. Old CI results on pre-sync commits are invalid.

**Step E — Runtime verification**

Manually hit the exact changed page, API route, or workflow in preview or dev. Do not infer runtime correctness from compile success.

**Step F — Database validation for DB-affecting changes**

If the PR touches migrations, Supabase queries, data promotion pipelines, view logic, publication flows, course/module/lesson generation, enrollment state, or application/status logic — live database validation is mandatory before merge.

Validate: expected row counts, expected null/non-null state, foreign key integrity, no cross-program contamination, no orphaned records, correct view resolution, no unintended updates to unaffected programs.

### 6. Handling failing checks

**If the build fails:** verify the branch is current with `origin/main` first. If stale, sync first. If current, diagnose the actual code failure.

**If accessibility, integrity, or E2E fails:** compare the failing surface against `git diff --name-only origin/main...HEAD`. If the failing paths are inside the diff, treat as regression until disproven. If outside the diff, test whether failure reproduces on `origin/main`. Only then may it be called pre-existing.

**If runtime fails:** treat as a real blocker on the changed surface unless proven unrelated.

**If database validation fails:** treat as merge-blocking.

### 7. Standard for calling something "pre-existing"

A failure may be called pre-existing only if there is evidence of **both**:

1. the failing surface is outside the PR's changed scope, **and**
2. the same failure reproduces on `origin/main` or is already documented with current evidence

Without both, do not call it pre-existing. Do not downgrade uncertainty into confidence.

### 8. Netlify and preview rules

A successful deploy means only that the branch built and deployed. It does not prove the application works.

Minimum preview validation: preview corresponds to latest commit, affected route loads, no runtime exception, expected response shape or UI behavior is present, no obvious broken data path.

For API routes, test the exact route. For LMS work, test the actual learner-facing route, not just the landing page.

### 9. Rules specific to this LMS repo

**For curriculum, publication, blueprint, promotion, or course-generation work**, validation must include: correct program-to-course linkage, correct module count, correct lesson count, no wrong-program lesson promotion, no slug-only cross-program contamination, no empty modules, lesson ordering resolves correctly in views, expected lesson content exists in the final learner-facing structure, unaffected programs remain unchanged.

**For application/admin health work**, validation must include: route compiles, route returns valid JSON, date math is correct, deadman/status logic works with real timestamps, no duplicate declarations or shadowing remains.

### 10. Required response format from any coding agent

When reporting status, use this structure exactly:

```
Branch status:
- current with origin/main: yes/no

Changed surface:
- <files or subsystem summary>

Checks:
- lint: pass/fail
- build: pass/fail
- deploy: pass/fail
- runtime verification: pass/fail
- DB validation: pass/fail/not applicable

Failures:
- <each failure with classification: regression / pre-existing / unknown>

Evidence:
- <diff, command output, runtime path tested, DB query result>

Merge recommendation:
- merge / do not merge / merge after specific blocker
```

No vague summaries. No "should be fine." No "looks good." No implied confidence without evidence.

### 11. Hard stop conditions

A PR is not mergeable if any of these are true:

- branch is behind `origin/main`
- build fails on latest synced head
- runtime fails on changed surface
- DB validation fails for DB-affecting work
- an allegedly pre-existing failure is unproven
- deploy reviewed is not from latest branch head

### 12. Default commands

```bash
git fetch origin
git checkout <feature-branch>
git log --oneline HEAD..origin/main
git merge origin/main
git diff --name-only origin/main...HEAD
pnpm install
pnpm lint
pnpm build
git push origin <feature-branch>
```

For LMS validation where applicable: `pnpm validate:lms`

### Paste-this instruction for coding agents

> Before making or evaluating any change, fetch origin and compare the working branch to `origin/main`. If the branch is behind, merge `origin/main` into the feature branch first and resolve conflicts before any further debugging. Do not cherry-pick routine fixes unless explicitly instructed. Do not interpret CI or Netlify failures from a stale branch as feature regressions. For every claimed fix, report evidence from the latest branch head only: changed surface, build result, runtime verification, and live DB validation where applicable. Separate branch health from feature correctness at all times. No PR may be called ready, fixed, or mergeable without evidence.

---

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

### Course Engine — DB-Driven, Program-Agnostic

The course engine routes rendering and completion rules by `step_type`, a column on `curriculum_lessons`. Do not write per-program hardcoded logic — set `step_type` in the DB and the renderer handles it automatically.

### Data Hierarchy

```
programs → modules → curriculum_lessons (step_type) → lesson_progress
                                                     → checkpoint_scores
                                                     → step_submissions
```

### step_type Values

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
| `curriculum_lessons` | Canonical lesson store — `step_type`, `module_order`, `lesson_order`, `passing_score` |
| `training_lessons` | Legacy HVAC lesson store (94 rows) — do not add new programs here |
| `lms_lessons` (view) | Unified lesson source: `curriculum_lessons` (priority) UNION `training_lessons` (fallback) |
| `modules` | Module definitions — `title`, `slug`, `program_id` |
| `lesson_progress` | Per-user lesson completion |
| `checkpoint_scores` | Per-user checkpoint pass/fail records — drives module gating |
| `step_submissions` | Lab/assignment submissions with instructor sign-off |
| `completion_rules` | Per-course/program completion rule definitions |
| `program_completion_certificates` | Auto-issued on course completion when all checkpoints pass |

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

### Adding a New Program

1. Create `lib/curriculum/blueprints/[program].ts` following `prs-indiana.ts`
2. Register it in `lib/curriculum/blueprints/index.ts`
3. Run the curriculum generator (`lib/services/curriculum-generator.ts`)
4. Generator seeds `modules` and `curriculum_lessons` rows idempotently
5. Set `step_type = 'checkpoint'` on module-boundary lessons in the DB
6. Store `quiz_questions` as JSONB in `curriculum_lessons` rows
7. LMS renders the course automatically — no new code required

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
| `20260401000005_curriculum_lessons_quiz_questions.sql` | Adds `quiz_questions` to `curriculum_lessons`, backfills HVAC data, fixes `lms_lessons` view |
| `20260402000003_programs_lms_columns.sql` | Adds `short_description` and `display_order` to `programs`; backfills `short_description` from `excerpt` |

Until `20260401000005` is applied:
- `curriculum_lessons.quiz_questions` column does not exist
- `lms_lessons` view returns `NULL` for `quiz_questions` on curriculum rows
- HVAC checkpoint quiz player falls back to `HVAC_QUIZ_MAP` (still functional, but not DB-driven)

Until `20260402000003` is applied:
- `programs.short_description` column does not exist
- `lib/lms/api.ts` `getPrograms()` falls back to `excerpt` then `description` (functional, but verbose)
- `/lms/programs` catalog shows empty state if no `published=true` programs exist in DB

**Verify after applying `20260402000003`:**
```sql
-- Confirm columns exist
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'programs'
  AND column_name IN ('short_description', 'display_order');

-- Confirm live programs are published
SELECT id, slug, title, published, is_active, status
FROM public.programs
WHERE published = true AND is_active = true AND status != 'archived'
ORDER BY title LIMIT 10;
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
