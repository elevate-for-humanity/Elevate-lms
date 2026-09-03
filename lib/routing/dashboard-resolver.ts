/**
 * Dashboard resolution helpers.
 *
 * Role ownership and destinations live in `lib/auth/role-destinations.ts`.
 * This module intentionally contains no independent role/URL table.
 */

import {
  getRoleDestinationUrl,
  getRoleLabel as getCanonicalRoleLabel,
  getRolePortalKey,
} from '@/lib/auth/role-destinations';

export function resolveDashboardUrl(
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  return getRoleDestinationUrl(role, effectiveRoles);
}

export function getPortalKeyForRole(
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  return getRolePortalKey(role, effectiveRoles);
}

export function getRoleLabel(role: string | null | undefined): string {
  return getCanonicalRoleLabel(role);
}
