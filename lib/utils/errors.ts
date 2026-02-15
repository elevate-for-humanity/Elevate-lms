import { logger } from '@/lib/logger';
/**
 * Error handling utilities for type-safe error management
 */

/**
 * Converts unknown error to Error instance
 */
export function toError(error: any): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error(JSON.stringify(error));
}

/**
 * Extracts error message from unknown error
 */
export function getErrorMessage(error: any): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Type guard for Error objects
 */
export function isError(error: any): error is Error {
  return error instanceof Error;
}

/**
 * Safe error logging that handles unknown types
 */
export function logError(error: any, context?: string): void {
  const err = toError(error);
  const prefix = context ? `[${context}]` : '';
  logger.error(`${prefix} ${err.message}`, err.stack);
}
