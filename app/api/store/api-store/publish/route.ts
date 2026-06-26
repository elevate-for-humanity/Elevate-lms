
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface ProductInput {
  title: string;
  description: string;
  features: string[];
  pricing: Record<string, { price: number; name: string }>;
  demo: { enabled: boolean; url: string };
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const product: ProductInput = await req.json();

    // Create product in Stripe
    const stripeProduct = await createStripeProduct(product);

    // Save to database
    const { data, error } = await supabase
      .from('store_products')
      .upsert({
        title: product.title,
        description: product.description,
        features: product.features,
        pricing: product.pricing,
        demo_enabled: product.demo.enabled,
        demo_url: product.demo.url,
        stripe_product_id: stripeProduct.id,
        published: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      url: `/store/codebase-clone`,
      productId: data?.id,
    });
  } catch (error) {
    logger.error(
      'Failed to publish product:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to publish product', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function createStripeProduct(product: ProductInput) {
  // Create Stripe product with pricing tiers
  const stripe = getStripe();

  const stripeProduct = await stripe.products.create({
    name: product.title,
    description: product.description,
    metadata: {
      type: 'codebase_clone',
    },
  });

  // Create prices for each tier
  for (const [key, tier] of Object.entries(product.pricing)) {
    await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: tier.price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        tier: key,
        name: tier.name,
      },
    });
  }

  return stripeProduct;
}
export const POST = withApiAudit('/api/store/publish', _POST);
