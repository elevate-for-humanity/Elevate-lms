# Elevate LMS — Tenancy Enforcement Matrix

Generated: 2026-02-14
Source: Schema analysis + migration policy parsing + live anon/service-role testing
Method: For each table with tenant_id or organization_id, checked whether RLS policies
        constrain access by tenant/org for each CRUD operation

## Enforcement Legend

- **ENFORCED**: RLS policy predicate explicitly constrains by tenant_id or organization_id
- **PARTIAL**: RLS policies exist but constrain only by auth.uid() or role check, not tenant/org
- **NOT ENFORCED**: No DB-level tenancy predicate exists for that operation (RLS off or no policy)

## Critical Finding

**Zero tables enforce tenancy at the database level.**

No RLS policy in the entire database references `tenant_id` or `organization_id` in its
USING or WITH CHECK predicate. Tenancy isolation is entirely application-side (code filters).

## Matrix: Tables with tenant_id and/or organization_id

| Table | Scope | Rows | RLS | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|-------|------|-----|--------|--------|--------|--------|-------|
| license_agreement_acceptances | organization_id | 21 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | No policies |
| license_events | tenant_id + organization_id | 1 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | No policies |
| license_usage | tenant_id | 1 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| licenses | tenant_id | 5 | ON | PARTIAL | PARTIAL | PARTIAL | PARTIAL |  |
| marketing_campaigns | tenant_id | 5 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| marketing_contacts | tenant_id | 5 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| organization_settings | organization_id | 1 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | No policies |
| organization_users | organization_id | 1 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| profiles | tenant_id + organization_id | 514 | ON | PARTIAL | PARTIAL | PARTIAL | PARTIAL |  |
| program_holder_applications | tenant_id | 3 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, HAS DATA |
| programs | tenant_id + organization_id | 55 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| student_applications | tenant_id | 4 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, HAS DATA |
| tenant_licenses | tenant_id | 1 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| tenant_memberships | tenant_id | 1 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| users | organization_id | 669 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| v_active_programs | organization_id | 43 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| v_published_programs | organization_id | 43 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies, HAS DATA |
| ai_generated_courses | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| api_keys | tenant_id | 0 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED |  |
| benefits_plans | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| billing_cycles | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| data_retention_policies | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| departments | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| employees | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| employer_applications | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled |
| holidays | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| invoices | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| ip_access_control | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| leave_policies | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| license_purchases | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled |
| license_violations | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled |
| meeting_recaps | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| moderation_rules | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| org_invites | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| organization_subscriptions | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| payments | organization_id | 0 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | No policies |
| payroll_runs | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| permission_groups | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| positions | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| program_holder_documents | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| provisioning_events | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled |
| sso_providers | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| staff_applications | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled |
| student_next_steps | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| subscriptions | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_branding | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_domains | tenant_id | 0 | ON | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | No policies |
| tenant_invitations | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_members | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_settings | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_stripe_customers | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_subscriptions | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_usage | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| tenant_usage_daily | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| trial_signups | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| user_permissions | tenant_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |
| user_roles | tenant_id | 0 | ON | PARTIAL | PARTIAL | PARTIAL | PARTIAL |  |
| workone_checklist | organization_id | 0 | **OFF** | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | NOT ENFORCED | RLS disabled, No policies |

## Policy Predicate Examples

The closest policies to tenancy enforcement use auth.uid() or role checks, not tenant_id:

### Example 1: profiles (PARTIAL — auth.uid() only)
```sql
CREATE POLICY "profiles_own_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());
-- No tenant_id filter. Any authenticated user can read their own row regardless of tenant.
```

### Example 2: enrollments (PARTIAL — auth.uid() + admin role)
```sql
CREATE POLICY "enrollments_student_own" ON public.enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());
-- Scoped to own rows, but no tenant_id check. Cross-tenant admin could see all.
```

### Example 3: licenses (NOT ENFORCED for SELECT)
```sql
CREATE POLICY "licenses_select" ON licenses FOR SELECT USING (true);
-- Any authenticated user can read ALL license records across all tenants.
```

### Example 4: programs (NOT ENFORCED — no RLS)
```sql
-- programs table has tenant_id + organization_id columns but:
-- RLS is NOT enabled
-- No policies exist
-- All 55 programs are readable by anon
```

### Example 5: sfc_tax_returns (OPEN — all operations)
```sql
CREATE POLICY sfc_tax_returns_service_all ON public.sfc_tax_returns
  FOR ALL USING (true) WITH CHECK (true);
-- Completely open to any authenticated user for all operations.
```

## Tables with Data Where Tenancy is NOT ENFORCED

| Table | Scope | Rows | Risk |
|-------|-------|------|------|
| license_usage | tenant_id | 1 | RLS disabled, no policies |
| marketing_campaigns | tenant_id | 5 | RLS disabled, no policies |
| marketing_contacts | tenant_id | 5 | RLS disabled, no policies |
| organization_users | organization_id | 1 | RLS disabled, no policies |
| program_holder_applications | tenant_id | 3 | RLS disabled, no policies |
| programs | tenant_id + organization_id | 55 | RLS disabled, no policies |
| student_applications | tenant_id | 4 | RLS disabled, no policies |
| tenant_licenses | tenant_id | 1 | RLS disabled, no policies |
| tenant_memberships | tenant_id | 1 | RLS disabled, no policies |
| users | organization_id | 669 | RLS disabled, no policies |
| v_active_programs | organization_id | 43 | RLS disabled, no policies |
| v_published_programs | organization_id | 43 | RLS disabled, no policies |

## Queries Used

```
1. Scope detection:
   OpenAPI spec column analysis for tenant_id / organization_id presence

2. RLS status:
   Migration file grep for "ENABLE ROW LEVEL SECURITY"
   Live verification: anon vs service-role row count comparison

3. Policy predicate analysis:
   Regex extraction of USING/WITH CHECK clauses from all CREATE POLICY statements
   Searched for: tenant_id, organization_id, auth.jwt() ->> 'tenant_id'
   Result: 0 policies reference tenant_id or organization_id

4. Enforcement classification:
   ENFORCED = policy predicate contains tenant_id/organization_id
   PARTIAL = policy exists with auth.uid() or role check but no tenant scope
   NOT ENFORCED = no RLS or no policy for that operation
```
