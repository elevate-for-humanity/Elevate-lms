import type { SupabaseClient } from '@/lib/supabase';

/**
 * Legacy Stripe recurring-subscription processor.
 * Current recurring billing is provider-neutral and is synchronized through
 * billing schedules, provider webhooks, and billing fulfillment jobs.
 */
export async function processSubscriptionEvent(
  _db: SupabaseClient,
  _providerClient: unknown,
  _event: unknown,
): Promise<boolean> {
  return false;
}
