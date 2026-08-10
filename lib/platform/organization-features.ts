import type { SupabaseClient } from '@/lib/supabase';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  ADDON_FEATURE_FALLBACK,
  PLAN_FEATURE_FALLBACK,
  PLAN_LIMITS_FALLBACK,
  normalizeAddonCode,
  normalizeFeatureCode,
  type FeatureCode,
  type PlanLimits,
} from '@/lib/platform/feature-catalog';

export interface OrganizationEntitlements {
  organizationId: string;
  planSlug: string | null;
  planName: string | null;
  status: string | null;
  features: FeatureCode[];
  limits: PlanLimits;
  activeAddonCodes: string[];
  currentPeriodEnd: string | null;
}

export class FeatureUpgradeRequiredError extends Error {
  readonly statusCode = 403;
  readonly feature: string;
  constructor(feature: string) {
    super(`Upgrade required: feature "${feature}" is not on your plan.`);
    this.name = 'FeatureUpgradeRequiredError';
    this.feature = feature;
  }
}

function addFeature(featureSet: Set<FeatureCode>, raw: string | null | undefined) {
  if (!raw) return;
  const normalized = normalizeFeatureCode(raw);
  if (normalized) featureSet.add(normalized);
}

function applyAddonFallback(featureSet: Set<FeatureCode>, addonCode: string) {
  for (const feature of ADDON_FEATURE_FALLBACK[addonCode] ?? []) featureSet.add(feature);
}

export async function getOrganizationFeatures(
  organizationId: string,
  client?: SupabaseClient,
): Promise<OrganizationEntitlements> {
  const supabase = client ?? (await requireAdminClient());
  if (!supabase) return emptyEntitlements(organizationId);

  const { data: orgSub } = await supabase
    .from('organization_subscriptions')
    .select('status, current_period_end, billing_interval, plan_id, subscription_plans ( slug, name, limits )')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const planJoin = orgSub?.subscription_plans;
  const planRow = Array.isArray(planJoin) ? planJoin[0] : planJoin;
  const planSlug = planRow?.slug ?? null;
  const planId = orgSub?.plan_id as string | undefined;
  const featureSet = new Set<FeatureCode>();

  if (planId) {
    const { data: planFeatureRows } = await supabase
      .from('plan_features')
      .select('features ( code )')
      .eq('plan_id', planId);

    for (const row of planFeatureRows ?? []) {
      const joined = row.features as { code: string } | { code: string }[] | null;
      const codes = Array.isArray(joined) ? joined : joined ? [joined] : [];
      for (const feature of codes) addFeature(featureSet, feature?.code);
    }
  }

  if (featureSet.size === 0 && planSlug && planSlug in PLAN_FEATURE_FALLBACK) {
    PLAN_FEATURE_FALLBACK[planSlug].forEach((code) => featureSet.add(code));
  }

  const { data: addonRows } = await supabase
    .from('addon_subscriptions')
    .select('addon_code, saas_addon_catalog ( feature_codes )')
    .eq('organization_id', organizationId)
    .eq('active', true);

  const activeAddonCodes: string[] = [];
  for (const row of addonRows ?? []) {
    const addonCode = normalizeAddonCode(row.addon_code);
    activeAddonCodes.push(addonCode);
    const catalogJoin = row.saas_addon_catalog as
      | { feature_codes: string[] | null }
      | { feature_codes: string[] | null }[]
      | null;
    const catalog = Array.isArray(catalogJoin) ? catalogJoin[0] : catalogJoin;
    const dbFeatureCodes = catalog?.feature_codes ?? [];
    for (const code of dbFeatureCodes) addFeature(featureSet, code);
    if (!dbFeatureCodes.length) applyAddonFallback(featureSet, addonCode);
  }

  const { data: legacyAddons } = await supabase
    .from('organization_addons')
    .select('addon_slug')
    .eq('tenant_id', organizationId)
    .eq('status', 'active');

  for (const legacy of legacyAddons ?? []) {
    const code = normalizeAddonCode(legacy.addon_slug);
    if (!activeAddonCodes.includes(code)) activeAddonCodes.push(code);
    const { data: catalog } = await supabase
      .from('saas_addon_catalog')
      .select('feature_codes')
      .eq('code', code)
      .maybeSingle();
    const dbFeatureCodes = catalog?.feature_codes ?? [];
    for (const featureCode of dbFeatureCodes) addFeature(featureSet, featureCode);
    if (!dbFeatureCodes.length) applyAddonFallback(featureSet, code);
  }

  if (featureSet.size === 0) {
    const { data: license } = await supabase
      .from('licenses')
      .select('features')
      .eq('tenant_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();
    for (const feature of (license?.features as string[]) ?? []) addFeature(featureSet, feature);
  }

  const limits: PlanLimits =
    (planRow?.limits as PlanLimits) ??
    (planSlug && PLAN_LIMITS_FALLBACK[planSlug] ? PLAN_LIMITS_FALLBACK[planSlug] : { users: 1 });

  return {
    organizationId,
    planSlug,
    planName: planRow?.name ?? null,
    status: orgSub?.status ?? null,
    features: [...featureSet],
    limits,
    activeAddonCodes: [...new Set(activeAddonCodes)],
    currentPeriodEnd: orgSub?.current_period_end ?? null,
  };
}

function emptyEntitlements(organizationId: string): OrganizationEntitlements {
  return {
    organizationId,
    planSlug: null,
    planName: null,
    status: null,
    features: [],
    limits: { users: 0 },
    activeAddonCodes: [],
    currentPeriodEnd: null,
  };
}

export function organizationHasFeature(entitlements: OrganizationEntitlements, feature: string): boolean {
  const requested = normalizeFeatureCode(feature);
  return requested ? entitlements.features.includes(requested) : false;
}

export async function requireFeature(
  organizationId: string,
  feature: string,
  client?: SupabaseClient,
): Promise<OrganizationEntitlements> {
  const entitlements = await getOrganizationFeatures(organizationId, client);
  if (!organizationHasFeature(entitlements, feature)) throw new FeatureUpgradeRequiredError(feature);
  return entitlements;
}
