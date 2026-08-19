import type { SupabaseClient } from '@supabase/supabase-js';
import { appSubscriptionUpgradeUrl, syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

export type WebsiteBuilderAccess = {
  allowed: boolean;
  isAdmin: boolean;
  plan: string;
  status: string;
  reason?: 'subscription_required' | 'trial_expired' | 'inactive' | 'billing_verification_unavailable';
  upgradeUrl?: string;
};

/**
 * Canonical Website Builder entitlement check used by editor pages and APIs.
 * The product landing page is responsible for provisioning a new trial; this
 * helper only verifies an existing entitlement and therefore never grants
 * access as a side effect.
 */
export async function getWebsiteBuilderAccess(
  userId: string,
  supabase: SupabaseClient<any>,
): Promise<WebsiteBuilderAccess> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  if (isAdmin) {
    return { allowed: true, isAdmin: true, plan: 'enterprise', status: 'active' };
  }

  const subscription = await syncIndividualAppSubscription(
    userId,
    'website-builder',
    supabase,
  );

  if (!subscription) {
    return {
      allowed: false,
      isAdmin: false,
      plan: 'starter',
      status: 'missing',
      reason: 'subscription_required',
      upgradeUrl: appSubscriptionUpgradeUrl('website-builder', 'subscription-required'),
    };
  }

  const status = String(subscription.status || 'inactive');
  const plan = String(subscription.plan || 'starter');
  const accessReason = String(subscription.access_reason || '');

  if (accessReason === 'trial_expired') {
    return {
      allowed: false,
      isAdmin: false,
      plan,
      status: 'expired',
      reason: 'trial_expired',
      upgradeUrl: subscription.upgrade_url || appSubscriptionUpgradeUrl('website-builder', 'trial-expired'),
    };
  }

  if (status === 'billing_verification_unavailable') {
    return {
      allowed: false,
      isAdmin: false,
      plan,
      status,
      reason: 'billing_verification_unavailable',
      upgradeUrl: subscription.upgrade_url || appSubscriptionUpgradeUrl('website-builder', 'billing-verification-unavailable'),
    };
  }

  if (status !== 'trial' && status !== 'active') {
    return {
      allowed: false,
      isAdmin: false,
      plan,
      status,
      reason: 'inactive',
      upgradeUrl: subscription.upgrade_url || appSubscriptionUpgradeUrl('website-builder', status),
    };
  }

  return { allowed: true, isAdmin: false, plan, status };
}
