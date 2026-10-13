import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
const region='us-east1',name='elevate-course-builder-overflow';
const read=(args,r=region)=>JSON.parse(google([...args,'--project='+PROJECT,'--region='+r,'--format=json']));
const source=read(['run','jobs','describe','elevate-course-builder'],'us-central1');
const task=source.spec.template.spec.template.spec;
const expected=JSON.parse(google(['artifacts','docker','images','describe','us-central1-docker.pkg.dev/'+PROJECT+'/elevate/ultimate-worker:5ca359e245f515bdc091089fa1123e9641482974','--format=json']));
if(!task.containers[0].image.endsWith('@'+expected.image_summary.digest))throw Error('REPAIRED_WORKER_DEPLOYMENT_REQUIRED');
const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!token)throw Error('DATABASE_AUTH_REQUIRED');
const headers={apikey:token,Authorization:'Bearer '+token};
const jobs=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs?select=id,status,attempts,max_attempts,heartbeat_at&status=eq.queued&order=priority.asc,available_at.asc,created_at.asc&limit=20',{headers,signal:AbortSignal.timeout(30000)}).then(async r=>{if(!r.ok)throw Error('Queue read failed');return r.json();});
const candidate=jobs.find(j=>j.attempts<j.max_attempts);
if(!candidate){console.log(JSON.stringify({status:'empty'}));process.exit(0);}
const inventory=read(['run','jobs','list']);
if(inventory.some(j=>j.metadata.name===name)&&read(['run','jobs','executions','list','--job='+name]).some(e=>!isTerminalExecution(e))){console.log(JSON.stringify({status:'already_active'}));process.exit(0);}
const capacity=await inspectRegionalCapacity({region,task});
console.log(JSON.stringify({kind:'capacity',...capacity}));
if(!capacity.fits)throw Error('APPROVED_REGIONAL_CAPACITY_UNAVAILABLE');
const directory=mkdtempSync(join(tmpdir(),'course-overflow-'));
try{
 const job={apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:structuredClone(source.spec)};
 job.spec.template.spec.taskCount=1;job.spec.template.spec.parallelism=1;
 const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(job),{mode:0o600});
 google(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
 const verified=read(['run','jobs','describe',name]);
 if(verified.spec.template.spec.template.spec.containers[0].image!==task.containers[0].image)throw Error('IMAGE_READBACK_MISMATCH');
 google(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--tasks=1','--async','--quiet']);
 for(let i=0;i<60;i++){
  const rows=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs?select=id,status,heartbeat_at,lease_owner,last_error&id=eq.'+candidate.id,{headers,signal:AbortSignal.timeout(30000)}).then(async r=>{if(!r.ok)throw Error('Claim read failed');return r.json();});
  if(rows[0]?.heartbeat_at>String(candidate.heartbeat_at??'')){console.log(JSON.stringify({status:'claimed',jobId:candidate.id,region,image:task.containers[0].image}));process.exit(0);}
  await new Promise(r=>setTimeout(r,5000));
 }
 throw Error('FRESH_WORKER_CLAIM_NOT_VERIFIED');
}finally{rmSync(directory,{recursive:true,force:true});}
