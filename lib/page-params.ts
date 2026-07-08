/**
 * Canonical Next.js 15+ page parameter types.
 *
 * In Next.js 15, searchParams and params are Promises. Using the old sync
 * Record<string, string> type causes "Cannot convert a Symbol value to a string"
 * during static generation. Always use these types and always await them.
 *
 * Usage:
 *   import { type PageSearchParams, resolveSearchParams } from '@/lib/page-params';
 *
 *   export default async function Page({ searchParams }: { searchParams: PageSearchParams }) {
 *     const params = await resolveSearchParams(searchParams);
 *   }
 */

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type PageParams<T extends Record<string, string> = Record<string, string>> = Promise<T>;

/**
 * Await and return searchParams. Centralises the await so callers
 * cannot accidentally use the raw Promise.
 */
export async function resolveSearchParams(
  searchParams: PageSearchParams,
): Promise<Record<string, string | string[] | undefined>> {
  return await searchParams;
}

/**
 * Get a single string value from resolved searchParams.
 * Returns undefined if the key is missing or is an array.
 */
export function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = params[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

/**
 * Build a URLSearchParams from resolved searchParams, handling string[].
 */
export function toURLSearchParams(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  }
  return qs;
}
