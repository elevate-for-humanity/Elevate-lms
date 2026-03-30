/**
 * handleRoute — canonical try/catch wrapper for API route handlers.
 *
 * Catches two kinds of throws:
 *   1. NextResponse thrown by guards (unauthorized, forbidden, etc.)
 *      — returned directly, preserving the status code.
 *   2. Unexpected errors — returned as 500 INTERNAL_SERVER_ERROR.
 *
 * Usage:
 *   import { handleRoute } from '@/lib/api/route';
 *
 *   export async function POST(req: Request) {
 *     return handleRoute(async () => {
 *       await apiRequireAdmin(req);
 *       // ... route logic
 *       return ok({ success: true });
 *     });
 *   }
 */

import { serverError } from '@/lib/api/responses';
import { logger } from '@/lib/logger';

export async function handleRoute<T>(fn: () => Promise<T>): Promise<T | Response> {
  try {
    return await fn();
  } catch (error: unknown) {
    // Guards throw NextResponse directly — pass through unchanged.
    if (error instanceof Response) {
      return error;
    }

    // Next.js redirect/notFound throw special objects with a `digest` property.
    if (
      error !== null &&
      typeof error === 'object' &&
      'digest' in error
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : String(error);

    logger.error('[handleRoute] Unhandled route error:', message);

    return serverError('INTERNAL_SERVER_ERROR', message) as unknown as T;
  }
}
