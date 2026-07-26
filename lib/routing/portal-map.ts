/**
 * lib/routing/portal-map.ts
 *
 * SINGLE SOURCE OF TRUTH for all cross-application routing.
 *
 * Architecture:
 * - Marketing app (www.) serves public content and redirects portal routes
 * - Admin app (admin.) serves admin/staff portals
 * - LMS app (app.) serves student/employer/apprentice portals
 *
 * Every routing decision (next.config redirects, middleware, navigation, login)
 * should import from this file. No hardcoded portal URLs.
 */

// ── Subdomain constants ────────────────────────────────────────────────────────

export const MARKETING_HOST = 'https://www.elevateforhumanity.org';
export const ADMIN_HOST = 'https://admin.elevateforhumanity.org';
export const LMS_HOST = 'https://app.elevateforhumanity.org';

// ── Portal types ───────────────────────────────────────────────────────────────

export type PortalType =
  | 'marketing'   // Public content on www.
  | 'admin'       // Admin portal on admin.
  | 'lms'         // LMS/student portal on app.
  | 'employer'    // Employer portal on app.
  | 'apprentice'  // Apprentice portal on app.
  | 'parent'      // Parent portal on app.
  | 'workforce'   // Workforce portal on app.
  | 'hostshop'    // Host shop portal on app.
  | 'cosmetology' // Cosmetology host shop on app.
  | 'workforceboard' // Workforce board (marketing only)
  | 'casemanager' // Case manager (marketing only)
  | 'provider'    // Provider (marketing only)
  | 'partner'     // Partner (marketing only)
  | 'programholder'; // Program holder (marketing only)

// ── Portal routing table ───────────────────────────────────────────────────────

interface PortalRoute {
  type: PortalType;
  subdomain: 'marketing' | 'admin' | 'app';
  basePath: string;
  host: string;
  defaultPath: string;
  redirectPattern: string;
}

export const PORTAL_MAP: Record<string, PortalRoute> = {
  // ── LMS app portals (app.elevateforhumanity.org) ──────────────────────────
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
  // ── Admin app portals (admin.elevateforhumanity.org) ───────────────────────
  admin: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '/admin',
    host: ADMIN_HOST,
    defaultPath: '/admin/dashboard',
    redirectPattern: '/admin/:path*',
  },
  instructor: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '/admin/instructor',
    host: ADMIN_HOST,
    defaultPath: '/admin/instructor/dashboard',
    redirectPattern: '/admin/instructor/:path*',
  },
  staff: {
    type: 'admin',
    subdomain: 'admin',
    basePath: '/admin/staff-portal',
    host: ADMIN_HOST,
    defaultPath: '/admin/staff-portal/dashboard',
    redirectPattern: '/admin/staff-portal/:path*',
  },
  // ── Marketing-only portals (www.elevateforhumanity.org) ───────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPortalRedirect(key: string, path = ''): string {
  const portal = PORTAL_MAP[key];
  if (!portal) return MARKETING_HOST;
  return `${portal.host}${portal.basePath}${path ? `/${path.replace(/^\//, '')}` : ''}`;
}

export function getPortalHost(key: string): string {
  const portal = PORTAL_MAP[key];
  return portal?.host ?? MARKETING_HOST;
}

export function getPortalKeyFromPath(pathname: string): string | null {
  for (const [key, portal] of Object.entries(PORTAL_MAP)) {
    if (pathname.startsWith(portal.basePath)) {
      return key;
    }
  }
  return null;
}

export function isMarketingRoute(pathname: string): boolean {
  const marketingKeys = [
    'workforceboard', 'casemanager', 'provider', 'partner',
    'programholder', 'staff',
  ] as const;
  for (const key of marketingKeys) {
    const portal = PORTAL_MAP[key];
    if (portal && pathname.startsWith(portal.basePath)) {
      return true;
    }
  }
  return false;
}

export function portalUrl(key: string, path = ''): string {
  return getPortalRedirect(key, path);
}
