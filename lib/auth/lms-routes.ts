/**
 * LMS Route Configuration
 * Defines which roles can access which routes
 */

export type LMSRole = 'student' | 'instructor' | 'staff' | 'admin' | 'super_admin';

interface RouteConfig {
  path: string;
  allowedRoles: LMSRole[];
  requiresEnrollment?: boolean;
}

// Routes that require specific roles beyond basic authentication
export const LMS_PROTECTED_ROUTES: RouteConfig[] = [
  // Admin-only routes
  { path: '/lms/admin', allowedRoles: ['admin', 'super_admin'] },
  { path: '/lms/analytics', allowedRoles: ['admin', 'super_admin', 'staff'] },

  // Instructor routes
  { path: '/lms/courses/new', allowedRoles: ['instructor', 'admin', 'super_admin'] },
  { path: '/lms/grading', allowedRoles: ['instructor', 'admin', 'super_admin'] },
  { path: '/lms/roster', allowedRoles: ['instructor', 'staff', 'admin', 'super_admin'] },

  // Staff routes
  { path: '/lms/attendance', allowedRoles: ['instructor', 'staff', 'admin', 'super_admin'] },
  { path: '/lms/reports', allowedRoles: ['staff', 'admin', 'super_admin'] },

  // Student routes (most LMS pages)
  {
    path: '/lms/dashboard',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/courses',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/assignments',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  { path: '/lms/grades', allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'] },
  {
    path: '/lms/certificates',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/progress',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/calendar',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/messages',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/portfolio',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  { path: '/lms/badges', allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'] },
  {
    path: '/lms/achievements',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
  {
    path: '/lms/leaderboard',
    allowedRoles: ['student', 'instructor', 'staff', 'admin', 'super_admin'],
  },
];

/**
 * Check if a role can access a given path
 */
export function canAccessRoute(path: string, role: string): boolean {
  // Super admin can access everything
  if (role === 'super_admin') return true;

  // Find matching route config
  const routeConfig = LMS_PROTECTED_ROUTES.find(
    (r) => path === r.path || path.startsWith(r.path + '/'),
  );

  // If no specific config, allow authenticated users
  if (!routeConfig) return true;

  return routeConfig.allowedRoles.includes(role as LMSRole);
}

/**
 * Get the redirect path for unauthorized access
 */
export function getUnauthorizedRedirect(role: string): string {
  switch (role) {
    case 'student':
      return '/lms/dashboard';
    case 'instructor':
      return '/lms/courses';
    case 'staff':
      return '/lms/roster';
    case 'admin':
    case 'super_admin':
      return '/lms/admin';
    default:
      return '/lms/dashboard';
  }
}
