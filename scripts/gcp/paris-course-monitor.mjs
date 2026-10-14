import {inspectCourseAutopilot,COURSE_AI_ROLES} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';

/** Runs outside Admin so a 503 in the dashboard cannot stop queue supervision. */
export async function monitorCourseQueue({request=fetch,env=process.env,now=new Date(),dispatchState}={}) {
  if(env.GITHUB_REPOSITORY!=='elevate-for-humanity/Elevate-lms'||!env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('PARIS_MONITOR_AUTHORITY_REQUIRED');
  const root='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs';
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const url=new URL(root);
  url.searchParams.set('select','id,build_id,status,attempts,max_attempts,heartbeat_at,lease_expires_at,execution_generation,last_error,monitor,ultimate_course_builds(status,ownerPaused:profile->ownerPaused)');
  url.searchParams.set('monitor->>enabled','eq.true');
  url.searchParams.set('order','updated_at.desc');url.searchParams.set('limit','100');
  const response=await request(url,{headers,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('PARIS_MONITOR_READ_HTTP_'+response.status);
  const rows=await response.json(); if(!Array.isArray(rows))throw Error('PARIS_MONITOR_RESPONSE_INVALID');
  const observations=[];
  for(const job of rows){
    let observation=inspectCourseAutopilot(job,job.ultimate_course_builds,now.getTime());
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='capacity_wait')
      observation={state:'capacity_wait',action:'wait_for_capacity',reason:dispatchState.reason || 'Google regional capacity is unavailable; saved work is preserved'};
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='dispatch_failed')
      observation={state:'dispatch_failed',action:'none',reason:dispatchState.reason || 'Worker assignment failed; no execution is confirmed'};
    if(observation.state==='disabled')continue;
    const monitor={...job.monitor,...observation,coordinator:'PARIS',agents:COURSE_AI_ROLES,checkedAt:now.toISOString(),
      recoveries:(job.monitor.recoveries??0)+(observation.action==='requeue'?1:0)};
    const target=new URL(root);target.searchParams.set('id','eq.'+job.id);
    target.searchParams.set('status','eq.'+job.status);
    target.searchParams.set('execution_generation','eq.'+job.execution_generation);
    target.searchParams.set('monitor','eq.'+JSON.stringify(job.monitor));
    const body={monitor};
    if(observation.action==='requeue'){
      // No attempts reset and no live-lease override. The existing queue trigger
      // synchronizes aggregate status when this fenced transition succeeds.
      target.searchParams.set('or','(lease_expires_at.is.null,lease_expires_at.lt.'+now.toISOString()+')');
      Object.assign(body,{status:'queued',available_at:now.toISOString(),lease_owner:null,lease_expires_at:null,
        execution_generation:job.execution_generation+1,updated_at:now.toISOString()});
    }
    const changed=await request(target,{method:'PATCH',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    if(!changed.ok)throw Error('PARIS_MONITOR_WRITE_HTTP_'+changed.status);
    const saved=await changed.json();
    observations.push({jobId:job.id,...observation,saved:Array.isArray(saved)&&saved.length===1});
  }
  return observations;
}
