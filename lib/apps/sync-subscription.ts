import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';

const ACCESSIBLE_STRIPE_STATUSES = new Set(['active', 'trialing']);

export async function syncIndividualAppSubscription(userId: string, appSlug: string) {
  const admin = await requireAdminClient();
  const { data: row, error } = await admin
    .from('user_app_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('app_slug', appSlug)
    .maybeSingle();

  if (error || !row) return row ?? null;

  // No Stripe subscription means this is a free trial or legacy/manual record.
  if (!row.stripe_subscription_id) return row;

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) {
    // Fail closed for a paid record when billing state cannot be verified.
    return { ...row, status: 'billing_verification_unavailable' };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const raw = subscription as unknown as {
      status: string;
      current_period_start?: number;
      current_period_end?: number;
      customer?: string | { id?: string } | null;
    };

    const mappedStatus = ACCESSIBLE_STRIPE_STATUSES.has(raw.status)
      ? 'active'
      : raw.status === 'past_due' || raw.status === 'unpaid'
        ? 'past_due'
        : raw.status === 'canceled'
          ? 'canceled'
          : raw.status;

    const update = {
      status: mappedStatus,
      current_period_start: raw.current_period_start ? new Date(raw.current_period_start * 1000).toISOString() : row.current_period_start,
      current_period_end: raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : row.current_period_end,
      stripe_customer_id:
        typeof raw.customer === 'string'
          ? raw.customer
          : raw.customer && typeof raw.customer === 'object'
            ? raw.customer.id || row.stripe_customer_id
            : row.stripe_customer_id,
      updated_at: new Date().toISOString(),
    };

    await admin.from('user_app_subscriptions').update(update).eq('id', row.id);
    return { ...row, ...update };
  } catch {
    // Deleted/missing Stripe subscriptions must not continue granting paid access.
    const update = { status: 'canceled', updated_at: new Date().toISOString() };
    await admin.from('user_app_subscriptions').update(update).eq('id', row.id);
    return { ...row, ...update };
  }
}
