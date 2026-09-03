# STRIPE LICENSE AUDIT

**Status**: IN PROGRESS  
**Last Updated**: 2026-06-23  
**Auditor**: OpenHands

---

## Audit Questions

| Question | Status | Evidence |
|----------|--------|----------|
| 1. Stripe Products created? | ❌ **NOT YET** | No products in Stripe dashboard |
| 2. Price IDs in database? | ❌ **NOT YET** | No license_prices table |
| 3. Self-serve purchase? | ❌ **NOT YET** | Manual process only |
| 4. Automated provisioning? | ❌ **NOT YET** | No checkout → tenant flow |
| 5. Webhooks configured? | ❌ **NOT YET** | No webhook handlers |
| 6. Post-purchase workflow? | ❌ **NOT YET** | Manual activation |

---

## Current Reality

```
Licensing Framework: 100% (docs only)
Business Model: 100% (docs only)
Stripe Sales Automation: 0%
```

**What's done**: Documentation of license tiers, pricing, and features.  
**What's NOT done**: Actual Stripe integration, automated provisioning, webhook handlers.

---

## What Needs to Be Built

### Phase 1: Stripe Configuration

#### 1.1 Create Stripe Products

Required products in Stripe Dashboard:

```typescript
// These need to be created manually in Stripe Dashboard

const STRIPE_PRODUCTS = {
  // Single School License
  'single-school-setup': {
    name: 'Single School License - Setup',
    type: 'one-time',
    price: 250000, // $2,500
  },
  'single-school-monthly': {
    name: 'Single School License - Monthly',
    type: 'recurring',
    price: 9900, // $99/month
    interval: 'month',
  },
  
  // Multi-Site License  
  'multi-site-setup': {
    name: 'Multi-Site License - Setup',
    type: 'one-time',
    price: 500000, // $5,000
  },
  'multi-site-monthly': {
    name: 'Multi-Site License - Monthly',
    type: 'recurring',
    price: 29900, // $299/month
    interval: 'month',
  },
  
  // Enterprise License
  'enterprise-setup': {
    name: 'Enterprise License - Setup',
    type: 'one-time',
    price: 1000000, // $10,000
  },
  'enterprise-monthly': {
    name: 'Enterprise License - Monthly',
    type: 'recurring',
    price: 79900, // $799/month
    interval: 'month',
  },
  
  // Apprenticeship License
  'apprenticeship-setup': {
    name: 'Apprenticeship License - Setup',
    type: 'one-time',
    price: 500000, // $5,000
  },
  'apprenticeship-monthly': {
    name: 'Apprenticeship License - Monthly',
    type: 'recurring',
    price: 39900, // $399/month
    interval: 'month',
  },
  
  // White Label License
  'whitelabel-setup': {
    name: 'White Label License - Setup',
    type: 'one-time',
    price: 1500000, // $15,000
  },
  'whitelabel-monthly': {
    name: 'White Label License - Monthly',
    type: 'recurring',
    price: 149900, // $1,499/month
    interval: 'month',
  },
};
```

#### 1.2 Store Price IDs in Database

Required database table:

```sql
CREATE TABLE license_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_type TEXT NOT NULL, -- 'single-school', 'multi-site', 'enterprise', 'apprenticeship', 'whitelabel'
  price_type TEXT NOT NULL, -- 'setup' or 'monthly'
  stripe_product_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_type, price_type)
);

-- Seed data
INSERT INTO license_prices (license_type, price_type, stripe_product_id, stripe_price_id, amount_cents) VALUES
  ('single-school', 'setup', 'prod_xxx', 'price_xxx', 250000),
  ('single-school', 'monthly', 'prod_xxx', 'price_xxx', 9900),
  ('multi-site', 'setup', 'prod_xxx', 'price_xxx', 500000),
  ('multi-site', 'monthly', 'prod_xxx', 'price_xxx', 29900),
  ('enterprise', 'setup', 'prod_xxx', 'price_xxx', 1000000),
  ('enterprise', 'monthly', 'prod_xxx', 'price_xxx', 79900),
  ('apprenticeship', 'setup', 'prod_xxx', 'price_xxx', 500000),
  ('apprenticeship', 'monthly', 'prod_xxx', 'price_xxx', 39900),
  ('whitelabel', 'setup', 'prod_xxx', 'price_xxx', 1500000),
  ('whitelabel', 'monthly', 'prod_xxx', 'price_xxx', 149900);
```

---

### Phase 2: Database Schema

#### 2.1 License Agreements

```sql
CREATE TABLE license_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  license_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  setup_price_id TEXT,
  monthly_price_id TEXT,
  status TEXT DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'cancelled', 'expired'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE license_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_agreement_id UUID REFERENCES license_agreements(id),
  seat_type TEXT NOT NULL, -- 'student', 'instructor', 'admin'
  total_included INTEGER NOT NULL,
  total_used INTEGER DEFAULT 0,
  overage_enabled BOOLEAN DEFAULT false,
  overage_price_id TEXT,
  overage_price_cents INTEGER
);

CREATE TABLE license_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_agreement_id UUID REFERENCES license_agreements(id),
  addon_type TEXT NOT NULL, -- 'additional-location', 'additional-instructor', 'additional-students'
  quantity INTEGER DEFAULT 1,
  stripe_price_id TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE license_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_agreement_id UUID REFERENCES license_agreements(id),
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void'
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 White Label Tenants

```sql
CREATE TABLE white_label_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_agreement_id UUID REFERENCES license_agreements(id),
  organization_id UUID REFERENCES organizations(id),
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  organization_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  secondary_color TEXT DEFAULT '#06b6d4',
  show_powered_by BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'provisioning', -- 'provisioning', 'active', 'suspended', 'terminated'
  provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Phase 3: API Routes

#### 3.1 Checkout Session

```typescript
// apps/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const supabase = getServerClient();
  
  const { 
    licenseType, 
    organizationName, 
    organizationEmail,
    customerEmail 
  } = await request.json();
  
  // 1. Get price IDs from database
  const { data: setupPrice } = await supabase
    .from('license_prices')
    .select('stripe_price_id')
    .eq('license_type', licenseType)
    .eq('price_type', 'setup')
    .single();
    
  const { data: monthlyPrice } = await supabase
    .from('license_prices')
    .select('stripe_price_id')
    .eq('license_type', licenseType)
    .eq('price_type', 'monthly')
    .single();
  
  // 2. Create or retrieve Stripe customer
  const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
  let customer = customers.data[0];
  
  if (!customer) {
    customer = await stripe.customers.create({
      email: customerEmail,
      name: organizationName,
      metadata: {
        organization_name: organizationName,
        license_type: licenseType,
      },
    });
  }
  
  // 3. Create checkout session with setup + subscription
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [
      {
        price: setupPrice.stripe_price_id,
        quantity: 1,
      },
      {
        price: monthlyPrice.stripe_price_id,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/license/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/license/cancelled`,
    subscription_data: {
      metadata: {
        license_type: licenseType,
        organization_name: organizationName,
      },
      trial_period_days: 14,
    },
    metadata: {
      license_type: licenseType,
      organization_name: organizationName,
    },
  });
  
  return NextResponse.json({ url: session.url });
}
```

#### 3.2 Webhook Handler

```typescript
// apps/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { getServerClient } from '@/lib/supabase/server';

const stripe = getStripeClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  const supabase = getServerClient();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(supabase, session);
      break;
    }
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(supabase, subscription);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(supabase, subscription);
      break;
    }
    
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(supabase, invoice);
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(supabase, invoice);
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(
  supabase: any, 
  session: Stripe.Checkout.Session
) {
  const { license_type, organization_name } = session.metadata || {};
  
  // 1. Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: organization_name,
      stripe_customer_id: session.customer,
      status: 'active',
    })
    .select()
    .single();
  
  // 2. Create license agreement
  const subscriptionId = session.subscription as string;
  const { data: license } = await supabase
    .from('license_agreements')
    .insert({
      organization_id: org.id,
      license_type,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscriptionId,
      status: 'trial',
    })
    .select()
    .single();
  
  // 3. Create default seats based on license type
  const seats = getDefaultSeats(license_type);
  for (const seat of seats) {
    await supabase.from('license_seats').insert({
      license_agreement_id: license.id,
      ...seat,
    });
  }
  
  // 4. Send welcome email
  await sendWelcomeEmail(org, license_type);
  
  // 5. Queue onboarding task
  await queueOnboarding(org.id, license.id);
}

async function handleSubscriptionUpdate(
  supabase: any, 
  subscription: Stripe.Subscription
) {
  await supabase
    .from('license_agreements')
    .update({
      status: subscription.status === 'active' ? 'active' : 'past_due',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionCancelled(
  supabase: any, 
  subscription: Stripe.Subscription
) {
  await supabase
    .from('license_agreements')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

function getDefaultSeats(licenseType: string) {
  const defaults: Record<string, any[]> = {
    'single-school': [
      { seat_type: 'student', total_included: 100 },
      { seat_type: 'instructor', total_included: 1 },
    ],
    'multi-site': [
      { seat_type: 'student', total_included: 500 },
      { seat_type: 'instructor', total_included: 10 },
    ],
    'enterprise': [
      { seat_type: 'student', total_included: 100000 }, // effectively unlimited
      { seat_type: 'instructor', total_included: 100000 },
    ],
    'apprenticeship': [
      { seat_type: 'student', total_included: 50 },
      { seat_type: 'instructor', total_included: 2 },
    ],
  };
  return defaults[licenseType] || defaults['single-school'];
}
```

---

### Phase 4: Tenant Provisioning

#### 4.1 Provision White Label Tenant

```typescript
// lib/license/tenant-provisioner.ts
export async function provisionWhiteLabelTenant(
  licenseId: string,
  options: {
    subdomain?: string;
    organizationName: string;
    customDomain?: string;
    logoUrl?: string;
    colors?: { primary?: string; secondary?: string };
  }
): Promise<WhiteLabelTenant> {
  const supabase = getServerClient();
  
  // 1. Generate subdomain from org name
  const subdomain = options.subdomain || slugify(options.organizationName);
  
  // 2. Create tenant record
  const { data: tenant, error } = await supabase
    .from('white_label_tenants')
    .insert({
      license_agreement_id: licenseId,
      subdomain,
      custom_domain: options.customDomain,
      organization_name: options.organizationName,
      logo_url: options.logoUrl,
      primary_color: options.colors?.primary,
      secondary_color: options.colors?.secondary,
      status: 'provisioning',
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 3. Set up subdomain DNS (requires DNS provider integration)
  await configureSubdomainDNS(subdomain);
  
  // 4. Load curriculum based on license
  const license = await getLicenseAgreement(licenseId);
  await loadCurriculum(tenant.id, license.license_type);
  
  // 5. Create admin user
  await createTenantAdmin(tenant.id, options.organizationName);
  
  // 6. Update status
  await supabase
    .from('white_label_tenants')
    .update({ 
      status: 'active',
      provisioned_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);
  
  return tenant;
}
```

---

### Phase 5: Customer Portal

```typescript
// apps/app/api/stripe/portal/route.ts
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const supabase = getServerClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get customer's subscription
  const { data: license } = await supabase
    .from('license_agreements')
    .select('stripe_customer_id')
    .eq('organization_id', user.organization_id)
    .single();
  
  if (!license?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }
  
  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: license.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/license`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

---

## Implementation Checklist

### Stripe Setup
- [ ] Create Stripe account
- [ ] Set up Stripe products for all 5 license types
- [ ] Get Price IDs for each product
- [ ] Store Price IDs in license_prices table
- [ ] Configure Stripe API keys in environment

### Database
- [ ] Create license_agreements table
- [ ] Create license_seats table
- [ ] Create license_addons table
- [ ] Create license_invoices table
- [ ] Create white_label_tenants table
- [ ] Seed license_prices table

### API Routes
- [ ] Create `/api/stripe/checkout` POST endpoint
- [ ] Create `/api/stripe/webhook` POST endpoint
- [ ] Create `/api/stripe/portal` POST endpoint
- [ ] Test checkout flow
- [ ] Configure webhook endpoint in Stripe

### Tenant Provisioning
- [ ] Create tenant provisioner function
- [ ] Set up DNS configuration for subdomains
- [ ] Create admin user on provision
- [ ] Load curriculum on provision
- [ ] Test full provisioning flow

### Email Notifications
- [ ] Set up welcome email template
- [ ] Configure Stripe email notifications
- [ ] Set up dunning emails for failed payments
- [ ] Create cancellation confirmation email

### Testing
- [ ] Test checkout with test card
- [ ] Test webhook handlers
- [ ] Test subscription cancellation
- [ ] Test customer portal
- [ ] Test full tenant provisioning

### Production
- [ ] Move from test to live Stripe keys
- [ ] Update webhook URL to production
- [ ] Enable Stripe Radar fraud detection
- [ ] Set up Stripe Sigma for reporting

---

## Current Status: 0% → Need to Build

| Component | Status | Notes |
|-----------|--------|-------|
| Stripe Products | ❌ Not Created | Need to create in dashboard |
| Price IDs in DB | ❌ Not Created | Need license_prices table |
| Checkout API | ❌ Not Built | Need /api/stripe/checkout |
| Webhook Handler | ❌ Not Built | Need /api/stripe/webhook |
| Customer Portal | ❌ Not Built | Need /api/stripe/portal |
| Tenant Provisioner | ❌ Not Built | Need provisioning logic |
| Email Notifications | ❌ Not Built | Need welcome/onboarding emails |

---

## Time Estimate

**To fully implement Stripe licensing:**

| Task | Hours |
|------|-------|
| Stripe Dashboard setup | 1 |
| Database schema | 2 |
| Checkout API | 4 |
| Webhook handlers | 6 |
| Customer portal | 2 |
| Tenant provisioning | 8 |
| Email templates | 4 |
| Testing | 8 |
| **Total** | **35 hours** |

---

## Next Action

1. Create Stripe account (if not done)
2. Create Stripe products manually in dashboard
3. Run migration for database tables
4. Implement API routes one by one
5. Test with Stripe test mode
6. Go live

---

*© 2026 Elevate for Humanity. All Rights Reserved.*
