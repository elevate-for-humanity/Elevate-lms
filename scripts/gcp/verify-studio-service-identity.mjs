import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {STUDIO_ACCOUNT} from './prepare-studio-service-identity.mjs';
import {inspectPermissionBoundary} from './preflight-isolated-workloads.mjs';

// Read-only acceptance of the owner's scoped setup. No project-wide IAM grant
// or service-account policy mutation is needed by a routine deployment.
export async function verifyStudioIdentity({run=google,request=fetch}={}) {
  const token=run(['auth','print-access-token']);
  const attachment=await inspectPermissionBoundary(token,STUDIO_ACCOUNT,['iam.serviceAccounts.actAs'],request);
  if(!attachment.allowed)throw Error('STUDIO_DEDICATED_IDENTITY_ATTACHMENT_DENIED');
  const policy=args=>JSON.parse(run([...args,'--project='+PROJECT,'--format=json']));
  const member='serviceAccount:'+STUDIO_ACCOUNT;
  const has=(value,role)=>(value.bindings||[]).some(b=>b.role===role&&!b.condition&&(b.members||[]).includes(member));
  if(!has(policy(['secrets','get-iam-policy','studio-browser-shared-secret']),'roles/secretmanager.secretAccessor'))throw Error('STUDIO_AUTH_SECRET_BINDING_UNVERIFIED');
  if(!has(policy(['storage','buckets','get-iam-policy','gs://'+PROJECT+'-studio-browser-auth']),'roles/storage.objectUser'))throw Error('STUDIO_AUTH_STORAGE_BINDING_UNVERIFIED');
  return {serviceAccount:STUDIO_ACCOUNT,attachmentVerified:true,bindingsVerified:true,readOnly:true,applicationDeployed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)verifyStudioIdentity().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(JSON.stringify({error:e.code||e.message,applicationDeployed:false}));process.exitCode=1;});
