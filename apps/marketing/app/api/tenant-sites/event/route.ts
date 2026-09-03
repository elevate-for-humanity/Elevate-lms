import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePublishedTenantFromRequest } from '@/lib/tenant/resolve-public-tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const tenant = await resolvePublishedTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: 'Published website not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const eventName = clean(body.eventName, 80) || 'page_view';
  const path = clean(body.path, 500) || '/';
  const referrer = clean(body.referrer, 1000);
  const sessionKey = clean(body.sessionKey, 120);
  const allowedEvents = new Set(['page_view', 'cta_click', 'booking_click', 'product_click']);
  if (!allowedEvents.has(eventName)) {
    return NextResponse.json({ error: 'Unsupported event' }, { status: 400 });
  }

  const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  const db = await requireAdminClient();
  const { error } = await db.from('tenant_site_events').insert({
    website_id: tenant.websiteId,
    event_name: eventName,
    path,
    source_host: tenant.host,
    referrer: referrer || null,
    session_key: sessionKey || null,
    metadata,
  });

  if (error) return NextResponse.json({ error: 'Could not record event' }, { status: 500 });
  return NextResponse.json({ success: true });
}
