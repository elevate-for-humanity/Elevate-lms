import type { IndividualAppSlug, IndividualPlanId } from '@/lib/apps/individual-app-plans';

export type BillingInterval = 'month' | 'year' | 'week' | 'one_time';

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Stable Stripe lookup key. Checkout code must resolve a Price by this key. */
export function canonicalPriceLookupKey(parts: string[]): string {
  return ['elevate', ...parts.map(normalizeKeyPart)].join('_');
}

export function individualAppPriceLookupKey(
  appSlug: IndividualAppSlug,
  plan: IndividualPlanId,
): string {
  return canonicalPriceLookupKey(['app', appSlug, plan, 'monthly']);
}

export const PLATFORM_PRICE_LOOKUP_KEYS = {
  solo_monthly: canonicalPriceLookupKey(['platform', 'solo', 'monthly']),
  solo_annual: canonicalPriceLookupKey(['platform', 'solo', 'annual']),
  business_monthly: canonicalPriceLookupKey(['platform', 'business', 'monthly']),
  business_annual: canonicalPriceLookupKey(['platform', 'business', 'annual']),
  professional_monthly: canonicalPriceLookupKey(['platform', 'professional', 'monthly']),
  professional_annual: canonicalPriceLookupKey(['platform', 'professional', 'annual']),
} as const;

export const HOST_SHOP_PRICE_LOOKUP_KEYS = {
  bronze_monthly: canonicalPriceLookupKey(['host_shop', 'bronze', 'monthly']),
  silver_monthly: canonicalPriceLookupKey(['host_shop', 'silver', 'monthly']),
  gold_monthly: canonicalPriceLookupKey(['host_shop', 'gold', 'monthly']),
  platinum_monthly: canonicalPriceLookupKey(['host_shop', 'platinum', 'monthly']),
  application_fee: canonicalPriceLookupKey(['host_shop', 'application', 'one_time']),
} as const;

export const TUITION_PRICE_LOOKUP_KEYS = {
  barber_weekly: canonicalPriceLookupKey(['tuition', 'barber_apprenticeship', 'weekly']),
} as const;
