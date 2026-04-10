/**
 * @deprecated Use @/lib/licensing instead. This module will be removed in a future version.
 * 
 * Migration guide:
 * - getTenantLicense -> import { getTenantLicense } from '@/lib/licensing'
 * - enforceLimits -> import { checkUsageLimits, requireValidLicense } from '@/lib/licensing'
 * - canAddEmployer/canAddApprentice -> use checkUsageLimits from '@/lib/licensing'
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface TenantLicense {
  tenant_id: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_employers: number;
  max_apprentices: number;
  active: boolean;
  expires_at: string | null;
}

/**
 * Get tenant license details
 * @deprecated Use getTenantLicense from '@/lib/licensing' instead
 */
export async function getTenantLicense(
  tenantId: string
): Promise<TenantLicense | null> {
  const supabase = await getAdminClient();

  const { data, error }: any = await supabase
    .from('tenant_licenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    logger.error('Failed to fetch tenant license', error as Error, { tenantId });
    return null;
  }

  return data;
}

/**
 * Enforce license limits before creating new records
 */
export async function enforceLimits(
  tenantId: string,
  type: 'employers' | 'apprentices',
  current: number
): Promise<void> {
  const license = await getTenantLicense(tenantId);

  if (!license) {
    throw new Error('No license found for tenant');
  }

  if (!license.active) {
    throw new Error('License is inactive');
  }

  if (license.expires_at) {
    const expiresAt = new Date(license.expires_at);
    if (expiresAt < new Date()) {
      throw new Error('License has expired');
    }
  }

  const max = type === 'employers' ? license.max_employers : license.max_apprentices;

  if (current >= max) {
    throw new Error(
      `License limit reached: ${current}/${max} ${type}. Upgrade your plan to add more.`
    );
  }
}

/**
 * Check if tenant can add more employers
 */
export async function canAddEmployer(tenantId: string): Promise<boolean> {
  const supabase = await getAdminClient();

  const { count } = await supabase
    .from('employers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  try {
    await enforceLimits(tenantId, 'employers', count || 0);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if tenant can add more apprentices
 */
export async function canAddApprentice(tenantId: string): Promise<boolean> {
  const supabase = await getAdminClient();

  const { count } = await supabase
    .from('apprentices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  try {
    await enforceLimits(tenantId, 'apprentices', count || 0);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get license usage statistics
 */
export async function getLicenseUsage(tenantId: string) {
  const supabase = await getAdminClient();
  const license = await getTenantLicense(tenantId);

  if (!license) {
    return null;
  }

  const [employersResult, apprenticesResult] = await Promise.all([
    supabase
      .from('employers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('apprentices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ]);

  return {
    plan: license.plan,
    active: license.active,
    expires_at: license.expires_at,
    employers: {
      current: employersResult.count || 0,
      max: license.max_employers,
      percentage: Math.round(
        ((employersResult.count || 0) / license.max_employers) * 100
      ),
    },
    apprentices: {
      current: apprenticesResult.count || 0,
      max: license.max_apprentices,
      percentage: Math.round(
        ((apprenticesResult.count || 0) / license.max_apprentices) * 100
      ),
    },
  };
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  starter: {
    max_employers: 5,
    max_apprentices: 25,
    price: 99,
  },
  pro: {
    max_employers: 25,
    max_apprentices: 150,
    price: 499,
  },
  enterprise: {
    max_employers: 999,
    max_apprentices: 9999,
    price: 2499,
  },
};

/**
 * Create or update tenant license
 * @deprecated Use updateTenantLicense from '@/lib/licensing' instead
 */
export async function updateTenantLicense(
  tenantId: string,
  plan: 'starter' | 'pro' | 'enterprise',
  expiresAt?: string
): Promise<TenantLicense | null> {
  const supabase = await getAdminClient();
  const limits = PLAN_LIMITS[plan];

  const { data, error }: any = await supabase
    .from('tenant_licenses')
    .upsert({
      tenant_id: tenantId,
      plan,
      max_employers: limits.max_employers,
      max_apprentices: limits.max_apprentices,
      active: true,
      expires_at: expiresAt || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to update tenant license', error as Error, { tenantId, plan });
    return null;
  }

  return data;
}
