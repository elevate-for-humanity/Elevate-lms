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
  // When true, audit write failure is logged as critical.
  // Use for compliance-critical routes: enrollment approvals, hour certifications,
  // RAPIDS mutations, payment state changes.
  // Note: response is already sent before audit fires, so this cannot block the user.
  critical?: boolean;
  // When true, request body is not read or stored in the audit record.
  // Use for webhook routes where the body is already consumed by signature verification.
  skip_body?: boolean;
}

// Params are no longer extracted or stored in audit events.
// Full request details are captured in application logs (logger).
// Audit storage uses only compact metadata: endpoint, method, actor, result, status, duration.

async function resolveUserId(req: Request): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // Use caller-supplied actor identity for webhooks/cron.
    // For user requests, actor resolution happens AFTER the handler returns
    // so it never adds latency to the hot path.
    const staticActorId: string | null = options?.actor_id ?? null;
    const staticActorType: ActorType | null = options?.actor_type ?? null;

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
      logger.error(
        `[withApiAudit] Unhandled exception in handler for ${endpoint}`,
        e instanceof Error ? e : new Error(String(e)),
      );
      Sentry.captureException(e, { tags: { endpoint, subsystem: 'withApiAudit' } });
      // For webhook routes: never propagate — Stripe must receive a response, not a connection error.
      // For all other routes: re-throw so Next.js renders its error boundary.
      if (options?.actor_type === 'webhook') {
        response = NextResponse.json({ error: 'Internal error' }, { status: 500 });
      } else {
        throw e;
      }
    }

    // Build and fire audit payload asynchronously — never blocks the response.
    // Actor resolution and param extraction happen here, after the response is ready.
    const fireAudit = async () => {
      let actorId = staticActorId;
      let actorType: ActorType = staticActorType ?? 'anonymous';

      if (!staticActorType) {
        const userId = await resolveUserId(req);
        if (userId) {
          actorId = userId;
          actorType = 'user';
        }
      }

      // Params are intentionally omitted from the audit payload.
      // writeApiAuditEvent now stores only compact metadata (endpoint, method,
      // actor, result, status, duration). Full params are in application logs.
      // This eliminates oversized JSONB payloads that caused DB insert rejections.
      const auditPayload = {
        endpoint,
        method: req.method,
        actor_type: actorType,
        actor_id: actorId,
        request_id: rid,
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
          logger.error(
            `Audit write failed on critical route ${endpoint}`,
            auditErr instanceof Error ? auditErr : new Error(String(auditErr)),
          );
          Sentry.captureException(auditErr, {
            tags: { audit_critical: 'true', endpoint },
            extra: { request_id: rid, actor_id: actorId, result },
          });
          // Note: response is already sent — we can't override it here.
          // Log the failure; the fallback channels in onAuditFailure handle durability.
        }
      } else {
        writeApiAuditEvent(auditPayload).catch((auditErr) => {
          Sentry.captureException(auditErr, {
            tags: { audit_critical: 'false', endpoint },
            level: 'warning',
          });
        });
      }
    };

    // Fire-and-forget for all routes — response is already constructed above.
    void fireAudit();

    return response!;
  };
}
