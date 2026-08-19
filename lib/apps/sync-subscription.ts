import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
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

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) {
    // Fail closed for a paid record when billing state cannot be verified.
    return {
      ...row,
      status: 'billing_verification_unavailable',
      access_reason: 'billing_verification_unavailable',
      upgrade_url: appSubscriptionUpgradeUrl(appSlug, 'billing-verification-unavailable'),
    };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const raw = subscription as unknown as {
      status: string;
      current_period_start?: number;
      current_period_end?: number;
      trial_end?: number | null;
      customer?: string | { id?: string } | null;
    };

    const mappedStatus = ACCESSIBLE_STRIPE_STATUSES.has(raw.status)
      ? 'active'
      : raw.status === 'past_due' || raw.status === 'unpaid' || raw.status === 'incomplete'
        ? 'past_due'
        : raw.status === 'canceled' || raw.status === 'incomplete_expired'
          ? 'canceled'
          : 'inactive';

    const update = {
      status: mappedStatus,
      current_period_start: raw.current_period_start ? new Date(raw.current_period_start * 1000).toISOString() : row.current_period_start,
      current_period_end: raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : row.current_period_end,
      trial_ends_at: raw.trial_end ? new Date(raw.trial_end * 1000).toISOString() : row.trial_ends_at,
      stripe_customer_id:
        typeof raw.customer === 'string'
          ? raw.customer
          : raw.customer && typeof raw.customer === 'object'
            ? raw.customer.id || row.stripe_customer_id
            : row.stripe_customer_id,
      updated_at: new Date().toISOString(),
    };

    await db.from('user_app_subscriptions').update(update).eq('id', row.id);
    return {
      ...row,
      ...update,
      ...(mappedStatus === 'active'
        ? {}
        : {
            access_reason: mappedStatus,
            upgrade_url: appSubscriptionUpgradeUrl(appSlug, mappedStatus),
          }),
    };
  } catch {
    // Deleted/missing Stripe subscriptions must not continue granting paid access.
    const update = { status: 'canceled', updated_at: new Date().toISOString() };
    await db.from('user_app_subscriptions').update(update).eq('id', row.id);
    return {
      ...row,
      ...update,
      access_reason: 'canceled',
      upgrade_url: appSubscriptionUpgradeUrl(appSlug, 'canceled'),
    };
  }
}
