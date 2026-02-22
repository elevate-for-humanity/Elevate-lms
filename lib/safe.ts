/**
 * Type-safe helpers for narrowing unknown types
 * Use these to safely access properties on unknown/Record<string, any> values
 */

export const isRecord = (v: any): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const rec = (v: any): Record<string, any> =>
  isRecord(v) ? v : {};

export const str = (v: any, fallback: string | null = null) =>
  typeof v === 'string' ? v : fallback;

export const num = (v: any, fallback: number | null = null) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export const bool = (v: any, fallback: boolean | null = null) =>
  typeof v === 'boolean' ? v : fallback;

export const date = (v: any, fallback: Date | null = null) => {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? fallback : d;
  }
  return fallback;
};

export const arr = <T = unknown>(v: any): T[] =>
  Array.isArray(v) ? v : [];

export const toDateString = (value: any): string => {
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  }
  return "";
};

export const toError = (error: any): Error => {
  if (error instanceof Error) return error;
  return new Error(String(error));
};

/**
 * Returns a safe error message for API responses.
 * In production, returns a generic message to avoid leaking internals.
 * In development, returns the actual error for debugging.
 */
export const toErrorMessage = (error: any): string => {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
    return String(error);
  }
  return 'An unexpected error occurred';
};

/** Returns the real error message regardless of environment. Use only for server-side logging. */
export const toErrorDetail = (error: any): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};
