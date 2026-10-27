import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProgramPromotion = {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountAmountCents: number;
};

export async function resolveProgramPromotion(options: {
  admin: SupabaseClient;
  stripe: Stripe;
  code: string;
  amountCents: number;
}): Promise<{ promotion: ProgramPromotion; stripePromotionCodeId: string } | { error: string }> {
  const code = options.code.trim().toUpperCase();
  const now = new Date();
  const { data: row, error } = await options.admin
    .from('promo_codes')
    .select('code,discount_type,discount_value,min_purchase,max_uses,current_uses,valid_from,valid_until,is_active,applies_to')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !row) return { error: 'That coupon code is invalid or inactive.' };
  if (!['all', 'career_courses', 'programs'].includes(String(row.applies_to || 'all'))) {
    return { error: 'That coupon code does not apply to program tuition.' };
  }
  if (row.valid_from && new Date(row.valid_from) > now) return { error: 'That coupon code is not active yet.' };
  if (row.valid_until && new Date(row.valid_until) < now) return { error: 'That coupon code has expired.' };
  if (row.max_uses != null && Number(row.current_uses || 0) >= Number(row.max_uses)) {
    return { error: 'That coupon code has reached its usage limit.' };
  }

  const minPurchaseCents = Math.round(Number(row.min_purchase || 0) * 100);
  if (options.amountCents < minPurchaseCents) {
    return { error: `This offer requires at least $${(minPurchaseCents / 100).toFixed(2)} in tuition.` };
  }

  const discountType = row.discount_type as 'fixed' | 'percentage';
  const discountValue = Number(row.discount_value);
  const discountAmountCents = discountType === 'fixed'
    ? Math.min(options.amountCents, Math.round(discountValue * 100))
    : Math.min(options.amountCents, Math.round(options.amountCents * discountValue / 100));

  let promotion = (await options.stripe.promotionCodes.list({ code, active: true, limit: 1 })).data[0];
  if (!promotion) {
    const coupon = await options.stripe.coupons.create({
      duration: 'once',
      ...(discountType === 'fixed'
        ? { amount_off: Math.round(discountValue * 100), currency: 'usd' }
        : { percent_off: discountValue }),
      name: code,
      metadata: { source: 'elevate_program_promo', code },
    });
    try {
      promotion = await options.stripe.promotionCodes.create({
        promotion: { type: 'coupon', coupon: coupon.id },
        code,
        ...(row.max_uses != null ? { max_redemptions: Math.max(1, Number(row.max_uses) - Number(row.current_uses || 0)) } : {}),
        ...(row.valid_until ? { expires_at: Math.floor(new Date(row.valid_until).getTime() / 1000) } : {}),
        metadata: { source: 'elevate_program_promo', code },
      });
    } catch (creationError) {
      promotion = (await options.stripe.promotionCodes.list({ code, active: true, limit: 1 })).data[0];
      if (!promotion) throw creationError;
    }
  }

  return {
    promotion: { code, discountType, discountValue, discountAmountCents },
    stripePromotionCodeId: promotion.id,
  };
}
