/**
 * Apprenticeship portal access — keep in sync with proxy.ts PROTECTED_ROUTES
 * for /portal/{barber,cosmetology,...} and /apprentice/.
 */

export const APPRENTICE_FIELD_PORTAL_ROLES = [
  'student',
  'partner',
  'program_holder',
  'admin',
  'admin',
  'staff',
  'instructor',
] as const;

export const GENERAL_PORTAL_ROLES = [
  'student',
  'admin',
  'admin',
  'staff',
  'instructor',
] as const;

const APPRENTICE_PORTAL_PATH_PREFIXES = [
  '/portal/barber',
  '/portal/cosmetology',
  '/portal/esthetician',
  '/portal/nail-technician',
  '/portal/culinary',
  '/portal/electrical',
  '/portal/plumbing',
] as const;

export function isApprenticeFieldPortalPath(pathname: string): boolean {
  return APPRENTICE_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function allowedRolesForPortalPath(pathname: string): readonly string[] {
  return isApprenticeFieldPortalPath(pathname)
    ? APPRENTICE_FIELD_PORTAL_ROLES
    : GENERAL_PORTAL_ROLES;
}

export function canAccessApprenticeTools(role: string | null | undefined): boolean {
  return !!role && (APPRENTICE_FIELD_PORTAL_ROLES as readonly string[]).includes(role);
}
