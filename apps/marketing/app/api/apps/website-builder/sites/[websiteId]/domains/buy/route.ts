// pre-auth-registry: exempt - authenticated route resolves the current user and owned website before any RLS-scoped website_domains write.
// AUTH: Enforced inside handler by resolveOwnedSite(), which requires a Supabase user and ownership of websiteId.
/**
 * Payment-first domain purchase. Quotes Domainee, charges the customer through
 * Stripe, then the canonical Stripe webhook fulfills the Domainee registration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { checkDomainPurchase, isDomaineeConfigured } from '@/lib/domainee/client';
import {
  requireCustomDomainEntitlement,
  resolveOwnedSite,
  validateHostname,
} from '@/lib/domainee/site-resolver';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import type { DomaineeRegistrant } from '@/lib/domainee/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv().catch(() => undefined);
  const { websiteId } = await params;
  const resolved = await resolveOwnedSite(websiteId);
  if ('error' in resolved) return resolved.error;
  const { user, supabase, site, originUrl, entitlement } = resolved;

  const entitlementError = requireCustomDomainEntitlement(entitlement);
  if (entitlementError) return entitlementError;
  if (!site.is_published) {
    return NextResponse.json({ error: 'Publish the website before registering a custom domain.' }, { status: 409 });
  }
  if (!isDomaineeConfigured()) {
    return NextResponse.json({ error: 'Domain service is temporarily unavailable.' }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const hostname = validateHostname(String(body.hostname ?? ''));
  if (!hostname) return NextResponse.json({ error: 'Enter a valid domain to register.' }, { status: 400 });

  const years = Number(body.years) || 1;
  if (years !== 1) return NextResponse.json({ error: 'Domain checkout currently supports one-year registrations.' }, { status: 400 });

  const registrant: DomaineeRegistrant = {
    firstName: String(body.registrant?.firstName ?? '').trim(),
    lastName: String(body.registrant?.lastName ?? '').trim(),
    email: String(body.registrant?.email ?? user.email ?? '').trim(),
    phone: String(body.registrant?.phone ?? '').trim(),
    address1: String(body.registrant?.address1 ?? '').trim(),
    city: String(body.registrant?.city ?? '').trim(),
    state: String(body.registrant?.state ?? '').trim(),
    postalCode: String(body.registrant?.postalCode ?? '').trim(),
    country: String(body.registrant?.country ?? 'US').trim(),
  };
  if ([registrant.firstName, registrant.lastName, registrant.email, registrant.phone, registrant.address1, registrant.city, registrant.state, registrant.postalCode, registrant.country].some((value) => !value)) {
    return NextResponse.json({ error: 'Complete all registrant contact and address fields.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('website_domains')
    .select('id, status, payment_status')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .ilike('hostname', hostname)
    .neq('status', 'deleted')
    .maybeSingle();

  if (existing && !['awaiting_payment', 'failed'].includes(String(existing.status))) {
    return NextResponse.json({ error: 'This domain already has a connection or registration in progress.' }, { status: 409 });
  }

  try {
    const quote = await checkDomainPurchase(hostname);
    if (!quote.available) return NextResponse.json({ error: 'That domain is not available.' }, { status: 409 });

    const markupCents = Math.max(0, Number(process.env.DOMAIN_RETAIL_MARKUP_CENTS ?? 1000) || 1000);
    const retailCents = quote.pricing.totalCents + markupCents;
    const customerReference = `elevate-${user.id}-${websiteId}`;
    const pendingValues = {
      website_id: websiteId,
      user_id: user.id,
      hostname,
      mode: 'buy',
      status: 'awaiting_payment',
      payment_status: 'pending',
      provider_cost_cents: quote.pricing.totalCents,
      retail_cents: retailCents,
      origin_url: originUrl,
      customer_reference: customerReference,
      stripe_checkout_session_id: null,
      error: null,
      metadata: { years, registrant, quotedProviderCostCents: quote.pricing.totalCents, markupCents, premium: quote.premium },
    };

    let pendingId: string | null = existing?.id ?? null;
    if (pendingId) {
      const { error: resetError } = await supabase
        .from('website_domains')
        .update(pendingValues)
        .eq('id', pendingId)
        .eq('user_id', user.id);
      if (resetError) {
        logger.error('website domain pending checkout reset failed', undefined, { error: resetError.message, hostname });
        return NextResponse.json({ error: 'Could not refresh domain checkout.' }, { status: 500 });
      }
    } else {
      const { data: pending, error: insertError } = await supabase
        .from('website_domains')
        .insert(pendingValues)
        .select('id')
        .maybeSingle();
      if (insertError || !pending) {
        logger.error('website domain pending purchase insert failed', undefined, { error: insertError?.message, hostname });
        return NextResponse.json({ error: 'Could not prepare domain checkout.' }, { status: 500 });
      }
      pendingId = pending.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? registrant.email,
      client_reference_id: user.id,
      allow_promotion_codes: false,
      metadata: {
        kind: 'website_domain_purchase',
        user_id: user.id,
        website_id: websiteId,
        domain_record_id: pendingId,
        hostname,
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: String(quote.pricing.currency || 'USD').toLowerCase(),
          unit_amount: retailCents,
          product_data: {
            name: `${hostname} domain registration`,
            description: 'One-year domain registration, connection, and automatic SSL setup',
          },
        },
      }],
      success_url: `${SITE_URL}/apps/website-builder/edit/${websiteId}?domainPurchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/apps/website-builder/edit/${websiteId}?domainPurchase=cancelled`,
    });

    if (!session.url) {
      await supabase.from('website_domains').update({ status: 'failed', payment_status: 'checkout_failed' }).eq('id', pendingId);
      return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
    }

    await supabase.from('website_domains').update({ stripe_checkout_session_id: session.id }).eq('id', pendingId);
    return NextResponse.json({ checkoutUrl: session.url, retailCents, providerCostCents: quote.pricing.totalCents, hostname });
  } catch (err) {
    logger.error('domain checkout creation failed', err instanceof Error ? err : undefined, { hostname });
    return NextResponse.json({ error: 'Failed to prepare domain checkout.' }, { status: 502 });
  }
}
