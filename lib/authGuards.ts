import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_ROLES,
  INSTRUCTOR_ROLES,
  PROGRAM_HOLDER_ROLES,
  hasAnyRole,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';

export type { UserRole } from '@/lib/rbac/role-matrix';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

export interface AuthGuardResult {
  user: any;
  profile: any;
  role: UserRole | null;
  effectiveRoles: string[];
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
      const u = new URL(rawUrl, 'http://localhost');
      const returnPath = u.pathname + (u.search || '');
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
    // cookies() can throw during static prerender
  }

  return '';
}

async function loadIdentity() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, profile: null, role: null, effectiveRoles: [] as string[] };
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = normalizeRoles([profile?.role, ...secondaryRoles]);

  return {
    supabase,
    user,
    profile,
    role: (profile?.role as UserRole | null) ?? null,
    effectiveRoles,
  };
}

export async function authGuard(options: AuthGuardOptions = {}): Promise<AuthGuardResult> {
  const {
    requireAuth = true,
    allowedRoles = [],
    redirectTo = '/login',
    requireEmailVerified = false,
  } = options;

  const identity = await loadIdentity();
  const { user, profile, role, effectiveRoles } = identity;

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
  const { user } = await authGuard({ requireAuth: true, allowedRoles: ['student'] });
  return user;
}

export async function requireProgramHolder() {
  const { user } = await authGuard({ requireAuth: true, allowedRoles: PROGRAM_HOLDER_ROLES });
  return user;
}

export async function requireDelegate() {
  const { user } = await authGuard({ requireAuth: true, allowedRoles: ['delegate'] });
  return user;
}

export async function requireAdminOrDelegate() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: [...ADMIN_ROLES, 'delegate'],
  });
  return user;
}

export async function optionalAuth() {
  const { user } = await loadIdentity();
  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const { role } = await loadIdentity();
  return role;
}

const LEGACY_PERMISSIONS: Partial<Record<UserRole, string[]>> = {
  admin: ['*'],
  super_admin: ['*'],
  staff: ['view_students', 'view_programs', 'view_analytics', 'manage_enrollments'],
  instructor: [
    'view_students',
    'grade_assignments',
    'manage_own_courses',
    'view_analytics',
    'send_messages',
    'create_quizzes',
    'manage_discussions',
  ],
  student: ['view_courses', 'submit_assignments', 'take_quizzes', 'join_discussions', 'view_own_progress'],
  program_holder: ['view_programs', 'manage_programs', 'view_students', 'view_analytics'],
  provider_admin: ['view_programs', 'manage_programs', 'view_students', 'view_analytics'],
  case_manager: ['view_students', 'view_programs', 'view_analytics', 'manage_enrollments'],
  employer: ['view_students', 'view_programs', 'view_analytics'],
  partner: ['view_programs', 'view_students', 'view_analytics'],
  delegate: ['view_programs', 'view_students', 'view_analytics', 'manage_enrollments'],
};

/** @deprecated Prefer hasPermission() from lib/rbac/role-matrix for named platform capabilities. */
export async function hasPermission(permission: string): Promise<boolean> {
  const { effectiveRoles } = await loadIdentity();
  if (!effectiveRoles.length) return false;
  if (effectiveRoles.includes('admin') || effectiveRoles.includes('super_admin')) return true;
  return effectiveRoles.some((role) => {
    const permissions = LEGACY_PERMISSIONS[role as UserRole] || [];
    return permissions.includes(permission);
  });
}

export async function requirePermission(permission: string) {
  if (!(await hasPermission(permission))) redirect('/unauthorized');
  return true;
}

export async function canAccessCourse(courseId: string): Promise<boolean> {
  const { supabase, user, effectiveRoles } = await loadIdentity();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ADMIN_ROLES, { adminOverride: true })) return true;

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .limit(1)
    .maybeSingle();
  if (enrollment) return true;

  if (!hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: true })) return false;
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
  const { supabase, user, effectiveRoles } = await loadIdentity();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ADMIN_ROLES, { adminOverride: true })) return true;
  if (!hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: true })) return false;

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
  const { supabase, user, effectiveRoles } = await loadIdentity();
  if (!user) return false;
  if (hasAnyRole(effectiveRoles, ADMIN_ROLES, { adminOverride: true })) return true;
  if (user.id === studentId) return true;

  if (hasAnyRole(effectiveRoles, ['instructor'], { adminOverride: true })) {
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
    return !!course;
  }

  return false;
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
  effectiveRoles: string[];
  error?: string;
}> {
  const { requireAuth = true, allowedRoles = [], requireEmailVerified = false } = options;
  const { user, profile, role, effectiveRoles } = await loadIdentity();

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

  if (requireAuth && !isAuthorized) {
    return {
      authorized: false,
      user,
      profile,
      role,
      effectiveRoles,
      error: 'Insufficient permissions',
    };
  }

  return { authorized: true, user, profile, role, effectiveRoles };
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
  const result = await apiAuthGuard({ requireAuth: true, allowedRoles: ['student'] });
  if (!result.authorized) {
    return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
  }
  return result;
}

// Compatibility module only. New code should import canonical guards/RBAC directly.
