import { HVAC_STORE_BUNDLE } from './hvac-course-product';
import { INDIVIDUAL_APP_CATALOG, type IndividualAppSlug, type IndividualPlanId } from '@/lib/apps/individual-app-plans';
import {
  CLONE_LICENSES,
  type StoreProduct as CatalogStoreProduct,
} from '@/lib/data/store-products';
import { getProductBySlug, type StoreProduct } from '@/lib/store/products';
import { workbookProducts } from '@/lib/store/workbook-products';

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
    tags: ['individual-app', appSlug, plan.id, 'licensed-media', 'finished-output-only'],
  };
}

/**
 * Map a clone (self-host) license from the canonical catalog in
 * lib/data/store-products into the cart's StoreProduct shape. Prices here
 * must match the advertised license prices ($299 / $999 / $5,000); the
 * server revalidates the slug and price against the `products` table at
 * checkout, so the DB rows must carry the same prices.
 */
function cloneLicenseProduct(license: CatalogStoreProduct): StoreProduct {
  return {
    id: license.id,
    name: license.name,
    slug: license.slug,
    category: 'license',
    price: license.price,
    description: license.description,
    longDescription: license.longDescription,
    image: '/images/pages/store-hero.webp',
    stripeProductId: license.stripeProductId,
    stripePriceId: license.stripePriceId,
    inStock: true,
    featured: false,
    digital: true,
    tags: ['license', 'clone', license.slug],
  };
}

/**
 * Resolve ?add= query values from store links (e.g. website-builder-pro).
 * Clone licenses (starter-license, pro-license, enterprise-clone-license)
 * come from the canonical catalog in lib/data/store-products; the legacy
 * workbook catalog in lib/store/products does not carry them.
 */
export function resolveCartAddParam(param: string): StoreProduct | null {
  const normalized = param.trim().toLowerCase();
  if (!normalized) return null;

  const direct = (normalized === HVAC_STORE_BUNDLE.slug ? HVAC_STORE_BUNDLE : null) ?? workbookProducts.find(book => book.slug === normalized) ?? getProductBySlug(normalized);
  if (direct) return direct;

  const cloneLicense = CLONE_LICENSES.find((license) => license.slug === normalized);
  if (cloneLicense) return cloneLicenseProduct(cloneLicense);

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

