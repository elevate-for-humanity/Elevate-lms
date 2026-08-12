// pre-auth-registry: exempt - Public tenant contact form intentionally captures anonymous leads before account creation; rows are website-owned and do not require user reconciliation.
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
  const name = clean(body.name, 160);
  const email = clean(body.email, 240).toLowerCase();
  const phone = clean(body.phone, 80);
  const message = clean(body.message, 4000);
  const path = clean(body.path, 500) || '/contact';

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { error } = await db.from('tenant_site_leads').insert({
    website_id: tenant.websiteId,
    user_id: tenant.ownerUserId,
    name,
    email,
    phone: phone || null,
    message,
    source_path: path,
    source_host: tenant.host,
    status: 'new',
  });

  if (error) return NextResponse.json({ error: 'Could not send message' }, { status: 500 });

  await db.from('tenant_site_events').insert({
    website_id: tenant.websiteId,
    event_name: 'lead_submitted',
    path,
    source_host: tenant.host,
    metadata: { hasPhone: Boolean(phone) },
  });

  return NextResponse.json({ success: true });
}
