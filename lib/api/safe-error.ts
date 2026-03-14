/**
 * Safe API error responses
 *
 * Prevents internal error details (stack traces, DB messages, column names)
 * from leaking to API consumers. All outward-facing error responses must use
 * these helpers or an equivalent safe shape.
 *
 * Internal details are logged via logger — never returned in the response body.
 *
 * Usage:
 *   import { safeError, safeInternalError } from '@/lib/api/safe-error';
 *
 *   if (error) return safeInternalError(error, 'Failed to create enrollment');
 *   if (!data) return safeError('Program not found', 404);
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Return a safe error response with a caller-controlled message.
 * Use for expected errors (not found, validation, auth).
 */
export function safeError(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Return a generic 500 response and log the real error internally.
 * Use for unexpected errors where the internal message must not be exposed.
 *
 * @param err     The caught error (logged internally, never returned)
 * @param context Human-readable context for the log entry
 * @param publicMessage Optional override for the public-facing message
 */
export function safeInternalError(
  err: unknown,
  context: string,
  publicMessage = 'Internal server error'
): NextResponse {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(context, { error: message });
  return NextResponse.json({ error: publicMessage }, { status: 500 });
}

/**
 * Wrap a Supabase error into a safe response.
 * Logs the Supabase error code and message; returns a safe public message.
 */
export function safeDbError(
  error: { message?: string; code?: string; details?: string } | null,
  context: string,
  publicMessage = 'Database operation failed'
): NextResponse {
  if (error) {
    logger.error(context, {
      code: error.code,
      detail: error.details,
      // message logged internally only
      _internal: error.message,
    });
  }
  return NextResponse.json({ error: publicMessage }, { status: 500 });
}
