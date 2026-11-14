# Platform SaaS Blueprint (Phase 1) — Elevate

Build on the existing Next.js + Supabase + `tenants` / `licenses` stack. Do **not** greenfield a second LMS.

## Database (run manually)

`supabase/migrations/20260702000017_saas_subscription_foundation.sql`

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Solo / Business / Professional catalog |
| `features` | Feature codes (`crm`, `lms`, `workforce`, …) |
| `plan_features` | M:N plan → features |
| `saas_addon_catalog` | Add-on SKUs + `feature_codes[]` |
| `organization_subscriptions` | One row per org (`organization_id` → `tenants.id`) |
| `addon_subscriptions` | Active add-ons per org |

Legacy bridge: `organization_addons` (tenant_id) still written during checkout.

## Feature catalog (code)

`lib/platform/feature-catalog.ts` — `FEATURES`, `ADDONS`, `PLAN_FEATURE_FALLBACK`

## Entitlements API

```typescript
import { FEATURES } from '@/lib/platform/feature-catalog';
import { requireFeature, getOrganizationFeatures } from '@/lib/platform/organization-features';

// API route
await requireFeature(tenantId, FEATURES.WORKFORCE);

// Or helper
import { apiRequireOrganizationFeature } from '@/lib/api/require-organization-feature';
const blocked = await apiRequireOrganizationFeature(tenantId, FEATURES.LMS);
if (blocked instanceof NextResponse) return blocked;
```

`licenses.features` stays in sync via `lib/platform/sync-license-from-saas.ts` for existing `withLicense` middleware.

## Checkout

- Store UI: `/store/plans`
- API: `POST /api/store/platform-checkout`
- Webhook: `checkout_type=platform_saas` → `fulfillPlatformSaasSubscription`

## Admin UI (admin subdomain)

| Path | Purpose |
|------|---------|
| `/admin/billing` | Overview |
| `/admin/billing/plans` | Plan catalog |
| `/admin/billing/addons` | Add-on catalog |
| `/admin/billing/subscriptions` | Org subscriptions |
| `/admin/billing/licenses` | Link to legacy licenses |
| `/admin/billing/usage` | Phase 2 metering |
| `/admin/billing/invoices` | Phase 2 |
| `/admin/billing/feature-flags` | Feature code list |

## Customer UI (www)

| Path | Purpose |
|------|---------|
| `/account/billing` | Existing billing hub |
| `/account/plan` | Current plan + features |
| `/account/addons` | Active + catalog |
| `/account/invoices` | Stripe portal |
| `/account/payment-methods` | Stripe portal |

API: `GET /api/account/subscription`

## Pricing strategy (your model)

- **Low entry:** Solo $29 → Business $59 → Professional $99  
- **Upsell:** Workforce $99, Apprenticeship $99, Student Mgmt $49, White-label mobile $199  
- Natural expansion path to **$250–500/mo** without a $199+ upfront wall  

## Phase 2 (next modules)

1. Route-level gates on workforce / apprenticeship / student APIs  
2. Stripe metered billing (SMS, storage)  
3. `usage_meters` table + admin usage dashboard  
4. Coupons + annual Stripe Price IDs in catalog  
5. Admin edit UI for plans (not SQL-only seed)

## vs Marblism / GoHighLevel

Elevate already has the domain modules; Phase 1 adds the **monetization and entitlement layer** they sell as generated apps.
