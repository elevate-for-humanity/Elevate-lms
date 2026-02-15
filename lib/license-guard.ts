
/**
 * @deprecated Use @/lib/licensing instead. This module will be removed in a future version.
 * 
 * Migration guide:
 * - getLicense -> import { getTenantLicense } from '@/lib/licensing'
 * - isFeatureEnabled -> import { isFeatureEnabled } from '@/lib/licensing'
 * - checkUsageLimits -> import { checkUsageLimits } from '@/lib/licensing'
 * 
 * License Feature Gating System
 * Enforces license-based feature access across the platform.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type LicensePlan = 'trial' | 'basic' | 'professional' | 'enterprise';
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'cancelled';

export interface License {
  id: string;
  tenant_id: string;
  plan: LicensePlan;
  status: LicenseStatus;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  max_users: number | null;
  max_programs: number | null;
  max_students: number | null;
  features: {
    ai_features: boolean;
    white_label: boolean;
    custom_domain: boolean;
    api_access: boolean;
    advanced_reporting: boolean;
    bulk_operations: boolean;
    sso: boolean;
    priority_support: boolean;
  };
}

/**
 * Feature requirements by plan
 */
const FEATURE_REQUIREMENTS: Record<string, LicensePlan[]> = {
  ai_features: ['professional', 'enterprise'],
  white_label: ['enterprise'],
  custom_domain: ['enterprise'],
  api_access: ['professional', 'enterprise'],
  advanced_reporting: ['professional', 'enterprise'],
  bulk_operations: ['professional', 'enterprise'],
  sso: ['enterprise'],
  priority_support: ['professional', 'enterprise'],
};

/**
 * Get license for a tenant
 */
export async function getLicense(tenantId: string): Promise<License | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    logger.warn('License check skipped: Supabase not configured');
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error }: any = await supabase
    .from('licenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as License;
}

/**
 * Check if a license is valid (active and not expired)
 */
export function isLicenseValid(license: License | null): boolean {
  if (!license) return false;
  if (license.status !== 'active') return false;
  if (license.expires_at && new Date(license.expires_at) < new Date())
    return false;
  return true;
}

/**
 * Check if a feature is enabled for a tenant
 */
export async function isFeatureEnabled(
  tenantId: string,
  feature: keyof License['features']
): Promise<boolean> {
  const license = await getLicense(tenantId);

  if (!license || !isLicenseValid(license)) {
    return false;
  }

  return license.features[feature] === true;
}

/**
 * Check if a feature is available for a plan
 */
export function isFeatureAvailableForPlan(
  feature: string,
  plan: LicensePlan
): boolean {
  const requiredPlans = FEATURE_REQUIREMENTS[feature];
  if (!requiredPlans) return true; // Feature not gated
  return requiredPlans.includes(plan);
}

/**
 * Get features available for a plan
 */
export function getFeaturesForPlan(plan: LicensePlan): string[] {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, plans]) => plans.includes(plan))
    .map(([feature]) => feature);
}

/**
 * Check if tenant has reached usage limits
 */
export async function checkUsageLimits(tenantId: string): Promise<{
  users: { current: number; max: number | null; exceeded: boolean };
  programs: { current: number; max: number | null; exceeded: boolean };
  students: { current: number; max: number | null; exceeded: boolean };
}> {
  const license = await getLicense(tenantId);

  if (!license || !isLicenseValid(license)) {
    return {
      users: { current: 0, max: 0, exceeded: true },
      programs: { current: 0, max: 0, exceeded: true },
      students: { current: 0, max: 0, exceeded: true },
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      users: { current: 0, max: license.max_users, exceeded: false },
      programs: { current: 0, max: license.max_programs, exceeded: false },
      students: { current: 0, max: license.max_students, exceeded: false },
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Count users
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Count programs (if table exists)
  const { count: programCount } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .catch(() => ({ count: 0 }));

  // Count students
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('role', 'student');

  return {
    users: {
      current: userCount || 0,
      max: license.max_users,
      exceeded: license.max_users
        ? (userCount || 0) >= license.max_users
        : false,
    },
    programs: {
      current: programCount || 0,
      max: license.max_programs,
      exceeded: license.max_programs
        ? (programCount || 0) >= license.max_programs
        : false,
    },
    students: {
      current: studentCount || 0,
      max: license.max_students,
      exceeded: license.max_students
        ? (studentCount || 0) >= license.max_students
        : false,
    },
  };
}

/**
 * Get days until license expires
 */
export function getDaysUntilExpiration(license: License | null): number | null {
  if (!license || !license.expires_at) return null;

  const expiresAt = new Date(license.expires_at);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if license is in grace period (expired but within 7 days)
 */
export function isInGracePeriod(license: License | null): boolean {
  if (!license || !license.expires_at) return false;

  const daysUntilExpiration = getDaysUntilExpiration(license);
  if (daysUntilExpiration === null) return false;

  return daysUntilExpiration < 0 && daysUntilExpiration > -7;
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(
  feature: string,
  currentPlan: LicensePlan
): string {
  const requiredPlans = FEATURE_REQUIREMENTS[feature];
  if (!requiredPlans) return '';

  const lowestRequiredPlan = requiredPlans[0];

  const messages: Record<string, string> = {
    ai_features: `AI features require ${lowestRequiredPlan} plan or higher.`,
    white_label: 'White-label branding requires enterprise plan.',
    custom_domain: 'Custom domains require enterprise plan.',
    api_access: `API access requires ${lowestRequiredPlan} plan or higher.`,
    advanced_reporting: `Advanced reporting requires ${lowestRequiredPlan} plan or higher.`,
    bulk_operations: `Bulk operations require ${lowestRequiredPlan} plan or higher.`,
    sso: 'Single Sign-On requires enterprise plan.',
    priority_support: `Priority support requires ${lowestRequiredPlan} plan or higher.`,
  };

  return (
    messages[feature] ||
    `This feature requires ${lowestRequiredPlan} plan or higher.`
  );
}

/**
 * Plan pricing (for display)
 */
export const PLAN_PRICING = {
  trial: { monthly: 0, annual: 0, name: 'Trial', duration: '14 days' },
  basic: {
    monthly: 499,
    annual: 4990,
    name: 'Basic',
    features: 'Core features',
  },
  professional: {
    monthly: 999,
    annual: 9990,
    name: 'Professional',
    features: 'AI + Advanced features',
  },
  enterprise: {
    monthly: 1999,
    annual: 19990,
    name: 'Enterprise',
    features: 'White-label + All features',
  },
};
