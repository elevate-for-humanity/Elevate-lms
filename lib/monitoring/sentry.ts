import { logger } from '@/lib/logger';
// Sentry Error Monitoring Integration

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

export const initSentry = () => {
  if (typeof window !== 'undefined' && SENTRY_DSN) {
    // Sentry will be initialized if DSN is provided
  }
};

export const captureException = (error: Error, context?: any) => {
  if (typeof window !== 'undefined') {
    logger.error('Error captured:', error, context);
    // Send to Sentry if configured
    if (SENTRY_DSN && window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    }
  }
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  if (typeof window !== 'undefined') {
    if (SENTRY_DSN && window.Sentry) {
      window.Sentry.captureMessage(message, level);
    }
  }
};

declare global {
  interface Window {
    Sentry?: any;
  }
}
