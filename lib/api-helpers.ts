/**
 * API Helper Functions
 * Type-safe utilities for API routes
 */

import { NextRequest } from 'next/server';

/**
 * Parse JSON body with type safety
 */
export async function parseBody<T = Record<string, any>>(
  request: NextRequest | Request,
): Promise<T> {
  const body = await request.json();
  return body as T;
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
  body: T,
  fields: (keyof T)[],
): { valid: true } | { valid: false; missing: string[] } {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }
  return { valid: true };
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Type guard for checking if value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value has a specific property
 */
export function hasProperty<K extends string>(obj: any, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}
