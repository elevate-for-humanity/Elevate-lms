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

/**
 * Maps every role to its canonical post-auth landing page.
 * Roles not listed here fall through to the student default.
 *
 * Each role lands directly on their operational portal so the first
 * screen they see is immediately relevant to their job.
 * /my-dashboard remains the hub they can always navigate back to.
 */
export const ROLE_DESTINATIONS: Record<string, string> = {
  // ── Platform admins ───────────────────────────────────────────────
  // Admin roles always land on the admin app, never the LMS
  super_admin: 'https://admin.elevateforhumanity.org/admin/dashboard',
  admin: 'https://admin.elevateforhumanity.org/admin/dashboard',
  org_admin: 'https://admin.elevateforhumanity.org/admin/dashboard',

  // ── Internal Elevate staff ────────────────────────────────────────
  staff: 'https://admin.elevateforhumanity.org/admin/staff-portal/dashboard',

  // ── Education staff ───────────────────────────────────────────────
  instructor: 'https://admin.elevateforhumanity.org/admin/instructor/dashboard',
  mentor: '/mentor/dashboard',
  creator: '/creator/products',

  // ── Workforce / case management ───────────────────────────────────
  case_manager: '/case-manager/dashboard',
  workforce_board: '/workforce-board/dashboard',

  // ── Program administration ────────────────────────────────────────
  program_holder: '/program-holder/dashboard',
  provider_admin: '/provider/dashboard',
  sponsor: '/employer/dashboard', // DOL apprenticeship sponsors — approve hours, manage apprenticeships

  // ── Employer & industry partners ─────────────────────────────────
  employer: '/employer/dashboard',
  partner: '/partner/dashboard', // smart-routes to /partner/attendance

  // ── Learners ──────────────────────────────────────────────────────
  student: '/learner/dashboard',

  // ── Family ────────────────────────────────────────────────────────
  // parent role handled via /parent-portal — no requireRole yet, falls through
  delegate: '/learner/dashboard', // delegate portal not yet built — falls back to learner dashboard


  // ── Grant clients ─────────────────────────────────────────────────
  grant_client: '/lms/dashboard', // grant-funded learner — lands in LMS, not public grants page
};

/**
 * Returns the canonical post-auth destination for a given role.
 * Falls back to /learner/dashboard for unknown roles.
 */
export function getRoleDestination(role: string | null | undefined): string {
  if (!role) return '/learner/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/learner/dashboard';
}
