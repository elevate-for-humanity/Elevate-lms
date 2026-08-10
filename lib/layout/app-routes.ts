/**
 * Canonical list of route prefixes that suppress the marketing header/footer.
 *
 * Only active application/portal routes belong here. Do not add legacy aliases.
 */
export const APP_ROUTE_PREFIXES = [
  '/lms',
  '/admin',
  '/instructor',
  '/employer',
  '/host-shop',
  '/apprentice',
  '/portal',
  '/staff-portal',
  '/program-holder',
  '/provider',
  '/proctor',
  '/testing-center',
  '/case-manager',
  '/workforce',
  '/workforce-board',
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

export function shouldHideMarketingHeader(pathname: string): boolean {
  const customHeaderPrefixes = [
    '/contact',
    '/about',
    '/blog',
    '/faq',
    '/privacy',
    '/terms',
    '/accessibility',
    '/support',
    '/careers',
  ] as const;

  return customHeaderPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export function generateChromeSuppressionScript(): string {
  const list = JSON.stringify(APP_ROUTE_PREFIXES);
  return `(function(){var p=location.pathname;var APP=${list};if(APP.some(function(a){return p===a||p.startsWith(a+'/')})){document.body.setAttribute('data-app-route','true');}if(p==='/admin'||p.startsWith('/admin/')){document.body.setAttribute('data-admin-route','true');}})();`;
}
