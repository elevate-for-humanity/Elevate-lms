// lib/securityLogger.ts - Security event logging
import { logger } from '@/lib/logger';

export const securityLogger = {
  logUnauthorizedAccess(data: {
    userId?: string;
    resource?: string;
    details?: Record<string, unknown>;
  }) {
    const { userId, resource, details = {} } = data;
    logger.warn('Unauthorized access attempt', {
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  logRateLimitExceeded(ip: string, endpoint: string) {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      timestamp: new Date().toISOString(),
    });
  },

  logSuspiciousActivity(data: { type?: string; details?: Record<string, unknown> }) {
    const { type, details = {} } = data;
    logger.warn('Suspicious activity detected', {
      type,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  logAuthFailure(email: string, reason: string) {
    logger.warn('Authentication failure', {
      email,
      reason,
      timestamp: new Date().toISOString(),
    });
  },
};
