export type LicenseStatus = 'active' | 'grace' | 'restricted' | 'inactive';

export interface Subscription {
  status: string;
  grace_until?: string | null;
  current_period_end?: string | null;
}

/**
 * Resolve license status from subscription
 * - active: Full access
 * - grace: Payment failed but within grace period
 * - restricted: Payment failed, grace expired
 * - inactive: No subscription
 */
export function getLicenseStatus(sub: Subscription | null): LicenseStatus {
  if (!sub) {
    return 'inactive';
  }

  if (sub.status === 'active' || sub.status === 'trialing') {
    return 'active';
  }

  // Check grace period for past_due subscriptions
  if (sub.status === 'past_due' && sub.grace_until && new Date(sub.grace_until) > new Date()) {
    return 'grace';
  }

  return 'restricted';
}
