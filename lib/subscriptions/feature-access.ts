import { createClient } from '@/lib/supabase/client';

export type FeatureKey =
  | 'host_apprentice_management'
  | 'host_hours_approval'
  | 'host_competency_signoff'
  | 'host_evaluations'
  | 'host_documents'
  | 'host_reports_basic'
  | 'host_reports_advanced'
  | 'host_messaging'
  | 'host_schedule'
  | 'host_multi_location'
  | 'host_ai_evaluations'
  | 'host_compliance_exports'
  | 'host_store_access';

export type PlanTier = 'starter' | 'professional' | 'enterprise';

export interface FeatureAccess {
  [key: string]: boolean;
}

export interface SubscriptionInfo {
  id: string;
  planId: string;
  planName: string;
  planTier: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'suspended' | 'trialing';
  billingCycle: 'monthly' | 'annual';
  endsAt: string | null;
  currentPeriodEnd: string | null;
  features: FeatureAccess;
  limits: {
    maxApprentices: number;
    maxInstructors: number;
    maxStorageGb: number;
    maxAiCredits: number;
    maxSmsCredits: number;
  };
}

const DEFAULT_STARTER_FEATURES: FeatureAccess = {
  host_apprentice_management: true,
  host_hours_approval: true,
  host_messaging: true,
  host_reports_basic: true,
  host_competency_signoff: false,
  host_evaluations: false,
  host_documents: false,
  host_reports_advanced: false,
  host_schedule: false,
  host_ai_evaluations: false,
  host_compliance_exports: false,
  host_multi_location: false,
  host_store_access: false,
};

const DEFAULT_PROFESSIONAL_FEATURES: FeatureAccess = {
  ...DEFAULT_STARTER_FEATURES,
  host_competency_signoff: true,
  host_evaluations: true,
  host_documents: true,
  host_reports_basic: true,
  host_reports_advanced: true,
  host_messaging: true,
  host_schedule: true,
  host_ai_evaluations: true,
  host_compliance_exports: true,
};

const DEFAULT_ENTERPRISE_FEATURES: FeatureAccess = {
  ...DEFAULT_PROFESSIONAL_FEATURES,
  host_multi_location: true,
  host_store_access: true,
};

export function getFeaturesByTier(tier: PlanTier): FeatureAccess {
  switch (tier) {
    case 'starter':
      return DEFAULT_STARTER_FEATURES;
    case 'professional':
      return DEFAULT_PROFESSIONAL_FEATURES;
    case 'enterprise':
      return DEFAULT_ENTERPRISE_FEATURES;
    default:
      return DEFAULT_STARTER_FEATURES;
  }
}

export function getLimitsByTier(tier: PlanTier) {
  switch (tier) {
    case 'starter':
      return { maxApprentices: 2, maxInstructors: 1, maxStorageGb: 5, maxAiCredits: 100, maxSmsCredits: 50 };
    case 'professional':
      return { maxApprentices: 10, maxInstructors: 3, maxStorageGb: 25, maxAiCredits: 1000, maxSmsCredits: 200 };
    case 'enterprise':
      return { maxApprentices: -1, maxInstructors: -1, maxStorageGb: 100, maxAiCredits: -1, maxSmsCredits: -1 };
    default:
      return { maxApprentices: 2, maxInstructors: 1, maxStorageGb: 5, maxAiCredits: 100, maxSmsCredits: 50 };
  }
}

export async function getSubscriptionForHostShop(hostShopId: string): Promise<SubscriptionInfo | null> {
  const supabase = createClient();

  const { data: hostShop, error } = await supabase
    .from('host_shops')
    .select(`
      id,
      subscription_id,
      tenant_id
    `)
    .eq('id', hostShopId)
    .single();

  if (error || !hostShop) {
    console.error('Error fetching host shop:', error);
    return null;
  }

  // Get subscription with plan
  const { data: subscription } = await supabase
    .from('host_shop_subscriptions')
    .select(`
      id,
      plan_id,
      status,
      billing_cycle,
      ends_at,
      current_period_end,
      plans (
        id,
        name,
        slug,
        tier,
        monthly_price,
        annual_price,
        metadata
      )
    `)
    .eq('id', hostShop.subscription_id)
    .single();

  if (!subscription) {
    return null;
  }

  const plan = subscription.plans as any;
  const tier = (plan?.tier || 'starter') as PlanTier;
  const features = getFeaturesByTier(tier);
  const limits = getLimitsByTier(tier);

  return {
    id: subscription.id,
    planId: plan?.id || '',
    planName: plan?.name || 'Unknown Plan',
    planTier: tier,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    endsAt: subscription.ends_at,
    currentPeriodEnd: subscription.current_period_end,
    features,
    limits,
  };
}

export async function checkFeatureAccess(
  hostShopId: string,
  feature: FeatureKey
): Promise<boolean> {
  const subscription = await getSubscriptionForHostShop(hostShopId);
  if (!subscription) {
    return false;
  }
  return subscription.features[feature] ?? false;
}

export function canAccessFeature(
  subscription: SubscriptionInfo | null,
  feature: FeatureKey
): boolean {
  if (!subscription) return false;
  return subscription.features[feature] ?? false;
}

export function canAddApprentice(subscription: SubscriptionInfo | null, currentCount: number): { allowed: boolean; reason?: string } {
  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { allowed: false, reason: 'Subscription is not active' };
  }

  const { maxApprentices } = subscription.limits;

  if (maxApprentices === -1) {
    return { allowed: true };
  }

  if (currentCount >= maxApprentices) {
    return {
      allowed: false,
      reason: `You've reached your apprentice limit (${maxApprentices}). Upgrade to add more.`
    };
  }

  return { allowed: true };
}

export function formatFeatureName(feature: FeatureKey): string {
  const names: Record<FeatureKey, string> = {
    host_apprentice_management: 'Apprentice Management',
    host_hours_approval: 'Hours Approval',
    host_competency_signoff: 'Competency Sign-Offs',
    host_evaluations: 'Evaluations',
    host_documents: 'Document Management',
    host_reports_basic: 'Basic Reports',
    host_reports_advanced: 'Advanced Reports',
    host_messaging: 'Messaging',
    host_schedule: 'Scheduling',
    host_multi_location: 'Multi-Location',
    host_ai_evaluations: 'AI Evaluations',
    host_compliance_exports: 'Compliance Exports',
    host_store_access: 'Store Access',
  };
  return names[feature] || feature;
}
