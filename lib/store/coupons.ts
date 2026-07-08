/**
 * Coupon Engine - Validation, Application, and Redemption
 */
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free_trial';
  discount_value: number;
  max_redemptions: number | null;
  current_redemptions: number;
  min_purchase_cents: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[] | null;
  applicable_products: string[] | null;
  first_time_only: boolean;
  is_active: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discount_amount_cents?: number;
}

export interface CouponRedemptionResult {
  success: boolean;
  redemption_id?: string;
  discount_amount_cents?: number;
  error?: string;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  userId?: string,
  purchaseAmountCents?: number
): Promise<CouponValidationResult> {
  const supabase = await createClient();
  
  // Find coupon by code (case-insensitive)
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  // Check if coupon is active
  if (!coupon.is_active) {
    return { valid: false, error: 'This coupon is no longer active' };
  }

  // Check valid_from date
  if (new Date(coupon.valid_from) > new Date()) {
    return { valid: false, error: 'This coupon is not yet valid' };
  }

  // Check valid_until date
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { valid: false, error: 'This coupon has expired' };
  }

  // Check max redemptions
  if (coupon.max_redemptions && coupon.current_redemptions >= coupon.max_redemptions) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }

  // Check minimum purchase amount
  if (purchaseAmountCents && purchaseAmountCents < coupon.min_purchase_cents) {
    return { 
      valid: false, 
      error: `Minimum purchase of $${(coupon.min_purchase_cents / 100).toFixed(2)} required` 
    };
  }

  // Check first-time only
  if (coupon.first_time_only && userId) {
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .single();
    
    if (existingPurchase) {
      return { valid: false, error: 'This coupon is for first-time customers only' };
    }
  }

  // Calculate discount
  let discount_amount_cents = 0;
  if (purchaseAmountCents !== undefined) {
    if (coupon.discount_type === 'percentage') {
      discount_amount_cents = Math.round(purchaseAmountCents * (coupon.discount_value / 100));
    } else if (coupon.discount_type === 'fixed') {
      discount_amount_cents = Math.min(
        coupon.discount_value * 100,
        purchaseAmountCents
      );
    }
  }

  return {
    valid: true,
    coupon,
    discount_amount_cents
  };
}

/**
 * Apply coupon to checkout and create Stripe coupon
 */
export async function applyCouponToCheckout(
  code: string,
  customerId: string,
  userId?: string
): Promise<{ stripeCouponId?: string; discount_amount_cents: number; error?: string }> {
  const validation = await validateCoupon(code, userId);
  
  if (!validation.valid || !validation.coupon) {
    return { discount_amount_cents: 0, error: validation.error };
  }

  const coupon = validation.coupon;
  const stripe = getStripe();

  if (!stripe) {
    return { discount_amount_cents: 0, error: 'Payment processing not available' };
  }

  // Create Stripe coupon
  let stripeCouponId: string | undefined;
  
  try {
    const stripeCoupon = await stripe.coupons.create({
      duration: 'once',
      percent_off: coupon.discount_type === 'percentage' ? coupon.discount_value : undefined,
      amount_off: coupon.discount_type === 'fixed' ? Math.round(coupon.discount_value * 100) : undefined,
      currency: 'usd',
      max_redemptions: coupon.max_redemptions 
        ? coupon.max_redemptions - coupon.current_redemptions 
        : undefined,
      redeem_by: coupon.valid_until 
        ? Math.floor(new Date(coupon.valid_until).getTime() / 1000) 
        : undefined,
      metadata: {
        platform_coupon_id: coupon.id,
        code: coupon.code,
      },
    });
    stripeCouponId = stripeCoupon.id;
  } catch (stripeError) {
    console.error('Failed to create Stripe coupon:', stripeError);
    // Continue without Stripe coupon - we'll handle discount server-side
  }

  return {
    stripeCouponId,
    discount_amount_cents: validation.discount_amount_cents || 0
  };
}

/**
 * Record coupon redemption after successful checkout
 */
export async function recordCouponRedemption(
  couponCode: string,
  userId: string,
  checkoutSessionId: string,
  originalAmountCents: number,
  discountAmountCents: number,
  stripeCouponId?: string
): Promise<CouponRedemptionResult> {
  const supabase = await createClient();

  // Find coupon
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', couponCode.toUpperCase())
    .single();

  if (couponError || !coupon) {
    return { success: false, error: 'Coupon not found' };
  }

  // Insert redemption record
  const { data: redemption, error: redemptionError } = await supabase
    .from('coupon_redemptions')
    .insert({
      coupon_id: coupon.id,
      user_id: userId,
      checkout_session_id: checkoutSessionId,
      stripe_coupon_id: stripeCouponId,
      discount_amount_cents: discountAmountCents,
      original_amount_cents: originalAmountCents,
      final_amount_cents: originalAmountCents - discountAmountCents,
    })
    .select('id')
    .single();

  if (redemptionError) {
    console.error('Failed to record coupon redemption:', redemptionError);
    return { success: false, error: 'Failed to record redemption' };
  }

  // Increment redemption count
  await supabase.rpc('increment_coupon_redemptions', { coupon_id: coupon.id });

  return { success: true, redemption_id: redemption.id, discount_amount_cents: discountAmountCents };
}

/**
 * Get coupon by code (for display in checkout)
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  return data;
}

/**
 * Create a new coupon (admin only)
 */
export async function createCoupon(
  couponData: Partial<Coupon> & { code: string; discount_type: Coupon['discount_type']; discount_value: number }
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      ...couponData,
      code: couponData.code.toUpperCase(),
      created_by: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, coupon };
}

/**
 * List all coupons (admin only)
 */
export async function listCoupons(includeInactive = false): Promise<Coupon[]> {
  const supabase = await createClient();
  
  let query = supabase.from('coupons').select('*').order('created_at', { ascending: false });
  
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data } = await query;
  return data || [];
}
