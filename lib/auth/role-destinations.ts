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
  // All roles land on the consolidated My Dashboard
  // which shows industry tabs based on role.
  super_admin:      '/my-dashboard',
  admin:            '/my-dashboard',
  org_admin:        '/my-dashboard',
  staff:            '/my-dashboard',
  instructor:       '/my-dashboard',
  mentor:           '/my-dashboard',
  case_manager:     '/my-dashboard',
  program_holder:   '/my-dashboard',
  delegate:         '/my-dashboard',
  provider_admin:   '/my-dashboard',
  partner:          '/my-dashboard',
  sponsor:          '/my-dashboard',
  employer:         '/my-dashboard',
  workforce_board:  '/my-dashboard',
  creator:          '/my-dashboard',
  student:          '/my-dashboard',

  // Tax / supersonic staff go directly to their tools
  vita_staff:       '/tax',
  supersonic_staff: '/supersonic-fast-cash',

  // Grant clients
  grant_client:     '/grants',
};

/**
 * Returns the canonical post-auth destination for a given role.
 * Falls back to /learner/dashboard for unknown roles.
 */
export function getRoleDestination(role: string | null | undefined): string {
  if (!role) return '/learner/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/learner/dashboard';
}
