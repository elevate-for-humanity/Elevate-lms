/**
 * Stripe Webhook Idempotency
 * Shared utility for all Stripe webhook handlers
 * Prevents duplicate processing of the same event
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export interface IdempotencyResult {
  isDuplicate: boolean;
  eventId: string;
}

/**
 * Check if a Stripe event has already been processed
 * Returns immediately with 200 if duplicate
 */
export async function checkIdempotency(eventId: string): Promise<IdempotencyResult> {
  const supabase = await getAdminClient();
  
  const { data } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single();
  
  return {
    isDuplicate: !!data,
    eventId,
  };
}

/**
 * Mark a Stripe event as processed
 * Call this AFTER successful processing
 */
export async function markEventProcessed(
  eventId: string,
  eventType: string,
  paymentIntentId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = await getAdminClient();
  
  const { error } = await supabase
    .from('processed_stripe_events')
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      payment_intent_id: paymentIntentId || null,
      environment: ENVIRONMENT,
      metadata: metadata || null,
    });
  
  if (error) {
    // Log but don't throw - idempotency table insert failure shouldn't break processing
    logger.error('Failed to mark event as processed', error);
  }
}

/**
 * Wrapper for idempotent webhook handling
 * Use this at the top of every Stripe webhook handler
 */
export async function withIdempotency<T>(
  eventId: string,
  eventType: string,
  paymentIntentId: string | undefined,
  handler: () => Promise<T>
): Promise<{ result: T | null; isDuplicate: boolean }> {
  // Check if already processed
  const { isDuplicate } = await checkIdempotency(eventId);
  
  if (isDuplicate) {
    logger.info('Duplicate Stripe event, skipping', { eventId, eventType });
    return { result: null, isDuplicate: true };
  }
  
  // Execute handler
  const result = await handler();
  
  // Mark as processed
  await markEventProcessed(eventId, eventType, paymentIntentId);
  
  return { result, isDuplicate: false };
}

/**
 * Create idempotent response for duplicate events
 */
export function duplicateEventResponse(): Response {
  return Response.json({ 
    received: true, 
    duplicate: true,
    message: 'Event already processed' 
  });
}
