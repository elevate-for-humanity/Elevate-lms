/**
 * withRuntime — structural secret hydration wrapper for API route handlers.
 *
 * Problem: secrets live in app_secrets (Supabase), not Netlify env vars.
 * Routes that read process.env directly without calling hydrateProcessEnv()
 * first will get empty strings on Netlify.
 *
 * This wrapper calls hydrateProcessEnv() before every handler invocation,
 * making hydration structural rather than convention-based (easy to forget).
 *
 * Usage:
 *   import { withRuntime } from '@/lib/api/withRuntime';
 *
 *   async function _POST(req: NextRequest) { ... }
 *   export const POST = withRuntime(_POST);
 *
 * Combines with withApiAudit:
 *   export const POST = withRuntime(withApiAudit('/api/path', _POST));
 */

import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse | Response>;

export function withRuntime(handler: RouteHandler): RouteHandler {
  return async function runtimeHandler(req: NextRequest, ctx?: any) {
    await hydrateProcessEnv();
    return handler(req, ctx);
  };
}
