/** Live domain status and disconnect endpoint. */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { createClient } from '@/lib/supabase/server';
import { deleteDomain, getDomain, isDomaineeConfigured } from '@/lib/domainee/client';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; domainId: string }> },
) {
  await hydrateProcessEnv().catch(() => undefined);
  const { websiteId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: row, error } = await supabase
    .from('website_domains')
    .select('*')
    .eq('id', domainId)
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  if (isDomaineeConfigured() && row.domainee_domain_id) {
    try {
      const { domain } = await getDomain(row.domainee_domain_id);
      await supabase.from('website_domains').update({
        status: domain.status,
        dns_records: domain.dnsRecords,
        monitor_status: domain.monitorStatus,
        points_to_edge: domain.pointsToEdge,
        updated_at: new Date().toISOString(),
      }).eq('id', domainId);
      return NextResponse.json({ domain: { ...row, ...domain, stored: row } });
    } catch (err) {
      logger.warn('domainee status refresh failed, returning cached', { domainId, error: String(err) });
    }
  }
  return NextResponse.json({ domain: row });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; domainId: string }> },
) {
  await hydrateProcessEnv().catch(() => undefined);
  const { websiteId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: row, error } = await supabase
    .from('website_domains')
    .select('id, user_id, domainee_domain_id, status')
    .eq('id', domainId)
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  if (row.status === 'awaiting_payment' || row.status === 'processing') {
    return NextResponse.json({ error: 'This domain order cannot be disconnected while payment or registration is processing.' }, { status: 409 });
  }

  if (isDomaineeConfigured() && row.domainee_domain_id) {
    try { await deleteDomain(row.domainee_domain_id); }
    catch (err) { logger.warn('domainee delete failed', { domainId, error: String(err) }); }
  }
  const { error: delError } = await supabase
    .from('website_domains')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', domainId);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
