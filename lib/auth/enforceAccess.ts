/**
 * enforceAccess — tenant + role boundary enforcement
 *
 * Call this after fetching a resource to verify the requesting user is
 * allowed to see it. Returns a NextResponse error if access is denied,
 * or null if access is granted.
 *
 * Usage:
 *
 *   const deny = enforceAccess({ user, resourceTenantId: record.tenant_id, allowedRoles: ['staff', 'admin'] });
 *   if (deny) return deny;
 *
 * Rules:
 *   1. User must be authenticated.
 *   2. If allowedRoles is non-empty, user.role must be in the list.
 *   3. If resourceTenantId is set, user.tenant_id must match — unless user is a admin.
 *      Super-admins are platform-level and cross-tenant by design.
 */

import { NextResponse } from 'next/server';

export interface AccessUser {
  id: string;
  role: string;
  tenant_id?: string | null;
}

export interface EnforceAccessOptions {
  /** Authenticated user object from resolveUser / withApiProtection context. */
  user: AccessUser | null | undefined;
  /** tenant_id of the resource being accessed. Omit to skip tenant check. */
  resourceTenantId?: string | null;
  /** Roles that may access this resource. Empty = any authenticated user. */
  allowedRoles?: string[];
}

const SUPER_ADMIN_ROLES = new Set(['admin']);

export function enforceAccess({
  user,
  resourceTenantId,
  allowedRoles = [],
}: EnforceAccessOptions): NextResponse | null {
  // 1. Must be authenticated
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Role enforcement
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Tenant boundary — admin bypasses (platform-level access)
  if (resourceTenantId && !SUPER_ADMIN_ROLES.has(user.role)) {
    if (user.tenant_id !== resourceTenantId) {
      return NextResponse.json({ error: 'Cross-tenant access denied' }, { status: 403 });
    }
  }

  return null;
}
