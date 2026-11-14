import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Check if a Stripe event has already been processed
 * Returns true if already processed (should skip)
 */
export async function isEventProcessed(
  supabase: SupabaseClient,
  stripeEventId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new events
    logger.error('Error checking event idempotency', error);
  }

  return !!data;
}

/**
 * Mark a Stripe event as processed
 * Should be called AFTER successful processing
 */
export async function markEventProcessed(
  supabase: SupabaseClient,
  stripeEventId: string,
  eventType: string,
  paymentIntentId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('processed_stripe_events').insert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    payment_intent_id: paymentIntentId,
    metadata: metadata || {},
  });

  if (error) {
    // If duplicate key error, event was already processed (race condition)
    if (error.code === '23505') {
      logger.warn('Event already processed (race condition)', { stripeEventId });
      return;
    }
    logger.error('Failed to mark event as processed', error);
    throw error;
  }
}

/**
 * Idempotent event handler wrapper
 * Returns null if event already processed, otherwise returns the event
 */
export async function withIdempotency<T>(
  supabase: SupabaseClient,
  stripeEventId: string,
  eventType: string,
  paymentIntentId: string | undefined,
  handler: () => Promise<T>,
): Promise<T | null> {
  // Check if already processed
  const alreadyProcessed = await isEventProcessed(supabase, stripeEventId);
  if (alreadyProcessed) {
    logger.info('Skipping already processed event', { stripeEventId, eventType });
    return null;
  }

  // Process the event
  const result = await handler();

  // Mark as processed
  await markEventProcessed(supabase, stripeEventId, eventType, paymentIntentId);

  return result;
}
