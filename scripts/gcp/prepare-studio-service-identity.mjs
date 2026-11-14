import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
export const STUDIO_ACCOUNT=`elevate-studio-runtime@${PROJECT}.iam.gserviceaccount.com`;
const deploymentAccount=`elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`;
const bucket=`${PROJECT}-studio-browser-auth`;

// Identity preparation only: no browser revision, session, DNS or traffic changes.
export function prepareStudioIdentity({run=google}={}) {
  const accounts=JSON.parse(run(['iam','service-accounts','list','--project='+PROJECT,'--format=json']));
  if(!Array.isArray(accounts))throw Error('STUDIO_IDENTITY_INVENTORY_UNAVAILABLE');
  if(!accounts.some(account=>account.email===STUDIO_ACCOUNT))
    run(['iam','service-accounts','create','elevate-studio-runtime','--project='+PROJECT,'--display-name=Elevate Studio browser runtime','--quiet']);
  run(['secrets','add-iam-policy-binding','studio-browser-shared-secret','--project='+PROJECT,'--member=serviceAccount:'+STUDIO_ACCOUNT,'--role=roles/secretmanager.secretAccessor','--quiet']);
  run(['storage','buckets','add-iam-policy-binding','gs://'+bucket,'--project='+PROJECT,'--member=serviceAccount:'+STUDIO_ACCOUNT,'--role=roles/storage.objectUser','--quiet']);
  run(['iam','service-accounts','add-iam-policy-binding',STUDIO_ACCOUNT,'--project='+PROJECT,'--member=serviceAccount:'+deploymentAccount,'--role=roles/iam.serviceAccountUser','--quiet']);
  const policy=(args)=>JSON.parse(run([...args,'--project='+PROJECT,'--format=json']));
  const has=(p,role,member)=>(p.bindings||[]).some(b=>b.role===role&&!b.condition&&(b.members||[]).includes(member));
  if(!has(policy(['secrets','get-iam-policy','studio-browser-shared-secret']),'roles/secretmanager.secretAccessor','serviceAccount:'+STUDIO_ACCOUNT)||
    !has(policy(['storage','buckets','get-iam-policy','gs://'+bucket]),'roles/storage.objectUser','serviceAccount:'+STUDIO_ACCOUNT)||
    !has(policy(['iam','service-accounts','get-iam-policy',STUDIO_ACCOUNT]),'roles/iam.serviceAccountUser','serviceAccount:'+deploymentAccount))
    throw Error('STUDIO_IDENTITY_READBACK_FAILED');
  return {serviceAccount:STUDIO_ACCOUNT,bindingsVerified:true,applicationDeployed:false,sessionsMoved:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {console.log(JSON.stringify(prepareStudioIdentity()));}
  catch(error) {console.error(JSON.stringify({error:error.code||'studio_identity_preparation_failed',applicationDeployed:false}));process.exitCode=1;}
}
