import { notifyCritical, notifySlack } from './notify';

export interface SecurityEvent {
  type: 'rate_limit' | 'bot_detected' | 'suspicious_pattern' | 'unauthorized_access' | 'scraping_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  userId?: string;
  details?: any;
  timestamp: Date;
}

// In-memory store (use database in production)
const events: SecurityEvent[] = [];
const blacklist = new Set<string>();

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  events.push(event);

  // Keep only last 1000 events in memory
  if (events.length > 1000) {
    events.shift();
  }

  // Check for patterns
  await analyzePatterns(event);

  // Send alerts based on severity
  if (event.severity === 'critical') {
    await notifyCritical(
      `Security Alert: ${event.type} from ${event.ip} at ${event.endpoint}`
    );
  } else if (event.severity === 'high') {
    await notifySlack(
      `⚠️ Security Warning: ${event.type} from ${event.ip}`
    );
  }
}

async function analyzePatterns(event: SecurityEvent): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const fiveMinutesAgo = now - 300000;

  // Get recent events from same IP
  const recentFromIP = events.filter(
    e => e.ip === event.ip && e.timestamp.getTime() > oneMinuteAgo
  );

  // Pattern 1: Too many events from same IP in 1 minute
  if (recentFromIP.length > 50) {
    await blacklistIP(event.ip, 'Too many security events');
    await notifyCritical(
      `IP ${event.ip} blacklisted: ${recentFromIP.length} events in 1 minute`
    );
  }

  // Pattern 2: Multiple bot detections
  const botDetections = events.filter(
    e => e.type === 'bot_detected' &&
         e.ip === event.ip &&
         e.timestamp.getTime() > fiveMinutesAgo
  );

  if (botDetections.length > 3) {
    await blacklistIP(event.ip, 'Multiple bot detections');
  }

  // Pattern 3: Scraping multiple endpoints
  const uniqueEndpoints = new Set(
    recentFromIP.map(e => e.endpoint)
  );

  if (uniqueEndpoints.size > 20) {
    await logSecurityEvent({
      type: 'scraping_attempt',
      severity: 'high',
      ip: event.ip,
      userAgent: event.userAgent,
      endpoint: 'multiple',
      details: { endpointCount: uniqueEndpoints.size },
      timestamp: new Date(),
    });
  }
}

export async function blacklistIP(
  ip: string,
  reason: string
): Promise<void> {
  blacklist.add(ip);

  // In production, store in database
  // await db.blacklist.create({ ip, reason, timestamp: new Date() });
}

export function isBlacklisted(ip: string): boolean {
  return blacklist.has(ip);
}

export function getSecurityStats(): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  blacklistedIPs: number;
  recentEvents: SecurityEvent[];
} {
  const eventsByType: Record<string, number> = {};
  const eventsBySeverity: Record<string, number> = {};

  events.forEach(event => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    eventsByType,
    eventsBySeverity,
    blacklistedIPs: blacklist.size,
    recentEvents: events.slice(-10),
  };
}

// Cleanup old events every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  const filtered = events.filter(
    e => e.timestamp.getTime() > oneHourAgo
  );
  events.length = 0;
  events.push(...filtered);
}, 3600000);
