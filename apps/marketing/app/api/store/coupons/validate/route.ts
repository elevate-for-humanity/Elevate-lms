import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const amountCents = Math.max(0, Math.round(Number(body.amount || 0)));
  if (!code) return NextResponse.json({ valid: false, error: 'Enter a coupon code.' }, { status: 400 });

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ valid: false, error: 'Coupon validation is temporarily unavailable.' }, { status: 503 });

  const { data: coupon } = await admin
    .from('promo_codes')
    .select('code,discount_type,discount_value,min_purchase,max_uses,current_uses,valid_from,valid_until,is_active,applies_to')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  const now = new Date();
  if (!coupon) return NextResponse.json({ valid: false, error: 'Invalid coupon code.' }, { status: 404 });
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return NextResponse.json({ valid: false, error: 'This coupon is not active yet.' }, { status: 400 });
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return NextResponse.json({ valid: false, error: 'This coupon has expired.' }, { status: 400 });
  if (coupon.max_uses != null && Number(coupon.current_uses || 0) >= Number(coupon.max_uses)) {
    return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit.' }, { status: 400 });
  }
  const minimumCents = Math.round(Number(coupon.min_purchase || 0) * 100);
  if (amountCents && amountCents < minimumCents) {
    return NextResponse.json({ valid: false, error: `Minimum purchase of $${(minimumCents / 100).toFixed(2)} required.` }, { status: 400 });
  }

  const discountValue = Number(coupon.discount_value);
  const discountAmountCents = coupon.discount_type === 'fixed'
    ? Math.min(amountCents, Math.round(discountValue * 100))
    : Math.round(amountCents * discountValue / 100);

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: discountValue,
      discount_amount_cents: discountAmountCents,
    },
  });
}
