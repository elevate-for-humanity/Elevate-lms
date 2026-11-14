// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

// Error patterns to ignore on client (reduces noise)
const IGNORE_ERROR_PATTERNS = [
  /isn't a valid image/,
  /Failed to fetch/,
  /NetworkError/,
  /aborted/,
  /chrome-extension/,
];

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    debug: false,
    sendDefaultPii: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    ignoreErrors: IGNORE_ERROR_PATTERNS,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: process.env.NODE_ENV || 'development',
  });
}
