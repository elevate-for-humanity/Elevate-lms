import { logger } from '@/lib/logger';
/**
 * Billing Authority Rules
 * 
 * SINGLE SOURCE OF TRUTH for license access decisions.
 * 
 * Two billing authorities:
 * 1. DB-Authoritative: Access controlled by expires_at (trial, lifetime, one_time)
 * 2. Stripe-Authoritative: Access controlled by current_period_end (subscriptions)
 * 
 * Rules:
 * - Subscription tiers MUST have stripe_subscription_id AND current_period_end
 * - Trial tiers MUST have expires_at (no perpetual trials)
 * - Unknown tiers are DENIED (fail closed)
 * - canceled_at or suspended_at set = DENY regardless of status
 */

// ============================================================================
// TIER CATALOG - All valid tiers must be declared here
// ============================================================================

// Subscription tiers (Stripe-authoritative)
const SUBSCRIPTION_TIERS = new Set([
  'managed_monthly',
  'managed_annual',
  'pro_monthly',
  'pro_annual',
  'professional_monthly',
  'professional_annual',
  'enterprise_monthly',
  'enterprise_annual',
  'org_monthly',
  'org_annual',
  'team_monthly',
  'team_annual',
]);

// DB tiers that MUST have expires_at (time-boxed)
const TIERS_REQUIRING_EXPIRY = new Set([
  'trial',
  'pilot',
  'grant',
  'demo',
]);

// DB tiers where expires_at can be null (perpetual allowed)
const TIERS_ALLOWING_PERPETUAL = new Set([
  'lifetime',
  'one_time',
  'basic',
  'starter',
  'free',
  'enterprise', // one-time enterprise purchase
]);

// All known tiers (union of all sets)
const ALL_KNOWN_TIERS = new Set([
  ...SUBSCRIPTION_TIERS,
  ...TIERS_REQUIRING_EXPIRY,
  ...TIERS_ALLOWING_PERPETUAL,
]);

export type BillingAuthority = 'database' | 'stripe';

export interface License {
  id?: string;
  status: string | null;
  tier: string | null;
  expires_at: string | Date | null;
  current_period_end: string | Date | null;
  stripe_subscription_id: string | null;
  stripe_customer_id?: string | null;
  // Lifecycle fields - if set, license should be denied
  canceled_at?: string | Date | null;
  suspended_at?: string | Date | null;
}

/**
 * Check if a tier is known/declared in the catalog
 */
export function isKnownTier(tier: string | null | undefined): boolean {
  return !!tier && ALL_KNOWN_TIERS.has(tier);
}

/**
 * Check if a tier requires expires_at (no perpetual allowed)
 */
export function tierRequiresExpiry(tier: string | null | undefined): boolean {
  return !!tier && TIERS_REQUIRING_EXPIRY.has(tier);
}

/**
 * Check if a tier allows perpetual (no expires_at)
 */
export function tierAllowsPerpetual(tier: string | null | undefined): boolean {
  return !!tier && TIERS_ALLOWING_PERPETUAL.has(tier);
}

export interface AccessResult {
  ok: boolean;
  reason: string;
  authority: BillingAuthority;
  expiresAt: Date | null;
}

/**
 * Check if a tier is subscription-based (Stripe-authoritative)
 */
export function isSubscriptionTier(tier: string | null | undefined): boolean {
  return !!tier && SUBSCRIPTION_TIERS.has(tier);
}

/**
 * Check if a tier is DB-authoritative
 */
export function isDbAuthoritativeTier(tier: string | null | undefined): boolean {
  return !isSubscriptionTier(tier);
}

/**
 * Get billing authority for a tier
 */
export function getBillingAuthority(tier: string | null | undefined): BillingAuthority {
  return isSubscriptionTier(tier) ? 'stripe' : 'database';
}

/**
 * Safely convert to Date, returns null if invalid
 */
function toDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * CANONICAL LICENSE ACCESS CHECK
 * 
 * This is THE function that decides if a license grants access.
 * All other access checks should delegate to this.
 * 
 * Rules (in order of evaluation):
 * 1. No license = DENY
 * 2. canceled_at or suspended_at set = DENY (regardless of status)
 * 3. status != 'active' = DENY
 * 4. Unknown tier = DENY (fail closed)
 * 5. Subscription tiers: require stripe_subscription_id AND current_period_end > now
 * 6. DB tiers requiring expiry (trial, pilot): require expires_at > now
 * 7. DB tiers allowing perpetual: expires_at IS NULL OR expires_at > now
 */
export function isLicenseActiveNow(
  license: License | null | undefined,
  now: Date = new Date()
): AccessResult {
  // Rule 1: No license = deny
  if (!license) {
    return { ok: false, reason: 'no_license', authority: 'database', expiresAt: null };
  }

  // Rule 2: Check lifecycle flags (canceled_at, suspended_at)
  // These override status - a license can be status='active' but canceled
  const canceledAt = toDate(license.canceled_at);
  if (canceledAt) {
    return {
      ok: false,
      reason: 'license_canceled',
      authority: getBillingAuthority(license.tier),
      expiresAt: null,
    };
  }

  const suspendedAt = toDate(license.suspended_at);
  if (suspendedAt) {
    return {
      ok: false,
      reason: 'license_suspended',
      authority: getBillingAuthority(license.tier),
      expiresAt: null,
    };
  }

  // Rule 3: Status must be 'active'
  if (license.status !== 'active') {
    return { 
      ok: false, 
      reason: `status_${license.status || 'null'}`, 
      authority: getBillingAuthority(license.tier),
      expiresAt: null,
    };
  }

  const tier = license.tier ?? '';
  const authority = getBillingAuthority(tier);

  // Rule 4: Unknown tier = DENY (fail closed)
  if (!isKnownTier(tier)) {
    logger.error('[billing-authority] Unknown tier - denying access', {
      tier,
      licenseId: license.id,
    });
    return {
      ok: false,
      reason: 'unknown_tier',
      authority: 'database',
      expiresAt: null,
    };
  }

  // Rule 5: Subscription tiers (Stripe-authoritative)
  if (isSubscriptionTier(tier)) {
    // MUST have stripe_subscription_id
    if (!license.stripe_subscription_id) {
      logger.error('[billing-authority] Subscription tier missing stripe_subscription_id', {
        tier,
        licenseId: license.id,
      });
      return { 
        ok: false, 
        reason: 'missing_subscription_id', 
        authority: 'stripe',
        expiresAt: null,
      };
    }

    // MUST have current_period_end
    const cpe = toDate(license.current_period_end);
    if (!cpe) {
      logger.error('[billing-authority] Subscription tier missing current_period_end', {
        tier,
        licenseId: license.id,
      });
      return { 
        ok: false, 
        reason: 'missing_current_period_end', 
        authority: 'stripe',
        expiresAt: null,
      };
    }

    // current_period_end must be strictly in the future (> not >=)
    if (cpe <= now) {
      return { 
        ok: false, 
        reason: 'subscription_expired', 
        authority: 'stripe',
        expiresAt: cpe,
      };
    }

    return { 
      ok: true, 
      reason: 'subscription_active', 
      authority: 'stripe',
      expiresAt: cpe,
    };
  }

  // Rule 6 & 7: DB-Authoritative tiers
  const exp = toDate(license.expires_at);

  // Rule 6: Tiers requiring expiry (trial, pilot, etc.) MUST have expires_at
  if (tierRequiresExpiry(tier) && !exp) {
    logger.error('[billing-authority] Tier requires expires_at but none set', {
      tier,
      licenseId: license.id,
    });
    return {
      ok: false,
      reason: 'missing_expires_at',
      authority: 'database',
      expiresAt: null,
    };
  }

  // If expires_at is set, it must be strictly in the future (> not >=)
  if (exp && exp <= now) {
    return { 
      ok: false, 
      reason: 'license_expired', 
      authority: 'database',
      expiresAt: exp,
    };
  }

  // Rule 7: Perpetual allowed (lifetime, one_time, etc.) or has valid expiry
  return { 
    ok: true, 
    reason: exp ? 'db_active' : 'db_perpetual', 
    authority: 'database',
    expiresAt: exp,
  };
}

/**
 * Validate license data integrity
 * Returns warnings for inconsistent data (for monitoring/alerting)
 */
export function validateLicenseIntegrity(license: License): string[] {
  const warnings: string[] = [];
  const tier = license.tier ?? '';

  if (isSubscriptionTier(tier)) {
    if (!license.stripe_subscription_id) {
      warnings.push(`Subscription tier "${tier}" missing stripe_subscription_id`);
    }
    if (!license.current_period_end) {
      warnings.push(`Subscription tier "${tier}" missing current_period_end`);
    }
  } else {
    // DB-authoritative with subscription fields is suspicious but not invalid
    if (license.stripe_subscription_id && !license.expires_at) {
      warnings.push(`DB tier "${tier}" has subscription_id but no expires_at - may grant perpetual access`);
    }
  }

  return warnings;
}

/**
 * Get days remaining for a license
 */
export function getDaysRemaining(license: License, now: Date = new Date()): number | null {
  const result = isLicenseActiveNow(license, now);
  if (!result.expiresAt) return null;
  
  const diffMs = result.expiresAt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Assert subscription data exists (throws if missing)
 * Use in webhook handlers to catch data issues early
 */
export function assertSubscriptionData(license: License): void {
  if (!isSubscriptionTier(license.tier)) return;

  if (!license.stripe_subscription_id) {
    throw new Error(`Subscription tier "${license.tier}" requires stripe_subscription_id`);
  }
  if (!license.current_period_end) {
    throw new Error(`Subscription tier "${license.tier}" requires current_period_end`);
  }
}

/**
 * Determine which fields Stripe webhooks should update based on tier
 * Prevents Stripe from overwriting DB-authoritative fields
 */
export function getStripeUpdatableFields(
  tier: string | null | undefined,
  stripeData: {
    status?: string;
    current_period_end?: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
  }
): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Always safe to update customer_id (informational)
  if (stripeData.stripe_customer_id) {
    updates.stripe_customer_id = stripeData.stripe_customer_id;
  }

  if (isSubscriptionTier(tier)) {
    // Stripe controls lifecycle for subscription tiers
    if (stripeData.status) updates.status = stripeData.status;
    if (stripeData.current_period_end) updates.current_period_end = stripeData.current_period_end;
    if (stripeData.stripe_subscription_id) updates.stripe_subscription_id = stripeData.stripe_subscription_id;
  } else {
    // DB-authoritative: Stripe should NOT update status or expiration
    console.info('[billing-authority] Skipping Stripe lifecycle fields for DB tier', { tier });
  }

  return updates;
}

// Legacy alias for backward compatibility
export function checkLicenseAccess(license: License): AccessResult & { hasAccess: boolean } {
  const result = isLicenseActiveNow(license);
  return {
    ...result,
    hasAccess: result.ok,
  };
}

// Legacy alias
export const getUpdatableFields = getStripeUpdatableFields;

// ============================================================================
// ACCESS MODE (for graceful degradation on expiry)
// ============================================================================

export type AccessMode = 
  | 'full'                    // Active license, full access
  | 'admin_readonly_hold'     // Expired trial, admin can view but not mutate
  | 'blocked'                 // Expired, non-admin - no access
  | 'blocked_billing_issue';  // Subscription billing problem

// Roles that get admin-level access during billing hold
const ADMIN_ROLES = new Set([
  'super_admin',
  'admin', 
  'org_admin',
  'executive',
]);

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

export interface AccessModeResult {
  mode: AccessMode;
  canRead: boolean;
  canMutate: boolean;
  reason: string;
  redirectTo?: string;
  message?: string;
}

/**
 * Determine access mode based on license status and user role
 * 
 * This enables graceful degradation:
 * - Admins get read-only access during billing hold
 * - Non-admins get blocked with "contact admin" message
 */
export function getLicenseAccessMode(
  license: License | null | undefined,
  userRole: string | null | undefined,
  now: Date = new Date()
): AccessModeResult {
  const accessResult = isLicenseActiveNow(license, now);
  const isAdmin = isAdminRole(userRole);

  // Full access if license is active
  if (accessResult.ok) {
    return {
      mode: 'full',
      canRead: true,
      canMutate: true,
      reason: accessResult.reason,
    };
  }

  // No license at all — super_admin always gets full access regardless
  if (!license || accessResult.reason === 'no_license') {
    if (isAdmin) {
      return {
        mode: 'full',
        canRead: true,
        canMutate: true,
        reason: 'no_license_admin_bypass',
      };
    }
    return {
      mode: 'blocked',
      canRead: false,
      canMutate: false,
      reason: 'no_license',
      redirectTo: '/admin/licenses?reason=missing',
      message: 'No active license found. Please purchase a license to continue.',
    };
  }

  // Determine if this is a trial expiry or subscription issue
  const isTrialExpiry = 
    accessResult.reason === 'license_expired' || 
    accessResult.reason === 'missing_expires_at';
  
  const isSubscriptionIssue = 
    accessResult.reason === 'subscription_expired' ||
    accessResult.reason === 'missing_subscription_id' ||
    accessResult.reason === 'missing_current_period_end';

  const isCanceled = 
    accessResult.reason === 'license_canceled' ||
    accessResult.reason === 'status_canceled';

  const isSuspended =
    accessResult.reason === 'license_suspended' ||
    accessResult.reason === 'status_suspended';

  // Billing issues (canceled, suspended) - block everyone
  if (isCanceled || isSuspended) {
    return {
      mode: 'blocked_billing_issue',
      canRead: false,
      canMutate: false,
      reason: accessResult.reason,
      redirectTo: `/admin/licenses?reason=${isCanceled ? 'canceled' : 'suspended'}&license_id=${license.id}`,
      message: isCanceled 
        ? 'Your subscription has been canceled. Please resubscribe to restore access.'
        : 'Your license is suspended due to a billing issue. Please update your payment method.',
    };
  }

  // Trial expired or subscription expired
  if (isTrialExpiry || isSubscriptionIssue) {
    if (isAdmin) {
      // Admins get read-only hold mode
      return {
        mode: 'admin_readonly_hold',
        canRead: true,
        canMutate: false,
        reason: accessResult.reason,
        redirectTo: undefined, // Don't redirect, show inline banner
        message: isTrialExpiry
          ? 'Trial ended. Your workspace is in billing hold. Upgrade to restore full access. Your data is safe.'
          : 'Subscription expired. Your workspace is in billing hold. Renew to restore full access.',
      };
    } else {
      // Non-admins get blocked
      return {
        mode: 'blocked',
        canRead: false,
        canMutate: false,
        reason: accessResult.reason,
        redirectTo: '/access-paused',
        message: 'Access paused. Please contact your administrator.',
      };
    }
  }

  // Unknown denial reason - block to be safe
  return {
    mode: 'blocked',
    canRead: false,
    canMutate: false,
    reason: accessResult.reason,
    redirectTo: '/admin/licenses?reason=unknown',
    message: 'Access denied. Please contact support.',
  };
}
