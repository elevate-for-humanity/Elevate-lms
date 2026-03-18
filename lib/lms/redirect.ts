/**
 * Builds a login URL that preserves the intended destination.
 * Use this everywhere a logged-out user needs to authenticate before
 * reaching a specific page — preserves deep links instead of always
 * forcing /lms/dashboard.
 */
export function buildLoginRedirect(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}
