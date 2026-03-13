# AGENTS-IMPROVEMENT-SPEC.md

Codebase audit findings. Issues are ranked by severity: **P0** (breaks production), **P1** (security/data risk), **P2** (functional bug), **P3** (structural debt), **P4** (AGENTS.md accuracy).

---

## AGENTS.md Assessment

### What's Good
- Tech stack, commands, and key directories are accurate.
- Brand color convention is well-documented and enforced.
- Image replacement mapping is complete and usable.
- Document generation pattern (docx + SendGrid) is fully specified.
- Completed task history gives agents useful context.

### What's Wrong / Missing
1. **La Plaza table contradiction** — table says "12 weeks" but "Key decisions made" section says "Program length set to 10 weeks." One of these is wrong.
2. **"Access your dashboard" listed twice** — appears in both COMPLETED (line 73) and FUTURE TASKS (line 94). Should be removed from FUTURE TASKS.
3. **`ROUTES.schedule` bug not documented** — `ROUTES.schedule = '/demo'` in `lib/pricing.ts` but `/schedule` is a real Calendly page. All license pages link to `/demo` when they should link to `/schedule`. This is a live routing bug that should be in Known Fixed Issues (or fixed).
4. **No middleware.ts documented** — there is no root `middleware.ts`. Auth protection relies entirely on per-page `redirect()` calls. This is a significant architectural gap not mentioned anywhere.
5. **Deprecated file inventory missing** — 30+ files still import from deprecated Supabase shims (`@/lib/supabaseServer`, `@/lib/supabase-server`, `@/lib/supabaseClients`, `@/lib/supabase-admin`). Not tracked.
6. **Rate limiter proliferation not documented** — 5 separate rate limit implementations exist. Agents don't know which to use.
7. **Auth mechanism fragmentation not documented** — 8 different auth patterns in use across API routes (`getUser`, `withAuth`, `apiAuthGuard`, `apiRequireAdmin`, `requireApiAuth`, `env_gate`, `api_key_check`, `webhook_sig`). No guidance on which to use for new routes.
8. **94 unauthenticated routes that write data** — not tracked in AGENTS.md. AUDIT_ROUTES.csv documents this but AGENTS.md doesn't reference it.
9. **`/api/checkout/student` deprecated but not removed** — marked `@deprecated` in code, not tracked for removal.
10. **31 root-level `.md` files** — AGENTS.md doesn't acknowledge these exist. Agents may create duplicate docs.

---

## P0 — Production Bugs

### P0-1: `ROUTES.schedule` points to `/demo` instead of `/schedule`
**File:** `lib/pricing.ts:311`
```
schedule: '/demo',   // BUG: should be '/schedule'
```
**Impact:** Every "Schedule a Demo" CTA on license pages (`/license`, `/license/features`, `/license/integrations`, `/license/pricing`) sends visitors to the demo landing page, not the Calendly booking page at `/schedule`. Lost conversions.

**Fix:** Change `schedule: '/demo'` → `schedule: '/schedule'` in `lib/pricing.ts`.

---

### P0-2: `store/licenses/checkout` and `store/licensing/checkout` are near-duplicate routes
**Files:** `app/store/licenses/checkout/[slug]/page.tsx` and `app/store/licensing/checkout/[slug]/page.tsx`

Both serve checkout for the same products. `store/licensing` has BNPL support and better terms copy; `store/licenses` does not. They return to different success URLs. A user landing on either route gets a different experience.

**Fix:** Redirect `store/licenses/checkout/[slug]` → `store/licensing/checkout/[slug]`. Remove `store/licenses/checkout` after confirming no inbound links.

---

## P1 — Security / Data Risk

### P1-1: 94 unauthenticated API routes write data
**Source:** `AUDIT_ROUTES.csv` — `$4=="no" && $8=="yes"`

Critical examples:
- `GET|POST /api/enrollments` — creates enrollments with no auth
- `GET|POST /api/certificates` — issues certificates with no auth
- `GET|POST /api/assignments` — writes assignments with no auth
- `GET|POST /api/achievements` — awards achievements with no auth
- `GET|POST /api/progress` — writes progress records with no auth
- `GET /api/affirm/capture` — captures Affirm payments with no auth
- `GET /api/store/download/:` — serves paid downloads with no auth
- `GET /api/autopilot-test-users` — creates test users with no auth

**Fix:** Each route needs `requireAuth()` or `apiAuthGuard()` before any write. Prioritize payment and certificate routes first.

### P1-2: 30 app files import from deprecated Supabase shims
**Pattern:** `from '@/lib/supabaseServer'`, `from '@/lib/supabase-server'`, `from '@/lib/supabaseClients'`, `from '@/lib/supabase-admin'`

These shims have inconsistent behavior — some throw on missing env vars, some silently return null, some use the wrong key (anon vs service role). Using the wrong one in a write path is a privilege escalation risk.

**Affected files (sample):**
- `app/api/studio/*` (10 files) — all import `supabaseServer` from `@/lib/supabase-server`
- `app/api/admin/export/enrollments/route.ts` — imports `supabaseAdmin` from `@/lib/supabaseClients`
- `app/api/supersonic-fast-cash/jotform-webhook/route.ts` — imports from `@/lib/supabaseServer`

**Fix:** Migrate all 30 to `@/lib/supabase/server` (server components) or `@/lib/supabase/admin` (service role). Then delete the shim files.

### P1-3: No root middleware.ts — auth is per-page only
There is no `middleware.ts` at the project root. All auth protection is done via `redirect()` inside individual page components. This means:
- A route with a missing auth check is silently unprotected
- API routes have no consistent auth layer
- Auth redirect param is inconsistent: 211 pages use `?redirect=`, 76 use `?next=` — the login page likely only handles one of these

**Fix (short-term):** Document which param the login page reads and standardize all redirects to use it.
**Fix (long-term):** Add `middleware.ts` with Supabase session refresh and route protection for `/admin/*`, `/lms/*`, `/learner/*`, `/student-portal/*`, `/program-holder/*`.

---

## P2 — Functional Bugs

### P2-1: `api/auth/login` and `api/auth/signin` are duplicate endpoints with different implementations
**Files:** `app/api/auth/login/route.ts`, `app/api/auth/signin/route.ts`

Both authenticate with email/password via Supabase. They use different rate limit libraries (`rateLimit` from `@/lib/rateLimit` vs `withRateLimit` from `@/lib/api/with-rate-limit`), different validation (manual vs `signInSchema` zod), and different error shapes. Client code calling either gets different behavior.

**Fix:** Deprecate `api/auth/login`, redirect it to `api/auth/signin`. Remove after confirming no callers.

### P2-2: `api/checkout/student` is deprecated but still receives traffic
**File:** `app/api/checkout/student/route.ts`

Marked `@deprecated` with a comment saying "Use /api/checkout/learner instead." It proxies to the canonical endpoint via `fetch()` — adding latency and a failure point. The deprecation comment says "Will be removed in a future release" but no tracking exists.

**Fix:** Find all callers of `/api/checkout/student`, update them to `/api/checkout/learner`, then delete the file.

### P2-3: Inconsistent auth redirect parameter (`?redirect=` vs `?next=`)
211 pages append `?redirect=<path>` on auth redirect. 76 pages use `?next=<path>`. The login page at `app/login/page.tsx` needs to be checked — if it only reads one param, half of all post-login redirects silently fail and users land on the default dashboard instead of their intended destination.

**Fix:** Audit `app/login/LoginForm.tsx` to confirm which param it reads. Standardize all redirect calls to use that param.

### P2-4: `admin-login` page does role check client-side only
**File:** `app/admin-login/page.tsx`

Role check (`adminRoles.includes(profile.role)`) happens in the browser after Supabase auth succeeds. A valid user with a non-admin role can authenticate, then the client shows an error — but the session is already established. The user is authenticated, just not redirected to `/admin/dashboard`.

**Fix:** Move role verification to a server action or API route. Invalidate the session if the role check fails.

---

## P3 — Structural Debt

### P3-1: Five rate limit implementations
| File | Type | Notes |
|------|------|-------|
| `lib/rate-limit.ts` | Upstash Redis | **Canonical — use this** |
| `lib/rateLimit.ts` | In-memory | Marked `@deprecated`, broken in serverless |
| `lib/rateLimiter.ts` | `redis` npm package | Different Redis client, separate config |
| `lib/api/with-rate-limit.ts` | Wrapper around `lib/rate-limit.ts` | OK to use |
| `lib/api/withRateLimit.ts` | Tier-based wrapper | OK to use |

**Fix:** Delete `lib/rateLimit.ts` (deprecated, broken in serverless) and `lib/rateLimiter.ts` (uses different Redis client). Migrate any callers to `lib/rate-limit.ts` or `lib/api/withRateLimit.ts`.

### P3-2: Three logger implementations
| File | Notes |
|------|-------|
| `lib/logger.ts` | **Canonical — use this** |
| `lib/audit/logger.ts` | Audit-specific, may be intentional |
| `lib/logging/logger.ts` | Unknown purpose |

**Fix:** Check if `lib/logging/logger.ts` is used anywhere. If not, delete it. Document in AGENTS.md that `lib/logger.ts` is canonical.

### P3-3: Seventeen Supabase client files (8 deprecated)
Canonical: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`

Deprecated (all have `@deprecated` JSDoc):
- `lib/supabase.ts`
- `lib/supabaseClient.ts`
- `lib/supabaseClients.ts`
- `lib/supabase-server.ts`
- `lib/supabaseServer.ts`
- `lib/supabase-admin.ts`
- `lib/supabaseAdmin.ts`
- `lib/getSupabaseServerClient.ts`
- `lib/supabase-lazy.ts`
- `lib/supabase-api.ts`

**Fix:** After migrating the 30 active importers (P1-2), delete all deprecated shims.

### P3-4: Route namespace fragmentation — employer, partner, student
The following route groups serve overlapping audiences with no clear canonical path:

**Employer:**
- `/employer` — authenticated portal (dashboard, analytics, candidates)
- `/employer-portal` — separate portal with different nav
- `/employers` — public marketing page
- `/for-employers` — another public marketing page

**Partner:**
- `/partner` — authenticated portal
- `/partner-portal` — separate portal
- `/partners` — public directory
- `/partnerships` — single marketing page

**Student/Learner:**
- `/learner` — redirects to `/learner/dashboard`
- `/learner/dashboard` — actual dashboard
- `/student` — separate section (chat, handbook)
- `/student-portal` — full portal with assignments, grades, schedule
- `/student-portal/dashboard` — redirects to `/lms/dashboard`

There is no documented canonical portal per role. Agents adding new pages don't know which namespace to use.

**Fix:** Document the canonical portal per role in AGENTS.md. Mark non-canonical paths as legacy/redirect-only.

### P3-5: `store/licenses` and `store/licensing` serve the same purpose
- `/store/licensing` — has `page.tsx`, full checkout, BNPL support (canonical)
- `/store/licenses` — no `page.tsx`, checkout only, missing BNPL

**Fix:** Add a redirect from `/store/licenses` → `/store/licensing`. Consolidate checkout to `store/licensing/checkout`.

### P3-6: Eight auth helper files with no documented canonical
`lib/auth.ts`, `lib/auth-server.ts`, `lib/auth-guard.ts`, `lib/authGuards.ts`, `lib/authAdapter.ts`, `lib/new-ecosystem-services/auth.ts`, `lib/admin/guards.ts`, `lib/auth/lms-routes.ts`

133 API routes import from `@/lib/auth`. No AGENTS.md guidance on which file to use for new routes.

**Fix:** Document in AGENTS.md: use `lib/auth.ts` for server components, `lib/admin/guards.ts` for admin routes, `lib/auth/lms-routes.ts` for LMS role checks.

### P3-7: Inconsistent API error response shape
Routes return errors as `{ error: "..." }`, `{ message: "..." }`, or both. Client code that checks `response.error` will miss errors returned as `response.message`.

**Fix:** Standardize all API error responses to `{ error: string, code?: string }`. Document this in AGENTS.md.

### P3-8: 31 root-level markdown files with no index
Files like `AUDIT_REPORT.md`, `AUDIT_REPORT_111_PAGES.md`, `BROKEN_FEATURES_FIX.md`, `AUTOPILOT_STATUS.md`, `ACTIVATION_FORENSIC_REPORT.md`, `DEPLOY_TRIGGER.md` etc. accumulate without cleanup. Agents may create more.

**Fix:** Move historical audit files to `docs/archive/`. Keep only `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `DEPLOY.md`, `SUPPORT.md` at root.

---

## P4 — AGENTS.md Corrections Needed

| Line | Issue | Fix |
|------|-------|-----|
| 175 | La Plaza table says "12 weeks" | Confirm correct duration and update to single value |
| 185 | "Program length set to 10 weeks" | Contradicts table above — reconcile |
| 73 | "Access your dashboard" listed as completed | Remove from FUTURE TASKS (line 94) |
| — | No mention of `ROUTES.schedule` bug | Add to Known Issues or fix in code |
| — | No canonical portal map per role | Add "Canonical Portals by Role" section |
| — | No auth pattern guidance for new API routes | Add "API Auth Pattern" section |
| — | No rate limiter guidance | Add "Rate Limiting" section pointing to canonical files |
| — | No mention of 31 root `.md` files | Add note: don't create new root-level `.md` files |
| — | Build state says "882/882 pages" | Verify this is still current after recent changes |

---

## Recommended AGENTS.md Additions

### Canonical Portals by Role
```
/learner/dashboard     — enrolled learners (canonical)
/student-portal        — legacy, being consolidated into /learner
/admin/dashboard       — admin/super_admin
/instructor/dashboard  — instructors
/employer/dashboard    — employers (canonical)
/employer-portal       — legacy
/partner/dashboard     — partners (canonical)
/program-holder/dashboard — program holders
/staff-portal/dashboard   — staff
/mentor/dashboard      — mentors
```

### API Auth Pattern (for new routes)
```ts
// Standard authenticated route
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin-only route
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

### Rate Limiting (for new routes)
```ts
// Use applyRateLimit from lib/api/withRateLimit.ts
import { applyRateLimit } from '@/lib/api/withRateLimit';
const rateLimited = await applyRateLimit(request, 'api'); // tiers: strict|contact|api|auth|payment|public
if (rateLimited) return rateLimited;
```

### API Error Response Shape
All API routes must return errors as:
```ts
NextResponse.json({ error: 'Human-readable message' }, { status: 4xx|5xx })
// Never: { message: '...' } for errors
// Never: { error: error.message } — leaks internal details
```

---

## Summary Counts

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 2 | Production routing bugs |
| P1 | 3 | Security/data risks |
| P2 | 4 | Functional bugs |
| P3 | 8 | Structural debt |
| P4 | 9 | AGENTS.md inaccuracies |

**Highest-priority actions:**
1. Fix `ROUTES.schedule` → `/schedule` (P0-1, 1 line change)
2. Add auth to the 94 unauthenticated write routes (P1-1, ongoing)
3. Migrate 30 deprecated Supabase imports (P1-2, then delete shims)
4. Standardize auth redirect param (P2-3, audit login form first)
5. Update AGENTS.md with canonical portal map and auth/rate-limit patterns (P4)
