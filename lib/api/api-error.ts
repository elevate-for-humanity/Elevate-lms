import { ErrorCode, getErrorMessage } from './error-codes';

/**
 * Custom API Error class with error codes
 */
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message?: string,
    details?: Record<string, any>,
  ) {
    super(message || getErrorMessage(code));
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(process.env.NODE_ENV === 'development' && this.details && { details: this.details }),
    };
  }
}

/**
 * Factory functions for common errors
 */
export const APIErrors = {
  unauthorized: (message?: string) => new APIError(ErrorCode.AUTH_UNAUTHORIZED, 401, message),

  forbidden: (message?: string) =>
    new APIError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, 403, message),

  notFound: (resource?: string) =>
    new APIError(ErrorCode.RES_NOT_FOUND, 404, resource ? `${resource} not found` : undefined),

  badRequest: (message?: string, details?: Record<string, any>) =>
    new APIError(ErrorCode.VAL_INVALID_FORMAT, 400, message, details),

  conflict: (message?: string) => new APIError(ErrorCode.RES_CONFLICT, 409, message),

  internal: (message?: string, details?: Record<string, any>) =>
    new APIError(ErrorCode.INT_SERVER_ERROR, 500, message, details),

  validation: (field: string, message?: string) =>
    new APIError(ErrorCode.VAL_MISSING_FIELD, 400, message || `Invalid ${field}`, { field }),

  database: (message?: string) => new APIError(ErrorCode.DB_QUERY_ERROR, 500, message),

  external: (service: string, message?: string) =>
    new APIError(ErrorCode.EXT_UNAVAILABLE, 503, message || `${service} is unavailable`),

  rateLimit: () => new APIError(ErrorCode.RATE_LIMIT_EXCEEDED, 429, 'Too many requests'),
};
