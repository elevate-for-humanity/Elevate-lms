import { logger } from '@/lib/logger';
export function sanitizeError(error: any): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred. Please try again later.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

export function logError(context: string, error: any, metadata?: Record<string, any>) {
  logger.error(`[${context}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: any) {
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }
  
  logError('Unhandled API Error', error);
  
  return {
    error: sanitizeError(error),
    statusCode: 500,
  };
}
