import {readFileSync} from 'node:fs';
import {google,PROJECT} from './runtime-config.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';

const policy=JSON.parse(readFileSync(new URL('../../config/google-runtime-policy.json',import.meta.url),'utf8'));
const component=process.argv[2];
let phase='identity';
const gc=(args)=>google([...args,'--project',PROJECT]);
async function main(){
  if(!['admin','lms'].includes(component))throw Error('unsupported_component');
  const target=policy.components[component],secret='elevate-pbx-turn-shared-secret';
  const description=()=>JSON.parse(gc(['run','services','describe',target.service,'--region',policy.region,'--format=json']));
  const before=description(),container=before.spec?.template?.spec?.containers?.[0];
  if(before.spec?.template?.spec?.serviceAccountName!==target.identity||!/@sha256:[a-f0-9]{64}$/.test(container?.image||''))throw Error('existing_runtime_identity_requires_review');
  const revision=before.status?.latestReadyRevisionName;
  if(!revision||before.status.latestCreatedRevisionName!==revision||!before.status.traffic?.some(t=>t.revisionName===revision&&t.percent===100))throw Error('existing_runtime_not_stable');
  const response=await fetch(before.status.url+'/api/health',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const health=await response.json();
  const commit=health.commitSha||health.commit||health.sha;
  if(!response.ok||health.healthy!==true||health.ready!==true||health.revision!==revision||!/^[a-f0-9]{40}$/.test(commit||''))throw Error('existing_runtime_health_not_verified');
  const metadata=JSON.parse(gc(['secrets','describe',secret,'--format=json']));
  if(metadata.labels?.elevate_component!=='pbx')throw Error('relay_secret_scope_mismatch');
  const version=gc(['secrets','versions','describe','latest','--secret',secret,'--format=value(name)']).split('/').at(-1);
  if(!/^\d+$/.test(version))throw Error('numeric_secret_version_required');
  phase='confined_secret_binding';
  gc(['secrets','add-iam-policy-binding',secret,'--member',`serviceAccount:${target.identity}`,'--role','roles/secretmanager.secretAccessor','--condition=None','--quiet']);
  const suffix=`turn-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT||'1'}`;
  if(!/^turn-\d+-\d+$/.test(suffix))throw Error('trusted_workflow_identity_required');
  const urls='turn:phone.elevateforhumanity.org:3478?transport=udp,turn:phone.elevateforhumanity.org:3478?transport=tcp';
  phase='candidate_configuration';
  gc(['run','services','update',target.service,'--region',policy.region,'--no-traffic','--revision-suffix',suffix,
    '--update-env-vars',`^|^PBX_TURN_URLS=${urls}`,'--update-secrets',`PBX_TURN_SHARED_SECRET=${secret}:${version}`,'--quiet','--format=value(status.latestCreatedRevisionName)']);
  const after=description(),created=after.status?.latestCreatedRevisionName;
  if(created!==target.service+'-'+suffix||after.spec?.template?.spec?.containers?.[0]?.image!==container.image)throw Error('candidate_image_or_revision_changed');
  const env=after.spec.template.spec.containers[0].env||[];
  if(env.find(e=>e.name==='PBX_TURN_URLS')?.value!==urls||env.find(e=>e.name==='PBX_TURN_SHARED_SECRET')?.valueFrom?.secretKeyRef?.name!==secret)throw Error('candidate_relay_bindings_not_verified');
  phase='verified_promotion';
  const promoted=await activateTestedRevision({service:target.service,revision:created,commit});
  console.log(JSON.stringify({result:'PASS',component,relayRuntimeBound:true,credentialsEmitted:false,...promoted}));
}
main().catch(()=>{console.error(JSON.stringify({result:'FAIL',phase,component,credentialsEmitted:false}));process.exitCode=1;});
