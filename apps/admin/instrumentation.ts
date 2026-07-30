/**
 * Admin app entry — validates environment variables at startup.
 * Required because `next build` runs from apps/admin; Next only loads instrumentation.ts
 * from the app project root.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  try {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_ADMIN_URL',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missing = required.filter((name) => {
      const v = process.env[name];
      return !v || !v.trim();
    });

    if (missing.length > 0) {
      console.warn(`[admin] Missing env vars: ${missing.join(', ')}`);
    } else {
      console.info('[admin] Environment validated');
    }
  } catch (error) {
    console.warn('[admin] Environment validation error:', error);
    // Do not crash the server
  }
}

// Required by @sentry/nextjs 8+ to capture server-side request errors.
export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) => {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { captureRequestError } = await import('@sentry/nextjs');
    captureRequestError(err, request, context);
  }
};
