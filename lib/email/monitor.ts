import { logger } from '@/lib/logger';
/**
 * Email Delivery Monitoring System
 * Tracks email success/failure rates and provides visibility
 */

import { getAdminClient } from '@/lib/supabase/admin';

export interface EmailLog {
  id?: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  provider: 'sendgrid' | 'smtp' | 'fallback';
  error_message?: string;
  sent_at?: string;
  created_at?: string;
}

/**
 * Log email delivery attempt
 */
export async function logEmailDelivery(log: EmailLog): Promise<void> {
  try {
    const supabase = await getAdminClient();

    await supabase.from('email_logs').insert({
      to: log.to,
      subject: log.subject,
      status: log.status,
      provider: log.provider,
      error_message: log.error_message,
      sent_at: log.sent_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  } catch (error) { /* Error handled silently */ 
    // Don't fail the email send if logging fails
    logger.error('[Email Monitor] Failed to log email:', error);
  }
}

/**
 * Get email delivery statistics
 */
export async function getEmailStats(timeframe: '24h' | '7d' | '30d' = '24h') {
  const supabase = await getAdminClient();

  const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: logs } = await supabase
    .from('email_logs')
    .select('status, provider')
    .gte('created_at', since);

  if (!logs) return null;

  const total = logs.length;
  const sent = logs.filter(l => l.status === 'sent').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const pending = logs.filter(l => l.status === 'pending').length;

  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : '0',
    failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : '0',
    byProvider: {
      sendgrid: logs.filter(l => l.provider === 'sendgrid').length,
      sendgrid: logs.filter(l => l.provider === 'sendgrid').length,
      fallback: logs.filter(l => l.provider === 'fallback').length,
    },
  };
}

/**
 * Get recent failed emails
 */
export async function getRecentFailures(limit = 10) {
  const supabase = await getAdminClient();

  const { data: failures } = await supabase
    .from('email_logs')
    .select('*')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);

  return failures || [];
}

/**
 * Check email health status
 */
export async function checkEmailHealth() {
  const stats = await getEmailStats('24h');

  if (!stats) {
    return { status: 'unknown', message: 'No email data available' };
  }

  const failureRate = parseFloat(stats.failureRate);

  if (failureRate === 0) {
    return { status: 'healthy', message: '100% delivery success' };
  } else if (failureRate < 5) {
    return { status: 'good', message: `${stats.successRate}% success rate` };
  } else if (failureRate < 10) {
    return { status: 'warning', message: `${failureRate}% failure rate - investigate` };
  } else {
    return { status: 'critical', message: `${failureRate}% failure rate - immediate action needed` };
  }
}
