/**
 * Webhook event deduplication and tracking.
 *
 * Every webhook event is recorded before processing.
 * If the event_id already exists, processing is skipped (idempotent).
 * After processing, the record is finalized with status + timestamp.
 */

import { randomUUID, createHash } from 'node:crypto';
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
  leaseToken?: string;
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

    if (provider === 'sendgrid-inbound' && options.requireFinalizedDuplicate) {
      const token = randomUUID();
      const { data, error } = await supabase.rpc('claim_inbound_webhook_event', {
        p_event_id: eventId, p_event_type: eventType, p_metadata: metadata || {}, p_token: token,
      });
      if (error) throw error;
      if (data?.state === 'duplicate') return { shouldProcess: false, isDuplicate: true, confident: true };
      if (data?.state === 'claimed' && data.leaseToken === token)
        return { shouldProcess: true, isDuplicate: false, confident: true, leaseToken: token };
      return { shouldProcess: true, isDuplicate: true, confident: false };
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
  options: { strict?: boolean; leaseToken?: string; retrySafe?: boolean } = {},
): Promise<void> {
  try {
    const supabase = await requireAdminClient();
    if (!supabase) {
      if (options.strict) throw new Error('Webhook finalization unavailable');
      return;
    }

    if (provider === 'sendgrid-inbound' && options.leaseToken) {
      const { data, error } = await supabase.rpc('finish_inbound_webhook_event', {
        p_event_id: eventId, p_token: options.leaseToken, p_status: status,
        p_error: errorMessage || null, p_retry_safe: options.retrySafe === true,
      });
      if (error || data !== true) throw new Error('Inbound delivery lease lost or finalization unavailable');
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

/** A message/target receipt fences external sends across split SMTP envelopes and retries. */
export async function claimInboundForward(messageId: string, target: string): Promise<{
  state: 'claimed' | 'duplicate' | 'blocked'; eventId: string; leaseToken?: string;
}> {
  const eventId = createHash('sha256').update(JSON.stringify([messageId, target.toLowerCase()])).digest('hex') + ':forward';
  const db = await requireAdminClient();
  // Pre-lease releases did not retain a reliable send receipt. A terminal old
  // claim must never cause a second external send during rollout/retry.
  const legacy = await db.from('webhook_events_processed').select('status,error_message')
    .eq('provider','sendgrid-inbound').eq('event_id',messageId).maybeSingle();
  if (legacy.error) throw new Error('Legacy forwarding receipt unavailable');
  if (legacy.data && ['processed','skipped'].includes(legacy.data.status))
    return { state: 'duplicate', eventId };
  if (legacy.data && !/^SendGrid rejected request \([45]\d\d\)$/.test(legacy.data.error_message || ''))
    return { state: 'blocked', eventId };
  const leaseToken = randomUUID();
  const { data, error } = await db.rpc('claim_inbound_webhook_event', {
    p_event_id: eventId, p_event_type: 'email.forward', p_metadata: { messageId, target }, p_token: leaseToken,
  });
  if (error) throw error;
  if (data?.state === 'duplicate') return { state: 'duplicate', eventId };
  if (data?.state !== 'claimed' || data.leaseToken !== leaseToken) return { state: 'blocked', eventId };
  const begun = await db.rpc('begin_inbound_webhook_forward', { p_event_id: eventId, p_token: leaseToken });
  if (begun.error || begun.data !== true) throw new Error('Forwarding send barrier unavailable');
  return { state: 'claimed', eventId, leaseToken };
}
