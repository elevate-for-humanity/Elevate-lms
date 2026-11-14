import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function validateManifest(m){
 if(m.schema!=='efh-recovery-manifest-v1'||!Array.isArray(m.runs))throw Error('INVALID_MANIFEST');
 const ids=new Set(),counts={};
 for(const r of m.runs){
  if(!Number.isSafeInteger(r.id)||ids.has(r.id)||!/^[a-f0-9]{40}$/.test(r.sha)||!r.path.startsWith('.github/workflows/'))throw Error('INVALID_OR_DUPLICATE_RUN');
  ids.add(r.id);const k=r.result||r.status;counts[k]=(counts[k]||0)+1;
 }
 if(JSON.stringify(Object.entries(counts).sort())!==JSON.stringify(Object.entries(m.snapshot_counts).sort()))throw Error('SNAPSHOT_COUNTS_MISMATCH');
 return counts;
}
export function serviceFor(path){
 const f=path.split('/').at(-1);
 if(f==='deploy-admin.yml'||f==='release-built-course-admin.yml')return 'admin';
 if(f==='deploy-google-lms-trigger.yml')return 'lms';
 if(f==='deploy-google-marketing-trigger.yml')return 'marketing';
 if(f==='deploy-google-store-runtime.yml')return 'store';
 if(/studio/.test(f))return 'studio';
 if(f==='deploy-google-course-worker.yml')return 'course';
 return null;
}
export function ancestry(older,newer){
 if(!/^[a-f0-9]{40}$/.test(older||'')||!/^[a-f0-9]{40}$/.test(newer||''))return null;
 const has=spawnSync('git',['cat-file','-e',older+'^{commit}']);
 if(has.status!==0)return null;
 const check=spawnSync('git',['cat-file','-e',newer+'^{commit}']);
 if(check.status!==0)return null;
 const r=spawnSync('git',['merge-base','--is-ancestor',older,newer]);
 return r.status===0?true:r.status===1?false:null;
}
export function classify({service,inMain,inLive,live,jobsComplete}){
 if(!jobsComplete)return 'JOB_EVIDENCE_INCOMPLETE';
 if(inMain===false)return 'SOURCE_NOT_IN_CURRENT_MAIN';
 if(inMain===null)return 'SOURCE_ANCESTRY_UNKNOWN';
 if(!service)return 'COORDINATION_OR_SPECIAL_RELEASE_REQUIRES_REVIEW';
 if(live?.verified&&inLive===true)return 'SOURCE_ANCESTRY_PRESENT_IN_VERIFIED_LIVE';
 if(live?.verified&&inLive===false)return 'SOURCE_NOT_IN_VERIFIED_LIVE_REVISION';
 return 'CURRENT_PRODUCTION_NOT_VERIFIED';
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function getJobs(get,id){
 const jobs=[];let total=0;
 for(let page=1;page<=100;page++){
  const d=await get('/actions/runs/'+id+'/jobs?filter=latest&per_page=100&page='+page);
  if(!Array.isArray(d.jobs)||!Number.isInteger(d.total_count))throw Error('INVALID_JOB_PAGE');
  total=d.total_count;jobs.push(...d.jobs);
  if(jobs.length>=total)return {complete:true,total,jobs};
  if(!d.jobs.length)throw Error('INCOMPLETE_JOB_PAGE');
 }
 throw Error('JOB_PAGINATION_LIMIT');
}
export function compactJobs(d){return {complete:d.complete,total:d.total,items:d.jobs.map(j=>({id:j.id,name:j.name,status:j.status,conclusion:j.conclusion,failedSteps:(j.steps||[]).filter(s=>s.conclusion==='failure').map(s=>({number:s.number,name:s.name})),skippedSteps:(j.steps||[]).filter(s=>s.conclusion==='skipped').map(s=>({number:s.number,name:s.name}))}))};}

async function productionSnapshot(){
 const out={};
 for(const [name,service] of Object.entries({admin:'elevate-admin-migration',lms:'elevate-lms-migration',marketing:'elevate-marketing-migration',store:'elevate-store-migration',studio:'elevate-studio-browser'})){
  try{
   const s=JSON.parse(execFileSync('gcloud',['run','services','describe',service,'--project=elegant-racer-299721','--region=us-central1','--format=json'],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}));
   const traffic=(s.status?.traffic||[]).filter(t=>Number(t.percent)>0);
   const revisions=[];
   for(const t of traffic){
    const rev=JSON.parse(execFileSync('gcloud',['run','revisions','describe',t.revisionName,'--project=elegant-racer-299721','--region=us-central1','--format=json'],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}));
    const containers=rev.spec?.containers||[];
    const candidates=containers.flatMap(c=>(c.env||[]).filter(e=>/COMMIT|GIT_SHA|SOURCE_SHA/.test(e.name)&&/^[a-f0-9]{40}$/.test(e.value||'')).map(e=>e.value));
    const labeled=Object.entries(rev.metadata?.labels||{}).filter(([k,v])=>/commit|sha/.test(k)&&/^[a-f0-9]{40}$/.test(v)).map(([,v])=>v);
    const commits=[...new Set([...candidates,...labeled])];
    revisions.push({revision:t.revisionName,percent:t.percent,commits,digest:rev.status?.imageDigest||null,ready:rev.status?.conditions?.some(c=>c.type==='Ready'&&c.status==='True')===true});
   }
   const url=s.status?.url;
   let health={verified:false};
   if(url){
    const token=execFileSync('gcloud',['auth','print-identity-token','--audiences='+url],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}).trim();
    const response=await fetch(url+'/api/health',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
    const body=await response.json();
    const sha=body.commit||body.github||body.publicCommit;
    health={status:response.status,commit:/^[a-f0-9]{40}$/.test(sha||'')?sha:null,ready:body.ready===true,healthy:body.healthy===true,supabase:body.dependencies?.supabase?.ok===true};
   }
   const single=revisions.length===1&&Number(revisions[0].percent)===100&&revisions[0].ready;
   const revisionMatches=single&&revisions[0].commits.length===1&&revisions[0].commits[0]===health.commit;
   out[name]={service,observedAt:new Date().toISOString(),revisions,health,commit:health.commit||null,verified:!!(single&&revisionMatches&&health.status===200&&health.ready&&health.healthy&&health.supabase)};
  }catch(e){out[name]={service,verified:false,error:String(e.message).slice(0,400)};}
 }
 out.course={verified:false,note:'Cloud Run job image and execution acceptance require separate job evidence; web traffic is not applicable.'};
 return out;
}
export async function runAudit(){
 const manifest=JSON.parse(await readFile('scripts/audits/recovery-manifest-20261107.json','utf8'));
 const baseline=validateManifest(manifest),root='https://api.github.com/repos/elevate-for-humanity/Elevate-lms';
 const started=Date.now(),deadline=started+330*60000;
 await mkdir('audit-output',{recursive:true});
 const evidence={schema:'efh-consolidated-recovery-audit-v1',startedAt:new Date(started).toISOString(),baseline,expected:manifest.runs.length,inspected:0,complete:false,main:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),productionAtStart:await productionSnapshot(),records:[],errors:[]};
 let calls=0;
 async function get(path){
  for(let attempt=0;attempt<8;attempt++){
   if(Date.now()>deadline)throw Error('AUDIT_TIME_BUDGET_EXHAUSTED');
   const r=await fetch(root+path,{headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});calls++;
   if(r.ok)return r.json();
   const reset=Number(r.headers.get('x-ratelimit-reset')||0)*1000;
   if(r.status===429||(r.status===403&&r.headers.get('x-ratelimit-remaining')==='0')){
    const until=Math.max(Date.now()+60000,reset+3000);
    if(until>deadline)throw Error('RATE_LIMIT_EXCEEDS_RUN_DEADLINE');
    console.log(JSON.stringify({event:'rate_limit_wait',inspected:evidence.inspected,resumesAt:new Date(until).toISOString()}));
    await checkpoint();while(Date.now()<until)await sleep(Math.min(30000,until-Date.now()));continue;
   }
   if((r.status>=500||r.status===403)&&attempt<3){await sleep((attempt+1)*5000);continue;}
   throw Error('GITHUB_HTTP_'+r.status);
  }
  throw Error('GITHUB_RETRY_LIMIT');
 }
 async function checkpoint(){
  evidence.requests=calls;evidence.updatedAt=new Date().toISOString();
  await writeFile('audit-output/consolidated-recovery.json',JSON.stringify(evidence,null,2)+'\n');
 }
 const ancestors=new Map();
 for(const original of manifest.runs){
  let jobs;
  try{jobs=compactJobs(await getJobs(get,original.id));}catch(e){jobs={complete:false,items:[],error:e.message};evidence.errors.push({run:original.id,error:e.message});}
  if(!ancestors.has(original.sha))ancestors.set(original.sha,ancestry(original.sha,evidence.main));
  evidence.records.push({original,service:serviceFor(original.path),inMain:ancestors.get(original.sha),jobs});evidence.inspected++;
  if(evidence.inspected%25===0){await checkpoint();console.log(JSON.stringify({event:'progress',inspected:evidence.inspected,total:evidence.expected,requests:calls}));}
  if(Date.now()>deadline)break;
 }
 evidence.productionAtEnd=await productionSnapshot();
 for(const r of evidence.records){const live=evidence.productionAtEnd[r.service];r.inLive=live?.commit?ancestry(r.original.sha,live.commit):null;r.classification=classify({service:r.service,inMain:r.inMain,inLive:r.inLive,live,jobsComplete:r.jobs.complete});}
 evidence.complete=evidence.inspected===evidence.expected&&evidence.records.every(r=>r.jobs.complete);
 evidence.uninspected=manifest.runs.slice(evidence.inspected).map(x=>x.id);
 evidence.classifications={};for(const r of evidence.records)evidence.classifications[r.classification]=(evidence.classifications[r.classification]||0)+1;
 await checkpoint();
 const summary='# Consolidated recovery audit\n\nBaseline: '+JSON.stringify(baseline)+'. Total: '+evidence.expected+'. Inspected: '+evidence.inspected+'. Complete job inventory: '+evidence.complete+'.\n\nMain: '+evidence.main+'.\n\nCommit ancestry is not proof that individual changes were not later reverted or that every feature passes acceptance. Green workflow results are not deployment evidence. No historical deployment is replayed by this audit.\n\n## Classifications\n\n'+Object.entries(evidence.classifications).map(([k,v])=>'- '+k+': '+v).join('\n')+'\n\n## Run by run\n\n| Original run | Original outcome | Service | In main | Classification | Failed steps |\n|---|---|---|---|---|---|\n'+evidence.records.map(r=>'| ['+r.original.id+']('+r.original.url+') | '+(r.original.result||r.original.status)+' | '+(r.service||'special/coordination')+' | '+r.inMain+' | '+r.classification+' | '+r.jobs.items.flatMap(j=>j.failedSteps.map(s=>(j.name+': '+s.name).replaceAll('|','/').replaceAll('\n',' '))).join('; ')+' |').join('\n')+'\n';
 await writeFile('audit-output/consolidated-recovery.md',summary);
 if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary.slice(0,900000));
 console.log(JSON.stringify({event:'finished',complete:evidence.complete,inspected:evidence.inspected,classifications:evidence.classifications}));
 if(!evidence.complete)process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runAudit();
