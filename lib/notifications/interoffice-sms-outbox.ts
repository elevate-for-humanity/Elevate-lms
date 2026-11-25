import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { sendSMS } from './sms';

/**
 * Processor for interoffice_sms_outbox — the durable SMS companion rows of
 * internal notifications (one row per notification, unique on
 * notification_id). Until now nothing drained this table, so pending rows
 * accumulated with no sender.
 *
 * Claim and outcome semantics mirror the phone delivery pipeline
 * (lib/phone/notification-delivery.ts):
 * - Only 'pending' rows are claimed, atomically (pending -> processing).
 *   Terminal rows are never touched: 'accepted' is final, and
 *   'review_required' rows are held for a human — this processor never
 *   resurrects them.
 * - Provider acceptance is recorded as 'accepted' with the provider
 *   message id. Acceptance is not proof the recipient read the message.
 * - A send the SMS service provably never attempted (sending number or
 *   configuration unavailable) returns the row to 'pending' so a later run
 *   can claim it once configuration heals — the send_not_accepted pattern.
 * - A definitively refused recipient (invalid number) and any send whose
 *   outcome could not be confirmed are held as 'review_required': an
 *   unconfirmed send may already have been accepted by the provider, so it
 *   is never resent automatically.
 */
export async function processInterofficeSmsOutbox(limit = 20) {
  const db = await requireAdminClient();
  const { data: rows, error } = await db
    .from('interoffice_sms_outbox')
    .select('id,phone,message')
    .eq('status', 'pending')
    .order('created_at')
    .limit(limit);
  if (error) throw new Error('Interoffice SMS queue unavailable');
  let sent = 0;
  let retried = 0;
  let reviewRequired = 0;
  for (const row of rows || []) {
    const claimed = await db
      .from('interoffice_sms_outbox')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id');
    if (claimed.error || !claimed.data?.length) continue;
    const result = await sendSMS(row.phone, row.message);
    const now = new Date().toISOString();
    if (result.success) {
      const { error: saveError } = await db
        .from('interoffice_sms_outbox')
        .update({
          status: 'accepted',
          provider_message_id: result.messageId || null,
          error_message: null,
          updated_at: now,
        })
        .eq('id', row.id)
        .eq('status', 'processing');
      if (saveError) throw new Error('Interoffice SMS delivery receipt could not be saved');
      sent++;
      continue;
    }
    // sendSMS (lib/notifications/sms.ts) resolves every failure; its error
    // strings are the classification contract:
    // - 'Invalid phone number': refused before any provider call; retrying
    //   can never succeed, so the row is held for review.
    // - 'SMS send outcome could not be confirmed': the provider call threw;
    //   the message may already have been accepted — never resend.
    // - anything else (sending number/configuration unavailable): nothing
    //   was sent, so the row stays claimable by a later run.
    if (
      result.error === 'Invalid phone number' ||
      result.error === 'SMS send outcome could not be confirmed'
    ) {
      const { error: holdError } = await db
        .from('interoffice_sms_outbox')
        .update({ status: 'review_required', error_message: result.error, updated_at: now })
        .eq('id', row.id)
        .eq('status', 'processing');
      if (holdError) throw new Error('Interoffice SMS review state could not be saved');
      reviewRequired++;
      continue;
    }
    const { error: retryError } = await db
      .from('interoffice_sms_outbox')
      .update({
        status: 'pending',
        error_message: result.error || 'SMS send was not accepted',
        updated_at: now,
      })
      .eq('id', row.id)
      .eq('status', 'processing');
    if (retryError) throw new Error('Interoffice SMS retry state could not be saved');
    retried++;
  }
  return { processed: (rows || []).length, sent, retried, reviewRequired };
}
