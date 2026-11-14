# SUBSCRIPTION AUDIT
**Date:** June 17, 2026  
**Platform:** Elevate Workforce Operating System  
**Status:** AUDITED

---

## 1. SUBSCRIPTION ARCHITECTURE

### 1.1 Subscription System Overview

```
[User] → [Plan Selection] → [Checkout] → [Stripe Subscription] → [Features]
                                                                       ↓
                                                               [Webhook Handler]
                                                                       ↓
                                                               [Access Control]
```

### 1.2 Subscription Files

| File | Purpose |
|------|---------|
| `lib/subscriptions/feature-access.ts` | Feature definitions by tier |
| `app/api/store/platform-checkout/route.ts` | Subscription creation |
| `app/api/webhooks/store/route.ts` | Subscription lifecycle |
| `lib/store/platform-pricing.ts` | Plan definitions |

---

## 2. PLAN DEFINITIONS AUDIT

### 2.1 Launch Plans

**File:** `lib/store/launch-plans.ts`

| Plan | Monthly | Annual | Features Count |
|------|---------|--------|---------------|
| Individual | $49 | $490 | 6 features |
| Professional | $99 | $990 | 9 features |
| School | $299 | $2990 | 7 features |
| Enterprise | $999 | $9990 | 7 features |

### 2.2 Base Plans (Solo/Business/Professional)

**File:** `lib/store/platform-pricing.ts`

| Plan | Monthly | Annual | Users | Locations |
|------|---------|--------|-------|----------|
| Solo | $29 | $290 | 1 | 1 |
| Business | $59 | $590 | 3 | 1 |
| Professional | $99 | $990 | 10 | 1 |

---

## 3. SUBSCRIPTION CREATION AUDIT

### 3.1 Checkout Flow

```typescript
// From app/api/store/platform-checkout/route.ts
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: lineItems,
  subscription_data: {
    metadata: {
      checkout_type: 'platform_saas',
      plan_id: checkoutPlanId,
      tenant_id: profile?.tenant_id || '',
    },
  },
});
```

### 3.2 Subscription Metadata

| Field | Source | Purpose |
|-------|--------|---------|
| `checkout_type` | Fixed | Identifies platform SaaS |
| `plan_id` | User selection | Maps to features |
| `tenant_id` | User profile | Links to tenant |

---

## 4. SUBSCRIPTION LIFECYCLE AUDIT

### 4.1 Event Handlers

**File:** `app/api/webhooks/store/route.ts`

| Event | Action | Status |
|-------|--------|--------|
| `checkout.session.completed` | Create/extend subscription | ✅ |
| `customer.subscription.updated` | Sync tier changes | ✅ |
| `customer.subscription.deleted` | Revoke features | ✅ |
| `invoice.payment_succeeded` | Audit logging | ✅ |
| `invoice.payment_failed` | Handle failure | ⚠️ Partial |

### 4.2 Subscription Update Handler

```typescript
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object as Stripe.Subscription;
  const newPlanId = subscription.metadata?.plan_id;
  // Update tenant features based on new plan
  await syncTenantFeatures(tenantId, newPlanId);
}
```

---

## 5. FEATURE ACCESS AUDIT

### 5.1 Feature Matrix

**File:** `lib/subscriptions/feature-access.ts`

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| host_apprentice_management | ✅ | ✅ | ✅ |
| host_hours_approval | ✅ | ✅ | ✅ |
| host_competency_signoff | ❌ | ✅ | ✅ |
| host_evaluations | ❌ | ✅ | ✅ |
| host_documents | ❌ | ✅ | ✅ |
| host_reports_basic | ✅ | ✅ | ✅ |
| host_reports_advanced | ❌ | ✅ | ✅ |
| host_messaging | ✅ | ✅ | ✅ |
| host_schedule | ❌ | ✅ | ✅ |
| host_multi_location | ❌ | ❌ | ✅ |
| host_ai_evaluations | ❌ | ✅ | ✅ |
| host_compliance_exports | ❌ | ✅ | ✅ |
| host_store_access | ❌ | ❌ | ✅ |

### 5.2 Access Control Functions

```typescript
// From lib/subscriptions/feature-access.ts
export function getFeaturesByTier(tier: PlanTier): FeatureAccess {
  switch (tier) {
    case 'starter': return DEFAULT_STARTER_FEATURES;
    case 'professional': return DEFAULT_PROFESSIONAL_FEATURES;
    case 'enterprise': return DEFAULT_ENTERPRISE_FEATURES;
    default: return DEFAULT_STARTER_FEATURES;
  }
}
```

---

## 6. SUBSCRIPTION LIMITS AUDIT

### 6.1 Tier Limits

| Limit | Starter | Professional | Enterprise |
|-------|---------|--------------|------------|
| Max Apprentices | 2 | 10 | Unlimited (-1) |
| Max Instructors | 1 | 3 | Unlimited (-1) |
| Max Storage (GB) | 5 | 25 | 100 |
| Max AI Credits | 100 | 1000 | Unlimited (-1) |
| Max SMS Credits | 50 | 200 | Unlimited (-1) |

---

## 7. ADD-ON SUBSCRIPTIONS AUDIT

### 7.1 Available Add-Ons

| Add-On | Price | Type |
|--------|-------|------|
| AI Add-On | $19/mo | Recurring |
| Text Messaging | $15/mo | Recurring |
| LMS Add-On | $49/mo | Recurring |
| Workforce Module | $79/mo | Recurring |
| Apprenticeship Module | $99/mo | Recurring |
| Employer Portal | $49/mo | Recurring |
| Compliance Export | $29/mo | Recurring |

### 7.2 Add-On Checkout

Add-ons are added as additional line items in the Stripe checkout session and billed on the same subscription.

---

## 8. REFUND & CANCELLATION AUDIT

### 8.1 Refund Handler

```typescript
// From app/api/webhooks/store/route.ts
if (event.type === 'charge.refunded') {
  // Revoke user_entitlements
  await supabase.from('user_entitlements').update({
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    revoke_reason: 'refund',
  }).eq('stripe_payment_id', paymentIntentId);
  
  // Update purchase record
  await supabase.from('purchases').update({
    status: 'refunded',
  }).eq('stripe_payment_id', paymentIntentId);
}
```

### 8.2 Subscription Cancellation

Subscription deletion webhook revokes features but does NOT cancel the Stripe subscription automatically. User must cancel via Stripe dashboard or customer portal.

---

## 9. ISSUES IDENTIFIED

| Issue | Severity | Description |
|-------|---------|-------------|
| Failed payment handling | ⚠️ Medium | Partial handling, no retry logic |
| Plan downgrades | ⚠️ Medium | Not explicitly handled |
| Proration | ⚠️ Low | Not explicitly configured |
| Trial subscriptions | ⚠️ Low | Mixed support |

---

## 10. VERIFICATION CHECKLIST

- [x] Subscription creation works
- [x] Stripe subscription created
- [x] Features granted on subscription
- [x] Features revoked on cancellation
- [x] Add-ons billed correctly
- [x] Refunds revoke entitlements
- [ ] Failed payment retry
- [ ] Plan downgrade handling
- [ ] Proration configuration

---

## AUDIT SIGNATURE

```
Auditor: OpenHands Agent
Date: June 17, 2026
```
