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
  /** Canonical SaaS tenant id (tenants.id). */
  organizationId: string;
  /** Billing organization id (organizations.id) when one is mapped to the tenant. */
  billingOrganizationId: string | null;
  planSlug: string | null;
  planName: string | null;
  status: string | null;
  features: FeatureCode[];
  limits: PlanLimits;
  activeAddonCodes: string[];
  currentPeriodEnd: string | null;
}

export interface OrganizationIdentity {
  tenantId: string;
  billingOrganizationId: string | null;
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

const ACCESSIBLE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

function addFeature(featureSet: Set<FeatureCode>, raw: string | null | undefined) {
  if (!raw) return;
  const normalized = normalizeFeatureCode(raw);
  if (normalized) featureSet.add(normalized);
}

function applyAddonFallback(featureSet: Set<FeatureCode>, addonCode: string) {
  for (const feature of ADDON_FEATURE_FALLBACK[addonCode] ?? []) {
    featureSet.add(feature);
  }
}

export async function resolveOrganizationIdentity(
  tenantOrOrganizationId: string,
  client?: SupabaseClient,
): Promise<OrganizationIdentity> {
  const supabase = client ?? (await requireAdminClient());
  if (!supabase) {
    return { tenantId: tenantOrOrganizationId, billingOrganizationId: null };
  }

  const { data: byTenant } = await supabase
    .from('organizations')
    .select('id, tenant_id')
    .eq('tenant_id', tenantOrOrganizationId)
    .maybeSingle();
  if (byTenant?.id) {
    return {
      tenantId: (byTenant.tenant_id as string | null) ?? tenantOrOrganizationId,
      billingOrganizationId: byTenant.id as string,
    };
  }

  const { data: byOrganization } = await supabase
    .from('organizations')
    .select('id, tenant_id')
    .eq('id', tenantOrOrganizationId)
    .maybeSingle();
  if (byOrganization?.id) {
    return {
      tenantId: (byOrganization.tenant_id as string | null) ?? tenantOrOrganizationId,
      billingOrganizationId: byOrganization.id as string,
    };
  }

  return { tenantId: tenantOrOrganizationId, billingOrganizationId: null };
}

export async function resolveBillingOrganizationId(
  tenantOrOrganizationId: string,
  client?: SupabaseClient,
): Promise<string | null> {
  const identity = await resolveOrganizationIdentity(tenantOrOrganizationId, client);
  return identity.billingOrganizationId;
}

export async function getOrganizationFeatures(
  tenantOrOrganizationId: string,
  client?: SupabaseClient,
): Promise<OrganizationEntitlements> {
  const supabase = client ?? (await requireAdminClient());
  if (!supabase) {
    return emptyEntitlements(tenantOrOrganizationId);
  }

  const identity = await resolveOrganizationIdentity(tenantOrOrganizationId, supabase);
  const tenantId = identity.tenantId;
  const billingOrganizationId = identity.billingOrganizationId;

  let orgSub: any = null;
  if (billingOrganizationId) {
    const { data } = await supabase
      .from('organization_subscriptions')
      .select(
        'status, current_period_end, billing_interval, plan_id, subscription_plans ( slug, name, limits )',
      )
      .eq('organization_id', billingOrganizationId)
      .maybeSingle();
    orgSub = data;
  }

  const planJoin = orgSub?.subscription_plans;
  const planRow = Array.isArray(planJoin) ? planJoin[0] : planJoin;
  const planSlug = planRow?.slug ?? null;
  const planId = orgSub?.plan_id as string | undefined;
  const subscriptionHasAccess = ACCESSIBLE_SUBSCRIPTION_STATUSES.has(orgSub?.status ?? '');

  const featureSet = new Set<FeatureCode>();

  if (subscriptionHasAccess && planId) {
    const { data: planFeatureRows } = await supabase
      .from('plan_features')
      .select('features ( code )')
      .eq('plan_id', planId);

    if (planFeatureRows?.length) {
      for (const row of planFeatureRows) {
        const f = row.features as { code: string } | { code: string }[] | null;
        const codes = Array.isArray(f) ? f : f ? [f] : [];
        for (const c of codes) addFeature(featureSet, c?.code);
      }
    }
  }

  if (
    subscriptionHasAccess &&
    featureSet.size === 0 &&
    planSlug &&
    planSlug in PLAN_FEATURE_FALLBACK
  ) {
    PLAN_FEATURE_FALLBACK[planSlug].forEach((c) => featureSet.add(c));
  }

  const { data: addonRows } = await supabase
    .from('addon_subscriptions')
    .select('addon_code, saas_addon_catalog ( feature_codes )')
    .eq('organization_id', tenantId)
    .eq('active', true);

  const activeAddonCodes: string[] = [];
  for (const row of addonRows ?? []) {
    const addonCode = normalizeAddonCode(row.addon_code);
    activeAddonCodes.push(addonCode);
    const cat = row.saas_addon_catalog as { feature_codes: string[] } | null;
    const dbFeatureCodes = cat?.feature_codes ?? [];
    for (const code of dbFeatureCodes) addFeature(featureSet, code);
    if (!dbFeatureCodes.length) applyAddonFallback(featureSet, addonCode);
  }

  const { data: legacyAddons } = await supabase
    .from('organization_addons')
    .select('addon_slug')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  for (const leg of legacyAddons ?? []) {
    const code = normalizeAddonCode(leg.addon_slug);
    if (!activeAddonCodes.includes(code)) activeAddonCodes.push(code);
    const { data: cat } = await supabase
      .from('saas_addon_catalog')
      .select('feature_codes')
      .eq('code', code)
      .maybeSingle();
    const dbFeatureCodes = cat?.feature_codes ?? [];
    for (const c of dbFeatureCodes) addFeature(featureSet, c);
    if (!dbFeatureCodes.length) applyAddonFallback(featureSet, code);
  }

  if (featureSet.size === 0 && !orgSub) {
    const { data: license } = await supabase
      .from('licenses')
      .select('features')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .maybeSingle();
    for (const f of (license?.features as string[]) ?? []) addFeature(featureSet, f);
  }

  const limits: PlanLimits =
    (planRow?.limits as PlanLimits) ??
    (planSlug && PLAN_LIMITS_FALLBACK[planSlug] ? PLAN_LIMITS_FALLBACK[planSlug] : { users: 1 });

  return {
    organizationId: tenantId,
    billingOrganizationId,
    planSlug,
    planName: planRow?.name ?? null,
    status: orgSub?.status ?? null,
    features: [...featureSet],
    limits,
    activeAddonCodes: [...new Set(activeAddonCodes)],
    currentPeriodEnd: orgSub?.current_period_end ?? null,
  };
}

function emptyEntitlements(tenantId: string): OrganizationEntitlements {
  return {
    organizationId: tenantId,
    billingOrganizationId: null,
    planSlug: null,
    planName: null,
    status: null,
    features: [],
    limits: { users: 0 },
    activeAddonCodes: [],
    currentPeriodEnd: null,
  };
}

export function organizationHasFeature(
  entitlements: OrganizationEntitlements,
  feature: string,
): boolean {
  const requested = normalizeFeatureCode(feature);
  if (!requested) return false;
  return entitlements.features.includes(requested);
}

export async function requireFeature(
  tenantId: string,
  feature: string,
  client?: SupabaseClient,
): Promise<OrganizationEntitlements> {
  const entitlements = await getOrganizationFeatures(tenantId, client);
  if (!organizationHasFeature(entitlements, feature)) {
    throw new FeatureUpgradeRequiredError(feature);
  }
  return entitlements;
}
