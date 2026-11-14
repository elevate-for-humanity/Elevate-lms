# Daily Stability Report — 2026-04-19

## Scope executed

- Baseline audits: `scripts/audit-schema-refs.sh`, `scripts/audit-auth-gaps.sh`, `scripts/audit-env-vars.sh`
- Quality gates: `pnpm check:redirects`, `pnpm seo:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`
- Structure/polish checks: `pnpm integrity:links`, `pnpm audit:hero-banners`, `pnpm audit:programs`
- Smoke flow run: `pnpm test:e2e tests/e2e/critical-flows.spec.ts`
- RLS check attempt: `pnpm audit-rls`

Artifacts: `/tmp/stability-2026-04-19/*.log`

---

## Current baseline (pass/fail)

| Check                       | Result  | Notes                                                                                                             |
| --------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| Schema refs audit           | ✅ Pass | 1 gap: `student_practical_progress` (5 refs, not in migrations)                                                   |
| Auth gaps audit             | ⚠️ Fail | 7 routes with no auth check; 1 error leak route                                                                   |
| Env var audit               | ✅ Pass | 0 undocumented env vars                                                                                           |
| Redirect conflict check     | ✅ Pass | No redirect conflicts                                                                                             |
| SEO governance check        | ❌ Fail | 46 errors (missing metadata, blocked-route indexing, whitelist drift)                                             |
| Lint                        | ❌ Fail | 91 errors, 182 warnings                                                                                           |
| Typecheck                   | ❌ Fail | Multiple TS errors + invalid `tsconfig` key (`tsbuildInfoFile`)                                                   |
| Build                       | ❌ Fail | Non-async `await` in `lib/supabaseAdmin.ts`; Google font fetch warning                                            |
| Unit tests (`pnpm test`)    | ❌ Fail | 8 failed tests (course creation contract + top-risk auth-guard assertions)                                        |
| Link integrity              | ❌ Fail | 3 broken links: `/employer/applications`, `/partners/cosmetology-apprenticeship/(onboarding)/sign-mou`, `/logout` |
| Hero banner audit           | ✅ Pass | 38/38 banners pass                                                                                                |
| Program page contract audit | ❌ Fail | 46/49 program pages fail required contract checks                                                                 |
| E2E critical flows          | ❌ Fail | Dev server fails startup due duplicate route paths under barber partner onboarding                                |
| RLS audit script            | ❌ Fail | Script parse error at `scripts/audit-rls.ts:221`                                                                  |

---

## High-severity unresolved items (stability-first)

1. **Build-breaking route collision**
   - Duplicate paths under:
     - `/app/partners/barbershop-apprenticeship/(onboarding)/forms` vs `/app/partners/barbershop-apprenticeship/forms`
     - `/handbook`, `/policy-acknowledgment`, `/sign-mou` duplicates as well
   - Impact: blocks local server startup for smoke/E2E.

2. **Build/type safety broken**
   - `lib/supabaseAdmin.ts` contains `await` in non-async function (build fail).
   - Type errors block production readiness and confidence in route behavior.

3. **Auth and API safety gaps**
   - 7 `NO_AUTH` API routes from `audit-auth-gaps`.
   - `app/api/ai/generate-course/route.ts` still leaks `error.message`/unsafe error shape.

4. **Critical quality gates failing**
   - SEO governance failing with 46 errors.
   - Program page contract failing on 46 pages.
   - Broken links in production-facing paths.

5. **Verification tooling gap**
   - `scripts/audit-rls.ts` cannot execute (syntax error), so daily RLS verification is currently unreliable.

---

## Site structure and navigation signals

- Canonical split still present:
  - `/lms/courses` string references: **406**
  - `/lms/programs` string references: **36**
- `app/sitemap.ts` excludes `/lms` paths and many private prefixes (expected), but SEO governance still flags canonical/indexing drift in public pages.
- Redirect layer has no direct conflicts, but link integrity reports broken internal routes that need route/redirect correction.

---

## Daily prioritized backlog (owners + next actions)

| Priority | Owner              | Action                                                                                                                                   | Target                  |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| P0       | LMS/App Routing    | Remove duplicate partner onboarding page path collisions and keep a single canonical route tree                                          | Next daily cycle        |
| P0       | Platform API       | Fix `lib/supabaseAdmin.ts` async bug and clear current build-blocking TS/build errors                                                    | Next daily cycle        |
| P0       | Security/API       | Patch 7 `NO_AUTH` routes with canonical guards (`apiAuthGuard`/`apiRequireAdmin`/`apiRequireInstructor`) and remove `error.message` leak | Next daily cycle        |
| P1       | SEO/Growth Eng     | Resolve 46 `seo:check` errors (metadata, whitelist, blocked-route indexing)                                                              | 48h                     |
| P1       | Program Pages Team | Fix failing program page contract items (H1, metadata, CTA, hero, canonical, funding block) starting with top-traffic program pages      | 72h                     |
| P1       | Web Platform       | Fix 3 broken internal links or add route-safe redirects                                                                                  | 24h                     |
| P1       | QA                 | Re-run `pnpm test` after P0 fixes; stabilize failing course-creation and auth-guard tests                                                | 48h                     |
| P2       | Data/Security      | Repair `scripts/audit-rls.ts` parse error so daily RLS checks can run                                                                    | 72h                     |
| P2       | Architecture       | Continue programs-vs-courses canonicalization plan via central route helpers (`lib/lms/routes.ts`) and staged redirects                  | Planned migration track |

---

## Next-run command pack

```bash
bash scripts/audit-schema-refs.sh
bash scripts/audit-auth-gaps.sh
bash scripts/audit-env-vars.sh
pnpm check:redirects
pnpm seo:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm integrity:links
pnpm audit:programs
pnpm audit:hero-banners
pnpm test:e2e tests/e2e/critical-flows.spec.ts
pnpm audit-rls
```

---

## Same-day remediation applied (2026-04-19 follow-up)

- Fixed build-blocking syntax error in `/lib/supabaseAdmin.ts` (removed invalid `await` usage in proxy getter).
- Migrated `/app/api/grants/draft/route.ts` to canonical admin client import (`@/lib/supabase/admin`).
- Removed duplicate route sources under `/app/partners/barbershop-apprenticeship/*` that conflicted with `/(onboarding)/...` pages (`forms`, `handbook`, `policy-acknowledgment`, `sign-mou`).
- Result: duplicate-route startup blocker is resolved; remaining build failure in this environment is external font fetch (`fonts.googleapis.com`), and test failures remain pre-existing.
