/**
 * Bind the existing Admin Cloud Run runtime identity to the existing
 * Course Builder job. This is a one-time, narrowly scoped IAM repair;
 * it does not redeploy, change, or execute either workload.
 * Run only with an administrator-approved Google Cloud identity.
 */
import {execFileSync} from 'node:child_process';

const project='elegant-racer-299721';
const region='us-central1';
const admin='elevate-admin-migration';
const job='elevate-course-builder';
function gcloud(args) {
  return execFileSync('gcloud',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim();
}
const adminData=JSON.parse(gcloud(['run','services','describe',admin,
  '--project='+project,'--region='+region,'--format=json']));
const serviceAccount=adminData?.spec?.template?.spec?.serviceAccountName ??
  adminData?.template?.serviceAccount;
if (!serviceAccount || !/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(serviceAccount))
  throw new Error('ADMIN_RUNTIME_SERVICE_ACCOUNT_NOT_RESOLVED');
const jobData=JSON.parse(gcloud(['run','jobs','describe',job,
  '--project='+project,'--region='+region,'--format=json']));
if (!String(jobData.metadata?.name ?? jobData.name ?? '').endsWith(job))
  throw new Error('COURSE_BUILDER_JOB_NOT_FOUND');
const member='serviceAccount:'+serviceAccount;
console.log('Admin runtime identity:',serviceAccount);
console.log('Course Builder target:',job,'role: roles/run.jobsExecutor');
gcloud(['run','jobs','add-iam-policy-binding',job,
  '--project='+project,'--region='+region,
  '--member='+member,'--role=roles/run.jobsExecutor',
  '--condition=None','--quiet']);
const policy=JSON.parse(gcloud(['run','jobs','get-iam-policy',job,
  '--project='+project,'--region='+region,'--format=json']));
const hasRole=(policy.bindings??[]).some(b=>b.role==='roles/run.jobsExecutor' &&
  (b.members??[]).includes(member));
if (!hasRole) throw new Error('COURSE_WORKER_EXECUTION_ROLE_NOT_VERIFIED');
console.log('Verified scoped Cloud Run job execute permission for Admin runtime.');
