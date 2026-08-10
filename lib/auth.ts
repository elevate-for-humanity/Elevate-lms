// =====================================================
// AUTHENTICATION & AUTHORIZATION UTILITIES
// =====================================================

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import type { UserRole } from '@/lib/rbac/role-matrix';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function createBuildTimeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Server Supabase client using the current @supabase/ssr cookie contract.
 * Middleware owns request-boundary refreshes for Admin/LMS. When a route handler
 * is allowed to write cookies, setAll persists them; Server Components may not
 * mutate cookies, so that case is intentionally ignored after middleware has
 * synchronized the session.
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Auth] Missing Supabase env vars. Auth features disabled.');
    }
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Expected in Server Components. Middleware propagates refreshed
          // cookies before protected Admin/LMS pages execute.
        }
      },
    },
  });
}

export async function createRouteHandlerClient(_options?: Record<string, any>) {
  return await createServerSupabaseClient();
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (error && error.name !== 'AuthSessionMissingError') {
        logger.error('Error getting session', error as Error);
      }
      return null;
    }

    // getSession is a local cookie read after getUser has validated the identity.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;

    return {
      user,
      access_token: '',
      refresh_token: '',
      expires_in: 0,
      token_type: 'bearer' as const,
    } as any;
  } catch (error) {
    const errName = (error as any)?.name || '';
    if (errName !== 'AuthSessionMissingError') {
      logger.error('Exception getting session', error as Error);
    }
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching profile', error as Error, { userId: session.user.id });
    return null;
  }

  return { ...session.user, profile };
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return (user?.profile?.role as UserRole | null | undefined) ?? null;
}

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const session = await getSession();
    if (!session?.user) return null;

    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile) return null;

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: profile.role as UserRole,
      full_name:
        profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : undefined,
    };
  } catch (error) {
    logger.error('Error getting auth user', error as Error);
    return null;
  }
}

export class APIAuthError extends Error {
  constructor(message: string = 'Auth session missing!') {
    super(message);
    this.name = 'APIError';
  }
}

export async function requireApiAuth() {
  const session = await getSession();
  if (!session) throw new APIAuthError('Auth session missing!');
  return session;
}

export async function requireAuth(redirectTo?: string, loginBase?: string) {
  const session = await getSession();
  if (!session) {
    const base = loginBase ?? process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
    const loginUrl = redirectTo
      ? `${base}/login?redirect=${encodeURIComponent(redirectTo)}`
      : `${base}/login`;
    redirect(loginUrl);
  }
  return session;
}

export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  redirectTo?: string,
  loginBase?: string,
) {
  const session = await requireAuth(redirectTo, loginBase);
  const role = await getUserRole();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!role || !roles.includes(role)) redirect('/unauthorized');
  return { session, role };
}

export async function requireStudent() {
  return requireRole('student');
}

export async function requireAdmin() {
  const adminUrl = getAdminUrl();
  return requireRole(['admin', 'super_admin', 'staff', 'org_admin'], '/admin/dashboard', adminUrl);
}

export async function requireProgramHolder() {
  return requireRole('program_holder');
}

export async function requireDelegate() {
  return requireRole('delegate');
}

export async function requireAdminOrDelegate() {
  return requireRole(['admin', 'delegate']);
}

export async function canAccessStudent(studentId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const role = user.profile?.role as UserRole | undefined;
  if (role === 'admin' || role === 'super_admin') return true;
  if (role === 'student') return user.id === studentId;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  // program_enrollments identifies learners by user_id. Historical helpers that
  // queried a nonexistent student_id silently denied valid delegate/holder access.
  if (role === 'delegate') {
    const { data } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('user_id', studentId)
      .eq('delegate_id', user.id)
      .limit(1)
      .maybeSingle();
    return !!data;
  }

  if (role === 'program_holder') {
    const { data } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('user_id', studentId)
      .eq('program_holder_id', user.profile.id)
      .limit(1)
      .maybeSingle();
    return !!data;
  }

  return false;
}

export async function canAccessEnrollment(enrollmentId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('user_id, delegate_id, program_holder_id')
    .eq('id', enrollmentId)
    .maybeSingle();

  if (!enrollment) return false;
  const role = user.profile?.role as UserRole | undefined;
  if (role === 'admin' || role === 'super_admin') return true;
  if (role === 'student' && enrollment.user_id === user.id) return true;
  if (role === 'delegate' && enrollment.delegate_id === user.id) return true;
  if (role === 'program_holder' && enrollment.program_holder_id === user.profile.id) return true;
  return false;
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  redirect(`${mainSiteUrl}/login`);
}
