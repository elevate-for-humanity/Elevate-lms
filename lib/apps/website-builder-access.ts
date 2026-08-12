import type { SupabaseClient } from '@supabase/supabase-js';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

export type WebsiteBuilderAccess = {
  allowed: boolean;
  isAdmin: boolean;
  plan: string;
  status: string;
  reason?: 'subscription_required' | 'trial_expired' | 'inactive';
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
    };
  }

  const status = String(subscription.status || 'inactive');
  const plan = String(subscription.plan || 'starter');

  if (status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at).getTime();
    if (Number.isFinite(trialEnd) && trialEnd < Date.now()) {
      return {
        allowed: false,
        isAdmin: false,
        plan,
        status: 'expired',
        reason: 'trial_expired',
      };
    }
  }

  if (status !== 'trial' && status !== 'active') {
    return {
      allowed: false,
      isAdmin: false,
      plan,
      status,
      reason: 'inactive',
    };
  }

  return { allowed: true, isAdmin: false, plan, status };
}
