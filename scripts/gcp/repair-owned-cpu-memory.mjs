import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';
import {CPU_SERVICE,CPU_REGION,CPU_CACHE_ENV,CPU_CAPACITY,reviewPrivateModelPolicy} from './deploy-owned-cpu-model.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';
import {quotaContact,requestHeadroom} from './request-run-headroom.mjs';

const fail=code=>{throw Error('CPU_MEMORY_REPAIR_'+code);};
const scope=['--project',PROJECT,'--region',CPU_REGION];
function servingRevision(service) {
 const traffic=service.status?.traffic?.filter(t=>t.percent>0);
 if(traffic?.length!==1||traffic[0].percent!==100||!/^elevate-owned-cpu-llm-[a-z0-9-]+$/.test(traffic[0].revisionName||''))fail('SERVING_REVISION_REQUIRED');
 return traffic[0].revisionName;
}
function verifyBoundedTask(task,{cpu,memory,containerConcurrency}) {
 const container=task?.containers?.[0];
 if(task?.containers?.length!==1||container.resources?.limits?.cpu!==cpu||container.resources?.limits?.memory!==memory||
  task.containerConcurrency!==containerConcurrency||task.serviceAccountName!==`elevate-llm-runtime@${PROJECT}.iam.gserviceaccount.com`||
  !new RegExp('^us-central1-docker\\.pkg\\.dev/'+PROJECT+'/elevate/owned-cpu-llm@sha256:[a-f0-9]{64}$').test(container.image||''))fail('BOUNDED_RUNTIME_REQUIRED');
 return container;
}
function verifyTask(task) {
 return verifyBoundedTask(task,{cpu:CPU_CAPACITY.cpu,memory:CPU_CAPACITY.memory,containerConcurrency:2});
}
/** The serving revision predates the capacity release, so it cannot already
 * report the target envelope. Accept exactly the two known bounded envelopes
 * (the legacy 4 CPU / 8 GiB / concurrency 1 deployment or the target one) with
 * identity and image integrity at full strength; the target envelope is
 * enforced unchanged on the candidate this repair stages. */
const LEGACY_TASK=Object.freeze({cpu:'4',memory:'8Gi',containerConcurrency:1});
function verifySourceTask(task) {
 for(const envelope of [LEGACY_TASK,{cpu:CPU_CAPACITY.cpu,memory:CPU_CAPACITY.memory,containerConcurrency:2}]) {
  try{return verifyBoundedTask(task,envelope);}catch{/* fall through to the other known envelope */}
 }
 fail('BOUNDED_RUNTIME_REQUIRED');
}

export async function repeatCpuInference({base,token,invokerToken,request=fetch}={}) {
 const durations=[];
 for(let round=0;round<8;round++) {
  const context=Array.from({length:64},(_,line)=>`Reference ${round}-${line}: Training records must be accurate and explain each completed step.`).join('\n');
  const started=Date.now();
  const response=await request(new URL('/v1/chat/completions',base),{method:'POST',redirect:'error',
   headers:{Authorization:'Bearer '+token,'X-Serverless-Authorization':'Bearer '+invokerToken,'Content-Type':'application/json'},
   body:JSON.stringify({model:'elevate-local',temperature:0,max_tokens:16,messages:[{role:'system',content:'Answer the arithmetic question with the number only. The reference records are background context.'},{role:'user',content:context+'\nWhat is 2 plus 2?'}]}),signal:AbortSignal.timeout(180000)});
  const body=await response.json();
  if(!response.ok||!/^\s*4[.\s]*$/.test(body.choices?.[0]?.message?.content??''))fail('REPEATED_INFERENCE_FAILED');
  durations.push(Date.now()-started);
 }
 return {passed:true,requests:durations.length,durationsMs:durations};
}

/** Stage the same immutable image with bounded caches; accept it before traffic moves. */
export async function repairOwnedCpuMemory({run=google,capacity=inspectRegionalCapacity,accept=acceptOwnedCpuModel,repeat=repeatCpuInference,invokerToken=process.env.MODEL_INVOKER_TOKEN,requestStagingHeadroom=false,requestQuota=requestHeadroom,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}) {
 if(!invokerToken)fail('INVOCATION_IDENTITY_REQUIRED');
 const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
 const before=read(['run','services','describe',CPU_SERVICE]);
 const previous=servingRevision(before);
 const current=read(['run','revisions','describe',previous]);
 const original=verifySourceTask(current.spec);
 const adminConfig=loadGoogleConfig('admin',run);
 const token=modelCredential(adminConfig);
 const admin=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 reviewPrivateModelPolicy(read(['run','services','get-iam-policy',CPU_SERVICE]),admin.spec?.template?.spec?.serviceAccountName);
 const capacityInput={region:CPU_REGION,task:{containers:[{resources:{limits:{cpu:'8',memory:'16Gi'}}}]},run};
 let budget=await capacity(capacityInput);
 let quotaRequests;
 if(!budget.fits&&requestStagingHeadroom) {
  const contact=quotaContact(JSON.parse(run(['projects','get-iam-policy',PROJECT,'--format=json'])));
  quotaRequests=await requestQuota(run(['auth','print-access-token']),contact,fetch,{region:CPU_REGION});
  if(!quotaRequests.some(result=>result.accepted===false)) {
   for(let attempt=0;attempt<4&&!budget.fits;attempt++) {await pause(15000);budget=await capacity(capacityInput);}
  }
 }
 if(!budget.fits)throw Object.assign(Error('CPU_MEMORY_REPAIR_CANDIDATE_CAPACITY_REQUIRED'),{capacity:{region:budget.region,required:budget.required,granted:budget.granted},quotaRequests});
 if(before.spec?.template?.spec?.containers?.[0]?.image!==original.image)fail('CONCURRENT_CANDIDATE_PRESENT');
 const tag='elevate-owned-cpu-llm-mem';
 run(['run','services','update',CPU_SERVICE,...scope,'--no-traffic','--tag='+tag,
  '--cpu',CPU_CAPACITY.cpu,'--memory',CPU_CAPACITY.memory,'--concurrency','2',
  '--update-env-vars='+Object.entries(CPU_CACHE_ENV).map(([key,value])=>key+'='+value).join(','),'--quiet']);
 const staged=read(['run','services','describe',CPU_SERVICE]);
 if(servingRevision(staged)!==previous)fail('TRAFFIC_CHANGED_CONCURRENTLY');
 const revision=staged.status?.latestReadyRevisionName;
 if(!revision||revision===previous||revision!==staged.status?.latestCreatedRevisionName)fail('CANDIDATE_NOT_READY');
 const candidate=read(['run','revisions','describe',revision]);
 const container=verifyTask(candidate.spec);
 if(container.image!==original.image||Object.entries(CPU_CACHE_ENV).some(([name,value])=>!container.env?.some(e=>e.name===name&&e.value===value)))fail('CANDIDATE_READBACK_FAILED');
 const target=staged.status?.traffic?.find(t=>t.tag===tag&&t.revisionName===revision)?.url;
 let targetUrl,serviceUrl;try{targetUrl=new URL(target);serviceUrl=new URL(before.status.url);}catch{fail('CANDIDATE_URL_REQUIRED');}
 if(targetUrl.origin!==`https://${tag}---${serviceUrl.hostname}`||targetUrl.pathname!=='/')fail('CANDIDATE_URL_UNVERIFIED');
 const acceptance=await accept({base:target,token,invokerToken});
 if(acceptance?.passed!==true)fail('ACCEPTANCE_REQUIRED');
 const sustained=await repeat({base:target,token,invokerToken});
 if(sustained?.passed!==true||sustained.requests!==8)fail('REPEATED_ACCEPTANCE_REQUIRED');
 const checked=read(['run','services','describe',CPU_SERVICE]);
 if(servingRevision(checked)!==previous||checked.status?.latestCreatedRevisionName!==revision)fail('CONCURRENT_REVISION_CHANGE');
 reviewPrivateModelPolicy(read(['run','services','get-iam-policy',CPU_SERVICE]),admin.spec?.template?.spec?.serviceAccountName);
 run(['run','services','update-traffic',CPU_SERVICE,...scope,'--to-revisions='+revision+'=100','--quiet']);
 if(servingRevision(read(['run','services','describe',CPU_SERVICE]))!==revision)fail('TRAFFIC_READBACK_FAILED');
 // Preserve authentication and the original service URL used by Admin.
 try {
  const live=await accept({base:before.status.url,token,invokerToken});
  if(live?.passed!==true)fail('LIVE_ACCEPTANCE_REQUIRED');
 } catch(error) {
  if(servingRevision(read(['run','services','describe',CPU_SERVICE]))===revision)
   run(['run','services','update-traffic',CPU_SERVICE,...scope,'--to-revisions='+previous+'=100','--quiet']);
  throw error;
 }
 return {repaired:true,previousRevision:previous,revision,modelUrl:before.status.url,memory:CPU_CAPACITY.memory,cpu:CPU_CAPACITY.cpu,cache:CPU_CACHE_ENV,acceptance,sustained,liveAcceptance:true,permissionsChanged:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)repairOwnedCpuMemory({requestStagingHeadroom:process.env.REQUEST_PARIS_STAGING_HEADROOM==='true'}).then(report=>console.info(JSON.stringify(report))).catch(error=>{console.error(JSON.stringify({error:error.message?.startsWith('CPU_MEMORY_REPAIR_')||error.message?.startsWith('OWNED_CPU_MODEL_')?error.message:error.code||'CPU_MEMORY_REPAIR_FAILED',...(error.capacity?{capacity:error.capacity}:{}),...(error.quotaRequests?{quotaRequests:error.quotaRequests}:{})}));process.exitCode=1;});

