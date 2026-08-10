import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_ROLES,
  INSTRUCTOR_ROLES,
  PROGRAM_HOLDER_ROLES,
  hasAnyRole,
  hasPermission as roleHasPermission,
  normalizeRole,
  normalizeRoles,
  PERMISSIONS,
  type Permission,
  type UserRole,
} from '@/lib/rbac/role-matrix';

export type { UserRole } from '@/lib/rbac/role-matrix';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  allowedRoles?: readonly UserRole[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

export interface AuthGuardResult {
  user: any;
  profile: any;
  role: UserRole | null;
  effectiveRoles: UserRole[];
  isAuthenticated: boolean;
  isAuthorized: boolean;
}

async function resolveCurrentPath(): Promise<string> {
  const headersList = await headers();
  const rawUrl =
    headersList.get('x-pathname') ||
    headersList.get('x-url') ||
    headersList.get('x-invoke-path') ||
    headersList.get('referer') ||
    '';

  if (rawUrl) {
    try {
      const url = new URL(rawUrl, 'http://localhost');
      const returnPath = url.pathname + (url.search || '');
      if (returnPath) return returnPath;
    } catch {
      // fall through to cookie
    }
  }

  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('__efh_pathname');
    if (cookie?.value) return cookie.value;
  } catch {
    // cookies() can throw during prerender
  }

  return '';
}

async function loadEffectiveAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, profile: null, role: null, effectiveRoles: [] as UserRole[] };
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row?.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const role = normalizeRole(profile?.role);
  const effectiveRoles = normalizeRoles([role, ...secondaryRoles]);

  return { supabase, user, profile, role, effectiveRoles };
}

export async function authGuard(options: AuthGuardOptions = {}): Promise<AuthGuardResult> {
  const {
    requireAuth = true,
    allowedRoles = [],
    redirectTo = '/login',
    requireEmailVerified = false,
  } = options;

  const { user, profile, role, effectiveRoles } = await loadEffectiveAuth();

  if (requireAuth && !user) {
    let destination = redirectTo;
    if (redirectTo === '/login') {
      const currentPath = await resolveCurrentPath();
      if (currentPath && currentPath !== '/login') {
        destination = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    redirect(destination);
  }

  if (!user) {
    return {
      user: null,
      profile: null,
      role: null,
      effectiveRoles: [],
      isAuthenticated: false,
      isAuthorized: false,
    };
  }

  if (requireEmailVerified && !user.email_confirmed_at) redirect('/verify-email');

  const isAuthorized =
    allowedRoles.length === 0 ||
    hasAnyRole(effectiveRoles, allowedRoles, { adminOverride: true });

  if (requireAuth && !isAuthorized) redirect('/unauthorized');

  return {
    user,
    profile,
    role,
    effectiveRoles,
    isAuthenticated: true,
    isAuthorized,
  };
}

export async function requireAuth() {
  const { user } = await authGuard({ requireAuth: true });
  return user;
}

export async function requireAdmin() {
  const { user } = await authGuard({ requireAuth: true, allowedRoles: ADMIN_ROLES });
  return user;
}

export async function requireInstructor() {
  const { user } = await authGuard({ requireAuth: true, allowedRoles: INSTRUCTOR_ROLES });
  return user;
}

export async function requireStudent() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['student', 'learner'],
  });
  return user;
}

export async function requireProgramHolder() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: PROGRAM_HOLDER_ROLES,
  });
  return user;
}

export async function requireDelegate() {
  const { user } = await authGuard({ requireAuth: true, allowedRoles: ['delegate'] });
  return user;
}

export async function requireAdminOrDelegate() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['super_admin', 'admin', 'org_admin', 'delegate'],
  });
  return user;
}

export async function optionalAuth() {
  const { user } = await loadEffectiveAuth();
  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const { role } = await loadEffectiveAuth();
  return role;
}

export async function hasPermission(permission: string): Promise<boolean> {
  if (!(permission in PERMISSIONS)) return false;
  const { effectiveRoles } = await loadEffectiveAuth();
  return effectiveRoles.some((role) => roleHasPermission(role, permission as Permission));
}

export async function requirePermission(permission: string) {
  if (!(await hasPermission(permission))) redirect('/unauthorized');
  return true;
}

export async function canAccessCourse(courseId: string): Promise<boolean> {
  const { supabase, user, effectiveRoles } = await loadEffectiveAuth();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ['super_admin', 'admin'], { adminOverride: false })) return true;

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();
  if (enrollment) return true;

  if (!hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: false })) return false;
  const { data: course } = await supabase
    .from('lms_courses')
    .select('instructor_id')
    .eq('id', courseId)
    .maybeSingle();
  return course?.instructor_id === user.id;
}

export async function requireCourseAccess(courseId: string) {
  if (!(await canAccessCourse(courseId))) redirect('/lms/courses');
  return { hasAccess: true };
}

export async function canEditCourse(courseId: string): Promise<boolean> {
  const { supabase, user, effectiveRoles } = await loadEffectiveAuth();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ['super_admin', 'admin'], { adminOverride: false })) return true;
  if (!hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: false })) return false;

  const { data: course } = await supabase
    .from('lms_courses')
    .select('instructor_id')
    .eq('id', courseId)
    .maybeSingle();
  return course?.instructor_id === user.id;
}

export async function requireCourseEditAccess(courseId: string) {
  if (!(await canEditCourse(courseId))) redirect('/instructor/courses');
  return { canEdit: true };
}

export async function canAccessStudentData(studentId: string): Promise<boolean> {
  const { supabase, user, effectiveRoles } = await loadEffectiveAuth();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ['super_admin', 'admin'], { adminOverride: false })) return true;
  if (user.id === studentId) return true;
  if (!hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: false })) return false;

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('course_id')
    .eq('user_id', studentId)
    .not('course_id', 'is', null)
    .limit(1)
    .maybeSingle();
  if (!enrollment?.course_id) return false;

  const { data: course } = await supabase
    .from('lms_courses')
    .select('id')
    .eq('id', enrollment.course_id)
    .eq('instructor_id', user.id)
    .maybeSingle();
  return Boolean(course);
}

export async function requireStudentDataAccess(studentId: string) {
  if (!(await canAccessStudentData(studentId))) redirect('/unauthorized');
  return { hasAccess: true };
}

export async function apiAuthGuard(options: AuthGuardOptions = {}): Promise<{
  authorized: boolean;
  user: any;
  profile: any;
  role: UserRole | null;
  effectiveRoles: UserRole[];
  error?: string;
}> {
  const { requireAuth = true, allowedRoles = [], requireEmailVerified = false } = options;
  const { user, profile, role, effectiveRoles } = await loadEffectiveAuth();

  if (requireAuth && !user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      role: null,
      effectiveRoles: [],
      error: 'Authentication required',
    };
  }

  if (!user) {
    return {
      authorized: !requireAuth,
      user: null,
      profile: null,
      role: null,
      effectiveRoles: [],
    };
  }

  if (requireEmailVerified && !user.email_confirmed_at) {
    return {
      authorized: false,
      user,
      profile,
      role,
      effectiveRoles,
      error: 'Email verification required',
    };
  }

  const isAuthorized =
    allowedRoles.length === 0 ||
    hasAnyRole(effectiveRoles, allowedRoles, { adminOverride: true });

  return {
    authorized: isAuthorized,
    user,
    profile,
    role,
    effectiveRoles,
    ...(isAuthorized ? {} : { error: 'Insufficient permissions' }),
  };
}

export async function apiRequireAdmin() {
  const result = await apiAuthGuard({ requireAuth: true, allowedRoles: ADMIN_ROLES });
  if (!result.authorized) {
    return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
  }
  return result;
}

export async function apiRequireInstructor() {
  const result = await apiAuthGuard({ requireAuth: true, allowedRoles: INSTRUCTOR_ROLES });
  if (!result.authorized) {
    return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
  }
  return result;
}

export async function apiRequireStudent() {
  const result = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['student', 'learner'],
  });
  if (!result.authorized) {
    return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
  }
  return result;
}
