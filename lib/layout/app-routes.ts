/**
 * Canonical list of route prefixes that suppress the marketing header/footer.
 *
 * This is the SINGLE SOURCE OF TRUTH. Both MarketingChromeGuard (client-side)
 * and the inline script in app/layout.tsx (server-side FOUC prevention) must
 * derive from this list.
 *
 * When adding a new portal:
 *   1. Add the prefix here
 *   2. Run `pnpm build` to regenerate the inline script (it reads this file)
 *   3. Update docs/architecture/canonical-routes.md
 */
export const APP_ROUTE_PREFIXES = [
  '/lms',
  '/learner',
  '/admin',
  '/admin/instructor',
  '/employer',

  '/partner',
  '/admin/staff-portal',
  '/mentor',
  '/program-holder',
  '/provider',
  '/proctor',
  '/case-manager',
  '/workforce-board',
  '/admin-login',
  '/login',
  '/signup',
  '/reset-password',
  '/verify',
] as const;

export type AppRoutePrefix = (typeof APP_ROUTE_PREFIXES)[number];

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Generates the inline script string for app/layout.tsx.
 * Keeps the hard-nav suppression in sync with APP_ROUTE_PREFIXES automatically.
 */
export function generateChromeSuppressionScript(): string {
  const list = JSON.stringify(APP_ROUTE_PREFIXES);
  return `(function(){var p=location.pathname;var APP=${list};if(APP.some(function(a){return p===a||p.startsWith(a+'/')})){document.body.setAttribute('data-app-route','true');}if(p==='/admin'||p.startsWith('/admin/')){document.body.setAttribute('data-admin-route','true');}})();`;
}
