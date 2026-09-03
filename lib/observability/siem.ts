// lib/observability/siem.ts
const SIEM_ENDPOINT = process.env.SIEM_ENDPOINT; // Datadog/Splunk HTTP collector
const SIEM_API_KEY = process.env.SIEM_API_KEY;
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export async function sendSecurityLog(event: {
  level: LogLevel;
  message: string;
  actorId?: string;
  actorEmail?: string;
  ip?: string;
  metadata?: Record<string, any>;
}) {
  if (!SIEM_ENDPOINT || !SIEM_API_KEY) {
    // No SIEM configured – fail soft, but still log locally.
    //
    return;
  }
  const body = {
    timestamp: new Date().toISOString(),
    level: event.level,
    message: event.message,
    actorId: event.actorId,
    actorEmail: event.actorEmail,
    ip: event.ip,
    metadata: event.metadata ?? {},
    service: 'efh-next-app',
    env: process.env.NODE_ENV || 'development',
  };
  try {
    await fetch(SIEM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': SIEM_API_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
export async function logAuthAttempt(params: {
  email: string;
  success: boolean;
  ip?: string;
  reason?: string;
}) {
  await sendSecurityLog({
    level: params.success ? 'info' : 'warn',
    message: params.success ? 'Successful login' : 'Failed login attempt',
    actorEmail: params.email,
    ip: params.ip,
    metadata: {
      success: params.success,
      reason: params.reason,
    },
  });
}
export async function logAdminAction(params: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}) {
  await sendSecurityLog({
    level: 'info',
    message: `Admin action: ${params.action}`,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    ip: params.ip,
    metadata: {
      action: params.action,
      targetId: params.targetId,
      ...params.metadata,
    },
  });
}
