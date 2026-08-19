/**
 * Admin Route Guards
 * Controls access to dev/test tools and sensitive admin features.
 */

import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unauthorized, forbidden, serverError } from '@/lib/api/responses';
import {
  PRIVILEGED_MFA_ROLES,
  checkPrivilegedMfa,
  privilegedMfaEnforcementEnabled,
} from '@/lib/auth/privileged-mfa';
import {
  API_ADMIN_ROLES,
  INSTRUCTOR_ROLES as _INSTRUCTOR_ROLES,
  TESTING_CENTER_ROLES,
  hasAnyRole,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';

export type AdminRole = 'admin' | 'super_admin' | 'staff';

export const isProd = process.env.NODE_ENV === 'production';
export const isPreview = false;
export const isDev = !isProd;
export const allowDevTools = process.env.ENABLE_ADMIN_DEVTOOLS === 'true';

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

export function requireDevToolsAccess(role: string | null | undefined): void {
  if (isProd || !allowDevTools || !isSuperAdmin(role)) notFound();
}

export function requireSensitiveFeatureAccess(role: string | null | undefined): void {
  if (isProd && !isSuperAdmin(role)) notFound();
  if (!['admin', 'super_admin'].includes(role || '')) notFound();
}

export function getEnvironmentLabel(): { label: string; color: string } {
  if (isProd) return { label: 'PRODUCTION', color: 'bg-red-100 text-red-800 border-red-200' };
  if (isPreview) return { label: 'PREVIEW', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  return { label: 'DEVELOPMENT', color: 'bg-blue-100 text-blue-800 border-blue-200' };
}

export function shouldShowDevToolsInNav(role: string | null | undefined): boolean {
  if (isProd) return false;
  return allowDevTools && isSuperAdmin(role);
}

export const DEV_TOOL_ROUTES = [
  '/admin/test-emails',
  '/admin/test-funding',
  '/admin/test-payments',
  '/admin/test-webhook',
  '/admin/autopilot',
  '/admin/autopilots',
] as const;

export const SENSITIVE_ROUTES = [
  '/admin/course-generator',
  '/admin/program-generator',
  '/admin/syllabus-generator',
] as const;

export type { UserRole } from '@/lib/rbac/role-matrix';

type GuardIdentity = { id: string; email: string | null };

export type GuardedUser = {
  id: string;
  userId: string;
  user: GuardIdentity | null;
  email: string | null;
  role: UserRole | null;
  effectiveRoles: string[];
  error?: NextResponse;
};

function guardedIdentity(
  id: string,
  email: string | null,
  role: UserRole | null,
  effectiveRoles: string[],
  error?: NextResponse,
): GuardedUser {
  return {
    id,
    userId: id,
    user: id ? { id, email } : null,
    email,
    role,
    effectiveRoles,
    ...(error ? { error } : {}),
  };
}

/** Resolve the authenticated API caller using both the primary profile role and active secondary roles. */
export async function apiAuthGuard(_req?: Request): Promise<GuardedUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return guardedIdentity('', null, null, [], unauthorized());
    }

    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    ]);

    if (profileResult.error) {
      return guardedIdentity(
        user.id,
        user.email ?? null,
        null,
        [],
        serverError('PROFILE_LOOKUP_FAILED'),
      );
    }

    const secondaryRoles = (roleResult.data ?? [])
      .map((row: any) => row?.roles?.name)
      .filter((value: unknown): value is string => typeof value === 'string');
    const role = (profileResult.data?.role as UserRole) ?? null;
    const effectiveRoles = normalizeRoles([role, ...secondaryRoles]);

    return guardedIdentity(user.id, user.email ?? null, role, effectiveRoles);
  } catch {
    return guardedIdentity('', null, null, [], unauthorized());
  }
}

async function requirePrivilegedMfaIfEnabled(user: GuardedUser): Promise<NextResponse | null> {
  if (!privilegedMfaEnforcementEnabled()) return null;

  const isPrivileged = user.effectiveRoles.some((role) =>
    PRIVILEGED_MFA_ROLES.includes(role as UserRole),
  );
  if (!isPrivileged) return null;

  try {
    const supabase = await createClient();
    const result = await checkPrivilegedMfa(supabase, user.effectiveRoles);
    if (result.satisfied) return null;

    return NextResponse.json(
      {
        error: 'MFA_REQUIRED',
        message: 'Multi-factor authentication is required for privileged access.',
        currentLevel: result.currentLevel,
        nextLevel: result.nextLevel,
        mfaUrl: '/mfa',
      },
      { status: 403 },
    );
  } catch {
    return NextResponse.json(
      { error: 'MFA_CHECK_FAILED', message: 'Unable to verify multi-factor authentication.' },
      { status: 503 },
    );
  }
}

export async function apiRequireRoles(
  request: Request | undefined,
  allowedRoles: readonly UserRole[],
  options: { adminOverride?: boolean } = { adminOverride: true },
): Promise<GuardedUser> {
  const user = await apiAuthGuard(request);
  if (user.error) return user;
  if (!hasAnyRole(user.effectiveRoles, allowedRoles, options)) {
    return { ...user, error: forbidden() };
  }

  const mfaError = await requirePrivilegedMfaIfEnabled(user);
  if (mfaError) return { ...user, error: mfaError };

  return user;
}

export async function apiRequireAdmin(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, API_ADMIN_ROLES);
}

export async function apiRequireInstructor(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, _INSTRUCTOR_ROLES);
}

export async function apiRequireTestingCenter(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, TESTING_CENTER_ROLES);
}

export async function apiRequirePlatformStaff(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, API_ADMIN_ROLES);
}
