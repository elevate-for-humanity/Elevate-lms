import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const PROJECT='elegant-racer-299721';
const TARGETS=[{job:'elevate-course-builder',region:'us-central1'},{job:'elevate-course-builder-parallel',region:'us-east1'}];
export function authorizeAdminCourseWorker(run=args=>execFileSync('gcloud',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim()) {
 const admin=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project='+PROJECT,'--region=us-central1','--format=json']));
 const identity=admin.spec?.template?.spec?.serviceAccountName??admin.template?.serviceAccount;
 if(!identity||!/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(identity))throw Error('ADMIN_RUNTIME_SERVICE_ACCOUNT_NOT_RESOLVED');
 const member='serviceAccount:'+identity;
 const roles=['roles/run.jobsExecutor','roles/run.viewer'];
 for(const target of TARGETS) {
  const scope=['--project='+PROJECT,'--region='+target.region];
  const job=JSON.parse(run(['run','jobs','describe',target.job,...scope,'--format=json']));
  if(!String(job.metadata?.name??job.name??'').endsWith(target.job))throw Error('COURSE_BUILDER_JOB_NOT_FOUND');
  let policy=JSON.parse(run(['run','jobs','get-iam-policy',target.job,...scope,'--format=json']));
  for(const role of roles) {
   if(!(policy.bindings??[]).some(b=>b.role===role&&!b.condition&&(b.members??[]).includes(member)))
    run(['run','jobs','add-iam-policy-binding',target.job,...scope,'--member='+member,'--role='+role,'--condition=None','--quiet']);
  }
  policy=JSON.parse(run(['run','jobs','get-iam-policy',target.job,...scope,'--format=json']));
  if(!roles.every(role=>(policy.bindings??[]).some(b=>b.role===role&&!b.condition&&(b.members??[]).includes(member))))throw Error('COURSE_WORKER_ACCESS_NOT_VERIFIED');
  console.log(JSON.stringify({identity,job:target.job,region:target.region,roles,verified:true}));
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)authorizeAdminCourseWorker();
