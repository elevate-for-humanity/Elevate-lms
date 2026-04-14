/**
 * Canonical auth guards for pages and API routes.
 *
 * Pages (server components): requireAuth, requireAdmin, requireInstructorOrAdmin
 * API routes: apiRequireAuth, apiRequireAdmin, apiRequireInstructorOrAdmin
 *
 * All page guards redirect on failure. All API guards return NextResponse JSON.
 * Role is always read from the profiles table — never from JWT claims.
 */

// ─── Page guards (redirect on failure) ───────────────────────────────────────

export { requireRole } from '@/lib/auth/require-role';
export type { AuthResult } from '@/lib/auth/require-role';

import { requireRole } from '@/lib/auth/require-role';
import type { AuthResult } from '@/lib/auth/require-role';

export async function requireAuth(): Promise<AuthResult> {
  // Any authenticated user with any role
  return requireRole([
    'student',
    'admin',
    'super_admin',
    'staff',
    'instructor',
    'employer',
    'partner',
    'program_holder',
    'mentor',
    'org_admin',
  ]);
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireRole(['admin', 'super_admin', 'staff']);
}

export async function requireInstructorOrAdmin(): Promise<AuthResult> {
  return requireRole(['instructor', 'admin', 'super_admin', 'staff']);
}

// ─── API guards (return NextResponse on failure, never redirect) ──────────────

export { requireApiRole } from '@/lib/auth/require-api-role';
export type { ApiAuthResult } from '@/lib/auth/require-api-role';

import { requireApiRole } from '@/lib/auth/require-api-role';
import type { ApiAuthResult } from '@/lib/auth/require-api-role';
import { NextResponse } from 'next/server';

export async function apiRequireAuth(
  req?: Request,
): Promise<ApiAuthResult | NextResponse> {
  return requireApiRole([
    'student',
    'admin',
    'super_admin',
    'staff',
    'instructor',
    'employer',
    'partner',
    'program_holder',
    'mentor',
    'org_admin',
  ] as any);
}

export async function apiRequireAdmin(
  req?: Request,
): Promise<ApiAuthResult | NextResponse> {
  return requireApiRole(['admin', 'super_admin', 'staff'] as any);
}

export async function apiRequireInstructorOrAdmin(
  req?: Request,
): Promise<ApiAuthResult | NextResponse> {
  return requireApiRole(['instructor', 'admin', 'super_admin', 'staff'] as any);
}
