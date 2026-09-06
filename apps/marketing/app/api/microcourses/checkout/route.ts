import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { z } from 'zod';

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { paymentRateLimit } from '@/lib/rate-limit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getStripeWriteClient, stripeCall } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { assertStripePriceMatches } from '@/lib/microcourses/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CheckoutInput = z.object({
  slugs: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1).max(20).transform((items) => [...new Set(items)]),
});

export async function POST(request: Request) {
  try {
    if (paymentRateLimit) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };
      if (!success) return NextResponse.json({ error: 'Too many checkout attempts' }, { status: 429 });
    }

    const parsed = CheckoutInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Select between 1 and 20 valid microcourses' }, { status: 400 });

    await hydrateProcessEnv();
    const stripe = getStripeWriteClient();
    if (!stripe) return NextResponse.json({ error: 'Stripe checkout is not configured' }, { status: 503 });

    const admin = await requireAdminClient();
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();

    const { data: courses, error: courseError } = await admin
      .from('microcourses')
      .select('id,slug,title,provider_id,provider_cost_cents,retail_price_cents,currency,stripe_price_id,status')
      .in('slug', parsed.data.slugs)
      .eq('status', 'active');

    if (courseError) throw courseError;
    if (!courses || courses.length !== parsed.data.slugs.length) {
      return NextResponse.json({ error: 'One or more selected microcourses are unavailable' }, { status: 409 });
    }

    const providerIds = [...new Set(courses.map((course) => course.provider_id))];
    const { data: providers, error: providerError } = await admin
      .from('microcourse_providers')
      .select('id,active,stripe_account_id,transfers_capability_status')
      .in('id', providerIds);
    if (providerError) throw providerError;
    const providerById = new Map((providers || []).map((provider) => [provider.id, provider]));

    for (const course of courses) {
      const provider = providerById.get(course.provider_id);
      if (!provider?.active || !provider.stripe_account_id || provider.transfers_capability_status !== 'active') {
        return NextResponse.json({ error: `${course.title} is waiting for provider payout verification` }, { status: 409 });
      }
      if (!course.stripe_price_id) {
        return NextResponse.json({ error: `${course.title} does not have an active Stripe price` }, { status: 409 });
      }
      const price = await stripeCall(() => stripe.prices.retrieve(course.stripe_price_id));
      assertStripePriceMatches(price, course.retail_price_cents, course.currency);
    }

    const currency = courses[0].currency;
    if (courses.some((course) => course.currency !== currency)) {
      return NextResponse.json({ error: 'A cart must use one currency' }, { status: 409 });
    }

    const retailTotal = courses.reduce((sum, course) => sum + course.retail_price_cents, 0);
    const providerTotal = courses.reduce((sum, course) => sum + course.provider_cost_cents, 0);
    const orderId = crypto.randomUUID();
    const transferGroup = `microcourse_order_${orderId}`;

    const { error: orderError } = await admin.from('microcourse_orders').insert({
      id: orderId,
      user_id: user?.id || null,
      customer_email: user?.email?.toLowerCase() || null,
      currency,
      retail_total_cents: retailTotal,
      provider_total_cents: providerTotal,
      transfer_group: transferGroup,
    });
    if (orderError) throw orderError;

    const { error: itemsError } = await admin.from('microcourse_order_items').insert(courses.map((course) => ({
      order_id: orderId,
      microcourse_id: course.id,
      provider_id: course.provider_id,
      title_snapshot: course.title,
      stripe_price_id: course.stripe_price_id,
      provider_cost_cents: course.provider_cost_cents,
      retail_price_cents: course.retail_price_cents,
    })));
    if (itemsError) {
      await admin.from('microcourse_orders').update({ status: 'failed' }).eq('id', orderId);
      throw itemsError;
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl).replace(/\/$/, '');
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: courses.map((course) => ({ price: course.stripe_price_id, quantity: 1 })),
      customer_email: user?.email || undefined,
      success_url: `${siteUrl}/microcourses/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/microcourses`,
      payment_intent_data: { transfer_group: transferGroup },
      metadata: { kind: 'microcourse_purchase', order_id: orderId },
    };

    const session = await stripeCall(() => stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `microcourse-checkout-${orderId}`,
    }));
    if (!session.url) throw new Error('Stripe did not return a checkout URL');

    const { error: sessionError } = await admin.from('microcourse_orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (sessionError) throw sessionError;

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout is unavailable' },
      { status: 500 },
    );
  }
}
