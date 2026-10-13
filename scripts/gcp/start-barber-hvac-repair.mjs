import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
const region='us-east1',name='elevate-course-builder-repair';
const expectedSha=process.env.REPAIRED_IMAGE_SHA;
if(!/^[a-f0-9]{40}$/.test(expectedSha??''))throw Error('EXACT_REPAIRED_IMAGE_REQUIRED');
const read=(args,r=region)=>JSON.parse(google([...args,'--project='+PROJECT,'--region='+r,'--format=json']));
const source=read(['run','jobs','describe','elevate-course-builder'],'us-central1');
const task=source.spec.template.spec.template.spec;
const expected=JSON.parse(google(['artifacts','docker','images','describe','us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker:'+expectedSha,'--format=json']));
if(!task.containers[0].image.endsWith('@'+expected.image_summary.digest))throw Error('REPAIRED_WORKER_DEPLOYMENT_REQUIRED');
const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!token)throw Error('DATABASE_AUTH_REQUIRED');
const headers={apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'};
async function rest(path,method='GET',body){
 const r=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('DATABASE_HTTP_'+r.status);return r.status===204?[]:r.json();
}
const builds=await rest('ultimate_course_builds?select=id,course_id,profile&profile->>referenceRegeneration=eq.owner-approved-video-2026-10-12.2');
const allowed=['2c723bfa-8c40-4acc-b961-98d917710ffc','9ca9fb50-7119-46ea-ab81-9b0193c29c31','0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'];
if(builds.length!==3||builds.some(b=>!allowed.includes(b.course_id)))throw Error('EXACT_REGENERATION_BUILDS_REQUIRED');
const allJobs=await rest('ultimate_build_jobs?build_id=in.('+builds.map(b=>b.id).join(',')+')&status=in.(queued,running)');
const jobs=allJobs.filter(j=>j.build_id!=='d1d4ed9b-d45b-410e-8d89-53e751daa510');
const cosmo=allJobs.find(j=>j.build_id==='d1d4ed9b-d45b-410e-8d89-53e751daa510');
if(jobs.length!==2||!cosmo)throw Error('EXACT_BARBER_HVAC_JOBS_REQUIRED');
if(!jobs.length){console.log(JSON.stringify({status:'no_runnable_regeneration'}));process.exit(0);}
const queued=await rest('ultimate_build_jobs?select=id&status=eq.queued&available_at=lte.'+encodeURIComponent(new Date().toISOString()));
if(queued.some(j=>!jobs.some(target=>target.id===j.id)))throw Error('UNRELATED_QUEUED_WORK_PRESENT');
const tasks=2;
const capacity=await inspectRegionalCapacity({region,task:{...task,containers:Array.from({length:tasks},()=>task.containers[0])}});
console.log(JSON.stringify({kind:'capacity',...capacity}));
if(!capacity.fits)throw Error('APPROVED_REGIONAL_CAPACITY_UNAVAILABLE');
// Fence only the affected jobs; never cancel the shared execution or cosmetology.
for(const j of jobs){
 const build=builds.find(b=>b.id===j.build_id);
 const payload=structuredClone(j.payload??{});
 if(j.build_id==='078529f7-3cb3-4863-8afa-9d6bcaf167dd'){
  payload.repairCompetencyId='barber-b';
  payload.repairCompetencyIds=['barber-b',...(payload.repairCompetencyIds??[]).filter(id=>id!=='barber-b')];
  payload.unresolvedCompetencyIds=(payload.unresolvedCompetencyIds??[]).filter(id=>id!=='barber-b');
  payload.lessonRepairCounts={...(payload.lessonRepairCounts??{}),'barber-b':0};
 }
 const changed=await rest('ultimate_build_jobs?id=eq.'+j.id+'&execution_generation=eq.'+j.execution_generation,'PATCH',{
  payload,status:'queued',execution_generation:j.execution_generation+1,attempts:0,lease_owner:null,lease_expires_at:null,
  priority:allowed.indexOf(build.course_id),available_at:new Date().toISOString(),
  last_error:null,updated_at:new Date().toISOString()
 });
 if(changed.length!==1)throw Error('TARGET_LEASE_CHANGED_BEFORE_RESTART');
}
const directory=mkdtempSync(join(tmpdir(),'course-repaired-'));
try{
 const job={apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:structuredClone(source.spec)};
 job.spec.template.spec.taskCount=tasks;job.spec.template.spec.parallelism=tasks;
 const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(job),{mode:0o600});
 google(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
 const verified=read(['run','jobs','describe',name]);
 if(verified.spec.template.spec.template.spec.containers[0].image!==task.containers[0].image)throw Error('IMAGE_READBACK_MISMATCH');
 google(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--tasks='+tasks,'--async','--quiet']);
 const pending=new Map(jobs.map(j=>[j.id,String(j.heartbeat_at??'')]));
 for(let i=0;i<60;i++){
  const rows=await rest('ultimate_build_jobs?select=id,status,heartbeat_at,lease_owner,last_error,execution_generation&id=in.('+jobs.map(j=>j.id).join(',')+')');
  for(const row of rows){const previous=jobs.find(j=>j.id===row.id);if(row.heartbeat_at>pending.get(row.id)&&row.lease_owner&&row.lease_owner!==previous.lease_owner&&row.execution_generation>previous.execution_generation)pending.delete(row.id);}
  if(!pending.size){
 const untouched=await rest('ultimate_build_jobs?select=execution_generation,lease_owner&id=eq.'+cosmo.id);
 if(untouched[0]?.execution_generation!==cosmo.execution_generation||untouched[0]?.lease_owner!==cosmo.lease_owner)throw Error('COSMETOLOGY_LEASE_CHANGED_DURING_RESTART');
 console.log(JSON.stringify({status:'claimed',tasks,jobIds:jobs.map(j=>j.id),region,image:task.containers[0].image}));process.exit(0);}
  await new Promise(r=>setTimeout(r,5000));
 }
 throw Error('FRESH_REPAIRED_CLAIMS_NOT_VERIFIED');
}finally{rmSync(directory,{recursive:true,force:true});}
