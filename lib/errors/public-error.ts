export type PublicErrorPayload = {
  message: string;
  code?: string;
  requestId?: string;
};

/**
 * Converts any error into a safe payload for API responses.
 * Internal details (stack traces, SQL errors, provider messages) are never exposed.
 * Errors with `isPublic: true` are treated as intentionally user-facing.
 */
export function toPublicError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): PublicErrorPayload {
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;
    if (anyErr.isPublic === true && typeof anyErr.message === 'string') {
      return { message: anyErr.message, code: anyErr.code as string | undefined };
    }
  }
  return { message: fallback };
}

/**
 * Throw this when you want the error message to reach the client.
 */
export class PublicError extends Error {
  readonly isPublic = true;
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
    this.name = 'PublicError';
  }
}
