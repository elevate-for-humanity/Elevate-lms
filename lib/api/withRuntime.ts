/**
 * withRuntime — guaranteed execution environment for API route handlers.
 *
 * Solves three problems:
 *   1. Discipline-based hydration: every route must remember hydrateProcessEnv().
 *      One missed call → silent secret failure on ECS cold starts.
 *   2. Silent degradation: routes check `if (!secret) return safeError(...)` but
 *      never tell you *which* secret is missing or *when* it went missing.
 *   3. Auth boilerplate: every protected route repeats the same guard + check pattern.
 *
 * Usage — public route with rate limiting:
 *   export const GET = withRuntime({ secrets: ['STRIPE_SECRET_KEY'], rateLimit: 'public' },
 *     async (req, ctx) => { ... ctx.env.STRIPE_SECRET_KEY ... }
 *   );
 *
 * Usage — admin-only route:
 *   export const POST = withRuntime({ secrets: ['STRIPE_SECRET_KEY'], auth: 'admin' },
 *     async (req, ctx) => { ... ctx.user.id ... }
 *   );
 *
 * Usage — cron route (secret header):
 *   export const POST = withRuntime({ secrets: ['CRON_SECRET'], cron: true },
 *     async (req, ctx) => { ... }
 *   );
 *
 * If a required secret is missing after hydration → 503, logged.
 * If auth fails → 401/403 from the guard.
 * If cron secret is wrong → 401.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard, apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

/** Fire-and-forget: write a cron_job_runs row. Never throws. */
async function recordCronRun(
  jobName: string,
  status: 'success' | 'failed',
  startedAt: Date,
  result?: unknown,
  error?: string,
): Promise<void> {
  try {
    const db = await requireAdminClient();
    const finishedAt = new Date();
    await db.from('cron_job_runs').insert({
      job_name: jobName,
      status,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      result: result ? (result as object) : null,
      error: error ?? null,
    });
  } catch (err) {
    // Non-fatal — observability must never break the cron job itself
    logger.warn('[withRuntime] cron_job_runs write failed', { jobName, error: String(err) });
  }
}

type RateLimitTier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public';
type AuthMode = 'user' | 'admin';

export interface RuntimeOptions {
  /**
   * Environment variable names that must be non-empty after hydration.
   * Handler will not run if any are missing — returns 503.
   */
  secrets?: string[];
  /** Rate limit tier. Omit to skip rate limiting. */
  rateLimit?: RateLimitTier;
  /**
   * Auth requirement.
   *   'user'  — any authenticated user
   *   'admin' — admin, super_admin, or staff
   * Omit for public routes.
   */
  auth?: AuthMode;
  /**
   * Cron route — validates cron secret header against CRON_SECRET env var.
   * Automatically adds 'CRON_SECRET' to required secrets.
   *   'x-header'  — checks x-cron-secret header (AWS EventBridge cron)
   *   'bearer'    — checks Authorization: Bearer <secret> header (Vercel/manual cron)
   */
  cron?: 'x-header' | 'bearer';
}

export interface RuntimeContext {
  /** Validated env vars — guaranteed non-empty strings. */
  env: Record<string, string>;
  /** Authenticated user — only present when auth option is set. */
  user?: { id: string; email: string };
}

type Handler = (req: NextRequest, ctx: RuntimeContext) => Promise<NextResponse>;
// Also accept plain Next.js handlers (no RuntimeContext) so routes that call
// withRuntime(withApiAudit(...)) without an options object compile and run.
type AnyHandler = (req: NextRequest, ...args: any[]) => Promise<Response>;

/**
 * Wraps an API handler with guaranteed hydration, secret validation,
 * rate limiting, and auth — in that order.
 *
 * Overloads:
 *   withRuntime(options, handler)  — full options + RuntimeContext
 *   withRuntime(handler)           — passthrough, no options (legacy call sites)
 */
export function withRuntime(optionsOrHandler: RuntimeOptions | AnyHandler, handler?: Handler) {
  // Passthrough overload: withRuntime(handler) — no options
  if (typeof optionsOrHandler === 'function') {
    const fn = optionsOrHandler;
    return async function wrappedHandler(req: NextRequest, ...args: any[]): Promise<Response> {
      await hydrateProcessEnv();
      return fn(req, ...args);
    };
  }
  const options = optionsOrHandler;
  return async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    // 1. Hydrate process.env from Supabase app_secrets (ECS cold-start safe)
    await hydrateProcessEnv();

    // 2. Validate required secrets — fail hard, not silent
    const requiredSecrets = [...(options.secrets ?? []), ...(options.cron ? ['CRON_SECRET'] : [])];

    const env: Record<string, string> = {};
    const missing: string[] = [];

    for (const key of requiredSecrets) {
      const val = process.env[key];
      if (!val) {
        missing.push(key);
      } else {
        env[key] = val;
      }
    }

    if (missing.length > 0) {
      logger.error('[withRuntime] Missing required secrets', undefined, {
        route: req.nextUrl.pathname,
        missing,
      });
      return NextResponse.json(
        { error: 'Service configuration error. Please try again later.' },
        { status: 503 },
      );
    }

    // 3. Cron secret validation
    if (options.cron) {
      const cronSecret = env['CRON_SECRET'];
      const provided =
        options.cron === 'bearer'
          ? req.headers.get('authorization')?.replace(/^Bearer\s+/, '')
          : req.headers.get('x-cron-secret');
      if (provided !== cronSecret) {
        logger.warn('[withRuntime] Cron secret mismatch', {
          route: req.nextUrl.pathname,
          mode: options.cron,
          ip: req.headers.get('x-forwarded-for') ?? 'unknown',
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 4. Rate limiting
    if (options.rateLimit) {
      const blocked = await applyRateLimit(req, options.rateLimit);
      if (blocked) return blocked;
    }

    // 5. Auth
    const ctx: RuntimeContext = { env };

    if (options.auth === 'admin') {
      const guard = await apiRequireAdmin(req);
      if (guard.error) return guard.error;
      ctx.user = { id: guard.id, email: guard.email ?? '' };
    } else if (options.auth === 'user') {
      const guard = await apiAuthGuard(req);
      if (guard.error) return guard.error;
      ctx.user = { id: guard.id, email: guard.email ?? '' };
    }

    // 6. Run handler — catch unhandled throws so they never surface as 500 HTML
    const cronStartedAt = options.cron ? new Date() : null;
    const jobName = options.cron
      ? req.nextUrl.pathname.replace(/^\/api\/cron\//, '').replace(/\/$/, '')
      : null;
    const traceId = req.headers.get('x-trace-id') ?? 'no-trace';

    try {
      const response = await handler!(req, ctx);
      if (cronStartedAt && jobName) {
        // Parse result body for observability — non-blocking
        response.clone().json().then(
          (body) => recordCronRun(jobName, 'success', cronStartedAt, body),
          () => recordCronRun(jobName, 'success', cronStartedAt),
        );
      }
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('[withRuntime] Unhandled handler error', err instanceof Error ? err : new Error(message), {
        route: req.nextUrl.pathname,
        method: req.method,
        trace_id: traceId,
      });
      if (cronStartedAt && jobName) {
        recordCronRun(jobName, 'failed', cronStartedAt, undefined, message);
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
