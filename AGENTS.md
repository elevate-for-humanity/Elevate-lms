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

---

## In Progress / Incomplete Work

### Migration Must Be Applied

`supabase/migrations/20260327000003_checkpoint_gating.sql` has been created but not yet applied. Until applied:
- `checkpoint_scores` and `step_submissions` tables do not exist
- `passing_score` column does not exist on `curriculum_lessons`
- The lesson page fails open (checkpoints render but scores are not recorded)

### Lab / Assignment Instructor Sign-Off UI

`step_submissions` table is defined in the migration above. The lesson page renders lab/assignment UI shells but submission storage requires the migration to be applied. Instructor sign-off UI is not yet built.

### Admin Curriculum Builder Page

`components/admin/CurriculumLessonManager.tsx` is built. It needs to be wired into a new page at `app/admin/curriculum/[courseId]/page.tsx` (does not exist yet).

### HVAC Blueprint Not Registered

`lib/curriculum/blueprints/hvac-epa-608.ts` exists but is not registered in `lib/curriculum/blueprints/index.ts`. Register it before running the HVAC curriculum generator.

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

## Remaining Technical Debt

- ~1,521 `console.log` calls — use `import { logger } from '@/lib/logger'`
- 78 files import from deprecated Supabase shims — migrate to `lib/supabase/*` gradually
- `lib/rateLimit.ts` still exists (`@deprecated`, 0 active importers) — delete when confirmed
- `lib/curriculum/blueprints/hvac-epa-608.ts` not registered in `index.ts`
- `lib/curriculum/blueprints/prs.ts` may be superseded by `prs-indiana.ts` — verify
- `app/api/auth/login/route.ts` — deprecated duplicate of `/api/auth/signin`
- 8 certificate-related tables have no migration source — verify in Supabase Dashboard
- `lib/mou-storage.ts` uses `createBrowserClient` in server context
- `lib/storage/complianceEvidence.ts` uses deprecated `lib/supabase-api` shim
- Admin curriculum builder page not yet created (`app/admin/curriculum/[courseId]/page.tsx`)

---

## FUTURE TASKS

1. **Apply migration** — run `20260327000003_checkpoint_gating.sql` in Supabase Dashboard
2. **Admin curriculum builder page** — wire `CurriculumLessonManager` into `app/admin/curriculum/[courseId]/page.tsx`
3. **Lab/assignment instructor sign-off UI** — `step_submissions` table is ready, UI not built
4. **Register HVAC blueprint** — add `hvac-epa-608.ts` to `lib/curriculum/blueprints/index.ts`
5. **Delete `lib/rateLimit.ts`** — confirm 0 importers, then delete
6. **Accessibility (WCAG 2.1 AA)** — skip-nav, aria labels, focus styles, keyboard nav
7. **JotForm webhook security** — add IP allowlist or HMAC check
8. **Commit and push** all accumulated changes

---

## Docs

- `docs/platform-readiness-implementation-plan.md` — audit findings and execution plan
- `docs/platform-readiness-completion-report.md` — full completion report with deployment steps
- `repo_audit_report.md` — full platform inventory (2026-03-27)
- `canonical_systems.md` — canonical implementation for each subsystem
- `lms_architecture.md` — LMS data model, rendering flow, certification chain
- `schema_audit.md` — DB table audit with migration sources
- `storage_audit.md` — storage bucket audit and conventions
- `dead_code_candidates.md` — dead/deprecated files with recommended actions
- `legacy_program_paths.md` — HVAC legacy path documentation
