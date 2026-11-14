# Production Readiness TODO

Actionable checklist derived from `docs/SYSTEM_INTEGRITY_AUDIT_2026-06-07.md`, `docs/platform-hardening-audit-2026-05-31.md`, and AGENTS.md.  
**Last updated:** 2026-06-07 · **Branch tracking:** `cursor/production-readiness-full-c4c6`

### Migration verification (run before recommending SQL)

```bash
node scripts/verify-pending-migrations.mjs
```

If all five checks pass, **do not** re-run migration files — they are already live. Agents must run this script before telling users to paste SQL.

---

## Why audits find issues but do not “fix everything” in one pass

| Reason | What it means for this repo |
|--------|-----------------------------|
| **Scale** | 1,326 routes, 1,186 API handlers, 685 migrations, 516+ DB tables — no single PR can safely touch all surfaces. |
| **Manual DB steps** | Migrations are **not** auto-applied. Code can ship before Supabase SQL is run; trials/store fail until SQL is applied. |
| **Deploy lag** | Admin/LMS run on Northflank. A merged PR is not live until build + CD completes; admin was 194 commits stale before #330. |
| **Intentional debt** | Dual quiz/course systems, HVAC legacy path, 265 inline auth checks — documented as bounded migration, not delete-on-sight. |
| **Product decisions** | 180 orphan admin pages need per-page keep/delete/nav — not safe to bulk-delete without owner review. |
| **Secrets / runtime** | Lizzy dev container, Stripe webhooks, Supabase service role — need live credentials, not just code. |

**Strategy:** Fix P0 user breaks first → verify deploy SHA → batch P1 wiring → schedule P2 legacy → tune P3 cleanup. Re-run audit commands after each batch.

---

## Status legend

- ✅ Done (merged + verified)
- 🔄 In progress (this PR / branch)
- ⏳ Blocked (manual step or product decision)
- 📋 Backlog (code work, scoped batch)

---

## P0 — User-facing breaks (ship first)

| # | Item | Owner | Verify | Status |
|---|------|-------|--------|--------|
| P0-1 | Portal login role routing (`resolvePortalForUser`, proxy gates) | Code | `node scripts/audit-portal-roles.mjs` | ✅ #331 |
| P0-2 | Admin CD disabled — stale pods after build | Infra | `pnpm tsx scripts/northflank/inspect-services.ts` | ✅ #330 |
| P0-3 | Missing favicon / OG / PWA icons | Code | `curl -I https://www.elevateforhumanity.org/favicon.ico` | ✅ #331 |
| P0-4 | Login page missing site header | Code | Visit `/login`, `/login/apprentice` | ✅ #333 |
| P0-5 | `/partners/portal` → `/partner/dashboard` | Code | `bash scripts/full-platform-test.sh` | 🔄 this PR |
| P0-6 | Admin deploy SHA = `main` after every merge | CI | inspect-services admin vs LMS | ⏳ run after merge |
| P0-7 | Apply Supabase migrations 09–12, **15** (store trials) | **Manual SQL** | Trial signup on `/apps/*/start-trial` | ⏳ Dashboard SQL Editor |
| P0-8 | Apprentice rate-limit UX (friendly copy) | Code | `tests/unit/map-auth-error.test.ts` | ✅ #333 |

---

## P1 — Login, nav, governance

| # | Item | Owner | Verify | Status |
|---|------|-------|--------|--------|
| P1-1 | Single post-auth map: `role-destinations.ts` only | Code | grep `dashboard-routes` importers | 🔄 this PR |
| P1-2 | `delegate` → `/learner/dashboard` (not `/my-dashboard`) | Code | portal role audit | 🔄 this PR |
| P1-3 | `navigation-enterprise.ts` uses canonical destinations | Code | unit test / manual | 🔄 this PR |
| P1-4 | Mark `PUBLIC ROUTE` on intentional unauthenticated APIs | Code | `bash scripts/audit-auth-gaps.sh` | 🔄 this PR |
| P1-5 | Move 26 `proxy.ts` admin redirects → `next.config.mjs` | Code | `node scripts/audit-middleware-consistency.mjs` | 📋 batch PR |
| P1-6 | Orphan admin routes (180 `REVIEW_NEEDED`) — wire nav or redirect | Code | `node scripts/audit-orphan-categorization.mjs` | 📋 ~10 routes/PR |
| P1-7 | Admin dashboard degraded-data banner | Code | Dashboard with bad Supabase key | ✅ #333 |
| P1-8 | Portals hub link in header (desktop + mobile) | Code | Header "Portals" → `/portals` | ✅ #333 |
| P1-9 | **Support** top-level dropdown (hub, chat, ticket, help, student-support) | Code | `lib/navigation.ts` + `audit-nav-links.mjs` | 🔄 PR #334 |
| P1-9 | Super-admin admin host vs www login documentation | Docs | AGENTS.md + unauthorized page | ✅ #331 |

---

## P2 — Legacy & data model

| # | Item | Owner | Verify | Status |
|---|------|-------|--------|--------|
| P2-1 | `lib/db/courses.ts` writes → `courses` not `training_courses` | Code | seeder + LMS course load | 📋 |
| P2-2 | Replace `training_*` reads with `lms_*` views (~90 refs) | Code | incremental PRs | 📋 |
| P2-3 | HVAC 32 files — read-only; no new per-program copies | Policy | blueprint-only new programs | ✅ documented |
| P2-4 | Schema tables without migration files (4) | DB + SQL | `bash scripts/audit-schema-refs.sh` | ⏳ verify live |
| P2-5 | Consolidate enrollment write paths (intake/apply/enroll) | Code | E2E enrollment specs | 📋 |
| P2-6 | Marketing hero compliance (331 non-canonical pages) | Code | `audit-hero-banner-coverage.mjs` | 📋 page batches |
| P2-7 | Image contract STRICT (4 pages) | Code | `pnpm images:contract` | 📋 |

---

## P3 — Cleanup & observability

| # | Item | Owner | Verify | Status |
|---|------|-------|--------|--------|
| P3-1 | Auth migration: inline `getUser()` → `apiAuthGuard` / `requireUser` | Code | 265 files, portal batches | 📋 |
| P3-2 | Sentry integration | Infra | `@sentry/nextjs` + DSN | 📋 |
| P3-3 | Tune stub audit noise (1,986 template false positives) | Code | `audit-stubs.ts` ignore patterns | 📋 |
| P3-4 | `routes:check` link noise (2022 refs) | Code | align manifest with App Router | 📋 |
| P3-5 | `console.log` → `lib/logger.ts` | Code | ESLint no-console | 📋 |

---

## Product flows — beauty / store / apprentices

| Flow | Paths | Blocker | Status |
|------|-------|---------|--------|
| Barber apprentice | `/login/apprentice` → `/portal/barber` | Enrollment + progress rows | ✅ scripts verify Elizabeth cohort |
| Cosmetology / nail / esthetician | `/programs/*/apply` → `/portal/*` | Same pattern as barber | 📋 portal QA per trade |
| Host shop enroll | `/partners/barber-host-shop/apply` | `program_holder` role | 📋 |
| Store 14-day trial | `/store/licenses`, `/launch`, `/apps/*/start-trial` | Migration **15** manual apply | ⏳ |
| Lizzy / Dev Studio | Admin dashboard panel | `platform_secrets` + Northflank | ⏳ secrets |

---

## Re-run audits (definition of done for a batch)

```bash
node scripts/check-redirect-conflicts.mjs          # expect 0 conflicts
node scripts/audit-portal-roles.mjs                # expect 0 mismatches
bash scripts/audit-auth-gaps.sh                    # NO_AUTH documented or fixed
bash scripts/full-platform-test.sh                 # expect 61/61 (after P0-5)
pnpm test                                          # unit tests
pnpm lint                                          # ESLint
pnpm tsx scripts/northflank/inspect-services.ts    # SHA parity
```

---

## Completed PRs (reference)

| PR | Focus |
|----|-------|
| #330 | Admin continuous deployment + `trigger-deployment.ts` |
| #331 | Portal login, role gates, favicon/OG, unauthorized UX |
| #332 | System integrity audit doc + partners redirect (partial) |
| #333 | Login header, apprentice hero, rate-limit copy, Portals nav |

---

*This file is the living checklist. Update status columns when items merge or when manual steps complete in Supabase/Northflank.*
