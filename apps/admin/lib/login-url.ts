export const ADMIN_LOGIN_BASE_URL_FALLBACK = 'https://www.elevateforhumanity.org';

export function getCanonicalLoginBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || ADMIN_LOGIN_BASE_URL_FALLBACK;
}
