export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerConnectionGuards } = await import('./lib/server/register-connection-guards.cjs');
    registerConnectionGuards();

    // Load runtime secrets from Supabase into process.env.
    // Platform env vars are injected by Northflank at container start.
    const { applyNormalizedSupabaseUrlToEnv } = await import('./lib/supabase/normalize-url');
    applyNormalizedSupabaseUrlToEnv();
    const { hydrateProcessEnv } = await import('./lib/secrets');
    try {
      await hydrateProcessEnv();
    } catch (err) {
      // Must not block HTTP listen — /api/ping and Northflank probes need the process up.
      console.warn(
        '[instrumentation] hydrateProcessEnv failed (server will still start):',
        err instanceof Error ? err.message : err,
      );
    }

    // Only load Sentry when a DSN is configured — avoids crashing dev servers
    // that don't have @sentry/node-core resolved in the pnpm isolated store.
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config');
    }

    // OpenTelemetry — only initializes when OTEL_EXPORTER_OTLP_ENDPOINT is set.
    // Emits traces to any OTLP-compatible backend (Grafana, Honeycomb, Jaeger, etc.).
    // Set OTEL_EXPORTER_OTLP_ENDPOINT in env to enable. Safe no-op when absent.
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      try {
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
        const { Resource } = await import('@opentelemetry/resources');
        const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');

        const sdk = new NodeSDK({
          resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'elevate-lms',
            [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
          }),
          traceExporter: new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
            headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
              ? Object.fromEntries(
                  process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(h => h.split('='))
                )
              : {},
          }),
          // No auto-instrumentations package installed — sdk-node provides
          // built-in HTTP/fetch tracing. Add @opentelemetry/auto-instrumentations-node
          // to package.json to enable full instrumentation (pg, redis, etc.)
          instrumentations: [],
        });

        sdk.start();
        process.on('SIGTERM', () => sdk.shutdown());
      } catch (err) {
        // OTel init failure must never crash the server
        console.warn('[instrumentation] OpenTelemetry init failed:', err);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.edge.config');
    }
  }
}

// Required by @sentry/nextjs 8+ to capture server-side request errors.
// Without this hook the build emits a deprecation warning.
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
