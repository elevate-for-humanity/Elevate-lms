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
 *   redirect     — a convenience path that forwards to canonical (e.g. /dashboard → /lms/dashboard)
 *   experimental — feature-flagged or in-progress; not yet canonical
 *
 * How redirects are applied:
 *   1. next.config.mjs reads lib/routes/canonical-routes.json for static redirects (legacyAliases)
 *   2. proxy.ts handles middleware-level redirects for auth-gated paths
 *   3. This file provides the typed registry for scripts/route-audit.ts and scripts/route-governance-check.ts
 *
 * To add a new redirect:
 *   1. Add the entry here with classification: "legacy" or "redirect"
 *   2. Add the corresponding entry to lib/routes/canonical-routes.json legacyAliases
 *   3. Run: pnpm route:audit to verify no duplicate page files remain
 *   4. Delete the old page.tsx file once the redirect is confirmed live
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

  // ============================================================
  // LEARNER / LMS
  // ============================================================
  { route: '/lms/dashboard',                          system: 'lms',            classification: 'canonical' },
  { route: '/lms/courses',                            system: 'lms',            classification: 'canonical' },
  { route: '/lms/courses/[courseId]',                 system: 'lms',            classification: 'canonical' },
  { route: '/lms/courses/[courseId]/lessons/[lessonId]', system: 'lms',         classification: 'canonical' },
  { route: '/lms/courses/[courseId]/certification',   system: 'lms',            classification: 'canonical' },
  { route: '/lms/programs',                           system: 'lms',            classification: 'canonical' },
  { route: '/lms/certificates',                       system: 'lms',            classification: 'canonical' },
  { route: '/lms/assignments',                        system: 'lms',            classification: 'canonical' },
  { route: '/lms/grades',                             system: 'lms',            classification: 'canonical' },
  { route: '/lms/messages',                           system: 'lms',            classification: 'canonical' },
  { route: '/lms/settings',                           system: 'lms',            classification: 'canonical' },

  // Learner dashboard aliases — all redirect to /lms/dashboard
  { route: '/dashboard',                              system: 'lms',            classification: 'redirect',     canonicalTarget: '/lms/dashboard',        notes: 'Role-based router; keep page file — it reads role and redirects' },
  { route: '/my-dashboard',                           system: 'lms',            classification: 'redirect',     canonicalTarget: '/learner/dashboard',     notes: 'next.config.mjs redirect in place' },
  { route: '/learner/dashboard',                      system: 'lms',            classification: 'canonical',    notes: 'Learner-specific dashboard; /my-dashboard redirects here' },
  { route: '/dashboards',                             system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/dashboard',         notes: 'Portal directory page — next.config.mjs redirects /dashboards/:path* → /lms/:path*' },

  // Legacy course paths
  { route: '/courses',                                system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses',           notes: 'Root-level courses list; superseded by /lms/courses' },
  { route: '/hvac/lesson/[lessonId]',                 system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses/[courseId]/lessons/[lessonId]', notes: 'Standalone HVAC lesson — superseded by LMS engine' },
  { route: '/career-services/courses',                system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses',           notes: 'Duplicates LMS course views' },
  { route: '/career-services/courses/[slug]',         system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses/[courseId]', notes: 'Duplicates LMS course detail' },
  { route: '/career-services/courses/[slug]/learn',   system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses/[courseId]/lessons/[lessonId]', notes: 'Duplicates LMS lesson player' },
  { route: '/career-services/courses/my-courses',     system: 'lms',            classification: 'legacy',       canonicalTarget: '/lms/courses',           notes: 'Duplicates LMS my courses' },

  // LMS course completion alias
  { route: '/lms/courses/[courseId]/complete',        system: 'lms',            classification: 'redirect',     canonicalTarget: '/lms/courses/[courseId]/certification' },

  // ============================================================
  // AUTH
  // ============================================================
  { route: '/login',                                  system: 'auth',           classification: 'canonical' },
  { route: '/signup',                                 system: 'auth',           classification: 'canonical' },
  { route: '/reset-password',                         system: 'auth',           classification: 'canonical' },
  { route: '/verify-email',                           system: 'auth',           classification: 'canonical' },
  { route: '/auth/set-password',                      system: 'auth',           classification: 'canonical' },
  { route: '/unauthorized',                           system: 'auth',           classification: 'canonical' },

  // Auth aliases — next.config.mjs redirects these
  { route: '/admin-login',                            system: 'auth',           classification: 'alias',        canonicalTarget: '/login',                 notes: 'Real 113-line admin auth form — keep page, add redirect in next.config.mjs if desired' },
  { route: '/forgot-password',                        system: 'auth',           classification: 'alias',        canonicalTarget: '/reset-password',        notes: 'Duplicate of /reset-password' },
  { route: '/auth/forgot-password',                   system: 'auth',           classification: 'redirect',     canonicalTarget: '/reset-password',        notes: 'next.config.mjs redirect in place' },
  { route: '/auth/reset-password',                    system: 'auth',           classification: 'redirect',     canonicalTarget: '/reset-password' },
  { route: '/auth/verify-email',                      system: 'auth',           classification: 'redirect',     canonicalTarget: '/verify-email',          notes: 'next.config.mjs redirect in place' },
  { route: '/reset',                                  system: 'auth',           classification: 'legacy',       canonicalTarget: '/reset-password',        notes: 'Duplicate reset flow' },
  { route: '/update-password',                        system: 'auth',           classification: 'alias',        canonicalTarget: '/auth/set-password' },

  // ============================================================
  // EMPLOYER
  // ============================================================
  { route: '/employer',                               system: 'employer',       classification: 'canonical' },
  { route: '/employer/dashboard',                     system: 'employer',       classification: 'canonical' },
  { route: '/employer/jobs',                          system: 'employer',       classification: 'canonical' },
  { route: '/employer/candidates',                    system: 'employer',       classification: 'canonical' },
  { route: '/employer/analytics',                     system: 'employer',       classification: 'canonical' },
  { route: '/employer/company',                       system: 'employer',       classification: 'canonical' },
  { route: '/employer/settings',                      system: 'employer',       classification: 'canonical' },
  { route: '/employer/wotc',                          system: 'employer',       classification: 'canonical' },
  { route: '/employer/placements',                    system: 'employer',       classification: 'canonical' },
  { route: '/employer/opportunities',                 system: 'employer',       classification: 'canonical' },

  // employer-portal/* → /employer/* — next.config.mjs redirects in place
  { route: '/employer-portal',                        system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/dashboard',    notes: 'next.config.mjs redirect in place' },
  { route: '/employer-portal/dashboard',              system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/dashboard' },
  { route: '/employer-portal/jobs',                   system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/jobs' },
  { route: '/employer-portal/applications',           system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/applications' },
  { route: '/employer-portal/candidates',             system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/candidates' },
  { route: '/employer-portal/analytics',              system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/analytics' },
  { route: '/employer-portal/company',                system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/company' },
  { route: '/employer-portal/settings',               system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/settings' },
  { route: '/employer-portal/wotc',                   system: 'employer',       classification: 'legacy',       canonicalTarget: '/employer/wotc' },

  // ============================================================
  // PARTNER
  // ============================================================
  { route: '/partner/dashboard',                      system: 'partner',        classification: 'canonical' },
  { route: '/partner/hours',                          system: 'partner',        classification: 'canonical' },
  { route: '/partner/attendance',                     system: 'partner',        classification: 'canonical' },
  { route: '/partner/documents',                      system: 'partner',        classification: 'canonical' },
  { route: '/partner/students',                       system: 'partner',        classification: 'canonical' },
  { route: '/partner/settings',                       system: 'partner',        classification: 'canonical' },
  { route: '/partner/programs',                       system: 'partner',        classification: 'canonical' },

  // (partner)/partners/* route group — duplicates /partner/*
  { route: '/partners/dashboard',                     system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/dashboard',     notes: 'Route group (partner)/partners/ duplicates /partner/' },
  { route: '/partners/hours',                         system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/hours' },
  { route: '/partners/attendance',                    system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/attendance' },
  { route: '/partners/documents',                     system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/documents' },
  { route: '/partners/students',                      system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/students' },
  { route: '/partners/login',                         system: 'partner',        classification: 'legacy',       canonicalTarget: '/login' },
  { route: '/partner-portal',                         system: 'partner',        classification: 'legacy',       canonicalTarget: '/partner/dashboard',     notes: 'Orphan single page' },

  // ============================================================
  // PROGRAM HOLDER
  // ============================================================
  { route: '/program-holder/dashboard',               system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/students',                system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/programs',                system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/reports',                 system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/compliance',              system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/settings',                system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/sign-mou',                system: 'program-holder', classification: 'canonical' },
  { route: '/program-holder/onboarding',              system: 'program-holder', classification: 'canonical' },

  // programs/admin/* — fully duplicated by program-holder/*
  { route: '/programs/admin',                         system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/dashboard',               system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/grades',                  system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/grades' },
  { route: '/programs/admin/mou',                     system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/mou' },
  { route: '/programs/admin/sign-mou',                system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/sign-mou' },
  { route: '/programs/admin/settings',                system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/settings' },
  { route: '/programs/admin/training',                system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/training' },
  { route: '/programs/admin/how-to-use',              system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/how-to-use' },
  { route: '/programs/admin/courses/create',          system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/courses/create' },
  { route: '/programs/admin/portal',                  system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/portal/attendance',       system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/dashboard' },
  { route: '/programs/admin/portal/live-qa',          system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/support' },
  { route: '/programs/admin/portal/messages',         system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/support' },
  { route: '/programs/admin/portal/students',         system: 'program-holder', classification: 'legacy',       canonicalTarget: '/program-holder/students' },

  // ============================================================
  // ADMIN
  // ============================================================
  { route: '/admin',                                  system: 'admin',          classification: 'canonical',    notes: 'Proxied to  by proxy.ts' },

  // ============================================================
  // ENROLLMENT / APPLY
  // ============================================================
  { route: '/apply',                                  system: 'enrollment',     classification: 'canonical' },
  { route: '/apply/student',                          system: 'enrollment',     classification: 'canonical' },
  { route: '/apply/employer',                         system: 'enrollment',     classification: 'canonical' },
  { route: '/apply/program-holder',                   system: 'enrollment',     classification: 'canonical' },
  { route: '/apply/success',                          system: 'enrollment',     classification: 'canonical' },
  { route: '/enroll/[programId]',                     system: 'enrollment',     classification: 'canonical' },
  { route: '/enroll/payment',                         system: 'enrollment',     classification: 'canonical' },
  { route: '/enroll/success',                         system: 'enrollment',     classification: 'canonical' },

  // enrollment/* — duplicates enroll/*
  { route: '/enrollment',                             system: 'enrollment',     classification: 'legacy',       canonicalTarget: '/enroll',                notes: 'Duplicate of /enroll' },
  { route: '/enrollment/confirmed',                   system: 'enrollment',     classification: 'canonical',    notes: 'Used by proxy.ts enrollment state machine — keep' },
  { route: '/enrollment/orientation',                 system: 'enrollment',     classification: 'canonical',    notes: 'Used by proxy.ts enrollment state machine — keep' },
  { route: '/enrollment/documents',                   system: 'enrollment',     classification: 'canonical',    notes: 'Used by proxy.ts enrollment state machine — keep' },

  // ============================================================
  // CHECKOUT / PAYMENT
  // ============================================================
  { route: '/checkout',                               system: 'checkout',       classification: 'canonical',    notes: 'Program enrollment checkout' },
  { route: '/checkout/[program]',                     system: 'checkout',       classification: 'canonical' },
  { route: '/checkout/success',                       system: 'checkout',       classification: 'canonical' },
  { route: '/store/checkout',                         system: 'checkout',       classification: 'canonical',    notes: 'Store product checkout — separate from program checkout' },
  { route: '/store/checkout/[slug]',                  system: 'checkout',       classification: 'canonical' },
  { route: '/lms/payments',                           system: 'checkout',       classification: 'canonical',    notes: 'LMS billing management' },

  // payment/* — consolidate into checkout/*
  { route: '/payment',                                system: 'checkout',       classification: 'alias',        canonicalTarget: '/checkout',              notes: 'Alias for /checkout' },
  { route: '/payment/success',                        system: 'checkout',       classification: 'alias',        canonicalTarget: '/checkout/success' },
  { route: '/payment/cancel',                         system: 'checkout',       classification: 'alias',        canonicalTarget: '/checkout' },
  { route: '/pay',                                    system: 'checkout',       classification: 'legacy',       canonicalTarget: '/checkout',              notes: 'Orphan page — no known consumer' },

  // ============================================================
  // CERTIFICATES / VERIFICATION
  // ============================================================
  { route: '/verify/[certificateId]',                 system: 'certificates',   classification: 'canonical',    notes: 'Public certificate verification' },
  { route: '/verify',                                 system: 'certificates',   classification: 'canonical' },
  { route: '/lms/certificates',                       system: 'certificates',   classification: 'canonical',    notes: 'Authenticated learner certificate list' },

  // Duplicate certificate paths
  { route: '/certificates',                           system: 'certificates',   classification: 'legacy',       canonicalTarget: '/lms/certificates',      notes: 'Duplicates /lms/certificates' },
  { route: '/certificates/[certificateId]',           system: 'certificates',   classification: 'legacy',       canonicalTarget: '/verify/[certificateId]' },
  { route: '/certificates/verify/[certificateId]',    system: 'certificates',   classification: 'legacy',       canonicalTarget: '/verify/[certificateId]' },
  { route: '/verify-credentials',                     system: 'certificates',   classification: 'legacy',       canonicalTarget: '/verify',                notes: 'Duplicates /verify' },

  // ============================================================
  // LICENSING / STORE
  // ============================================================
  { route: '/store/licenses',                         system: 'store',          classification: 'canonical',    notes: 'Canonical license purchase path' },
  { route: '/store/licenses/[slug]',                  system: 'store',          classification: 'canonical' },
  { route: '/store',                                  system: 'store',          classification: 'canonical' },

  // Duplicate license namespaces
  { route: '/license',                                system: 'store',          classification: 'alias',        canonicalTarget: '/store/licenses',        notes: 'Marketing info page — consolidate into store/licenses' },
  { route: '/licenses',                               system: 'store',          classification: 'alias',        canonicalTarget: '/store/licenses' },
  { route: '/licensing',                              system: 'store',          classification: 'alias',        canonicalTarget: '/store/licenses' },
  { route: '/store/licensing',                        system: 'store',          classification: 'legacy',       canonicalTarget: '/store/licenses',        notes: 'Duplicates store/licenses' },

  // ============================================================
  // ORPHAN / EXPERIMENTAL PAGES
  // ============================================================
  { route: '/dev/barber-preview',                     system: 'dev',            classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/dev/hvac-preview',                       system: 'dev',            classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/dev/slide-preview',                      system: 'dev',            classification: 'experimental', notes: 'Dev preview — should not be in production' },
  { route: '/rise',                                   system: 'orphan',         classification: 'experimental', notes: 'Unclear purpose — verify before deleting' },
  { route: '/elevatelearn2earn',                      system: 'orphan',         classification: 'experimental', notes: 'Campaign page — verify if still active' },
  { route: '/connect',                                system: 'orphan',         classification: 'experimental', notes: 'Unclear purpose — verify before deleting' },
  { route: '/client-portal',                          system: 'orphan',         classification: 'experimental', notes: 'No clear role — verify before deleting' },
]
