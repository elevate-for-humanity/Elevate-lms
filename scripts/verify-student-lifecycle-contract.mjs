import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`missing required lifecycle file: ${path}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireText(path, text, message) {
  const content = read(path);
  if (content && !content.includes(text)) failures.push(message || `${path} missing ${text}`);
}

function forbidText(path, text, message) {
  const content = read(path);
  if (content && content.includes(text)) failures.push(message || `${path} must not contain ${text}`);
}

function requireMissing(path, message) {
  if (existsSync(join(root, path))) failures.push(message || `${path} should not exist`);
}

const studentForm = 'apps/marketing/app/apply/student/StudentApplicationForm.tsx';
const submissionApi = 'apps/marketing/app/api/applications/route.ts';
const trackerPage = 'apps/marketing/app/apply/track/page.tsx';
const trackerApi = 'apps/marketing/app/api/applications/track/route.ts';
const marketingConfig = 'apps/marketing/next.config.js';
const retiredPublicStatusPage = 'apps/marketing/app/apply/status/page.tsx';
const approvalApi = 'apps/admin/app/api/admin/applications/[id]/approve/route.ts';
const approvalPipeline = 'lib/enrollment/approve.ts';

for (const path of [
  studentForm,
  submissionApi,
  trackerPage,
  trackerApi,
  marketingConfig,
  approvalApi,
  approvalPipeline,
  'lib/enrollment/create-enrollment.ts',
  'lib/enrollment/complete-enrollment.ts',
  'lib/enrollment/enrollment-flow.ts',
]) read(path);

requireText(studentForm, "fetch('/api/applications'", 'student application must submit through canonical /api/applications');
requireText(studentForm, "'X-Idempotency-Key': idempotencyKey", 'student application must preserve idempotent submission');
requireText(studentForm, "router.push(`/apply/success${suffix}`)", 'student application must hand off to canonical success route');

requireText(submissionApi, ".from('applications')", 'application submission must persist to canonical applications table');
requireText(submissionApi, 'provisionAccount({', 'application submission must provision the learner account through canonical provisionAccount');
requireText(submissionApi, "postLoginUrl: '/onboarding/learner'", 'provisioned learner must hand off to canonical learner onboarding');
requireText(submissionApi, "enrollmentStatus: 'pending'", 'new applicant account must remain pending until enrollment approval');
for (const status of ['submitted', 'pending_funding', 'pending_admin_review']) {
  requireText(submissionApi, `'${status}'`, `submission API must retain canonical workflow status ${status}`);
}

requireText(
  marketingConfig,
  "{ source: '/apply/status', destination: '/apply/track', permanent: true }",
  'public /apply/status compatibility must be centralized in Marketing redirects',
);
requireMissing(
  retiredPublicStatusPage,
  'retired public /apply/status page implementation must not exist once compatibility is centralized',
);

requireText(trackerPage, 'fetch(`/api/applications/track?', 'tracker page must use canonical tracking API');
requireText(trackerPage, 'if (!applicationId || !applicationEmail)', 'tracker UI must require both verification values before lookup');
requireText(trackerPage, 'new URLSearchParams({ id: applicationId, email: applicationEmail })', 'tracker UI must submit both verification values together');
requireText(trackerPage, 'id="applicationId"', 'tracker UI must expose the application identifier field');
requireText(trackerPage, 'id="email"', 'tracker UI must expose the application email field');
requireText(trackerApi, ".from('applications')", 'tracker API must read canonical applications table');
requireText(trackerApi, "if (!id || !email)", 'public tracker must require both application ID and matching email');
requireText(trackerApi, ".eq('normalized_email', email)", 'public tracker must bind the lookup to the applicant email');
requireText(trackerApi, "query = query.eq('reference_number', id)", 'public tracker must bind reference-number lookups to the same applicant row');
requireText(trackerApi, "query = query.eq('id', id)", 'public tracker must bind UUID lookups to the same applicant row');
requireText(trackerApi, 'status: data.status', 'tracker API must preserve the canonical persisted workflow status');
forbidText(trackerApi, 'last_name, email, phone', 'public tracker response selection must not include unnecessary applicant PII');
forbidText(trackerApi, 'support_notes', 'public tracker response must not expose internal support notes');

for (const status of [
  'submitted',
  'under_review',
  'pending',
  'pending_funding',
  'pending_admin_review',
  'contacted',
  'approved',
  'enrolled',
  'rejected',
  'withdrawn',
]) {
  requireText(trackerPage, `${status}:`, `tracker UI must render canonical workflow status ${status}`);
}
requireText(
  trackerPage,
  'statusConfig[application.status] ?? unknownStatus',
  'tracker UI must retain a safe visible fallback for future workflow states',
);

requireText(approvalApi, ".select('program_id, program_slug, program_interest, funding_type')", 'Admin approval must load canonical application program/funding context server-side');
requireText(approvalApi, ".from('programs')", 'Admin approval must resolve a program record when application.program_id is absent');
requireText(approvalApi, "'PROGRAM_NOT_RESOLVED:", 'Admin approval must fail closed when no canonical program can be resolved');
requireText(approvalApi, 'programId: resolvedProgramId', 'Admin approval must pass the resolved program into the single approval pipeline');
requireText(approvalPipeline, ".from('program_enrollments')", 'single approval pipeline must activate canonical program enrollment');
requireText(approvalPipeline, ".from('course_enrollments')", 'single approval pipeline must verify database-provisioned LMS course access');
forbidText(approvalPipeline, ".from('course_enrollments').insert", 'application code must not duplicate the database course-enrollment writer');
forbidText(approvalPipeline, 'resolveCourseId(', 'runtime approval must not use the deprecated static program/course fallback');
requireText(approvalPipeline, 'Canonical course provisioning did not complete', 'single approval pipeline must fail closed when course provisioning is incomplete');
requireText(approvalPipeline, 'Failed to finalize application approval', 'single approval pipeline must surface final approval failures');
requireText(approvalPipeline, "status: 'approved'", 'single approval pipeline must mark application approved only in the enrollment pipeline');
requireText(approvalPipeline, "enrollment_status: 'active'", 'single approval pipeline must activate the learner profile');
requireText(approvalPipeline, 'ensureDigitalBinder({', 'single approval pipeline must provision the digital binder');

if (failures.length) {
  console.error('[student-lifecycle-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[student-lifecycle-contract] PASS');
console.log('application -> confirmation -> paired minimized tracker -> pending account -> canonical approval -> database-provisioned LMS access contracts are canonical');
