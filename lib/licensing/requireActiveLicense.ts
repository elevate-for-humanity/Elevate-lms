import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Require Active License
 *
 * Server-side guard to enforce license state.
 * Redirects to billing/account page if license is not active.
 *
 * Usage:
 * ```typescript
 * await requireActiveLicense(tenantId);
 * ```
 */
export async function requireActiveLicense(tenantId: string): Promise<void> {
  const supabase = await createClient();

  const { data: license, error } = await supabase
    .from('licenses')
    .select('status, ends_at')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !license) {
    // No license found - redirect to account
    redirect('/account?error=no_license');
  }

  // Check if license is active
  if (license.status === 'suspended') {
    redirect('/account?error=suspended');
  }

  if (license.status === 'cancelled') {
    redirect('/account?error=cancelled');
  }

  // Check if license has expired
  if (license.ends_at && new Date(license.ends_at) < new Date()) {
    redirect('/account?error=expired');
  }

  // License is active
  return;
}

/**
 * Require Feature Access
 *
 * Server-side guard to enforce feature gating.
 * Redirects to upgrade page if feature is not available.
 *
 * Usage:
 * ```typescript
 * await requireFeatureAccess(tenantId, 'advanced_analytics');
 * ```
 */
export async function requireFeatureAccess(tenantId: string, feature: string): Promise<void> {
  const supabase = await createClient();

  const { data: license, error } = await supabase
    .from('licenses')
    .select('features')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !license) {
    redirect('/account?error=no_license');
  }

  const hasAccess = license.features?.[feature] === true;

  if (!hasAccess) {
    redirect(`/account/upgrade?feature=${feature}`);
  }

  return;
}

/**
 * Check License Status (non-blocking)
 *
 * Returns license status without redirecting.
 * Use for conditional UI rendering.
 *
 * Usage:
 * ```typescript
 * const status = await checkLicenseStatus(tenantId);
 * if (status === 'active') { ... }
 * ```
 */
export async function checkLicenseStatus(
  tenantId: string,
): Promise<'active' | 'trial' | 'suspended' | 'cancelled' | 'expired' | 'none'> {
  const supabase = await createClient();

  const { data: license, error } = await supabase
    .from('licenses')
    .select('status, ends_at')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !license) {
    return 'none';
  }

  // Check expiration
  if (license.ends_at && new Date(license.ends_at) < new Date()) {
    return 'expired';
  }

  return license.status as 'active' | 'trial' | 'suspended' | 'cancelled';
}

/**
 * Check Feature Access (non-blocking)
 *
 * Returns boolean indicating feature access.
 * Use for conditional UI rendering.
 *
 * Usage:
 * ```typescript
 * const hasAnalytics = await checkFeatureAccess(tenantId, 'advanced_analytics');
 * ```
 */
export async function checkFeatureAccess(tenantId: string, feature: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: license, error } = await supabase
    .from('licenses')
    .select('features')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !license) {
    return false;
  }

  return license.features?.[feature] === true;
}
