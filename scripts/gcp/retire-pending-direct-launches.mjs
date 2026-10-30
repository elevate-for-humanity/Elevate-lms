import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function canRetirePendingDirectLaunch(run,jobs,currentId){
 return String(run.id)!==String(currentId)&&run.event==='workflow_dispatch'&&run.head_branch==='main'&&
  run.path==='.github/workflows/deploy-google-course-worker.yml'&&run.status!=='completed'&&
  jobs.some(job=>job.name==='direct-release'&&['queued','pending'].includes(job.status))&&
  !jobs.some(job=>job.status==='in_progress');
}
export function retirePendingDirectLaunches({repository,currentId,call}={}){
 if(repository!=='elevate-for-humanity/Elevate-lms'||!/^\d+$/.test(String(currentId)))throw Error('DIRECT_LAUNCH_RETIREMENT_SCOPE_INVALID');
 call??=(path,method='GET')=>JSON.parse(execFileSync('gh',['api','--method',method,path],{encoding:'utf8',stdio:['ignore','pipe','pipe']})||'null');
 const runs=call(`repos/${repository}/actions/workflows/deploy-google-course-worker.yml/runs?event=workflow_dispatch&branch=main&per_page=30`).workflow_runs;
 const retired=[];
 for(const run of runs){
  if(String(run.id)===String(currentId)||run.status==='completed')continue;
  const jobs=call(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`).jobs;
  if(!canRetirePendingDirectLaunch(run,jobs,currentId))continue;
  call(`repos/${repository}/actions/runs/${run.id}/cancel`,'POST');retired.push(run.id);
 }
 return {retiredPendingDirectLaunches:retired,activeExecutionsCancelled:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(retirePendingDirectLaunches({repository:process.env.GITHUB_REPOSITORY,currentId:process.env.GITHUB_RUN_ID})));
