# Stripe Product Setup Guide

## Current Configuration

Stripe is configured with live keys:
- ✅ Publishable Key: `pk_live_51Rvqjz...`
- ✅ Secret Key: `sk_live_51Rvqjz...`
- ✅ Webhook Secret: `whsec_9FCfU8B...`
- ✅ License Webhook Secret: `whsec_O5TdVYR...`

## Products to Create in Stripe Dashboard

### 1. Student Access Subscription
- **Name:** Student Access
- **Price:** $39.00/month
- **Type:** Recurring (monthly)
- **Metadata:**
  - `product_type`: `subscription`
  - `tier`: `student`

After creating, add the Price ID to:
```typescript
// lib/stripe/app-store-products.ts
stripePriceId: 'price_xxxxx' // Student Access
```

### 2. Career Track Subscription
- **Name:** Career Track Access
- **Price:** $149.00/month
- **Type:** Recurring (monthly)
- **Metadata:**
  - `product_type`: `subscription`
  - `tier`: `career`

After creating, add the Price ID to:
```typescript
// lib/stripe/app-store-products.ts
stripePriceId: 'price_xxxxx' // Career Track
```

### 3. Program Enrollments (One-Time)

Create products for each program:

| Program | Price | Metadata |
|---------|-------|----------|
| CNA Training | $2,200 | `product_type: program, program_id: prog-cna` |
| HVAC Technician | $4,800 | `product_type: program, program_id: prog-hvac` |
| CDL Training | $5,200 | `product_type: program, program_id: prog-cdl` |
| Business Apprentice | $3,500 | `product_type: program, program_id: prog-biz` |
| Esthetics Apprentice | $4,200 | `product_type: program, program_id: prog-esthetics` |

After creating, add Price IDs to:
```typescript
// lms-data/paymentPlans.ts
stripePaymentLink: undefined, // Configure in Stripe Dashboard
```

## Webhook Configuration

Webhooks are already configured. Ensure these endpoints are registered in Stripe:

1. **Main Webhook:** `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

2. **License Webhook:** `https://yourdomain.com/api/webhooks/stripe-identity`
   - Events: `identity.verification_session.*`

## Testing

1. Create products in Stripe Dashboard
2. Copy Price IDs to code
3. Test checkout flow at `/checkout/student`
4. Verify webhook fires at `/api/webhooks/stripe`
5. Check database for enrollment record

## Webhook Testing

### Using Stripe CLI (Recommended)

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.created
   ```

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates enrollment, sends welcome email |
| `customer.subscription.created` | Activates subscription access |
| `customer.subscription.updated` | Updates subscription status |
| `customer.subscription.deleted` | Revokes access |
| `invoice.paid` | Records payment |
| `invoice.payment_failed` | Sends payment failure notification |

### Webhook Security

- ✅ Signature verification enabled
- ✅ Idempotency check (prevents duplicate processing)
- ✅ Audit logging for all events
- ✅ Error handling with proper status codes

## Verification Checklist

- [ ] Student Access product created with correct price
- [ ] Career Track product created with correct price
- [ ] Program products created for each offering
- [ ] Price IDs added to `app-store-products.ts`
- [ ] Price IDs added to `paymentPlans.ts`
- [ ] Webhooks registered in Stripe Dashboard
- [ ] Webhook signature verified with test event
- [ ] Test checkout completed successfully
- [ ] Enrollment record created in database
- [ ] Welcome email received
