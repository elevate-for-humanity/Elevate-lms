import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerConnectionGuards } = await import('./lib/server/register-connection-guards.cjs');
    registerConnectionGuards();

    const { initializeNativeModules } = await import('./lib/native-modules');
    try {
      const initResult = await initializeNativeModules();
      if (initResult.success) {
        console.info('[NativeModules] All modules loaded:', initResult.modules);
      } else {
        const failed = Object.entries(initResult.modules).filter(([, loaded]) => !loaded).map(([name]) => name);
        console.warn('[NativeModules] Some modules failed to initialize:', { failedModules: failed, errors: initResult.errors ?? {} });
      }
    } catch (err) {
      console.warn('[NativeModules] Initialization error:', err);
    }

    const { applyNormalizedSupabaseUrlToEnv } = await import('./lib/supabase/normalize-url');
    applyNormalizedSupabaseUrlToEnv();
    const { hydrateProcessEnv } = await import('./lib/secrets');
    try {
      await hydrateProcessEnv();
    } catch (err) {
      console.warn('[instrumentation] hydrateProcessEnv failed (server will still start):', err instanceof Error ? err.message : err);
    }

    // The Admin service owns the durable Course Builder worker. A production
    // boot must wake eligible work so jobs do not depend on a later scheduler
    // tick. The database claim is atomic, and the worker wakes the next job
    // after each completion, so multiple Admin replicas remain safe.
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.SERVICE_ROLE === 'admin' &&
      process.env.CRON_SECRET
    ) {
      const timer = setTimeout(() => {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';
        void fetch(new URL('/api/cron/process-course-builder-jobs', adminUrl), {
          headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
          cache: 'no-store',
        }).catch((err) => {
          console.warn(
            '[instrumentation] Course Builder startup wake failed:',
            err instanceof Error ? err.message : String(err),
          );
        });
      }, 5_000);
      timer.unref?.();
    }

    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config');
    }

    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      try {
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
        const { Resource } = await import('@opentelemetry/resources');
        const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');
        const traceExporter = new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
            ? Object.fromEntries(process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map((header) => header.split('=')))
            : {},
        });
        type NodeSdkConfig = NonNullable<ConstructorParameters<typeof NodeSDK>[0]>;
        const sdk = new NodeSDK({
          resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'elevate-lms',
            [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
          }),
          // OpenTelemetry 0.220 can resolve duplicate internal exporter type copies in
          // a pnpm workspace. Runtime interfaces are compatible; normalize only the
          // compile-time boundary expected by NodeSDK.
          traceExporter: traceExporter as unknown as NodeSdkConfig['traceExporter'],
          instrumentations: [],
        });
        sdk.start();
        process.on('SIGTERM', () => { void sdk.shutdown(); });
      } catch (err) {
        console.warn('[instrumentation] OpenTelemetry init failed:', err);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge' && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    await import('./sentry.edge.config');
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { captureRequestError } = await import('@sentry/nextjs');
    const sentryRequest = {
      ...request,
      headers: Object.fromEntries(request.headers.entries()),
    };
    captureRequestError(err, sentryRequest, context);
  }
};
