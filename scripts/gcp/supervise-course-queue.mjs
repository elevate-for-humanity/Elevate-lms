import {monitorCourseQueue} from './paris-course-monitor.mjs';
import {pathToFileURL} from 'node:url';

/** Independent of Google auth and the runtime/deployment lock. Observe real
 * leases, then request the canonical dispatcher; never launch a second worker
 * or manufacture a successful recovery. */
export async function superviseCourseQueue({request=fetch,env=process.env,now=new Date(),monitor=monitorCourseQueue}={}) {
 const observations=await monitor({request,env,now});
 const waiting=observations.filter(row=>row.saved && ['dispatch','requeue'].includes(row.action));
 if(!waiting.length)return {status:'observed',observations};
 if(!env.GH_TOKEN)throw Error('PARIS_DISPATCH_AUTHORITY_REQUIRED');
 const root='https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/dispatch-google-course-job.yml';
 const headers={Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 const response=await request(root+'/runs?branch=main&per_page=30',{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('PARIS_DISPATCH_INVENTORY_HTTP_'+response.status);
 const data=await response.json();
 if(!Array.isArray(data.workflow_runs))throw Error('PARIS_DISPATCH_INVENTORY_INVALID');
 const runs=data.workflow_runs.filter(run=>run.head_branch==='main');
 // Leave the runtime lock and pending deployment untouched. Existing dispatch
 // runs will verify claims themselves; a subsequent watchdog pass rechecks them.
 if(runs.some(run=>['queued','in_progress','waiting','pending','requested'].includes(run.status)))
  return {status:'dispatch_pending',waitingJobs:waiting.map(row=>row.jobId)};
 if(runs[0]?.conclusion==='failure')await monitor({request,env,now,dispatchState:{status:'dispatch_failed',reason:'The previous automatic dispatcher failed; PARIS is requesting a replacement dispatch'}});
 const dispatched=await request(root+'/dispatches',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({ref:'main'}),signal:AbortSignal.timeout(15000)});
 if(dispatched.status!==204)throw Error('PARIS_DISPATCH_REQUEST_HTTP_'+dispatched.status);
 return {status:'dispatch_requested',waitingJobs:waiting.map(row=>row.jobId),confirmedRecovery:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(await superviseCourseQueue()));
