/**
 * lib/routing/portal-map.ts
 *
 * SINGLE SOURCE OF TRUTH for all cross-application routing.
 *
 * Architecture:
 * - Marketing app (www.) serves public content and redirects portal routes
 * - Admin app (admin.) serves admin/staff portals at root paths
 * - LMS app (app.) serves student/employer/apprentice portals
 *
 * Every routing decision (next.config redirects, middleware, navigation, login)
 * should import from this file. No hardcoded portal URLs.
 */

export const MARKETING_HOST = 'https://www.elevateforhumanity.org';
export const ADMIN_HOST = 'https://admin.elevateforhumanity.org';
export const LMS_HOST = 'https://app.elevateforhumanity.org';

export type PortalType =
  | 'marketing'
  | 'admin'
  | 'lms'
  | 'employer'
  | 'apprentice'
  | 'parent'
  | 'workforce'
  | 'hostshop'
  | 'cosmetology'
  | 'workforceboard'
  | 'casemanager'
  | 'provider'
  | 'partner'
  | 'programholder';

interface PortalRoute {
  type: PortalType;
  subdomain: 'marketing' | 'admin' | 'app';
  basePath: string;
  host: string;
  defaultPath: string;
  redirectPattern: string;
}

export const PORTAL_MAP: Record<string, PortalRoute> = {
  lms: {
    type: 'lms',
    subdomain: 'app',
    basePath: '/lms',
    host: LMS_HOST,
    defaultPath: '/lms/dashboard',
    redirectPattern: '/lms/:path*',
  },
  employer: {
    type: 'employer',
    subdomain: 'app',
    basePath: '/employer',
    host: LMS_HOST,
    defaultPath: '/employer/dashboard',
    redirectPattern: '/employer/:path*',
  },
  apprentice: {
    type: 'apprentice',
    subdomain: 'app',
    basePath: '/apprentice',
    host: LMS_HOST,
    defaultPath: '/apprentice',
    redirectPattern: '/apprentice/:path*',
  },
  parent: {
    type: 'parent',
    subdomain: 'app',
    basePath: '/parent-portal',
    host: LMS_HOST,
    defaultPath: '/parent-portal/dashboard',
    redirectPattern: '/parent-portal/:path*',
  },
  workforce: {
    type: 'workforce',
    subdomain: 'app',
    basePath: '/workforce',
    host: LMS_HOST,
    defaultPath: '/workforce/dashboard',
    redirectPattern: '/workforce/:path*',
  },
  hostshop: {
    type: 'hostshop',
    subdomain: 'app',
    basePath: '/host-shop',
    host: LMS_HOST,
    defaultPath: '/host-shop/dashboard',
    redirectPattern: '/host-shop/:path*',
  },
  cosmetology: {
    type: 'cosmetology',
    subdomain: 'app',
    basePath: '/cosmetology-host-shop',
    host: LMS_HOST,
    defaultPath: '/cosmetology-host-shop/dashboard',
    redirectPattern: '/cosmetology-host-shop/:path*',
  },

  // Standalone Admin app: there is no /admin path prefix on the admin hostname.
  admin: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '',
    host: ADMIN_HOST,
    defaultPath: '/dashboard',
    redirectPattern: '',
  },
  instructor: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '/instructor',
    host: ADMIN_HOST,
    defaultPath: '/instructor/dashboard',
    redirectPattern: '/instructor/:path*',
  },
  staff: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '/staff-portal',
    host: ADMIN_HOST,
    defaultPath: '/staff-portal/dashboard',
    redirectPattern: '/staff-portal/:path*',
  },

  workforceboard: {
    type: 'workforceboard',
    subdomain: 'marketing',
    basePath: '/workforce-board',
    host: MARKETING_HOST,
    defaultPath: '/workforce-board/dashboard',
    redirectPattern: '/workforce-board/:path*',
  },
  casemanager: {
    type: 'casemanager',
    subdomain: 'marketing',
    basePath: '/case-manager',
    host: MARKETING_HOST,
    defaultPath: '/case-manager/dashboard',
    redirectPattern: '/case-manager/:path*',
  },
  provider: {
    type: 'provider',
    subdomain: 'marketing',
    basePath: '/provider',
    host: MARKETING_HOST,
    defaultPath: '/provider/dashboard',
    redirectPattern: '/provider/:path*',
  },
  partner: {
    type: 'partner',
    subdomain: 'app',
    basePath: '/partner',
    host: LMS_HOST,
    defaultPath: '/partner/dashboard',
    redirectPattern: '/partner/:path*',
  },
  programholder: {
    type: 'programholder',
    subdomain: 'marketing',
    basePath: '/program-holder',
    host: MARKETING_HOST,
    defaultPath: '/program-holder/dashboard',
    redirectPattern: '/program-holder/:path*',
  },
};

export function getPortalRedirect(key: string, path = ''): string {
  const portal = PORTAL_MAP[key];
  if (!portal) return MARKETING_HOST;
  const suffix = path ? `/${path.replace(/^\//, '')}` : '';
  return `${portal.host}${portal.basePath}${suffix}`;
}

export function getPortalHost(key: string): string {
  const portal = PORTAL_MAP[key];
  return portal?.host ?? MARKETING_HOST;
}

export function getPortalKeyFromPath(pathname: string): string | null {
  const candidates = Object.entries(PORTAL_MAP)
    .filter(([, portal]) => portal.basePath.length > 0)
    .sort(([, a], [, b]) => b.basePath.length - a.basePath.length);

  for (const [key, portal] of candidates) {
    if (pathname === portal.basePath || pathname.startsWith(`${portal.basePath}/`)) {
      return key;
    }
  }
  return null;
}

export function isMarketingRoute(pathname: string): boolean {
  const marketingKeys = ['workforceboard', 'casemanager', 'provider', 'programholder'] as const;
  for (const key of marketingKeys) {
    const portal = PORTAL_MAP[key];
    if (portal && (pathname === portal.basePath || pathname.startsWith(`${portal.basePath}/`))) {
      return true;
    }
  }
  return false;
}

export function portalUrl(key: string, path = ''): string {
  return getPortalRedirect(key, path);
}
