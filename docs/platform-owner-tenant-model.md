# Platform Owner Tenant Model

Elevate runs as a **multi-tenant platform** with a hard separation between the **platform owner** (you) and **customer tenants** (schools, boards, nonprofits, employers). This is the same pattern as Shopify, HubSpot, and HighLevel: you keep the master control plane; customers get isolated tenants on the shared core.

## Two products, one platform

| Product | Audience | What they get |
|---------|----------|----------------|
| **Elevate Workforce OS** | Training providers, workforce boards, employers | LMS, apprenticeships, ETPL, billing, white-label sites |
| **Elevate Dev Cloud** | Builders who want their own stack | Provisioned workspace: dashboard + LMS + site + DB + auth + AI |

The platform owner operates **both** products from `/admin` on `admin.elevateforhumanity.org`. Customer tenants never receive DevStudio, deployment controls, or Northflank operator access.

## Tenant hierarchy

```text
Platform Owner Tenant (is_platform_owner = true)
│
├── Your organizations (sibling orgs — NOT customer workspaces)
│   ├── Elevate for Humanity
│   ├── Prestige Elevation
│   ├── Curvature Body Sculpting
│   └── Rise Forward Foundation
│
└── Customer tenants (provisioned via Dev Cloud)
    ├── School A          → acme.elevatedev.ai
    ├── Workforce Board B
    ├── Nonprofit C
    └── Employer D
```

**Rule:** Your own brands are **organizations under the platform owner tenant**. They are not `customer_workspaces` rows. Dev Cloud subscribers get a **new tenant** (`tenants.type = 'customer'`) with `parent_tenant_id` pointing at the platform owner.

## Permission levels

| Level | Profile role | Tenant | Capabilities |
|-------|--------------|--------|--------------|
| **Platform Owner** | `super_admin` | Platform owner tenant | Deploy, DevStudio, AI Operator, Northflank, all tenants, workspace provisioning |
| **Platform Admin** | `admin`, `staff` | Platform owner tenant | Tenant management, billing, support — no deploy/DevStudio |
| **Organization Admin** | `org_admin`, `org_owner` | Any tenant | Single organization only |
| **Standard User** | `student`, `instructor`, … | Any tenant | Learner / portal access |

Canonical code: `lib/platform/permission-levels.ts`, `lib/platform/platform-owner.ts`.

## What platform owner gets

- Full `/admin` on `admin.elevateforhumanity.org`
- Dev Studio (`/admin/dev-studio`)
- AI Operator (Northflank deploy, code fix, autopilot)
- Mission Control / system health
- Tenant & workspace provisioning
- Billing management for all customers
- Deployment controls (Northflank, GitHub)

## What customer tenants get

- Tenant-scoped admin (future: `{slug}.elevatedev.ai/admin`)
- Their own LMS, website, users, branding, data (RLS by `tenant_id`)
- AI assistant for **their** content (not platform deploy)

## What customer tenants cannot access

- DevStudio, operator controls, deployment APIs
- `platform_settings`, `platform_secrets`, Northflank project config
- Other tenants' data

## Flows

### You create a customer workspace

```text
Platform Owner → Create Workspace
  → provisionWorkspace()
  → customer tenant + organization
  → GitHub template fork (phase 2)
  → Northflank service (phase 2)
  → Supabase schema / RLS scope (phase 2)
  → workspace URL
```

API: `POST /api/platform/workspaces/provision` (platform staff only).

### Customer subscribes (self-serve, phase 2)

```text
Stripe checkout (Builder / Pro / Agency)
  → webhook enqueues workspace_provision job
  → provisionWorkspace()
  → email with workspace URL
```

### Your AI operator (platform)

```text
You: "Fix the homepage video issue."
AI: patch → test → triggerNorthflankBuild → health check
```

### Customer AI (tenant-scoped, phase 2)

```text
User: "Build me a workforce training website."
AI: provision workspace → generate site → configure LMS → domain
```

## Database objects

| Object | Purpose |
|--------|---------|
| `tenants.is_platform_owner` | Exactly one row = Elevate operator |
| `tenants.parent_tenant_id` | Customer tenant → platform owner |
| `tenants.type = 'customer'` | Dev Cloud provisioned tenant |
| `customer_workspaces` | Provisioning lifecycle + infra IDs |
| `get_platform_owner_tenant_id()` | SQL helper |
| `is_platform_owner_user()` | Platform staff (admin/super_admin/staff on owner tenant) |
| `is_platform_operator()` | Platform owner only (super_admin on owner tenant) |

Migration: `supabase/migrations/20260708000004_platform_owner_tenant_model.sql`

## Code map

| Path | Role |
|------|------|
| `lib/platform/permission-levels.ts` | Four-level permission model |
| `lib/platform/platform-owner.ts` | Resolve owner tenant, classify users |
| `lib/workspace/provision-workspace.ts` | Workspace orchestrator (phased) |
| `lib/workspace/tier-limits.ts` | Builder / Pro / Agency caps |
| `lib/admin/guards.ts` | `apiRequirePlatformOperator`, `apiRequirePlatformStaff` |
| `lib/devstudio/api-auth.ts` | DevStudio routes use platform operator guard |
| `docs/platform-saas-blueprint.md` | Workforce OS org billing |
| `docs/platform-saas-blueprint.md` | Workforce OS org billing |

## Implementation phases

1. **Done (this doc + schema + guards)** — owner tenant flag, permission levels, provision scaffold
2. **AI Operator v1** — `ai_operator_tasks`, `/admin/operator`, Northflank deploy from tasks
3. **Workspace provisioning MVP** — GitHub template + Northflank service per workspace
4. **Stripe Dev Cloud tiers** — Builder $49 / Pro $149 / Agency $499
5. **Tenant-scoped admin host** — `{slug}.elevatedev.ai` routing in `proxy.ts`

## Do not

- Treat Elevate for Humanity as a `customer_workspace` — it is an org on the owner tenant
- Give customer `org_admin` users access to `/api/devstudio/*`
- Sell raw monorepo source — sell provisioned platform template instances
