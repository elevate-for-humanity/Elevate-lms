/**
 * Declared access policy for every protected surface.
 *
 * This is the source of truth for audits and the route-audit admin page.
 * It is NOT enforcement — enforcement happens in each page/route handler.
 *
 * Policies:
 *   public              — no auth required
 *   authenticated       — any logged-in user
 *   admin               — admin | super_admin | staff
 *   instructor_or_admin — instructor | admin | super_admin | staff
 */

export type AccessPolicy =
  | 'public'
  | 'authenticated'
  | 'admin'
  | 'instructor_or_admin';

export const ROUTE_POLICY: Record<string, AccessPolicy> = {
  // ── Admin ──────────────────────────────────────────────────────────────────
  '/admin': 'admin',
  '/admin/dashboard': 'admin',
  '/admin/applications': 'admin',
  '/admin/applications/review/[id]': 'admin',
  '/admin/courses': 'admin',
  '/admin/courses/[courseId]': 'admin',
  '/admin/curriculum': 'admin',
  '/admin/enrollments': 'admin',
  '/admin/gradebook': 'admin',
  '/admin/programs': 'admin',
  '/admin/security/route-audit': 'admin',
  '/admin/students': 'admin',
  '/admin/users': 'admin',

  // ── Admin API ──────────────────────────────────────────────────────────────
  '/api/admin/applications': 'admin',
  '/api/admin/applications/[id]': 'admin',
  '/api/admin/applications/[id]/approve': 'admin',
  '/api/admin/applications/[id]/approve-and-grant': 'admin',
  '/api/admin/applications/[id]/confirm-workone': 'admin',
  '/api/admin/applications/[id]/readiness': 'admin',
  '/api/admin/applications/[id]/revoke': 'admin',
  '/api/admin/applications/transition': 'admin',
  '/api/admin/enrollments': 'admin',
  '/api/admin/programs': 'admin',
  '/api/admin/users/role': 'admin',
  '/api/admin/users/update-role': 'admin',
  '/api/admin/users/update-status': 'admin',
  '/api/audit/export': 'admin',
  '/api/rapids/update': 'admin',
  '/api/rapids/safe-update': 'admin',
  '/api/funding/admin/confirm': 'admin',
  '/api/reporting/dol-dwd': 'admin',
  '/api/analytics/metrics/dol-dwd': 'admin',
  '/api/cash-advances/applications': 'admin',
  '/api/cash-advances/applications/[id]/approve': 'admin',
  '/api/partner/applications/[id]/deny': 'admin',

  // ── Instructor ─────────────────────────────────────────────────────────────
  '/instructor/dashboard': 'instructor_or_admin',
  '/instructor/review-submissions': 'instructor_or_admin',
  '/instructor/review-submissions/[id]': 'instructor_or_admin',
  '/api/instructor/step-submissions/[id]/approve': 'instructor_or_admin',
  '/api/instructor/step-submissions/[id]/reject': 'instructor_or_admin',

  // ── Authenticated (any logged-in user) ─────────────────────────────────────
  '/learner/dashboard': 'authenticated',
  '/lms': 'authenticated',
  '/lms/programs': 'authenticated',
  '/lms/courses': 'authenticated',
  '/lms/courses/[courseId]': 'authenticated',
  '/lms/courses/[courseId]/lessons/[lessonId]': 'authenticated',
  '/onboarding/learner': 'authenticated',
  '/api/onboarding/learner': 'authenticated',
  '/api/partner-launch/[enrollmentId]': 'authenticated',
  '/api/xapi': 'authenticated',
  '/api/analytics/events': 'authenticated',

  // ── Public ─────────────────────────────────────────────────────────────────
  '/': 'public',
  '/apply': 'public',
  '/api/apply': 'public',
  '/api/apply/simple': 'public',
  '/api/contact': 'public',
  '/api/health': 'public',
  '/api/verify': 'public',
  '/api/credentials/verify': 'public',
  '/api/programs/featured': 'public',
  '/api/waitlist': 'public',
  '/api/programs/cdl/waitlist': 'public',
  '/api/ai-tutor/public': 'public',
  '/api/blog': 'public',
  '/api/track-usage': 'public',
  '/api/billing/report-usage': 'public', // internal-secret protected
  '/api/internal/program-proof/[slug]': 'public', // internal-secret protected
};
