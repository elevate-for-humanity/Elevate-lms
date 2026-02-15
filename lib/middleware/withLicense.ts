import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { TenantContext } from './withTenant';
import { checkLicenseAccess } from '@/lib/licensing/billing-authority';

export interface LicenseContext extends TenantContext {
  licenseId: string;
  tier: string;
  features: string[];
  maxUsers: number;
  maxDeployments: number;
  expiresAt: Date | null;
  billingAuthority: BillingAuthority;
}

interface LicenseRecord {
  id: string;
  tier: string;
  features: string[];
  max_users: number;
  max_deployments: number;
  expires_at: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
}

/**
 * SECTION 6: License enforcement middleware
 * Validates license exists, is active, and not expired
 * Checks feature entitlements
 * 
 * Uses billing authority rules:
 * - DB-Authoritative tiers (trial, lifetime): Access via expires_at
 * - Stripe-Authoritative tiers (*_monthly, *_annual): Access via current_period_end
 */
export async function withLicense(
  request: NextRequest,
  tenant: TenantContext,
  requiredFeature?: string
): Promise<{ valid: boolean; license?: LicenseContext; error?: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Get license for tenant - include all fields needed for billing authority check
    const { data: license, error } = await adminSupabase
      .from('licenses')
      .select('id, tier, features, max_users, max_deployments, expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, status')
      .eq('tenant_id', tenant.tenantId)
      .single();

    if (error || !license) {
      await logLicenseViolation(adminSupabase, tenant.tenantId, 'no_license');
      return { valid: false, error: 'No license found' };
    }

    const typedLicense = license as LicenseRecord;

    // Use billing authority rules for access check
    const accessResult = checkLicenseAccess({
      id: typedLicense.id,
      tier: typedLicense.tier,
      status: typedLicense.status,
      expires_at: typedLicense.expires_at,
      current_period_end: typedLicense.current_period_end,
      stripe_subscription_id: typedLicense.stripe_subscription_id,
      stripe_customer_id: typedLicense.stripe_customer_id,
    });

    if (!accessResult.hasAccess) {
      await logLicenseViolation(adminSupabase, tenant.tenantId, 'license_invalid', accessResult.reason);
      return { valid: false, error: accessResult.reason };
    }

    // Check feature entitlement
    if (requiredFeature && !typedLicense.features?.includes(requiredFeature)) {
      await logLicenseViolation(adminSupabase, tenant.tenantId, 'feature_not_entitled', requiredFeature);
      return { valid: false, error: `Feature not included in license: ${requiredFeature}` };
    }

    return {
      valid: true,
      license: {
        ...tenant,
        licenseId: typedLicense.id,
        tier: typedLicense.tier,
        features: typedLicense.features || [],
        maxUsers: typedLicense.max_users,
        maxDeployments: typedLicense.max_deployments,
        expiresAt: accessResult.expiresAt,
        billingAuthority: accessResult.authority,
      },
    };
  } catch (error) {
    logger.error('License validation error', error as Error);
    return { valid: false, error: 'License validation failed' };
  }
}

/**
 * Log license violation for audit
 */
async function logLicenseViolation(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  violationType: string,
  feature?: string
): Promise<void> {
  try {
    await supabase.from('license_violations').insert({
      tenant_id: tenantId,
      violation_type: violationType,
      feature,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Don't fail on logging error
  }
}

/**
 * Check if a specific feature is available
 */
export async function hasFeature(
  tenantId: string,
  feature: string
): Promise<boolean> {
  const adminSupabase = createAdminClient();

  const { data: license } = await adminSupabase
    .from('licenses')
    .select('features')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  if (!license) return false;

  return (license.features as string[]).includes(feature);
}

/**
 * Check user count against license limit
 */
export async function checkUserLimit(
  tenantId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const adminSupabase = createAdminClient();

  const [licenseResult, userCountResult] = await Promise.all([
    adminSupabase
      .from('licenses')
      .select('max_users')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single(),
    adminSupabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId),
  ]);

  const maxUsers = licenseResult.data?.max_users || 0;
  const currentUsers = userCountResult.count || 0;

  return {
    allowed: currentUsers < maxUsers,
    current: currentUsers,
    max: maxUsers,
  };
}
