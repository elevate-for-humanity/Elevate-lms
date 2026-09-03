/**
 * Distributed trace context helpers.
 *
 * Every request gets an x-trace-id header injected by the middleware (proxy.ts).
 * Use getTraceId() in server components and API routes to attach the trace_id
 * to all structured log calls, enabling end-to-end request correlation.
 *
 * Usage in API routes:
 *   import { getTraceId } from '@/lib/observability/trace';
 *   const traceId = await getTraceId();
 *   logger.info('Processing payment', { trace_id: traceId, ... });
 *
 * Usage in server components:
 *   const traceId = await getTraceId();
 */
import { headers } from 'next/headers';

/**
 * Returns the trace_id for the current request.
 * Falls back to a static string if called outside a request context
 * (e.g. during static generation).
 */
export async function getTraceId(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-trace-id') ?? 'no-trace';
  } catch {
    return 'no-trace';
  }
}

/**
 * Returns a log context object with trace_id pre-populated.
 * Merge into any logger call for automatic correlation.
 *
 * Example:
 *   logger.info('Enrollment approved', { ...traceCtx, enrollmentId });
 */
export async function traceCtx(): Promise<{ trace_id: string }> {
  return { trace_id: await getTraceId() };
}
