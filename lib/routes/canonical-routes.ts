import canonicalRoutesConfig from './canonical-routes.json';

export const canonicalRoutes = canonicalRoutesConfig.canonicalRoutes;
export const legacyRouteAliases = canonicalRoutesConfig.legacyAliases;
export const ecsOnlyRoutePrefixes = canonicalRoutesConfig.ecsOnlyPrefixes;
export const externalOrAppHostedAllowlist = canonicalRoutesConfig.externalOrAppHostedAllowlist;

export const legacyAliasLookup = new Map(
  legacyRouteAliases.map((alias) => [alias.source, alias.destination]),
);

// ── Admin canonical routes ────────────────────────────────────────────────────
// Single source of truth for all admin navigation, redirects, and workflows.
// ALL nav items, redirects, and action hrefs must reference these constants.
// Never hardcode /admin/* paths — import from here.

export const ADMIN = {
  // ── Operational ──────────────────────────────────────────────────────────
  MISSION_CONTROL:    '/admin/dashboard',
  OPERATIONS:         '/admin/operations',
  COMMAND_CENTER:     '/admin/dashboard',

  // ── People ───────────────────────────────────────────────────────────────
  STUDENTS:           '/admin/students',
  APPLICATIONS:       '/admin/applications',
  ENROLLMENTS:        '/admin/enrollments',
  AT_RISK:            '/admin/students?filter=at-risk',
  IMPERSONATE:        '/admin/impersonate',

  // ── Programs & Courses ───────────────────────────────────────────────────
  PROGRAMS:           '/admin/programs',
  COURSES:            '/admin/courses',
  COURSE_PIPELINE:    '/admin/studio',
  COURSE_BUILDER:     '/admin/studio',
  CURRICULUM:         '/admin/studio',

  // ── AI ───────────────────────────────────────────────────────────────────
  AI_STUDIO:          '/admin/studio',
  AI_CONSOLE:         '/admin/studio',         // alias → ai-studio
  DEV_STUDIO:         '/admin/dashboard', // legacy name → dashboard command center

  // ── Finance ──────────────────────────────────────────────────────────────
  FUNDING:            '/admin/funding',
  PAYMENTS:           '/admin/payments',
  CERTIFICATES:       '/admin/certificates',
  WIOA:               '/admin/wioa',

  // ── Compliance ───────────────────────────────────────────────────────────
  COMPLIANCE:         '/admin/compliance',
  AUDIT_LOGS:         '/admin/audit-logs',
  DOCUMENTS:          '/admin/documents',
  DOCUMENT_CENTER:    '/admin/document-center',
  GOVERNANCE:         '/admin/governance',

  // ── Analytics ────────────────────────────────────────────────────────────
  ANALYTICS:          '/admin/analytics',
  REPORTS:            '/admin/reports',

  // ── System ───────────────────────────────────────────────────────────────
  SETTINGS:           '/admin/settings',
  SYSTEM_HEALTH:      '/admin/system-health',
  SNAPSHOTS:          '/admin/snapshots',
  AUTOMATION:         '/admin/workflows',
  MONITORING:         '/admin/monitoring',

  // ── Partners ─────────────────────────────────────────────────────────────
  PARTNERS:           '/admin/partners',
  EMPLOYERS:          '/admin/employers',
  CRM:                '/admin/crm',
} as const;

export type AdminRoute = typeof ADMIN[keyof typeof ADMIN];

/** Resolve a potentially-aliased admin path to its canonical destination. */
export function resolveAdminRoute(path: string): string {
  // Check legacy alias map first
  const legacy = legacyAliasLookup.get(path);
  if (legacy) return legacy;
  // Return as-is if already canonical
  return path;
}

