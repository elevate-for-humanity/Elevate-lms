/**
 * Admin app entry — validates environment variables at startup.
 * Required because `next build` runs from apps/admin; Next only loads instrumentation.ts
 * from the app project root.
 *
 * IMPORTANT: instrumentation must stay web-runtime safe. Do not import the video
 * rendering worker here. That worker depends on Node filesystem/OS/native Remotion
 * modules and must run from an explicit server-only worker entry, not the Next
 * instrumentation graph.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  try {
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
    }
  } catch (error) {
    console.warn('[admin] Environment validation error:', error);
  }
}

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
