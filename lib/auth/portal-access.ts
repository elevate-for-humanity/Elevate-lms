import { requireRole, type AuthResult } from '@/lib/auth/require-role';
import type { PortalKey } from '@/lib/routing/portal-map';
import {
  ADMIN_ROLES,
  APPRENTICE_ROLES,
  EMPLOYER_ROLES,
  HOST_SHOP_ROLES,
  INSTRUCTOR_ROLES,
  PROGRAM_HOLDER_ROLES,
  STAFF_ROLES,
  TESTING_CENTER_ROLES,
  WORKFORCE_ROLES,
  ALL_AUTHENTICATED_ROLES,
  type UserRole,
} from '@/lib/rbac/role-matrix';

export interface PortalAccessContext extends AuthResult {
  portalKey: PortalKey;
  isPlatformAdmin: boolean;
  isStaffOperator: boolean;
  tenantId: string | null;
}

/**
 * Destination roles and access roles are intentionally separate.
 * A staff member may support an Employer/Provider portal without that portal
 * being the staff member's post-login destination. Regular `admin` remains the
 * highest active platform operator and is also honored by requireRole's global
 * admin override.
 */
const PORTAL_ACCESS_ROLES: Record<PortalKey, readonly UserRole[]> = {
  lms: ALL_AUTHENTICATED_ROLES,
  apprentice: APPRENTICE_ROLES,
  employer: EMPLOYER_ROLES,
  parent: ['parent', 'admin', 'staff'],
  workforce: WORKFORCE_ROLES,
  hostshop: HOST_SHOP_ROLES,
  programholder: PROGRAM_HOLDER_ROLES,
  creator: ['creator', 'admin'],
  admin: ADMIN_ROLES,
  instructor: INSTRUCTOR_ROLES,
  staff: STAFF_ROLES,
  testing: TESTING_CENTER_ROLES,
  workforceboard: ['workforce_board', 'workforce_board_admin', 'admin', 'org_admin', 'staff'],
  casemanager: ['case_manager', 'admin', 'staff'],
  provider: ['provider', 'provider_admin', 'admin', 'staff'],
};

export function getPortalAccessRoles(portalKey: PortalKey): readonly UserRole[] {
  return PORTAL_ACCESS_ROLES[portalKey];
}

export async function requirePortalAccess(portalKey: PortalKey): Promise<PortalAccessContext> {
  const auth = await requireRole(PORTAL_ACCESS_ROLES[portalKey]);
  const isPlatformAdmin = auth.effectiveRoles.includes('admin');
  const isStaffOperator = isPlatformAdmin || auth.effectiveRoles.includes('staff');

  return {
    ...auth,
    portalKey,
    isPlatformAdmin,
    isStaffOperator,
    tenantId: auth.profile.tenant_id ?? auth.profile.organization_id ?? null,
  };
}

/**
 * Resolve tenant scope without forcing platform admins into an arbitrary tenant.
 * Role users are always scoped to their own tenant. Platform admins may either
 * select a tenant explicitly or operate in platform-wide oversight mode.
 */
export function resolvePortalTenantScope(
  access: PortalAccessContext,
  requestedTenantId?: string | null,
): { tenantId: string | null; platformWide: boolean } {
  if (access.isPlatformAdmin) {
    const tenantId = requestedTenantId?.trim() || null;
    return { tenantId, platformWide: tenantId === null };
  }

  return { tenantId: access.tenantId, platformWide: false };
}
