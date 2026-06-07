/**
 * @deprecated Import getRoleDestination from '@/lib/auth/role-destinations' instead.
 * Thin wrapper kept for UserMenu and legacy imports.
 */
import { getRoleDestination, ROLE_DESTINATIONS } from '@/lib/auth/role-destinations';
import type { UserRole } from '@/types/user';

/** @deprecated Use ROLE_DESTINATIONS from role-destinations.ts */
export const DASHBOARD_ROUTES = ROLE_DESTINATIONS as Record<UserRole, string>;

export function getDashboardUrl(role?: UserRole): string {
  if (!role) return '/unauthorized?reason=unknown_role';
  const destination = getRoleDestination(role);
  if (destination === '/learner/dashboard' && !(role in ROLE_DESTINATIONS)) {
    return '/unauthorized?reason=unknown_role';
  }
  return destination;
}
