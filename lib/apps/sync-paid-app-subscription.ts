import {
  appSubscriptionUpgradeUrl,
  syncIndividualAppSubscription,
} from '@/lib/apps/sync-subscription';
import { createClient } from '@/lib/supabase/server';

/** Older app pages use the same authoritative access lifecycle as the builder. */
export async function syncPaidAppSubscription(subscription: any) {
  const inactive = {
    ...subscription,
    status: 'inactive',
    access_reason: 'subscription_required',
    upgrade_url: subscription?.app_slug
      ? appSubscriptionUpgradeUrl(subscription.app_slug)
      : '/store/apps',
  };
  if (!subscription?.user_id || !subscription?.app_slug) return inactive;
  const supabase = await createClient();
  return (
    (await syncIndividualAppSubscription(subscription.user_id, subscription.app_slug, supabase)) ??
    inactive
  );
}
