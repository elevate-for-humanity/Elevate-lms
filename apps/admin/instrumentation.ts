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
    // NEXT_PUBLIC_* deployment URLs are build-time constants in Next.js.
    // Do not assign to them at runtime: production bundling may inline the
    // left-hand expression into a string literal, producing invalid JavaScript.
    const requiredSecrets = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = requiredSecrets.filter((name) => {
      const value = process.env[name];
      return !value || !value.trim();
    });

    if (missing.length > 0) {
      console.warn(`[admin] Missing required env vars: ${missing.join(', ')}`);
    } else {
      console.info('[admin] Environment validated');

      // Rendering belongs to the Admin/Course Factory runtime. Starting the
      // guarded queue loop here makes video processing self-contained in the
      // production Admin service instead of depending on an external cron hop.
      const { startAdminVideoWorker } = await import('../../lib/video/background-worker');
      startAdminVideoWorker();
    }
  } catch (error) {
    console.warn('[admin] Environment validation error:', error);
    // Do not crash the server solely because observability validation failed.
  }
}

// Required by @sentry/nextjs 8+ to capture server-side request errors.
export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string; headers?: Headers },
  context: { routerKind: string; routePath: string; routeType: string },
) => {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { captureRequestError } = await import('@sentry/nextjs');
    const headers = request.headers
      ? Object.fromEntries(request.headers.entries())
      : {};

    captureRequestError(
      err,
      {
        path: request.path,
        method: request.method,
        headers,
      },
      context,
    );
  }
};
