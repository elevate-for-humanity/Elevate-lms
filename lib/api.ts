import { logger } from '@/lib/logger';
/**
 * API client helper for consistent fetch calls
 * Use this in client components instead of direct fetch
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    return { error: json?.error || `Request failed: ${res.status}`, details: json?.details };
  }
  
  return json as ApiResponse<T>;
}

// Convenience methods
export const apiGet = <T>(path: string) => api<T>(path, { method: 'GET' });

export const apiPost = <T>(path: string, body: any) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: any) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: 'DELETE' });

// Error codes for API responses
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// Standard API error responses
export const APIErrors = {
  unauthorized: (message = 'Unauthorized') => ({
    error: message,
    code: ErrorCode.UNAUTHORIZED,
    status: 401,
  }),
  forbidden: (message = 'Forbidden') => ({
    error: message,
    code: ErrorCode.FORBIDDEN,
    status: 403,
  }),
  notFound: (message = 'Not found') => ({
    error: message,
    code: ErrorCode.NOT_FOUND,
    status: 404,
  }),
  badRequest: (message = 'Bad request') => ({
    error: message,
    code: ErrorCode.BAD_REQUEST,
    status: 400,
  }),
  validationError: (message = 'Validation error', details?: any) => ({
    error: message,
    code: ErrorCode.VALIDATION_ERROR,
    status: 400,
    details,
  }),
  internal: (message = 'Internal server error') => ({
    error: message,
    code: ErrorCode.INTERNAL_ERROR,
    status: 500,
  }),
};

import { NextRequest, NextResponse } from 'next/server';

// Higher-order function for consistent error handling in API routes
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error: any) {
      logger.error('API Error:', error);
      
      // Check if it's a structured API error
      if (error.status && error.error) {
        return NextResponse.json(
          { error: error.error, code: error.code, details: error.details },
          { status: error.status }
        );
      }
      
      // Default to internal server error
      return NextResponse.json(
        { error: error.message || 'Internal server error', code: ErrorCode.INTERNAL_ERROR },
        { status: 500 }
      );
    }
  };
}
