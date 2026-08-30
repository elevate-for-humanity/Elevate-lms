import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { HOST_SHOP_ADMIN_COOKIE } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const actor = await apiRequireRoles(
    request,
    ['admin', 'super_admin', 'org_admin'],
    { adminOverride: true },
  );
  if (actor.error) return actor.error;

  const shopId = request.nextUrl.searchParams.get('shop_id')?.trim();
  const requestedPartnerId = request.nextUrl.searchParams.get('partner_id')?.trim();

  if (!shopId && !requestedPartnerId) {
    return NextResponse.json({ error: 'shop_id or partner_id is required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  let partnerId = requestedPartnerId || '';

  if (shopId) {
    const { data: shop, error: shopError } = await db
      .from('shops')
      .select('id, partner_id, active')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop || shop.active === false || !shop.partner_id) {
      return NextResponse.json({ error: 'Active connected Host Shop not found' }, { status: 404 });
    }
    partnerId = shop.partner_id;
  }

  const { data: partner, error: partnerError } = await db
    .from('partners')
    .select('id, status, approval_status, verification_status, is_active, partner_type, program_type, programs')
    .eq('id', partnerId)
    .maybeSingle();

  const typeText = [
    partner?.partner_type,
    partner?.program_type,
    ...(Array.isArray(partner?.programs) ? partner.programs : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const canOpen =
    !partnerError &&
    Boolean(partner?.id) &&
    partner?.status === 'active' &&
    partner?.approval_status === 'approved' &&
    partner?.is_active !== false &&
    /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);

  if (!canOpen) {
    return NextResponse.json(
      { error: 'This Host Shop is not yet connected to an active approved partnership record' },
      { status: 409 },
    );
  }

  const response = NextResponse.redirect(new URL('/host-shop/dashboard', APP_ORIGIN));
  response.cookies.set(HOST_SHOP_ADMIN_COOKIE, partnerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}
