import manifest from '@/config/store-commercials.json';
import type {
  IndividualAppCatalog,
  IndividualPlanDefinition,
} from '@/lib/apps/individual-app-plans';
export function commercialSnapshot(catalog: IndividualAppCatalog, plan: IndividualPlanDefinition) {
  return JSON.stringify({
    slug: catalog.slug,
    name: catalog.displayName,
    plan: plan.id,
    priceMonthly: plan.priceMonthly,
    features: plan.features,
  });
}
export function subscriptionCommercial(
  catalog: IndividualAppCatalog,
  plan: IndividualPlanDefinition,
) {
  const entry = (
    manifest as Record<
      string,
      {
        snapshot: string;
        src: string;
        poster: string;
        captions: string;
        transcript: string;
        duration: number;
      }
    >
  )[`${catalog.slug}-${plan.id}`];
  return entry?.snapshot === commercialSnapshot(catalog, plan) ? entry : null;
}
