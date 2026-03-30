# Structural Audit — Route Architecture, Authorization, Coupling, Testability

**Date:** 2026-06  
**Scope:** 1,132 API routes across `app/api/`  
**Method:** Static analysis — grep patterns, import graphs, file counts, sampling

Severity: **S1** = blocks correctness/security · **S2** = causes bugs under load or edge cases · **S3** = structural debt slowing development · **S4** = onboarding/DX friction

---

## 1. DUPLICATED BUSINESS LOGIC

### S1-1 — Enrollment creation in 10 separate routes, 7 service files, none canonical

**The problem:** `program_enrollments.insert()` is called directly in at least 10 route files:

```
app/api/barber/webhook/route.ts
app/api/checkout/create/route.ts
app/api/enroll/cna/route.ts
app/api/funding/admin/confirm/route.ts
app/api/funding/admin/action/route.ts
app/api/webhooks/stripe/route.ts
app/api/admin/import/route.ts
app/api/cert/bulk-issue/route.ts
app/api/cert/issue/route.ts
app/api/v1/import/route.ts
```

Each one sets different fields, different `funding_source` values (`'self-pay'` vs `'self_pay'` vs `'Funded'`), different `status` values, and different `enrolled_at` handling. There is no shared validation.

**Seven enrollment service files exist in `lib/`**, none of which is actually used by more than 2 routes:

| File | Lines | Routes importing it |
|------|-------|---------------------|
| `lib/enrollment-service.ts` | 218 | 1 |
| `lib/enrollment/create-enrollment.ts` | 334 | 2 |
| `lib/enrollment/unified-enrollment.ts` | 344 | 0 |
| `lib/enrollment/orchestrate-enrollment.ts` | 180 | 1 |
| `lib/enrollment/complete-enrollment.ts` | 167 | ~3 |
| `lib/db/enrollments.ts` | 96 | 0 |
| `lib/actions/enrollments.ts` | 534 | 0 |
| `lib/enrollmentProvisioning.ts` | 63 | 0 |

`lib/enrollment-service.ts` has a comment at the top: *"Every route that creates or updates an enrollment MUST call `createOrUpdateEnrollment()`. No direct `.insert()` or `.upsert()` on `program_enrollments` anywhere else."* This rule is violated by 9 of the 10 routes above.

**Impact:** Inconsistent enrollment records, `funding_source` values that don't match across rows, silent data corruption on Stripe retries, impossible to add a cross-cutting concern (e.g. send welcome email on enrollment) without touching 10 files.

**Fix:** Delete 6 of the 7 service files. Enforce `lib/enrollment-service.ts` as the single write path. Add a lint rule or grep CI check that fails if `program_enrollments.*insert` appears outside that file.

---

### S1-2 — 44 Stripe checkout session creation sites; 2 canonical, 42 not

`stripe.checkout.sessions.create()` is called in 44 route files. `lib/checkout/deprecated.ts` documents two canonical endpoints (`/api/checkout/learner`, `/api/license/checkout`) and marks everything else deprecated — but only 2 routes (`/api/courses/checkout`, `/api/programs/checkout`) actually forward to the canonical path. The other 42 each build their own `sessionConfig` inline with different `payment_method_types`, `metadata` shapes, `success_url` patterns, and `line_items` structures.

**Concrete divergences found:**
- `barber/checkout/public` uses `payment_method_configuration` (PMC); most others don't
- `checkout/learner` uses `APP_STORE_PRODUCTS` lookup; `checkout/create` uses raw `price_data`
- `barber/checkout/full` instantiates `new Stripe(key)` directly; canonical uses `getStripe()`
- `funding/create-checkout` has no `success_url` validation; others do

**Fix:** Complete the consolidation `lib/checkout/deprecated.ts` started. Route all checkout through `/api/checkout/learner` with a `type` discriminator. Delete the 42 non-canonical files after migration.

---

### S1-3 — Certificate issuance in 4 separate routes with no shared service

```
app/api/admin/certificates/bulk/route.ts
app/api/cert/bulk-issue/route.ts
app/api/cert/issue/route.ts
app/api/cert/replace/route.ts
```

Each inserts into `certificates` directly with different field sets. `cert/issue` and `admin/certificates/bulk` are functionally identical (both issue certificates to a user by email) but were written independently. `lib/certificates/` exists but is only used for `flag-on-refund` — not for issuance.

---

### S1-4 — 6 Stripe webhook handlers processing `checkout.session.completed`

```
app/api/webhooks/stripe/route.ts          (2,492 lines, @ts-nocheck)
app/api/stripe/webhook/route.ts           (570 lines)
app/api/barber/webhook/route.ts           (871 lines)
app/api/webhooks/stripe/career-courses/route.ts (139 lines)
app/api/supersonic-fast-cash/stripe-webhook/route.ts (264 lines)
app/api/supersonic-fast-cash/payment-webhook/route.ts (90 lines)
```

All six handle `checkout.session.completed`. Only one can be registered in Stripe at a time — the others are either dead code or registered on separate Stripe accounts. The canonical handler (`/api/webhooks/stripe`) is 2,492 lines with `@ts-nocheck` and writes to 11 tables inline. If a second handler is accidentally registered, the same event fires twice, creating duplicate enrollments.

**Fix:** Confirm which webhook URL is registered in each Stripe account. Delete unregistered handlers. Extract the 11 table-write paths from the canonical handler into domain services.

---

### S1-5 — Email sending scattered across 30+ routes with no shared template registry

30+ routes call `resend.emails.send()` or `sendEmail()` directly inline. Each constructs its own HTML string or imports a one-off template. There is no central template registry, no preview mechanism, and no way to audit what emails the system sends without reading every route file.

---

## 2. AUTHORIZATION INCONSISTENCIES

### S1-6 — 412 routes with no auth check at all

```
grep -rL "apiAuthGuard|apiRequireAdmin|getUser|getSession|requireRole|auth\." app/api --include="route.ts"
→ 412 files
```

412 of 1,132 routes (36%) have no authentication check of any kind. Of these, **96 write to the database** (`.insert`, `.update`, `.delete`, `.upsert`). This means 96 routes can modify production data without any identity check.

Notable unauthenticated write routes:
```
app/api/admin/bulk/route.ts
app/api/admin/impersonate/route.ts        ← impersonation with no auth
app/api/admin/payment-config/route.ts     ← payment config with no auth
app/api/payments/route.ts
app/api/payments/split/route.ts
app/api/moderation/route.ts
app/api/placements/route.ts
app/api/page-builder/pages/route.ts
```

---

### S1-7 — Three parallel auth systems, none canonical

| System | Import path | Routes using it | Notes |
|--------|-------------|-----------------|-------|
| `apiAuthGuard` / `apiRequireAdmin` | `@/lib/admin/guards` | 39 | Canonical per AGENTS.md |
| `apiAuthGuard` / `apiRequireAdmin` | `@/lib/authGuards` | 29 | Deprecated shim — re-exports from `@/lib/admin/guards` |
| Raw `supabase.auth.getUser()` | inline | 520 | No shared guard, no role check |
| `requireAuth` | `@/lib/api/requireAuth` | ~15 | Fourth pattern, undocumented |
| `requireRole` | `@/lib/auth/require-role` | ~10 | Fifth pattern, page-level only |

520 routes call `supabase.auth.getUser()` directly and then implement their own role check (or skip it). This means 520 routes each contain their own auth boilerplate — 4–10 lines of repeated code — with no guarantee of consistency.

---

### S1-8 — 7 admin routes under `/api/admin/` with no admin role check

Routes under `/api/admin/` that have no check for `admin` or `super_admin`:

```
app/api/admin/barber-onboarding-blast/route.ts
app/api/admin/payouts/mark-paid/route.ts
app/api/admin/products/approve/route.ts
app/api/admin/run-migrations/route.ts       ← runs DB migrations
app/api/admin/scorm/route.ts
app/api/admin/send-onboarding-emails/route.ts
app/api/admin/test-email/route.ts
```

`/api/admin/run-migrations` can execute arbitrary SQL migrations with no auth check.

---

### S1-9 — 4 admin routes check only `'admin'`, not `'super_admin'` or `'staff'`

```
app/api/admin/certifications/review/route.ts
app/api/admin/program-holders/[id]/route.ts
app/api/courses/[courseId]/route.ts
app/api/reports/rapids/route.ts
```

These use `profile.role !== 'admin'` as the sole guard. A `super_admin` user is rejected. Per AGENTS.md, the canonical check is `['admin', 'super_admin', 'staff']`.

---

### S2-10 — 15 different "Unauthorized" error message strings

```
'Unauthorized'                              (669 occurrences)
'Forbidden'                                 (250 occurrences)
'Authentication required'                   (35 occurrences)
'Admin access required'                     (17 occurrences)
'Not authenticated'                         (14 occurrences)
'Forbidden - Admin only'
'Forbidden: Admin access required'
'Forbidden - requires employer/admin/sponsor role'
'Forbidden - requires admin/sponsor/employer role'
'ACTOR_NOT_AUTHORIZED'
... and 5 more variants
```

API clients cannot reliably detect auth failures — they must pattern-match against 15 different strings. The canonical shape per AGENTS.md is `{ error: string }` with HTTP 401/403, but the message content is not standardized.

---

### S2-11 — 96 write routes with no rate limiting

96 routes that write to the database have no rate limiting (`applyRateLimit` absent). This includes enrollment creation, payment config, and moderation routes. Under a retry storm or abuse scenario, these routes will hammer the DB with no backpressure.

---

## 3. ACCIDENTAL COUPLING

### S2-12 — The canonical Stripe webhook owns 11 unrelated domains in one 2,492-line file

`app/api/webhooks/stripe/route.ts` (2,492 lines, `@ts-nocheck`) writes to:

```
student_enrollments    ← enrollment domain
program_enrollments    ← enrollment domain
enrollments            ← enrollment domain (legacy)
licenses               ← licensing domain
license_events         ← licensing domain
donations              ← fundraising domain
payments               ← payments domain
payment_logs           ← payments domain
audit_logs             ← audit domain
tenants                ← multi-tenancy domain
applications           ← admissions domain
```

A bug in the donation handler can break enrollment. A schema change to `licenses` requires touching the same file as enrollment logic. The file has `@ts-nocheck` — all type safety is disabled across all 11 domains simultaneously.

**Fix:** Extract each `event.type` + `kind` branch into a domain handler function in its own file. The webhook becomes a router only — no business logic inline.

---

### S2-13 — Route namespace collision: `enroll/`, `enrollment/`, `enrollments/` are three separate domains

```
/api/enroll/*          (9 routes)  — student self-service enrollment
/api/enrollment/*      (9 routes)  — enrollment state machine / documents
/api/enrollments/*     (8 routes)  — enrollment CRUD / queries
/api/admin/enrollments/* (3 routes) — admin enrollment management
```

These four namespaces overlap in purpose. A developer adding enrollment logic must choose between 4 prefixes with no documented distinction. Routes with identical names exist in multiple namespaces (e.g. `enroll/checkout` and `enrollments/checkout` and `programs/enroll/checkout`).

---

### S2-14 — Application flow split across 50+ routes in 8 namespaces

```
/api/admin/applications/*     (14 routes)
/api/applications/*           (6 routes)
/api/apply/*                  (4 routes)
/api/intake/*                 (8 routes)
/api/intakes/                 (1 route)
/api/enroll/apply/            (1 route)
/api/programs/barber-apprenticeship/apply/ (1 route)
/api/partners/barbershop-apprenticeship/apply/ (1 route)
```

An application submitted via `/api/apply` is reviewed via `/api/admin/applications`, but the status transitions live in `/api/admin/applications/transition`, the approval in `/api/admin/applications/[id]/approve`, the WorkOne confirmation in `/api/admin/applications/[id]/confirm-workone`, and the grant in `/api/admin/applications/[id]/approve-and-grant`. These are all separate files with no shared state machine.

---

### S3-15 — Tax domain (`/api/tax/`, `/api/supersonic-fast-cash/`) is entangled with LMS auth

`/api/tax/book-appointment` and `/api/tax/file-return` use `createAdminClient` from `@/lib/supabase/admin` — the same admin client used by LMS enrollment. A misconfigured service role key breaks both the tax filing system and the LMS simultaneously. These should use separate Supabase projects or at minimum separate service accounts.

---

### S3-16 — `lib/actions/enrollments.ts` imports deprecated `supabaseAdmin` shim

```ts
// lib/actions/enrollments.ts line 13
import { supabaseAdmin } from '../supabaseAdmin';
```

This is a 534-line server action file importing from a deprecated shim (`lib/supabaseAdmin.ts`) that AGENTS.md marks for deletion. It also uses `'use server'` at line 12 — after the import — which is invalid (directive must be first line). This file likely does not work correctly.

---

## 4. TESTABILITY

### S3-17 — 37 unit tests cover 1,132 routes (3.3% route coverage)

```
tests/unit/   → 37 test files
app/api/      → 1,132 route files
```

The 37 unit tests cover: auth redirects, blueprint seeder contract, enrollment flow (mocked), stripe webhook signature, safe-utils, format-utils, password validation, and a handful of security checks. Zero tests cover:

- Any checkout flow end-to-end
- Certificate issuance
- Application state transitions
- BNPL (Sezzle/Affirm) checkout paths
- Admin role enforcement on admin routes
- The barber pricing calculation (the P0 bug from the previous audit)

---

### S3-18 — The canonical Stripe webhook (`webhooks/stripe/route.ts`) has `@ts-nocheck` and is untestable

The 2,492-line webhook handler has `@ts-nocheck` at line 1. It:
- Creates its own Supabase client inline (not injectable)
- Has no exported handler function (only `export const POST`)
- Mixes 11 domain concerns with no seams for mocking
- Has no unit test

This is the most critical file in the payment pipeline and it cannot be unit tested without a full Stripe + Supabase integration environment.

---

### S3-19 — 520 routes with inline `supabase.auth.getUser()` cannot be unit tested without Supabase

Because auth is inline rather than injected, any unit test for these routes must either:
1. Mock the entire Supabase client (fragile, verbose)
2. Spin up a real Supabase instance (slow, requires env vars)
3. Skip auth testing entirely (current state)

Routes using `apiAuthGuard` from `@/lib/admin/guards` are testable because the guard is a single injectable function. The 520 inline routes are not.

---

### S4-20 — No route index, no domain map, no onboarding guide for the API layer

A new developer joining the project faces:
- 1,132 route files with no index
- 4 overlapping enrollment namespaces
- 7 enrollment service files with contradictory docstrings
- 3 auth systems with no documented canonical
- 44 checkout routes with no map of which are live vs deprecated
- `lib/` with 60+ subdirectories, no README

The only documentation is `AGENTS.md` (accurate for canonical patterns) and scattered inline comments. There is no `docs/api-domains.md`, no route grouping by domain, and no "start here" guide for the API layer.

---

## 5. SCHEMA OWNERSHIP

### S2-21 — `program_enrollments` is written by 10 routes across 6 domains

The `program_enrollments` table has no single owner. It is written by:
- Stripe webhook (payment domain)
- Barber webhook (barber domain)
- CNA enrollment route (enrollment domain)
- Checkout create (checkout domain)
- Funding confirm (funding domain)
- Admin import (admin domain)
- Cert issue (certificate domain)
- v1 import (API v1 domain)

Each writer uses different field names for the same concept (`self-pay` vs `self_pay` vs `Funded`). There is no migration guard, no DB constraint, and no enum on `funding_source`.

---

### S3-22 — `audit_logs` written by 30+ routes with no shared writer

`audit_logs.insert()` appears in 30+ route files. Each constructs its own `action` string and `details` JSON with no shared schema. The admin audit export page cannot reliably parse these records because the `details` shape varies per route.

---

## SUMMARY

| ID | Severity | Category | Issue | Scope |
|----|----------|----------|-------|-------|
| S1-1 | **S1** | Duplication | Enrollment creation in 10 routes, 7 service files, 1 rule | 10 routes |
| S1-2 | **S1** | Duplication | 44 Stripe checkout creation sites, 2 canonical | 42 routes |
| S1-3 | S2 | Duplication | Certificate issuance in 4 routes, no shared service | 4 routes |
| S1-4 | **S1** | Duplication | 6 Stripe webhook handlers for same event | 6 routes |
| S1-5 | S3 | Duplication | Email sending in 30+ routes, no template registry | 30+ routes |
| S1-6 | **S1** | Auth | 412 routes with no auth; 96 write to DB unauthenticated | 96 routes |
| S1-7 | **S1** | Auth | 3 parallel auth systems, 520 routes use raw inline auth | 520 routes |
| S1-8 | **S1** | Auth | 7 `/api/admin/` routes with no admin role check | 7 routes |
| S1-9 | S2 | Auth | 4 admin routes check only `'admin'`, reject `super_admin` | 4 routes |
| S2-10 | S2 | Auth | 15 different "Unauthorized" error strings | 1,132 routes |
| S2-11 | S2 | Auth | 96 write routes with no rate limiting | 96 routes |
| S2-12 | **S1** | Coupling | Stripe webhook owns 11 domains, 2,492 lines, `@ts-nocheck` | 1 file |
| S2-13 | S2 | Coupling | `enroll/` vs `enrollment/` vs `enrollments/` — 3 overlapping namespaces | 26 routes |
| S2-14 | S2 | Coupling | Application flow split across 8 namespaces, no state machine | 50+ routes |
| S3-15 | S3 | Coupling | Tax domain shares Supabase admin client with LMS | 2 domains |
| S3-16 | S3 | Coupling | `lib/actions/enrollments.ts` imports deprecated shim, broken `'use server'` | 1 file |
| S3-17 | S3 | Testing | 37 unit tests for 1,132 routes (3.3% coverage) | all routes |
| S3-18 | S3 | Testing | Canonical Stripe webhook untestable (`@ts-nocheck`, no seams) | 1 file |
| S3-19 | S3 | Testing | 520 inline-auth routes untestable without Supabase | 520 routes |
| S4-20 | S4 | Onboarding | No route index, no domain map, no API onboarding guide | all routes |
| S2-21 | S2 | Schema | `program_enrollments` written by 10 routes, inconsistent `funding_source` | 1 table |
| S3-22 | S3 | Schema | `audit_logs` written by 30+ routes with no shared schema | 1 table |

---

## RECOMMENDED REMEDIATION ORDER

### Phase 1 — Stop the bleeding (S1, 1–2 weeks)

1. **Auth sweep:** Add `apiRequireAdmin` to the 7 `/api/admin/` routes with no role check. Especially `run-migrations` and `payment-config`.
2. **Enrollment write path:** Enforce `lib/enrollment-service.ts`. Add a CI grep that fails on `program_enrollments.*insert` outside that file.
3. **Stripe webhook dedup:** Confirm which webhook URL is registered per Stripe account. Delete unregistered handlers. Add idempotency key check to the canonical handler.

### Phase 2 — Structural consolidation (S2, 2–4 weeks)

4. **Checkout consolidation:** Complete what `lib/checkout/deprecated.ts` started. Migrate the 42 non-canonical checkout routes to forward to `/api/checkout/learner`.
5. **Stripe webhook decomposition:** Extract each `kind`/`type` branch from `webhooks/stripe/route.ts` into `lib/webhooks/handlers/[domain].ts`. Remove `@ts-nocheck`.
6. **Namespace cleanup:** Merge `enroll/`, `enrollment/`, `enrollments/` into a single `/api/enrollment/` namespace with documented sub-routes.
7. **`funding_source` enum:** Add a DB check constraint on `program_enrollments.funding_source` to enforce consistent values.

### Phase 3 — Testability (S3, ongoing)

8. **Auth injection:** Replace inline `supabase.auth.getUser()` with `apiAuthGuard` in the 520 raw-auth routes. This makes them unit-testable.
9. **Domain service tests:** Add unit tests for `lib/enrollment-service.ts`, `lib/certificates/`, and the barber pricing calculation (the P0 bug was untested).
10. **Route index:** Create `docs/api-domains.md` mapping each namespace to its domain, canonical service, and owner.
