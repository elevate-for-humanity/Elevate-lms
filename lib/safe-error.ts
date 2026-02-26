/**
 * Returns a user-safe error message. In production, internal error details
 * are hidden to prevent information leakage. In development, the original
 * message is returned for debugging.
 */
export function safeErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
  }
  return fallback;
}

/**
 * Creates a NextResponse JSON error response with a safe message.
 */
export function safeErrorJson(error: unknown, status = 500, fallback?: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server');
  return NextResponse.json(
    { error: safeErrorMessage(error, fallback) },
    { status },
  );
}
