import { APPRENTICE_ROLES, hasAnyRole, normalizeRole } from '@/lib/rbac/role-matrix';

/**
 * Compatibility helper for apprenticeship routes. Legacy /portal/<trade>
 * paths are redirects only; authorization is owned by the canonical
 * APPRENTICE_ROLES set and the /apprentice runtime.
 */
export const APPRENTICE_FIELD_PORTAL_ROLES = APPRENTICE_ROLES;
export const GENERAL_PORTAL_ROLES = APPRENTICE_ROLES;

const LEGACY_APPRENTICE_PORTAL_PATH_PREFIXES = [
  '/apprentice?program=barber-apprenticeship',
  '/apprentice?program=cosmetology-apprenticeship',
  '/apprentice?program=esthetician-apprenticeship',
  '/apprentice?program=nail-technician-apprenticeship',
  '/apprentice?program=culinary-apprenticeship',
  '/apprentice?program=electrical',
  '/apprentice?program=plumbing',
] as const;

export function isApprenticeFieldPortalPath(pathname: string): boolean {
  if (pathname === '/apprentice' || pathname.startsWith('/apprentice/')) return true;
  return LEGACY_APPRENTICE_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function allowedRolesForPortalPath(_pathname: string): readonly string[] {
  return APPRENTICE_ROLES;
}

export function canAccessApprenticeTools(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized ? hasAnyRole([normalized], APPRENTICE_ROLES, { adminOverride: true }) : false;
}
