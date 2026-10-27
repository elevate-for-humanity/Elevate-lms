import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';

const ACCESSIBLE_STRIPE_STATUSES = new Set(['active', 'trialing']);

export function appSubscriptionUpgradeUrl(appSlug: string, reason = 'subscription-required') {
  const params = new URLSearchParams({ reason });
  return `/store/apps/${appSlug}?${params.toString()}`;
}

export function hasIndividualAppAccess(subscription: any): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active') return true;
  if (subscription.status !== 'trial') return false;
  if (!subscription.trial_ends_at) return false;
  return new Date(subscription.trial_ends_at).getTime() > Date.now();
}

export async function syncIndividualAppSubscription(
  userId: string,
  appSlug: string,
  authenticatedClient?: SupabaseClient<any>,
) {
  // Server Components must not crash just because the service-role client is
  // unavailable during a cold start. The authenticated user's client is safe
  // here because RLS permits access to that user's own subscription row.
  const admin = await getAdminClient();
  const db = admin ?? authenticatedClient ?? null;
  if (!db) return null;

  const { data: row, error } = await db
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('app_slug', appSlug)
    .maybeSingle();

  if (error || !row) return row ?? null;

  // Free/manual trials are authoritative locally. Once the deadline passes,
  // transition the record immediately so every page/API using this shared gate
  // stops access instead of relying on a stale `trial` status forever.
  if (!row.stripe_subscription_id) {
    if (row.status === 'trial') {
      const trialEnd = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : NaN;
      const expired = !Number.isFinite(trialEnd) || trialEnd <= Date.now();
      if (expired) {
        const update = {
          status: 'inactive',
          updated_at: new Date().toISOString(),
        };
        await db.from('user_app_subscriptions').update(update).eq('id', row.id);
        return {
          ...row,
          ...update,
          access_reason: 'trial_expired',
          upgrade_url: appSubscriptionUpgradeUrl(appSlug, 'trial-expired'),
        };
      }
    }
    return row;
  }

  // Paid individual-app access is provider-neutral. Legacy Stripe identifiers may
  // remain on historical rows, but runtime access must not call Stripe.
  // Current billing fulfillment is authoritative when it marks the local row active.
  if (row.status === 'active') return row;

  return {
    ...row,
    access_reason: row.status || 'inactive',
    upgrade_url: appSubscriptionUpgradeUrl(appSlug, row.status || 'inactive'),
  };
}
