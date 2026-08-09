/**
 * POST /api/apps/website-builder/sites/[websiteId]/domains/buy
 * Buy a brand-new domain and auto-connect it to the site in one call.
 * Charges the workspace card (wholesale + $1); customer is legal registrant.
 *
 * NOTE: This charges the ELEVATE workspace card, not the customer's card.
 * In production, collect payment from the customer via Stripe FIRST, then
 * call this endpoint after Stripe payment success. See STRIPE integration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { buyDomain, isDomaineeConfigured } from '@/lib/domainee/client';
import { resolveOwnedSite, validateHostname } from '@/lib/domainee/site-resolver';
import { logger } from '@/lib/logger';
import type { DomaineeRegistrant } from '@/lib/domainee/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv().catch(() => {});
  const { websiteId } = await params;
  const resolved = await resolveOwnedSite(websiteId);
  if ('error' in resolved) return resolved.error;
  const { user, supabase, site, originUrl } = resolved;

  if (!isDomaineeConfigured()) {
    return NextResponse.json(
      { error: 'Domain service is not configured. Set DOMAINEE_API_KEY.' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const hostname = validateHostname(String(body.hostname ?? ''));
  if (!hostname)
    return NextResponse.json({ error: 'Enter a valid domain to register' }, { status: 400 });

  const years = Number(body.years) || 1;
  if (years < 1 || years > 10)
    return NextResponse.json({ error: 'Years must be between 1 and 10' }, { status: 400 });

  const registrant: DomaineeRegistrant = {
    firstName: String(body.registrant?.firstName ?? '').trim(),
    lastName: String(body.registrant?.lastName ?? '').trim(),
    email: String(body.registrant?.email ?? '').trim(),
    phone: String(body.registrant?.phone ?? '').trim(),
    address1: String(body.registrant?.address1 ?? '').trim(),
    city: String(body.registrant?.city ?? '').trim(),
    state: String(body.registrant?.state ?? '').trim(),
    postalCode: String(body.registrant?.postalCode ?? '').trim(),
    country: String(body.registrant?.country ?? 'US').trim(),
  };
  if (!registrant.email || !registrant.firstName || !registrant.lastName)
    return NextResponse.json(
      { error: 'Registrant name and email are required' },
      { status: 400 },
    );

  const { data: existing } = await supabase
    .from('website_domains')
    .select('id, status, domainee_domain_id')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .ilike('hostname', hostname)
    .neq('status', 'deleted')
    .maybeSingle();
  if (existing)
    return NextResponse.json(
      { error: 'This domain is already connected to your site.' },
      { status: 409 },
    );

  const customerReference = `elevate-${user.id}-${websiteId}`;
  const idempotencyKey = `elevate-buy-${websiteId}-${hostname}-${Date.now()}`;
  try {
    const result = await buyDomain(hostname, years, registrant, {
      originUrl,
      customerReference,
      idempotencyKey,
    });
    const purchase = result.purchase;

    const { data: row, error: insertError } = await supabase
      .from('website_domains')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        hostname: purchase.hostname,
        domainee_domain_id: purchase.connectedDomainId ?? null,
        domainee_purchase_id: purchase.id,
        mode: 'buy',
        status: purchase.status === 'completed' ? 'active' : purchase.status,
        origin_url: originUrl,
        customer_reference: customerReference,
        metadata: { idempotencyKey, totalCents: purchase.totalCents, years },
      })
      .select('*')
      .maybeSingle();
    if (insertError) {
      logger.error('website_domains buy insert failed', { error: insertError.message });
      return NextResponse.json({ error: 'Failed to save domain record' }, { status: 500 });
    }

    return NextResponse.json({
      domain: row,
      purchase,
      message:
        purchase.status === 'completed'
          ? 'Domain registered and connected. SSL is being provisioned.'
          : 'Domain registration is processing. We will notify you when complete.',
    });
  } catch (err) {
    logger.error('domainee buy failed', { hostname, error: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to register domain' },
      { status: 502 },
    );
  }
}
