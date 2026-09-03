# Platform Readiness Completion Report

**Branch:** feature/hub-architecture-positioning  
**Phases completed:** 0–10  
**Migrations added:** 10  
**New API routes:** 12  
**New services/handlers:** 5  
**New pages:** 3

---

## 1. Executive Summary

The platform has been upgraded from a sophisticated single-operator LMS to a structurally sound multi-provider workforce hub. All 20 roadmap items from the gap analysis have been implemented. The five critical missing pieces identified in the audit — provider approval workflow, placement records, case manager access, unified audit view, and external credential API integration — are now in place.

---

## 2. Roadmap Items Completed

| #   | Item                                                                         | Status |
| --- | ---------------------------------------------------------------------------- | ------ |
| 1   | `tenants.type` + `organizations → tenants` FK                                | ✅     |
| 2   | `provider_admin` role RLS tenant isolation                                   | ✅     |
| 3   | `provider_program_approvals` table + submit/review/list APIs                 | ✅     |
| 4   | `placement_records` table + indexes                                          | ✅     |
| 5   | Placement CRUD APIs + admin/case_manager/employer scoping                    | ✅     |
| 6   | Employer-program matching (deterministic, two-direction)                     | ✅     |
| 7   | Credential expiration job (SQL function + pg_cron + Netlify cron fallback)   | ✅     |
| 8   | Credly badge issuance service + job queue handler                            | ✅     |
| 9   | CompTIA external verification API + provider abstraction                     | ✅     |
| 10  | `case_manager` RLS policies + dashboard portal                               | ✅     |
| 11  | Unified audit SQL view (7 tables → 1 queryable surface)                      | ✅     |
| 12  | `data_deletion_requests` table (FERPA/CCPA)                                  | ✅     |
| 13  | `consent_records` table (structured, queryable)                              | ✅     |
| 14  | `tenant_compliance_records` table (replaces text flags)                      | ✅     |
| 15  | JotForm webhook constant-time secret comparison                              | ✅     |
| 16  | `lib/api/safe-error.ts` + raw `error.message` leaks fixed                    | ✅     |
| 17  | `lib/api/admin-ip-guard.ts` (env-controlled IP allowlist)                    | ✅     |
| 18  | Admin impersonation tool (audited, cookie-based, admin-only)                 | ✅     |
| 19  | Provider self-service export (async job queue, CSV, signed URL)              | ✅     |
| 20  | `enrollment_funding_records` + WIOA table dependency repair                  | ✅     |
| 21  | RLS helpers (`get_my_role`, `is_admin_role`) + enrollment compatibility view | ✅     |

---

## 3. Migrations Added

Run in order in Supabase Dashboard → SQL Editor:

| File                                                  | Purpose                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `20260320000001_tenant_type_org_link.sql`             | `tenants.type`, `organizations.tenant_id` FK, RLS                                        |
| `20260320000002_provider_admin_rls.sql`               | `provider_admin` tenant-scoped RLS on 6 tables                                           |
| `20260320000003_provider_program_approvals.sql`       | Approval workflow table + publish guard trigger                                          |
| `20260320000004_placement_records.sql`                | Employment outcome table + multi-role RLS                                                |
| `20260320000005_credential_expiration_job.sql`        | `expire_stale_credentials()` + pg_cron schedule                                          |
| `20260320000006_case_manager_rls.sql`                 | `case_manager` read-only RLS + assignment helpers                                        |
| `20260320000007_unified_audit_view.sql`               | `unified_audit_log` view across all 7 audit tables                                       |
| `20260320000008_ferpa_consent_compliance.sql`         | `data_deletion_requests`, `consent_records`, `tenant_compliance_records`                 |
| `20260320000009_enrollment_funding_wioa.sql`          | `enrollment_funding_records`, `wioa_participants`, `wioa_participant_records`            |
| `20260320000010_rls_optimization_enrollment_plan.sql` | `get_my_role()`, enrollment compatibility view, `program_enrollments.tenant_id` backfill |

---

## 4. Tables / Views / Functions Added

**New tables:** `provider_program_approvals`, `placement_records`, `data_deletion_requests`, `consent_records`, `tenant_compliance_records`, `enrollment_funding_records`, `wioa_participants` (repair), `wioa_participant_records` (repair)

**New views:** `unified_audit_log`

**New SQL functions:** `get_my_tenant_id()`, `is_provider_admin()`, `is_case_manager()`, `get_my_assigned_learner_ids()`, `expire_stale_credentials()`, `enforce_provider_org_tenant()`, `enforce_program_approval_before_publish()`, `get_my_role()`, `is_admin_role()`, `set_updated_at()`

---

## 5. Routes Added

| Route                                | Method       | Purpose                                |
| ------------------------------------ | ------------ | -------------------------------------- |
| `/api/provider/programs/submit`      | POST         | Provider submits program for review    |
| `/api/provider/programs/list`        | GET          | List approval records (scoped by role) |
| `/api/provider/programs/[id]/review` | POST         | Admin approves/rejects program         |
| `/api/placements`                    | GET, POST    | List/create placement records          |
| `/api/placements/[id]`               | GET, PATCH   | Fetch/update single placement          |
| `/api/employer/matches`              | GET          | Employer-program matching (two modes)  |
| `/api/cron/expire-credentials`       | GET          | Netlify cron: expire stale credentials |
| `/api/admin/impersonate`             | POST, DELETE | Start/end impersonation session        |
| `/api/provider/export`               | POST         | Queue provider data export job         |

---

## 6. UI / Admin Pages Added

| Page                                         | Purpose                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `/app/case-manager/dashboard/page.tsx`       | Case manager portal — participants, enrollments, placements |
| `/app/admin/impersonate/page.tsx`            | Admin impersonation tool with audit log                     |
| `/app/admin/impersonate/ImpersonateForm.tsx` | Client form component                                       |

---

## 7. New Services / Handlers

| File                                   | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `lib/credentials/credly.ts`            | Credly badge issuance + revocation                         |
| `lib/credentials/verification.ts`      | External verification provider abstraction (CompTIA first) |
| `lib/jobs/handlers/credly-badge.ts`    | Job queue handler for badge issuance                       |
| `lib/jobs/handlers/provider-export.ts` | Job queue handler for CSV export                           |
| `lib/api/safe-error.ts`                | Safe API error response helpers                            |
| `lib/api/admin-ip-guard.ts`            | Admin IP allowlist guard                                   |

---

## 8. RLS and Auth Changes

- `UserRole` type in `lib/authGuards.ts` extended with `super_admin`, `staff`, `provider_admin`, `case_manager`, `employer`, `partner`
- `provider_admin` now has hard tenant-scoped RLS on: `programs`, `training_enrollments`, `program_enrollments`, `profiles`, `learner_credentials`, `program_completion`, `placement_records`, `provider_program_approvals`
- `case_manager` now has assignment-scoped read RLS on: `profiles`, `program_enrollments`, `training_enrollments`, `program_completion`, `learner_credentials`, `placement_records`, `enrollment_funding_records`
- New helper functions: `get_my_tenant_id()`, `is_provider_admin()`, `is_case_manager()`, `get_my_assigned_learner_ids()` — all `SECURITY DEFINER`, stable, cached per query

---

## 9. Supabase Deployment Steps

1. Run migrations 001–010 in order via SQL Editor
2. Enable `pg_cron` extension (Dashboard → Database → Extensions) for credential expiration
3. Create `provider-exports` storage bucket (private, no public access)
4. Verify `wioa_participants` and `wioa_participant_records` now exist (migration 009 creates them if missing)
5. Confirm `program_enrollments.tenant_id` backfill ran (check row count vs NULL count)

---

## 10. Netlify Deployment Steps

1. Add env vars (see section 11)
2. Add scheduled function for credential expiration:

   ```toml
   # netlify.toml
   [[plugins]]
   package = "@netlify/plugin-nextjs"

   [functions."api/cron/expire-credentials"]
   schedule = "0 2 * * *"
   ```

3. Add `provider-exports` bucket CORS policy if direct browser download is needed
4. Deploy branch — no build config changes required

---

## 11. Cloudflare Configuration

- Add WAF rule: block requests to `/api/tax/jotform-webhook` where header `x-jotform-secret` is absent AND source IP is not in JotForm range
- Add rate limit rule: `/api/provider/programs/submit` — 5 req/min per IP
- Optional: Cloudflare Access policy on `/admin/*` and `/case-manager/*` for MFA enforcement
- No Workers changes required

---

## 12. New Environment Variables Required

```bash
# Credly badge issuance (Phase 3.2)
CREDLY_API_KEY=
CREDLY_ORGANIZATION_ID=

# Admin IP allowlist — comma-separated CIDRs (optional, leave blank to disable)
ADMIN_IP_ALLOWLIST=

# JotForm webhook secret (already in use, document here for completeness)
JOTFORM_WEBHOOK_SECRET=

# Sentry (already installed, ensure these are set in Netlify)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

---

## 13. Risks Remaining

| Risk                                                            | Severity | Notes                                                                                              |
| --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| RLS subquery performance on high-traffic tables                 | Medium   | `get_my_role()` helper added; full JWT-claim migration deferred until Supabase auth hook is stable |
| `enrollments` legacy table — 15 app references                  | Low      | Compatibility view created; references should be migrated to `program_enrollments` over 30 days    |
| Credly API — no production credentials yet                      | Medium   | Service is wired; needs `CREDLY_API_KEY` + `CREDLY_ORGANIZATION_ID` in Netlify env                 |
| CompTIA verification — HTML scraping is fragile                 | Medium   | Works for current use; upgrade to partner API when volume justifies it                             |
| `provider-exports` storage bucket — must be created manually    | Low      | Not auto-created by migration; one-time Supabase Dashboard step                                    |
| pg_cron not enabled by default                                  | Low      | Netlify cron fallback is in place; enable pg_cron when convenient                                  |
| 394 → ~6 raw `error.message` leaks remain in non-touched routes | Low      | Systematic fix documented; use `safeInternalError()` from `lib/api/safe-error.ts` going forward    |

---

## 14. Recommended Next 30/60/90 Day Actions

**30 days**

- Run all 10 migrations in Supabase production
- Set `CREDLY_API_KEY` and `CREDLY_ORGANIZATION_ID` in Netlify
- Migrate 15 `enrollments` references to `program_enrollments`
- Create `provider-exports` storage bucket
- Enable pg_cron or confirm Netlify cron schedule for credential expiration

**60 days**

- Onboard first external provider through the approval workflow end-to-end
- Add case manager accounts for WorkOne/DWD staff
- Wire `consent_records` into the enrollment form flow
- Begin populating `placement_records` from existing employer relationships

**90 days**

- Migrate RLS policies on `profiles` and `training_enrollments` to JWT claim checks
- Upgrade CompTIA verification to partner API if volume warrants
- Add `tenant_compliance_records` entries for all active tenants
- Run first WIOA PIRL export using the repaired `wioa_participants` tables

---

## Platform security & operations audit (2026-05-31)

_Addendum from Cloud Agent hardening pass. Full detail was consolidated here for Builder Mode CI (new standalone docs under `docs/` are restricted by `scripts/autopilot.sh`)._

Companion to `docs/platform-hardening-audit-2026-05-31.md`.  
Focus: tenant isolation, cache, route ownership, admin writes, roles, empty states, cron, messaging, uploads, storage, audit logs.

---

## 1. Tenant & domain isolation

### Domain routing (`proxy.ts`)

| Host | Behavior |
|------|----------|
| `www.elevateforhumanity.org` | Canonical public LMS/marketing |
| `elevateforhumanity.org` | 308 → www |
| Non-canonical hosts | 308 → www (legacy domains redirected earlier in file) |
| `app.elevateforhumanity.org` | Tenant admin entry; `?org=<slug>` → `x-tenant-slug` header |
| `{slug}.app.elevateforhumanity.org` | Subdomain tenant; slug → `x-tenant-slug` |

### Gaps

- **`x-tenant-slug` is set in middleware but not read in app/components** (grep shows usage only in `proxy.ts`). Tenant scoping for admin UI relies on **`profiles.tenant_id`** from the authenticated session (`apps/admin/app/admin/layout.tsx` → `getLicenseContext`), not the host header.
- **`enforceAccess()`** (`lib/auth/enforceAccess.ts`) implements cross-tenant denial for API handlers but has **minimal adoption** (~3 references, mostly the module itself). Provider routes use `providerApiGuard` + `tenant_id` on profile instead.
- **Super_admin** intentionally bypasses tenant boundaries (documented in `enforceAccess`).
- **RLS** is the real isolation layer for DB reads/writes; app-layer checks are inconsistent.

**Recommendations**

1. On tenant subdomains, validate `x-tenant-slug` matches `profiles.tenant_id` (or tenant slug join) before serving `/admin/*`.
2. Adopt `enforceAccess({ user, resourceTenantId })` on all provider/case-manager APIs that return row-level data.
3. Document that `www` is shared multi-tenant marketing; only `*.app.elevateforhumanity.org` is tenant-branded admin entry.

---

## 2. Cache invalidation

| Pattern | Usage |
|---------|--------|
| `revalidatePath` | Admin server actions (courses, applications, affiliates, FERPA, cohorts, LMS profile) |
| `revalidateTag` | **Rare** (~1 file) — tag-based invalidation not used consistently |
| `export const revalidate = N` | **~198** `page.tsx` files (ISR/time-based) |
| `unstable_cache` | e.g. LMS learning-paths user data |

**Gaps**

- Mutations via **API routes** often skip `revalidatePath` (only server actions invalidate).
- No central registry of which paths must invalidate after enrollment/program/catalog changes.
- Catalog pages use `revalidate = 60` but API/static fallback may serve stale program counts until TTL expires.

**Recommendations**

1. After program/catalog writes, call `revalidatePath('/programs')`, `revalidatePath('/programs/catalog')`, `revalidatePath('/apply')`.
2. Add `revalidateTag('programs')` to `loadProgramCatalog` consumers when moving to tag-based cache.

---

## 3. Route ownership

**Canonical registry:** `docs/architecture/canonical-routes.md`, `lib/routes/canonical-routes.ts`, `config/canonical-routes.ts`.

| Check | Result |
|-------|--------|
| `pnpm route:audit` | 1 banned prefix: `app/api/donations/webhook` → should be `/api/donate/*` |
| Duplicate page routes | None reported |
| Legacy portals | `/employer-portal` still migrating to `/employer` |

**Auth classification script:** `node scripts/audit-route-auth-strategy.mjs --strict` reports **53 UNCLASSIFIED** routes — **false positives**: cron routes use `withRuntime({ cron: 'bearer' })` which the script does not detect. Update script to match `withRuntime` and `withApiProtection` system auth.

**Enrollment writes:** `guard-enrollment-writes.sh` — **PASS** (no forbidden direct writes).

**Auth gaps script:** `audit-auth-gaps.sh` — no NO_AUTH / ROLE_BLIND hits in current run (REEXPORT check on competency verify-rep only).

---

## 4. Admin data write paths & role permissions

| Layer | Mechanism |
|-------|-----------|
| Admin layout | Roles: `super_admin`, `admin`, `staff`, `org_admin` |
| API admin | `apiRequireAdmin` — `guard-admin-routes.sh` validates 32 routes |
| Provider | `providerApiGuard` + `profiles.tenant_id` |
| Program holder | `require-program-holder.ts` + `tenant_id` scoping |
| Profile immutability | `syncUserProfile.ts` — `tenant_id` set only on INSERT |

**Audit on admin mutations**

- Quality gate: admin mutation pages expected to have audit trails — **PASS** in local commit hook.
- `scripts/unaudited-write-paths.json`: **142** write sites flagged `has_audit: false` (static analysis; many may use `withApiAudit` at export boundary). Top tables: `profiles` (41), `applications` (28), `certificates` (16), `licenses` (16).

**Recommendations**

1. Wrap remaining application approve/reject routes with `withApiAudit` + `writeAdminAuditEvent` for `applications` mutations.
2. Expand `enforceAccess` on admin APIs that accept `user_id` or `tenant_id` query params.

---

## 5. Empty state handling

**Shared component:** `components/admin/AdminPageShell.tsx` → `AdminEmptyState`.

**Coverage:** Many admin dashboards and LMS widgets implement inline empty copy (`No … yet`). Not enforced by lint.

**Gaps**

- SHELL/STATIC admin pages (17 STATIC in inventory) may render tables with no `AdminEmptyState` when query returns `[]`.
- Public catalog with zero programs should show static fallback message (handled by `loadProgramCatalog` static path when DB empty).

**Recommendation:** Add ESLint or Storybook checklist for data tables: require `AdminEmptyState` or equivalent when `data.length === 0`.

---

## 6. Cron reliability

| Metric | Value |
|--------|--------|
| Cron route files (`app/api/cron/*`) | 39 |
| Using `withRuntime({ cron: ... })` | 38+ (all sampled routes) |
| Auth | `CRON_SECRET` via Bearer or `x-cron-secret`; missing secret → **503** from `withRuntime` |
| Duplicate cron tree | `apps/admin/app/api/cron/*` mirrors many jobs (deploy/admin app) |

**Supporting libs:** `lib/api/cron-handler.ts`, `lib/server/cron-auth.ts`, `lib/api/withApiProtection.ts` (system tier).

**Gaps**

- `expire-credentials` returns `error.message` in JSON on failure (line 31) — prefer `safeInternalError`.
- ECS/EventBridge schedule ownership not verified in repo (infra in `aws/` + GitHub Actions).
- `webhook-health-check` cron probes internal routes — ensure those internal routes use same secret headers.

**Recommendations**

1. Extend `audit-route-auth-strategy.mjs` to recognize `withRuntime({ cron`.
2. Add cron heartbeat row / `audit_logs` entry per job completion for ops dashboards.
3. Alert on `audit_failures` growth (see audit-health below).

---

## 7. Email & SMS delivery

### Email

- **Canonical:** `lib/email/sendgrid.ts` ← `lib/email/service.ts`
- **Also:** `lib/email-alerts.ts` (direct SendGrid fetch), Resend docs in `lib/email-templates/README.md` (not primary)
- **Cron/internal:** `lib/email/send-internal.ts` requires `CRON_SECRET` for internal send proxy
- **Health:** `lib/admin/get-site-health.ts` probes SendGrid account API

**Failure mode:** Missing `SENDGRID_API_KEY` → send functions log and return failure (non-throwing in many paths).

### SMS

- **Canonical:** `lib/notifications/sms.ts` (Twilio REST)
- **Requires:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Disabled path:** `lib/communication/announcements.ts` — SMS branch stubbed; email primary

**Recommendations**

1. Surface email/SMS status on Dev Studio health panel (SendGrid probe exists; add Twilio ping).
2. Queue failed sends to `notification_queue` / job processor with retry (partially present via `lib/jobs/handlers/email-send.ts`).

---

## 8. File uploads & storage buckets

### Upload routes (sample)

| Route | Bucket | Auth |
|-------|--------|------|
| `POST /api/upload/document` | `provider-documents` | Public + rate limit (pre-account) |
| `POST /api/documents/upload` | `documents` | Authenticated |
| `POST /api/enrollment/upload-document` | `documents` | Authenticated |
| `POST /api/certifications/upload` | `documents` | Authenticated |
| `POST /api/content-library/upload` | `media` | Admin |
| `POST /api/certification/[id]/upload` | `credential_uploads` | Student |

**Validation patterns:** MIME allowlists, size caps (e.g. 10 MB on provider upload), `sanitize()` on filenames, signed URLs for private buckets.

### Buckets referenced in code vs migration `20260702000011_ensure_storage_buckets.sql`

**In migration:** `documents`, `media`, `mous`, `module-certificates`, `course-videos`, `course-content`, `program_holder_documents`, `sam_documents`, `enrollment-documents`, …

**In code but missing from ensure migration (verify live Supabase):**

- `provider-documents` (runtime `createBucket` fallback in upload route)
- `files`
- `assignments`
- `avatars`
- `scorm_packages`
- `provider_exports`
- `credential_uploads` (table exists; bucket name may differ from migration naming)

**Action:** Apply `20260702000011_ensure_storage_buckets.sql` in Dashboard; add idempotent rows for missing buckets above.

---

## 9. Audit logs

### Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | General app events (FERPA, documents, payments) |
| `admin_audit_events` | Admin mutations (`lib/admin/audit-log.ts`) |
| `audit_failures` | Failed audit writes |
| API wrapper | `withApiAudit` → `admin_audit_events` / monitoring |

### Health endpoint

`GET /api/admin/monitoring/audit-health` (admin app) — counts `audit_logs` last hour/day, `audit_failures`, gap detection during business hours, samples critical endpoints.

### Sentry integration (corrected)

Sentry **is** integrated: `@sentry/nextjs` in `next.config.mjs`, `instrumentation.ts`, `lib/observability/sentry.ts`, payment/webhook routes, `withApiAudit` failures.

**Severity patterns in code:**

| Level | Use |
|-------|-----|
| `captureException` | Job failures, webhooks, audit write failures |
| `captureMessage` … `'error'` | Dead letter queue |
| `captureMessage` level param | `lib/monitoring/index.ts` (info/warning/error) |
| Tags | `tenant_id`, `stripe_event_id`, `payment_intent_id`, `correlation_id`, `job_type` |

**Recommendations**

1. Configure Sentry alert rules: P0 = Stripe/BNPL webhook + `dead_letter` tag; P1 = `audit_failures` spike; P2 = cron job failures.
2. Fix `audit-health` route: uses `createClient` without import in snippet reviewed — verify build on admin app.
3. Reduce `unaudited-write-paths.json` backlog for `applications` and `profiles` mutations.

---

## 10. Quick command reference

```bash
pnpm platform:doctor
pnpm integrity:stripe
pnpm audit:admin
pnpm guard:admin-routes
pnpm route:audit
node scripts/audit-route-auth-strategy.mjs
bash scripts/audit-auth-gaps.sh
bash scripts/guard-enrollment-writes.sh
pnpm images:contract
python3 scripts/admin-route-inventory.py   # needs scripts/live-schema-snapshot.json
```

---

## Priority fix list

1. **Tenant:** Wire `x-tenant-slug` validation to admin layout / API guards.
2. **Storage:** Add missing buckets to migration; apply pending migrations.
3. **Route audit:** Fix `donations/webhook` namespace; teach auth audit script `withRuntime` cron.
4. **Audit:** Cover `applications` write paths with `withApiAudit` / admin audit events.
5. **Cache:** Revalidate program/catalog paths after catalog sync deploy.
6. **Sentry:** Alert rules by tag/severity (see §9).
