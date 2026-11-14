// Pure discount calculation utilities (no external service dependencies)
export function calculateDiscountedCents(listCents, coupon) {
  if (!coupon) return null;
  const now = new Date();
  if (!coupon.active) return null;
  if (coupon.starts_at && now < new Date(coupon.starts_at)) return null;
  if (coupon.ends_at && now > new Date(coupon.ends_at)) return null;
  if (coupon.max_redemptions && coupon.redeemed_count >= coupon.max_redemptions) return null;
  if (
    Array.isArray(coupon.allowed_programs) &&
    coupon.allowed_programs.length &&
    coupon.program_slug &&
    !coupon.allowed_programs.includes(coupon.program_slug)
  )
    return null;
  if (coupon.type === 'amount') return Math.max(0, listCents - coupon.value);
  if (coupon.type === 'percent') return Math.round(listCents * (1 - coupon.value / 100));
  return null;
}
