import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type UserRole = 'student' | 'instructor' | 'admin' | 'program_holder' | 'delegate';

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
  isAuthenticated: boolean;
  isAuthorized: boolean;
}

// =====================================================
// CORE AUTH GUARDS
// =====================================================

/**
 * Comprehensive authentication guard for server components
 */
export async function authGuard(options: AuthGuardOptions = {}): Promise<AuthGuardResult> {
  const {
    requireAuth = true,
    allowedRoles = [],
    redirectTo = '/login',
    requireEmailVerified = false,
  } = options;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Check if authentication is required
  if (requireAuth && (!user || error)) {
    redirect(redirectTo);
  }

  if (!user) {
    return {
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      isAuthorized: false,
    };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role as UserRole | null;

  // Check email verification
  if (requireEmailVerified && !user.email_confirmed_at) {
    redirect('/verify-email');
  }

  // Check role authorization
  const isAuthorized = allowedRoles.length === 0 ||
    (role && allowedRoles.includes(role));

  if (requireAuth && !isAuthorized) {
    redirect('/unauthorized');
  }

  return {
    user,
    profile,
    role,
    isAuthenticated: true,
    isAuthorized,
  };
}

// =====================================================
// BASIC AUTH GUARDS
// =====================================================

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdmin() {
  const { user, role } = await authGuard({
    requireAuth: true,
    allowedRoles: ['admin'],
  });

  return user;
}

export async function requireInstructor() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['instructor', 'admin'],
  });

  return user;
}

export async function requireStudent() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['student'],
  });

  return user;
}

export async function requireProgramHolder() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['program_holder'],
  });

  return user;
}

export async function requireDelegate() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['delegate'],
  });

  return user;
}

export async function requireAdminOrDelegate() {
  const { user } = await authGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'delegate'],
  });

  return user;
}

export async function optionalAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile?.role as UserRole) || null;
}

// =====================================================
// PERMISSION SYSTEM
// =====================================================

const PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // All permissions
  instructor: [
    'view_students',
    'grade_assignments',
    'manage_own_courses',
    'view_analytics',
    'send_messages',
    'create_quizzes',
    'manage_discussions',
  ],
  student: [
    'view_courses',
    'submit_assignments',
    'take_quizzes',
    'join_discussions',
    'view_own_progress',
  ],
  program_holder: [
    'view_programs',
    'manage_programs',
    'view_students',
    'view_analytics',
  ],
  delegate: [
    'view_programs',
    'view_students',
    'view_analytics',
    'manage_enrollments',
  ],
};

export async function hasPermission(permission: string): Promise<boolean> {
  const role = await getUserRole();

  if (!role) return false;

  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const hasAccess = await hasPermission(permission);

  if (!hasAccess) {
    redirect('/unauthorized');
  }

  return true;
}

// =====================================================
// RESOURCE-SPECIFIC GUARDS
// =====================================================

/**
 * Check if user can access a specific course
 */
export async function canAccessCourse(courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const role = await getUserRole();

  // Admins can access all courses
  if (role === 'admin') return true;

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (enrollment) return true;

  // Check if user is the course instructor
  const { data: course } = await supabase
    .from('training_courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  return course?.instructor_id === user.id;
}

/**
 * Guard for course access
 */
export async function requireCourseAccess(courseId: string) {
  const hasAccess = await canAccessCourse(courseId);

  if (!hasAccess) {
    redirect('/courses');
  }

  return { hasAccess: true };
}

/**
 * Check if user can edit a course
 */
export async function canEditCourse(courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const role = await getUserRole();

  // Admins can edit all courses
  if (role === 'admin') return true;

  // Check if user is the course instructor
  const { data: course } = await supabase
    .from('training_courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  return course?.instructor_id === user.id;
}

/**
 * Guard for course editing
 */
export async function requireCourseEditAccess(courseId: string) {
  const canEdit = await canEditCourse(courseId);

  if (!canEdit) {
    redirect('/instructor/courses');
  }

  return { canEdit: true };
}

/**
 * Check if user can access student data
 */
export async function canAccessStudentData(studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const role = await getUserRole();

  // Admins can access all student data
  if (role === 'admin') return true;

  // Users can access their own data
  if (user.id === studentId) return true;

  // Instructors can access data of their enrolled students
  if (role === 'instructor') {
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('course_id, courses!inner(instructor_id)')
      .eq('user_id', studentId)
      .eq('courses.instructor_id', user.id)
      .single();

    return !!enrollment;
  }

  return false;
}

/**
 * Guard for student data access
 */
export async function requireStudentDataAccess(studentId: string) {
  const hasAccess = await canAccessStudentData(studentId);

  if (!hasAccess) {
    redirect('/unauthorized');
  }

  return { hasAccess: true };
}

// =====================================================
// API ROUTE GUARDS
// =====================================================

/**
 * Guard for API routes - returns response instead of redirecting
 */
export async function apiAuthGuard(options: AuthGuardOptions = {}): Promise<{
  authorized: boolean;
  user: any;
  profile: any;
  role: UserRole | null;
  error?: string;
}> {
  const {
    requireAuth = true,
    allowedRoles = [],
    requireEmailVerified = false,
  } = options;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (requireAuth && (!user || error)) {
    return {
      authorized: false,
      user: null,
      profile: null,
      role: null,
      error: 'Authentication required',
    };
  }

  if (!user) {
    return {
      authorized: !requireAuth,
      user: null,
      profile: null,
      role: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role as UserRole | null;

  if (requireEmailVerified && !user.email_confirmed_at) {
    return {
      authorized: false,
      user,
      profile,
      role,
      error: 'Email verification required',
    };
  }

  const isAuthorized = allowedRoles.length === 0 ||
    (role && allowedRoles.includes(role));

  if (requireAuth && !isAuthorized) {
    return {
      authorized: false,
      user,
      profile,
      role,
      error: 'Insufficient permissions',
    };
  }

  return {
    authorized: true,
    user,
    profile,
    role,
  };
}

/**
 * API guard for admin-only endpoints
 */
export async function apiRequireAdmin() {
  const result = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin'],
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return result;
}

/**
 * API guard for instructor-only endpoints
 */
export async function apiRequireInstructor() {
  const result = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['instructor', 'admin'],
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return result;
}

/**
 * API guard for student-only endpoints
 */
export async function apiRequireStudent() {
  const result = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['student'],
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return result;
}
