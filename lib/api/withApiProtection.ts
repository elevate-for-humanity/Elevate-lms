/**
 * withApiProtection — Enforced API route wrapper
 *
 * Every route MUST go through this wrapper. It is the single enforcement
 * point for auth, role validation, rate limiting, and error handling.
 *
 * Usage:
 *
 *   export const POST = withApiProtection(handler, { auth: 'user' });
 *   export const GET  = withApiProtection(handler, { auth: 'admin' });
 *   export const GET  = withApiProtection(handler, { auth: 'public' });
 *   export const POST = withApiProtection(handler, { auth: 'system' }); // cron/webhook
 *
 * Auth levels:
 *   'public'  — no auth required. Must be explicitly declared.
 *   'user'    — any authenticated user
 *   'admin'   — admin | super_admin | staff | org_admin
 *   'staff'   — staff | admin | super_admin
 *   'instructor' — instructor | admin | super_admin | staff
 *   'system'  — cron/webhook — validated via CRON_SECRET or JOB_PROCESSOR_TOKEN header
 *
 * Rate limit tiers map to lib/api/withRateLimit.ts tiers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export type AuthLevel = 'public' | 'user' | 'admin' | 'staff' | 'instructor' | 'system';
export type RateLimitTier = 'strict' | 'auth' | 'payment' | 'contact' | 'api' | 'public';

export interface ApiProtectionOptions {
  /** Auth level required. No default — must be explicit. */
  auth: AuthLevel;
  /** Rate limit tier. Defaults based on auth level if not set. */
  rateLimit?: RateLimitTier;
  /** Additional role check beyond the auth level. */
  roles?: string[];
}

export type ApiHandler = (
  request: NextRequest,
  context: { params: Record<string, string>; userId?: string; userRole?: string },
) => Promise<NextResponse> | NextResponse;

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff', 'org_admin']);
const STAFF_ROLES = new Set(['staff', 'admin', 'super_admin']);
const INSTRUCTOR_ROLES = new Set(['instructor', 'admin', 'super_admin', 'staff']);

function defaultRateLimit(auth: AuthLevel): RateLimitTier {
  if (auth === 'public') return 'public';
  if (auth === 'system') return 'strict';
  return 'api';
}

async function resolveUser(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return { userId: user.id, role: profile?.role ?? 'student' };
  } catch {
    return null;
  }
}

function validateSystemToken(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const jobToken = process.env.JOB_PROCESSOR_TOKEN;

  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');

  if (cronSecret && (authHeader === `Bearer ${cronSecret}` || cronHeader === cronSecret)) return true;
  if (jobToken && authHeader === `Bearer ${jobToken}`) return true;

  // ECS scheduled task header (EventBridge → ECS cron)
  if (request.headers.get('x-ecs-scheduled-task-secret') === process.env.CRON_SECRET) return true;

  return false;
}

export function withApiProtection(handler: ApiHandler, options: ApiProtectionOptions) {
  return async function protectedHandler(
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> | Record<string, string> },
  ): Promise<NextResponse> {
    const { auth, rateLimit, roles } = options;
    const tier = rateLimit ?? defaultRateLimit(auth);

    // 1. Rate limiting — always first
    const rateLimited = await applyRateLimit(request, tier);
    if (rateLimited) return rateLimited as NextResponse;

    // 2. Resolve params
    const params = context?.params
      ? (context.params instanceof Promise ? await context.params : context.params)
      : {};

    // 3. System routes — validate secret token, no user session needed
    if (auth === 'system') {
      if (!validateSystemToken(request)) {
        logger.warn('[withApiProtection] System route called without valid token', {
          path: request.nextUrl.pathname,
        });
        return safeError('Unauthorized', 401) as NextResponse;
      }
      try {
        return await handler(request, { params });
      } catch (err) {
        return safeInternalError(err, 'System handler error') as NextResponse;
      }
    }

    // 4. Public routes — no auth, just execute
    if (auth === 'public') {
      try {
        return await handler(request, { params });
      } catch (err) {
        return safeInternalError(err, 'Handler error') as NextResponse;
      }
    }

    // 5. All other levels require a valid user session
    const user = await resolveUser(request);
    if (!user) {
      return safeError('Authentication required', 401) as NextResponse;
    }

    // 6. Role enforcement
    const { userId, role } = user;
    let authorized = false;

    if (auth === 'user') {
      authorized = true; // any authenticated user
    } else if (auth === 'admin') {
      authorized = ADMIN_ROLES.has(role);
    } else if (auth === 'staff') {
      authorized = STAFF_ROLES.has(role);
    } else if (auth === 'instructor') {
      authorized = INSTRUCTOR_ROLES.has(role);
    }

    // Additional role check if specified
    if (authorized && roles && roles.length > 0) {
      authorized = roles.includes(role);
    }

    if (!authorized) {
      logger.warn('[withApiProtection] Insufficient role', {
        path: request.nextUrl.pathname,
        userId,
        role,
        required: auth,
      });
      return safeError('Forbidden', 403) as NextResponse;
    }

    // 7. Execute handler
    try {
      return await handler(request, { params, userId, userRole: role });
    } catch (err) {
      return safeInternalError(err, 'Handler error') as NextResponse;
    }
  };
}
