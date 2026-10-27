import type { SupabaseClient } from '@supabase/supabase-js';

export type QuickBooksProgramPromotion = {
  code: string;
  discountAmountCents: number;
};

/** Validate an Elevate promotion without creating or consulting any Stripe object. */
export async function resolveQuickBooksProgramPromotion(options: {
  admin: SupabaseClient;
  code: string;
  amountCents: number;
  maximumDiscountCents?: number;
}): Promise<{ promotion: QuickBooksProgramPromotion } | { error: string }> {
  const code = options.code.trim().toUpperCase();
  const now = new Date();
  const { data: row, error } = await options.admin
    .from('promo_codes')
    .select(
      'code,discount_type,discount_value,min_purchase,max_uses,current_uses,valid_from,valid_until,is_active,applies_to',
    )
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !row) return { error: 'That coupon code is invalid or inactive.' };
  if (!['all', 'career_courses', 'programs'].includes(String(row.applies_to || 'all'))) {
    return { error: 'That coupon code does not apply to program tuition.' };
  }
  if (row.valid_from && new Date(row.valid_from) > now)
    return { error: 'That coupon code is not active yet.' };
  if (row.valid_until && new Date(row.valid_until) < now)
    return { error: 'That coupon code has expired.' };
  if (row.max_uses != null && Number(row.current_uses || 0) >= Number(row.max_uses)) {
    return { error: 'That coupon code has reached its usage limit.' };
  }
  const minimumCents = Math.round(Number(row.min_purchase || 0) * 100);
  if (options.amountCents < minimumCents) {
    return {
      error: `This offer requires at least $${(minimumCents / 100).toFixed(2)} in tuition.`,
    };
  }

  const value = Number(row.discount_value);
  const requested =
    row.discount_type === 'fixed'
      ? Math.round(value * 100)
      : Math.round((options.amountCents * value) / 100);
  const discountAmountCents = Math.max(
    0,
    Math.min(options.amountCents, options.maximumDiscountCents ?? options.amountCents, requested),
  );
  if (!discountAmountCents) return { error: 'That coupon does not produce a valid discount.' };
  return { promotion: { code, discountAmountCents } };
}
