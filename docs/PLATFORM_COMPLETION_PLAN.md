# Platform Completion Plan — 100% Remediation

**Policy:** No file deletion until `pnpm audit:routes` + `pnpm audit:program-routes` + orphan categorization pass for that path.  
**Generated:** 2026-06-06  
**Branch tracking:** `cursor/fix-root-cause-no-wrappers-c4c6` (PR #302)

---

## Container systems — merge or separate?

**Do not merge into one file or one runtime.** They are three layers of one **Platform Control Plane**:

| Layer | Artifact | Purpose | Consolidation action |
|-------|----------|---------|----------------------|
| **Dev runtime** | `.devcontainer/devcontainer.json` | VS Code/Codespaces Docker spec (required by Microsoft spec) | Keep file; add `x-elevate` metadata block |
| **AI charter** | `lib/devstudio/devint-container.ts` | Prompt governance for Dev Studio chat/execute | Rename → `ai-studio-charter.ts`; link from devcontainer metadata |
| **Ops control plane** | `DevContainerPanel` + `/api/devstudio/devcontainer` + `/api/devstudio/container-env` | Edit devcontainer via GitHub; push secrets to Northflank | Single admin module index; ECS via Northflank deploy (not inline ECS editor) |

**Target architecture (Phase 2):** `lib/devstudio/platform-control-plane/` exports `getDevcontainerSpec()`, `getAiCharterContext()`, `pushRuntimeSecret()` — one mental model, three implementations.

---

## Phase 0 — Audit gate (no deletions)

| ID | Finding | Action | Verify |
|----|---------|--------|--------|
| 0.1 | `audit-program-routes.mjs` ignores `[program]` dynamic route → 31 false MISSING | Fix audit to resolve static slugs + registry + redirects | `pnpm audit:program-routes` exits 0 |
| 0.2 | Audit still reads deleted `content/cf-programs.ts` | Switch to `data/programs/index.ts` | Same |
| 0.3 | `audit-program-routes --fix` adds bad `/programs` dumps | Remove or fix to canonical slug via `resolveSlug()` | Review diff |
| 0.4 | Route canonicalization reports stale | Re-run `node scripts/audit-route-canonicalization.mjs` each phase | `reports/canonicalization/summary.json` |
| 0.5 | 204 orphan route candidates (180 REVIEW_NEEDED) | Categorize each before removal | `orphan-categories.json` |
| 0.6 | Deletion gate script missing | Add `scripts/audit-deletion-safety.mjs` | Blocks delete if route/refs remain |

---

## Phase 1 — Program rendering & catalog (PR #302)

| ID | Finding | Status | Verify |
|----|---------|--------|--------|
| 1.1 | Triple render path (`ProgramPage`, cf-programs, static) | **Done** in #302 | `tests/unit/build-program-schema.test.ts` |
| 1.2 | Bad program → `/programs` redirects | **Done** in #302 | `tests/unit/canonical-program-redirects.test.ts` |
| 1.3 | Homepage count SSOT | **Done** in #302 | `tests/unit/public-programs-ssr.test.ts` |
| 1.4 | Thin `app/programs/*/page.tsx` wrappers removed | **Done** in #302 | program-marketing-page test |
| 1.5 | Registry-only programs synthesized schema only | **Partial** — needs full `data/programs/*.ts` | Manual page review |
| 1.6 | **Merge PR #302 + deploy Northflank** | **Pending** | Live bookkeeping/CDL/counts |
| 1.7 | `audit-program-routes` 31 MISSING after wrapper removal | **Open** — fix audit + any real gaps | Phase 0.1 |

---

## Phase 2 — Platform Control Plane consolidation

| ID | Finding | Action | Verify |
|----|---------|--------|--------|
| 2.1 | Confusing names: DevInt vs Dev Container vs Container tab | Rename + docs in AGENTS.md | No broken imports |
| 2.2 | `ELEVATE_DEVINT_CONTAINER` env flag unused | Wire or rename to `ELEVATE_DEVCONTAINER` | devcontainer.json |
| 2.3 | Charter not discoverable from Container tab UI | Link charter section in DevContainerPanel | UI smoke |
| 2.4 | `platform_secrets` / `app_secrets` / `process.env` precedence undocumented in UI | Surface precedence in Container tab | AGENTS.md + UI |
| 2.5 | Northflank push without rebuild visibility | Show northflank-status after env push | smoke-test route |

---

## Phase 3 — Redirect graph & shadowed pages

Source: `docs/DEAD_CODE_AUDIT.md` (2025-06) — re-verify live.

| ID | Finding | Count | Action |
|----|---------|-------|--------|
| 3.1 | Self-referential redirect `/admin/courses/create` | 1 | Remove no-op redirect |
| 3.2 | Redirect chains (2+ hops) | 17 | Point source → final destination |
| 3.3 | Redirects to non-existent destinations | 20 | Fix destinations in `next.config.mjs` / `canonical-routes.json` |
| 3.4 | Shadowed pages (redirect before page renders) | 75 | Per-route audit: delete page OR remove redirect |
| 3.5 | `/programs/business-administration` → `/programs/business` but slug is `business` in data | 1 | Align redirect to `/programs/business-administration` or rename slug |

---

## Phase 4 — Auth, API, errors

Source: `scripts/audit-auth-gaps.sh` (2026-03 baseline).

| ID | Finding | Count | Action |
|----|---------|-------|--------|
| 4.1 | Routes with no auth check | 62 | Batch migrate to `apiAuthGuard` |
| 4.2 | Admin routes identity-only (no role) | 13 | `apiRequireAdmin` |
| 4.3 | Routes leaking `error.message` | 33 | `safeError` / `safeInternalError` |
| 4.4 | Legacy auth patterns (265 inline checks) | 265 | Bounded portal migration — **no mass refactor** |

---

## Phase 5 — Config & template leaks

| ID | Finding | Status | Action |
|----|---------|--------|--------|
| 5.1 | `PLATFORM_DEFAULTS` single-quote leaks in lib/ | **Done** PR #302 + ESLint rule | `audit-platform-defaults-leaks.sh` |
| 5.2 | ESLint rule only on changed files in pre-push | Open | Extend or CI full scan |
| 5.3 | `console.log` ~1,521 occurrences | Open | Replace with `lib/logger.ts` in runtime paths |

---

## Phase 6 — Dead code & duplicate components (audit-gated)

**Rule:** Run `node scripts/audit-deletion-safety.mjs <path>` before every delete.

| ID | Candidate | Importers | Action |
|----|-----------|-----------|--------|
| 6.1 | `VisualProgramTemplate.tsx` | 0 app routes | Audit routes → delete if SAFE |
| 6.2 | `UniversalMarketingPage.tsx` | 0 | Same |
| 6.3 | `lib/programs/program-page.tsx` `ProgramMarketingPage` | 0 | Same |
| 6.4 | Duplicate `ProgramPageTemplate` (2 files) | Audit | Consolidate |
| 6.5 | HVAC legacy `lib/courses/hvac-*` (32 files) | Parallel path only | Document; do not delete until HVAC path retired |
| 6.6 | `lib/rateLimiter.ts`, `lib/api/rate-limiter.ts` | 0 | Delete if still absent |
| 6.7 | Supabase shims (10 files) | **Deleted 2026-Q2 per AGENTS.md** | Verify zero imports |
| 6.8 | 22 duplicate component groups | Report | Merge or delete per group |
| 6.9 | ~50 zero-ref root `components/*.tsx` | Per-file audit | Staged removal |
| 6.10 | 13 unused npm packages | `depcheck` | Remove from package.json |

---

## Phase 7 — Rich program content

| ID | Program | Status | Action |
|----|---------|--------|--------|
| 7.1 | `reentry-specialist` | Synthesized schema only | Add `data/programs/reentry-specialist.ts` |
| 7.2 | `dsp-training`, `drug-alcohol-specimen-collector`, etc. | Registry only | Full static schemas |
| 7.3 | `business` vs `business-administration` slug mismatch | Open | Single canonical slug |
| 7.4 | Category hub pages linking dead slugs | `technology/page.tsx`, etc. | Update links to `[program]` slugs |

---

## Phase 8 — Enrollment & duplicates

| ID | Finding | Action |
|----|---------|--------|
| 8.1 | Barber UI: `BarberApprenticeshipClient` vs `ProgramDetailPage` | Unify on `ProgramDetailPage` + `EnrollmentPipeline` |
| 8.2 | Host shop API no duplicate check | Add dedupe in `app/api/enrollments/host-shop/route.ts` |
| 8.3 | DB barber dedupe exists | Wire UI to same rules |

---

## Phase 9 — Database & migrations

| ID | Finding | Action |
|----|---------|--------|
| 9.1 | 748 migration files not auto-applied | Run `pnpm db:migrate` with real `SUPABASE_SERVICE_ROLE_KEY` or GH Actions |
| 9.2 | 4 pending migrations (AGENTS.md list) | Apply in Supabase Dashboard |
| 9.3 | 126 schema gaps (code refs, no CREATE TABLE) | Live DB diff |
| 9.4 | 8 certificate tables no migration source | Verify live |

---

## Phase 10 — Autopilot & CI

| ID | Finding | Action |
|----|---------|--------|
| 10.1 | `pnpm autopilot` → missing `workers/start-autopilot.js` | Restore or remove script from package.json |
| 10.2 | `check-autopilots.mjs` empty `log()` | Fix logging |
| 10.3 | ESLint 36 `exhaustive-deps` warnings fail CI | Fix or baseline |
| 10.4 | Autopilot overloaded (57 shell scripts, edge workers, CI) | Document canonical path in AGENTS.md |

---

## Phase 11 — Accessibility & compliance

| ID | Finding | Action |
|----|---------|--------|
| 11.1 | WCAG 2.1 AA page-by-page failures | Fix as CI surfaces |
| 11.2 | Hero video standard violations | `audit-hero-banners.ts` |
| 11.3 | Page design system (`text-gray-*`, CheckCircle bullets) | `audit-marketing-pages.ts` |

---

## Phase 12 — Deploy & verification

| ID | Step | Command |
|----|------|---------|
| 12.1 | Unit tests | `pnpm test` |
| 12.2 | Typecheck | `pnpm typecheck` |
| 12.3 | Lint | `pnpm lint` |
| 12.4 | Production build | `pnpm build` |
| 12.5 | E2E smoke | `tests/e2e/` subset |
| 12.6 | Merge + Northflank deploy | GitHub + admin Dev Studio |
| 12.7 | Live config leak scan | `tests/e2e/config-leaks.spec.ts` |

---

## Execution order

1. **Phase 0** (audit gate) — must pass before any Phase 6 deletes  
2. **Phase 1** merge/deploy  
3. **Phases 2–3** control plane + redirects  
4. **Phases 4–5** auth + config  
5. **Phase 6** dead code (one file at a time, deletion safety script)  
6. **Phases 7–11** content, enrollment, DB, CI, a11y  
7. **Phase 12** after each merged PR  

---

## Current audit snapshot (2026-06-06)

| Metric | Value |
|--------|-------|
| App routes | 1,315 |
| Orphan candidates | 204 (180 REVIEW_NEEDED) |
| Duplicate component groups | 22 |
| Program route audit issues | 31 (mostly false positives until 0.1 fixed) |
| PLATFORM_DEFAULTS leaks (critical paths) | 0 |
