/**
 * Canonical Route Registry
 *
 * Single source of truth for route classification across the entire app.
 * Every portal, auth flow, and learner path has exactly one canonical URL.
 *
 * Classifications:
 *   canonical    — the correct, permanent URL for this resource
 *   alias        — an alternate name that resolves to the canonical (same content, different slug)
 *   legacy       — an old URL that must redirect; the page file should be deleted after redirect is live
 *   redirect     — a convenience path that forwards to canonical
 *   experimental — feature-flagged or in-progress; not yet canonical
 */

export type RouteClassification =
  | 'canonical'
  | 'alias'
  | 'legacy'
  | 'redirect'
  | 'experimental'

export interface CanonicalRoute {
  route: string
  system: string
  classification: RouteClassification
  canonicalTarget?: string
  notes?: string
}

export const CANONICAL_ROUTES: CanonicalRoute[] = [
  // LEARNER / LMS
  { route: '/lms/dashboard', system: 'lms', classification: 'canonical' },
  { route: '/lms/courses', system: 'lms', classification: 'canonical' },
  { route: '/lms/courses/[courseId]', system: 'lms', classification: 'canonical' },
  { route: '/lms/courses/[courseId]/lessons/[lessonId]', system: 'lms', classification: 'canonical' },
  { route: '/lms/courses/[courseId]/certification', system: 'lms', classification: 'canonical' },
  { route: '/lms/programs', system: 'lms', classification: 'canonical' },
  { route: '/lms/certificates', system: 'lms', classification: 'canonical' },
  { route: '/lms/assignments', system: 'lms', classification: 'canonical' },
  { route: '/lms/grades', system: 'lms', classification: 'canonical' },
  { route: '/lms/messages', system: 'lms', classification: 'canonical' },
  { route: '/lms/settings', system: 'lms', classification: 'canonical' },
  { route: '/dashboard', system: 'lms', classification: 'redirect', canonicalTarget: '/lms/dashboard', notes: 'Role-based router; keep page file — it reads role and redirects' },
  { route: '/my-dashboard', system: 'lms', classification: 'redirect', canonicalTarget: '/lms/dashboard', notes: 'Legacy learner dashboard alias' },
  { route: '/learner/dashboard', system: 'lms', classification: 'redirect', canonicalTarget: '/lms/dashboard', notes: 'Legacy learner-specific dashboard alias; /lms/dashboard is the single canonical learner dashboard' },
  { route: '/dashboards', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/dashboard', notes: 'Portal directory page' },
  { route: '/courses', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses' },
  { route: '/hvac/lesson/[lessonId]', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses/[courseId]/lessons/[lessonId]' },
  { route: '/career-services/courses', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses' },
  { route: '/career-services/courses/[slug]', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses/[courseId]' },
  { route: '/career-services/courses/[slug]/learn', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses/[courseId]/lessons/[lessonId]' },
  { route: '/career-services/courses/my-courses', system: 'lms', classification: 'legacy', canonicalTarget: '/lms/courses' },
  { route: '/lms/courses/[courseId]/complete', system: 'lms', classification: 'redirect', canonicalTarget: '/lms/courses/[courseId]/certification' },

  // AUTH
  { route: '/login', system: 'auth', classification: 'canonical' },
  { route: '/signup', system: 'auth', classification: 'canonical' },
  { route: '/reset-password', system: 'auth', classification: 'canonical' },
  { route: '/verify-email', system: 'auth', classification: 'canonical' },
  { route: '/auth/set-password', system: 'auth', classification: 'canonical' },
  { route: '/unauthorized', system: 'auth', classification: 'canonical' },
  { route: '/admin-login', system: 'auth', classification: 'alias', canonicalTarget: '/login' },
  { route: '/forgot-password', system: 'auth', classification: 'alias', canonicalTarget: '/reset-password' },
  { route: '/auth/forgot-password', system: 'auth', classification: 'redirect', canonicalTarget: '/reset-password' },
  { route: '/auth/reset-password', system: 'auth', classification: 'redirect', canonicalTarget: '/reset-password' },
  { route: '/auth/verify-email', system: 'auth', classification: 'redirect', canonicalTarget: '/verify-email' },
  { route: '/reset', system: 'auth', classification: 'legacy', canonicalTarget: '/reset-password' },
  { route: '/update-password', system: 'auth', classification: 'alias', canonicalTarget: '/auth/set-password' },

  // EMPLOYER
  { route: '/employer', system: 'employer', classification: 'canonical' },
  { route: '/employer/dashboard', system: 'employer', classification: 'canonical' },
  { route: '/employer/jobs', system: 'employer', classification: 'canonical' },
  { route: '/employer/candidates', system: 'employer', classification: 'canonical' },
  { route: '/employer/analytics', system: 'employer', classification: 'canonical' },
  { route: '/employer/company', system: 'employer', classification: 'canonical' },
  { route: '/employer/settings', system: 'employer', classification: 'canonical' },
  { route: '/employer/wotc', system: 'employer', classification: 'canonical' },
  { route: '/employer/placements', system: 'employer', classification: 'canonical' },
  { route: '/employer/opportunities', system: 'employer', classification: 'canonical' },
  { route: '/employer-portal', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/dashboard' },
  { route: '/employer-portal/dashboard', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/dashboard' },
  { route: '/employer-portal/jobs', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/jobs' },
  { route: '/employer-portal/applications', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/applications' },
  { route: '/employer-portal/candidates', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/candidates' },
  { route: '/employer-portal/analytics', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/analytics' },
  { route: '/employer-portal/company', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/company' },
  { route: '/employer-portal/settings', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/settings' },
  { route: '/employer-portal/wotc', system: 'employer', classification: 'legacy', canonicalTarget: '/employer/wotc' },

  // PARTNER
  { route: '/partner/dashboard', system: 'partner', classification: 'canonical' },
  { route: '/partner/hours', system: 'partner', classification: 'canonical' },
  { route: '/partner/attendance', system: 'partner', classification: 'canonical' },
  { route: '/partner/documents', system: 'partner', classification: 'canonical' },
  { route: '/partner/students', system: 'partner', classification: 'canonical' },
  { route: '/partner/settings', system: 'partner', classification: 'canonical' },
  { route: '/partner/programs', system: 'partner', classification: 'canonical' },
  { route: '/partners/dashboard', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/dashboard' },
  { route: '/partners/hours', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/hours' },
  { route: '/partners/attendance', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/attendance' },
  { route: '/partners/documents', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/documents' },
  { route: '/partners/students', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/students' },
  { route: '/partners/login', system: 'partner', classification: 'legacy', canonicalTarget: '/login' },
  { route: '/partner-portal', system: 'partner', classification: 'legacy', canonicalTarget: '/partner/dashboard' },

  // PROGRAM HOLDER
  { route: '/program-holder/dashboard', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/students', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/programs', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/reports', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/compliance', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/settings', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/sign-mou', system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/onboarding', system: 'program-holder', classification: 'canonical' },
  { route: '/programs/admin', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/dashboard', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/grades', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/grades' },
  { route: '/programs/admin/mou', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/mou' },
  { route: '/programs/admin/sign-mou', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/sign-mou' },
  { route: '/programs/admin/settings', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/settings' },
  { route: '/programs/admin/training', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/training' },
  { route: '/programs/admin/how-to-use', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/how-to-use' },
  { route: '/programs/admin/courses/create', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/courses/create' },
  { route: '/programs/admin/portal', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/portal/attendance', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/portal/live-qa', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/support' },
  { route: '/programs/admin/portal/messages', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/support' },
  { route: '/programs/admin/portal/students', system: 'program-holder', classification: 'legacy', canonicalTarget: '/program-holder/students' },

  // ADMIN
  { route: '/admin', system: 'admin', classification: 'canonical', notes: 'Admin origin/control plane' },

  // ENROLLMENT / APPLY
  { route: '/apply', system: 'enrollment', classification: 'canonical' },
  { route: '/apply/student', system: 'enrollment', classification: 'canonical' },
  { route: '/apply/employer', system: 'enrollment', classification: 'canonical' },
  { route: '/apply/program-holder', system: 'enrollment', classification: 'canonical' },
  { route: '/apply/success', system: 'enrollment', classification: 'canonical' },
  { route: '/enroll/[programId]', system: 'enrollment', classification: 'canonical' },
  { route: '/enroll/payment', system: 'enrollment', classification: 'canonical' },
  { route: '/enroll/success', system: 'enrollment', classification: 'canonical' },
  { route: '/enrollment', system: 'enrollment', classification: 'legacy', canonicalTarget: '/apply', notes: 'Legacy enrollment landing; applications begin at /apply' },
  { route: '/enrollment/confirmed', system: 'enrollment', classification: 'canonical', notes: 'Enrollment state machine' },
  { route: '/enrollment/orientation', system: 'enrollment', classification: 'canonical', notes: 'Enrollment state machine' },
  { route: '/enrollment/documents', system: 'enrollment', classification: 'canonical', notes: 'Enrollment state machine' },

  // CHECKOUT / PAYMENT
  { route: '/checkout', system: 'checkout', classification: 'canonical' },
  { route: '/checkout/[program]', system: 'checkout', classification: 'canonical' },
  { route: '/checkout/success', system: 'checkout', classification: 'canonical' },
  { route: '/store/checkout', system: 'checkout', classification: 'canonical' },
  { route: '/store/checkout/[slug]', system: 'checkout', classification: 'canonical' },
  { route: '/lms/payments', system: 'checkout', classification: 'canonical' },
  { route: '/payment', system: 'checkout', classification: 'alias', canonicalTarget: '/checkout' },
  { route: '/payment/success', system: 'checkout', classification: 'alias', canonicalTarget: '/checkout/success' },
  { route: '/payment/cancel', system: 'checkout', classification: 'alias', canonicalTarget: '/checkout' },
  { route: '/pay', system: 'checkout', classification: 'legacy', canonicalTarget: '/checkout' },

  // CERTIFICATES / VERIFICATION
  { route: '/verify/[certificateId]', system: 'certificates', classification: 'canonical' },
  { route: '/verify', system: 'certificates', classification: 'canonical' },
  { route: '/lms/certificates', system: 'certificates', classification: 'canonical' },
  { route: '/certificates', system: 'certificates', classification: 'legacy', canonicalTarget: '/lms/certificates' },
  { route: '/certificates/[certificateId]', system: 'certificates', classification: 'legacy', canonicalTarget: '/verify/[certificateId]' },
  { route: '/certificates/verify/[certificateId]', system: 'certificates', classification: 'legacy', canonicalTarget: '/verify/[certificateId]' },
  { route: '/verify-credentials', system: 'certificates', classification: 'legacy', canonicalTarget: '/verify' },

  // LICENSING / STORE
  { route: '/store/licenses', system: 'store', classification: 'canonical' },
  { route: '/store/licenses/[slug]', system: 'store', classification: 'canonical' },
  { route: '/store', system: 'store', classification: 'canonical' },
  { route: '/license', system: 'store', classification: 'alias', canonicalTarget: '/store/licenses' },
  { route: '/licenses', system: 'store', classification: 'alias', canonicalTarget: '/store/licenses' },
  { route: '/licensing', system: 'store', classification: 'alias', canonicalTarget: '/store/licenses' },
  { route: '/store/licensing', system: 'store', classification: 'legacy', canonicalTarget: '/store/licenses' },

  // ORPHAN / EXPERIMENTAL PAGES
  { route: '/dev/barber-preview', system: 'dev', classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/dev/hvac-preview', system: 'dev', classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/dev/slide-preview', system: 'dev', classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/rise', system: 'orphan', classification: 'experimental', notes: 'Verify before deleting' },
  { route: '/elevatelearn2earn', system: 'orphan', classification: 'experimental', notes: 'Campaign page — verify if still active' },
  { route: '/connect', system: 'orphan', classification: 'experimental', notes: 'Verify before deleting' },
  { route: '/client-portal', system: 'orphan', classification: 'experimental', notes: 'No clear role — verify before deleting' },
]
