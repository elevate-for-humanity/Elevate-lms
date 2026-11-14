/**
 * Webhook event deduplication and tracking.
 *
 * Every webhook event is recorded before processing.
 * If the event_id already exists, processing is skipped (idempotent).
 * After processing, the record is finalized with status + timestamp.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type WebhookProvider =
  | 'stripe'
  | 'sezzle'
  | 'affirm'
  | 'jotform'
  | 'calendly'
  | 'resend'
  | 'sendgrid-inbound';
type EventStatus = 'processing' | 'processed' | 'skipped' | 'errored';

interface TrackEventResult {
  /** true if this is a new event that should be processed */
  shouldProcess: boolean;
  /** true if this event was already processed (duplicate) */
  isDuplicate: boolean;
  /** true if the deduplication check was authoritative (DB confirmed).
   *  false if DB was unavailable — caller should fail-closed for state mutations. */
  confident: boolean;
}

/**
 * Attempt to claim a webhook event for processing.
 * Returns shouldProcess=true if this is the first time seeing this event_id.
 * Returns shouldProcess=false if already processed (idempotent skip).
 */
export async function claimWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  options: { requireFinalizedDuplicate?: boolean } = {},
): Promise<TrackEventResult> {
  try {
    const supabase = await requireAdminClient();
    if (!supabase) {
      // DB unavailable — caller must decide based on confident=false
      logger.warn('Webhook event tracker: DB unavailable', { provider, eventId });
      return { shouldProcess: true, isDuplicate: false, confident: false };
    }

    const { error } = await supabase.from('webhook_events_processed').insert({
      event_id: eventId,
      provider,
      event_type: eventType,
      status: 'processing',
      metadata: metadata || {},
    });

    if (error) {
      // Unique constraint violation = duplicate
      if (error.code === '23505') {
        if (options.requireFinalizedDuplicate) {
          const existing = await supabase.from('webhook_events_processed')
            .select('status').eq('provider', provider).eq('event_id', eventId).maybeSingle();
          // An in-flight or failed attempt is not a successful delivery. Keep
          // provider retry available without replaying work concurrently.
          if (existing.error || !['processed', 'skipped'].includes(existing.data?.status))
            return { shouldProcess: true, isDuplicate: true, confident: false };
        }
        logger.info('Webhook event already processed (idempotent skip)', {
          provider,
          eventId,
          eventType,
        });
        return { shouldProcess: false, isDuplicate: true, confident: true };
      }
      // Other DB error — not confident in deduplication
      logger.error('Webhook event tracker insert error', error);
      return { shouldProcess: true, isDuplicate: false, confident: false };
    }

    return { shouldProcess: true, isDuplicate: false, confident: true };
  } catch (err) {
    logger.error('Webhook event tracker exception', err);
    return { shouldProcess: true, isDuplicate: false, confident: false };
  }
}

/**
 * Mark a webhook event as finalized (processed, skipped, or errored).
 */
export async function finalizeWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
  status: Exclude<EventStatus, 'processing'>,
  errorMessage?: string,
  options: { strict?: boolean } = {},
): Promise<void> {
  try {
    const supabase = await requireAdminClient();
    if (!supabase) {
      if (options.strict) throw new Error('Webhook finalization unavailable');
      return;
    }

    const update = supabase
      .from('webhook_events_processed')
      .update({
        status,
        processed_at: new Date().toISOString(),
        error_message: errorMessage || null,
      })
      .eq('provider', provider)
      .eq('event_id', eventId);
    const { data, error } = options.strict ? await update.select('id') : await update;

    if (error || (options.strict && data?.length !== 1)) {
      logger.error('Webhook event tracker finalize error', undefined, {
        provider,
        eventId,
        status,
        error,
      });
      if (options.strict) throw new Error('Webhook finalization could not be saved');
    }
  } catch (err) {
    logger.error('Webhook event tracker finalize exception', err);
    if (options.strict) throw new Error('Webhook finalization could not be saved', { cause: err });
  }
}
