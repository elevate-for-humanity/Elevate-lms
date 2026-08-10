import type { IndividualAppSlug, IndividualPlanId } from '@/lib/apps/individual-app-plans';
import type { BasePlanId, BillingInterval as PlatformBillingInterval } from '@/lib/store/platform-pricing';

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

export function platformPlanPriceLookupKey(
  plan: BasePlanId,
  interval: PlatformBillingInterval,
): string {
  return canonicalPriceLookupKey(['platform', plan, interval]);
}

export function platformAddonPriceLookupKey(
  addonSlug: string,
  interval: PlatformBillingInterval,
): string {
  return canonicalPriceLookupKey(['platform', 'addon', addonSlug, interval]);
}

export const PLATFORM_PRICE_LOOKUP_KEYS = {
  solo_monthly: platformPlanPriceLookupKey('solo', 'monthly'),
  solo_annual: platformPlanPriceLookupKey('solo', 'annual'),
  business_monthly: platformPlanPriceLookupKey('business', 'monthly'),
  business_annual: platformPlanPriceLookupKey('business', 'annual'),
  professional_monthly: platformPlanPriceLookupKey('professional', 'monthly'),
  professional_annual: platformPlanPriceLookupKey('professional', 'annual'),
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
