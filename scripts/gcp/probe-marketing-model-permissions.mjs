import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {allocation,inspectRegionalCapacity} from './regional-capacity.mjs';

const REGION='us-east1';
const IDENTITY=`elevate-marketing-runtime@${PROJECT}.iam.gserviceaccount.com`;
const fail=code=>{throw Error('MARKETING_MODEL_PERMISSIONS_'+code);};

// The actual serving identity tests its own permissions. No model credential,
// website configuration, applicant record, or application prompt is attached.
export const PERMISSIONS_PROBE_SOURCE=`
const report={probe:'marketing-model-permissions',verified:false};
try {
 const metadata=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!metadata.ok)throw Error('IDENTITY_UNAVAILABLE');
 const token=(await metadata.json()).access_token;
 if(typeof token!=='string'||token.length<20)throw Error('IDENTITY_UNAVAILABLE');
 const targets=[
  ['modelInvocation','https://run.googleapis.com/v2/projects/${PROJECT}/locations/us-east1/services/elevate-owned-cpu-llm:testIamPermissions','run.routes.invoke'],
  ['modelCredential','https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/elevate-owned-llm-token:testIamPermissions','secretmanager.versions.access'],
 ];
 for(const [name,url,permission] of targets){
  const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({permissions:[permission]}),redirect:'error',signal:AbortSignal.timeout(15000)});
  const body=await response.json().catch(()=>({}));
  report[name]={verifiedResponse:response.ok,httpStatus:response.status,granted:response.ok&&body.permissions?.includes(permission)===true};
 }
 report.verified=report.modelInvocation.granted&&report.modelCredential.granted;
} catch {report.error='PERMISSION_READBACK_FAILED';}
console.log(JSON.stringify(report));process.exitCode=report.verified?0:1;
`;

export function marketingPermissionsManifest({identity,image,name}) {
 if(identity!==IDENTITY)fail('IDENTITY_UNVERIFIED');
 if(!/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/marketing@sha256:[a-f0-9]{64}$/.test(image??''))fail('IMAGE_UNVERIFIED');
 if(!/^elevate-marketing-permissions-[0-9-]{1,25}$/.test(name??''))fail('NAME_UNVERIFIED');
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:identity,maxRetries:0,timeoutSeconds:90,containers:[{image,command:['node'],args:['--max-old-space-size=128','--input-type=module','-e',PERMISSIONS_PROBE_SOURCE],resources:{limits:{cpu:'1',memory:'512Mi'}}}]}}}}}};
}

function matches(task,expected) {
 let size;try{size=allocation(task?.containers?.[0]?.resources?.limits);}catch{return false;}
 const container=task?.containers?.[0],source=expected.containers[0];
 return task?.serviceAccountName===expected.serviceAccountName&&Number(task.maxRetries)===0&&Number(task.timeoutSeconds)===90&&
  !task.volumes?.length&&task.containers?.length===1&&!container.env?.length&&size.cpu===1000&&size.memory===512*2**20&&
  container.image===source.image&&JSON.stringify(container.command)===JSON.stringify(source.command)&&JSON.stringify(container.args)===JSON.stringify(source.args);
}

export async function probeMarketingModelPermissions({run=google,capacity=inspectRegionalCapacity,name=`elevate-marketing-permissions-${process.env.GITHUB_RUN_ID||Date.now()}-${process.env.GITHUB_RUN_ATTEMPT||1}`}={}) {
 const scope=['--project',PROJECT,'--region',REGION];
 const service=JSON.parse(run(['run','services','describe','elevate-marketing-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 const traffic=service.status?.traffic?.filter(item=>item.percent>0);
 if(traffic?.length!==1||traffic[0].percent!==100||!/^elevate-marketing-migration-[a-z0-9-]+$/.test(traffic[0].revisionName??''))fail('SERVING_REVISION_UNVERIFIED');
 const revision=JSON.parse(run(['run','revisions','describe',traffic[0].revisionName,'--project',PROJECT,'--region','us-central1','--format=json']));
 const manifest=marketingPermissionsManifest({identity:revision.spec?.serviceAccountName,image:revision.spec?.containers?.[0]?.image,name});
 const task=manifest.spec.template.spec.template.spec;
 if(!(await capacity({region:REGION,task,run})).fits)fail('CAPACITY_REQUIRED');
 const directory=mkdtempSync(join(tmpdir(),'marketing-model-permissions-'));
 try {
  const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(manifest),{mode:0o600});
  run(['run','jobs','replace',file,...scope,'--quiet']);
  const saved=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json']));
  if(!matches(saved.spec?.template?.spec?.template?.spec,task))fail('JOB_READBACK_FAILED');
  let executionError;
  try {run(['run','jobs','execute',name,...scope,'--tasks=1','--wait','--quiet']);}catch(error){executionError=error.code||'execution_failed';}
  const completed=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json']));
  const executionName=completed.status?.latestCreatedExecution?.name;
  if(!executionName?.startsWith(name+'-')||!/^[a-z0-9-]+$/.test(executionName))fail('EXECUTION_UNVERIFIED');
  const execution=JSON.parse(run(['run','jobs','executions','describe',executionName,...scope,'--format=json']));
  if(!matches(execution.spec?.template?.spec,task))fail('EXECUTION_IDENTITY_UNVERIFIED');
  const verified=execution.status?.conditions?.some(condition=>condition.type==='Completed'&&condition.status==='True')===true&&Number(execution.status?.succeededCount)===1;
  const result={verified,identity:IDENTITY,execution:executionName,configurationChanged:false,permissionsChanged:false,...(executionError?{executionError}:{})};
  for(let attempt=0;attempt<3&&!result.modelInvocation;attempt++){
   try {
    const entries=JSON.parse(run(['logging','read',`resource.type="cloud_run_job" AND resource.labels.job_name="${name}" AND labels."run.googleapis.com/execution_name"="${executionName}"`,'--project',PROJECT,'--freshness=10m','--limit=20','--format=json']));
    for(const entry of entries){
     let payload;try{payload=entry.jsonPayload||JSON.parse(entry.textPayload||'');}catch{continue;}
     if(payload.probe!=='marketing-model-permissions')continue;
     for(const key of ['modelInvocation','modelCredential'])if(payload[key])result[key]={verifiedResponse:payload[key].verifiedResponse===true,granted:payload[key].granted===true,httpStatus:payload[key].httpStatus};
    }
   }catch(error){result.logReadbackStatus=error.code||'unavailable';}
   if(!result.modelInvocation&&attempt<2)await new Promise(resolve=>setTimeout(resolve,2000));
  }
  return result;
 } finally {rmSync(directory,{recursive:true,force:true});}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 probeMarketingModelPermissions().then(report=>{console.log(JSON.stringify(report));if(!report.verified)process.exitCode=1;}).catch(error=>{console.error(JSON.stringify({code:error.message?.startsWith('MARKETING_MODEL_PERMISSIONS_')?error.message:error.code||'permission_probe_failed',...(error.message?.startsWith('Google operation failed: ')?{operation:error.message.slice(25)}:{})}));process.exitCode=1;});
