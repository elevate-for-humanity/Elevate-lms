/**
 * Admin Route Guards - ECS/AWS Context
 * Controls access to dev/test tools and sensitive admin features.
 */

import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unauthorized, forbidden, serverError } from '@/lib/api/responses';
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

export type GuardedUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  effectiveRoles: string[];
  error?: NextResponse;
};

/**
 * Canonical API identity resolver. It reads both the primary profile role and
 * active secondary role assignments so API routes make the same authorization
 * decision as page/middleware guards.
 */
export async function apiAuthGuard(_req?: Request): Promise<GuardedUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { id: '', email: null, role: null, effectiveRoles: [], error: unauthorized() };
    }

    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    ]);

    if (profileResult.error) {
      return {
        id: user.id,
        email: user.email ?? null,
        role: null,
        effectiveRoles: [],
        error: serverError('PROFILE_LOOKUP_FAILED'),
      };
    }

    const secondaryRoles = (roleResult.data ?? [])
      .map((row: any) => row?.roles?.name)
      .filter((value: unknown): value is string => typeof value === 'string');
    const role = (profileResult.data?.role as UserRole) ?? null;
    const effectiveRoles = normalizeRoles([role, ...secondaryRoles]);

    return {
      id: user.id,
      email: user.email ?? null,
      role,
      effectiveRoles,
    };
  } catch {
    return { id: '', email: null, role: null, effectiveRoles: [], error: unauthorized() };
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

  return user;
}

const ADMIN_ROLES = API_ADMIN_ROLES;
const INSTRUCTOR_ROLES = _INSTRUCTOR_ROLES;

export async function apiRequireAdmin(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, ADMIN_ROLES);
}

export async function apiRequireInstructor(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, INSTRUCTOR_ROLES);
}

export async function apiRequireTestingCenter(request?: Request): Promise<GuardedUser> {
  return apiRequireRoles(request, TESTING_CENTER_ROLES);
}
