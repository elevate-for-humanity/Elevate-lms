// lib/with-auth.ts
import { NextRequest } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import {
  ALL_AUTHENTICATED_ROLES,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';
import type { AuthedUser, AuthHandler, WithAuthOptions } from '@/types/auth';

/**
 * Wrap a Next.js route handler with the canonical API authorization boundary.
 *
 * Legacy Admin handlers still import withAuth, so this compatibility wrapper
 * deliberately delegates to apiRequireRoles instead of maintaining a second
 * session/RBAC implementation. That keeps effective-role normalization,
 * fail-closed 401/403 responses, and privileged MFA enforcement consistent
 * across both current and legacy API routes.
 */
export function withAuth<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>,
  options: WithAuthOptions = {},
) {
  return async (req: NextRequest, context?: { params?: Promise<TParams> }) => {
    const allowedRoles = options.roles?.length
      ? options.roles
      : ALL_AUTHENTICATED_ROLES;
    const guarded = await apiRequireRoles(req, allowedRoles);

    if (guarded.error) return guarded.error;

    const effectiveRoles = normalizeRoles(guarded.effectiveRoles);
    const role = guarded.role as UserRole | null;
    const user: AuthedUser = {
      id: guarded.id,
      email: guarded.email,
      role,
      effectiveRoles,
    };
    const params = context?.params
      ? await context.params
      : ({} as TParams);

    return handler(
      req,
      {
        params,
        user,
        id: user.id,
        email: user.email,
        role: user.role,
        effectiveRoles: user.effectiveRoles,
      },
      user,
    );
  };
}
