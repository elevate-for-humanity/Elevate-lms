import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';
import { createClient } from '@/lib/supabase/server';

/**
 * Backward-compatible wrapper used by older app pages.
 * All trial expiry and paid Stripe verification now live in the canonical
 * syncIndividualAppSubscription gate so every individual app follows the same
 * access lifecycle.
 */
export async function syncPaidAppSubscription(subscription: any) {
  if (!subscription?.user_id || !subscription?.app_slug) return subscription;
  const supabase = await createClient();
  return (
    (await syncIndividualAppSubscription(
      subscription.user_id,
      subscription.app_slug,
      supabase,
    )) ?? subscription
  );
}
