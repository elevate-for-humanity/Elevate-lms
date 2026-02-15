import { SupabaseClient } from '@supabase/supabase-js';

export interface SubscriptionPayload {
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: string;
  status: string;
  seats?: number;
  periodEnd?: string;
}

/**
 * Upsert organization subscription from Stripe webhook
 * Call this from existing Stripe webhook handlers
 */
export async function upsertOrgSubscription(
  supabase: SupabaseClient,
  orgId: string,
  payload: SubscriptionPayload
): Promise<void> {
  const { error } = await supabase.from('organization_subscriptions').upsert(
    {
      organization_id: orgId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      plan: payload.plan,
      status: payload.status,
      seats: payload.seats,
      current_period_end: payload.periodEnd,
    },
    {
      onConflict: 'organization_id',
    }
  );

  if (error) {
    throw new Error(`Failed to upsert subscription`);
  }
}
