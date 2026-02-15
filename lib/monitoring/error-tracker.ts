import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

async function sendCriticalAlert(data: {
  type: string;
  description: string;
  endpoint?: string;
  severity: string;
  userId?: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@elevateforhumanity.org';
  
  if (!resendKey) {
    logger.error('RESEND_API_KEY not configured for alerts');
    return;
  }

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate LMS Alerts <alerts@elevateforhumanity.org>',
    to: adminEmail,
    subject: `🚨 CRITICAL: ${data.type}`,
    html: `
      <h1 style="color: red;">Critical Security Alert</h1>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>Description:</strong> ${data.description}</p>
      <p><strong>Endpoint:</strong> ${data.endpoint || 'N/A'}</p>
      <p><strong>Severity:</strong> ${data.severity}</p>
      <p><strong>User ID:</strong> ${data.userId || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <hr>
      <p>Review this event in the admin dashboard immediately.</p>
    `,
  });

  // Also try Slack if configured
  const slackWebhook = process.env.SLACK_ALERT_WEBHOOK;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *CRITICAL SECURITY ALERT*\n*Type:* ${data.type}\n*Description:* ${data.description}\n*Endpoint:* ${data.endpoint || 'N/A'}\n*Time:* ${new Date().toISOString()}`,
        }),
      });
    } catch (slackError) {
      logger.error('Failed to send Slack alert:', slackError);
    }
  }
}

export interface ErrorLog {
  endpoint: string;
  method: string;
  error: string;
  statusCode: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: any;
  stack?: string;
}

/**
 * Log error to database for monitoring
 */
export async function logError(errorLog: ErrorLog): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      action_type: 'error',
      description: errorLog.error,
      user_id: errorLog.userId || null,
      ip_address: errorLog.ipAddress || null,
      details: {
        endpoint: errorLog.endpoint,
        method: errorLog.method,
        statusCode: errorLog.statusCode,
        userAgent: errorLog.userAgent,
        requestBody: errorLog.requestBody,
        stack: errorLog.stack,
      },
    });
  } catch (error) {
    // Don't throw - logging errors shouldn't break the app
    logger.error('Failed to log error:', error);
  }
}

/**
 * Log API request for monitoring
 */
export async function logRequest(data: {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      action_type: 'api_request',
      description: `${data.method} ${data.endpoint}`,
      user_id: data.userId || null,
      ip_address: data.ipAddress || null,
      details: {
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        duration: data.duration,
      },
    });
  } catch (error) {
    logger.error('Failed to log request:', error);
  }
}

/**
 * Log rate limit hit
 */
export async function logRateLimitHit(data: {
  endpoint: string;
  ipAddress: string;
  limit: number;
  remaining: number;
}): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      action_type: 'rate_limit_hit',
      description: `Rate limit exceeded for ${data.endpoint}`,
      ip_address: data.ipAddress,
      details: {
        endpoint: data.endpoint,
        limit: data.limit,
        remaining: data.remaining,
      },
    });
  } catch (error) {
    logger.error('Failed to log rate limit hit:', error);
  }
}

/**
 * Log security event
 */
export async function logSecurityEvent(data: {
  type: 'unauthorized_access' | 'invalid_token' | 'suspicious_activity' | 'brute_force';
  description: string;
  endpoint: string;
  ipAddress?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      action_type: 'security_event',
      description: data.description,
      user_id: data.userId || null,
      ip_address: data.ipAddress || null,
      details: {
        type: data.type,
        endpoint: data.endpoint,
        severity: data.severity,
      },
    });

    // Send alerts for critical events
    if (data.severity === 'critical') {
      logger.error('🚨 CRITICAL SECURITY EVENT:', data);
      try {
        await sendCriticalAlert(data);
      } catch (alertError) {
        logger.error('Failed to send critical alert:', alertError);
      }
    }
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
}

/**
 * Get error statistics
 */
export async function getErrorStats(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<{
  total: number;
  byEndpoint: Record<string, number>;
  byStatusCode: Record<number, number>;
}> {
  try {
    const supabase = createAdminClient();
    
    const now = new Date();
    const startTime = new Date(now);
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    const { data: errors } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'error')
      .gte('created_at', startTime.toISOString());

    const byEndpoint: Record<string, number> = {};
    const byStatusCode: Record<number, number> = {};

    (errors || []).forEach((error: any) => {
      const endpoint = error.details?.endpoint || 'unknown';
      const statusCode = error.details?.statusCode || 500;

      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
      byStatusCode[statusCode] = (byStatusCode[statusCode] || 0) + 1;
    });

    return {
      total: errors?.length || 0,
      byEndpoint,
      byStatusCode,
    };
  } catch (error) {
    logger.error('Failed to get error stats:', error);
    return {
      total: 0,
      byEndpoint: {},
      byStatusCode: {},
    };
  }
}

/**
 * Enhanced error handler with logging
 */
export function withErrorLogging<T = any>(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;

    try {
      const response = await handler(request, context);
      
      // Log successful requests (optional - can be disabled for performance)
      if (response.status >= 400) {
        await logError({
          endpoint,
          method,
          error: `HTTP ${response.status}`,
          statusCode: response.status,
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      }

      return response;
    } catch (error) {
      // Log error
      await logError({
        endpoint,
        method,
        error: 'Operation failed',
        statusCode: 500,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  };
}
