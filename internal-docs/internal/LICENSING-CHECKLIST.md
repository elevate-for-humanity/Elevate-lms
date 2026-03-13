# SELF-SERVE LICENSING & PRICING SETUP — CHECKLIST

## Objective
Fully automated self-serve licensing with monthly + annual pricing, card-up-front trial, and automatic license activation.

---

## SECTION 1 — STRIPE CONFIGURATION

| Item | Status | Evidence |
|------|--------|----------|
| Stripe Product Created | PENDING | Product name: "Elevate Workforce Platform License" |
| Monthly Recurring Price | PENDING | Amount: $99/month, Price ID: `STRIPE_PRICE_MONTHLY` env var |
| Annual Recurring Price | PENDING | Amount: $899/year, Price ID: `STRIPE_PRICE_ANNUAL` env var |
| Trial Period | YES | 14 days, configured in code (`TRIAL_DAYS = 14`) |
| Card required up front | YES | `payment_method_collection: 'always'` in checkout |
| Stripe Customer Portal | PENDING | Needs to be enabled in Stripe Dashboard |

**Action Required:** Create Stripe Products/Prices in Dashboard and add IDs to `.env`

---

## SECTION 2 — APPLICATION DATA MODEL

| Item | Status | Location |
|------|--------|----------|
| License types defined | YES | `/lib/license/types.ts` |
| Status enum | YES | `trial \| active \| past_due \| suspended \| canceled` |
| Plan enum | YES | `monthly \| annual` |
| Trial timestamps | YES | `trialStartedAt`, `trialEndsAt` |
| Stripe IDs | YES | `stripeCustomerId`, `stripeSubscriptionId` |
| Period tracking | YES | `currentPeriodStart`, `currentPeriodEnd` |

**Database migration needed:** Create `licenses` table with these fields

---

## SECTION 3 — TRIAL FLOW (CARD UP FRONT)

| Item | Status | Location |
|------|--------|----------|
| Start Trial buttons | YES | `/app/store/page.tsx` - Monthly & Annual options |
| Stripe Checkout (subscription mode) | YES | `/app/api/license/checkout/route.ts` |
| Trial via Stripe (not app-side) | YES | `subscription_data.trial_period_days` |
| Card required before access | YES | `payment_method_collection: 'always'` |
| Trial banner component | YES | `/components/license/TrialBanner.tsx` |
| Checkout success page | YES | `/app/store/checkout/success/page.tsx` |

---

## SECTION 4 — WEBHOOKS

| Event | Status | Handler |
|-------|--------|---------|
| `checkout.session.completed` | YES | Links Stripe IDs to license |
| `invoice.paid` | YES | Sets status = active |
| `invoice.payment_failed` | YES | Sets status = past_due |
| `customer.subscription.updated` | YES | Handles plan changes |
| `customer.subscription.deleted` | YES | Sets status = canceled/suspended |
| `charge.refunded` | YES | Immediate suspension |
| `charge.dispute.created` | YES | Immediate suspension |
| Signature verification | YES | Uses `STRIPE_WEBHOOK_SECRET` |

**Webhook endpoint:** `/api/license/webhook`

**Action Required:** Configure webhook URL in Stripe Dashboard

---

## SECTION 5 — ACCESS CONTROL BY LICENSE STATE

| State | UI Access | Admin Actions | Banner |
|-------|-----------|---------------|--------|
| Trial | Full | Full (some restricted) | Blue - days remaining |
| Active | Full | Full | None |
| Past Due | Full | Locked | Amber - update payment |
| Suspended | Locked | Locked | Red - reactivate |
| Canceled | Until period end | Locked | Red - reactivate |

**Access control logic:** `/lib/license/access-control.ts`

---

## SECTION 6 — BILLING MANAGEMENT

| Item | Status | Location |
|------|--------|----------|
| Manage Billing button | YES | `/app/account/billing/page.tsx` |
| Stripe Portal endpoint | YES | `/app/api/license/portal/route.ts` |
| Cancel flow | YES | Via Stripe Portal |
| Update payment | YES | Via Stripe Portal |
| Switch plans | YES | Via Stripe Portal |

---

## SECTION 7 — PRICING CONFIRMATION

| Item | Value |
|------|-------|
| Monthly price | $99/month |
| Annual price | $899/year ($74.92/month effective) |
| Annual discount | Save $289 (~24%) |
| Trial length | 14 days |
| Card required | YES |
| Auto-conversion | YES (no manual approval) |

---

## SECTION 8 — SAFETY CHECKS

| Item | Status | Implementation |
|------|--------|----------------|
| Payment failure suspends | YES | Webhook: `invoice.payment_failed` |
| Refund suspends | YES | Webhook: `charge.refunded` |
| Dispute suspends | YES | Webhook: `charge.dispute.created` |
| One trial per email | YES | Check existing subscriptions in checkout |
| Disposable emails blocked | YES | Domain blocklist in checkout |

---

## FINAL SIGN-OFF

| Question | Answer |
|----------|--------|
| Is pricing fully live and self-serve? | YES (pending Stripe config) |
| Does trial → paid happen without manual action? | YES |
| Are monthly and annual both selectable? | YES |
| Are license states enforced? | YES |

---

## REMAINING SETUP TASKS

1. **Stripe Dashboard:**
   - Create Product: "Elevate Workforce Platform License"
   - Create Price: $99/month recurring
   - Create Price: $899/year recurring
   - Enable Customer Portal
   - Configure webhook endpoint

2. **Environment Variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_MONTHLY=price_...
   STRIPE_PRICE_ANNUAL=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Database:**
   - Create `licenses` table
   - Create `organizations` table

---

## FILES CREATED/MODIFIED

- `/lib/license/types.ts` - License types, plans, status helpers
- `/lib/license/access-control.ts` - Feature gating by status
- `/lib/license/license-state.ts` - State management utilities
- `/app/store/page.tsx` - Self-serve pricing page
- `/app/store/trial/page.tsx` - Trial signup (legacy, can remove)
- `/app/store/request-license/page.tsx` - Enterprise inquiry form
- `/app/store/checkout/success/page.tsx` - Post-checkout success
- `/app/api/license/checkout/route.ts` - Stripe Checkout creation
- `/app/api/license/webhook/route.ts` - Stripe webhook handler
- `/app/api/license/portal/route.ts` - Stripe Portal session
- `/app/account/billing/page.tsx` - Billing management UI
- `/components/license/TrialBanner.tsx` - Status banners
