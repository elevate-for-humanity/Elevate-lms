// AUTH: Enforced inside handler by resolveOwnedSite(), which requires a Supabase user and ownership of websiteId.
/** No-charge live Domainee availability/cost quote plus Elevate retail price. */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { checkDomainPurchase, isDomaineeConfigured } from '@/lib/domainee/client';
import {
  requireCustomDomainEntitlement,
  resolveOwnedSite,
  validateHostname,
} from '@/lib/domainee/site-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv().catch(() => undefined);
  const { websiteId } = await params;
  const resolved = await resolveOwnedSite(websiteId);
  if ('error' in resolved) return resolved.error;
  const entitlementError = requireCustomDomainEntitlement(resolved.entitlement);
  if (entitlementError) return entitlementError;
  if (!isDomaineeConfigured()) {
    return NextResponse.json({ error: 'Domain service is temporarily unavailable.' }, { status: 503 });
  }

  const hostname = validateHostname(request.nextUrl.searchParams.get('hostname') ?? '');
  if (!hostname) return NextResponse.json({ error: 'Enter a valid domain.' }, { status: 400 });

  try {
    const quote = await checkDomainPurchase(hostname);
    const markupCents = Math.max(0, Number(process.env.DOMAIN_RETAIL_MARKUP_CENTS ?? 1000) || 1000);
    const retailCents = quote.pricing.totalCents + markupCents;
    return NextResponse.json({
      hostname: quote.hostname,
      available: quote.available,
      premium: quote.premium,
      currency: quote.pricing.currency,
      providerCostCents: quote.pricing.totalCents,
      retailCents,
      retailFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: quote.pricing.currency || 'USD',
      }).format(retailCents / 100),
    });
  } catch {
    return NextResponse.json({ error: 'Domain quote is temporarily unavailable.' }, { status: 502 });
  }
}
