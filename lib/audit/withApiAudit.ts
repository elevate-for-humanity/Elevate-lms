// Higher-order wrapper for API route handlers.
// Adds audit logging with zero changes to route logic.
//
// Usage (one-line change per route):
//
//   import { withApiAudit } from '@/lib/audit/withApiAudit';
//
//   async function handler(req: Request) { ... }
//   export const POST = withApiAudit('/api/enroll', handler);
//
// For webhooks (no user session):
//   export const POST = withApiAudit('/api/webhooks/stripe', handler, { actor_type: 'webhook', actor_id: 'stripe' });
//
// For cron jobs:
//   export const POST = withApiAudit('/api/cron/enrollment-automation', handler, { actor_type: 'cron' });

import { writeApiAuditEvent, type ActorType } from '@/lib/audit/api-audit';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

interface WithApiAuditOptions {
  actor_type?: ActorType;
  actor_id?: string;
  skip_body?: boolean;
  // When true, audit write failure returns 500 instead of silently continuing.
  // Use for compliance-critical routes: enrollment approvals, hour certifications,
  // RAPIDS mutations, payment state changes.
  critical?: boolean;
}

// Keys to strip from params before logging
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
    } else if (typeof value === 'string' && value.length > 200) {
      clean[key] = `[string:${value.length}chars]`;
    } else if (Array.isArray(value)) {
      clean[key] = `[array:${value.length}items]`;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

async function extractSafeParams(req: Request, skipBody?: boolean): Promise<Record<string, unknown>> {
  const params: Record<string, unknown> = {};

  try {
    const url = new URL(req.url);
    url.searchParams.forEach((value, key) => { params[key] = value; });
  } catch { /* ignore */ }

  if (!skipBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      const cloned = req.clone();
      const ct = cloned.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await cloned.json();
        if (body && typeof body === 'object' && !Array.isArray(body)) {
          Object.assign(params, body);
        }
      }
    } catch { /* non-JSON or stream error */ }
  }

  return sanitizeParams(params);
}

async function resolveUserId(req: Request): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

let _counter = 0;
function requestId(): string {
  _counter = (_counter + 1) % 1_000_000;
  return `${Date.now()}-${_counter.toString(36)}`;
}

/**
 * Wrap a Next.js App Router handler with API-layer audit logging.
 * The handler signature is unchanged — this is transparent.
 */
export function withApiAudit(
  endpoint: string,
  handler: (req: Request, ...args: any[]) => Promise<Response>,
  options?: WithApiAuditOptions,
) {
  return async function auditedHandler(req: Request, ...args: any[]): Promise<Response> {
    const start = Date.now();
    const rid = requestId();

    // Resolve actor
    let actorId: string | null = options?.actor_id ?? null;
    let actorType: ActorType = options?.actor_type ?? 'anonymous';

    if (!options?.actor_type) {
      const userId = await resolveUserId(req);
      if (userId) {
        actorId = userId;
        actorType = 'user';
      }
    }

    // Extract params (best-effort)
    let params: Record<string, unknown> = {};
    try {
      params = await extractSafeParams(req, options?.skip_body);
    } catch { /* skip */ }

    let response: Response;
    let result: 'success' | 'failure' | 'denied' | 'error' = 'success';
    let statusCode = 200;
    let errorSummary: string | undefined;

    try {
      response = await handler(req, ...args);
      statusCode = response.status;

      if (statusCode === 401 || statusCode === 403) result = 'denied';
      else if (statusCode >= 400 && statusCode < 500) result = 'failure';
      else if (statusCode >= 500) result = 'error';
    } catch (e) {
      result = 'error';
      statusCode = 500;
      errorSummary = e instanceof Error ? e.message.slice(0, 200) : 'Unknown error';
      logger.error(`[withApiAudit] Unhandled exception in handler for ${endpoint}`, e instanceof Error ? e : new Error(String(e)));
      Sentry.captureException(e, { tags: { endpoint, subsystem: 'withApiAudit' } });
      // For webhook routes: never propagate — Stripe must receive a response, not a connection error.
      // For all other routes: re-throw so Next.js renders its error boundary.
      if (options?.actor_type === 'webhook') {
        response = NextResponse.json({ error: 'Internal error' }, { status: 500 });
      } else {
        throw e;
      }
    } finally {
      const auditPayload = {
        endpoint,
        method: req.method,
        actor_type: actorType,
        actor_id: actorId,
        request_id: rid,
        params,
        result,
        status_code: statusCode,
        error_summary: errorSummary,
        duration_ms: Date.now() - start,
      };

      if (options?.critical) {
        // Compliance-critical: audit failure = request failure.
        // The action happened but we can't prove it — that's worse than a 500.
        try {
          await writeApiAuditEvent(auditPayload);
        } catch (auditErr) {
          const msg = `Audit write failed on critical route ${endpoint}`;
          logger.error(msg, auditErr instanceof Error ? auditErr : new Error(String(auditErr)));
          Sentry.captureException(auditErr, {
            tags: { audit_critical: 'true', endpoint },
            extra: { request_id: rid, actor_id: actorId, result },
          });
          // Override the response — the action may have succeeded but
          // we cannot prove it, so we fail the request.
          response = NextResponse.json(
            { error: 'Audit system unavailable. Action not recorded. Contact support.' },
            { status: 503 },
          );
        }
      } else {
        // Non-critical: fire-and-forget, but still report failures to Sentry
        writeApiAuditEvent(auditPayload).catch((auditErr) => {
          Sentry.captureException(auditErr, {
            tags: { audit_critical: 'false', endpoint },
            level: 'warning',
          });
        });
      }
    }

    return response!;
  };
}
