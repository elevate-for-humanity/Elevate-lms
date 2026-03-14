# Platform Readiness Implementation Plan

**Date:** 2025  
**Branch:** feature/hub-architecture-positioning  
**Purpose:** Execution plan for transforming the platform into a production-safe multi-provider workforce hub.

---

## Phase 0 Audit Findings

### What Already Exists (do not rebuild)

| Item | Location | Notes |
|------|----------|-------|
| `/api/health` | `app/api/health/route.ts` | Full DB, Stripe, SendGrid, audit integrity checks |
| `provider_admin` role | `lib/rbac.ts` | Defined in AppRole union, hierarchy level 50 |
| `case_manager` references | `supabase/migrations/20260224000002_add_missing_columns.sql`, `20260312900003_governance_rbac_seed.sql` | Table and RBAC seed exist; no portal page |
| `audit_logs` | `supabase/migrations/20260118000001_audit_logs.sql` | Canonical table |
| `admin_audit_events` | `supabase/migrations/20260226000003_program_holder_governance.sql` | Immutable, service_role insert only |
| `compliance_audit_log` | `supabase/migrations/20260203000003_enterprise_compliance_enforcement.sql` | Exists |
| `partner_audit_log` | `supabase/migrations/20260124000002_partner_shop_system.sql` | Exists |
| `franchise_audit_log` | `supabase/migrations/20260125000000_franchise_management.sql` | Exists |
| `course_audit_log` | `supabase/migrations/20260315000001_course_factory_schema.sql` | Exists |
| `audit_failures` | `supabase/migrations/20260228000003_audit_failures_table.sql` | Exists |
| `app/api/privacy/delete` | `app/api/privacy/delete/route.ts` | GDPR/CCPA deletion route exists |
| `app/api/privacy/export` | `app/api/privacy/export/route.ts` | Export route exists |
| `job_queue` | `supabase/migrations/20260319000002_job_queue.sql` | Table + handlers in `lib/jobs/` |
| `credentials` registry | `supabase/migrations/20260317000002_credential_registry.sql` | Three-lane model, full schema |
| `learner_credentials` | same migration | Revocation, expiry fields present |
| `wioa_pirl_mappings` | `supabase/migrations/20260217300000_wioa_pirl_reporting.sql` | ETA-9170-PY25 seeded |
| `tenants` table | `supabase/migrations/20260227000003_schema_governance_baseline.sql` | Exists, missing `type` column |
| `organizations` table | same migration | Exists, not FK-linked to tenants |
| `employers` table | `supabase/migrations/20260227000004_schema_governance_baseline_batch2.sql` | Exists |
| `job_postings` | same migration | Exists, not matched to program completers |
| `program_holders` | `supabase/migrations/20260226000003_program_holder_governance.sql` | MOU model, atomic approval RPC |
| `funding_source` on enrollments | `supabase/migrations/20260306110000_program_enrollments_barber_columns.sql` | Column exists, no structured funding record |

### What Is Genuinely Missing

| Item | Phase | Migration Needed |
|------|-------|-----------------|
| `tenants.type` column | 1.1 | Yes |
| `organizations.tenant_id` FK | 1.1 | Yes |
| `provider_admin` RLS tenant isolation policies | 1.2 | Yes |
| `provider_program_approvals` table | 1.3 | Yes |
| `placement_records` table | 2.1 | Yes |
| Employer-program matching logic | 2.3 | API only |
| Credential expiration cron/job | 3.1 | Yes (pg_cron or job queue) |
| Credly API service | 3.2 | No migration, service + env vars |
| CompTIA verification API | 3.3 | No migration, service + env vars |
| Case manager portal page | 4 | No migration, UI only |
| Unified audit SQL view | 5.1 | Yes |
| `data_deletion_requests` table | 5.2 | Yes |
| `consent_records` table | 5.3 | Yes |
| `enrollment_funding_records` table | 9 | Yes |
| WIOA table dependency verification | 9 | Repair migration if needed |

### Naming Conflicts / Duplicate Patterns

- `enrollments` vs `program_enrollments` vs `training_enrollments` — three overlapping tables. Source of truth is `program_enrollments` per migration comments. Consolidation is Phase 10.
- `audit_logs` (canonical) vs 6 other audit tables — unified view is Phase 5.1.
- `lib/rbac.ts` uses profile subquery for role; `lib/admin/guards.ts` uses `apiAuthGuard`/`apiRequireAdmin`. Both patterns coexist. New routes must use `lib/admin/guards.ts` canonical helpers.
- `provider_admin` is in `lib/rbac.ts` AppRole union but missing from most RLS policies — Phase 1.2 adds it.

### File Paths to Modify

| File | Phase | Change |
|------|-------|--------|
| `supabase/migrations/20260320000001_tenant_type_org_link.sql` | 1.1 | New migration |
| `supabase/migrations/20260320000002_provider_admin_rls.sql` | 1.2 | New migration |
| `supabase/migrations/20260320000003_provider_program_approvals.sql` | 1.3 | New migration |
| `supabase/migrations/20260320000004_placement_records.sql` | 2.1 | New migration |
| `supabase/migrations/20260320000005_credential_expiration_job.sql` | 3.1 | New migration |
| `supabase/migrations/20260320000006_unified_audit_view.sql` | 5.1 | New migration |
| `supabase/migrations/20260320000007_data_deletion_requests.sql` | 5.2 | New migration |
| `supabase/migrations/20260320000008_consent_records.sql` | 5.3 | New migration |
| `supabase/migrations/20260320000009_enrollment_funding_records.sql` | 9 | New migration |
| `supabase/migrations/20260320000010_wioa_dependency_verify.sql` | 9 | New migration |
| `app/api/placements/route.ts` | 2.2 | New route |
| `app/api/placements/[id]/route.ts` | 2.2 | New route |
| `app/api/provider/programs/submit/route.ts` | 1.3 | New route |
| `app/api/provider/programs/[id]/review/route.ts` | 1.3 | New route |
| `app/api/credentials/expire/route.ts` | 3.1 | New cron route |
| `app/api/employer/matches/route.ts` | 2.3 | New route |
| `lib/credentials/credly.ts` | 3.2 | New service |
| `lib/credentials/verification.ts` | 3.3 | New service |
| `app/case-manager/dashboard/page.tsx` | 4 | New page |
| `app/admin/job-queue/page.tsx` | 7 | New page |
| `app/admin/impersonate/page.tsx` | 7 | New page |
| `app/api/admin/impersonate/route.ts` | 7 | New route |
| `app/api/provider/export/route.ts` | 8 | New route |

---

## Execution Order

Phases execute in strict dependency order:

1. **Phase 1** — schema foundation (tenants, orgs, provider_admin, approvals)
2. **Phase 2** — placement pipeline (depends on employers + programs existing)
3. **Phase 3** — credential lifecycle (depends on credential registry)
4. **Phase 4** — case manager portal (depends on role existing)
5. **Phase 5** — audit/compliance hardening (depends on all tables existing)
6. **Phase 6** — security hardening (cross-cutting, no schema deps)
7. **Phase 7** — operational tooling (depends on job queue)
8. **Phase 8** — provider export (depends on placement_records)
9. **Phase 9** — funding records + WIOA verification
10. **Phase 10** — RLS optimization + enrollment consolidation plan

---

## Environment Variables Required

```
# Credly (Phase 3.2)
CREDLY_API_KEY=
CREDLY_ORGANIZATION_ID=

# Sentry (Phase 7.3)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=

# JotForm HMAC (Phase 6.2)
JOTFORM_WEBHOOK_SECRET=

# Admin hardening (Phase 6.3)
ADMIN_IP_ALLOWLIST=  # comma-separated CIDRs, optional
```

---

## Deployment Notes

### Supabase
- Run migrations in order via Supabase Dashboard SQL editor or `supabase db push`
- Enable `pg_cron` extension if credential expiration uses DB-side scheduling
- Verify `wioa_participants` and `wioa_participant_records` tables exist before Phase 9

### Netlify
- Add new env vars before deploying Phase 3.2 (Credly) and Phase 7.3 (Sentry)
- New cron routes (`/api/credentials/expire`) should be added to Netlify scheduled functions config

### Cloudflare
- Add WAF rule blocking non-HMAC requests to `/api/jotform-webhook` (Phase 6.2)
- Consider rate-limit rule on `/api/provider/programs/submit` (Phase 1.3)
- Admin paths (`/admin/*`, `/case-manager/*`) can be protected with Cloudflare Access if Zero Trust is configured
