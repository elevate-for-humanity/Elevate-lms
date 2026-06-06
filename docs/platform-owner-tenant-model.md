# Platform owner tenant model

Elevate operates two products on one Northflank deployment:

| Product | Audience |
|---------|----------|
| **Elevate Workforce OS** | Elevate for Humanity + partner brands (owner tenant) |
| **Elevate Dev Cloud** | Customer-provisioned workspaces (Gitpod/Replit-style) |

## Hierarchy

```text
Platform owner tenant (is_platform_owner = true)
  ├── organizations[]     — Elevate brands (siblings, not nested customers)
  └── customer tenants (type = customer, parent_tenant_id = owner)
        ├── organizations (default org)
        ├── customer_workspaces
        └── organization_subscriptions (billing)
```

## Workspace provisioning

- **API:** `POST /api/workspaces/create` (public trial)
- **Lib:** `lib/workspace/provision-workspace.ts`, `lib/workspace/start-workspace-trial.ts`
- **Tables:** `customer_workspaces`, `workspace_deployments`, `workspace_domains`
- **Phase 2:** `workspace_provision` job → GitHub fork, Northflank service, custom domain

## Permission levels

See `lib/platform/permission-levels.ts`:

1. Platform owner (`super_admin` on owner tenant)
2. Platform admin (`admin`/`staff` on owner tenant)
3. Organization admin
4. Standard user

## Migration

Apply `supabase/migrations/20260709000001_workspace_provisioning_foundation.sql` in Supabase SQL Editor.
