/**
 * API Error Handler Utility
 * Wraps API route handlers with consistent error handling
 */

import { NextResponse } from 'next/server';

export type ApiHandler = (req: Request) => Promise<Response>;

/**
 * Wraps an API handler with try/catch and consistent error responses
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      /* Error handled silently */
      // Error: $1

      // Handle specific error types
      if (error instanceof Error) {
        // Database errors
        if (
          error.message.includes('duplicate key') ||
          error.message.includes('unique constraint')
        ) {
          return NextResponse.json({ error: 'This record already exists.' }, { status: 409 });
        }

        // Foreign key errors
        if (error.message.includes('foreign key constraint')) {
          return NextResponse.json({ error: 'Related record not found.' }, { status: 400 });
        }

        // Not found errors
        if (error.message.includes('not found') || error.message.includes('404')) {
          return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
        }

        // Unauthorized errors
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        // Forbidden errors
        if (error.message.includes('forbidden') || error.message.includes('403')) {
          return NextResponse.json(
            { error: 'You do not have permission to perform this action.' },
            { status: 403 },
          );
        }
      }

      // Generic error response
      return NextResponse.json(
        { error: 'An unexpected error occurred. Please try again later.' },
        { status: 500 },
      );
    }
  };
}

/**
 * Validates required fields in request body
 */
export function validateRequired(data: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Creates a standardized success response
 */
export function successResponse(data: Record<string, any>, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
