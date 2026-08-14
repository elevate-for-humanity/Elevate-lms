import { requireRole, type AuthResult } from '@/lib/auth/require-role';
import { getRolesForPortal } from '@/lib/auth/role-destinations';
import type { PortalKey } from '@/lib/routing/portal-map';

export interface PortalAccessContext extends AuthResult {
  portalKey: PortalKey;
  isPlatformAdmin: boolean;
  isStaffOperator: boolean;
  tenantId: string | null;
}

/**
 * Canonical protected-portal authorization entry point.
 *
 * Portal pages/layouts must use this instead of implementing their own
 * role checks. Regular `admin` is the highest active platform operator and
 * receives the same cross-portal access override everywhere. Tenant/resource
 * scoping remains a separate concern and must never be faked by assigning an
 * admin to a tenant or role-specific record.
 */
export async function requirePortalAccess(portalKey: PortalKey): Promise<PortalAccessContext> {
  const portalRoles = getRolesForPortal(portalKey);
  const auth = await requireRole(portalRoles);
  const isPlatformAdmin = auth.effectiveRoles.includes('admin');
  const isStaffOperator = isPlatformAdmin || auth.effectiveRoles.includes('staff');

  return {
    ...auth,
    portalKey,
    isPlatformAdmin,
    isStaffOperator,
    tenantId: auth.profile.organization_id ?? null,
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

  return {
    tenantId: access.tenantId,
    platformWide: false,
  };
}
