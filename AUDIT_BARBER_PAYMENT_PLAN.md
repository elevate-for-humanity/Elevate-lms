# Barber Apprenticeship Payment Plan Audit

**Date:** 2026-06  
**Files audited:**
- `lib/programs/pricing.ts` — pricing constants and calculations
- `app/api/barber/checkout/public/route.ts` — public (unauthenticated) checkout
- `app/api/barber/checkout/route.ts` — authenticated checkout (subscription mode)
- `app/api/barber/checkout/full/route.ts` — pay-in-full checkout
- `app/api/barber/webhook/route.ts` — Stripe webhook for barber account
- `app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx` — UI form
- `app/programs/barber-apprenticeship/sections/BarberEnrollment.tsx` — program page
- `lib/bnpl-config.ts` — BNPL provider registry
- `app/api/sezzle/checkout/route.ts` — Sezzle checkout
- `app/api/affirm/checkout/route.ts` — Affirm checkout

---

## CRITICAL BUGS

### BUG-1 — $600 deposit is overridden to $1,743 by the API (P0)

**File:** `app/api/barber/checkout/public/route.ts` lines 120–141

The UI (`ApprenticeForm.tsx`) advertises **$600 minimum down payment** and sends `custom_setup_fee: 600` to the API. The API then does:

```ts
const minSetupFee = Math.round(adjustedFullPrice * 0.35); // = $1,743 on full price
const setupFee = custom_setup_fee
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : Math.round(adjustedFullPrice * 0.35);
```

`Math.max(1743, 600)` = **$1,743**. The user's $600 selection is silently overridden. Every payment plan checkout charges $1,743 regardless of what the user chose.

**Fix:**
```ts
// lib/programs/pricing.ts already has minDownPayment: 600
const minSetupFee = BARBER_PRICING.minDownPayment; // $600

const setupFee = custom_setup_fee
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : minSetupFee; // default to $600, not 35%
```

---

### BUG-2 — Three checkout routes, three different payment models, no coordination

Three separate checkout routes exist for the same program:

| Route | Mode | Auth | Setup fee | Weekly model |
|-------|------|------|-----------|--------------|
| `/api/barber/checkout` | `subscription` | Required | `BARBER_PRICING.setupFee` ($600 constant) | Stripe subscription (recurring weekly) |
| `/api/barber/checkout/public` | `payment` | None | 35% of adjusted price ($1,743) | Manual invoice scheduling |
| `/api/barber/checkout/full` | `payment` | Required | N/A (full price) | None |

The authenticated route (`/api/barber/checkout`) uses **Stripe subscription mode** with `billing_cycle_anchor`. The public route uses **one-time payment mode** and then calls `scheduleWeeklyInvoices()` in the webhook to create individual invoice items for all 29 weeks at once. These are fundamentally different billing architectures for the same product.

**Impact:**
- A student who pays via the public form gets 29 individual invoices created immediately in Stripe.
- A student who pays via the authenticated form gets a Stripe subscription that auto-renews weekly.
- The webhook (`barber/webhook`) handles both paths with different code branches — but only the `barber_enrollment` and `barber_full_tuition` checkout types are handled. The authenticated subscription checkout (`checkout_type` not set) falls through unhandled.

---

### BUG-3 — `scheduleWeeklyInvoices()` creates all 29 invoices immediately and finalizes them

**File:** `app/api/barber/webhook/route.ts` lines 18–65

```ts
for (let week = 0; week < weeksRemaining; week++) {
  await stripe.invoiceItems.create({ ... });
  const invoice = await stripe.invoices.create({ ... });
  await stripe.invoices.finalizeInvoice(invoice.id); // ← sends immediately
}
```

`finalizeInvoice()` with `collection_method: 'send_invoice'` sends the invoice to the customer immediately. This means on enrollment, the student receives **29 invoice emails at once** — one for each week of the program. This is a severe UX bug and will trigger spam filters.

**Fix:** Do not pre-create all invoices. Use Stripe's subscription with `billing_cycle_anchor` (already done in the authenticated route) or use scheduled invoice creation via a cron job.

---

### BUG-4 — `ApprenticeForm.tsx` has a local PRICING constant that contradicts `lib/programs/pricing.ts`

**File:** `app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx` lines 13–22

```ts
const PRICING = {
  fullPrice: 4980,
  minDownPayment: 600,
  setupFee: 600,
  setupFeeRate: 0.12,   // ← 12%
  remainingBalance: 4380,
};
```

`lib/programs/pricing.ts` has `setupFeeRate: 0.35` (35%). The form uses 12%, the API uses 35%. The form's weekly payment preview shows a different number than what the API actually charges.

**Fix:** Remove the local `PRICING` constant. Import `BARBER_PRICING` and `calculateWeeklyPayment` from `@/lib/programs/pricing`.

---

### BUG-5 — `barber/checkout` (authenticated) uses `student_enrollments` table which may not exist

**File:** `app/api/barber/checkout/route.ts` lines 44–52

```ts
const { data: existingEnrollment } = await supabase
  .from('student_enrollments')
  .select('id, status, enrollment_state')
  .eq('student_id', user.id)
  .eq('program_slug', 'barber-apprenticeship')
```

Per AGENTS.md, `student_enrollments` is the apprenticeship-specific hours-tracking table. The canonical enrollment table is `program_enrollments`. This duplicate-check query is looking in the wrong table — a student with an active `program_enrollment` would not be caught here and could double-enroll.

---

## CONTENT ISSUES

### CONTENT-1 — BarberEnrollment.tsx shows WIOA and JRI as payment options (self-pay program)

**File:** `app/programs/barber-apprenticeship/sections/BarberEnrollment.tsx` lines 139–145

```tsx
<strong>JRI (Job Ready Indy):</strong> If you are justice-involved...
  JRI funding may cover your entire apprenticeship at no cost.
<strong>WIOA:</strong> Adults and dislocated workers who meet income guidelines...
  may qualify for WIOA funding, which covers tuition...
```

Per owner instruction: this program is **self-payment only**. WIOA and JRI copy must be removed.

Also line 18:
```tsx
WIOA, JRI, and workforce funding may cover tuition at no cost — check eligibility before paying.
```
Remove this line.

---

### CONTENT-2 — BarberEnrollment.tsx line 56 says "BNPL finances your down payment"

```tsx
Weekly invoices sent every Friday. BNPL finances your down payment — remaining balance paid weekly.
```

This is inaccurate. BNPL (Affirm, Sezzle) finances the **full tuition** or the **setup fee**, not just the down payment. The copy is confusing.

---

## BNPL ISSUES

### BNPL-1 — 5 providers shown, only 2 have dedicated checkout routes

| Provider | Route | Status |
|----------|-------|--------|
| Affirm | `/api/affirm/checkout` | ✅ Wired |
| Sezzle | `/api/sezzle/checkout` | ✅ Wired |
| Klarna | Stripe PMC only | ⚠️ No dedicated route — depends on PMC config |
| Afterpay | Stripe PMC only | ⚠️ No dedicated route — depends on PMC config |
| Zip | Not wired anywhere | ❌ Shown in UI, no checkout path |

Klarna and Afterpay work only if the Stripe PMC (`pmc_1SczlEIRNf5vPH3Ai841igCB`) has them enabled. In test mode, `STRIPE_PMC_BARBER_TEST` must be set or they silently disappear. Zip has no checkout path at all.

**Fix:** Set `enabled: false` in `lib/bnpl-config.ts` for Zip until it is wired. Add a note in the config that Klarna/Afterpay depend on the Stripe PMC.

---

### BNPL-2 — Sezzle max order is $2,500; program costs $4,980

**File:** `lib/bnpl-config.ts` line 37: `maxAmount: 2500`

Sezzle's maximum order amount is $2,500. The barber program costs $4,980. Sezzle cannot finance the full program. It can only finance the $600 setup fee (which is within the $35–$2,500 range). The UI does not communicate this limit — a student selecting Sezzle for the full program will be rejected at checkout.

**Fix:** Either (a) limit Sezzle to setup-fee-only checkout, or (b) add a UI note that Sezzle covers the setup fee only.

---

### BNPL-3 — Affirm max is $30,000 but min approval amount for education is typically $1,000+

Affirm's `minAmount: 50` in the config is the technical minimum, not the practical approval threshold. For education financing, Affirm typically requires $1,000+ and a soft credit check. Students selecting Affirm for the $600 setup fee may be declined. No fallback is shown.

---

## PAYMENT PLAN MATH ISSUES

### MATH-1 — Weekly payment calculation ignores the down payment amount

**File:** `lib/programs/pricing.ts` `calculateWeeklyPayment()`

```ts
const remainingBalance = Math.max(0, fullPrice - downPayment);
const weeklyPaymentDollars = Math.round((remainingBalance / weeksRemaining) * 100) / 100;
```

This is correct. But the API (`public/route.ts`) recalculates differently:

```ts
const weeklyPayment = weeksRemaining > 0
  ? Math.round(((adjustedFullPrice - checkoutAmount) / weeksRemaining) * 100) / 100
  : 0;
```

Where `checkoutAmount` is the setup fee (which may be $1,743 due to BUG-1). So the weekly payment shown in the Stripe session description is calculated from the wrong setup fee amount.

---

### MATH-2 — Transfer hours reduce the price but the weekly payment term stays at 29 weeks

**File:** `lib/programs/pricing.ts` lines 44–57

```ts
const hoursRemaining = Math.max(0, totalHoursRequired - transferredHoursVerified);
const weeksRemaining = paymentTermWeeks; // ← always 29, ignores hoursRemaining
```

A student with 1,000 transfer hours (50% complete) gets their price halved to $2,490 but still pays over 29 weeks. The weekly payment is $2,490 / 29 = $85.86/week. This may be intentional (fixed term regardless of hours) but the `hoursRemaining` return value is misleading — it's calculated but not used in the payment term.

The `public/route.ts` uses a different calculation:
```ts
const weeksRemaining = Math.ceil(hoursRemaining / hours_per_week);
```
This uses actual hours to derive weeks — contradicting the fixed 29-week term in `pricing.ts`.

**Two different week calculations are in use simultaneously.** The form shows one number; the API charges based on another.

---

## STRUCTURAL ISSUES

### STRUCT-1 — `barber/checkout` (authenticated) is never called by the UI

`ApprenticeForm.tsx` calls `/api/barber/checkout/public` for payment plans and `/api/barber/checkout/full` for pay-in-full. The authenticated `/api/barber/checkout` (subscription mode) is not called by any UI component in the barber apply flow. It may be dead code or used by a different entry point.

---

### STRUCT-2 — Webhook uses `createClient()` (user session) not `createAdminClient()`

**File:** `app/api/barber/webhook/route.ts` line 110

```ts
const supabase = await createClient();
const adminClient = createAdminClient();
if (!supabase) { ... }
```

Webhook handlers must use the admin client (service role) — they run without a user session. Using `createClient()` in a webhook context returns a client with no authenticated user, which means all RLS-protected tables will block writes. The `adminClient` is created but then `supabase` (the user client) is used for all DB operations in the handler.

---

### STRUCT-3 — `barber_subscriptions` table is written by the webhook but never read by the LMS

The webhook inserts into `barber_subscriptions` on enrollment. The learner dashboard, LMS course page, and enrollment integrity checks all read from `program_enrollments`. There is no code that syncs `barber_subscriptions` → `program_enrollments`. A barber student who pays via the public form will have a `barber_subscriptions` row but no `program_enrollments` row — they will not appear as enrolled in the LMS.

---

## SUMMARY TABLE

| ID | Severity | Issue |
|----|----------|-------|
| BUG-1 | **P0** | $600 deposit overridden to $1,743 by API |
| BUG-2 | **P0** | Three checkout routes with incompatible billing models |
| BUG-3 | **P0** | All 29 weekly invoices sent immediately on enrollment |
| BUG-4 | P1 | Local PRICING constant contradicts lib/programs/pricing.ts |
| BUG-5 | P1 | Duplicate-enrollment check queries wrong table |
| CONTENT-1 | P1 | WIOA/JRI copy on self-pay program page |
| CONTENT-2 | P2 | Inaccurate BNPL copy ("finances your down payment") |
| BNPL-1 | P1 | Zip shown in UI with no checkout path |
| BNPL-2 | P1 | Sezzle max $2,500 — cannot finance $4,980 program |
| BNPL-3 | P2 | Affirm min approval threshold not communicated |
| MATH-1 | P1 | Weekly payment calculated from wrong setup fee amount |
| MATH-2 | P1 | Two different week calculations in use simultaneously |
| STRUCT-1 | P2 | Authenticated checkout route likely dead code |
| STRUCT-2 | **P0** | Webhook uses user session client instead of admin client |
| STRUCT-3 | **P0** | barber_subscriptions not synced to program_enrollments — enrolled students invisible to LMS |

---

## IMMEDIATE FIXES (P0 — do these first)

### Fix 1 — $600 deposit (BUG-1)

In `app/api/barber/checkout/public/route.ts`:

```ts
// Line 120 — change:
const minSetupFee = Math.round(adjustedFullPrice * 0.35);
// to:
const minSetupFee = BARBER_PRICING.minDownPayment; // $600

// Lines 140-141 — change:
const setupFee = custom_setup_fee
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : Math.round(adjustedFullPrice * 0.35);
// to:
const setupFee = custom_setup_fee
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : minSetupFee;
```

### Fix 2 — Webhook must use admin client (STRUCT-2)

In `app/api/barber/webhook/route.ts`:

```ts
// Remove:
const supabase = await createClient();
const adminClient = createAdminClient();
if (!supabase) { ... }

// Replace with:
const supabase = createAdminClient(); // throws if env vars missing
```

Then replace all `supabase.from(...)` calls in the webhook with the admin client.

### Fix 3 — Stop sending 29 invoices at once (BUG-3)

Remove the `scheduleWeeklyInvoices()` call from the webhook entirely. Replace with a Stripe subscription (already implemented in `/api/barber/checkout`) or a cron job that creates one invoice per week.

### Fix 4 — Sync barber_subscriptions to program_enrollments (STRUCT-3)

In the barber webhook, after inserting into `barber_subscriptions`, call `createOrUpdateEnrollment()` from `lib/enrollment-service.ts` to create the canonical `program_enrollments` row.

### Fix 5 — Remove WIOA/JRI copy (CONTENT-1)

In `BarberEnrollment.tsx`:
- Remove lines 139–145 (JRI and WIOA paragraphs)
- Remove line 18 ("WIOA, JRI, and workforce funding may cover tuition...")
- Replace with: "This program is self-pay. Payment plans and BNPL financing available."

### Fix 6 — Disable Zip in BNPL config (BNPL-1)

In `lib/bnpl-config.ts`:
```ts
{
  id: 'zip',
  enabled: false, // no checkout route wired
}
```
