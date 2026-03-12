/**
 * Admin domain consolidation redirects.
 *
 * Maps the legacy 288-route flat structure to the 6-domain model:
 * Operations / Programs / Partners / Compliance / Communications / System
 *
 * All redirects are permanent (308). Legacy routes remain in the codebase
 * until explicitly deleted — these redirects prevent broken bookmarks.
 */

const r = (source, destination) => ({
  source,
  destination,
  permanent: true,
});

export const adminRedirects = [
  // ── OPERATIONS ──────────────────────────────────────────────────────────
  r('/admin/learner',           '/admin/students'),
  r('/admin/learner/:id',       '/admin/students/:id'),
  r('/admin/applicants-live',   '/admin/applicants'),
  r('/admin/review-queue',      '/admin/applications'),
  r('/admin/review-queue/:id',  '/admin/applications/review/:id'),
  r('/admin/retention',         '/admin/at-risk'),
  r('/admin/progress',          '/admin/students'),
  r('/admin/outcomes',          '/admin/completions'),
  r('/admin/success',           '/admin/completions'),
  r('/admin/hours-export',      '/admin/transfer-hours'),
  r('/admin/partner-enrollments', '/admin/enrollments'),

  // ── PROGRAMS ────────────────────────────────────────────────────────────
  r('/admin/course-builder',                    '/admin/courses'),
  r('/admin/course-builder/assessments',        '/admin/courses'),
  r('/admin/course-builder/media',              '/admin/courses'),
  r('/admin/course-builder/templates',          '/admin/courses'),
  r('/admin/courses/builder',                   '/admin/courses'),
  r('/admin/courses/manage',                    '/admin/courses'),
  r('/admin/course-generator',                  '/admin/courses/create'),
  r('/admin/course-templates',                  '/admin/courses'),
  r('/admin/curriculum',                        '/admin/courses'),
  r('/admin/curriculum/upload',                 '/admin/courses'),
  r('/admin/quiz-builder',                      '/admin/courses'),
  r('/admin/quizzes',                           '/admin/courses'),
  r('/admin/program-generator',                 '/admin/programs/new'),
  r('/admin/career-courses/create',             '/admin/courses/create'),
  r('/admin/courses/partners',                  '/admin/partners'),
  r('/admin/external-progress',                 '/admin/external-modules'),
  r('/admin/import',                            '/admin/course-import'),
  r('/admin/certifications',                    '/admin/certificates'),
  r('/admin/certifications/bulk',               '/admin/certificates/bulk'),

  // ── PARTNERS ────────────────────────────────────────────────────────────
  r('/admin/docs/mou',          '/admin/mou'),
  r('/admin/license',           '/admin/licenses'),
  r('/admin/licensing',         '/admin/licenses'),
  r('/admin/license-requests',  '/admin/licenses'),

  // ── COMPLIANCE ──────────────────────────────────────────────────────────
  r('/admin/compliance-audit',  '/admin/compliance'),
  r('/admin/reporting',         '/admin/reports'),
  r('/admin/impact',            '/admin/reports'),
  r('/admin/document-center',   '/admin/documents'),
  r('/admin/document-center/:category', '/admin/documents'),
  r('/admin/docs',              '/admin/documents'),
  r('/admin/files',             '/admin/documents'),

  // ── COMMUNICATIONS ──────────────────────────────────────────────────────
  r('/admin/campaigns',         '/admin/email-marketing'),
  r('/admin/campaigns/new',     '/admin/email-marketing/campaigns/new'),
  r('/admin/contacts',          '/admin/crm/contacts'),
  r('/admin/marketing',         '/admin/email-marketing'),
  r('/admin/crm/campaigns',     '/admin/email-marketing'),
  r('/admin/crm/campaigns/new', '/admin/email-marketing/campaigns/new'),

  // ── SYSTEM ──────────────────────────────────────────────────────────────
  r('/admin/system-health',     '/admin/system-status'),
  r('/admin/system-monitor',    '/admin/system-status'),
  r('/admin/site-health',       '/admin/system-status'),
  r('/admin/url-health',        '/admin/system-status'),
  r('/admin/automation-qa',     '/admin/automation'),
  r('/admin/content-automation','/admin/automation'),
  r('/admin/autopilot',         '/admin/automation'),
];
