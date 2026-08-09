/**
 * POST /api/apps/website-builder/sites/[websiteId]/domains/connect
 * Connect a domain the customer already owns (BYO). Returns the CNAME
 * the customer must publish at their DNS provider. Domainee provisions SSL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { connectDomain, isDomaineeConfigured } from '@/lib/domainee/client';
import {
  requireCustomDomainEntitlement,
  resolveOwnedSite,
  validateHostname,
} from '@/lib/domainee/site-resolver';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ error: 'Publish the website before connecting a custom domain.' }, { status: 409 });
  }

  if (!isDomaineeConfigured()) {
    return NextResponse.json({ error: 'Domain service is temporarily unavailable.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const hostname = validateHostname(String(body.hostname ?? ''));
  if (!hostname) {
    return NextResponse.json({ error: 'Enter a valid domain (e.g. shop.example.com)' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('website_domains')
    .select('id, status, domainee_domain_id')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .ilike('hostname', hostname)
    .neq('status', 'deleted')
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'This domain is already connected to your site.' }, { status: 409 });
  }

  const idempotencyKey = `elevate-connect-${websiteId}-${hostname}`;
  try {
    const result = await connectDomain(hostname, originUrl, {
      metadata: { websiteId, userId: user.id, siteName: site.site_name },
      idempotencyKey,
    });
    const domain = result.domain;

    const { data: row, error: insertError } = await supabase
      .from('website_domains')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        hostname: domain.hostname,
        domainee_domain_id: domain.id,
        mode: 'connect',
        status: domain.status,
        origin_url: domain.originUrl,
        dns_records: domain.dnsRecords,
        verification_token: domain.verificationToken,
        monitor_status: domain.monitorStatus,
        points_to_edge: domain.pointsToEdge,
        metadata: { idempotencyKey },
      })
      .select('*')
      .maybeSingle();
    if (insertError) {
      logger.error('website_domains insert failed', undefined, { error: insertError.message });
      return NextResponse.json({ error: 'Failed to save domain record' }, { status: 500 });
    }

    return NextResponse.json({
      domain: row,
      dnsRecords: domain.dnsRecords,
      warnings: result.warnings,
      nextStep: 'Add the CNAME shown below at your DNS provider. Elevate will verify it and activate SSL automatically.',
      cloudflareNote: 'If your domain uses Cloudflare, keep the CNAME DNS-only (grey cloud) until verification completes.',
    });
  } catch (err) {
    logger.error('domainee connect failed', err instanceof Error ? err : undefined, { hostname });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to connect domain' },
      { status: 502 },
    );
  }
}
