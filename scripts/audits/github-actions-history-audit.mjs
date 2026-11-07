#!/usr/bin/env node
// Read-only historical workflow inventory. Never infer completeness from the
// 40,000 latest-run search cap; narrow searches by UTC time intervals.
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const ROOT='https://api.github.com/repos/elevate-for-humanity/Elevate-lms';
export async function auditHistory({start,end,request=fetch,maxRequests=300,maxJobRequests=75,status='skipped'}={}){
 if(!['skipped','all'].includes(status))throw Error('HISTORY_STATUS_FILTER_INVALID');
 const a=Date.parse(start),b=Date.parse(end);
 if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)throw Error('HISTORY_WINDOW_INVALID');
 if(!Number.isInteger(maxRequests)||maxRequests<1||!Number.isInteger(maxJobRequests)||maxJobRequests<0||maxJobRequests>maxRequests)throw Error('HISTORY_BUDGET_INVALID');
 let requests=0,jobRequests=0;
 const runs=[],jobs=[],remaining=[],errors=[],uninspectedJobs=[],windows=[];
 const headers={'Accept':'application/vnd.github+json','User-Agent':'Elevate-Actions-Audit','X-GitHub-Api-Version':'2022-11-28'};
 if(process.env.GH_TOKEN)headers.Authorization='Bearer '+process.env.GH_TOKEN;
 async function get(path){
  if(requests>=maxRequests)throw Error('HISTORY_REQUEST_BUDGET_EXHAUSTED');
  requests++;
  const r=await request(ROOT+path,{headers,signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('HISTORY_HTTP_'+r.status);
  return r.json();
 }
 async function scan(from,to){
  if(to<=from)return;
  const interval={from:new Date(from).toISOString(),to:new Date(to).toISOString()};
  const created=interval.from+'..'+new Date(to-1).toISOString();
  const url='/actions/runs?created='+encodeURIComponent(created)+(status==='all'?'':'&status=skipped')+'&per_page=100&page=';
  let first;
  try{first=await get(url+'1');}catch(e){remaining.push({...interval,error:String(e.message)});return;}
  if(!Array.isArray(first.workflow_runs)){remaining.push({...interval,error:'HISTORY_INVALID_PAGE'});return;}
  if(first.total_count>=1000){
   if(to-from<=1000){remaining.push({...interval,error:'HISTORY_QUERY_TOO_DENSE'});return;}
   const middle=from+Math.floor((to-from)/2);await scan(from,middle);await scan(middle,to);return;
  }
  const rows=[...first.workflow_runs],pages=Math.ceil(first.total_count/100);
  for(let p=2;p<=pages;p++){
   try{const data=await get(url+p);if(!Array.isArray(data.workflow_runs))throw Error('HISTORY_INVALID_PAGE');rows.push(...data.workflow_runs);}
   catch(e){remaining.push({...interval,nextPage:p,error:String(e.message)});return;}
  }
  windows.push({...interval,listed:rows.length,total:first.total_count});
  for(const x of rows)runs.push({id:x.id,name:x.name,event:x.event,conclusion:x.conclusion,status:x.status,
   created_at:x.created_at,head_branch:x.head_branch,head_sha:x.head_sha,run_attempt:x.run_attempt,url:x.html_url});
 }
 await scan(a,b);
 const sorted=[...runs].sort((x,y)=>{
  const p=z=>z.conclusion==='skipped'?0:z.conclusion==='failure'?1:z.conclusion==='cancelled'?2:3;
  return p(x)-p(y)||Date.parse(y.created_at)-Date.parse(x.created_at);
 });
 for(const x of sorted){
  if(jobRequests>=maxJobRequests){uninspectedJobs.push(x.id);continue;}
  try{
   const result=await get('/actions/runs/'+x.id+'/jobs?per_page=100&page=1');
   jobRequests++;
   if(!Array.isArray(result.jobs))throw Error('HISTORY_INVALID_JOBS');
   jobs.push({run_id:x.id,workflow:x.name,event:x.event,run_conclusion:x.conclusion,total:result.total_count,
    complete:result.total_count<=result.jobs.length,
    items:result.jobs.map(j=>({id:j.id,name:j.name,status:j.status,conclusion:j.conclusion,
     skipped_steps:(j.steps||[]).filter(s=>s.conclusion==='skipped').map(s=>s.name),
     failed_steps:(j.steps||[]).filter(s=>s.conclusion==='failure').map(s=>s.name)}))});
   if(result.total_count>result.jobs.length)uninspectedJobs.push(x.id);
  }catch(e){uninspectedJobs.push(x.id);errors.push({run_id:x.id,error:String(e.message)});}
 }
 const groups={};
 for(const r of runs){
  const g=groups[r.name]??={workflow:r.name,total:0,skipped:0,failed:0,cancelled:0,success:0,other:0};
  g.total++;
  const key=r.conclusion==='skipped'?'skipped':r.conclusion==='failure'?'failed':r.conclusion==='cancelled'?'cancelled':r.conclusion==='success'?'success':'other';
  g[key]++;
 }
 return {schema:'historical-actions-v1',repository:'elevate-for-humanity/Elevate-lms',statusFilter:status,
  start,end,requests,maxRequests,jobRequests,maxJobRequests,
  runInventoryComplete:remaining.length===0,jobInventoryComplete:uninspectedJobs.length===0&&jobs.every(x=>x.complete),
  runs,jobDetails:jobs,windows,remainingWindows:remaining,uninspectedJobRuns:[...new Set(uninspectedJobs)],errors,
  byWorkflow:Object.values(groups).sort((x,y)=>y.skipped-x.skipped)};
}
export function summary(a){
 const rows=a.byWorkflow.slice(0,40).map(w=>'| '+w.workflow.replaceAll('|','/')+' | '+w.total+' | '+w.skipped+' | '+w.failed+' | '+w.cancelled+' |').join('\n');
 return '# Historical GitHub Actions audit\n\nFiltered status: **'+a.statusFilter+'**. Period: '+a.start+' to '+a.end+
  '\n\nRun inventory complete: **'+a.runInventoryComplete+'**; job inventory complete: **'+a.jobInventoryComplete+
  '**. Runs: '+a.runs.length+'. Uninspected job runs: '+a.uninspectedJobRuns.length+
  '. Pending time windows: '+a.remainingWindows.length+'. API requests: '+a.requests+'.\n\n'+
  'Skipped does not imply an error. Evaluate job conditions, previous failing steps, and required verification separately.\n\n'+
  '| Workflow | Runs | Skipped | Failed | Cancelled |\n|---|---:|---:|---:|---:|\n'+rows+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const end=process.env.AUDIT_END||new Date().toISOString();
 const start=process.env.AUDIT_START||new Date(Date.parse(end)-86400000).toISOString();
 const result=await auditHistory({start,end,status:process.env.AUDIT_STATUS||'skipped',maxRequests:Number(process.env.AUDIT_MAX_REQUESTS||300),maxJobRequests:Number(process.env.AUDIT_MAX_JOB_REQUESTS||75)});
 await mkdir('audit-output',{recursive:true});
 await writeFile('audit-output/actions-history.json',JSON.stringify(result,null,2));
 await writeFile('audit-output/actions-history.md',summary(result));
 console.log(JSON.stringify({runs:result.runs.length,runComplete:result.runInventoryComplete,jobComplete:result.jobInventoryComplete,
  remainingWindows:result.remainingWindows.length,uninspectedJobs:result.uninspectedJobRuns.length}));
 if(!result.runInventoryComplete||!result.jobInventoryComplete)process.exitCode=2;
}
