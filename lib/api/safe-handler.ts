import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Return a JSON success response, or a redirect if redirect+req are provided.
 */
export function success(data: Record<string, unknown> = {}, redirect?: string, req?: Request) {
  if (redirect && req) {
    return NextResponse.redirect(new URL(redirect, req.url), 303);
  }
  return NextResponse.json({ success: true, ...data }, { status: 200 });
}

/**
 * Return a JSON error response, or a redirect with ?error=<slug> if redirect+req are provided.
 * Never expose raw error.message to the client — pass a safe message string.
 */
export function failure(
  message: string,
  status: number = 500,
  redirect?: string,
  req?: Request
) {
  if (redirect && req) {
    return NextResponse.redirect(
      new URL(`${redirect}?error=${encodeURIComponent(message)}`, req.url),
      303
    );
  }
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * HARD RULE: DB write must succeed or the request fails.
 *
 * - No silent fallthrough on DB error
 * - No fake { success: true } in catch blocks
 * - No "continue anyway" patterns
 *
 * Throws on DB error or missing data so the caller's catch block
 * can return failure(...) — never a success response.
 */
export async function requireDbWrite<T>(
  operation: Promise<{ data: T | null; error: unknown }>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  const { data, error } = await operation;

  if (error || !data) {
    logger.error('requireDbWrite: DB failure', { error, errorMessage });
    throw new Error(errorMessage);
  }

  return data;
}
