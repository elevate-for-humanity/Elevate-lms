import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): NextResponse {
  if (error instanceof ApiError) {
    logger.error('API Error', error);
    return NextResponse.json(
      { error: 'Operation failed', code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    logger.error('Unexpected Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  logger.error('Unknown Error: ' + String(error));
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch(handleApiError);
}
