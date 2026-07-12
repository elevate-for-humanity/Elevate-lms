import { INDIVIDUAL_APP_CATALOG, type IndividualAppSlug, type IndividualPlanId } from '@/lib/apps/individual-app-plans';
import { getProductBySlug, type StoreProduct } from '@/lib/store/products';

const PLAN_ALIASES: Record<string, IndividualPlanId> = {
  starter: 'starter',
  pro: 'professional',
  professional: 'professional',
  enterprise: 'enterprise',
};

function individualAppProduct(appSlug: IndividualAppSlug, planId: IndividualPlanId): StoreProduct {
  const catalog = INDIVIDUAL_APP_CATALOG[appSlug];
  const plan = catalog.plans.find((p) => p.id === planId) ?? catalog.plans[1];

  return {
    id: `individual:${appSlug}:${plan.id}`,
    name: `${catalog.displayName} — ${plan.name}`,
    slug: `${appSlug}-${plan.id}`,
    category: 'template',
    price: plan.priceMonthly,
    description: plan.features.join(' · '),
    image: '/images/pages/technology-sector.webp',
    inStock: true,
    featured: Boolean(plan.popular),
    digital: true,
    tags: ['individual-app', appSlug, plan.id],
  };
}

/**
 * Resolve ?add= query values from store links (e.g. website-builder-pro).
 */
export function resolveCartAddParam(param: string): StoreProduct | null {
  const normalized = param.trim().toLowerCase();
  if (!normalized) return null;

  const direct = getProductBySlug(normalized);
  if (direct) return direct;

  const appPlanMatch = normalized.match(/^(website-builder|sam-gov|grants)-(.+)$/);
  if (appPlanMatch) {
    const appSlug = appPlanMatch[1] as IndividualAppSlug;
    const planKey = appPlanMatch[2];
    const planId = PLAN_ALIASES[planKey];
    if (!planId || !(appSlug in INDIVIDUAL_APP_CATALOG)) return null;
    return individualAppProduct(appSlug, planId);
  }

  return null;
}

export function isIndividualAppCartProduct(productId: string): boolean {
  return productId.startsWith('individual:');
}

export function parseIndividualAppCartProduct(
  productId: string,
): { appSlug: IndividualAppSlug; planId: IndividualPlanId } | null {
  const match = productId.match(/^individual:(website-builder|sam-gov|grants):(starter|professional|enterprise)$/);
  if (!match) return null;
  return { appSlug: match[1] as IndividualAppSlug, planId: match[2] as IndividualPlanId };
}
