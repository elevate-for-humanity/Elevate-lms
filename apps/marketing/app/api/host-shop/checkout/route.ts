import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';
import { HOST_SHOP_PRICE_LOOKUP_KEYS } from '@/lib/platform/orchestration/commerce';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';
const APPLICATION_FEE_CENTS = 5000;

type CheckoutBody = {
  businessName?: string;
  businessType?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  licenseNumber?: string;
  address?: string;
  courseSlug?: string;
};

function clean(value: unknown, max = 240): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const businessName = clean(body.businessName);
  const businessType = clean(body.businessType, 80);
  const contactName = clean(body.contactName);
  const contactEmail = clean(body.contactEmail, 320).toLowerCase();
  const contactPhone = clean(body.contactPhone, 40);
  const licenseNumber = clean(body.licenseNumber, 120);
  const address = clean(body.address, 500);
  const courseSlug = clean(body.courseSlug, 120) || 'barber-apprenticeship';

  if (!businessName || !contactName || !validEmail(contactEmail)) {
    return NextResponse.json(
      { error: 'Business name, contact name, and a valid email are required' },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payment service is unavailable' }, { status: 503 });

  let price;
  try {
    price = await resolveCanonicalStripePrice(stripe, {
      lookupKey: HOST_SHOP_PRICE_LOOKUP_KEYS.application_fee,
      unitAmount: APPLICATION_FEE_CENTS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Host Shop application fee is temporarily unavailable',
        detail: error instanceof Error ? error.message : 'Price not configured',
      },
      { status: 503 },
    );
  }

  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await db
    .from('host_shop_applications')
    .select('id,stripe_session_id,application_fee_status,created_at')
    .eq('email', contactEmail)
    .eq('status', 'drafted')
    .eq('application_fee_status', 'pending')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.stripe_session_id) {
    try {
      const priorSession = await stripe.checkout.sessions.retrieve(existing.stripe_session_id);
      if (priorSession.status === 'open' && priorSession.url) {
        return NextResponse.json({
          applicationId: existing.id,
          sessionId: priorSession.id,
          url: priorSession.url,
          reused: true,
        });
      }
    } catch {
      // Expired/missing Stripe session: create a replacement for the same draft.
    }
  }

  let applicationId = existing?.id as string | undefined;
  if (!applicationId) {
    const { data: created, error } = await db
      .from('host_shop_applications')
      .insert({
        shop_name: businessName,
        business_name: businessName,
        owner_name: contactName,
        email: contactEmail,
        contact_email: contactEmail,
        phone: contactPhone || null,
        address: address || null,
        course_slug: courseSlug,
        license_info: licenseNumber ? { license_number: licenseNumber } : {},
        intake: businessType ? { business_type: businessType } : {},
        status: 'drafted',
        application_fee_status: 'pending',
        application_fee_amount_cents: APPLICATION_FEE_CENTS,
      })
      .select('id')
      .single();

    if (error || !created) {
      logger.error('[host-shop/checkout] draft application creation failed', error ?? undefined);
      return NextResponse.json({ error: 'Could not start the Host Shop application' }, { status: 500 });
    }
    applicationId = created.id;
  }

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: price.id, quantity: 1 }],
        customer_email: contactEmail,
        client_reference_id: applicationId,
        metadata: {
          type: 'host_shop_application_fee',
          checkout_type: 'host_shop_application_fee',
          application_id: applicationId,
          price_lookup_key: HOST_SHOP_PRICE_LOOKUP_KEYS.application_fee,
        },
        payment_intent_data: {
          metadata: {
            type: 'host_shop_application_fee',
            application_id: applicationId,
          },
        },
        success_url: `${SITE_URL}/host-shop/apply/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/host-shop/apply?application_id=${encodeURIComponent(applicationId)}&checkout=cancelled`,
        billing_address_collection: 'required',
        automatic_tax: { enabled: false },
      },
      { idempotencyKey: `host-shop-application-fee:${applicationId}` },
    );

    const { error: updateError } = await db
      .from('host_shop_applications')
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', applicationId);
    if (updateError) {
      logger.error('[host-shop/checkout] failed to persist Stripe session', updateError, {
        applicationId,
        sessionId: session.id,
      });
    }

    try {
      await emitPlatformEvent(db, {
        eventType: PlatformEventType.COMMERCE_CHECKOUT_CREATED,
        category: 'commerce',
        source: 'marketing.api.host-shop.checkout',
        subjectType: 'host_shop_application',
        subjectId: applicationId,
        correlationId: session.id,
        idempotencyKey: `host-shop-application-checkout:${session.id}`,
        dispatch: false,
        payload: {
          application_id: applicationId,
          amount_cents: APPLICATION_FEE_CENTS,
          stripe_price_id: price.id,
        },
      });
    } catch {
      // Event telemetry cannot invalidate a valid payment session.
    }

    return NextResponse.json({ applicationId, sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('[host-shop/checkout] Stripe session creation failed', error instanceof Error ? error : undefined, {
      applicationId,
    });
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 502 });
  }
}
