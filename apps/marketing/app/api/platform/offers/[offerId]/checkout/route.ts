import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe, stripeCall } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const { offerId } = await params;
  const body = await request.json().catch(() => ({}));
  const customerEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  const successUrl = typeof body.successUrl === 'string' && body.successUrl.startsWith(SITE)
    ? body.successUrl
    : `${SITE}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = typeof body.cancelUrl === 'string' && body.cancelUrl.startsWith(SITE)
    ? body.cancelUrl
    : `${SITE}/checkout/cancelled`;

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: offer, error: offerError } = await db
    .from('tenant_offers')
    .select('*')
    .eq('id', offerId)
    .eq('active', true)
    .maybeSingle();
  if (offerError || !offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });

  const { data: account } = await db
    .from('organization_payment_accounts')
    .select('*')
    .eq('tenant_id', offer.tenant_id)
    .maybeSingle();
  if (!account?.stripe_account_id || !account.charges_enabled) {
    return NextResponse.json({ error: 'This seller is not ready to accept payments yet.' }, { status: 409 });
  }

  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });

  try {
    const session = await stripeCall(() => stripe.checkout.sessions.create({
      mode: offer.pricing_type === 'subscription' ? 'subscription' : 'payment',
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: String(offer.currency || 'usd').toLowerCase(),
          unit_amount: offer.amount_cents,
          product_data: {
            name: offer.name,
            description: offer.description || undefined,
            metadata: {
              tenant_id: offer.tenant_id,
              offer_id: offer.id,
            },
          },
          ...(offer.pricing_type === 'subscription'
            ? { recurring: { interval: offer.billing_interval || 'month' } }
            : {}),
        },
      }],
      metadata: {
        kind: 'tenant_offer',
        tenant_id: offer.tenant_id,
        organization_id: offer.organization_id || '',
        offer_id: offer.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    }, {
      stripeAccount: account.stripe_account_id,
    }));

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout did not return a payment URL.' }, { status: 502 });
    }

    await db.from('tenant_orders').insert({
      tenant_id: offer.tenant_id,
      offer_id: offer.id,
      stripe_account_id: account.stripe_account_id,
      stripe_checkout_session_id: session.id,
      customer_email: customerEmail || null,
      amount_total: offer.amount_cents,
      currency: offer.currency,
      status: 'pending',
      metadata: {
        pricing_type: offer.pricing_type,
        billing_interval: offer.billing_interval,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch {
    return NextResponse.json({ error: 'Could not create checkout.' }, { status: 502 });
  }
}
