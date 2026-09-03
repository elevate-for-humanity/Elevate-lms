/**
 * LMS Route Configuration
 * Defines which roles can access which routes.
 * Admin is the single platform-wide privileged role.
 */

export type LMSRole = 'student' | 'instructor' | 'staff' | 'admin';

interface RouteConfig {
  path: string;
  allowedRoles: LMSRole[];
  requiresEnrollment?: boolean;
}

export const LMS_PROTECTED_ROUTES: RouteConfig[] = [
  { path: '/lms/admin', allowedRoles: ['admin'] },
  { path: '/lms/analytics', allowedRoles: ['admin', 'staff'] },

  { path: '/lms/courses/new', allowedRoles: ['instructor', 'admin'] },
  { path: '/lms/grading', allowedRoles: ['instructor', 'admin'] },
  { path: '/lms/roster', allowedRoles: ['instructor', 'staff', 'admin'] },

  { path: '/lms/attendance', allowedRoles: ['instructor', 'staff', 'admin'] },
  { path: '/lms/reports', allowedRoles: ['staff', 'admin'] },

  { path: '/lms/dashboard', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/courses', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/assignments', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/grades', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/certificates', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/progress', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/calendar', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/messages', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/portfolio', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/achievements', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/achievements', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
  { path: '/lms/leaderboard', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },
];

export function canAccessRoute(path: string, role: string): boolean {
  if (role === 'admin') return true;

  const routeConfig = LMS_PROTECTED_ROUTES.find(
    (r) => path === r.path || path.startsWith(r.path + '/'),
  );

  if (!routeConfig) return true;
  return routeConfig.allowedRoles.includes(role as LMSRole);
}

export function getUnauthorizedRedirect(role: string): string {
  switch (role) {
    case 'student':
      return '/lms/dashboard';
    case 'instructor':
      return '/lms/courses';
    case 'staff':
      return '/lms/roster';
    case 'admin':
      return '/lms/admin';
    default:
      return '/lms/dashboard';
  }
}
