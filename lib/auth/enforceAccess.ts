/**
 * @deprecated Compatibility access helper.
 *
 * New code should use the canonical RBAC/tenant guards directly. This shim is
 * retained only for historical imports and delegates role semantics to the
 * canonical role matrix so it cannot drift into a second authorization system.
 */

import { NextResponse } from 'next/server';
import { hasAnyRole, normalizeRole } from '@/lib/rbac/role-matrix';

export interface AccessUser {
  id: string;
  role: string;
  tenant_id?: string | null;
}

export interface EnforceAccessOptions {
  user: AccessUser | null | undefined;
  resourceTenantId?: string | null;
  allowedRoles?: readonly string[];
}

export function enforceAccess({
  user,
  resourceTenantId,
  allowedRoles = [],
}: EnforceAccessOptions): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = normalizeRole(user.role);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (allowedRoles.length > 0 && !hasAnyRole([role], allowedRoles, { adminOverride: true })) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (resourceTenantId && role !== 'super_admin' && user.tenant_id !== resourceTenantId) {
    return NextResponse.json({ error: 'Cross-tenant access denied' }, { status: 403 });
  }

  return null;
}
