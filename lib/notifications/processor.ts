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

  // Fetch queued notifications
  const { data: notifications, error: fetchError } = await supabase
    .from('notification_outbox')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (fetchError) {
    logger.error('Failed to fetch notifications:', fetchError);
    return { ...result, errors: [{ id: 'fetch', error: fetchError.message }] };
  }

  if (!notifications || notifications.length === 0) {
    return result;
  }

  result.processed = notifications.length;

  // Process each notification
  for (const notification of notifications as QueuedNotification[]) {
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
        // Mark as sent
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
      // Mark as failed or increment attempts
      const newAttempts = notification.attempts + 1;
      const newStatus = newAttempts >= notification.max_attempts ? 'failed' : 'queued';

      await supabase
        .from('notification_outbox')
        .update({
          status: newStatus,
          attempts: newAttempts,
          last_error: 'Operation failed',
          // Exponential backoff for retries
          scheduled_for: newStatus === 'queued'
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
  sent: number;
  failed: number;
  oldest_queued?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { queued: 0, sent: 0, failed: 0 };
  }

  const [queuedResult, sentResult, failedResult, oldestResult] = await Promise.all([
    supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued'),
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
      .select('created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ]);

  return {
    queued: queuedResult.count || 0,
    sent: sentResult.count || 0,
    failed: failedResult.count || 0,
    oldest_queued: oldestResult.data?.created_at,
  };
}
