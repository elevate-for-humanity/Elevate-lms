import canonicalRoutesConfig from './canonical-routes.json';

type LegacyAlias = { source: string; destination: string };
type CanonicalRoutesConfig = {
  canonicalRoutes: typeof canonicalRoutesConfig.canonicalRoutes;
  legacyAliases?: LegacyAlias[];
  ecsOnlyPrefixes?: string[];
  externalOrAppHostedAllowlist?: string[];
};

const routeConfig = canonicalRoutesConfig as CanonicalRoutesConfig;

export const canonicalRoutes = routeConfig.canonicalRoutes;
export const legacyRouteAliases = routeConfig.legacyAliases ?? [];
export const ecsOnlyRoutePrefixes = routeConfig.ecsOnlyPrefixes ?? [];
export const externalOrAppHostedAllowlist = routeConfig.externalOrAppHostedAllowlist ?? [];

export const legacyAliasLookup = new Map<string, string>(
  legacyRouteAliases.map((alias) => [alias.source, alias.destination]),
);

export const ADMIN = {
  MISSION_CONTROL: '/portals',
  OPERATIONS: '/operations',
  COMMAND_CENTER: '/portals',
  STUDENTS: '/students',
  APPLICATIONS: '/applications',
  ENROLLMENTS: '/enrollments',
  AT_RISK: '/students?filter=at-risk',
  IMPERSONATE: '/impersonate',
  PROGRAMS: '/programs',
  COURSES: '/store',
  COURSE_PIPELINE: '/course-builder',
  COURSE_BUILDER: '/course-builder',
  CURRICULUM: '/course-builder',
  AI_STUDIO: '/paris',
  AI_CONSOLE: '/paris',
  DEV_STUDIO: '/studio',
  FUNDING: '/funding',
  PAYMENTS: '/payments',
  CERTIFICATES: '/certificates',
  WIOA: '/wioa',
  COMPLIANCE: '/compliance',
  AUDIT_LOGS: '/audit-logs',
  DOCUMENTS: '/documents',
  DOCUMENT_CENTER: '/documents',
  GOVERNANCE: '/governance/operational-controls',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  SETTINGS: 'https://app.elevateforhumanity.org/lms/settings',
  SYSTEM_HEALTH: '/system-health',
  SNAPSHOTS: '/snapshots',
  AUTOMATION: '/studio/workflows',
  MONITORING: '/monitoring',
  PARTNERS: '/partners',
  EMPLOYERS: '/employers',
  CRM: '/crm',
} as const;

export type AdminRoute = typeof ADMIN[keyof typeof ADMIN];

export function resolveAdminRoute(path: string): string {
  return legacyAliasLookup.get(path) ?? path;
}
