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

function applyCapacityAddons(base: PlanLimits, addonCodes: string[]): PlanLimits {
  const limits: PlanLimits = { ...base };
  const active = new Set(addonCodes.map(normalizeAddonCode));

  if (active.has('additional-user')) {
    limits.users = Math.max(0, limits.users ?? 0) + 1;
  }
  if (active.has('additional-location')) {
    limits.locations = Math.max(0, limits.locations ?? 0) + 1;
  }
  if (active.has('additional-storage')) {
    limits.storageGb = Math.max(0, limits.storageGb ?? 0) + 100;
  }

  return limits;
}

function subscriptionAccessState(status: string | null | undefined, currentPeriodEnd: string | null | undefined) {
  if (status === 'active') return { hasAccess: true, effectiveStatus: 'active' };
  if (status !== 'trialing') return { hasAccess: false, effectiveStatus: status ?? null };

  const end = currentPeriodEnd ? new Date(currentPeriodEnd).getTime() : NaN;
  if (!Number.isFinite(end) || end <= Date.now()) {
    return { hasAccess: false, effectiveStatus: 'trial_expired' };
  }
  return { hasAccess: true, effectiveStatus: 'trialing' };
}

/**
 * Normalize either identifier used historically by billing:
 * - tenants.id (canonical application identity)
 * - organizations.id (legacy Stripe metadata / billing identity)
 */
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

/**
 * Load merged feature codes for a SaaS tenant. Legacy organizations.id callers
 * are normalized at this boundary so downstream feature checks always operate
 * on tenants.id.
 */
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
  const accessState = subscriptionAccessState(orgSub?.status, orgSub?.current_period_end);
  const subscriptionHasAccess = accessState.hasAccess;

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

  // Standalone add-ons are valid when no base subscription exists. If a base
  // subscription does exist, add-ons may not resurrect access after that base
  // subscription/trial becomes past due, canceled, or expired.
  const activeAddonCodes: string[] = [];
  const allowStandaloneOrBaseAddons = !orgSub || subscriptionHasAccess;
  if (allowStandaloneOrBaseAddons) {
    const { data: addonRows } = await supabase
      .from('addon_subscriptions')
      .select('addon_code, saas_addon_catalog ( feature_codes )')
      .eq('organization_id', tenantId)
      .eq('active', true);

    for (const row of addonRows ?? []) {
      const addonCode = normalizeAddonCode(row.addon_code);
      activeAddonCodes.push(addonCode);
      const catalogJoin = row.saas_addon_catalog as
        | { feature_codes: string[] }
        | { feature_codes: string[] }[]
        | null;
      const cat = Array.isArray(catalogJoin) ? catalogJoin[0] : catalogJoin;
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
  }

  // A legacy/manual license is a compatibility source only when there is no
  // recurring organization subscription. It must never resurrect features for
  // a canceled, past-due, or expired Stripe subscription/trial.
  if (featureSet.size === 0 && !orgSub) {
    const { data: license } = await supabase
      .from('licenses')
      .select('features')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .maybeSingle();
    for (const f of (license?.features as string[]) ?? []) addFeature(featureSet, f);
  }

  const baseLimits: PlanLimits = subscriptionHasAccess
    ? ((planRow?.limits as PlanLimits) ??
      (planSlug && PLAN_LIMITS_FALLBACK[planSlug] ? PLAN_LIMITS_FALLBACK[planSlug] : { users: 1 }))
    : !orgSub && featureSet.size > 0
      ? { users: 1 }
      : { users: 0 };
  const limits = allowStandaloneOrBaseAddons
    ? applyCapacityAddons(baseLimits, activeAddonCodes)
    : baseLimits;

  return {
    organizationId: tenantId,
    billingOrganizationId,
    planSlug,
    planName: planRow?.name ?? null,
    status: accessState.effectiveStatus,
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
