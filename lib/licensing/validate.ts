import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  checkLicenseAccess,
  getBillingAuthority,
  validateLicenseIntegrity,
  type BillingAuthority,
} from './billing-authority';

export interface License {
  id: string;
  organization_id: string;
  tier: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended';
  plan_id: string;
  trial_ends_at: string | null;
  expires_at: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export interface LicenseUsage {
  student_count: number;
  student_limit: number;
  admin_count: number;
  admin_limit: number;
  program_count: number;
  program_limit: number;
}

export interface LicenseValidation {
  valid: boolean;
  license: License | null;
  usage: LicenseUsage | null;
  reason?: string;
  daysRemaining?: number;
  isTrialExpired?: boolean;
  isPastDue?: boolean;
  billingAuthority?: BillingAuthority;
  warnings?: string[];
  limitReached?: {
    students?: boolean;
    admins?: boolean;
    programs?: boolean;
  };
}

/**
 * Validate a license by organization ID
 * Uses billing authority rules to determine access
 */
export async function validateLicense(organizationId: string): Promise<LicenseValidation> {
  const supabase = await createClient();

  if (!supabase) {
    return { valid: false, license: null, usage: null, reason: 'Database unavailable' };
  }

  // Get license
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (licenseError || !license) {
    return { valid: false, license: null, usage: null, reason: 'No license found' };
  }

  // Get usage
  const { data: usage } = await supabase
    .from('license_usage')
    .select('*')
    .eq('license_id', license.id)
    .maybeSingle();

  // Use billing authority rules for access check
  const accessResult = checkLicenseAccess({
    id: license.id,
    tier: license.tier || license.plan_id || 'unknown',
    status: license.status,
    expires_at: license.expires_at || license.trial_ends_at,
    current_period_end: license.current_period_end,
    stripe_subscription_id: license.stripe_subscription_id,
    stripe_customer_id: license.stripe_customer_id,
  });

  // Calculate days remaining
  let daysRemaining: number | undefined;
  if (accessResult.expiresAt) {
    const now = new Date();
    daysRemaining = Math.ceil(
      (accessResult.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Determine specific failure reasons for UI
  const isTrialExpired =
    !accessResult.hasAccess && (license.tier === 'trial' || license.status === 'trial');

  const isPastDue = license.status === 'past_due';

  // Handle past_due with grace period (7 days)
  if (isPastDue && accessResult.hasAccess) {
    return {
      valid: true,
      license,
      usage,
      isPastDue: true,
      reason: 'Payment overdue - please update payment method',
      daysRemaining,
      billingAuthority: accessResult.authority,
      warnings: accessResult.warnings,
    };
  }

  if (!accessResult.hasAccess) {
    return {
      valid: false,
      license,
      usage,
      reason: accessResult.reason,
      isTrialExpired,
      isPastDue,
      daysRemaining: isTrialExpired ? 0 : daysRemaining,
      billingAuthority: accessResult.authority,
      warnings: accessResult.warnings,
    };
  }

  return {
    valid: true,
    license,
    usage,
    daysRemaining,
    billingAuthority: accessResult.authority,
    warnings: accessResult.warnings,
  };
}

/**
 * Check if a specific limit has been reached
 */
export async function checkLicenseLimit(
  organizationId: string,
  limitType: 'students' | 'admins' | 'programs',
): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
  const validation = await validateLicense(organizationId);

  if (!validation.valid) {
    return { allowed: false, current: 0, limit: 0, reason: validation.reason };
  }

  if (!validation.usage) {
    return { allowed: true, current: 0, limit: -1 }; // No usage tracking = unlimited
  }

  const countKey = `${limitType.slice(0, -1)}_count` as keyof LicenseUsage;
  const limitKey = `${limitType.slice(0, -1)}_limit` as keyof LicenseUsage;

  const current = validation.usage[countKey] as number;
  const limit = validation.usage[limitKey] as number;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current, limit };
  }

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      reason: `${limitType} limit reached (${current}/${limit})`,
    };
  }

  return { allowed: true, current, limit };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  organizationId: string,
  usageType: 'student' | 'admin' | 'program',
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  // Get license
  const { data: license } = await supabase
    .from('licenses')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!license) return false;

  const countColumn = `${usageType}_count`;

  const { error } = await supabase.rpc('increment_license_usage', {
    p_license_id: license.id,
    p_column: countColumn,
  });

  return !error;
}

/**
 * Decrement usage counter
 */
export async function decrementUsage(
  organizationId: string,
  usageType: 'student' | 'admin' | 'program',
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  // Get license
  const { data: license } = await supabase
    .from('licenses')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!license) return false;

  const countColumn = `${usageType}_count`;

  const { error } = await supabase.rpc('decrement_license_usage', {
    p_license_id: license.id,
    p_column: countColumn,
  });

  return !error;
}

/**
 * Server component helper - validate license and redirect if invalid
 */
export async function requireValidLicense(organizationId: string): Promise<License> {
  const validation = await validateLicense(organizationId);

  if (!validation.valid) {
    if (validation.isTrialExpired) {
      redirect('/store/licenses?expired=trial');
    }
    if (validation.isPastDue) {
      redirect('/account/billing?status=past_due');
    }
    redirect('/store/licenses?status=invalid');
  }

  return validation.license!;
}

/**
 * Get license by license key
 */
export async function getLicenseByKey(licenseKey: string): Promise<License | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: keyRecord } = await supabase
    .from('license_keys')
    .select('license_id, status')
    .eq('key', licenseKey)
    .maybeSingle();

  if (!keyRecord || keyRecord.status !== 'active') {
    return null;
  }

  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('id', keyRecord.license_id)
    .maybeSingle();

  return license;
}
