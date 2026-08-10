/**
 * @deprecated Prefer resolveDashboardUrl() from '@/lib/routing/dashboard-resolver'.
 *
 * This compatibility module intentionally derives its values from the canonical
 * dashboard resolver so historical imports cannot drift into a second routing
 * table.
 */
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';
import { ALL_AUTHENTICATED_ROLES, type UserRole } from '@/lib/rbac/role-matrix';

function pathnameForRole(role: string): string {
  const resolved = resolveDashboardUrl(role);
  try {
    return new URL(resolved).pathname || '/lms/dashboard';
  } catch {
    return resolved.startsWith('/') ? resolved : '/lms/dashboard';
  }
}

/** @deprecated Compatibility export; values are generated from dashboard-resolver.ts. */
export const ROLE_DESTINATIONS: Record<string, string> = Object.fromEntries(
  ALL_AUTHENTICATED_ROLES.map((role) => [role, pathnameForRole(role)]),
);

/** @deprecated Use resolveDashboardUrl() when a cross-domain URL is required. */
export function getRoleDestination(role: UserRole | string | null | undefined): string {
  if (!role) return '/lms/dashboard';
  return pathnameForRole(role);
}

export type { UserRole };
