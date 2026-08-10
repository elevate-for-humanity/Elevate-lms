/**
 * Apprenticeship portal access compatibility helpers.
 * Canonical role definitions live in lib/rbac/role-matrix.ts.
 */
import {
  APPRENTICE_ROLES,
  HOST_SHOP_ROLES,
  hasAnyRole,
} from '@/lib/rbac/role-matrix';

export const APPRENTICE_FIELD_PORTAL_ROLES = Array.from(
  new Set([...APPRENTICE_ROLES, ...HOST_SHOP_ROLES]),
);

export const GENERAL_PORTAL_ROLES = APPRENTICE_ROLES;

const LEGACY_APPRENTICE_PORTAL_PATH_PREFIXES = [
  '/portal/barber',
  '/portal/cosmetology',
  '/portal/esthetician',
  '/portal/nail-technician',
  '/portal/culinary',
  '/portal/electrical',
  '/portal/plumbing',
] as const;

export function isApprenticeFieldPortalPath(pathname: string): boolean {
  if (pathname === '/apprentice' || pathname.startsWith('/apprentice/')) return true;
  return LEGACY_APPRENTICE_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function allowedRolesForPortalPath(pathname: string): readonly string[] {
  return isApprenticeFieldPortalPath(pathname)
    ? APPRENTICE_FIELD_PORTAL_ROLES
    : GENERAL_PORTAL_ROLES;
}

export function canAccessApprenticeTools(role: string | null | undefined): boolean {
  return hasAnyRole([role], APPRENTICE_FIELD_PORTAL_ROLES, { adminOverride: true });
}
