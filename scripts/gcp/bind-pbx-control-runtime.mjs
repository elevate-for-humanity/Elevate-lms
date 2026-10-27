import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {activateTestedRevision,cleanupUnusedCandidateTags} from './activate-tested-public-revision.mjs';
import {preflightWebRollout} from './preflight-web-rollout.mjs';
const policy=JSON.parse(readFileSync(new URL('../../config/google-runtime-policy.json',import.meta.url),'utf8'));
const SECRET='elevate-pbx-provisioning-token';
const SYSTEM='341f59a3-b1d6-4360-8463-0ce0402f86fe';

export function bindingPlan(component,version){
  if(!['admin','lms'].includes(component)||!/^([1-9][0-9]*)$/.test(version))throw Error('pbx_binding_scope_invalid');
  return {vars:{PBX_RUNTIME_CONFIG_PROVIDER:'google-secret-manager',
    ...(component==='admin'?{PBX_PHONE_SYSTEM_ID:SYSTEM}:{PBX_CONTROL_URL:'https://phone.elevateforhumanity.org'})},
    secret:{name:'PBX_PROVISIONING_TOKEN',secret:SECRET,version}};
}
export function bindingsMatch(env,plan){
  const map=new Map((env||[]).map(item=>[item.name,item]));
  return Object.entries(plan.vars).every(([key,value])=>map.get(key)?.value===value)&&
    map.get(plan.secret.name)?.valueFrom?.secretKeyRef?.name===plan.secret.secret&&
    map.get(plan.secret.name)?.valueFrom?.secretKeyRef?.key===plan.secret.version;
}
function assertNoConflict(env,plan){
  const map=new Map((env||[]).map(item=>[item.name,item]));
  for(const [key,value] of Object.entries(plan.vars)){
    const item=map.get(key);
    if(item&&(item.value!==value||item.valueFrom))throw Error('existing_phone_binding_requires_review');
  }
  const existing=map.get(plan.secret.name);
  if(existing&&(existing.value!==undefined||existing.valueFrom?.secretKeyRef?.name!==SECRET))
    throw Error('existing_phone_credential_requires_review');
}
export async function pinnedControlVersion(run=google){
  // VM stdout can include an SSH banner. Only an exact tagged result is trusted.
  // Never print the config file, secret reference, or credential bytes.
  const code=`from pathlib import Path\nimport re\np=Path('/etc/elevate-pbx/provisioner.conf')\nif not p.is_file():\n print('PBX_REF_RESULT:FILE_MISSING')\n raise SystemExit(0)\ntry:\n lines=p.read_text().splitlines()\nexcept OSError:\n print('PBX_REF_RESULT:INVALID')\n raise SystemExit(0)\nvalues=[]\nfor line in lines:\n m=re.fullmatch(r"\\s*PBX_PROVISIONING_TOKEN_SECRET\\s*=\\s*(.*?)\\s*",line)\n if m:\n  values.append(m[1].strip().strip(chr(34)+chr(39)))\nif len(values)!=1:\n print('PBX_REF_RESULT:INVALID')\n raise SystemExit(0)\nm=re.fullmatch(r"projects/(?:elegant-racer-299721|484736877039)/secrets/elevate-pbx-provisioning-token/versions/([1-9][0-9]*|latest)",values[0])\nprint('PBX_REF_RESULT:'+m[1] if m else 'PBX_REF_RESULT:INVALID')\n`;
  const quoted="'"+code.replace(/'/g,"'\\''")+"'";
  const output=run(['compute','ssh','elevate-pbx','--project',PROJECT,'--zone','us-central1-a','--quiet','--command','sudo python3 -c '+quoted]).trim();
  const matches=output.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith('PBX_REF_RESULT:'));
  if(matches.length!==1)throw Error('pbx_control_reference_unverified');
  const pin=matches[0].slice('PBX_REF_RESULT:'.length);
  if(pin==='FILE_MISSING')throw Error('pbx_control_reference_file_missing');
  if(!/^(?:[1-9][0-9]*|latest)$/.test(pin))throw Error('pbx_control_reference_unverified');
  const meta=JSON.parse(run(['secrets','versions','describe',pin,'--secret',SECRET,'--project',PROJECT,'--format=json']));
  const match=meta.name?.match(/^projects\/(?:elegant-racer-299721|484736877039)\/secrets\/elevate-pbx-provisioning-token\/versions\/([1-9][0-9]*)$/);
  if(!match||meta.state!=='ENABLED')throw Error('pbx_control_version_unverified');
  return match[1];
}
export async function bindControl(component,version,{run=google,request=fetch,activate=activateTestedRevision,
  cleanup=cleanupUnusedCandidateTags,preflight=preflightWebRollout,runId=process.env.GITHUB_RUN_ID}={}){
  const plan=bindingPlan(component,version),target=policy.components[component];
  const gc=args=>run([...args,'--project',PROJECT]);
  const read=args=>JSON.parse(gc([...args,'--region',policy.region,'--format=json']));
  const describe=()=>read(['run','services','describe',target.service]);
  const before=describe(),container=before.spec?.template?.spec?.containers?.[0];
  const previous=before.status?.latestReadyRevisionName;
  if(before.spec?.template?.spec?.serviceAccountName!==target.identity||!/@sha256:[a-f0-9]{64}$/.test(container?.image||'')||
    !previous||before.status.latestCreatedRevisionName!==previous||
    !before.status.traffic?.some(t=>t.revisionName===previous&&t.percent===100))throw Error('phone_application_identity_or_state_unverified');
  const origin=component==='admin'?'https://admin.elevateforhumanity.org':'https://app.elevateforhumanity.org';
  const response=await request(origin+'/api/health',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
  const health=await response.json(),commit=health.commitSha||health.commit||health.sha;
  if(!response.ok||health.ready!==true||health.healthy!==true||health.revision!==previous||!/^[a-f0-9]{40}$/.test(commit||''))
    throw Error('phone_application_health_unverified');
  assertNoConflict(container.env,plan);
  if(bindingsMatch(container.env,plan))return {component,changed:false,revision:previous,phoneBindingsVerified:true,callAcceptance:'NOT TESTED'};
  if(!/^\d+$/.test(runId||''))throw Error('trusted_binding_workflow_required');
  await cleanup({service:target.service});
  await preflight({service:target.service});
  const iam=JSON.parse(gc(['secrets','get-iam-policy',SECRET,'--format=json']));
  const member='serviceAccount:'+target.identity;
  if(!iam.bindings?.some(b=>b.role==='roles/secretmanager.secretAccessor'&&!b.condition&&b.members?.includes(member)))
    gc(['secrets','add-iam-policy-binding',SECRET,'--member',member,'--role','roles/secretmanager.secretAccessor','--condition=None','--quiet']);
  const suffix='pbx-control-'+runId;
  gc(['run','services','update',target.service,'--region',policy.region,'--no-traffic','--no-cpu-boost','--revision-suffix',suffix,
    '--update-env-vars','^|^'+Object.entries(plan.vars).map(([key,value])=>key+'='+value).join('|'),
    '--update-secrets',plan.secret.name+'='+SECRET+':'+version,'--quiet']);
  const candidate=describe(),revision=candidate.status?.latestCreatedRevisionName;
  if(revision!==target.service+'-'+suffix||candidate.spec.template.spec.containers[0].image!==container.image||
    !bindingsMatch(candidate.spec.template.spec.containers[0].env,plan))throw Error('phone_candidate_binding_unverified');
  const promoted=await activate({service:target.service,revision,commit});
  const actual=read(['run','revisions','describe',revision]);
  const serving=describe();
  if(!serving.status?.traffic?.some(t=>t.revisionName===revision&&t.percent===100)||
    actual.spec?.containers?.[0]?.image!==container.image||!bindingsMatch(actual.spec.containers[0].env,plan))
    throw Error('serving_phone_binding_unverified');
  return {component,changed:true,previousRevision:previous,...promoted,phoneBindingsVerified:true,
    callAcceptance:'NOT TESTED',carrierRoutingChanged:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let phase='resolve_vm_reference';
  try{
    const version=await pinnedControlVersion();
    for(const component of ['admin','lms']){
      phase=component+'_runtime_bindings';
      console.log(JSON.stringify(await bindControl(component,version)));
    }
  }catch(error){
    const known=new Set(['pbx_binding_scope_invalid','pbx_control_reference_file_missing','pbx_control_reference_unverified','pbx_control_version_unverified',
      'existing_phone_binding_requires_review','existing_phone_credential_requires_review','phone_application_identity_or_state_unverified',
      'phone_application_health_unverified','trusted_binding_workflow_required','phone_candidate_binding_unverified','serving_phone_binding_unverified']);
    const googleCodes=new Set(['permission_denied','quota_exceeded','not_found','api_disabled','authentication_failed','command_failed']);
    console.error(JSON.stringify({result:'FAIL',phase,code:known.has(error.message)?error.message:
      googleCodes.has(error.code)?error.code:'phone_runtime_binding_failed',credentialsEmitted:false}));
    process.exitCode=1;
  }
}
