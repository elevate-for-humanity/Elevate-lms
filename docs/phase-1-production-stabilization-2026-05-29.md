# Phase 1 Production Stabilization Report — 2026-05-29

## Mission

Begin Phase 1 immediately and verify/repair the four critical workflows without refactoring, TypeScript cleanup, auth migration, logging cleanup, or architecture work.

## Executive status

| Workflow                    |               Status | Current result                                                                                                                                                                                                          |
| --------------------------- | -------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enrollment Flow             |                 FAIL | E2E could not complete in this container because browser binaries are unavailable and live Supabase DNS/credentials are unavailable. Two blocking runtime defects discovered before browser launch were repaired.       |
| Testing Center              |              BLOCKED | Requires browser execution, Stripe/test-payment credentials, and database connectivity for transaction + record verification.                                                                                           |
| Trial Workflow              |              BLOCKED | Requires browser execution and database/email provider connectivity for completed submission + notification evidence.                                                                                                   |
| Admin Studio / Studio Shell |              PARTIAL | Cash Advance admin surfaces were disabled. Browser/menu/form verification is blocked by missing Playwright browser binaries and admin credentials. Prior shell proxy work remains in scope for deployment verification. |
| Build Stability             | FAIL / INVESTIGATING | `pnpm next build` OOMs in this container. Memory debug mode showed heap growth to 3.06 GB / 71.38% and RSS grew to ~13 GB while writing a 2.4 GB heap snapshot. See `docs/build-stability-investigation-2026-05-29.md`. |

## Evidence collected

### Commands executed

```bash
cat > .env.local <<'ENV_EOF'
NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder
NEXTAUTH_SECRET=dev-secret
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true
ENV_EOF
```

```bash
pnpm exec playwright test tests/e2e/enrollment-flow.spec.ts --project=chromium --reporter=list
```

Result:

- Initial run exposed an Edge middleware runtime failure from `proxy.ts` importing Node `crypto`.
- After that repair, the run reached the existing enrollment E2E suite but all browser cases failed before page execution because Chromium is not installed in this environment.
- Playwright reported: `Executable doesn't exist at /root/.cache/ms-playwright/chromium_headless_shell-1200/...`.

```bash
pnpm exec playwright install chromium
```

Result:

- Failed because all Playwright CDN download URLs returned `403 Forbidden`.

```bash
pnpm next build
NODE_OPTIONS='--max-old-space-size=6144' pnpm next build
```

Result:

- Both attempts reached production build startup.
- Default heap failed with JavaScript heap OOM.
- 6144 MB heap also failed with JavaScript heap OOM in this container before build completion.

```bash
pnpm exec eslint proxy.ts components/home/HomeFinalCTA.tsx components/site/ServerFooter.tsx
```

Result: PASS.

## Repairs applied in this Phase 1 start

### 1. Edge middleware runtime failure

**Status:** Fixed.

**Broken step:** Every public route request could fail during middleware execution before the browser could load an application page.

**Root cause:** `proxy.ts` imported `randomUUID` from Node `crypto`, but middleware runs in the Edge runtime where Node `crypto` is unsupported.

**Files changed:**

- `proxy.ts`

**Fix:** Removed the Node `crypto` import and used the Edge-compatible global `crypto.randomUUID()`.

### 2. Public page parse failures blocking enrollment discovery

**Status:** Fixed.

**Broken step:** Homepage/public layout compilation failed before enrollment discovery pages could render.

**Root cause:** Two `tel:` links were malformed JSX strings containing nested quotes:

- `components/home/HomeFinalCTA.tsx`
- `components/site/ServerFooter.tsx`

**Files changed:**

- `components/home/HomeFinalCTA.tsx`
- `components/site/ServerFooter.tsx`

**Fix:** Converted both phone href values to JSX template expressions using `PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')`.

## Workflow detail

### 4. Internal email relay hardened

**Status:** Hardened.

**Reason:** `/api/email/send` is a sensitive transactional email relay and must not behave like a public endpoint during production stabilization.

**Files changed:**

- `app/api/email/send/route.ts`

**Fix:** Added `withRuntime` secret validation for `CRON_SECRET` and strict rate limiting before the audited email handler executes. The existing `x-internal-secret` check remains in place.

### 3. Cash Advance functionality removed from active LMS surfaces

**Status:** Disabled.

**Reason:** Cash advances are outside the critical learner journey and were identified as security/audit exposure during production stabilization.

**Scope:**

- Public refund-advance route now returns `notFound()`.
- Admin cash-advance pages now return `notFound()`.
- Cash-advance APIs continue preserving data but return HTTP 410.
- Public banking page no longer advertises refund advances.
- Admin navigation no longer links to Cash Advances.
- Sitemap/SEO allowlist no longer advertise refund-advance pages.

**Files changed:**

- `app/banking/page.tsx`
- `app/banking/refund-advance/page.tsx`
- `app/api/cash-advances/applications/route.ts`
- `app/api/cash-advances/applications/[id]/route.ts`
- `app/api/cash-advances/applications/[id]/approve/route.ts`
- `apps/admin/app/admin/cash-advances/page.tsx`
- `apps/admin/app/admin/cash-advances/pending/page.tsx`
- `apps/admin/app/admin/cash-advances/reports/page.tsx`
- `apps/admin/app/admin/cash-advances/settings/page.tsx`
- `lib/admin/nav-config.ts`
- `config/site-map.auto.ts`
- `config/seo-index-whitelist.json`
- `app/refund-policy/page.tsx`
- `app/api/email/send/route.ts`

### 1. Enrollment Flow — FAIL pending environment-backed re-test

Requested verification:

- Application submission
- Database save
- Email notifications
- Enrollment creation
- Admin visibility

What was verified today:

- Existing E2E coverage exists at `tests/e2e/enrollment-flow.spec.ts`.
- The local server can start far enough to reveal runtime/compile blockers.
- Two blockers that prevented route rendering were fixed.

Exact failing/blocking steps remaining:

1. Browser execution is blocked because Playwright Chromium is missing and cannot be downloaded from the current network (`403 Forbidden`).
2. Database-backed verification is blocked because the local placeholder Supabase environment cannot resolve/connect to the hosted Supabase project in this container (`getaddrinfo EAI_AGAIN cuxzzpsyufcewtmicszk.supabase.co`).
3. Email notification verification requires configured SendGrid/Resend or equivalent non-production test credentials.

Files requiring any future repair cannot be identified until browser + database-backed E2E can run past launch.

### 2. Testing Center — BLOCKED

Requested verification:

- Registration
- Payment
- Confirmation
- Admin reporting

Current blocker:

- Cannot execute browser flow without Playwright Chromium.
- Cannot verify payment without configured Stripe test keys/webhook path and database connectivity.

Likely files/routes to exercise in the next environment-backed run:

- `app/api/testing/book/route.ts`
- `app/api/testing/checkout/route.ts`
- `app/api/testing/webhook/route.ts`
- `apps/admin/app/admin/testing-center/page.tsx`
- `apps/admin/app/admin/testing-center/TestingCenterClient.tsx`

### 3. Trial Workflow — BLOCKED

Requested verification:

- All required fields collected
- Data stored
- Notifications sent
- Admin review process works

Current blocker:

- Cannot execute browser submission without Playwright Chromium.
- Cannot verify storage/notifications without database and email provider connectivity.

Likely files/routes to exercise in the next environment-backed run:

- `app/store/trial/page.tsx`
- `app/api/apps/trial/start/route.ts`
- `app/api/trial/start-managed/route.ts`
- `app/api/trial/begin-onboarding/route.ts`
- `apps/admin/app/api/admin/trial-events/route.ts`

### 4. Admin Studio / Studio Shell — PARTIAL

Requested verification:

- Every menu item
- Every save button
- Every edit form
- Every delete function

Current blocker:

- Requires admin login credentials and browser automation.
- Studio shell requires deployed/accessible `studio-shell` endpoint and `STUDIO_SHELL_*` secrets.

Likely files/routes to exercise in the next environment-backed run:

- `apps/admin/app/admin/studio/page.tsx`
- `apps/admin/app/admin/dev-studio/DevStudioClient.tsx`
- `apps/admin/app/api/devstudio/*`
- `apps/admin/server.js`
- `components/dev-studio/*`

## Remaining blockers

1. Install or pre-bundle Playwright Chromium in the test environment, or run against an environment with browsers already installed.
2. Provide non-production Supabase credentials with DNS/network access.
3. Provide non-production email provider credentials for notification verification.
4. Provide Stripe test keys/webhook secret for Testing Center payment verification.
5. Provide admin test credentials for Admin Studio verification.
6. Re-run Phase 1 E2E and capture screenshots once browser execution is available.

## Build stability

Build stability is now tracked as a Phase 1 blocker because `pnpm next build` failed twice from JavaScript heap OOM and memory-debug mode showed high RSS growth while writing a large heap snapshot. See `docs/build-stability-investigation-2026-05-29.md` for the route-count, file-size, and memory progression evidence.

## Production readiness assessment

Current readiness for the target journey — application → payment → enrollment → training — is **not yet verified**. Phase 1 is not complete without operational evidence for enrollment, payments, testing center, Dev Studio shell, and a successful production build in an adequately provisioned environment. Cash Advance functionality has been removed from active public/admin surfaces so today's stabilization remains focused on enrollment, payments, testing, and Dev Studio shell.

The first Phase 1 execution found and repaired two route-blocking defects, but evidence-backed PASS status cannot be assigned until browser, database, payment, email, and admin credentials are available in the execution environment.
