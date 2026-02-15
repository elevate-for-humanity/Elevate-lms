// =====================================================
// AUTHENTICATION & AUTHORIZATION UTILITIES
// =====================================================

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';
import { logger } from '@/lib/logger';

// =====================================================
// BUILD-TIME CLIENT (No cookies, for generateStaticParams)
// =====================================================

export function createBuildTimeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// =====================================================
// SERVER-SIDE AUTH
// =====================================================

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

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// Alias for compatibility with old code using createRouteHandlerClient
// Old API: createRouteHandlerClient({ cookies })
// New API: createServerSupabaseClient() - cookies are handled internally
export async function createRouteHandlerClient(_options?: Record<string, any>) {
  return await createServerSupabaseClient();
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  
  if (!supabase) {
    return null;
  }
  
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error('Error getting session', error as Error);
      return null;
    }

    return session;
  } catch (error) {
    logger.error('Exception getting session', error as Error);
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
    .single();

  if (error) {
    logger.error('Error fetching profile', error as Error, { userId: session.user.id });
    return null;
  }

  return {
    ...session.user,
    profile,
  };
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.profile?.role || null;
}

// =====================================================
// GET AUTH USER (for API routes)
// =====================================================

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: profile.role as UserRole,
      full_name: profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : undefined,
    };
  } catch (error) { /* Error handled silently */ 
    logger.error('Error getting auth user', error as Error);
    return null;
  }
}

// =====================================================
// DEMO MODE - DISABLED IN PRODUCTION
// =====================================================

// Demo mode is permanently disabled for compliance
// All users must authenticate through proper channels
function isDemoMode(): boolean {
  return false; // NEVER enable demo mode in production
}

// =====================================================
// ROLE CHECKING
// =====================================================

/**
 * Custom error class for API authentication failures
 */
export class APIAuthError extends Error {
  constructor(message: string = 'Auth session missing!') {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Require auth for API routes - throws APIAuthError instead of redirecting
 * Use this in API routes instead of requireAuth()
 */
export async function requireApiAuth() {
  // DEMO MODE: Return mock session
  if (isDemoMode()) {
    return DEMO_SESSION;
  }
  
  const session = await getSession();
  if (!session) {
    throw new APIAuthError('Auth session missing!');
  }
  return session;
}

/**
 * Require auth for pages - redirects to login if not authenticated
 */
export async function requireAuth() {
  // DEMO MODE: Return mock session
  if (isDemoMode()) {
    return DEMO_SESSION;
  }
  
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  // DEMO MODE: Return admin role
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'admin' as UserRole };
  }
  
  const session = await requireAuth();
  const role = await getUserRole();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!role || !roles.includes(role)) {
    redirect('/unauthorized');
  }

  return { session, role };
}

export async function requireStudent() {
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'student' as UserRole };
  }
  return requireRole('student');
}

export async function requireAdmin() {
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'admin' as UserRole };
  }
  // Allow admin, super_admin, and staff roles to access admin panel
  return requireRole(['admin', 'super_admin', 'staff']);
}

export async function requireProgramHolder() {
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'program_holder' as UserRole };
  }
  return requireRole('program_holder');
}

export async function requireDelegate() {
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'delegate' as UserRole };
  }
  return requireRole('delegate');
}

export async function requireAdminOrDelegate() {
  if (isDemoMode()) {
    return { session: DEMO_SESSION, role: 'admin' as UserRole };
  }
  return requireRole(['admin', 'delegate']);
}

// =====================================================
// PERMISSION CHECKS
// =====================================================

export async function canAccessStudent(studentId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const role = user.profile?.role;

  // Admins can access all students
  if (role === 'admin') return true;

  // Students can only access their own data
  if (role === 'student') {
    return user.id === studentId;
  }

  // Delegates can access their assigned students
  if (role === 'delegate') {
    const supabase = await createServerSupabaseClient();
    const { data }: any = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('delegate_id', user.id)
      .single();

    return !!data;
  }

  // Program holders can access their enrolled students
  if (role === 'program_holder') {
    const supabase = await createServerSupabaseClient();
    const { data }: any = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('program_holder_id', user.profile.id)
      .single();

    return !!data;
  }

  return false;
}

export async function canAccessEnrollment(
  enrollmentId: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createServerSupabaseClient();
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('student_id, delegate_id, program_holder_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return false;

  const role = user.profile?.role;

  // Admins can access all enrollments
  if (role === 'admin') return true;

  // Students can access their own enrollments
  if (role === 'student' && enrollment.student_id === user.id) return true;

  // Delegates can access their assigned enrollments
  if (role === 'delegate' && enrollment.delegate_id === user.id) return true;

  // Program holders can access their enrollments
  if (
    role === 'program_holder' &&
    enrollment.program_holder_id === user.profile.id
  )
    return true;

  return false;
}

// =====================================================
// SIGN OUT
// =====================================================

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
