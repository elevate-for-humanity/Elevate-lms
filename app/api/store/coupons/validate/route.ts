/**
 * Coupon Validation API
 * POST /api/store/coupons/validate
 * Validates a coupon code and returns discount info
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/store/coupons';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const { code, purchaseAmountCents } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const result = await validateCoupon(code, userId, purchaseAmountCents);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: result.coupon!.code,
        description: result.coupon!.description,
        discount_type: result.coupon!.discount_type,
        discount_value: result.coupon!.discount_value,
      },
      discount_amount_cents: result.discount_amount_cents,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/store/coupons/validate', _POST);
