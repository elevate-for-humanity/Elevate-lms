import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,allocation} from './regional-capacity.mjs';
import {vertexLessonGenerationConfig} from '../../lib/ultimate-course-builder/instructional/vertex-response.mjs';

export function vertexProfileDatabase(job,run){
 if(job?.metadata?.name!=='elevate-course-builder')throw Error('VERTEX_EXISTING_WORKER_REQUIRED');
 const values={};
 for(const item of job.spec?.template?.spec?.template?.spec?.containers?.[0]?.env||[]){
  if(!['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].includes(item.name))continue;
  if(typeof item.value==='string')values[item.name]=item.value;
  else{
   const ref=item.valueFrom?.secretKeyRef;
   if(!/^[A-Za-z0-9_-]+$/.test(ref?.name||'')||!/^(latest|[1-9][0-9]*)$/.test(ref?.key||''))throw Error('VERTEX_DATABASE_REFERENCE_UNVERIFIED');
   values[item.name]=run(['secrets','versions','access',ref.key,'--secret='+ref.name,'--project='+PROJECT]);
  }
 }
 const base=values.NEXT_PUBLIC_SUPABASE_URL||values.SUPABASE_URL;
 if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!values.SUPABASE_SERVICE_ROLE_KEY)throw Error('VERTEX_PROFILE_DATABASE_UNAVAILABLE');
 return {base,key:values.SUPABASE_SERVICE_ROLE_KEY};
}

export function vertexWorkSource(model,location){
 if(!/^gemini-[a-z0-9.-]+$/.test(model||'')||!['us','eu','global','us-central1','us-east1'].includes(location))throw Error('VERTEX_PROFILE_UNVERIFIED');
 const host=location==='global'?'aiplatform.googleapis.com':['us','eu'].includes(location)?'aiplatform.'+location+'.rep.googleapis.com':location+'-aiplatform.googleapis.com';
 const endpoint='https://'+host+'/v1/projects/'+PROJECT+'/locations/'+location+'/publishers/google/models/'+model+':generateContent';
 const config=vertexLessonGenerationConfig(model,512);
 return `(async()=>{let phase='identity';try{
 const auth=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!auth.ok)throw Error('IDENTITY_UNAVAILABLE');const token=(await auth.json()).access_token;if(!token)throw Error('IDENTITY_UNAVAILABLE');
 phase='generation';const r=await fetch(${JSON.stringify(endpoint)},{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Return only the JSON object {"answer":4} for two plus two.'}]}],generationConfig:${JSON.stringify(config)}}),redirect:'error',signal:AbortSignal.timeout(60000)});
 const body=await r.json();let answer;try{answer=JSON.parse(body.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('')||'');}catch{}
 const passed=r.ok&&answer?.answer===4;console.log(JSON.stringify({probe:'vertex-paid-work',passed,httpStatus:r.status,model:${JSON.stringify(model)},location:${JSON.stringify(location)},finishReason:body.candidates?.[0]?.finishReason||null,totalTokens:body.usageMetadata?.totalTokenCount||null}));if(!passed)process.exitCode=1;
 }catch{console.log(JSON.stringify({probe:'vertex-paid-work',passed:false,phase,error:'VERTEX_FUNCTIONAL_CHECK_UNAVAILABLE'}));process.exitCode=1;}})();`;
}
export function vertexWorkManifest({name,identity,image,model,location}){
 if(!/^elevate-vertex-proof-[0-9-]{1,25}$/.test(name)||!/^elevate-[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(identity||'')||!/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/[a-z0-9-]+@sha256:[a-f0-9]{64}$/.test(image||''))throw Error('VERTEX_EXISTING_WORKER_REQUIRED');
 return {apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:identity,maxRetries:0,timeoutSeconds:90,containers:[{image,command:['node'],args:['--max-old-space-size=128','--input-type=module','-e',vertexWorkSource(model,location)],resources:{limits:{cpu:'1',memory:'512Mi'}}}]}}}}}};
}
function matches(task,expected){
 let size;try{size=allocation(task?.containers?.[0]?.resources?.limits);}catch{return false;}
 const container=task?.containers?.[0],source=expected.containers[0];
 return task.serviceAccountName===expected.serviceAccountName&&Number(task.maxRetries)===0&&Number(task.timeoutSeconds)===90&&
 !task.volumes?.length&&task.containers?.length===1&&!container.env?.length&&size.cpu===1000&&size.memory===512*2**20&&
 container.image===source.image&&isDeepStrictEqual(container.command,source.command)&&isDeepStrictEqual(container.args,source.args);
}
export async function verifyVertexWork({run=google,request=fetch,capacity=inspectRegionalCapacity}={}){
 let phase='read-existing-worker',created=false,dir;const name=`elevate-vertex-proof-${process.env.GITHUB_RUN_ID||Date.now()}-${process.env.GITHUB_RUN_ATTEMPT||1}`;
 const scope=['--project='+PROJECT,'--region=us-east1'];
 try{
  const job=JSON.parse(run(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region=us-central1','--format=json']));
  const actual=job.spec?.template?.spec?.template?.spec;
  phase='read-existing-database-bindings';
  const env=vertexProfileDatabase(job,run);
  phase='read-current-vertex-profile';
  const response=await request(env.base+'/rest/v1/ultimate_course_builds?select=profile&profile->instructionalAuthoring->>provider=eq.google&order=updated_at.desc&limit=1',{headers:{apikey:env.key,Authorization:'Bearer '+env.key},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('VERTEX_PROFILE_LOOKUP_UNAVAILABLE');
  const selected=(await response.json())[0]?.profile?.instructionalAuthoring;
  const manifest=vertexWorkManifest({name,identity:actual?.serviceAccountName,image:actual?.containers?.[0]?.image,model:selected?.model,location:selected?.location}),task=manifest.spec.template.spec.template.spec;
  phase='check-probe-capacity';if(!(await capacity({region:'us-east1',task,run})).fits)throw Error('VERTEX_PROBE_CAPACITY_REQUIRED');
  phase='check-unique-probe-name';
  try{run(['run','jobs','describe',name,...scope,'--format=json']);throw Error('VERTEX_PROBE_NAME_ALREADY_EXISTS');}catch(error){if(error.code!=='not_found')throw error;}
  dir=mkdtempSync(join(tmpdir(),'vertex-proof-'));const file=join(dir,'job.json');writeFileSync(file,JSON.stringify(manifest),{mode:0o600});
  phase='create-bounded-probe';run(['run','jobs','replace',file,...scope,'--quiet']);created=true;
  const saved=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json']));
  if(!matches(saved.spec?.template?.spec?.template?.spec,task))throw Error('VERTEX_PROBE_READBACK_FAILED');
  phase='execute-bounded-probe';let executionError;try{run(['run','jobs','execute',name,...scope,'--tasks=1','--wait','--quiet']);}catch(error){executionError=error.code||'failed';}
  const complete=JSON.parse(run(['run','jobs','describe',name,...scope,'--format=json'])),execution=complete.status?.latestCreatedExecution?.name;
  if(!execution?.startsWith(name+'-')||!/^[a-z0-9-]+$/.test(execution))throw Error('VERTEX_EXECUTION_UNVERIFIED');
  const receipt=JSON.parse(run(['run','jobs','executions','describe',execution,...scope,'--format=json']));
  if(!matches(receipt.spec?.template?.spec,task))throw Error('VERTEX_EXECUTION_IDENTITY_UNVERIFIED');
  const passed=receipt.status?.conditions?.some(x=>x.type==='Completed'&&x.status==='True')&&Number(receipt.status?.succeededCount)===1;
  return {passed:Boolean(passed),phase,execution,identity:task.serviceAccountName,model:selected.model,location:selected.location,actualGeneration:Boolean(passed),completedAt:receipt.status?.completionTime||null,executionError:executionError||null,productionConfigurationChanged:false,permissionsChanged:false,scope:'one synthetic request; course quality/publication not attested'};
 }catch(error){return {passed:false,phase,error:/^VERTEX_[A-Z_]+$/.test(error.message||'')?error.message:error.code||'VERTEX_WORK_CHECK_UNAVAILABLE',operation:error.message?.startsWith('Google operation failed: ')?error.message.slice(25):null,productionConfigurationChanged:false,permissionsChanged:false};}
 finally{
  if(created){try{run(['run','jobs','delete',name,...scope,'--quiet']);}catch{console.error(JSON.stringify({probeCleanupRequired:true,name}));}}
  if(dir)rmSync(dir,{recursive:true,force:true});
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=await verifyVertexWork();console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}
