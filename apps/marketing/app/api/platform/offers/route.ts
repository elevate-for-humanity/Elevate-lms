import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function authContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) return null;
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
  return { user, tenantId, organizationId: profile?.organization_id ?? null };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await authContext();
  if (!auth) return NextResponse.json({ error: 'Authentication and workspace required.' }, { status: 401 });

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('tenant_offers')
    .select('id,name,description,public_slug,pricing_type,amount_cents,currency,billing_interval,active,access_config,platform_fee_bps,created_at,updated_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load offers.' }, { status: 500 });
  return NextResponse.json({ offers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await authContext();
  if (!auth) return NextResponse.json({ error: 'Authentication and workspace required.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 1200) : '';
  const pricingType = body.pricingType === 'subscription' ? 'subscription' : 'one_time';
  const amountCents = Math.round(Number(body.amountCents ?? Number(body.price ?? 0) * 100));
  const billingInterval = pricingType === 'subscription'
    ? (['day', 'week', 'month', 'year'].includes(body.billingInterval) ? body.billingInterval : 'month')
    : null;
  const requestedSlug = typeof body.slug === 'string' ? slugify(body.slug) : slugify(name);
  const accessConfig = body.accessConfig && typeof body.accessConfig === 'object' && !Array.isArray(body.accessConfig)
    ? body.accessConfig
    : {};

  if (!name || !requestedSlug || !Number.isFinite(amountCents) || amountCents < 50) {
    return NextResponse.json({ error: 'Name and a price of at least $0.50 are required.' }, { status: 400 });
  }
  if (amountCents > 5_000_000) {
    return NextResponse.json({ error: 'Offer price exceeds the platform safety limit.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: account } = await db
    .from('organization_payment_accounts')
    .select('id,status,charges_enabled')
    .eq('tenant_id', auth.tenantId)
    .maybeSingle();
  if (!account?.charges_enabled || account.status !== 'active') {
    return NextResponse.json({
      error: 'Connect and finish Stripe onboarding before publishing paid offers.',
      connectUrl: '/account/payments',
    }, { status: 409 });
  }

  let publicSlug = requestedSlug;
  const { data: conflict } = await db
    .from('tenant_offers')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .eq('public_slug', publicSlug)
    .maybeSingle();
  if (conflict?.id) publicSlug = `${requestedSlug}-${Date.now().toString().slice(-5)}`;

  const { data, error } = await db.from('tenant_offers').insert({
    tenant_id: auth.tenantId,
    organization_id: auth.organizationId,
    name,
    description: description || null,
    public_slug: publicSlug,
    pricing_type: pricingType,
    amount_cents: amountCents,
    currency: 'usd',
    billing_interval: billingInterval,
    active: body.active !== false,
    access_config: accessConfig,
    platform_fee_bps: 0,
    created_by: auth.user.id,
  }).select('*').single();

  if (error) return NextResponse.json({ error: 'Could not create offer.' }, { status: 500 });
  return NextResponse.json({ offer: data }, { status: 201 });
}
