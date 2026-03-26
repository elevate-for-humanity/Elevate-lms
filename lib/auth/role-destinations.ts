/**
 * Canonical post-authentication destination by role.
 *
 * This is the single source of truth for where each role lands after:
 *   - login
 *   - signup / onboarding completion
 *   - payment success
 *   - email CTAs
 *   - protected-route fallback
 *   - /dashboard role-router
 *   - /api/auth/landing
 *
 * Rules:
 *   - Never hardcode a destination path outside this file.
 *   - Import getRoleDestination() wherever a post-auth redirect is needed.
 *   - The `redirect` query param always takes priority over the role default
 *     (validated via lib/auth/validate-redirect.ts before use).
 */

export type UserRole =
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
  | 'vita_staff'
  | 'supersonic_staff';

/**
 * Maps every role to its canonical post-auth landing page.
 * Roles not listed here fall through to the student default.
 */
export const ROLE_DESTINATIONS: Record<string, string> = {
  // Admin tier
  super_admin:    '/admin/dashboard',
  admin:          '/admin/dashboard',
  org_admin:      '/admin/dashboard',

  // Operations
  staff:          '/staff-portal/dashboard',
  instructor:     '/instructor/dashboard',
  mentor:         '/mentor/dashboard',
  case_manager:   '/case-manager/dashboard',

  // Program holders
  program_holder: '/program-holder/dashboard',
  delegate:       '/program-holder/dashboard',
  provider_admin: '/provider/dashboard',

  // External partners
  partner:        '/partner-portal',
  sponsor:        '/partner-portal',
  employer:       '/employer/dashboard',
  workforce_board:'/workforce-board/dashboard',

  // Content creators
  creator:        '/creator/dashboard',

  // Tax / supersonic staff
  vita_staff:     '/tax',
  supersonic_staff: '/supersonic-fast-cash',

  // Grant clients
  grant_client:   '/grants',

  // Students (default)
  student:        '/learner/dashboard',
};

/**
 * Returns the canonical post-auth destination for a given role.
 * Falls back to /learner/dashboard for unknown roles.
 */
export function getRoleDestination(role: string | null | undefined): string {
  if (!role) return '/learner/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/learner/dashboard';
}
