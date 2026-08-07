import canonicalRoutesConfig from './canonical-routes.json';

export const canonicalRoutes = canonicalRoutesConfig.canonicalRoutes;
export const legacyRouteAliases = canonicalRoutesConfig.legacyAliases || [];
export const ecsOnlyRoutePrefixes = canonicalRoutesConfig.ecsOnlyPrefixes || [];
export const externalOrAppHostedAllowlist = canonicalRoutesConfig.externalOrAppHostedAllowlist || [];

export const legacyAliasLookup = new Map(
  legacyRouteAliases.map((alias) => [alias.source, alias.destination]),
);

// ── Admin canonical routes ────────────────────────────────────────────────────
// Single source of truth for Admin navigation and workflows.
// Business workspaces use their real root routes. Dev Studio intentionally lives
// under /admin/studio because it is the protected platform control plane.

export const ADMIN = {
  // ── Operational ──────────────────────────────────────────────────────────
  MISSION_CONTROL:    '/dashboard',
  OPERATIONS:         '/operations',
  COMMAND_CENTER:     '/dashboard',

  // ── People ───────────────────────────────────────────────────────────────
  STUDENTS:           '/students',
  APPLICATIONS:       '/applications',
  ENROLLMENTS:        '/enrollments',
  AT_RISK:            '/students?filter=at-risk',
  IMPERSONATE:        '/admin/impersonate',

  // ── Programs & Courses ───────────────────────────────────────────────────
  PROGRAMS:           '/programs',
  COURSES:            '/courses',
  COURSE_PIPELINE:    '/admin/studio',
  COURSE_BUILDER:     '/admin/studio',
  CURRICULUM:         '/admin/studio',

  // ── AI / platform control ────────────────────────────────────────────────
  AI_STUDIO:          '/admin/studio',
  AI_CONSOLE:         '/admin/studio',
  DEV_STUDIO:         '/admin/studio',

  // ── Finance ──────────────────────────────────────────────────────────────
  FUNDING:            '/funding',
  PAYMENTS:           '/payments',
  CERTIFICATES:       '/certificates',
  WIOA:               '/wioa',

  // ── Compliance ───────────────────────────────────────────────────────────
  COMPLIANCE:         '/compliance',
  AUDIT_LOGS:         '/audit-logs',
  DOCUMENTS:          '/documents',
  DOCUMENT_CENTER:    '/documents',
  GOVERNANCE:         '/governance',

  // ── Analytics ────────────────────────────────────────────────────────────
  ANALYTICS:          '/analytics',
  REPORTS:            '/reports',

  // ── System ───────────────────────────────────────────────────────────────
  SETTINGS:           '/settings',
  SYSTEM_HEALTH:      '/system-health',
  SNAPSHOTS:          '/snapshots',
  AUTOMATION:         '/admin/studio/workflows',
  MONITORING:         '/monitoring',

  // ── Partners / growth ────────────────────────────────────────────────────
  PARTNERS:           '/partners',
  EMPLOYERS:          '/employers',
  CRM:                '/crm',
} as const;

export type AdminRoute = typeof ADMIN[keyof typeof ADMIN];

/** Resolve a potentially-aliased admin path to its canonical destination. */
export function resolveAdminRoute(path: string): string {
  const legacy = legacyAliasLookup.get(path);
  if (legacy) return legacy;
  return path;
}
