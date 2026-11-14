/**
 * Shared validation helpers.
 *
 * Simple, dependency-free predicates. Use these instead of re-declaring
 * the same email / phone regex in every route handler.
 *
 * For Zod-based form schemas, keep using lib/utils/form-validation.ts.
 * These helpers are for quick inline checks in API routes.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

const PHONE_RE = /^[\d\s\-()+]{10,}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone);
}

const ZIP_RE = /^\d{5}(-\d{4})?$/;

export function isValidZip(zip: string): boolean {
  return ZIP_RE.test(zip);
}

/**
 * Parse pagination params from URLSearchParams with safe defaults and clamping.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; perPage?: number; maxPerPage?: number } = {},
): { page: number; perPage: number; offset: number } {
  const { page: defaultPage = 1, perPage: defaultPerPage = 25, maxPerPage = 100 } = defaults;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? String(defaultPage), 10) || defaultPage);
  const perPage = Math.min(
    maxPerPage,
    Math.max(1, parseInt(searchParams.get('per_page') ?? String(defaultPerPage), 10) || defaultPerPage),
  );
  return { page, perPage, offset: (page - 1) * perPage };
}

/**
 * Simple text → URL-safe slug.
 * For richer slugification (e.g. with the `slugify` npm package),
 * use lib/utils/slug-generator.ts instead.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
