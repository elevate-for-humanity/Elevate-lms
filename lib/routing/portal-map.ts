/**
 * Cross-application portal ownership map.
 *
 * One canonical key represents each operational portal. Historical role names
 * (for example `partner`) are resolved in role-destinations.ts and do not create
 * additional portal keys or routes here.
 */

function normalizeHost(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  return candidate.replace(/\/+$/, '');
}

export const MARKETING_HOST = normalizeHost(
  process.env.NEXT_PUBLIC_MARKETING_URL || process.env.NEXT_PUBLIC_SITE_URL,
  'https://www.elevateforhumanity.org',
);
export const ADMIN_HOST = normalizeHost(
  process.env.NEXT_PUBLIC_ADMIN_URL,
  'https://admin.elevateforhumanity.org',
);
export const LMS_HOST = normalizeHost(
  process.env.NEXT_PUBLIC_APP_URL,
  'https://app.elevateforhumanity.org',
);

interface PortalRoute {
  subdomain: 'marketing' | 'admin' | 'app';
  basePath: string;
  host: string;
  defaultPath: string;
}

export const PORTAL_MAP = {
  lms: {
    subdomain: 'app',
    basePath: '/lms',
    host: LMS_HOST,
    defaultPath: '/lms/dashboard',
  },
  employer: {
    subdomain: 'app',
    basePath: '/employer',
    host: LMS_HOST,
    defaultPath: '/employer/dashboard',
  },
  apprentice: {
    subdomain: 'app',
    basePath: '/apprentice',
    host: LMS_HOST,
    defaultPath: '/apprentice',
  },
  parent: {
    subdomain: 'app',
    basePath: '/parent-portal',
    host: LMS_HOST,
    defaultPath: '/parent-portal/dashboard',
  },
  workforce: {
    subdomain: 'app',
    basePath: '/workforce',
    host: LMS_HOST,
    defaultPath: '/workforce/dashboard',
  },
  hostshop: {
    subdomain: 'app',
    basePath: '/host-shop',
    host: LMS_HOST,
    defaultPath: '/host-shop/dashboard',
  },
  creator: {
    subdomain: 'app',
    basePath: '/creator',
    host: LMS_HOST,
    defaultPath: '/creator/products',
  },

  admin: {
    subdomain: 'admin',
    basePath: '',
    host: ADMIN_HOST,
    defaultPath: '/lms/dashboard',
  },
  instructor: {
    subdomain: 'admin',
    basePath: '/instructor',
    host: ADMIN_HOST,
    defaultPath: '/instructor/dashboard',
  },
  staff: {
    subdomain: 'admin',
    basePath: '/staff-portal',
    host: ADMIN_HOST,
    defaultPath: '/staff-portal/dashboard',
  },
  testing: {
    subdomain: 'admin',
    basePath: '/testing-center',
    host: ADMIN_HOST,
    defaultPath: '/testing-center',
  },

  workforceboard: {
    subdomain: 'marketing',
    basePath: '/workforce-board',
    host: MARKETING_HOST,
    defaultPath: '/workforce-board/dashboard',
  },
  casemanager: {
    subdomain: 'marketing',
    basePath: '/case-manager',
    host: MARKETING_HOST,
    defaultPath: '/case-manager/dashboard',
  },
  provider: {
    subdomain: 'marketing',
    basePath: '/provider',
    host: MARKETING_HOST,
    defaultPath: '/provider/dashboard',
  },
  programholder: {
    subdomain: 'marketing',
    basePath: '/program-holder',
    host: MARKETING_HOST,
    defaultPath: '/program-holder/dashboard',
  },
} as const satisfies Record<string, PortalRoute>;

export type PortalKey = keyof typeof PORTAL_MAP;

export function getPortalRedirect(key: PortalKey, path = ''): string {
  const portal = PORTAL_MAP[key];
  if (!path) return `${portal.host}${portal.defaultPath}`;
  const suffix = `/${path.replace(/^\//, '')}`;
  return `${portal.host}${portal.basePath}${suffix}`;
}

export function getPortalHost(key: PortalKey): string {
  return PORTAL_MAP[key].host;
}

export function getPortalKeyFromPath(pathname: string): PortalKey | null {
  const candidates = (Object.entries(PORTAL_MAP) as Array<[PortalKey, PortalRoute]>)
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
  const marketingKeys: ReadonlyArray<PortalKey> = [
    'workforceboard',
    'casemanager',
    'provider',
    'programholder',
  ];

  return marketingKeys.some((key) => {
    const portal = PORTAL_MAP[key];
    return pathname === portal.basePath || pathname.startsWith(`${portal.basePath}/`);
  });
}

export function portalUrl(key: PortalKey, path = ''): string {
  return getPortalRedirect(key, path);
}
