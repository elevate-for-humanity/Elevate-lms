// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

// Error patterns to ignore (reduces noise in Sentry)
const IGNORE_ERROR_PATTERNS = [
  // Client disconnects during tracking
  /aborted/,
  
  // Node.js internal HTTP handling errors
  /transformAlgorithm is not a function/,
  
  // Next.js image optimization for missing Supabase images (known issue)
  /isn't a valid image/,
  
  // Webhook signature failures (external spam/attacks)
  /Webhook signature verification failed/,
  
  // Redis unavailable (already handled gracefully with fail-open)
  /Redis unavailable/,
  
  // External API failures (handled gracefully)
  /fetch failed/,
  
  // Rate limit errors (expected behavior)
  /rate.?limit/i,
];

if (dsn) {
  Sentry.init({
    dsn,

    // Performance monitoring - sample 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Keep PII off by default for privacy compliance
    sendDefaultPii: false,

    environment: process.env.NODE_ENV || 'development',

    // Enable automatic error capturing
    autoSessionTracking: true,

    // Capture unhandled promise rejections
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],

    // Ignore noisy error patterns
    ignoreErrors: IGNORE_ERROR_PATTERNS,

    // Filter out non-critical errors before sending
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }
      
      // Additional server-side filtering for complex patterns
      const message = event.message || '';
      const exceptionValue = event.exception?.values?.[0]?.value || '';
      
      // Drop track-usage aborted errors
      if (message.includes('Tracking error') && exceptionValue.includes('aborted')) {
        return null;
      }
      
      // Drop webhook spam (signature verification failures from external sources)
      if (message.includes('Webhook signature verification failed')) {
        return null;
      }
      
      return event;
    },
  });
}
