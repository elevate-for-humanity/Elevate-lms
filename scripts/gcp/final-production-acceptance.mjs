import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const PROJECT='elegant-racer-299721',DB='https://cuxzzpsyufcewtmicszk.supabase.co';
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error('PRODUCTION_SUPABASE_AUTH_REQUIRED');
const get=async(table,select,filter='')=>{
 const rows=[];
 const limit=500;
 let expected=null;
 for(let offset=0;offset<100000;offset+=limit){
  const url=new URL(DB+'/rest/v1/'+table);
  url.searchParams.set('select',select);
  url.searchParams.set('order','id.asc');
  url.searchParams.set('limit',String(limit));
  url.searchParams.set('offset',String(offset));
  if(filter){for(const [name,value] of new URLSearchParams(filter))url.searchParams.set(name,value);}
  const r=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'},signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw Error('PRODUCTION_READ_FAILED:'+table+':'+r.status);
  const page=await r.json();
  if(!Array.isArray(page))throw Error('PRODUCTION_READ_INVALID:'+table);
  const total=Number((r.headers.get('content-range')||'').split('/')[1]);
  if(!Number.isSafeInteger(total)||total<0)throw Error('PRODUCTION_COUNT_REQUIRED:'+table);
  if(expected===null)expected=total;
  if(total!==expected)throw Error('PRODUCTION_DATASET_CHANGED_DURING_SCAN:'+table);
  rows.push(...page);
  if(rows.length>=expected){
   if(rows.length!==expected||new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('PRODUCTION_READ_INCONSISTENT:'+table);
   return {rows,count:expected};
  }
  if(page.length!==limit)throw Error('PRODUCTION_READ_INCOMPLETE:'+table);
 }
 throw Error('PRODUCTION_READ_LIMIT_EXCEEDED:'+table);
};
const sha=process.env.IMAGE_SHA||process.env.GITHUB_SHA;
const checks=[];
const add=(name,ok,details={})=>checks.push({name,ok,...details});
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('EXACT_RELEASE_SHA_REQUIRED');
try{
 const output=execFileSync('node',['scripts/gcp/verify-course-runtime-contract.mjs'],{encoding:'utf8',env:{...process.env,IMAGE_SHA:sha},timeout:360000});
 const result=JSON.parse(output);add('five_worker_digest_and_identity',result.verified===true,{workers:result.workers?.length||0});
}catch(e){add('five_worker_digest_and_identity',false,{reason:String(e.message).slice(0,160).replace(/Bearer\s+\S+/gi,'[redacted]')});}
const jobs=await get('ultimate_build_jobs','id,status,attempts,max_attempts,monitor,heartbeat_at,lease_expires_at');
const counts=Object.fromEntries(['completed','failed','queued','running'].map(s=>[s,jobs.rows.filter(j=>j.status===s).length]));
const unmonitored=jobs.rows.filter(j=>['failed','queued','running'].includes(j.status)&&j.monitor?.enabled!==true).length;
const stale=jobs.rows.filter(j=>j.status==='running'&&(!j.heartbeat_at||Date.now()-Date.parse(j.heartbeat_at)>300000)).length;
const exhausted=jobs.rows.filter(j=>j.status==='failed'&&j.attempts>=j.max_attempts).length;
add('paris_monitoring',unmonitored===0,{unmonitored});
add('worker_heartbeat',stale===0,{stale});
add('failed_jobs_reconciled',counts.failed===0,{failed:counts.failed,exhausted});
add('queue_drained',counts.queued===0&&counts.running===0,{queued:counts.queued,running:counts.running});
const repairs=await get('paris_code_repairs','id,status');
const blocked=repairs.rows.filter(r=>r.status==='blocked').length;
add('paris_code_repairs',blocked===0,{blocked});
const courses=await get('courses','id,title,status','status=eq.published&limit=1000');
const releases=await get('ultimate_release_versions','course_id,status','status=eq.released&limit=1000');
const missing=courses.rows.filter(c=>!releases.rows.some(r=>r.course_id===c.id)).map(c=>c.title);
add('canonical_publication',missing.length===0,{missing});
mkdirSync('audit-output',{recursive:true});
const report={project:PROJECT,sha,observedAt:new Date().toISOString(),counts,checks,productionReady:checks.every(c=>c.ok),note:'Read-only database and Cloud Run gates. Authenticated learner playback and financial delivery require separate real acceptance receipts.'};
writeFileSync('audit-output/production-acceptance.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.productionReady)process.exitCode=1;
