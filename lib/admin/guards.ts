/**
 * Admin Route Guards - container runtime context
 * Controls access to dev/test tools and sensitive admin features
 */

import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unauthorized, forbidden, serverError } from '@/lib/api/responses';

// Re-export UserRole from the canonical role matrix
export type { UserRole } from '@/lib/rbac/role-matrix';
import type { UserRole } from '@/lib/rbac/role-matrix';

// ── Environment detection ─────────────────────────────────────────────────────
export const isProd = process.env.NODE_ENV === 'production';
export const allowDevTools = process.env.ENABLE_ADMIN_DEVTOOLS === 'true';

// ── Role checking ─────────────────────────────────────────────────────────────
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'staff';
}

// ── Dev tools access ──────────────────────────────────────────────────────────
export function requireDevToolsAccess(role: string | null | undefined): void {
  if (isProd) notFound();
  if (!allowDevTools) notFound();
  if (!isAdminRole(role)) notFound();
}

export function shouldShowDevToolsInNav(role: string | null | undefined): boolean {
  if (isProd) return false;
  return allowDevTools && isAdminRole(role);
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

// ── Guarded user type ─────────────────────────────────────────────────────────
export type GuardedUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  user?: { id: string; email?: string | null };
  profile?: Record<string, unknown>;
  error?: NextResponse;
};

// ── API guards ────────────────────────────────────────────────────────────────
export async function apiAuthGuard(_req?: Request): Promise<GuardedUser> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { id: '', email: null, role: null, error: unauthorized() };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { id: user.id, email: user.email ?? null, role: null, error: serverError('PROFILE_LOOKUP_FAILED') };
    }

    return { id: user.id, email: user.email ?? null, role: (profile?.role as UserRole) ?? null };
  } catch {
    return { id: '', email: null, role: null, error: unauthorized() };
  }
}

const ADMIN_ROLES: UserRole[] = ['admin', 'staff'];
const INSTRUCTOR_ROLES: UserRole[] = ['instructor', 'admin'];

export async function apiRequireAdmin(_req?: Request): Promise<GuardedUser> {
  const user = await apiAuthGuard(_req);
  if (user.error) return user;
  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    return { ...user, error: forbidden() };
  }
  return user;
}

export async function apiRequireInstructor(_req?: Request): Promise<GuardedUser> {
  const user = await apiAuthGuard(_req);
  if (user.error) return user;
  if (!user.role || !INSTRUCTOR_ROLES.includes(user.role)) {
    return { ...user, error: forbidden() };
  }
  return user;
}

// ── Environment label ─────────────────────────────────────────────────────────
export function getEnvironmentLabel(): { label: string; color: string } {
  if (isProd) return { label: 'PRODUCTION', color: 'bg-red-100 text-red-800 border-red-200' };
  return { label: 'DEVELOPMENT', color: 'bg-blue-100 text-blue-800 border-blue-200' };
}
