# Platform Hardening Audit — 2026-05-31

Automated pass on Cloud Agent VM (`cursor/enrollment-catalog-sync-c4c6`).  
Scope: Stripe/BNPL, images, admin route classification, hygiene scripts, migrations inventory, Sentry, deployment gates.

## Executive summary

| Area | Status | Notes |
|------|--------|--------|
| Platform Doctor | **PASS** (deploy allowed) | 0 CRITICAL; 40 STRICT (design/template) |
| Stripe integrity | **PASS** | Canonical `lib/stripe/client.ts` |
| Stripe unit tests | **PASS** | 39 tests (service + webhook signature + identity negative) |
| BNPL / payment unit tests | **PASS** | enrollment-payment, license webhooks, async-safety |
| Admin API guards | **PASS** | `audit:admin`, `guard:admin-routes` |
| Image contract | **PASS** (non-strict) | 0 CRITICAL; 4 STRICT |
| Catalog API | **FIXED** | `GET /api/catalog` now uses `loadProgramCatalog()` |
| Sentry | **NOT INTEGRATED** | No SDK or env refs in repo |
| Route crawl (live) | **NOT RUN** | Requires dev server + `npx tsx scripts/crawl-routes.ts` |
| Internal link checker | **NOISY** | 2022 “broken” refs — static scan, many false positives |
| Pending migrations (manual) | **4 files in repo** | Must be applied in Supabase Dashboard |

---

## Stripe paths

**Integrity:** `pnpm integrity:stripe` — all consumers use canonical client.

**Webhook / payment route inventory (representative):**

- `app/api/webhooks/stripe/route.ts` — primary Stripe webhook
- `app/api/webhooks/stripe-identity/route.ts`
- `app/api/webhooks/stripe/career-courses/route.ts`
- `app/api/webhooks/exam-payment/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/barber/webhook/route.ts`, `app/api/cosmetology/webhook/route.ts`
- `app/api/donate/webhook/route.ts`, `app/api/licenses/webhook/route.ts`, `app/api/license/webhook/route.ts`
- `app/api/webhooks/store/route.ts`, `app/api/webhooks/marketplace/route.ts`
- `app/api/enroll/checkout/route.ts`

**Tests executed:** `stripe-service`, `stripe-webhook-signature`, `stripe-identity-webhook-negative`, `enrollment-payment`, `license/webhook-routes-unified`, `jobs/async-safety`.

**Follow-up:** Run Playwright `tests/stripe-webhook.spec.ts` and `tests/stripe-barber-webhook.sh` against a staging URL with real `STRIPE_WEBHOOK_SECRET`. Run `pnpm check:stripe` when Stripe CLI credentials are available.

---

## BNPL (Affirm / Sezzle / etc.)

**Routes:**

- Affirm: `app/api/affirm/checkout`, `capture`, `webhook` (shared secret header)
- Legacy: `app/api/affirm-charge` → deprecated, redirects to checkout
- Config: `lib/bnpl` / payment resolution in checkout flows
- E2E reference: `tests/barber-apply.spec.ts` lists providers `affirm`, `sezzle`, `klarna`, `afterpay`, `zip`

**Tests:** `bug-fixes-round2` (affirm/sezzle order ID), `enrollment-payment` (affirm intent).

**Follow-up:** Add dedicated Vitest coverage for `app/api/affirm/webhook/route.ts` signature/secret validation (mirror stripe-webhook-signature pattern).

---

## Image optimization

- **Next config:** `images.unoptimized: false`, AVIF/WebP, `remotePatterns` (see `next.config.mjs`).
- **Contract:** `pnpm images:contract` — 4 STRICT findings:
  - `app/eligibility/page.tsx` — placeholder missing
  - `app/federal-compliance/page.tsx` — placeholder missing
  - `app/outcomes/page.tsx` — raw `<img>` without allow comment
  - `components/home/HomeTrustBar.tsx` — `next/image` missing `sizes`

**Stabilization:** Run `pnpm images:contract:fix` for safe auto-fixes; enforce on main with `images:contract` in CI strict mode when ready.

---

## Admin routes — three buckets

Source: `scripts/admin-route-inventory.json` (275 pages). Heuristic mapping to product language:

| Bucket | Count | Definition |
|--------|------:|------------|
| **Finished functional** | 215 | `LIVE`, no column mismatches, has purpose, no audit gap |
| **Functional but rough** | 43 | `LIVE`/`FORM` with schema mismatches, thin pages, or missing metadata |
| **Shell / stub** | 17 | `STATIC` with no reads/API wiring |

**Inventory script statuses (original):** LIVE 245, FORM 13, STATIC 17, SHELL 0.

**Schema drift:** 22 pages have `column_mismatches` vs `scripts/live-schema-snapshot.json` (refresh snapshot + re-run `python3 scripts/admin-route-inventory.py`).

**Audit trail:** 0 mutation pages missing audit (inventory `audit_gap: 0`).

**FORM-only create flows (13):** e.g. `/admin/crm/leads/new`, `/admin/grants/new` — functional forms, classify as “rough” until wired to list views.

---

## Route audit & crawl

- `pnpm route:audit` — **1 issue:** banned prefix `app/api/donations/webhook` (should be `/api/donate/*`).
- `pnpm routes:check` — static link graph reports 2022 broken links; treat as advisory until route manifest is aligned with App Router.
- **Live crawl:** `npx tsx scripts/crawl-routes.ts http://localhost:3000` after `pnpm dev`.

---

## Form submissions (E2E)

**Unit coverage run:** enrollment-api, enrollment-flow, enrollment-service-status, enrollment-payment.

**Playwright (not run in VM):**

- `tests/e2e/enrollment-flow.spec.ts`
- `tests/e2e/full-enrollment-journey.spec.ts`
- `tests/e2e/complete-platform.spec.ts`

**Known duplicate write paths (consolidation backlog):** `/api/intake`, `/api/intake/apply`, `/api/applications`, `/api/enroll/apply`, `/api/enrollment/submit`.

---

## Database migrations

- **Files in repo:** 738 under `supabase/migrations/`
- **Documented pending (manual apply in Supabase SQL Editor):**
  - `20260702000009_normalize_two_factor_auth.sql`
  - `20260702000010_onboarding_progress_unique.sql`
  - `20260702000011_ensure_storage_buckets.sql`
  - `20260702000012_external_courses_support_fee.sql`

Migrations are **not** auto-applied on deploy (`prebuild` skips migrate). Verify live schema before shipping catalog/enrollment changes.

---

## Sentry

**Finding:** No `@sentry/*` dependency, no `SENTRY_DSN` usage, no `sentry.*.config` files.

**Recommendation:** Add Next.js SDK + source maps in ECS build; tag events by `severity` via `captureException` levels and alert rules in Sentry UI (P0: payment/webhook/auth; P1: enrollment; P2: admin rough routes).

---

## Deployment hygiene

| Check | Result |
|-------|--------|
| `pnpm platform:doctor` | DEPLOY ALLOWED |
| `pnpm platform:doctor:strict` | 40 STRICT (non-blocking unless `PLATFORM_DOCTOR_ENFORCE_STRICT=true`) |
| `pnpm audit:admin` | 0 errors |
| `pnpm guard:admin-routes` | 32 routes guarded |
| `pnpm predeploy:check` | **Fails** on `routes:check` (link noise) |
| CI reference | `.github/workflows/compliance-gate.yml`, `deploy-lms.yml`, `deploy-admin.yml` |

**Hardening actions:**

1. Merge catalog API fix + enrollment catalog sync branch.
2. Apply four pending Supabase migrations.
3. Fix 4 image-contract STRICT items.
4. Rename `app/api/donations/webhook` → canonical `/api/donate/webhook` (or alias + redirect).
5. Add Sentry with severity-based alerting.
6. Run staging Stripe/BNPL webhook replay + Playwright enrollment E2E.

---

## Artifacts (this run)

- `artifacts/platform-doctor-report.json`
- `artifacts/image-contract-report.json`
- `artifacts/stripe-integrity.log`, `artifacts/stripe-unit.log`
