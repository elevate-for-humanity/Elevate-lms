/** Force a fresh Domainee verification/status check for an owned domain. */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { resolveOwnedSite } from '@/lib/domainee/site-resolver';
import { getDomain, isDomaineeConfigured } from '@/lib/domainee/client';

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
  const { supabase } = resolved;

  const body = await request.json().catch(() => ({}));
  const domainId = String(body.domainId ?? '');
  if (!domainId) return NextResponse.json({ error: 'domainId is required' }, { status: 400 });

  const { data: row, error } = await supabase
    .from('website_domains')
    .select('*')
    .eq('id', domainId)
    .eq('website_id', websiteId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  if (!isDomaineeConfigured() || !row.domainee_domain_id) {
    return NextResponse.json({ domain: row, message: 'Domain verification is not available yet.' });
  }

  try {
    const { domain } = await getDomain(row.domainee_domain_id);
    await supabase.from('website_domains').update({
      status: domain.status,
      dns_records: domain.dnsRecords,
      monitor_status: domain.monitorStatus,
      points_to_edge: domain.pointsToEdge,
      updated_at: new Date().toISOString(),
    }).eq('id', domainId);
    return NextResponse.json({
      domain: { ...row, ...domain },
      message:
        domain.status === 'verified' || domain.status === 'active'
          ? 'Domain verified and SSL active.'
          : domain.status === 'pending'
            ? 'DNS is not resolved yet. Add the CNAME and check again shortly.'
            : `Domain status: ${domain.status}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Verification check failed' }, { status: 502 });
  }
}
