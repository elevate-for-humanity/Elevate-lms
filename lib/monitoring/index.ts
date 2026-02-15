import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: Record<string, any>) {
  logger.error('Error:', error);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level);
  }
}

export function setUserContext(userId: string, email?: string) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser({ id: userId, email });
  }
}

export function clearUserContext() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser(null);
  }
}

// GA4 event tracking is handled exclusively by:
//   - components/analytics/google-analytics.tsx (loader + config)
//   - lib/analytics/events.ts (event firing via safeGtag)
// Do not add gtag calls here. See docs/PRODUCTION-READINESS-REPORT.md §10.
