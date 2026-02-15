# Elevate LMS — Tenancy Model Report

Generated: 2026-02-14 | Source: Live Supabase + codebase trace

## Summary

Elevate LMS is architecturally multi-tenant with two parallel isolation models.
Currently operates as single-tenant ("Elevate for Humanity") but the SaaS licensing
pipeline is wired and has 5 license records.

## Model 1: Organization (Training Provider)

**Purpose**: Group users under a training organization for program delivery.

### Data Flow
```
profiles.organization_id → organizations.id
programs.organization_id → organizations.id
organization_users (user_id, organization_id, role)
organization_settings (organization_id, config)
```

### Live State
- 1 organization: "Elevate for Humanity" (slug: `elevate-for-humanity`, type: `training_provider`)
- All 55 programs linked to this org
- `organization_users` table maps users to orgs with roles

### Code Entry Points
- `lib/org/getOrgContext.ts` — resolves user → org via profile + organization_users join
- `lib/org/bindUserToOrg.ts` — assigns user to org
- `lib/org/switchOrg.ts` — changes active org (multi-org ready)
- `lib/org/getOrgConfig.ts` — reads org-level settings
- `lib/org/featureEnabled.ts` — org-level feature flags
- `lib/org/checkLimits.ts` — org-level usage limits
- `lib/org/getFundingRules.ts` — org-level funding configuration
- `lib/org/isDeliveryAllowed.ts` — org-level delivery restrictions
- `lib/org/reportingEnabled.ts` — org-level reporting toggle

## Model 2: Tenant (SaaS License)

**Purpose**: Isolate data for white-label LMS deployments sold as SaaS.

### Data Flow
```
profiles.tenant_id → tenants.id
programs.tenant_id → tenants.id (same UUID as org for Elevate's own programs)
licenses.tenant_id → tenants.id
tenant_licenses.tenant_id → tenants.id (Stripe binding)
```

### Live State
- `tenants` table exists (empty — provisioning creates records)
- 5 `licenses` records: 4 active trials (5 users each), 1 expired
- `tenant_licenses` table exists with Stripe subscription fields

### Provisioning Flow
`lib/store/provision-tenant.ts`:
1. Check if email already has tenant
2. Create `tenants` record (name, slug, settings with product/license IDs)
3. Update `licenses.tenant_id`
4. Create or update auth user with `user_metadata.tenant_id`
5. Create `profiles` record with `tenant_id` and `role: admin`
6. Audit log the provisioning
7. Send welcome email with credentials

### Security
- `lib/tenant/getTenantContext.ts` — extracts tenant_id from JWT claims or user_metadata
- `lib/tenant/requireTenant.ts` — rejects client-side tenant_id in body/query params
- `lib/auth/syncUserProfile.ts` — tenant_id is immutable after initial INSERT
- `lib/tenant/domain-resolver.ts` — resolves custom domains to organizations

### License Enforcement
- `lib/licenseGuard.ts` — checks tenant_licenses for plan limits
- Plan tiers: starter (5 employers/25 apprentices/$99), pro (25/150/$499), enterprise (999/9999/$2,499)
- `licenses` table: license_key, domain, tier, status, max_users, features, Stripe IDs

## Relationship Between Models

The two models serve different purposes:
- **Organization** = who delivers training (Elevate for Humanity)
- **Tenant** = who owns the LMS instance (SaaS customer)

For Elevate's own operations, the org and tenant are the same entity.
For SaaS customers, a new tenant is provisioned with its own org.

Programs have both `organization_id` and `tenant_id` columns, plus `partner_id`
for programs delivered through partner organizations.

## RBAC Layer

### roles table (6 system roles)
| Role | Description |
|------|-------------|
| super_admin | Full system access |
| admin | Organization administrator |
| instructor | Course instructor |
| student | Course student |
| case_manager | Case manager |
| program_holder | Program holder |

### permissions table (16 permissions)
Covers: courses (view/create/edit/delete), users (view/create/edit/delete),
enrollments (view/create), reports (view/export), plus additional resource.action pairs.

### Current Usage
- `profiles.role` — simple string role (used by partner portal, admin guards)
- `roles` + `permissions` tables — RBAC system exists but `user_roles` join table is empty
- Dual system: profile.role for quick checks, roles/permissions for fine-grained access

## Partner Isolation

Partners are isolated through a separate chain:
```
profiles.role = 'partner' → shop_staff.user_id → shops.id → apprentice_placements.shop_id
```

Partner data access uses service role client (`createAdminClient()`) to bypass per-user RLS,
scoped by the shop IDs from the partner's context.
