export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/api-helpers';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/authGuards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const licensePaymentSchema = z.object({
  productId: z.string().min(1),
  customerInfo: z.object({
    email: z.string().email(),
    contactName: z.string().min(1).max(200),
    organizationName: z.string().min(1).max(200),
    phone: z.string().regex(/^[\d\s\-()+ ]+$/).min(10).optional(),
  }),
});

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await apiAuthGuard({ requireAuth: true });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<z.infer<typeof licensePaymentSchema>>(request);
    const parsed = licensePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { productId, customerInfo } = parsed.data;

    // Get product details from DB (with hardcoded fallback during migration)
    const { getCatalogProduct } = await import('@/lib/store/db');
    let product: Awaited<ReturnType<typeof getCatalogProduct>> = null;
    try { product = await getCatalogProduct(productId); } catch { /* DB unavailable */ }
    if (!product) {
      const { ALL_PRODUCTS } = await import('@/app/data/store-products');
      const legacy = ALL_PRODUCTS.find((p) => p.id === productId || p.slug === productId);
      if (legacy) {
        product = {
          id: legacy.id,
          slug: legacy.slug,
          name: legacy.name,
          description: legacy.description,
          price: legacy.price,
          billingType: legacy.billingType as any || 'one_time',
          licenseType: legacy.licenseType as any,
          features: legacy.features || [],
          appsIncluded: legacy.appsIncluded,
          stripePriceId: legacy.stripePriceId,
          stripeProductId: undefined,
          isActive: true,
        };
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email: customerInfo.email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerInfo.email,
        name: customerInfo.contactName,
        metadata: {
          organization: customerInfo.organizationName,
          phone: customerInfo.phone || '',
        },
      });
    }

    // Create payment intent with card + BNPL options
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        productId: product.id,
        productSlug: product.slug,
        licenseType: product.licenseType,
        organizationName: customerInfo.organizationName,
        contactName: customerInfo.contactName,
        email: customerInfo.email,
        phone: customerInfo.phone || '',
      },
      description: `${product.name} - ${customerInfo.organizationName}`,
    });

    // Store pending license in database
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    await db.from('license_purchases').insert({
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: customer.id,
      product_id: product.id,
      product_slug: product.slug,
      license_type: product.licenseType,
      organization_name: customerInfo.organizationName,
      contact_name: customerInfo.contactName,
      contact_email: customerInfo.email,
      contact_phone: customerInfo.phone,
      amount: product.price,
      status: 'pending',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/store/licenses/create-payment-intent', _POST);
