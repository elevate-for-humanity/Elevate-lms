import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
const permissions=['aiplatform.endpoints.predict','serviceusage.services.use'];
const roleId='elevateCourseLessonAuthor';
export function prepareCourseAuthoringAccess(run=google) {
  const scope=['--project',PROJECT];
  const job=JSON.parse(run(['run','jobs','describe','elevate-course-builder',...scope,'--region','us-central1','--format=json']));
  const identity=job.spec?.template?.spec?.template?.spec?.serviceAccountName;
  if(identity!==`elevate-worker-runtime@${PROJECT}.iam.gserviceaccount.com`)throw Error('COURSE_AUTHORING_IDENTITY_MISMATCH');
  const roles=JSON.parse(run(['iam','roles','list',...scope,'--format=json']));
  const name=`projects/${PROJECT}/roles/${roleId}`;
  const listed=roles.find(role=>role.name===name);
  const existing=listed?JSON.parse(run(['iam','roles','describe',roleId,...scope,'--format=json'])):null;
  if(existing && (existing.deleted || existing.includedPermissions?.length!==permissions.length || !permissions.every(p=>existing.includedPermissions.includes(p))))throw Error('COURSE_AUTHORING_ROLE_CONTRACT_MISMATCH');
  if(!existing)run(['iam','roles','create',roleId,...scope,'--title=Course lesson authoring','--description=Predict instructional lesson content using the existing course worker identity','--permissions='+permissions.join(','),'--stage=GA','--quiet']);
  const policy=JSON.parse(run(['projects','get-iam-policy',PROJECT,'--format=json']));
  const member='serviceAccount:'+identity;
  const bound=policy.bindings?.some(binding=>binding.role===name&&!binding.condition&&binding.members?.includes(member));
  if(!bound)run(['projects','add-iam-policy-binding',PROJECT,'--member='+member,'--role='+name,'--condition=None','--quiet']);
  return {identity,role:name,permissions,changed:!existing||!bound};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(prepareCourseAuthoringAccess()));}catch(error){console.error(JSON.stringify({result:'blocked',operation:error.message,code:error.code??'contract_failed'}));process.exitCode=1;}}
