# Platform Pricing Documentation

**Canonical Source:** `lib/pricing.ts`  
**Last Updated:** January 2026

---

## Pricing Model

All platform licensing uses a **one-time license fee** model with optional monthly subscription.

### License Tiers

| Tier | Price | Billing | Source |
|------|-------|---------|--------|
| Core Platform | $4,999 | One-time | `app/data/store-products.ts:117` |
| School / Training Provider | $15,000 | One-time | `app/data/store-products.ts:145` |
| Enterprise Solution | $50,000 | One-time | `app/data/store-products.ts:175` |
| Monthly Subscription | $499/month | Recurring | `app/data/store-products.ts:205` |

---

## What Each Tier Includes

### Core Platform ($4,999)

- Unlimited students and courses
- LMS, enrollment, admin, payments
- Mobile-responsive design
- Progress tracking and certificates
- 1 year of updates and support

**Ideal for:** Small training providers, nonprofits starting workforce programs, pilot programs

### School / Training Provider ($15,000)

- Everything in Core Platform
- White-label branding
- Partner dashboard for instructors
- Case management tools
- WIOA/grant compliance reporting
- Lifetime updates

**Ideal for:** Community colleges, workforce development boards, training providers with WIOA contracts

### Enterprise Solution ($50,000)

- Everything in School License
- Employer portal and job matching
- AI tutor and personalized learning
- Custom integrations (API access)
- Multi-tenant architecture
- Dedicated account manager

**Ideal for:** State workforce agencies, large workforce boards, multi-state training networks

### Monthly Subscription ($499/month)

- All core platform features
- Up to 100 active students
- Basic support
- Monthly updates
- Cancel anytime

**Ideal for:** New training providers testing the platform, seasonal programs, budget-conscious organizations

---

## What's NOT Included (Implementation-Dependent)

These items are scoped separately based on organizational needs:

- Custom integrations beyond standard connectors
- Data migration from existing systems
- Custom development or feature requests
- Ongoing managed services
- Training and onboarding (available separately)

---

## Digital Products

Separate from platform licensing, we offer digital products:

| Product | Price | Source |
|---------|-------|--------|
| Start a Tax Business Toolkit | $49 | `lib/store/digital-products.ts:36` |
| Grant Readiness Guide | $29 | `lib/store/digital-products.ts:52` |
| Fund-Ready Mini Course | $149 | `lib/store/digital-products.ts:66` |

---

## Disclaimers

Use these disclaimers in all pricing communications:

**General pricing:**
> "Final pricing depends on scope, branding, modules, and implementation support."

**Integrations:**
> "Integrations available via API/webhooks; implementation depends on partner environment."

**Funding eligibility:**
> "Funding eligibility determined by local workforce boards and program requirements."

**Hiring incentives:**
> "Hiring incentives subject to eligibility and approval requirements."

**Implementation:**
> "Implementation and configuration services scoped separately based on organizational needs."

---

## Pricing Evidence Trail

All pricing in this document is derived from existing repository code:

1. **Primary source:** `app/data/store-products.ts`
   - Contains Stripe integration
   - Defines all license tiers with prices
   - Has product IDs and billing types

2. **Digital products:** `lib/store/digital-products.ts`
   - Defines digital product catalog
   - Contains Stripe price IDs (placeholders)

3. **Canonical export:** `lib/pricing.ts`
   - Single source of truth for all pricing
   - All UI components import from this file
   - Contains disclaimers and helper functions

---

## How to Update Pricing

1. Update `lib/pricing.ts` with new values
2. Update source reference comments
3. Verify no hardcoded prices exist elsewhere:
   ```bash
   grep -r "\$4,999\|\$15,000\|\$50,000\|\$499" --include="*.tsx" app/
   ```
4. Update this documentation
5. Update `docs/BUYER_DECK_OUTLINE.md` if slide content changes

---

## Routes Using Pricing

All these routes import from `lib/pricing.ts`:

- `/store` — Store page with license preview
- `/license` — Main licensing landing page
- `/license/features` — Platform features
- `/license/integrations` — Integration capabilities
- `/license/pricing` — Full pricing page
- `/license/demo` — Demo track selection
- `/demo/*` — Demo pages (use ROUTES constant)
- `/schedule` — Scheduling page (uses ROUTES constant)
