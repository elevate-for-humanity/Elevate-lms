# RLS Tenancy Lockdown — Migration Summary

Generated: 2026-02-14

## Execution Order

These two migrations must be applied in order:

### Migration 1: `20260214_add_tenant_id_to_core_tables.sql`

Adds `tenant_id` column to the 4 Tier-0 tables that lacked it, backfills from
profiles, adds composite indexes, and installs auto-populate triggers.

| Action | Count |
|--------|-------|
| ALTER TABLE (add column) | 4 |
| UPDATE (backfill) | 4 |
| CREATE INDEX | 5 |
| CREATE TRIGGER | 4 |

**Tables modified:**
- `enrollments` — adds `tenant_id uuid REFERENCES tenants(id)`
- `certificates` — adds `tenant_id uuid REFERENCES tenants(id)`
- `lesson_progress` — adds `tenant_id uuid REFERENCES tenants(id)`
- `apprentice_placements` — adds `tenant_id uuid REFERENCES tenants(id)`

**Backfill logic:** `UPDATE {table} SET tenant_id = p.tenant_id FROM profiles p WHERE {table}.user_id = p.id`

**Auto-populate trigger:** `auto_set_tenant_id()` fires BEFORE INSERT, resolves
tenant_id from user_id -> profiles, or student_id -> profiles, or auth.uid() -> profiles.

### Migration 2: `20260214_rls_tenancy_lockdown.sql`

Locks down dangerous policies, enables RLS on unprotected tables, and adds
tenant predicates using direct `tenant_id` column checks (no joins).

| Action | Count |
|--------|-------|
| DROP POLICY | 10 |
| CREATE POLICY | 30 |
| ENABLE ROW LEVEL SECURITY | 9 |
| `get_current_tenant_id()` refs | 15 |
| `is_super_admin()` refs | 19 |

#### Priority 1: Lock down USING(true) policies

| Table | Before | After |
|-------|--------|-------|
| sfc_tax_returns | `FOR ALL USING(true)` | Own-read + admin-only write |
| sfc_tax_documents | `FOR ALL USING(true)` | Owner-via-return read + admin-only write |
| licenses | `SELECT USING(true)` | `tenant_id = get_current_tenant_id()` |
| audit_logs | `INSERT WITH CHECK(true)` | `actor_id = auth.uid()` |

#### Priority 2: Enable RLS on 9 live scoped tables

| Table | Rows | Policies |
|-------|------|----------|
| programs | 55 | public read (active) + admin write |
| users | 669 | own-read + admin-all |
| organization_users | 1 | own-read + super_admin write |
| marketing_campaigns | 5 | tenant-scoped all |
| marketing_contacts | 5 | tenant-scoped all |
| tenant_licenses | 1 | tenant-read + super_admin write |
| tenant_memberships | 1 | tenant/own-read + super_admin write |
| license_usage | 1 | tenant-read + super_admin write |
| license_events | 1 | tenant-read + super_admin write |

#### Priority 3: Tenant predicates on Tier-0 tables (direct column)

| Table | Policy | Predicate |
|-------|--------|-----------|
| profiles | profiles_admin_all | `tenant_id = get_current_tenant_id()` |
| enrollments | enrollments_admin_all | `tenant_id = get_current_tenant_id()` |
| certificates | certificates_admin_* (3) | `tenant_id = get_current_tenant_id()` |
| apprentice_placements | placements_admin_all | `tenant_id = get_current_tenant_id()` |
| apprentice_placements | placements_partner_read | `shop_staff.shop_id` join |
| lesson_progress | lesson_progress_admin_read | `tenant_id = get_current_tenant_id()` |

## Before vs After

### Before (current production)
- 0 policies reference tenant_id
- 12 live scoped tables have no RLS
- 60 policies use USING(true)
- 4 Tier-0 tables lack tenant_id column
- Tenant isolation: application-side only

### After (both migrations applied)
- 15 policies reference get_current_tenant_id()
- 0 live scoped tables without RLS (all 12 covered)
- 4 dangerous USING(true) policies replaced
- 4 Tier-0 tables have native tenant_id with auto-populate triggers
- Tenant isolation: database-enforced on all Tier-0 tables

## Dependencies

All confirmed live on production:
- `public.get_current_tenant_id()` — returns tenant_id from profiles for auth.uid()
- `public.is_admin()` — checks if current user is admin
- `public.is_super_admin()` — checks if current user is super_admin

## How to apply

Run each statement individually in the Supabase SQL Editor (Dashboard > SQL Editor).
Apply Migration 1 first, then Migration 2.

## Full Migration Sequence (6 files, strict order)

| # | File | Purpose | Prerequisite |
|---|------|---------|--------------|
| 1 | `20260214_add_tenant_id_to_core_tables.sql` | Add tenant_id column + indexes + triggers to 6 tables | None |
| 2 | `20260214_backfill_tenant_id.sql` | Set tenant_id on all 501 NULL profiles + all downstream rows | Migration 1 |
| 3 | `20260214_rls_tenancy_lockdown.sql` | Lock down USING(true), enable RLS on 9 tables, add tenant predicates | Migrations 1+2 |
| 4 | `20260214_enforce_tenant_not_null.sql` | CHECK NOT VALID + VALIDATE on all 7 tables | Migrations 1+2+3 |
| 5 | `20260214_remove_null_tenant_fallbacks.sql` | Remove OR tenant_id IS NULL from all policies | Migration 4 |
| 6 | `20260214_partner_visibility_policies.sql` | Partner read policies + shops/shop_staff tenant policies + indexes | Migration 5 |

## NULL Tenancy Census (2026-02-14)

| Table | NULL tenant_id | Total | Source |
|-------|---------------|-------|--------|
| profiles | 501 | 514 | Batch seed 2026-01-17, all @student.elevate.edu |
| enrollments | 86 | 91 | Same seed batch |
| certificates | 0 | 2 | Both from tenanted users |
| lesson_progress | 0 | 5 | All from tenanted users |
| apprentice_placements | 0 | 1 | From tenanted user |

All 501 NULL profiles assigned to tenant `6ba71334` (Elevate for Humanity).
After backfill: zero NULLs across all 5 tables.

## State After Full Sequence

| Metric | Before | After |
|--------|--------|-------|
| NULL tenant_id in profiles | 501 | 0 |
| NULL tenant_id across all 7 tables | 86+ | 0 |
| Policies referencing tenant_id | 0 | 21 (15 lockdown + 6 partner) |
| Tables with native tenant_id | 1 (profiles) | 7 (+enrollments, certificates, lesson_progress, placements, shops, shop_staff) |
| Live scoped tables without RLS | 12 | 0 |
| USING(true) on sensitive tables | 4 | 0 |
| NULL fallbacks in policies | N/A | 0 |
| NOT NULL constraints on tenant_id | 0 | 7 |
| Indexes for RLS performance | 0 | 10 |
| Auto-populate triggers | 0 | 6 |
| Tenant isolation model | App-side only | DB-enforced, no escape hatches |

## Proof Test Suite

Run after applying all 6 migrations:
```
npx tsx scripts/test-tenancy-proof.ts
```

Pre-migration baseline: 42 passed, 12 failed (expected).
Post-migration target: 54 passed, 0 failed.

Tests cover:
1. Schema proof: tenant_id columns exist, zero NULLs
2. Policy proof: anon blocked from all sensitive tables
3. Write locks: anon INSERT/DELETE blocked on all relationship tables
4. Service role: reads work as expected
5. Tenant isolation: all rows belong to correct tenant
6. Relationship integrity: all FKs resolve

## Remaining work after full sequence

1. Add tenant predicates to remaining 44 scoped tables (Phase 2)
2. Lock down remaining 56 USING(true) policies on non-sensitive tables
3. Add tenant_id to program_enrollments, applications, quiz_attempts
4. Sync auth.users user_metadata.tenant_id for 501 backfilled profiles
5. Two-tenant isolation leak test (create Tenant B admin, verify zero cross-tenant reads)
