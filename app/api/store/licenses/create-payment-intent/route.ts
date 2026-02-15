export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface CustomerInfo {
  email: string;
  contactName: string;
  organizationName: string;
  phone?: string;
}

interface RequestBody {
  productId: string;
  customerInfo: CustomerInfo;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await parseBody<RequestBody>(request);
    const { productId, customerInfo } = body;

    if (!productId || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product details
    const products = await import('@/app/data/store-products');
    const product = products.STORE_PRODUCTS.find((p) => p.id === productId);

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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'usd',
      customer: customer.id,
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
    await supabase.from('license_purchases').insert({
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
          ('Internal server error') ||
          'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}
