# Stripe Licensing Setup Guide

## Step 1: Create Product in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add Product"
3. Name: "Elevate Workforce Platform License"
4. Description: "Full access to Elevate LMS platform"

## Step 2: Create Prices

### Monthly Price

- Click "Add Price" on the product
- Pricing model: Recurring
- Amount: $99.00
- Billing period: Monthly
- Copy the Price ID (starts with `price_`)

### Annual Price

- Click "Add Price" on the product
- Pricing model: Recurring
- Amount: $899.00
- Billing period: Yearly
- Copy the Price ID (starts with `price_`)

## Step 3: Enable Customer Portal

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Enable the Customer Portal
3. Configure allowed actions:
   - Update payment methods: ON
   - Cancel subscriptions: ON
   - Switch plans: ON

## Step 4: Configure Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://www.elevateforhumanity.org/api/license/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `charge.dispute.created`
5. Copy the Signing Secret (starts with `whsec_`)

## Step 5: Add Environment Variables

Add these to Netlify:

```
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_ANNUAL=price_xxxxx
STRIPE_WEBHOOK_SECRET=<STRIPE_WEBHOOK_SECRET>
```

## Step 6: Test

1. Go to /store on your site
2. Click "Start Free Trial" on Monthly or Annual
3. Complete checkout with test card: 4242 4242 4242 4242
4. Verify license is created in database
