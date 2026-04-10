/**
 * Unified License Management Module
 * 
 * This is the canonical source for all license-related operations.
 * Use this module instead of:
 * - lib/licenseGuard.ts (deprecated)
 * - lib/license-guard.ts (deprecated)
 * - lib/license.ts (EFH domain license only)
 * 
 * BILLING AUTHORITY RULES:
 * - DB-Authoritative tiers (trial, lifetime, one_time): Access via expires_at
 * - Stripe-Authoritative tiers (*_monthly, *_annual): Access via current_period_end
 * 
 * See billing-authority.ts for implementation details.
 */

// Re-export billing authority utilities
export * from './billing-authority';

// Re-export validation utilities
export * from './validate';
export * from './middleware';
export {
  TenantProvider,
  useTenant,
  withTenant,
  RequireLicense,
  RequireFeature,
  TrialBanner,
  UsageLimits,
} from './tenant-context';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  active: boolean;
}

export async function getTenantLicense(tenantId: string): Promise<License | null> {
  try {
    const supabase = await createClient();

    const { data, error }: any = await supabase
      .from('licenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      logger.debug('No active license found for tenant', { tenantId });
      return null;
    }
    return data as License;
  } catch (error) {
    logger.error('Failed to fetch tenant license', error as Error, { tenantId });
    return null;
  }
}

export async function isFeatureEnabled(tenantId: string, feature: keyof License['features']): Promise<boolean> {
  const license = await getTenantLicense(tenantId);
  if (!license) return false;
  return license.features[feature] === true;
}

export async function isLicenseValid(tenantId: string): Promise<boolean> {
  const license = await getTenantLicense(tenantId);
  if (!license) return false;

  if (license.status !== 'active') return false;

  if (license.expires_at) {
    const expiresAt = new Date(license.expires_at);
    if (expiresAt < new Date()) return false;
  }

  return true;
}

export async function getUserTenant(userId: string): Promise<Tenant | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  if (!profile?.tenant_id) return null;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single();

  return tenant as Tenant | null;
}

export async function checkUsageLimits(tenantId: string): Promise<{
  users: { current: number; max: number | null; exceeded: boolean };
  programs: { current: number; max: number | null; exceeded: boolean };
  students: { current: number; max: number | null; exceeded: boolean };
}> {
  const supabase = await createClient();
  const license = await getTenantLicense(tenantId);

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('role', 'student');

  return {
    users: {
      current: userCount || 0,
      max: license?.max_users || null,
      exceeded: license?.max_users ? (userCount || 0) >= license.max_users : false,
    },
    programs: {
      current: 0,
      max: license?.max_programs || null,
      exceeded: false,
    },
    students: {
      current: studentCount || 0,
      max: license?.max_students || null,
      exceeded: license?.max_students ? (studentCount || 0) >= license.max_students : false,
    },
  };
}

export async function requireFeature(tenantId: string, feature: keyof License['features']): Promise<void> {
  const enabled = await isFeatureEnabled(tenantId, feature);
  if (!enabled) {
    logger.warn('Feature access denied', { tenantId, feature });
    throw new Error(`Feature '${feature}' is not enabled for this tenant`);
  }
}

export async function requireValidLicense(tenantId: string): Promise<void> {
  const valid = await isLicenseValid(tenantId);
  if (!valid) {
    logger.warn('License validation failed', { tenantId });
    throw new Error('License is not valid or has expired');
  }
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  trial: {
    max_users: 10,
    max_programs: 2,
    max_students: 25,
  },
  basic: {
    max_users: 50,
    max_programs: 10,
    max_students: 200,
  },
  professional: {
    max_users: 200,
    max_programs: 50,
    max_students: 1000,
  },
  enterprise: {
    max_users: null, // unlimited
    max_programs: null,
    max_students: null,
  },
} as const;

/**
 * Feature availability by plan
 */
export const PLAN_FEATURES: Record<LicensePlan, Partial<License['features']>> = {
  trial: {
    ai_features: false,
    white_label: false,
    custom_domain: false,
    api_access: false,
    advanced_reporting: false,
    bulk_operations: false,
    sso: false,
    priority_support: false,
  },
  basic: {
    ai_features: false,
    white_label: false,
    custom_domain: false,
    api_access: false,
    advanced_reporting: true,
    bulk_operations: false,
    sso: false,
    priority_support: false,
  },
  professional: {
    ai_features: true,
    white_label: false,
    custom_domain: true,
    api_access: true,
    advanced_reporting: true,
    bulk_operations: true,
    sso: false,
    priority_support: true,
  },
  enterprise: {
    ai_features: true,
    white_label: true,
    custom_domain: true,
    api_access: true,
    advanced_reporting: true,
    bulk_operations: true,
    sso: true,
    priority_support: true,
  },
};

/**
 * Audit log a license event
 */
export async function logLicenseEvent(
  tenantId: string,
  event: 'created' | 'updated' | 'expired' | 'suspended' | 'validated',
  metadata?: Record<string, any>
): Promise<void> {
  logger.info('License event', { tenantId, event, ...metadata });
}

/**
 * Validate API key for tenant access
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; tenantId?: string; error?: string }> {
  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  const supabase = await await getAdminClient();
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('api_key', apiKey)
    .single();

  if (error || !tenant) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (tenant.status !== 'active') {
    return { valid: false, error: 'Tenant is not active' };
  }

  return { valid: true, tenantId: tenant.id };
}
