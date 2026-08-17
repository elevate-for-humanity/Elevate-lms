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

const studentForm = 'apps/marketing/app/apply/student/StudentApplicationForm.tsx';
const submissionApi = 'apps/marketing/app/api/applications/route.ts';
const trackerPage = 'apps/marketing/app/apply/track/page.tsx';
const legacyStatus = 'apps/marketing/app/apply/status/page.tsx';
const trackerApi = 'apps/marketing/app/api/applications/track/route.ts';

for (const path of [
  studentForm,
  submissionApi,
  trackerPage,
  legacyStatus,
  trackerApi,
  'lib/enrollment/create-enrollment.ts',
  'lib/enrollment/complete-enrollment.ts',
  'lib/enrollment/enrollment-flow.ts',
]) {
  read(path);
}

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

requireText(legacyStatus, 'redirect(`/apply/track${suffix}`)', 'legacy /apply/status must redirect to canonical /apply/track');
requireText(trackerPage, 'fetch(`/api/applications/track?', 'tracker page must use canonical tracking API');
requireText(trackerApi, ".from('applications')", 'tracker API must read canonical applications table');
requireText(trackerApi, 'function toPublicTrackerStatus', 'tracker API must normalize internal workflow states for the public tracker');
requireText(trackerApi, 'workflow_status: workflowStatus', 'tracker API must preserve the granular workflow state for diagnostics');
for (const status of ['submitted', 'pending_funding', 'pending_admin_review']) {
  requireText(trackerApi, `case '${status}':`, `tracker API must handle persisted workflow status ${status}`);
}

if (failures.length) {
  console.error('[student-lifecycle-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[student-lifecycle-contract] PASS');
console.log('application -> confirmation -> tracker -> pending learner onboarding contracts are canonical');
