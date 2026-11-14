# Elevate Master Commerce & Feature Inventory

Status: IN PROGRESS
Purpose: single source of truth for what Elevate can sell, upsell, provision, and entitle through Store + Stripe + Supabase.

## Rules
- Do not create a Stripe product until the underlying feature/module is confirmed in the repository.
- Do not advertise a feature as included unless an entitlement can be checked server-side.
- Store recommendations must never sell a feature the customer already owns.
- Every sellable item must eventually map to: SKU, billing type, Stripe product/price, entitlement key, provisioning handler, success flow, cancellation/revocation flow, and upsell relationships.

## Confirmed platform entitlement keys
Source: `lib/platform/features.ts`

- CRM
- Website
- Booking
- Forms
- Email Marketing
- AI Basic
- AI Advanced
- AI Content
- AI Chat Widget
- SMS
- Automations
- Invoicing
- Lead Funnels
- Client Portal
- LMS
- Certificates
- Workflow Automation
- Reporting
- Custom Branding
- Student Management
- Workforce
- Apprenticeship
- Employer Portal
- Testing Center
- White Label Mobile
- API Access

## Confirmed standalone apps
Source: `lib/apps/individual-app-plans.ts`

### Website Builder
Routes/components and database infrastructure confirmed.
Existing plans currently defined:
- Starter — $29/month
- Professional — $79/month
- Enterprise — $199/month

Capabilities currently listed include websites, pages, templates, Elevate subdomain, custom domain, LMS enrollment widgets, existing-site import, white-label builder, API access, and multi-user access.

### SAM.gov Manager
Existing plans currently defined:
- Starter — $49/month
- Professional — $149/month
- Enterprise — $399/month

### Grants Discovery
Existing plans currently defined:
- Starter — $79/month
- Professional — $199/month
- Enterprise — $499/month

## Confirmed AI / virtual assistants
Source: `lib/ai/agent-registry.ts`

### PARS / PARIS
Pre-admission review, admission interviews, eligibility assessment, program applications.

### ELLIE
Student success coaching, notifications, enrollment support, course guidance, and course-builder intent.

### LIZZY
Operations automation, admin tasks, document processing, queue management.

### ZORA
Compliance monitoring, WIOA reporting, credential tracking, career placement and regulatory audits.

### Router
Intent classification and fallback routing across agents.

These should be treated as distinct product capabilities, not collapsed into a generic "AI" label without a packaging decision.

## Confirmed creator / operator tools

### Course Builder
Confirmed in admin UI, APIs, schema/types, database integration, AI writing, quick-add operations and Store page.
Potential sellable forms:
- Included feature in higher plans
- Education add-on
- Standalone creator product

### Dev Studio
Confirmed in admin, LMS/AI, marketing/store, APIs, deployment, containers, workflows, health, secrets, media, operations and AI task infrastructure.
This is likely Enterprise/managed-platform functionality and should not be bundled into low-cost self-service plans without an explicit product decision.

### Media Management
Confirmed but repository audit marks portions partial.

### Deployment / Container Management
Confirmed through GitHub/Northflank integrations; likely Enterprise-only.

### Evaluation / Guardrails
Confirmed; commercial packaging TBD.

### CFD Simulation
Present but prior repository audit marks it partial. Do not sell until production status is re-verified.

## Current base SaaS catalog
Source: `lib/store/platform-pricing.ts`

- Solo — $29/month, $290/year
- Business — $59/month, $590/year
- Professional — $99/month, $990/year

Current recurring add-ons:
- AI Add-On — $19/month
- Text Messaging — $15/month
- Online Courses / LMS — $29/month
- Student Management — $49/month
- Workforce Development — $99/month
- Apprenticeship Management — $99/month
- Employer Portal — $49/month
- Credential Testing Center — $49/month
- White Label Mobile App — $199/month
- Additional User — $10/month
- Additional Location — $25/month
- Additional Storage — $10/month per 100 GB

## Known catalog conflicts requiring consolidation

1. Website Builder is a full standalone product with its own $29/$79/$199 plans, while the base platform catalog only has the generic `website` entitlement. Store must decide whether Website Builder is included, limited, or separately upsold for each base plan.
2. Current Store audit documentation contains older add-on prices that conflict with `lib/store/platform-pricing.ts` (example: LMS and Workforce prices). Runtime catalog must be authoritative; old docs must not drive checkout.
3. AI is currently too generic in subscription packaging. Repository contains PARS/PARIS, ELLIE, LIZZY, ZORA and Router capabilities that can support differentiated AI/virtual-assistant offers.
4. Course Builder exists as a substantive product but is not represented as its own entitlement key in `lib/platform/features.ts`.
5. Dev Studio exists as a substantive Store-facing/enterprise capability but is not represented as a subscription entitlement key.
6. SAM.gov Manager and Grants Discovery are real standalone apps but are absent from the main platform feature enum.
7. Store must separate self-service SaaS from Managed Platform / Enterprise / source-use licensing.

## Required master commerce schema
Every item in the final catalog should have:

- `sku`
- `name`
- `category`
- `billing_type` (`subscription`, `one_time`, `annual`, `enterprise_contract`, `usage`)
- `monthly_price`
- `annual_price`
- `stripe_product_id`
- `stripe_price_ids`
- `entitlement_keys`
- `included_in_plans`
- `required_plan`
- `provisioning_handler`
- `revocation_handler`
- `trial_days`
- `upsell_skus`
- `cross_sell_skus`
- `production_status`

## Store upsell requirements

### Before purchase
- Show included features.
- Show compatible add-ons.
- Show recommended modules based on organization type and selected plan.

### Checkout
- Allow compatible recurring add-ons to join the same Stripe subscription when appropriate.
- Do not trust client-provided prices.

### After checkout
- Show purchased/included entitlements.
- Recommend unowned compatible products.
- Never upsell already-owned capabilities.

### Customer dashboard
- Current plan
- Included features
- Active add-ons
- Available upgrades
- Billing link
- Renewal date
- Trial status
- Usage/limits where applicable

## Inventory work still required
Repository-wide confirmation still needed for:
- CRM depth and sellable boundaries
- Booking/scheduling
- Forms/form builder
- Email marketing
- SMS
- Invoicing/payments
- Funnels
- Client portal
- Website Builder provisioning and plan overlap
- Virtual assistant packaging and usage limits
- Course Builder entitlement model
- Testing/proctoring products
- Workforce and WIOA reporting tools
- Apprenticeship/RAPIDS/OJT tools
- Employer/recruiter tools
- Compliance exports and reporting
- Analytics
- Certificates/credentials
- White-label/PWA/mobile
- API access
- SAM.gov Manager
- Grants Discovery
- Dev Studio / deployment / containers
- Media Studio/content generation
- Enterprise/source-use licensing
- Digital downloads, courses, physical products and testing products

## Next implementation sequence
1. Finish repository-wide capability inventory.
2. Mark each capability: production-ready / partial / internal-only / legacy.
3. Build one canonical commerce catalog.
4. Add missing entitlement keys only for features approved for sale.
5. Synchronize Stripe Products/Prices from the canonical catalog.
6. Standardize checkout + webhook lifecycle.
7. Build personalized Store upsells.
8. Run one controlled end-to-end test organization through trial, purchase, add-on, upgrade, failed payment, cancellation and reactivation.
