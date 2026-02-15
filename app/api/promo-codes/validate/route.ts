import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { code, courseIds, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Find the promo code
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid promo code' 
      });
    }

    // Check if expired
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code has expired' 
      });
    }

    // Check if not yet valid
    if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code is not yet active' 
      });
    }

    // Check max uses
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code has reached its usage limit' 
      });
    }

    // Check minimum purchase
    if (promo.min_purchase && subtotal < promo.min_purchase) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum purchase of $${promo.min_purchase} required` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (subtotal * promo.discount_value) / 100;
    } else {
      discountAmount = Math.min(promo.discount_value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      newTotal: Math.round((subtotal - discountAmount) * 100) / 100,
    });
  } catch (error) {
    logger.error('Promo validation error:', error);
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 });
  }
}
