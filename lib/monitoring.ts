
/**
 * Monitoring and Analytics for API Routes
 * Tracks auth failures, admin actions, rate limits, and errors
 */

import { NextResponse } from 'next/server';

export interface MonitoringEvent {
  type: 'auth_failure' | 'admin_action' | 'rate_limit' | 'error' | 'success';
  endpoint: string;
  userId?: string;
  ip?: string;
  statusCode: number;
  message?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * In-memory event store (for development)
 * In production, send to external service (Datadog, Sentry, etc.)
 */
const events: MonitoringEvent[] = [];
const MAX_EVENTS = 10000; // Keep last 10k events in memory

/**
 * Log a monitoring event
 */
export function logEvent(event: Omit<MonitoringEvent, 'timestamp'>) {
  const fullEvent: MonitoringEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  events.push(fullEvent);

  // Keep only last MAX_EVENTS
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') { /* Condition handled */ }

  // In production, send to external service
  if (process.env.NODE_ENV === 'production') {
        // Example: sendToDatadog(fullEvent);
  }
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  endpoint: string,
  statusCode: 401 | 403,
  ip?: string,
  userId?: string,
  reason?: string
) {
  logEvent({
    type: 'auth_failure',
    endpoint,
    statusCode,
    ip,
    userId,
    message: reason || (statusCode === 401 ? 'Unauthorized' : 'Forbidden'),
  });
}

/**
 * Log admin action
 */
export function logAdminAction(
  endpoint: string,
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  logEvent({
    type: 'admin_action',
    endpoint,
    userId,
    statusCode: 200,
    message: action,
    metadata,
  });
}

/**
 * Log rate limit hit
 */
export function logRateLimit(endpoint: string, ip: string) {
  logEvent({
    type: 'rate_limit',
    endpoint,
    ip,
    statusCode: 429,
    message: 'Rate limit exceeded',
  });
}

/**
 * Log error
 */
export function logError(
  endpoint: string,
  statusCode: number,
  error: any,
  userId?: string
) {
  logEvent({
    type: 'error',
    endpoint,
    statusCode,
    userId,
    message: 'Operation failed',
    metadata: error instanceof Error ? { stack: error.stack } : undefined,
  });
}

/**
 * Log successful request
 */
export function logSuccess(
  endpoint: string,
  statusCode: number,
  userId?: string,
  metadata?: Record<string, any>
) {
  logEvent({
    type: 'success',
    endpoint,
    statusCode,
    userId,
    metadata,
  });
}

/**
 * Get monitoring statistics
 */
export function getStats(timeWindowMs: number = 3600000) {
  const now = Date.now();
  const cutoff = new Date(now - timeWindowMs).toISOString();

  const recentEvents = events.filter((e) => e.timestamp >= cutoff);

  const stats = {
    total: recentEvents.length,
    byType: {} as Record<string, number>,
    byEndpoint: {} as Record<string, number>,
    byStatusCode: {} as Record<number, number>,
    authFailures: 0,
    rateLimits: 0,
    errors: 0,
    adminActions: 0,
    uniqueUsers: new Set<string>(),
    uniqueIPs: new Set<string>(),
  };

  for (const event of recentEvents) {
    // Count by type
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

    // Count by endpoint
    stats.byEndpoint[event.endpoint] = (stats.byEndpoint[event.endpoint] || 0) + 1;

    // Count by status code
    stats.byStatusCode[event.statusCode] = (stats.byStatusCode[event.statusCode] || 0) + 1;

    // Count specific types
    if (event.type === 'auth_failure') stats.authFailures++;
    if (event.type === 'rate_limit') stats.rateLimits++;
    if (event.type === 'error') stats.errors++;
    if (event.type === 'admin_action') stats.adminActions++;

    // Track unique users and IPs
    if (event.userId) stats.uniqueUsers.add(event.userId);
    if (event.ip) stats.uniqueIPs.add(event.ip);
  }

  return {
    ...stats,
    uniqueUsers: stats.uniqueUsers.size,
    uniqueIPs: stats.uniqueIPs.size,
    timeWindowMs,
    startTime: cutoff,
    endTime: new Date(now).toISOString(),
  };
}

/**
 * Get recent auth failures
 */
export function getRecentAuthFailures(limit: number = 100) {
  return events
    .filter((e) => e.type === 'auth_failure')
    .slice(-limit)
    .reverse();
}

/**
 * Get recent admin actions
 */
export function getRecentAdminActions(limit: number = 100) {
  return events
    .filter((e) => e.type === 'admin_action')
    .slice(-limit)
    .reverse();
}

/**
 * Get failed login attempts by IP
 */
export function getFailedLoginsByIP(timeWindowMs: number = 3600000) {
  const now = Date.now();
  const cutoff = new Date(now - timeWindowMs).toISOString();

  const failuresByIP = new Map<string, number>();

  events
    .filter((e) => e.type === 'auth_failure' && e.timestamp >= cutoff && e.ip)
    .forEach((e) => {
      const count = failuresByIP.get(e.ip!) || 0;
      failuresByIP.set(e.ip!, count + 1);
    });

  return Array.from(failuresByIP.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Check if IP should be blocked (too many failed attempts)
 */
export function shouldBlockIP(ip: string, maxFailures: number = 10, timeWindowMs: number = 3600000): boolean {
  const failures = getFailedLoginsByIP(timeWindowMs);
  const ipFailures = failures.find((f) => f.ip === ip);
  return ipFailures ? ipFailures.count >= maxFailures : false;
}

/**
 * Middleware to add monitoring to API routes
 */
export function withMonitoring(
  handler: (data: any) => Promise<NextResponse>
) {
  return async (data: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = new URL(req.url).pathname;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                req.headers.get('x-real-ip') ||
                'unknown';

    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      // Log based on status code
      if (response.status === 401 || response.status === 403) {
        logAuthFailure(endpoint, response.status, ip);
      } else if (response.status === 429) {
        logRateLimit(endpoint, ip);
      } else if (response.status >= 500) {
        logError(endpoint, response.status, 'Server error');
      } else if (response.status >= 200 && response.status < 300) {
        logSuccess(endpoint, response.status, undefined, { duration });
      }

      return response;
    } catch (error) { /* Error handled silently */ 
      const duration = Date.now() - startTime;
      logError(endpoint, 500, error);
      throw error;
    }
  };
}

/**
 * API endpoint to get monitoring stats
 */
export function createMonitoringEndpoint() {
  return async (req: Request) => {
    // Only allow in development or with admin auth
    if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const timeWindow = parseInt(url.searchParams.get('window') || '3600000');

    const stats = getStats(timeWindow);
    const authFailures = getRecentAuthFailures(50);
    const adminActions = getRecentAdminActions(50);
    const failedLoginsByIP = getFailedLoginsByIP(timeWindow);

    return NextResponse.json({
      stats,
      authFailures,
      adminActions,
      failedLoginsByIP,
    });
  };
}
