/**
 * Server-only auth gate for protected pages and layouts.
 *
 * Usage:
 *   const user = await requireUser()                          // any authenticated user
 *   const user = await requireUser({ allowedRoles: ['admin'] }) // role-restricted
 *
 * Redirects to /login?redirect=<path> when unauthenticated.
 * Redirects to /unauthorized when authenticated but wrong role.
 *
 * This is the single server-side gate. Do not add client-side
 * router.push('/login') guards on pages covered by this function
 * or by the proxy.ts middleware perimeter.
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getRoleDestination } from '@/lib/auth/role-destinations';

// Must stay in sync with UserRole in lib/auth/role-destinations.ts
export type AppRole =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'super_admin'
  | 'org_admin'
  | 'staff'
  | 'program_holder'
  | 'delegate'
  | 'partner'
  | 'sponsor'
  | 'employer'
  | 'mentor'
  | 'creator'
  | 'workforce_board'
  | 'case_manager'
  | 'provider_admin'
  | 'grant_client'

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole | null;
  profile: Record<string, unknown>;
};

/**
 * Resolves the current path from headers set by proxy.ts.
 * Falls back to /login if the path cannot be determined.
 */
async function currentPath(): Promise<string> {
  const headersList = await headers();
  const raw =
    headersList.get('x-pathname') ||
    headersList.get('x-url') ||
    headersList.get('x-invoke-path') ||
    '';
  if (!raw) return '/login';
  try {
    const u = new URL(raw, 'http://localhost');
    return u.pathname + (u.search || '');
  } catch {
    return '/login';
  }
}

export async function requireUser(options?: {
  allowedRoles?: AppRole[];
  redirectTo?: string;
}): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const path =
      options?.redirectTo ?? `/login?redirect=${encodeURIComponent(await currentPath())}`;
    redirect(path);
  }

  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const role = (profile?.role ?? null) as AppRole | null;

  if (options?.allowedRoles?.length) {
    if (!role || !options.allowedRoles.includes(role)) {
      redirect(getRoleDestination(role));
    }
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    profile: profile ?? {},
  };
}
