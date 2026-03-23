# AGENTS.md Improvement Spec

Audit date: 2026-05-XX  
Auditor: Ona (automated codebase diff)

Findings are ranked: **P0** (agent will produce broken code), **P1** (security/data risk), **P2** (functional misdirection), **P3** (stale/incomplete), **P4** (missing coverage).

---

## Summary

| Category | Count |
|----------|-------|
| Factual errors (agent will follow wrong instructions) | 5 |
| Stale counts / metrics | 4 |
| Missing canonical systems | 3 |
| Incomplete guard documentation | 2 |
| Debt items resolved but still marked pending | 1 |

---

## P0 — Factual Errors (agent will write wrong code)

### P0-1: Auth guard import path is wrong

**AGENTS.md says:**
```ts
import { apiAuthGuard } from '@/lib/admin/guards';
import { apiRequireAdmin } from '@/lib/admin/guards';
```

**Reality:** `lib/admin/guards.ts` only re-exports these two functions from `@/lib/authGuards`. The canonical source is `lib/authGuards.ts`. There are **174 files** importing from `@/lib/auth` (the root `lib/auth.ts`) and **38 files** importing directly from `@/lib/authGuards`. Both paths work, but the documented path (`@/lib/admin/guards`) is a thin re-export wrapper used only for admin-specific page guards — not the general API guard pattern.

**Fix:** Document both valid import paths and their intended scope:
- `@/lib/authGuards` — API routes (server-side, returns `NextResponse` on failure)
- `@/lib/auth` — Page components (server components, throws redirect on failure)
- `@/lib/admin/guards` — Admin-specific page guards only (re-exports `apiAuthGuard`/`apiRequireAdmin` plus Netlify context helpers)

Also document the undocumented guards that exist and are widely used:
- `requireAdmin()` from `@/lib/auth` — 174 importers, used in page layouts
- `requireInstructor()` / `requireStudent()` from `@/lib/authGuards`
- `apiRequireInstructor()` / `apiRequireStudent()` from `@/lib/authGuards`
- `lib/auth/` directory — 16 specialized helpers (`require-role.ts`, `require-program-holder.ts`, `require-api-role.ts`, etc.)

---

### P0-2: `?next=` param is still in active use — the "use `?redirect=`" rule is not enforced

**AGENTS.md says:** Use `?redirect=<path>` (not `?next=`).

**Reality:** `grep` finds **17 files** still using `?next=` including:
- `app/auth/callback/route.ts` — the OAuth callback itself reads `?next=`
- `app/auth/forgot-password/actions.ts` — password reset flow uses `?next=`
- `lib/enrollment/approve.ts` — enrollment approval email uses `?next=`
- Multiple LMS settings pages

The auth callback at `app/auth/callback/route.ts` explicitly checks `searchParams.has('next')`. This means `?next=` is **not** deprecated — it is the param the OAuth/email-confirm flow uses. `?redirect=` is used for pre-auth page redirects.

**Fix:** Clarify the two-param system:
- `?redirect=` — used by the login page to return the user after password auth
- `?next=` — used by Supabase OAuth callback and email-confirm flows
- Do not conflate them. Do not migrate `?next=` out of the auth callback.

---

### P0-3: Deprecated Supabase shim importer count is wrong

**AGENTS.md says:** "deprecated shims still have 78 active importers"

**Reality:** `grep` finds **79 active importers**. The count is close but the more important gap is that AGENTS.md tells agents not to add new imports but gives no instruction for what to do when editing a file that already uses a deprecated shim.

**Fix:** Add a rule: "If you edit a file that imports from a deprecated shim, migrate that import to `@/lib/supabase/*` as part of your change."

---

### P0-4: `lib/rateLimit.ts` is marked "all importers migrated" but the file still exists on disk

**AGENTS.md says:** "`lib/rateLimit.ts` — in-memory, broken in serverless, `@deprecated`. All importers migrated."

**Reality:** `lib/rateLimit.ts` still exists on disk. Zero active importers is correct, but the file was not deleted. An agent could accidentally import it.

**Fix:** Either delete the file or change the note to "zero importers — safe to delete."

---

### P0-5: `apiRequireAdmin` code example passes `request` as an argument — the function takes no arguments

**AGENTS.md shows:**
```ts
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

**Reality:** `apiRequireAdmin()` in `lib/authGuards.ts` takes **no arguments**. It calls `apiAuthGuard()` internally and returns either a `NextResponse` (on failure) or the auth result object (on success). The `request` argument is silently ignored. The correct usage is:

```ts
const auth = await apiRequireAdmin();
// auth is NextResponse on failure, or { authorized, user, profile, role } on success
if (auth instanceof NextResponse) return auth;
```

Or check the authorized flag:
```ts
const auth = await apiRequireAdmin();
if (!auth.authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

**Fix:** Update the code example to match the actual function signature.

---

## P1 — Security / Data Risk

### P1-1: `lib/auth/` directory is entirely undocumented

`lib/auth/` contains 16 files used in **246 files** across the codebase:

| File | Purpose |
|------|---------|
| `require-role.ts` | Generic role guard for page components |
| `require-program-holder.ts` | Program holder scope guard |
| `require-admin.ts` | Admin page guard |
| `require-api-role.ts` | API role guard |
| `require-org-admin.ts` | Org admin scope guard |
| `org-guard.ts` | Org-level access control |
| `validate-redirect.ts` | Redirect URL validation (security-critical) |
| `two-factor.ts` | 2FA helpers |
| `sso-config.ts` | SSO configuration |
| `role-destinations.ts` | Role → dashboard path mapping |

An agent writing a new page or API route has no guidance on which of these to use. This leads to inconsistent auth patterns and potential gaps.

**Fix:** Add a `lib/auth/` section to AGENTS.md documenting the directory and its key exports, with usage guidance per context (page vs API, role vs scope).

---

### P1-2: No guidance on `createAdminClient` vs `createClient`

`createAdminClient` bypasses RLS. Using it where `createClient` is correct is a security bug. The distinction is not documented anywhere in AGENTS.md.

**Fix:** Add a rule:

> Use `createAdminClient` only in server-side operations that intentionally bypass RLS (provisioning, cron jobs, admin dashboards reading cross-tenant data). Use `createClient` for all user-scoped operations — it respects RLS and is the safe default.

---

### P1-3: No guidance on `requireAdmin` (page-level) vs `apiRequireAdmin` (API-level)

The distinction between page-level guards (throw redirect) and API-level guards (return `NextResponse`) is critical. Using a page guard in an API route will throw an unhandled redirect; using an API guard in a page component will return a response object instead of redirecting.

**Fix:** Add an explicit table:

| Context | Function | Import | On failure |
|---------|----------|--------|-----------|
| Server component / page | `requireAdmin()` | `@/lib/auth` | Throws redirect to `/login` |
| API route handler | `apiRequireAdmin()` | `@/lib/authGuards` | Returns `NextResponse` 401/403 |

---

## P2 — Functional Misdirection

### P2-1: Repository size metrics are stale

**AGENTS.md says:**
- `page.tsx` files: 1,486
- `route.ts` files: 1,079
- Supabase migrations: 278
- `console.log` occurrences: ~1,521 across 118 files

**Reality (current):**
- `page.tsx` files: **1,498** (+12)
- `route.ts` files: **1,122** (+43)
- Supabase migrations: **346** (+68)
- `console.log` occurrences: **2,305** across **174 files** (+784 occurrences, +56 files — 52% growth)

The `console.log` count has grown by 52% since the last audit. The migration count has grown by 24%.

**Fix:** Update counts. Add a note that these are point-in-time snapshots — agents should re-run the commands to get current counts rather than trusting the documented numbers:

```bash
find app -name "page.tsx" | wc -l
find app -name "route.ts" | wc -l
ls supabase/migrations/ | wc -l
grep -r "console\.log" --include="*.ts" --include="*.tsx" | wc -l
```

---

### P2-2: Supabase canonical import pattern is incomplete

**AGENTS.md says:** "Import from `@/lib/supabase/*`"

**Reality:** The actual usage breakdown:
- `@/lib/supabase/server` — **1,498 importers**
- `@/lib/supabase/admin` — **1,614 importers**
- `@/lib/supabase/client` — **252 importers**
- `@/lib/supabase` (barrel index) — effectively 0 direct importers

The `lib/supabase/index.ts` barrel export exists but is not used in practice. Agents should import from the specific sub-module.

**Fix:** Replace the vague "Import from `@/lib/supabase/*`" with concrete examples:

```ts
import { createClient } from '@/lib/supabase/server';        // Server components, API routes
import { createAdminClient } from '@/lib/supabase/admin';    // Admin operations (bypasses RLS)
import { createBrowserClient } from '@/lib/supabase/client'; // Client components only
```

---

### P2-3: Cron route auth pattern is undocumented

`CRON_SECRET` bearer token auth is used in at least 6 cron routes but is not documented as a pattern. Agents writing new cron routes have no canonical example.

**Fix:** Add a cron route auth pattern to the Canonical Systems section:

```ts
// Cron routes — called by Netlify scheduled functions or external cron
const cronSecret = process.env.CRON_SECRET;
if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## P3 — Stale / Incomplete

### P3-1: Pending migrations section has no last-verified date

**AGENTS.md lists as pending:**
- `20260401000005_curriculum_lessons_quiz_questions.sql`
- `20260402000003_programs_lms_columns.sql`

These were documented as pending at the time of writing. Their actual live status is unknown without a Supabase Dashboard query. There is no date stamp on when this was last verified.

**Fix:** Add a "last verified" date to the pending migrations table. Add a reminder that agents must verify migration status in Supabase Dashboard before assuming either state.

---

### P3-2: `lib/auth.ts` (root) is undocumented but has 174 importers

`lib/auth.ts` is a large auth utility file with `requireAdmin`, `requireAdminOrDelegate`, `getCurrentUser`, and other helpers. It is imported by 174 files including `app/admin/layout.tsx`. It is not mentioned anywhere in AGENTS.md.

**Fix:** Add `lib/auth.ts` to the Canonical Systems → API Auth Pattern section as the page-component auth entry point.

---

### P3-3: `lib/authGuards.ts` is the actual canonical API guard file but is not listed

AGENTS.md documents `lib/admin/guards.ts` as the import path, but `lib/admin/guards.ts` is a thin wrapper that re-exports from `lib/authGuards.ts`. The actual implementation and 38 direct importers use `@/lib/authGuards`.

**Fix:** Document `lib/authGuards.ts` as the canonical API guard implementation. Note that `lib/admin/guards.ts` re-exports from it and adds Netlify context helpers — use `lib/admin/guards.ts` only when you also need `isProd`, `isPreview`, `DEV_TOOL_ROUTES`, etc.

---

## P4 — Missing Coverage

### P4-1: No guidance on `lib/auth/validate-redirect.ts`

Redirect validation is a security concern. `lib/auth/validate-redirect.ts` exists but is undocumented. Agents writing login/redirect flows may implement their own (potentially unsafe) redirect validation.

**Fix:** Add a note in the Auth Redirect Parameter section: "Validate redirect targets with `validateRedirect()` from `@/lib/auth/validate-redirect` before using them in `redirect()` calls."

---

### P4-2: No guidance on error handling outside API routes

AGENTS.md documents `safe-error.ts` for API routes only. There is no guidance on error handling in Server Components or Client Components.

**Fix:** Add a brief note: "In Server Components, use `notFound()` or `redirect()` from `next/navigation`. In Client Components, use `try/catch` with local state. `safe-error.ts` is API-route-only."

---

## Concrete Changes to Make in AGENTS.md

Listed in priority order. Each item maps to a finding above.

| # | Priority | Section | Change |
|---|----------|---------|--------|
| 1 | P0 | API Auth Pattern | Replace `@/lib/admin/guards` import with correct paths; add page vs API guard table; document `lib/auth/` directory |
| 2 | P0 | API Auth Pattern | Fix `apiRequireAdmin` code example — remove `request` argument, fix return value check |
| 3 | P0 | Auth Redirect Parameter | Clarify `?redirect=` vs `?next=` — both are in use for different flows |
| 4 | P0 | Canonical Systems → Supabase Access | Update import examples to show specific sub-modules (`/server`, `/admin`, `/client`) |
| 5 | P0 | Canonical Systems → Rate Limiting | Note that `lib/rateLimit.ts` still exists on disk (zero importers, safe to delete) |
| 6 | P1 | Canonical Systems → Supabase Access | Add `createAdminClient` vs `createClient` guidance |
| 7 | P1 | Canonical Systems → API Auth Pattern | Add `lib/auth/validate-redirect` note |
| 8 | P2 | Repository Size | Update all four metrics to current counts; add re-run commands |
| 9 | P2 | Canonical Systems | Add cron route auth pattern |
| 10 | P3 | Migrations Pending | Add last-verified date; add Supabase verification query |
| 11 | P3 | Canonical Systems | Document `lib/auth.ts` and `lib/authGuards.ts` as distinct entry points |
| 12 | P4 | API Error Response Shape | Add error handling guidance for Server Components and Client Components |

---

## What Is Good in AGENTS.md

These sections are accurate, well-structured, and should not be changed:

- **LMS Architecture** — step_type table, data hierarchy, checkpoint gating, certification chain, and "Adding a New Program" workflow all match the codebase.
- **HVAC Legacy Path** — accurate. The prohibition on replicating HVAC patterns is correct and well-stated.
- **Hero Banner Standard** — `HeroVideo.tsx` and `content/heroBanners.ts` both exist and match the documented rules.
- **CTA System** — correct. `data/programs/<slug>.ts` pattern is real.
- **Enrollment Schema** — table reference counts and canonical table designations are accurate.
- **Canonical Portals by Role** — portal paths are correct.
- **Storage Conventions** — bucket names and access patterns are correct.
- **Multi-Provider Hub** — role model, tenant architecture, and RLS helpers are accurate.
- **Audit Scripts** — all three scripts exist and work.
- **Migration naming convention** — correct.
- **Brand Color Convention** — correct.
- **API Error Response Shape** — `lib/api/safe-error.ts` exists and the import path is correct.
- **Programs vs Courses debt** — well-documented, accurate, and the "do not resolve casually" warning is appropriate.
- **Admin IP Guard** — `lib/api/admin-ip-guard.ts` exists and the usage pattern is correct.
- **`apiRequireAdmin` role fix (PR #50)** — the note about `['admin', 'super_admin', 'staff']` is accurate.
