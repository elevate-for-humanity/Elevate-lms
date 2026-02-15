// Centralized error handling utilities

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export function handleError(error: any): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: 'Internal server error',
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Log unexpected errors
    // Error: $1

    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: 'An error occurred',
        fatal: true,
      });
    }

    return {
      message: process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred',
      statusCode: 500,
    };
  }

  return {
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) { /* Error handled silently */ 
    const { message } = handleError(error);
    return { error: message || errorMessage };
  }
}

export function logError(error: any, context?: Record<string, any>) {
  // Error logged

  // Send to error tracking service (e.g., Sentry)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: 'Operation failed',
      fatal: false,
      ...context,
    });
  }
}
