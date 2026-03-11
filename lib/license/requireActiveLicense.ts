import { NextResponse } from 'next/server';
import { getTenantContext, TenantContextError } from '@/lib/tenant';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkLicenseAccess } from '@/lib/licensing/billing-authority';

/**
 * STEP 5B: License Enforcement Middleware
 * 
 * Canonical license statuses:
 * - active: Full access
 * - suspended: Payment problem (refund/dispute)
 * - expired: Time-based expiry
 * - revoked: Admin action
 * 
 * Billing Authority Rules:
 * - DB-Authoritative tiers (trial, lifetime, one_time): Access via expires_at
 * - Stripe-Authoritative tiers (*_monthly, *_annual): Access via current_period_end
 */

export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'revoked';

export interface License {
  id: string;
  tenant_id: string;
  tier: string;
  status: LicenseStatus;
  plan: string;
  expires_at: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  features: Record<string, boolean>;
  max_users: number | null;
  max_students: number | null;
  max_programs: number | null;
  billingAuthority?: BillingAuthority;
}

export class LicenseError extends Error {
  public statusCode: number;
  public licenseStatus: LicenseStatus | 'missing';
  public billingAuthority?: BillingAuthority;
  
  constructor(
    message: string, 
    statusCode: number, 
    licenseStatus: LicenseStatus | 'missing',
    billingAuthority?: BillingAuthority
  ) {
    super(message);
    this.name = 'LicenseError';
    this.statusCode = statusCode;
    this.licenseStatus = licenseStatus;
    this.billingAuthority = billingAuthority;
  }
}

/**
 * Get active license for tenant
 * Uses database function that auto-expires if needed
 */
export async function getActiveLicense(tenantId: string): Promise<License | null> {
  const supabase = await createClient();
  
  // Use the database function that handles expiry
  const { data, error } = await supabase
    .rpc('get_active_license', { p_tenant_id: tenantId });
  
  if (error) {
    logger.error('Failed to fetch license', error, { tenantId });
    return null;
  }
  
  return data as License | null;
}

/**
 * Validate license using billing authority rules
 * - DB-Authoritative: Check expires_at
 * - Stripe-Authoritative: Check current_period_end
 */
function validateLicense(license: License | null): void {
  if (!license) {
    throw new LicenseError(
      'No license found. Please purchase a license to continue.',
      402,
      'missing'
    );
  }
  
  // Use billing authority rules for access check
  const accessResult = checkLicenseAccess({
    id: license.id,
    tier: license.tier || license.plan || 'unknown',
    status: license.status,
    expires_at: license.expires_at,
    current_period_end: license.current_period_end,
    stripe_subscription_id: license.stripe_subscription_id,
    stripe_customer_id: license.stripe_customer_id,
  });

  if (!accessResult.hasAccess) {
    // Map to appropriate error based on reason
    let status: LicenseStatus | 'missing' = 'expired';
    let statusCode = 402;
    
    if (license.status === 'suspended') {
      status = 'suspended';
      statusCode = 402;
    } else if (license.status === 'revoked') {
      status = 'revoked';
      statusCode = 403;
    } else if (accessResult.reason.includes('expired') || accessResult.reason.includes('ended')) {
      status = 'expired';
      statusCode = 402;
    }

    throw new LicenseError(
      accessResult.reason,
      statusCode,
      status,
      accessResult.authority
    );
  }

  // Store billing authority on license for downstream use
  license.billingAuthority = accessResult.authority;
}

/**
 * STEP 5B: Require active license for route
 * 
 * Usage in API route:
 * ```
 * const license = await requireActiveLicense();
 * // Route continues only if license is active
 * ```
 */
export async function requireActiveLicense(): Promise<License> {
  const tenantContext = await getTenantContext();
  const license = await getActiveLicense(tenantContext.tenantId);
  
  validateLicense(license);
  
  return license!;
}

/**
 * Check license without throwing (returns null if invalid)
 */
export async function checkLicense(): Promise<License | null> {
  try {
    return await requireActiveLicense();
  } catch {
    return null;
  }
}

/**
 * Get the appropriate redirect URL for a license error
 */
export function getLicenseErrorRedirect(error: LicenseError, licenseId?: string): string {
  const baseUrl = '/admin/licenses';
  const params = new URLSearchParams();
  
  params.set('reason', error.licenseStatus);
  if (licenseId) params.set('license_id', licenseId);
  
  // Add specific messaging based on error type
  if (error.licenseStatus === 'expired') {
    params.set('message', 'Your trial has ended. Subscribe to continue using the platform.');
  } else if (error.licenseStatus === 'suspended') {
    params.set('message', 'Your license is suspended. Please resolve billing issues to restore access.');
  } else if (error.licenseStatus === 'missing') {
    params.set('message', 'No active license found. Purchase a license to get started.');
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Create error response for license errors
 * Includes redirect URL for client-side handling
 */
export function licenseErrorResponse(error: LicenseError, licenseId?: string): NextResponse {
  const redirectUrl = getLicenseErrorRedirect(error, licenseId);
  
  return NextResponse.json(
    { 
      error: 'Operation failed',
      licenseStatus: error.licenseStatus,
      code: 'LICENSE_REQUIRED',
      redirectUrl,
      billingAuthority: error.billingAuthority,
    },
    { status: error.statusCode }
  );
}

/**
 * Wrapper for API routes that require active license
 */
export function withActiveLicense<T>(
  handler: (license: License) => Promise<NextResponse>
): () => Promise<NextResponse> {
  return async () => {
    try {
      const license = await requireActiveLicense();
      return handler(license);
    } catch (error) {
      if (error instanceof LicenseError) {
        return licenseErrorResponse(error);
      }
      if (error instanceof TenantContextError) {
        return NextResponse.json({ error: 'Operation failed' }, { status: error.statusCode });
      }
      throw error;
    }
  };
}
