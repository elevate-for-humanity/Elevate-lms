import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';
import {CPU_SERVICE,CPU_REGION,CPU_CACHE_ENV,reviewPrivateModelPolicy} from './deploy-owned-cpu-model.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';

const fail=code=>{throw Error('CPU_MEMORY_REPAIR_'+code);};
const scope=['--project',PROJECT,'--region',CPU_REGION];
function servingRevision(service) {
 const traffic=service.status?.traffic?.filter(t=>t.percent>0);
 if(traffic?.length!==1||traffic[0].percent!==100||!/^elevate-owned-cpu-llm-[a-z0-9-]+$/.test(traffic[0].revisionName||''))fail('SERVING_REVISION_REQUIRED');
 return traffic[0].revisionName;
}
function verifyTask(task) {
 const container=task?.containers?.[0];
 if(task?.containers?.length!==1||container.resources?.limits?.cpu!=='4'||container.resources?.limits?.memory!=='8Gi'||
  task.containerConcurrency!==1||task.serviceAccountName!==`elevate-llm-runtime@${PROJECT}.iam.gserviceaccount.com`||
  !new RegExp('^us-central1-docker\\.pkg\\.dev/'+PROJECT+'/elevate/owned-cpu-llm@sha256:[a-f0-9]{64}$').test(container.image||''))fail('BOUNDED_RUNTIME_REQUIRED');
 return container;
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
export async function repairOwnedCpuMemory({run=google,capacity=inspectRegionalCapacity,accept=acceptOwnedCpuModel,repeat=repeatCpuInference,invokerToken=process.env.MODEL_INVOKER_TOKEN}={}) {
 if(!invokerToken)fail('INVOCATION_IDENTITY_REQUIRED');
 const read=args=>JSON.parse(run([...args,...scope,'--format=json']));
 const before=read(['run','services','describe',CPU_SERVICE]);
 const previous=servingRevision(before);
 const current=read(['run','revisions','describe',previous]);
 const original=verifyTask(current.spec);
 const adminConfig=loadGoogleConfig('admin',run);
 const token=modelCredential(adminConfig);
 const admin=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 reviewPrivateModelPolicy(read(['run','services','get-iam-policy',CPU_SERVICE]),admin.spec?.template?.spec?.serviceAccountName);
 const budget=await capacity({region:CPU_REGION,task:{containers:[{resources:{limits:{cpu:'4',memory:'8Gi'}}}]},run});
 if(!budget.fits)fail('CANDIDATE_CAPACITY_REQUIRED');
 if(before.spec?.template?.spec?.containers?.[0]?.image!==original.image)fail('CONCURRENT_CANDIDATE_PRESENT');
 const tag='elevate-owned-cpu-llm-mem';
 run(['run','services','update',CPU_SERVICE,...scope,'--no-traffic','--tag='+tag,
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
 return {repaired:true,previousRevision:previous,revision,modelUrl:before.status.url,memory:'8Gi',cpu:'4',cache:CPU_CACHE_ENV,acceptance,sustained,liveAcceptance:true,permissionsChanged:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)repairOwnedCpuMemory().then(report=>console.log(JSON.stringify(report))).catch(error=>{console.error(JSON.stringify({error:error.message?.startsWith('CPU_MEMORY_REPAIR_')||error.message?.startsWith('OWNED_CPU_MODEL_')?error.message:error.code||'CPU_MEMORY_REPAIR_FAILED'}));process.exitCode=1;});
