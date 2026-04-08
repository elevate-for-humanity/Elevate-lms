/**
 * withRuntime — guaranteed execution environment for API route handlers.
 *
 * Solves three problems:
 *   1. Discipline-based hydration: every route must remember hydrateProcessEnv().
 *      One missed call → silent secret failure on Netlify cold starts.
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
   *   'x-header'  — checks x-cron-secret header (Netlify scheduled functions)
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

/**
 * Wraps an API handler with guaranteed hydration, secret validation,
 * rate limiting, and auth — in that order.
 */
export function withRuntime(options: RuntimeOptions, handler: Handler) {
  return async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    // 1. Hydrate process.env from Supabase app_secrets (Netlify cold-start safe)
    await hydrateProcessEnv();

    // 2. Validate required secrets — fail hard, not silent
    const requiredSecrets = [
      ...(options.secrets ?? []),
      ...(options.cron ? ['CRON_SECRET'] : []),
    ];


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
      logger.error('[withRuntime] Missing required secrets', {
        route: req.nextUrl.pathname,
        missing,
      });
      return NextResponse.json(
        { error: 'Service configuration error. Please try again later.' },
        { status: 503 }
      );
    }

    // 3. Cron secret validation
    if (options.cron) {
      const cronSecret = env['CRON_SECRET'];
      const provided = options.cron === 'bearer'
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
      ctx.user = { id: guard.user.id, email: guard.user.email ?? '' };
    } else if (options.auth === 'user') {
      const guard = await apiAuthGuard(req);
      if (guard.error) return guard.error;
      ctx.user = { id: guard.user.id, email: guard.user.email ?? '' };
    }

    // 6. Run handler — catch unhandled throws so they never surface as 500 HTML
    try {
      return await handler(req, ctx);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('[withRuntime] Unhandled handler error', {
        route: req.nextUrl.pathname,
        method: req.method,
        error: message,
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
