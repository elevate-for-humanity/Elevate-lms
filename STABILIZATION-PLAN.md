# STABILIZATION PLAN
## Elevate LMS - Pre-Merge Priority Fixes
## Branch: integration/blueprint-verified

---

# EXECUTIVE SUMMARY

This document outlines the critical stabilization work required before the Blueprint branch can be merged into main.

| Priority | Category | Issues | Risk |
|----------|----------|--------|------|
| **P0** | Stripe Payments | 29 | HIGH |
| **P1** | Authentication | 18 | HIGH |
| **P2** | Type Mismatches | 56 | MEDIUM |
| **P3** | Missing Properties | 43 | MEDIUM |

**Total Fixable Issues: ~150**
**Estimated Fix Time: 40-60 hours**

---

# PRIORITY 0: STRIPE STABILIZATION

## Issue: Stripe SDK API Changes

### Root Cause
The codebase uses Stripe SDK 19.3.1 with deprecated/changed API:
- `price_data` → renamed to `price` with different structure
- `createUsageRecord` → moved to subscription item API
- `product_data` → structure changed

### Files Requiring Fix

| File | Errors | Description |
|------|--------|-------------|
| app/api/barber/activate-subscription/route.ts | 1 | product_data deprecated |
| app/api/billing/report-usage/route.ts | 1 | createUsageRecord moved |
| app/api/programs/checkout/route.ts | 2 | Stripe namespace issues |
| lib/stripe/handlers/checkout-session-completed.ts | 1 | Missing function |
| lib/license/linkStripeToLicense.ts | 1 | current_period_end missing |

### Fix Strategy

```typescript
// BEFORE (deprecated)
items: [
  {
    price_data: {
      product_data: { name: 'Product' },
      unit_amount: 1000,
      recurring: { interval: 'month' }
    }
  }
]

// AFTER (current API)
items: [
  {
    price: 'price_id_from_stripe_dashboard',
    // OR inline price creation:
    price_data: {
      product_data: { name: 'Product' },
      unit_amount: 1000,
      recurring: { interval: 'month' }
    }
  }
]
```

### Fix for billing/report-usage

```typescript
// BEFORE (broken)
const res = await stripe.subscriptionItems.createUsageRecord(priceId, {
  quantity: 1,
  timestamp: Date.now() / 1000,
  action: 'set'
});

// AFTER (correct API)
const subscriptionItem = await stripe.subscriptions.retrieve(subscriptionId);
const itemId = subscriptionItem.items.data[0].id;
const res = await stripe.subscriptionItems.createUsageRecord(itemId, {
  quantity: 1,
  timestamp: Date.now() / 1000,
  action: 'set'
});
```

---

# PRIORITY 1: AUTHENTICATION STABILIZATION

## Issue 1: Auth Type Narrowing to `never`

### Root Cause
Auth callbacks use type guards that narrow response types to `never` after error checks.

### Files Requiring Fix

| File | Error | Fix |
|------|-------|-----|
| app/api/auth/azure/callback/route.ts | email doesn't exist on `never` | Restructure type guard |
| app/api/auth/saml/callback/route.ts | email doesn't exist on `never` | Restructure type guard |

### Fix Pattern

```typescript
// BEFORE (broken)
const { data, error } = await supabase.auth...
if (error || !data) return;
const user = data.user;
// user.email is now 'never' because TypeScript narrowed data to never

// AFTER (correct)
const { data: authData, error } = await supabase.auth...
if (error || !authData) return;
const user = authData.user as User;
// Now user.email is accessible
```

## Issue 2: UserRole Type Mismatches

### Root Cause
`UserRole` type doesn't include `'mentor'` but mentor routes compare against it.

### Files Requiring Fix

| File | Errors | Description |
|------|--------|-------------|
| app/api/mentor/approvals/route.ts | 2 | Role comparison fails |
| app/api/mentor/mentees/route.ts | 1 | Role comparison fails |
| app/api/mentor/messages/route.ts | 1 | Role comparison fails |
| app/api/mentor/sessions/route.ts | 2 | Role comparison fails |

### Fix Strategy

Option A: Add `'mentor'` to UserRole type
```typescript
// types/index.ts
export type UserRole = 'student' | 'instructor' | 'employer' | 
  'partner' | 'admin' | 'super_admin' | 'mentor';
```

Option B: Use type assertion where appropriate
```typescript
if ((user.role as string) === 'mentor') { ... }
```

## Issue 3: ApiAuthResult Missing Properties

### Root Cause
`ApiAuthResult` type doesn't include `role` property.

### Files Requiring Fix

| File | Errors | Description |
|------|--------|-------------|
| app/api/lms/quizzes/[quizId]/start/route.ts | 2 | role doesn't exist |
| app/api/dev/barber-video-studio/route.ts | 1 | authorized missing |

### Fix Strategy

Update the ApiAuthResult type:
```typescript
export interface ApiAuthResult {
  user: User;
  session: Session;
  role: UserRole; // Add this
  permissions: Permission[];
}
```

---

# PRIORITY 2: TYPE MISMATCHES

## Critical Type Assignment Errors

| File | Error | Fix |
|------|-------|-----|
| app/api/credentials/issue/route.ts | 'super_admin' not assignable to UserRole | Add to UserRole type |
| app/admin/partners/lms-integrations/[id]/page.tsx | Cannot find name 'user' | Add proper type |

### Fix for super_admin

```typescript
// lib/auth/types.ts
export type UserRole = 
  | 'student' 
  | 'instructor' 
  | 'employer' 
  | 'partner' 
  | 'admin' 
  | 'super_admin'  // Add this
  | 'mentor';
```

---

# PRIORITY 3: MISSING PROPERTIES

## Critical Missing Properties

| File | Missing Property | Fix |
|------|---------------|-----|
| app/api/enrollments/checkout/route.ts | title | Add to query select |
| app/api/webhooks/stripe/career-courses/route.ts | string not assignable to Record | Cast or fix type |
| lms-data/programs.ts | slug missing | Add to Program type |

### Fix for lms-data/programs.ts

```typescript
// The Program type requires slug but the query doesn't return it
// Option A: Add slug to the query
.select('id, slug, title, ...')

// Option B: Remove slug from required fields
// Option C: Create a separate CatalogProgram type
```

---

# STABILIZATION TRACKER

## Completed Fixes

| Issue | File | Status | Date |
|-------|------|--------|------|
| PremiumHomePage import conflict | components/home/PremiumHomePage.tsx | ✅ FIXED | 2024 |
| EmployerPartnerWall useState | components/home/EmployerPartnerWall.tsx | ✅ FIXED | 2024 |
| FundingExperience ChevronRight | components/home/FundingExperience.tsx | ✅ FIXED | 2024 |

## Pending Fixes

### Stripe (29 errors)

| File | Status | Owner |
|------|--------|-------|
| app/api/barber/activate-subscription/route.ts | ⏳ PENDING | Backend |
| app/api/billing/report-usage/route.ts | ⏳ PENDING | Backend |
| app/api/programs/checkout/route.ts | ⏳ PENDING | Backend |
| lib/stripe/handlers/checkout-session-completed.ts | ⏳ PENDING | Backend |
| lib/license/linkStripeToLicense.ts | ⏳ PENDING | Backend |

### Auth (18 errors)

| File | Status | Owner |
|------|--------|-------|
| app/api/auth/azure/callback/route.ts | ⏳ PENDING | Backend |
| app/api/auth/saml/callback/route.ts | ⏳ PENDING | Backend |
| app/api/mentor/* (4 files) | ⏳ PENDING | Backend |
| lib/auth/types.ts | ⏳ PENDING | Type definition |

### Type Mismatches (56 errors)

| File | Status | Owner |
|------|--------|-------|
| app/admin/integrations/stripe/page.tsx | ⏳ PENDING | Frontend |
| app/api/credentials/issue/route.ts | ⏳ PENDING | Backend |
| Various API routes | ⏳ PENDING | Various |

---

# ESTIMATED EFFORT

| Category | Errors | Hours | Owner |
|----------|--------|-------|-------|
| Stripe Stabilization | 29 | 16 | Backend |
| Auth Stabilization | 18 | 12 | Backend |
| Type Mismatches | 56 | 20 | Full Stack |
| Missing Properties | 43 | 12 | Full Stack |
| **TOTAL** | ~150 | ~60 | |

---

# MERGE READINESS CHECKLIST

Before merge, verify:

- [ ] All Stripe errors fixed
- [ ] All Auth errors fixed
- [ ] TypeScript errors reduced to <100
- [ ] No regressions in payment flows
- [ ] No regressions in auth flows
- [ ] Production gate passes
- [ ] Smoke tests pass

---

*This document serves as the action plan for stabilization.*
