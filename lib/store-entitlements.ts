import { logger } from '@/lib/logger';
/**
 * Store Entitlements Helper Functions
 * Check user access to store features based on subscription status
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Check if user has a specific entitlement
 */
export async function hasEntitlement(
  userId: string,
  entitlementKey: string
): Promise<boolean> {
  const { data, error }: any = await supabaseAdmin.rpc('has_entitlement', {
    p_user_id: userId,
    p_entitlement_key: entitlementKey,
  });

  if (error) {
    logger.error('Error checking entitlement:', error);
    return false;
  }

  return data === true;
}

/**
 * Get all active entitlements for a user
 */
export async function getUserEntitlements(userId: string): Promise<string[]> {
  const { data, error }: any = await supabaseAdmin
    .from('store_entitlements')
    .select('entitlement_key')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    logger.error('Error fetching entitlements:', error);
    return [];
  }

  return data.map((e) => e.entitlement_key);
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string) {
  const { data, error }: any = await supabaseAdmin
    .from('store_subscriptions')
    .select('*, store_products(*), store_prices(*)')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get user's subscription tier
 */
export async function getSubscriptionTier(
  userId: string
): Promise<'free' | 'pro' | 'vip' | 'wholesale'> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return 'free';
  }

  const tier = subscription.store_products?.metadata?.tier;
  return tier || 'free';
}

/**
 * Calculate discount percentage for user
 */
export async function getUserDiscount(userId: string): Promise<number> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return 0;
  }

  const discount = subscription.store_products?.metadata?.discount_percentage;
  return typeof discount === 'number' ? discount : 0;
}

/**
 * Check if user has free shipping
 */
export async function hasFreeShipping(userId: string): Promise<boolean> {
  return hasEntitlement(userId, 'free_shipping');
}

/**
 * Check if user has wholesale pricing
 */
export async function hasWholesalePricing(userId: string): Promise<boolean> {
  return hasEntitlement(userId, 'wholesale_pricing');
}

/**
 * Check if user has priority support
 */
export async function hasPrioritySupport(userId: string): Promise<boolean> {
  return hasEntitlement(userId, 'priority_support');
}

/**
 * Check if user can access exclusive products
 */
export async function hasExclusiveAccess(userId: string): Promise<boolean> {
  return hasEntitlement(userId, 'exclusive_products');
}

/**
 * Get subscription status summary for user
 */
export async function getSubscriptionStatus(userId: string) {
  const subscription = await getActiveSubscription(userId);
  const entitlements = await getUserEntitlements(userId);
  const discount = await getUserDiscount(userId);
  const tier = await getSubscriptionTier(userId);

  return {
    hasSubscription: !!subscription,
    tier,
    status: subscription?.status || 'none',
    cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
    currentPeriodEnd: subscription?.current_period_end || null,
    trialEnd: subscription?.trial_end || null,
    entitlements,
    discount,
    features: {
      freeShipping: entitlements.includes('free_shipping'),
      wholesalePricing: entitlements.includes('wholesale_pricing'),
      prioritySupport: entitlements.includes('priority_support'),
      exclusiveProducts: entitlements.includes('exclusive_products'),
      expeditedShipping: entitlements.includes('expedited_shipping'),
      bulkOrdering: entitlements.includes('bulk_ordering'),
    },
  };
}

/**
 * Check if user has access to a digital product download
 */
export async function hasDigitalProductAccess(
  userId: string,
  productId: string
): Promise<boolean> {
  const { data, error }: any = await supabaseAdmin
    .from('user_entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('status', 'active')
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

/**
 * Get all digital products user has access to
 */
export async function getUserDigitalProducts(userId: string): Promise<string[]> {
  const { data, error }: any = await supabaseAdmin
    .from('user_entitlements')
    .select('product_id')
    .eq('user_id', userId)
    .eq('entitlement_type', 'digital_download')
    .eq('status', 'active');

  if (error) {
    return [];
  }

  return data.map((e: any) => e.product_id);
}

/**
 * Check if user has Capital Readiness Guide access
 */
export async function hasCapitalReadinessAccess(userId: string): Promise<boolean> {
  return hasDigitalProductAccess(userId, 'capital-readiness-guide');
}

/**
 * Entitlement keys reference
 */
export const ENTITLEMENTS = {
  // Store Pro
  STORE_PRO: 'store_pro',
  FREE_SHIPPING: 'free_shipping',
  PRIORITY_SUPPORT: 'priority_support',

  // VIP Access
  VIP_ACCESS: 'vip_access',
  WHOLESALE_PRICING: 'wholesale_pricing',
  EXCLUSIVE_PRODUCTS: 'exclusive_products',
  EXPEDITED_SHIPPING: 'expedited_shipping',

  // Wholesale Partner
  WHOLESALE_PARTNER: 'wholesale_partner',
  BULK_ORDERING: 'bulk_ordering',
  NET30_TERMS: 'net30_terms',
  ACCOUNT_MANAGER: 'account_manager',
  CUSTOM_PRODUCTS: 'custom_products',
  WHITE_LABEL: 'white_label',

  // Digital Products
  CAPITAL_READINESS_GUIDE: 'capital-readiness-guide',
  CAPITAL_READINESS_ENTERPRISE: 'capital-readiness-enterprise',
} as const;

export type EntitlementKey = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];
