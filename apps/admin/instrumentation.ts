/**
 * Admin app entry — validates environment variables and starts the canonical
 * server-side agentic executor when this app is running as the Admin service.
 *
 * IMPORTANT: instrumentation must stay web-runtime safe. Do not import video
 * rendering workers or native media dependencies directly here. The agentic
 * executor owns domain dispatch behind the nodejs/Admin runtime boundary.
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

  const serviceRole = process.env.ELEVATE_SERVICE || process.env.SERVICE_ROLE;
  if (serviceRole === 'admin') {
    try {
      // Keep Node-only executor imports in the dedicated Node instrumentation
      // module so the Edge instrumentation bundle never traces Node built-ins.
      const { startAdminAgenticExecutor } = await import('./instrumentation-node');
      startAdminAgenticExecutor();
    } catch (error) {
      delete process.env.ELEVATE_AGENTIC_EXECUTOR_STARTED;
      console.error(
        '[admin] Canonical agentic executor failed to start:',
        error instanceof Error ? error.message : error,
      );
    }
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
