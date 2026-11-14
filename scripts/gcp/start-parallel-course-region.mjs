import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {google,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity,isTerminalExecution} from './regional-capacity.mjs';
const region='us-east1',name='elevate-course-builder-parallel';
const read=(args,r=region)=>JSON.parse(google([...args,'--project='+PROJECT,'--region='+r,'--format=json']));
async function main() {
 const source=read(['run','jobs','describe','elevate-course-builder'],'us-central1');
 const task=source.spec.template.spec.template.spec;
 if(task.containers.length!==1||!/@sha256:[a-f0-9]{64}$/.test(task.containers[0].image))throw Error('Verified immutable worker image required');
 const pending=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs?select=id,status,heartbeat_at,attempts,max_attempts&status=eq.queued&order=priority.asc,available_at.asc,created_at.asc&limit=20',{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(30000)}).then(async r=>{if(!r.ok)throw Error('Queue read failed');return r.json();});
 const candidates=pending.filter(j=>j.attempts<j.max_attempts);
 if(candidates.length<2)throw Error('Two runnable courses required; no duplicate execution launched');
 const capacity=await inspectRegionalCapacity({region,task:{...task,containers:[...task.containers,...task.containers]}});
 console.log(JSON.stringify({kind:'regionalCapacity',...capacity}));
 if(!capacity.fits)throw Error('Second region does not have approved capacity for two tasks');
 const jobs=read(['run','jobs','list']);
 if(jobs.some(j=>j.metadata.name===name)) {
  const running=read(['run','jobs','executions','list','--job='+name]).filter(e=>!isTerminalExecution(e));
  if(running.length)throw Error('Parallel worker already active; no duplicate launched');
 }
 const directory=mkdtempSync(join(tmpdir(),'course-regional-'));
 try {
  const job={apiVersion:'run.googleapis.com/v1',kind:'Job',metadata:{name,namespace:PROJECT},spec:structuredClone(source.spec)};
  job.spec.template.spec.taskCount=2;job.spec.template.spec.parallelism=2;
  const file=join(directory,'job.json');writeFileSync(file,JSON.stringify(job),{mode:0o600});
  google(['run','jobs','replace',file,'--project='+PROJECT,'--region='+region,'--quiet']);
  const verified=read(['run','jobs','describe',name]);
  if(verified.spec.template.spec.template.spec.containers[0].image!==task.containers[0].image||Number(verified.spec.template.spec.taskCount)!==2)throw Error('Regional clone readback mismatch');
  google(['run','jobs','execute',name,'--project='+PROJECT,'--region='+region,'--tasks=2','--async','--quiet']);
  console.log(JSON.stringify({kind:'regionalLaunch',region,job:name,tasks:2,imagePreserved:true}));
  const ids=candidates.slice(0,2).map(j=>j.id);
  for(let i=0;i<60;i++) {
   const r=await fetch('https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs?select=id,status,heartbeat_at,lease_owner,lease_expires_at&id=in.('+ids.join(',')+')',{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error('Claim verification read failed');const rows=await r.json();
   if(rows.length===2&&rows.every(j=>j.status==='running'&&j.lease_owner&&Date.parse(j.lease_expires_at)>Date.now())){console.log(JSON.stringify({kind:'parallelClaims',jobIds:ids,allRunning:true}));return;}
   await new Promise(r=>setTimeout(r,5000));
  }
  throw Error('Parallel workers launched but fresh claims were not verified');
 } finally {rmSync(directory,{recursive:true,force:true});}
}
main().catch(e=>{console.error(JSON.stringify({parallelStarted:false,reason:e.code||'parallel_start_failed',detail:e.message}));process.exitCode=1;});
