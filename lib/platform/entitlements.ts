import type { BasePlanId } from '@/lib/store/platform-pricing';
import { BASE_PLANS, getAddOn } from '@/lib/store/platform-pricing';
import type { PlatformFeatureKey } from '@/lib/platform/features';

export interface ResolvedEntitlements {
  planId: BasePlanId;
  features: PlatformFeatureKey[];
  maxUsers: number;
  maxLocations: number;
  maxContacts: number | null;
  addonSlugs: string[];
  additionalUsers: number;
  additionalLocations: number;
  additionalStorageGb: number;
}

/**
 * Merge base plan features with add-on feature keys (deduped).
 */
export function resolveEntitlements(
  planId: BasePlanId,
  addonSlugs: string[] = [],
): ResolvedEntitlements {
  const plan = BASE_PLANS[planId];
  const featureSet = new Set<PlatformFeatureKey>(plan.features);

  let additionalUsers = 0;
  let additionalLocations = 0;
  let additionalStorageGb = 0;

  for (const slug of addonSlugs) {
    const addon = getAddOn(slug);
    if (!addon) continue;
    for (const f of addon.features) featureSet.add(f);
    if (slug === 'additional-user') additionalUsers += 1;
    if (slug === 'additional-location') additionalLocations += 1;
    if (slug === 'additional-storage') additionalStorageGb += 100;
  }

  return {
    planId,
    features: [...featureSet],
    maxUsers: plan.maxUsers + additionalUsers,
    maxLocations: plan.maxLocations + additionalLocations,
    maxContacts: plan.maxContacts,
    addonSlugs: [...addonSlugs],
    additionalUsers,
    additionalLocations,
    additionalStorageGb,
  };
}

/**
 * Check feature access for a tenant license feature list.
 */
export function hasPlatformFeature(
  licenseFeatures: string[] | null | undefined,
  feature: PlatformFeatureKey,
): boolean {
  if (!licenseFeatures?.length) return false;
  return licenseFeatures.includes(feature);
}
