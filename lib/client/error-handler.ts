import { logger } from '@/lib/logger';
'use client';

/**
 * Client-side error handling utilities
 */

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Parse error from API response
 */
export async function parseErrorResponse(response: Response): Promise<ErrorResponse> {
  try {
    const data = await response.json();
    return {
      error: data.error || 'An error occurred',
      code: data.code,
      details: data.details,
    };
  } catch (error) {
    return {
      error: `Request failed with status ${response.status}`,
      code: 'PARSE_ERROR',
    };
  }
}

/**
 * Handle fetch errors with toast notifications
 */
export async function handleFetchError(
  error: any,
  showToast: (message: string, type: 'error' | 'success') => void
): Promise<string> {
  let message = 'An unexpected error occurred';

  if (error instanceof Response) {
    const errorData = await parseErrorResponse(error);
    message = errorData.error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  showToast(message, 'error');
  return message;
}

/**
 * Fetch wrapper with automatic error handling
 */
export async function fetchWithErrorHandling<T = any>(
  url: string,
  options?: RequestInit,
  showToast?: (message: string, type: 'error' | 'success') => void
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      
      if (showToast) {
        showToast(errorData.error, 'error');
      }
      
      throw new Error(errorData.error);
    }

    return await response.json();
  } catch (error) {
    if (showToast && error instanceof Error) {
      showToast(error.message, 'error');
    }
    throw error;
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('[Unhandled Promise Rejection]', event.reason);
    
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(event.reason, {
        tags: { type: 'unhandled_rejection' },
      });
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('[Global Error]', event.error);
    
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(event.error, {
        tags: { type: 'global_error' },
      });
    }
  });
}

/**
 * Log error to Sentry (client-side)
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('[Client Error]', error, context);
  
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context,
    });
  }
}

declare global {
  interface Window {
    Sentry?: any;
  }
}
