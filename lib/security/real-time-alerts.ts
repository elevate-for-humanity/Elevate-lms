/**
 * Real-Time Security Alerts System
 * Monitors security events and sends immediate notifications
 */
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// Alert severity levels
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}
// Alert types
export enum AlertType {
  FAILED_LOGIN = 'failed_login',
  BRUTE_FORCE = 'brute_force',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKOUT = 'account_lockout',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SQL_INJECTION = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}
interface SecurityAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
interface AlertChannel {
  email?: string[];
  sms?: string[];
  slack?: string;
  webhook?: string;
}
// Alert thresholds
const ALERT_THRESHOLDS = {
  failedLogins: 5, // Alert after 5 failed attempts
  bruteForceWindow: 15 * 60 * 1000, // 15 minutes
  suspiciousActivityScore: 75, // 0-100 scale
  rateLimitExceeded: 100, // requests per window
};
/**
 * Send real-time security alert
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    // Log to database
    await logSecurityAlert(alert);
    // Determine notification channels based on severity
    const channels = getAlertChannels(alert.severity);
    // Send notifications
    await Promise.all([
      sendEmailAlert(alert, channels.email),
      sendSlackAlert(alert, channels.slack),
      sendWebhookAlert(alert, channels.webhook),
      // SMS for critical alerts only
      alert.severity === AlertSeverity.CRITICAL && sendSMSAlert(alert, channels.sms),
    ]);
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    // Fallback: Log to console at minimum
    // Error logged
  }
}
/**
 * Log security alert to database
 */
async function logSecurityAlert(alert: SecurityAlert): Promise<void> {
  const supabase = await createClient();
  await supabase.from('security_alerts').insert({
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    user_id: alert.userId,
    ip_address: alert.ipAddress,
    user_agent: alert.userAgent,
    metadata: alert.metadata,
    created_at: alert.timestamp,
  });
}
/**
 * Get notification channels based on severity
 */
function getAlertChannels(severity: AlertSeverity): AlertChannel {
  const baseChannels: AlertChannel = {
    email: [process.env.SECURITY_EMAIL || 'security@www.elevateforhumanity.org'],
  };
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return {
        ...baseChannels,
        email: [
          'security@www.elevateforhumanity.org',
          'admin@www.elevateforhumanity.org',
          'cto@www.elevateforhumanity.org',
        ],
        sms: [process.env.SECURITY_PHONE || '+13173143757'],
        slack: process.env.SLACK_SECURITY_WEBHOOK,
        webhook: process.env.SECURITY_WEBHOOK_URL,
      };
    case AlertSeverity.HIGH:
      return {
        ...baseChannels,
        email: ['security@www.elevateforhumanity.org', 'admin@www.elevateforhumanity.org'],
        slack: process.env.SLACK_SECURITY_WEBHOOK,
      };
    case AlertSeverity.MEDIUM:
      return {
        ...baseChannels,
        slack: process.env.SLACK_SECURITY_WEBHOOK,
      };
    default:
      return baseChannels;
  }
}
/**
 * Send email alert
 */
async function sendEmailAlert(alert: SecurityAlert, emails?: string[]): Promise<void> {
  if (!emails || emails.length === 0) return;
  const subject = `[${alert.severity.toUpperCase()}] Security Alert: ${alert.type}`;
  const body = formatEmailBody(alert);
  // Using SendGrid or similar
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: emails.map((email) => ({ to: [{ email }] })),
        from: { email: 'security@${PLATFORM_DEFAULTS.canonicalDomain}', name: 'EFH Security' },
        subject,
        content: [
          {
            type: 'text/html',
            value: body,
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
/**
 * Send Slack alert
 */
async function sendSlackAlert(alert: SecurityAlert, webhookUrl?: string): Promise<void> {
  if (!webhookUrl) return;
  const color = getSeverityColor(alert.severity);
  const emoji = getSeverityEmoji(alert.severity);
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} Security Alert: ${alert.type}`,
        attachments: [
          {
            color,
            fields: [
              { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
              { title: 'Type', value: alert.type, short: true },
              { title: 'Message', value: alert.message, short: false },
              { title: 'User ID', value: alert.userId || 'N/A', short: true },
              { title: 'IP Address', value: alert.ipAddress || 'N/A', short: true },
              { title: 'Timestamp', value: alert.timestamp.toISOString(), short: false },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
/**
 * Send SMS alert (for critical alerts)
 * Note: SMS functionality disabled - critical alerts sent via email only
 */
async function sendSMSAlert(alert: SecurityAlert, phones?: string[]): Promise<void> {
  // SMS functionality removed - use email for critical alerts
  return;
}
/**
 * Send webhook alert
 */
async function sendWebhookAlert(alert: SecurityAlert, webhookUrl?: string): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
/**
 * Format email body
 */
function formatEmailBody(alert: SecurityAlert): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${getSeverityEmoji(alert.severity)} Security Alert</h1>
          <p>${alert.severity.toUpperCase()} - ${alert.type}</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Message:</div>
            <div class="value">${alert.message}</div>
          </div>
          ${
            alert.userId
              ? `
          <div class="field">
            <div class="label">User ID:</div>
            <div class="value">${alert.userId}</div>
          </div>
          `
              : ''
          }
          ${
            alert.ipAddress
              ? `
          <div class="field">
            <div class="label">IP Address:</div>
            <div class="value">${alert.ipAddress}</div>
          </div>
          `
              : ''
          }
          ${
            alert.userAgent
              ? `
          <div class="field">
            <div class="label">User Agent:</div>
            <div class="value">${alert.userAgent}</div>
          </div>
          `
              : ''
          }
          <div class="field">
            <div class="label">Timestamp:</div>
            <div class="value">${alert.timestamp.toISOString()}</div>
          </div>
          ${
            alert.metadata
              ? `
          <div class="field">
            <div class="label">Additional Details:</div>
            <div class="value"><pre>${JSON.stringify(alert.metadata, null, 2)}</pre></div>
          </div>
          `
              : ''
          }
        </div>
        <div class="footer">
          <p>This is an automated security alert from ${PLATFORM_DEFAULTS.orgName}.</p>
          <p>If you believe this is a false positive, please contact the security team.</p>
          <p><strong>Do not reply to this email.</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
/**
 * Get color for severity level
 */
function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return '#dc2626'; // red-600
    case AlertSeverity.HIGH:
      return '#ea580c'; // orange-600
    case AlertSeverity.MEDIUM:
      return '#f59e0b'; // amber-500
    case AlertSeverity.LOW:
      return '#3b82f6'; // blue-500
    default:
      return '#6b7280'; // gray-500
  }
}
/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return '🚨';
    case AlertSeverity.HIGH:
      return '⚠️';
    case AlertSeverity.MEDIUM:
      return '⚡';
    case AlertSeverity.LOW:
      return 'ℹ️';
    default:
      return '📢';
  }
}
/**
 * Monitor failed login attempts
 */
export async function monitorFailedLogins(userId: string, ipAddress: string): Promise<void> {
  const supabase = await createClient();
  // Get failed attempts in last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - ALERT_THRESHOLDS.bruteForceWindow);
  const { data: attempts } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'failed_login')
    .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
    .gte('created_at', fifteenMinutesAgo.toISOString());
  if (attempts && attempts.length >= ALERT_THRESHOLDS.failedLogins) {
    await sendSecurityAlert({
      type: AlertType.BRUTE_FORCE,
      severity: AlertSeverity.HIGH,
      message: `Possible brute force attack detected: ${attempts.length} failed login attempts`,
      userId,
      ipAddress,
      metadata: { attemptCount: attempts.length },
      timestamp: new Date(),
    });
  }
}
/**
 * Monitor unauthorized access attempts
 */
export async function monitorUnauthorizedAccess(
  userId: string,
  resource: string,
  ipAddress: string,
): Promise<void> {
  await sendSecurityAlert({
    type: AlertType.UNAUTHORIZED_ACCESS,
    severity: AlertSeverity.HIGH,
    message: `Unauthorized access attempt to ${resource}`,
    userId,
    ipAddress,
    metadata: { resource },
    timestamp: new Date(),
  });
}
/**
 * Monitor suspicious activity
 */
export async function monitorSuspiciousActivity(
  userId: string,
  activity: string,
  score: number,
  ipAddress: string,
): Promise<void> {
  if (score >= ALERT_THRESHOLDS.suspiciousActivityScore) {
    await sendSecurityAlert({
      type: AlertType.SUSPICIOUS_ACTIVITY,
      severity: score >= 90 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
      message: `Suspicious activity detected: ${activity} (score: ${score})`,
      userId,
      ipAddress,
      metadata: { activity, score },
      timestamp: new Date(),
    });
  }
}
/**
 * Monitor data breach attempts
 */
export async function monitorDataBreach(
  userId: string,
  dataType: string,
  recordCount: number,
  ipAddress: string,
): Promise<void> {
  await sendSecurityAlert({
    type: AlertType.DATA_BREACH,
    severity: AlertSeverity.CRITICAL,
    message: `Potential data breach: Attempted access to ${recordCount} ${dataType} records`,
    userId,
    ipAddress,
    metadata: { dataType, recordCount },
    timestamp: new Date(),
  });
}
/**
 * Monitor rate limit violations
 */
export async function monitorRateLimitExceeded(
  ipAddress: string,
  endpoint: string,
  requestCount: number,
): Promise<void> {
  if (requestCount >= ALERT_THRESHOLDS.rateLimitExceeded) {
    await sendSecurityAlert({
      type: AlertType.RATE_LIMIT_EXCEEDED,
      severity: AlertSeverity.MEDIUM,
      message: `Rate limit exceeded: ${requestCount} requests to ${endpoint}`,
      ipAddress,
      metadata: { endpoint, requestCount },
      timestamp: new Date(),
    });
  }
}
/**
 * Monitor SQL injection attempts
 */
export async function monitorSQLInjection(
  userId: string | undefined,
  query: string,
  ipAddress: string,
): Promise<void> {
  await sendSecurityAlert({
    type: AlertType.SQL_INJECTION,
    severity: AlertSeverity.CRITICAL,
    message: 'SQL injection attempt detected',
    userId,
    ipAddress,
    metadata: { query: query.substring(0, 200) }, // Truncate for safety
    timestamp: new Date(),
  });
}
/**
 * Monitor XSS attempts
 */
export async function monitorXSSAttempt(
  userId: string | undefined,
  input: string,
  ipAddress: string,
): Promise<void> {
  await sendSecurityAlert({
    type: AlertType.XSS_ATTEMPT,
    severity: AlertSeverity.HIGH,
    message: 'XSS attempt detected',
    userId,
    ipAddress,
    metadata: { input: input.substring(0, 200) }, // Truncate for safety
    timestamp: new Date(),
  });
}
