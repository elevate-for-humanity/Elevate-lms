import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { APIError } from './api-error';
import { ErrorCode } from './error-codes';

/**
 * Logs error to monitoring service (Sentry)
 */
async function logErrorToSentry(error: Error, context: Record<string, any>) {
  if (typeof window === 'undefined') {
    // Server-side: Use Sentry Node SDK
    try {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: {
          type: 'api_error',
          ...context.tags,
        },
        extra: context,
      });
    } catch (error) {
      // Sentry not available, log to console
      logger.error('[Sentry Error]', error);
    }
  }
}

/**
 * Sanitizes error for production
 */
function sanitizeError(error: any): { message: string; code: string } {
  if (error instanceof APIError) {
    return {
      message: 'Internal server error',
      code: error.code,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      code: ErrorCode.INT_UNKNOWN_ERROR,
    };
  }

  if (error instanceof Error) {
    return {
      message: 'Internal server error',
      code: ErrorCode.INT_UNKNOWN_ERROR,
    };
  }

  return {
    message: String(error),
    code: ErrorCode.INT_UNKNOWN_ERROR,
  };
}

/**
 * Logs error with context
 */
function logError(error: any, context: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: 'Internal server error',
      stack: error.stack,
    } : String(error),
  };

  logger.error('[API Error]', JSON.stringify(errorInfo, null, 2));

  // Log to Sentry
  if (error instanceof Error) {
    logErrorToSentry(error, context);
  }
}

/**
 * Higher-order function that wraps API route handlers with error handling
 */
export function withErrorHandling<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const route = request.nextUrl.pathname;
    const method = request.method;

    try {
      const response = await handler(request, context);
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        logger.info(`[API] ${method} ${route} - ${response.status} (${duration}ms)`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle APIError
      if (error instanceof APIError) {
        logError(error, {
          route,
          method,
          statusCode: error.statusCode,
          code: error.code,
          duration,
        });

        return NextResponse.json(
          error.toJSON(),
          { status: error.statusCode }
        );
      }

      // Handle unknown errors
      logError(error, {
        route,
        method,
        statusCode: 500,
        duration,
      });

      const sanitized = sanitizeError(error);
      return NextResponse.json(
        {
          error: sanitized.message,
          code: sanitized.code,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Async wrapper for route handlers with params
 */
export function withErrorHandlingParams<T = any>(
  handler: (
    request: NextRequest,
    context: { params: Promise<any> }
  ) => Promise<NextResponse<T>>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<any> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const route = request.nextUrl.pathname;
    const method = request.method;

    try {
      const response = await handler(request, context);
      
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        logger.info(`[API] ${method} ${route} - ${response.status} (${duration}ms)`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof APIError) {
        logError(error, {
          route,
          method,
          statusCode: error.statusCode,
          code: error.code,
          duration,
        });

        return NextResponse.json(
          error.toJSON(),
          { status: error.statusCode }
        );
      }

      logError(error, {
        route,
        method,
        statusCode: 500,
        duration,
      });

      const sanitized = sanitizeError(error);
      return NextResponse.json(
        {
          error: sanitized.message,
          code: sanitized.code,
        },
        { status: 500 }
      );
    }
  };
}
