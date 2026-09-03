# 14-day managed trial — what subscribers get

## Managed trial (`POST /api/trial/start-managed`, `/store/trial`)

| Item | Included |
|------|----------|
| **Organization** | `organizations` row with unique `slug` |
| **Subdomain** | `{slug}.app.elevateforhumanity.org` (ALB/proxy routing — no per-customer DNS record) |
| **Public website** | Published `user_websites` row with starter template + AI-ready `site_config` (home, programs, about, contact) |
| **Admin** | `{slug}.app.elevateforhumanity.org/admin` → org-scoped admin dashboard |
| **License** | `managed_licenses` tier `trial`, 14-day `trial_ends_at` |
| **Email** | Welcome email with dashboard + public site links |

### Not included until upgrade

- Stripe / payment processing
- Custom apex domain (subdomain only)
- SLA or dedicated support
- Automatic course/program seeding (org starts empty in LMS)

### `websiteMode` intake

| Mode | Behavior |
|------|----------|
| `new` | Provisions published starter public site |
| `existing` | Same site provision; CTA copy tuned for embed/enrollment |
| `api_embed` | No public site row; intake logged in `license_events` only |

## App-specific trial (`lib/trial/start-app-trial.ts`)

Used by Website Builder, SAM.gov, Grants, etc. Creates `user_app_subscriptions` (`plan: starter`, `status: trial`, 14 days). Does not create an `organizations` subdomain unless the user also starts a managed trial.

### Individual subscription plans (per user)

Canonical catalog: `lib/apps/individual-app-plans.ts`  
Store UI: `components/store/IndividualAppPlansSection.tsx`

| App | Trial start | Paid checkout |
|-----|-------------|---------------|
| Website Builder | `/apps/website-builder/start-trial` | `POST /api/apps/upgrade` → Stripe |
| SAM.gov | `/apps/sam-gov/start-trial` | same |
| Grants | `/apps/grants/start-trial` | same |

Plans per app: **Starter**, **Professional**, **Enterprise** (monthly; prices in `app/api/apps/upgrade/route.ts`).

Import existing site: `/import` (requires login; uses `POST /api/ai/import-site`). After trial, save sites in Website Builder.

### Required migration (trials + builder)

Apply in Supabase SQL Editor:

- `supabase/migrations/20260702000015_individual_app_subscriptions.sql` — adds `app_slug`, `plan`, RLS, `user_websites` / `website_pages` columns
- `supabase/migrations/20260530000001_tenant_website_builder.sql` — tenant site columns (idempotent if 20260702000015 already run)

## Lifecycle (`GET /api/cron/trial-lifecycle`)

- Day 7: warning email (orgs with `plan=trial` and `trial_started_at` in window)
- Day 14: `status` → `trial_expired`
- Day 30: archive expired orgs

## Subdomain rules

- Slug derived from org name; collision suffix `-xxxx`
- Reserved: `www`, `app`, `api`, `admin`, `dashboard`, `mail`, `support`, `help`, `docs`, `demo`
- Publish API enforces unique published `subdomain` on `user_websites`

## Required migration

Apply `supabase/migrations/20260530000001_tenant_website_builder.sql` in Supabase SQL Editor before provisioning will persist `site_config` / `subdomain` columns.
