/**
 * Admin Route Guards - Netlify Context Aware
 * Controls access to dev/test tools and sensitive admin features
 * 
 * Required Netlify env vars:
 * - Production: ENABLE_ADMIN_DEVTOOLS=false
 * - Deploy Previews: ENABLE_ADMIN_DEVTOOLS=true (optional)
 */

import { notFound } from 'next/navigation';

export type AdminRole = 'admin' | 'super_admin' | 'staff';

/**
 * Netlify context detection
 * CONTEXT values: "production" | "deploy-preview" | "branch-deploy" | "dev"
 */
const isNetlify = process.env.NETLIFY === 'true';
const netlifyContext = process.env.CONTEXT; // Netlify deploy context

/**
 * Environment detection - Netlify-aware
 */
export const isProd = isNetlify 
  ? netlifyContext === 'production' 
  : process.env.NODE_ENV === 'production';

export const isPreview = isNetlify 
  ? netlifyContext === 'deploy-preview' || netlifyContext === 'branch-deploy'
  : false;

export const isDev = !isProd && !isPreview;

/**
 * Dev tools access control
 * Server-side gating is what matters - keep NEXT_PUBLIC version false
 */
export const allowDevTools = process.env.ENABLE_ADMIN_DEVTOOLS === 'true';

/**
 * Check if user has super_admin role
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Guard for dev/test routes - STRICT
 * 
 * Rules:
 * 1. Production context → ALWAYS 404 (no exceptions)
 * 2. Non-production + ENABLE_ADMIN_DEVTOOLS=false → 404
 * 3. Non-production + ENABLE_ADMIN_DEVTOOLS=true → super_admin only
 * 
 * Usage in layout.tsx:
 *   const { role } = await requireAdmin();
 *   requireDevToolsAccess(role);
 */
export function requireDevToolsAccess(role: string | null | undefined): void {
  // Production = hard block for everyone, no exceptions
  if (isProd) {
    notFound();
  }

  // Non-production but dev tools disabled
  if (!allowDevTools) {
    notFound();
  }

  // Dev tools enabled but not super_admin
  if (!isSuperAdmin(role)) {
    notFound();
  }
}

/**
 * Guard for sensitive admin features (AI, automation, bulk operations)
 * Less restrictive than dev tools but still requires elevated access in prod
 */
export function requireSensitiveFeatureAccess(role: string | null | undefined): void {
  if (isProd && !isSuperAdmin(role)) {
    notFound();
  }
  
  if (!['admin', 'super_admin'].includes(role || '')) {
    notFound();
  }
}

/**
 * Get environment label for UI badge
 */
export function getEnvironmentLabel(): { label: string; color: string } {
  if (isProd) {
    return { label: 'PRODUCTION', color: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (isPreview) {
    return { label: 'PREVIEW', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }
  return { label: 'DEVELOPMENT', color: 'bg-blue-100 text-blue-800 border-blue-200' };
}

/**
 * Check if dev tools should be visible in navigation
 */
export function shouldShowDevToolsInNav(role: string | null | undefined): boolean {
  // Never show in production
  if (isProd) {
    return false;
  }
  
  // Non-prod: require both flag and super_admin
  return allowDevTools && isSuperAdmin(role);
}

/**
 * List of dev/test route prefixes that should be guarded
 */
export const DEV_TOOL_ROUTES = [
  '/admin/dev-studio',
  '/admin/test-emails',
  '/admin/test-funding',
  '/admin/test-payments',
  '/admin/test-webhook',
  '/admin/ai-console',
  '/admin/autopilot',
  '/admin/autopilots',
  '/admin/automation',
] as const;

/**
 * List of sensitive feature routes (require elevated access in prod)
 */
export const SENSITIVE_ROUTES = [
  '/admin/course-generator',
  '/admin/program-generator',
  '/admin/syllabus-generator',
] as const;

// =====================================================
// API ROUTE GUARDS (canonical — import from here, not from lib/authGuards)
// =====================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unauthorized, forbidden, serverError } from '@/lib/api/responses';

export type UserRole =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'super_admin'
  | 'staff'
  | 'program_holder'
  | 'provider_admin'
  | 'case_manager'
  | 'employer'
  | 'partner'
  | 'delegate';

export type GuardedUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  error?: NextResponse;
};

/**
 * Verify the request carries a valid Supabase session.
 * Throws a 401 NextResponse if not authenticated.
 * Throws a 500 NextResponse if the profile lookup fails.
 *
 * Usage (inside handleRoute):
 *   const user = await apiAuthGuard(req);
 */
export async function apiAuthGuard(_req?: Request): Promise<GuardedUser> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { id: '', email: null, role: null, error: unauthorized() };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { id: user.id, email: user.email ?? null, role: null, error: serverError('PROFILE_LOOKUP_FAILED') };
    }

    return {
      id: user.id,
      email: user.email ?? null,
      role: (profile?.role as UserRole) ?? null,
    };
  } catch (err) {
    return { id: '', email: null, role: null, error: unauthorized() };
  }
}

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'staff', 'org_admin'];
const INSTRUCTOR_ROLES: UserRole[] = ['instructor', 'admin', 'super_admin', 'staff'];

/**
 * Verify the request is from an admin, super_admin, or staff user.
 * Throws 401 if unauthenticated, 403 if authenticated but wrong role.
 *
 * Usage (inside handleRoute):
 *   const user = await apiRequireAdmin(req);
 */
export async function apiRequireAdmin(_req?: Request): Promise<GuardedUser> {
  const user = await apiAuthGuard(_req);
  if (user.error) return user;

  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    return { ...user, error: forbidden() };
  }

  return user;
}

/**
 * Verify the request is from an instructor, admin, super_admin, or staff user.
 * Throws 401 if unauthenticated, 403 if authenticated but wrong role.
 */
export async function apiRequireInstructor(_req?: Request): Promise<GuardedUser> {
  const user = await apiAuthGuard(_req);
  if (user.error) return user;

  if (!user.role || !INSTRUCTOR_ROLES.includes(user.role)) {
    return { ...user, error: forbidden() };
  }

  return user;
}
