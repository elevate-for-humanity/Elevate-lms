import { logger } from '@/lib/logger';
/**
 * Notification Queue Processor
 * 
 * Processes queued notifications from the outbox table.
 * Designed to be called by a scheduled function (cron) every 1-5 minutes.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplate } from './templates';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'notifications@elevateforhumanity.org';
const MAX_BATCH_SIZE = 50;
const MAX_RETRIES = 5;

interface QueuedNotification {
  id: string;
  to_email: string;
  template_key: TemplateKey;
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

/**
 * Process queued notifications
 */
export async function processNotificationQueue(): Promise<ProcessResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { processed: 0, sent: 0, failed: 0, errors: [{ id: 'system', error: 'Database unavailable' }] };
  }

  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Claim a batch: atomically move queued → processing to prevent double-pickup
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from('notification_outbox')
    .update({ status: 'processing', processed_at: now })
    .eq('status', 'queued')
    .lte('scheduled_for', now)
    .lt('attempts', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(MAX_BATCH_SIZE)
    .select('*');

  if (claimError) {
    logger.error('Failed to claim notifications:', claimError);
    return { ...result, errors: [{ id: 'claim', error: claimError.message }] };
  }

  if (!claimed || claimed.length === 0) {
    return result;
  }

  result.processed = claimed.length;

  // Process each claimed notification
  for (const notification of claimed as QueuedNotification[]) {
    try {
      // Get email template
      const template = getTemplate(notification.template_key, notification.template_data);

      // Send email
      const sendResult = await sendEmailViaProvider({
        to: notification.to_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (sendResult.success) {
        await supabase
          .from('notification_outbox')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: notification.attempts + 1,
          })
          .eq('id', notification.id);

        result.sent++;
      } else {
        throw new Error(sendResult.error || 'Send failed');
      }
    } catch (error: any) {
      const newAttempts = notification.attempts + 1;
      const exhausted = newAttempts >= notification.max_attempts;

      await supabase
        .from('notification_outbox')
        .update({
          status: exhausted ? 'failed' : 'queued',
          attempts: newAttempts,
          last_error: 'Operation failed',
          dead_letter: exhausted ? true : undefined,
          // Exponential backoff: 2^n minutes (2m, 4m, 8m, 16m, 32m)
          scheduled_for: !exhausted
            ? new Date(Date.now() + Math.pow(2, newAttempts) * 60000).toISOString()
            : undefined,
        })
        .eq('id', notification.id);

      result.failed++;
      result.errors.push({ id: notification.id, error: 'Operation failed' });
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
}): Promise<{ success: boolean; error?: string }> {
  // Dynamic import to avoid circular dependency
  const { sendEmail: sgSend } = await import('@/lib/email/sendgrid');

  const result = await sgSend({
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    from: DEFAULT_FROM,
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
  oldest_queued?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { queued: 0, processing: 0, sent: 0, failed: 0, dead_letter: 0 };
  }

  const [queuedResult, processingResult, sentResult, failedResult, deadLetterResult, oldestResult] = await Promise.all([
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
      .single(),
  ]);

  return {
    queued: queuedResult.count || 0,
    processing: processingResult.count || 0,
    sent: sentResult.count || 0,
    failed: failedResult.count || 0,
    dead_letter: deadLetterResult.count || 0,
    oldest_queued: oldestResult.data?.created_at,
  };
}
