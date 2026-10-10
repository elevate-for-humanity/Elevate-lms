import { randomUUID } from 'node:crypto';
/**
 * Notification Queue Processor
 *
 * Processes queued notifications from the outbox table.
 * Designed to be called by a scheduled function (cron) every 1-5 minutes.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { getEllieReminderTemplate } from './ellie-reminder-template';
import { getTemplate } from './templates';
import type { TemplateKey } from './templates';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'notifications@elevateforhumanity.org';
const MAX_BATCH_SIZE = 4; // Bounded by the route deadline and per-send timeout.
export const NOTIFICATION_DELIVERY_CONTRACT = 2;

interface QueuedNotification {
  id: string;
  to_email: string;
  template_key: string;
  template_data: Record<string, any>;
  attempts: number;
  max_attempts: number;
}

interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

function resolveTemplate(notification: QueuedNotification) {
  if (notification.template_key === 'ellie_reminder') {
    return getEllieReminderTemplate(notification.template_data);
  }
  return getTemplate(notification.template_key as TemplateKey, notification.template_data);
}

/**
 * Process queued notifications
 */
export async function processNotificationQueue(): Promise<ProcessResult> {
  const supabase = await requireAdminClient();
  const result: ProcessResult = { processed: 0, sent: 0, failed: 0, errors: [] };
  if (!supabase) throw new Error('Notification database unavailable');
  const claimToken = randomUUID();
  const { data: claimed, error: claimError } = await supabase.rpc('claim_notification_outbox', {
    p_claim_token: claimToken,
    p_limit: MAX_BATCH_SIZE,
  });
  if (claimError || !Array.isArray(claimed)) throw new Error('Notification claim failed');
  result.processed = claimed.length;

  async function persist(id: string, patch: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('notification_outbox')
      .update(patch)
      .eq('id', id)
      .eq('status', 'processing')
      .eq('claim_token', claimToken)
      .select('id')
      .single();
    if (error || !data) throw new Error('Notification state was not confirmed');
  }

  for (const notification of claimed as QueuedNotification[]) {
    try {
      const template = resolveTemplate(notification);
      // Confirm durable ownership immediately before any network side effect.
      await persist(notification.id, {
        delivery_started_at: new Date().toISOString(),
        attempts: notification.attempts + 1,
      });
      const sent = await sendEmailViaProvider({
        to: notification.to_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      if (!sent.success) throw new Error('Provider did not confirm acceptance');
      await persist(notification.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: sent.data?.messageId || null,
        last_error: null,
        claim_token: null,
      });
      // `sent` means provider acceptance persisted, never claimed inbox delivery.
      result.sent++;
    } catch {
      result.failed++;
      result.errors.push({ id: notification.id, error: 'Notification requires review' });
      // A timeout can occur after the provider accepted a message. Preserve the
      // row and never automatically resend an uncertain or unpersisted send.
      try {
        await persist(notification.id, {
          review_required: true,
          review_reason: 'delivery_outcome_requires_reconciliation',
          last_error: 'Notification requires review',
        });
      } catch {
        // The claim remains processing; stale-claim reconciliation also holds it.
        result.errors.push({ id: notification.id, error: 'Review state could not be confirmed' });
      }
    }
  }
  return result;
}

/**
 * Send email using SendGrid (primary provider).
 * Wraps lib/email/sendgrid.ts for the notification queue.
 */
async function sendEmailViaProvider(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string; data?: { messageId?: string } }> {
  const { sendEmail: sgSend } = await import('@/lib/email/sendgrid');

  const result = await sgSend({
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    from: DEFAULT_FROM,
    singleAttempt: true,
  });

  return result;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  queued: number;
  processing: number;
  sent: number;
  failed: number;
  dead_letter: number;
  review_required: number;
  oldest_queued?: string;
}> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    throw new Error('Notification database unavailable');
  }

  const [
    queuedResult,
    processingResult,
    sentResult,
    failedResult,
    deadLetterResult,
    oldestResult,
    reviewResult,
  ] = await Promise.all([
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued'),
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing'),
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('dead_letter', true),
    supabase
      .from('notification_outbox')
      .select('created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('review_required', true),
  ]);
  if (
    [
      queuedResult,
      processingResult,
      sentResult,
      failedResult,
      deadLetterResult,
      oldestResult,
      reviewResult,
    ].some((r) => r.error)
  ) {
    throw new Error('Notification statistics unavailable');
  }

  return {
    queued: queuedResult.count || 0,
    processing: processingResult.count || 0,
    sent: sentResult.count || 0,
    failed: failedResult.count || 0,
    dead_letter: deadLetterResult.count || 0,
    review_required: reviewResult.count || 0,
    oldest_queued: oldestResult.data?.created_at,
  };
}
