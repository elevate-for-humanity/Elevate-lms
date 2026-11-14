/**
 * Shared Service Result Contract
 * 
 * Standardized return type for all platform services.
 * Ensures consistent API responses across all endpoints.
 */

export type ServiceErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export function success<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function failure(
  code: ServiceErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ServiceResult<never> {
  return { ok: false, error: { code, message, details } };
}

export function unauthorized(message = 'Authentication required'): ServiceResult<never> {
  return failure('UNAUTHORIZED', message);
}

export function forbidden(message = 'Permission denied'): ServiceResult<never> {
  return failure('FORBIDDEN', message);
}

export function validationError(message: string, details?: Record<string, unknown>): ServiceResult<never> {
  return { ok: false, error: { code: 'VALIDATION_ERROR', message, details } };
}

export function notFound(resource: string): ServiceResult<never> {
  return failure('NOT_FOUND', `${resource} not found`);
}

export function isSuccess<T>(result: ServiceResult<T>): result is { ok: true; data: T } {
  return result.ok === true;
}

export function isFailure<T>(result: ServiceResult<T>): result is { ok: false; error: ServiceError } {
  return result.ok === false;
}

export function getHttpStatusCode(code: ServiceErrorCode): number {
  switch (code) {
    case 'UNAUTHORIZED': return 401;
    case 'FORBIDDEN': return 403;
    case 'VALIDATION_ERROR': return 400;
    case 'NOT_FOUND': return 404;
    case 'CONFLICT': return 409;
    case 'RATE_LIMITED': return 429;
    case 'PROVIDER_ERROR': return 502;
    case 'CONFIGURATION_ERROR': return 500;
    case 'SERVICE_UNAVAILABLE': return 503;
    default: return 500;
  }
}
