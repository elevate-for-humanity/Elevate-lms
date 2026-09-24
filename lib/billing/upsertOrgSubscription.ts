import type { SupabaseClient } from '@/lib/supabase';

export interface SubscriptionPayload {
  billingProvider: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerPaymentId?: string | null;
  plan: string;
  status: string;
  seats?: number;
  periodEnd?: string;
}

export async function upsertOrgSubscription(
  supabase: SupabaseClient,
  orgId: string,
  payload: SubscriptionPayload,
): Promise<void> {
  const { error } = await supabase.from('organization_subscriptions').upsert(
    {
      organization_id: orgId,
      billing_provider: payload.billingProvider,
      provider_customer_id: payload.providerCustomerId ?? null,
      provider_subscription_id: payload.providerSubscriptionId ?? null,
      provider_payment_id: payload.providerPaymentId ?? null,
      plan: payload.plan,
      status: payload.status,
      seats: payload.seats,
      current_period_end: payload.periodEnd,
    },
    { onConflict: 'organization_id' },
  );
  if (error) throw new Error('Failed to upsert subscription');
}
