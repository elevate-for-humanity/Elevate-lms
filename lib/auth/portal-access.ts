import { requireRole, type AuthResult } from '@/lib/auth/require-role';
import { PORTAL_MAP, type PortalKey } from '@/lib/routing/portal-map';
import type { UserRole } from '@/lib/rbac/role-matrix';

export interface PortalAccessContext extends AuthResult {
  portalKey: PortalKey;
  isPlatformAdmin: boolean;
  isStaffOperator: boolean;
  tenantId: string | null;
}

export function getPortalAccessRoles(portalKey: PortalKey): readonly UserRole[] {
  return PORTAL_MAP[portalKey].accessRoles;
}

export async function requirePortalAccess(portalKey: PortalKey): Promise<PortalAccessContext> {
  const auth = await requireRole(getPortalAccessRoles(portalKey));
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
