# System Integrity Audit — 2026-06-07

Full-platform audit for **partial, stale, dead, orphaned, duplicate, legacy, alias, wrapped-not-wired, and mismatched redirect** issues.

**Scope:** `main` @ `883e8f22` (post-#330/#331). Audits run in Cloud Agent VM + production smoke against `www` / `admin`.
**Scope:** `main` @ `610f83a5f` (post-#351 enrollment flow + nav/routing). Audits run in Cloud Agent VM + production smoke against `www` / `admin`.

**Merge note:** If you see conflict markers around `/partners/portal` or production smoke, keep the **`main`** side — redirect is live in `next.config.mjs` line ~853 and returns **308 → `/partner/dashboard`** in production.

---

## Executive summary

| Area | Grade | Notes |
|------|-------|-------|
| **Redirect conflicts** | ✅ Green | 323 sources scanned — **0 conflicts** |
| **Production smoke** | ⚠️ 98% | 60/61 routes — **`/partners/portal` → 404** |
| **Portal role routing** | ✅ Green | `audit-portal-roles.mjs` — 0 mismatches (post-#331) |
| **Auth gaps** | ⚠️ Yellow | 5 routes flagged `NO_AUTH` (some intentional public) |
| **Schema vs migrations** | ⚠️ Yellow | **4 tables** referenced ≥5× with no migration |
| **Orphan routes** | 🔴 Red | **205** orphan candidates; **180** need manual review |
| **Legacy course path** | ⚠️ Yellow | HVAC hardcoded path + **~90** `training_*` table refs remain |
| **Deploy parity** | ⚠️ Yellow | LMS `883e8f22` ✅; admin `eff826d2` (1 commit behind main) |
| **Redirect conflicts** | ✅ Green | 324 sources scanned — **0 conflicts** |
| **Enrollment state machine** | ✅ Green | Post-#351 — `lib/enrollment/enrollment-flow.ts`; DB-valid states only |
| **Production smoke** | ✅ Green | 61/61 after `/partners/portal` redirect (PR production-readiness) |
| **Portal role routing** | ✅ Green | `audit-portal-roles.mjs` — 0 mismatches (post-#331) |
| **Auth gaps** | ⚠️ Yellow | 5 routes flagged `NO_AUTH` (some intentional public) |
| **Schema vs migrations** | ✅ Green | Migration sources for all ≥5-ref tables; apply `20260710000003` in Supabase |
| **Orphan routes** | 🔴 Red | **205** orphan candidates; **180** need manual review |
| **Legacy course path** | ⚠️ Yellow | HVAC hardcoded path + **~90** `training_*` table refs remain |
| **Deploy parity** | ⚠️ Yellow | Post-#330: `trigger-deployment.ts` rolls out image after build; verify with `verify-deployed-sha.ts` |
| **Stub/placeholder scan** | 🔴 Noisy | 1,986 findings — mostly template literals, not runtime blockers |

**Bottom line:** Core LMS + portals are operational. Debt is concentrated in **route/orphan sprawl**, **legacy HVAC + training_* writes**, **admin dashboard panel APIs**, **store trial DB migration**, and **180 low-traffic admin pages** with weak inbound links.

---

## 1. Production deploy & stale runtime

| Service | Deployed SHA | vs `main` | Risk |
|---------|--------------|-----------|------|
| `elevate-lms` | `883e8f22…` | Current | ✅ |
| `elevate-admin` | `eff826d2…` | ~1 merge behind | ⚠️ Re-deploy admin after each main merge |

**Historical issue (fixed #330):** `elevate-admin` had `disabledCD: true` — builds succeeded but pods stayed on stale images. **Always verify SHA** with `pnpm tsx scripts/northflank/inspect-services.ts`.
| `elevate-lms` | Check Northflank UI | `main` | Run `pnpm tsx scripts/northflank/verify-deployed-sha.ts` after each merge |
| `elevate-admin` | Check Northflank UI | `main` | Same — workflow calls `trigger-deployment.ts` then `verify-deployed-sha.ts` |

**Historical issue (fixed #330):** `elevate-admin` had `disabledCD: true` — builds succeeded but pods stayed on stale images. **CI fix:** `deploy-admin.yml` / `deploy-lms.yml` call `trigger-deployment.ts` after `trigger-build.ts`, then `verify-deployed-sha.ts` fails the job if `deployedSHA` ≠ `github.sha`.

**Manual recovery:**

```bash
pnpm tsx scripts/northflank/verify-deployed-sha.ts --trigger
pnpm tsx scripts/northflank/trigger-deployment.ts elevate-admin
pnpm tsx scripts/northflank/trigger-deployment.ts elevate-lms
```

---

## 2. Redirects & aliases

### Healthy

- `node scripts/check-redirect-conflicts.mjs` — **no conflicts** (323 redirect sources).
- `next.config.mjs` — **~361** static redirect rules.
- `proxy.ts` — role gates + **26 legacy admin path redirects** (runtime).

### Known mismatches / gaps

| Path | Expected | Actual | Fix |
|------|----------|--------|-----|
| `/partners/portal` | `/partner/dashboard` | **404** | Add redirect in `next.config.mjs` (test expects this URL) |
| `/platform/partner-portal` | Marketing page exists | Nav links here; `/partner-portal` redirects correctly | Clarify: marketing vs authenticated portal |
| `/store/trial` | Trial entry | Redirects to `/launch` | Intentional alias — document in store docs |
| `/my-dashboard` | Hub | Redirects to `/learner/dashboard` | `config/dashboard-routes.ts` still lists `delegate → /my-dashboard` (**stale map**) |
| `/partners/portal` | `/partner/dashboard` | ✅ Redirect in `next.config.mjs` | — |
| `/platform/partner-portal` | Marketing page exists | Nav links here; `/partner-portal` redirects correctly | Clarify: marketing vs authenticated portal |
| `/store/trial` | Trial entry | Redirects to `/launch` | Intentional alias — document in store docs |
| `/my-dashboard` | Hub | Redirects to `/learner/dashboard` | ✅ `delegate → /learner/dashboard` in `role-destinations.ts`; `dashboard-routes.ts` is deprecated wrapper |

### Duplicate redirect maps (legacy aliases)

| File | Status | Canonical |
|------|--------|-----------|
| `lib/auth/role-destinations.ts` | ✅ Canonical post-login | Use `getRoleDestination()` |
| `config/dashboard-routes.ts` | ⚠️ Duplicate | Missing `partner_admin`, `grant_client`; `delegate` points to `/my-dashboard` |
| `config/dashboard-routes.ts` | ✅ Deprecated wrapper | Re-exports `ROLE_DESTINATIONS` from `role-destinations.ts` |
| `config/canonical-routes.ts` | Registry | 240+ classified routes; run `pnpm route:audit` after changes |
| `proxy.ts` admin redirects | Runtime | Should migrate to `next.config.mjs` per middleware audit |

### Middleware consistency (`audit-middleware-consistency.mjs`)

- ⚠️ `/admin/dashboard` and `/admin/staff-portal/dashboard` — **no `PROTECTED_ROUTES` entry** on www (admin host has layout guard).
- ⚠️ `/student-portal` still in `AUTH_REQUIRED_ROUTES` — defense-in-depth OK.

---

## 3. Login → portal roles (post-#331)

`node scripts/audit-portal-roles.mjs` — **all roles aligned**.

**Common user error:** `program_holder` / `student` signing into **admin** host → Access Denied (correct). Use **www** login with `?redirect=/portal/barber` or `/program-holder/dashboard`.

---

## 4. Dead / legacy / duplicate code

### Confirmed dead (deleted or zero importers)

Per `dead_code_candidates.md` / `docs/DEAD_CODE_AUDIT.md`:

- ✅ `lib/rateLimiter.ts`, `lib/api/rate-limiter.ts`, root `lib/safe-error.ts` — deleted
- ✅ 10 root `lib/supabase*.ts` shims — deleted (use `lib/supabase/*`)

### Active legacy — do not extend

| System | Legacy | Canonical |
|--------|--------|-----------|
| **HVAC lessons** | 32× `lib/courses/hvac-*.ts`, `app/courses/hvac/*` | `curriculum_lessons` + blueprint engine |
| **Course writes** | `lib/db/courses.ts` → `training_courses` | `courses` + `course_lessons` |
| **Lesson reads** | Direct `training_lessons` | `lms_lessons` view |
| **Enrollments** | `enrollments` view | `program_enrollments` |
| **Rate limit** | `lib/rateLimit.ts` if any remain | `lib/rate-limit.ts` + `applyRateLimit` |
| **Auth** | Inline `getUser()` + role check (~265 files) | `apiAuthGuard` / `requireUser()` (debt) |

### Duplicate parallel systems (intentional — do not merge)

| Domain | Model A | Model B |
|--------|---------|---------|
| **Quizzes** | `quizzes` + `quiz_attempts` | `course_lessons.quiz_questions` JSONB |
| **Courses** | `courses` / `course_modules` | `training_courses` (legacy reads) |
| **Progress** | `lesson_progress` | `lms_progress` (summary) + `progress_entries` (OJT) |

### Duplicate components (23 groups)

From `reports/canonicalization/duplicate-component-map.json`:

- 25× identical `loading.tsx` shells (acceptable)
- 6× admin `error.tsx` / `loading.tsx` twins
- 6× FSSA impact stub pages (likely partial feature)

---

## 5. Orphaned & partial pages

**Totals** (`reports/canonicalization/summary.json`):

- 1,326 routes
- **205** orphan route candidates
- **180** `REVIEW_NEEDED` (zero/one inbound link)
- **16** `KEEP_STUB` (intentional shells)
- **8** `KEEP` (team bios, etc.)

**Sample `REVIEW_NEEDED` admin shells** (wrapped UI, weak wiring):

- `/admin/advanced-tools`, `/admin/compliance/agreements`, `/admin/documents/print`
- `/admin/ferpa/*`, `/admin/fssa-impact/*` (several zero-ref pages)
- `/admin/billing/feature-flags`, `/admin/governance/data`

**Action:** For each — confirm nav entry + API backing, or delete page and add redirect.

---

## 6. Wrapped but not fully wired

### Admin dashboard panels

`node scripts/audit-dashboard-panels.mjs` (unauthenticated probe):

| Panel | API | Status |
|-------|-----|--------|
| PublishWebsitePanel | `/api/admin/publish-website` | 301 without session (OK) |
| ProgramIntegrityPanel | `/api/admin/program-integrity` | 301 (OK) |
| JobBoardPanel | `/api/jobs/government-feed` | Must exist on **admin host** |
| LizzyContainer | `/api/admin/devstudio/config` | Wired — needs super_admin session |
| LizzyWorkspace | `/api/devstudio/health` | Wired |

**Lizzy / Dev Studio container:** UI shell + preview iframe **complete**. Remote dev container requires Northflank secrets + `platform_secrets` — not a missing component, missing **runtime credentials**.

### Store / 14-day trial

| Piece | Status |
|-------|--------|
| `/store/licenses`, `/launch`, per-app `/apps/*/start-trial` | Pages exist |
| `lib/workspace/start-workspace-trial.ts` | Write path implemented |
| Migration `20260702000015_individual_app_subscriptions.sql` | **Manual apply required** if trials fail in DB |
| `/store/trial` → `/launch` | Alias redirect |

**Store “phases”:** Catalog + licensing live; redirect manifest still lists **phase-2** legacy store URLs (`docs/audits/redirect-manifest-proposed-2026-05-14.csv`).

### Beauty apprenticeships

| Program | Enroll path | Portal |
|---------|-------------|--------|
| Barber | `/programs/barber-apprenticeship/apply` | `/portal/barber` |
| Cosmetology | `/programs/cosmetology-apprenticeship/apply` | `/portal/cosmetology` |
| Nail tech | `/programs/nail-technician-apprenticeship/apply` | `/portal/nail-technician` |
| Esthetician | `/programs/esthetician-apprenticeship/apply` | `/portal/esthetician` |
| Host shop | Partner/cosmetology host-shop APIs + `program_holder` | `/program-holder/dashboard` |

---

## 7. Auth & API gaps

`bash scripts/audit-auth-gaps.sh` (2026-06-07):

| Class | Count | Examples |
|-------|-------|----------|
| `NO_AUTH` | 5 | `ai/generate-site`, `ai/import-site`, `checkout/create-session`, `enrollments/checkout`, `ping` |
| `ROLE_BLIND` admin | 0 | — |
| `LEAKS_ERROR` | 0 | — |
| Re-export routes | 4 | competency + cosmetology partner aliases — verify target auth |

**Note:** Checkout/ping routes may be **intentionally public** — add `// PUBLIC ROUTE:` comments.

---

## 8. Schema & migrations

### Code vs migrations (`audit-schema-refs.sh`)

Tables referenced ≥5× with **no migration file**:

- `workflow_dead_letters`
- `digital_binders`
- `cron_job_runs`
- `compliance_violations`

**Action:** Verify live in Supabase; add migrations if missing.
| Table | Migration file | Status |
|-------|----------------|--------|
| `workflow_dead_letters` | `20260705000002_workflow_observability_tables.sql` | ✅ In repo |
| `cron_job_runs` | `20260705000001_cron_job_runs.sql` | ✅ In repo |
| `digital_binders` | `20260710000003_digital_binders_compliance_violations.sql` | ⚠️ Apply in Supabase |
| `compliance_violations` | `20260710000003_digital_binders_compliance_violations.sql` | ⚠️ Apply in Supabase |

**Note:** `audit-schema-refs.sh` is case-insensitive on `CREATE TABLE` (lowercase `create table` in SQL files counts).

**Action:** Run `node scripts/db/runMigrations.js` or paste migrations in Supabase SQL Editor.

### Pending manual migrations (AGENTS.md)

- `20260702000009` – two_factor_auth normalize
- `20260702000010` – onboarding_progress unique
- `20260702000011` – storage buckets
- `20260702000012` – external_courses support fee
- `20260702000015` – individual app subscriptions (trials)

---

## 9. Assets (favicon, OG, heroes)

Post-#331:

- ✅ `public/favicon.ico`, `public/images/og-image.jpg`, `public/icon-192x192.png` added
- ✅ `hero-banners.json` — 187 entries, all video (`audit-hero-banner-coverage.mjs`)
- ⚠️ 331 marketing pages still use non-canonical hero markup (`VISUAL_LAYOUT_AUDIT.md`)
- ⚠️ `scripts/export-hero-banners.ts` referenced in docs but **file missing** (doc drift only)

---

## 10. Prioritized remediation

### P0 — User-facing breaks

1. Add `/partners/portal` → `/partner/dashboard` redirect
2. Keep admin deploy SHA in sync with `main` (trigger-deployment after build)
3. Apply pending Supabase migrations (#15 for store trials)

### P1 — Login & governance

4. Delete or redirect **180 `REVIEW_NEEDED`** orphan admin routes (batch by module)
5. Consolidate `config/dashboard-routes.ts` → `role-destinations.ts` (remove duplicate)
6. Move 26 `proxy.ts` admin redirects → `next.config.mjs`

### P2 — Legacy debt

7. Migrate `training_courses` writes in `lib/db/courses.ts` → `courses`
8. Incrementally replace `training_*` reads with `lms_*` views
9. Register or delete unregistered blueprints (`hvac-epa-608.ts`, `prs.ts`)

### P3 — Cleanup

10. HVAC legacy files — read-only archive; no new code
11. Auth pattern migration (265 inline checks) — bounded batches only
12. Stub audit noise — tune `audit-stubs.ts` to ignore template files
1. ~~Add `/partners/portal` → `/partner/dashboard` redirect~~ ✅ Done (`next.config.mjs`)
2. Keep LMS + admin deploy SHA in sync with `main` (trigger `deploy-lms.yml` / `deploy-admin.yml` after each merge)
3. Apply pending Supabase migrations (#15 for store trials)
4. ~~Student enrollment state mismatch~~ ✅ Done in PR #351 (`enrollment-flow.ts`)

### P1 — Login & governance

5. Delete or redirect **180 `REVIEW_NEEDED`** orphan admin routes (batch by module)
6. ~~Consolidate `config/dashboard-routes.ts` → `role-destinations.ts`~~ ✅ Wrapper only; remove file when last importers migrate
7. Move 26 `proxy.ts` admin redirects → `next.config.mjs`
8. Mark intentional public APIs with `// PUBLIC ROUTE:` (`ping`, checkout forwards — `generate-site` / `import-site` use `requireFeatureForAuth`)

### P2 — Legacy debt

9. Migrate `training_courses` writes in `lib/db/courses.ts` → `courses`
10. Incrementally replace `training_*` reads with `lms_*` views (~90 refs)
11. Register or delete unregistered blueprints (`hvac-epa-608.ts`, `prs.ts`)
12. HVAC: 32× `lib/courses/hvac-*.ts` — read-only archive; no new per-program hardcoding

### P3 — Cleanup

13. Auth pattern migration (265 inline checks) — bounded batches only
14. Stub audit noise — tune `audit-stubs.ts` to ignore template files
15. Re-run `node scripts/audit-orphan-categorization.mjs` quarterly; target 180 `REVIEW_NEEDED` admin shells in batches

---

## Audit commands (re-run anytime)

```bash
node scripts/check-redirect-conflicts.mjs
node scripts/audit-portal-roles.mjs
bash scripts/audit-auth-gaps.sh
bash scripts/audit-schema-refs.sh
bash scripts/audit-env-vars.sh
node scripts/audit-middleware-consistency.mjs
node scripts/audit-route-canonicalization.mjs   # → reports/canonicalization/
node scripts/audit-orphan-categorization.mjs
bash scripts/full-platform-test.sh
pnpm tsx scripts/northflank/inspect-services.ts
pnpm tsx scripts/audit-admin-dashboard-load.mjs
```

**Reports generated this run:** `reports/canonicalization/*.json`, `stub-audit-report.json`

---

*Generated by Cloud Agent system integrity pass — 2026-06-07.*
## 11. Latest verification run (2026-06-08)

| Check | Result |
|-------|--------|
| `check-redirect-conflicts.mjs` | ✅ 324 sources, 0 conflicts |
| `full-platform-test.sh` (production `www`) | ✅ **61/61** (includes `/partners/portal` → 308) |
| `audit-portal-roles.mjs` | ✅ 0 role mismatches |
| `audit-schema-refs.sh` | ✅ 0 gaps after case-fix + `20260710000003` |

---

*Last updated: 2026-06-08 (post-#351, production smoke 61/61). Original pass: 2026-06-07.*
