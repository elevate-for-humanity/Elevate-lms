import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {allocation,inspectRegionalCapacity} from './regional-capacity.mjs';

const REGION='us-east1';
const fail=code=>{throw Error('OWNED_CPU_ADMIN_PROBE_'+code);};

/** Runs under the actual Admin identity; no application data or other secrets
 * are attached. Its sole network operation is authenticated model discovery. */
export const ADMIN_PROBE_SOURCE=`
const report={probe:'owned-cpu-admin',verified:false};
try {
 const base=new URL(process.env.CPU_MODEL_URL);
 if(base.protocol!=='https:'||!/^elevate-owned-cpu-llm-[a-z0-9.-]+\\.run\\.app$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.username||base.password)throw Error('INVALID_TARGET');
 const metadata=new URL('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity');
 metadata.searchParams.set('audience',base.origin);metadata.searchParams.set('format','full');
 const identity=await fetch(metadata,{headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!identity.ok)throw Error('IDENTITY_UNAVAILABLE');
 const token=(await identity.text()).trim();
 const response=await fetch(new URL('/v1/models',base),{headers:{Authorization:'Bearer '+process.env.LLM_WORKER_SECRET,'X-Serverless-Authorization':'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(90000)});
 const body=await response.json().catch(()=>({}));
 report.httpStatus=response.status;report.verified=response.ok&&Array.isArray(body.data)&&body.data.some(model=>model?.id==='elevate-local');
} catch {report.error='MODEL_DISCOVERY_FAILED';}
console.log(JSON.stringify(report));process.exitCode=report.verified?0:1;
`;

export function adminProbeManifest({base,identity,image,name}) {
 if(!/^https:\/\/elevate-owned-cpu-llm-[a-z0-9.-]+\.run\.app$/.test(base??''))fail('TARGET_UNVERIFIED');
 if(!/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(identity??''))fail('IDENTITY_UNVERIFIED');
 if(!/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/admin@sha256:[a-f0-9]{64}$/.test(image??''))fail('ADMIN_IMAGE_UNVERIFIED');
 if(!/^elevate-paris-probe-[a-z0-9-]{1,30}$/.test(name??''))fail('NAME_UNVERIFIED');
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:identity,maxRetries:0,timeoutSeconds:180,containers:[{
  image,command:['node'],args:['--max-old-space-size=128','--input-type=module','-e',ADMIN_PROBE_SOURCE],resources:{limits:{cpu:'1',memory:'512Mi'}},
  env:[{name:'CPU_MODEL_URL',value:base},{name:'LLM_WORKER_SECRET',valueFrom:{secretKeyRef:{name:'elevate-owned-llm-token',key:'latest'}}}],
 }]}}}}}};
}

function matchesProbe(task,expected) {
 const source=expected.containers[0],container=task?.containers?.[0];
 let size;try{size=allocation(container?.resources?.limits);}catch{return false;}
 return size.cpu===1000&&size.memory===512*2**20&&task.containers.length===1&&container.env?.length===2&&Number(task.maxRetries)===0&&Number(task.timeoutSeconds)===180&&
  !task.volumes?.length&&task?.serviceAccountName===expected.serviceAccountName&&container?.image===source.image&&
  JSON.stringify(container?.command)===JSON.stringify(source.command)&&JSON.stringify(container?.args)===JSON.stringify(source.args)&&
  container?.env?.some(variable=>variable.name==='CPU_MODEL_URL'&&variable.value===source.env[0].value)&&
  container?.env?.some(variable=>variable.name==='LLM_WORKER_SECRET'&&variable.valueFrom?.secretKeyRef?.name==='elevate-owned-llm-token');
}

export async function probeAdminModelInvocation({base,identity,image,run=google,capacity=inspectRegionalCapacity,name='elevate-paris-probe-'+(process.env.GITHUB_RUN_ID||Date.now())}={}) {
 const manifest=adminProbeManifest({base,identity,image,name});
 const task=manifest.spec.template.spec.template.spec;
 const budget=await capacity({region:REGION,task,run});
 if(!budget.fits)fail('CAPACITY_REQUIRED');
 const scope=['--project',PROJECT,'--region',REGION];
 const directory=mkdtempSync(join(tmpdir(),'owned-cpu-admin-probe-'));
 try {
  const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(manifest),{mode:0o600});
  run(['run','jobs','replace',file,...scope,'--quiet']);
  const saved=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json']));
  if(!matchesProbe(saved.spec?.template?.spec?.template?.spec,task))fail('JOB_READBACK_FAILED');
  let executionError;
  try {run(['run','jobs','execute',name,...scope,'--tasks=1','--wait','--quiet']);}catch(error){executionError=error.code||'execution_failed';}
  const completedJob=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json']));
  const executionName=completedJob.status?.latestCreatedExecution?.name;
  if(!executionName?.startsWith(name+'-')||!/^[a-z0-9-]+$/.test(executionName))fail('EXECUTION_UNVERIFIED');
  const execution=JSON.parse(run(['run','jobs','executions','describe',executionName,...scope,'--format=json']));
  if(!matchesProbe(execution.spec?.template?.spec,task))fail('EXECUTION_IDENTITY_UNVERIFIED');
  const verified=execution.status?.conditions?.some(condition=>condition.type==='Completed'&&condition.status==='True')===true&&Number(execution.status?.succeededCount)===1;
  let discovery;
  for(let attempt=0;attempt<3&&!discovery;attempt++) {
    try {
      const entries=JSON.parse(run(['logging','read',`resource.type="cloud_run_job" AND resource.labels.job_name="${name}" AND labels."run.googleapis.com/execution_name"="${executionName}"`,'--project',PROJECT,'--freshness=10m','--limit=20','--format=json']));
      for(const entry of entries){let payload;try{payload=entry.jsonPayload||JSON.parse(entry.textPayload||'');}catch{continue;}if(payload.probe==='owned-cpu-admin')discovery={verified:payload.verified===true,httpStatus:payload.httpStatus,error:payload.error};}
    } catch { /* Execution status and immutable task identity remain authoritative. */ }
    if(!discovery&&attempt<2)await new Promise(resolve=>setTimeout(resolve,2000));
  }
  return {verified,identity,modelUrl:base,job:name,execution:executionName,region:REGION,...(executionError?{executionError}:{}),...(discovery?{discovery}:{}),configurationChanged:false,permissionsChanged:false};
 } finally {rmSync(directory,{recursive:true,force:true});}
}

export async function probeServingAdminModel({base,run=google,...options}={}) {
 const service=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 const traffic=service.status?.traffic?.filter(item=>item.percent>0);
 if(traffic?.length!==1||traffic[0].percent!==100||!/^elevate-admin-migration-[a-z0-9-]+$/.test(traffic[0].revisionName??''))fail('SERVING_REVISION_UNVERIFIED');
 const revision=JSON.parse(run(['run','revisions','describe',traffic[0].revisionName,'--project',PROJECT,'--region','us-central1','--format=json']));
 return probeAdminModelInvocation({base,identity:revision.spec?.serviceAccountName,image:revision.spec?.containers?.[0]?.image,run,...options});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 probeServingAdminModel({base:process.env.CPU_MODEL_URL}).then(report=>{console.log(JSON.stringify(report));if(!report.verified)process.exitCode=1;}).catch(error=>{console.error(JSON.stringify({error:error.message?.startsWith('OWNED_CPU_ADMIN_PROBE_')?error.message:error.code||'admin_probe_failed'}));process.exitCode=1;});
}
