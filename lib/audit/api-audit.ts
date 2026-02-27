// API-layer audit logging for high-risk routes.
//
// DB triggers capture table mutations but cannot attribute them to
// a specific API endpoint, actor session, or request context.
// This wrapper closes that gap for enrollment, payment, webhook,
// admin, and data-deletion routes.
//
// Usage:
//   import { auditApiRoute } from '@/lib/audit/api-audit';
//
//   export async function POST(req: Request) {
//     return auditApiRoute(req, '/api/enroll', async (ctx) => {
//       // ... route logic ...
//       return NextResponse.json({ id: enrollment.id });
//     });
//   }
//
// Or for manual logging in complex routes:
//   import { writeApiAuditEvent } from '@/lib/audit/api-audit';
//
//   await writeApiAuditEvent({
//     endpoint: '/api/webhooks/stripe',
//     method: 'POST',
//     actor_type: 'webhook',
//     actor_id: 'stripe',
//     params: { event_type: event.type },
//     result: 'success',
//   });

import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

// Unique request ID for correlation across audit entries and logs.
let requestCounter = 0;
function generateRequestId(): string {
  requestCounter = (requestCounter + 1) % 1_000_000;
  return `${Date.now()}-${requestCounter.toString(36)}`;
}

export type ActorType = 'user' | 'admin' | 'webhook' | 'cron' | 'system' | 'anonymous';

export interface ApiAuditEvent {
  endpoint: string;
  method: string;
  actor_type: ActorType;
  actor_id?: string | null;
  request_id?: string;
  params?: Record<string, unknown>;
  result: 'success' | 'failure' | 'denied' | 'error';
  status_code?: number;
  error_summary?: string;
  duration_ms?: number;
}

// Keys to strip from params before logging — prevents PII leakage.
const REDACT_KEYS = new Set([
  'password', 'ssn', 'ssn_hash', 'ssn_last4', 'date_of_birth', 'dob',
  'bank_account', 'routing_number', 'account_number', 'tax_id',
  'driver_license', 'state_id', 'government_id', 'itin', 'ein',
  'credit_card', 'card_number', 'cvv', 'cvc', 'expiry',
  'secret', 'token', 'api_key', 'authorization',
]);

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeParams(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Audit write timeout. If the DB insert takes longer than this,
// we abandon the await and let the fallback channels handle it.
// 800ms is generous for a single INSERT but short enough to prevent
// cascading latency into the API response.
const AUDIT_WRITE_TIMEOUT_MS = 800;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Audit write timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Write an API-layer audit event. Never throws.
 * Enforces a timeout to prevent audit DB latency from stalling API responses.
 */
export async function writeApiAuditEvent(event: ApiAuditEvent): Promise<void> {
  try {
    const requestId = event.request_id || generateRequestId();

    await withTimeout(
      logAuditEvent({
        userId: event.actor_id,
        action: `api:${event.method.toLowerCase()}:${event.endpoint}`,
        resourceType: 'api_request',
        resourceId: requestId,
        metadata: {
          endpoint: event.endpoint,
          method: event.method,
          actor_type: event.actor_type,
          request_id: requestId,
          params: event.params ? sanitizeParams(event.params) : undefined,
          result: event.result,
          status_code: event.status_code,
          error_summary: event.error_summary,
          duration_ms: event.duration_ms,
        },
      }),
      AUDIT_WRITE_TIMEOUT_MS,
    );
  } catch (e) {
    // Audit must never break the route.
    // logAuditEvent's internal onAuditFailure already writes to
    // stderr, logger, audit_failures table, and /tmp fallback.
    // This catch handles the timeout case specifically.
    logger.error('[api-audit] writeApiAuditEvent failed', e as Error, {
      endpoint: event.endpoint,
      result: event.result,
    });
  }
}

/**
 * Resolve the current user from the Supabase session cookie.
 * Returns null if unauthenticated or if cookie parsing fails.
 */
async function resolveActor(): Promise<{ id: string; type: ActorType } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { id: user.id, type: 'user' };
    }
  } catch {
    // No session — anonymous or webhook
  }
  return null;
}

/**
 * Extract safe, loggable parameters from a request.
 * Reads JSON body for POST/PUT/PATCH, query params for GET/DELETE.
 * Clones the request so the original body stream is not consumed.
 */
async function extractParams(req: Request): Promise<Record<string, unknown>> {
  const params: Record<string, unknown> = {};

  // Query params
  try {
    const url = new URL(req.url);
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch { /* ignore */ }

  // Body for mutation methods
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const cloned = req.clone();
      const contentType = cloned.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await cloned.json();
        if (body && typeof body === 'object') {
          // Only log top-level keys + selected safe values to limit payload size
          for (const [key, value] of Object.entries(body)) {
            if (typeof value === 'string' && value.length > 200) {
              params[key] = `[string:${value.length}chars]`;
            } else if (Array.isArray(value)) {
              params[key] = `[array:${value.length}items]`;
            } else {
              params[key] = value;
            }
          }
        }
      }
    } catch { /* non-JSON body or stream error — skip */ }
  }

  return params;
}

export interface AuditRouteContext {
  requestId: string;
  actorId: string | null;
  actorType: ActorType;
}

/**
 * Wrap an API route handler with automatic audit logging.
 *
 * Logs: endpoint, method, actor, params, result, duration, IP/UA.
 * Never interferes with the route's response — audit failures are swallowed.
 *
 * @param req - The incoming Request
 * @param endpoint - Route path (e.g., '/api/enroll')
 * @param handler - The actual route logic, receives audit context
 * @param options - Override actor detection for webhooks/cron
 */
export async function auditApiRoute(
  req: Request,
  endpoint: string,
  handler: (ctx: AuditRouteContext) => Promise<Response>,
  options?: {
    actor_type?: ActorType;
    actor_id?: string;
    skip_body?: boolean;
  },
): Promise<Response> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const { ipAddress, userAgent } = getRequestMetadata(req);

  // Resolve actor
  let actorId: string | null = options?.actor_id ?? null;
  let actorType: ActorType = options?.actor_type ?? 'anonymous';

  if (!options?.actor_type) {
    const actor = await resolveActor();
    if (actor) {
      actorId = actor.id;
      actorType = actor.type;
    }
  }

  // Extract params (best-effort, never blocks)
  let params: Record<string, unknown> = {};
  if (!options?.skip_body) {
    try {
      params = await extractParams(req);
    } catch { /* skip */ }
  }

  const ctx: AuditRouteContext = { requestId, actorId, actorType };

  let response: Response;
  let result: ApiAuditEvent['result'] = 'success';
  let statusCode = 200;
  let errorSummary: string | undefined;

  try {
    response = await handler(ctx);
    statusCode = response.status;

    if (statusCode >= 400 && statusCode < 500) {
      result = statusCode === 401 || statusCode === 403 ? 'denied' : 'failure';
    } else if (statusCode >= 500) {
      result = 'error';
    }
  } catch (e) {
    result = 'error';
    statusCode = 500;
    errorSummary = e instanceof Error ? e.message.slice(0, 200) : 'Unknown error';
    throw e; // Re-throw so Next.js handles the error response
  } finally {
    const duration = Date.now() - startTime;

    // Fire-and-forget audit write
    writeApiAuditEvent({
      endpoint,
      method: req.method,
      actor_type: actorType,
      actor_id: actorId,
      request_id: requestId,
      params,
      result,
      status_code: statusCode,
      error_summary: errorSummary,
      duration_ms: duration,
    }).catch(() => {});
  }

  return response!;
}
