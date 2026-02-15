# Elevate LMS — Critical Security Findings

Generated: 2026-02-14
Source: Live database analysis + migration policy audit
Severity: Ranked by data exposure risk (rows * sensitivity)

## Finding 1: ZERO tenant-level RLS enforcement across entire database

**Severity: CRITICAL**
**Tables affected**: All 58 tables with tenant_id or organization_id
**Operations**: SELECT, INSERT, UPDATE, DELETE

No RLS policy in the database references `tenant_id` or `organization_id`.
Tenant isolation is entirely application-side. If any API route fails to filter
by tenant, data leaks across tenants.

**Impact**: In a multi-tenant deployment, Tenant A's admin could read/modify Tenant B's
data through any endpoint that doesn't explicitly add `.eq('tenant_id', ctx.tenantId)`.

**Fix**: Add tenant-scoped RLS policies to all 58 scoped tables:
```sql
-- For each scoped table:
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "{table}_tenant_isolation" ON {table}
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## Finding 2: programs table — RLS disabled, 55 rows, tenant_id + org_id columns

**Severity: HIGH**
**Table**: programs (55 rows, 42 active)
**Scope columns**: tenant_id, organization_id, partner_id

RLS is not enabled. All 55 programs are readable by anonymous users.
Programs contain pricing (total_cost, toolkit_cost), placement rates,
and partner relationships.

**Fix**:
```sql
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_public_read" ON programs
  FOR SELECT USING (status = 'active' AND is_active = true);
CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
```

---

## Finding 3: users table — 669 rows, org_id column, NO RLS, NO policies

**Severity: HIGH**
**Table**: users (669 rows)
**Scope column**: organization_id

This appears to be a separate user table from profiles (514 rows).
No RLS, no policies. All 669 rows are accessible.

**Fix**: Enable RLS, add user-scoped read + admin write policies.

---

## Finding 4: profiles table — 514 rows, tenant_id + org_id, no tenant predicate

**Severity: HIGH**
**Table**: profiles (514 rows)
**Scope columns**: tenant_id, organization_id

RLS is enabled with 3 policies, but none reference tenant_id.
Policies only check `auth.uid() = id` (own row) and admin role.
In multi-tenant mode, an admin in Tenant A could read all profiles.

**Fix**: Add tenant predicate to existing policies:
```sql
-- Add to profiles_own_read:
USING (id = auth.uid() AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
```

---

## Finding 5: licenses table — SELECT USING (true), exposes all license keys

**Severity: HIGH**
**Table**: licenses (5 rows)
**Scope column**: tenant_id

`licenses_select` policy uses `USING (true)` — any authenticated user can read
all license records including license_key, stripe_customer_id, stripe_subscription_id.

**Fix**:
```sql
DROP POLICY "licenses_select" ON licenses;
CREATE POLICY "licenses_own_tenant" ON licenses
  FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## Finding 6: sfc_tax_returns + sfc_tax_documents — USING (true) WITH CHECK (true)

**Severity: HIGH**
**Tables**: sfc_tax_returns, sfc_tax_documents
**Operations**: ALL (SELECT, INSERT, UPDATE, DELETE)

Both tables have a single policy: `FOR ALL USING (true) WITH CHECK (true)`.
Any authenticated user can read, create, modify, or delete any tax return or document.
Tax returns contain SSN, income data, and filing status.

**Fix**: Restrict to service role + owner:
```sql
DROP POLICY "sfc_tax_returns_service_all" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_own" ON sfc_tax_returns
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sfc_tax_returns_admin" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
```

---

## Finding 7: organization_users — 1 row, NO RLS, NO policies

**Severity: MEDIUM**
**Table**: organization_users (1 row)
**Scope column**: organization_id

Maps users to organizations with roles. No access control.
An attacker could insert themselves as admin of any organization.

**Fix**: Enable RLS, restrict INSERT/UPDATE/DELETE to super_admin.

---

## Finding 8: marketing_campaigns + marketing_contacts — tenant_id, NO RLS

**Severity: MEDIUM**
**Tables**: marketing_campaigns (5 rows), marketing_contacts (5 rows)
**Scope column**: tenant_id

No RLS enabled. Contact data (emails, names) exposed.

**Fix**: Enable RLS with tenant isolation policies.

---

## Finding 9: tenant_licenses + tenant_memberships — tenant_id, NO RLS

**Severity: MEDIUM**
**Tables**: tenant_licenses (1 row), tenant_memberships (1 row)
**Scope column**: tenant_id

Stripe subscription data and membership records unprotected.

**Fix**: Enable RLS with tenant isolation policies.

---

## Finding 10: audit_logs INSERT — WITH CHECK (true)

**Severity: LOW**
**Table**: audit_logs
**Operation**: INSERT

`audit_logs_insert` policy uses `WITH CHECK (true)` — any authenticated user
can insert arbitrary audit log entries, potentially poisoning the audit trail.

**Fix**:
```sql
DROP POLICY "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert_own" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
```

---

## Console Summary

```
Total tables:                    551
Total scoped tables:             58
Scoped tables with RLS off:      49
Scoped tables with data + RLS off: 12
Scoped tables with missing tenant predicates: 58 (ALL of them)
Tables with USING(true) or WITH CHECK(true): 14 policies across 12 tables
```

## Queries Used

```
1. RLS status: grep "ENABLE ROW LEVEL SECURITY" across 493 migration files
2. Policy extraction: regex parse of CREATE POLICY from migrations (333 total, 68 DROP)
3. Tenant predicate search: grep for tenant_id/organization_id in all policy USING/WITH CHECK
4. Live verification: anon key queries vs service role queries on all 118 tables with data
5. INSERT test: anon key INSERT attempts on 18 key tables (all blocked)
```
