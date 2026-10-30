import {inspectCourseAutopilot,COURSE_AI_ROLES} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';

/** Runs outside Admin so a 503 in the dashboard cannot stop queue supervision. */
export async function monitorCourseQueue({request=fetch,env=process.env,now=new Date(),dispatchState,jobIds,conflictRetries=2}={}) {
  if(env.GITHUB_REPOSITORY!=='elevate-for-humanity/Elevate-lms'||!env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('PARIS_MONITOR_AUTHORITY_REQUIRED');
  const root='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs';
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const url=new URL(root);
  url.searchParams.set('select','id,build_id,status,available_at,payload,attempts,max_attempts,heartbeat_at,lease_owner,lease_expires_at,execution_generation,last_error,monitor,ultimate_course_builds(status,findings,ownerPaused:profile->ownerPaused)');
  url.searchParams.set('monitor->>enabled','eq.true');
  url.searchParams.set('order','id.asc');
  if(jobIds)url.searchParams.set('id','in.('+jobIds.join(',')+')');
  const rows=[];
  const pageSize=100;
  let cursor;
  for(;;){
    const pageUrl=new URL(url);
    if(cursor)pageUrl.searchParams.set('id','gt.'+cursor);
    pageUrl.searchParams.set('limit',String(pageSize));
    const response=await request(pageUrl,{headers,signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('PARIS_MONITOR_READ_HTTP_'+response.status);
    const page=await response.json();
    if(!Array.isArray(page))throw Error('PARIS_MONITOR_RESPONSE_INVALID');
    rows.push(...page);
    if(page.length<pageSize)break;
    const nextCursor=page.at(-1)?.id;
    if(!nextCursor || (cursor && nextCursor<=cursor))throw Error('PARIS_MONITOR_CURSOR_NOT_ADVANCING');
    cursor=nextCursor;
  }
  const observations=[];
  for(const job of rows){
    let observation=inspectCourseAutopilot(job,job.ultimate_course_builds,now.getTime());
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='capacity_wait')
      observation={state:'capacity_wait',action:'wait_for_capacity',reason:dispatchState.reason || 'Google regional capacity is unavailable; saved work is preserved'};
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='dispatch_failed')
      observation={state:'dispatch_failed',action:'none',reason:dispatchState.reason || 'Worker assignment failed; no execution is confirmed'};
    if(observation.state==='disabled')continue;
    // A dispatch request is not a confirmed recovery. Persist verifiable worker
    // assignment evidence only after the database shows a fresh heartbeat and lease.
    const heartbeatMs=Date.parse(job.heartbeat_at ?? '');
    const leaseMs=Date.parse(job.lease_expires_at ?? '');
    const previousHeartbeat=job.monitor?.lastConfirmedWorkerHeartbeat ?? null;
    const confirmedAssignment=observation.state==='running' && Boolean(job.lease_owner) &&
      Number.isFinite(heartbeatMs) && now.getTime()-heartbeatMs>=0 && now.getTime()-heartbeatMs<90000 &&
      leaseMs>now.getTime() && job.heartbeat_at!==previousHeartbeat &&
      (job.lease_owner!==job.monitor?.lastConfirmedLeaseOwner ||
       Number(job.execution_generation)!==Number(job.monitor?.lastConfirmedExecutionGeneration));
    // A PARIS recovery request is an intent, not a verified recovery.
    // Persist the observed execution generation so an eventual new worker
    // can be correlated with the request without crediting ordinary leases.
    const recoveryRequested = ['dispatch','requeue'].includes(observation.action);
    const priorRequest = job.monitor?.recoveryRequest;
    const requestAge = now.getTime() - Date.parse(priorRequest?.requestedAt ?? '');
    const recoveryClosed = ['published','archived','paused','checkpoint_complete','attention_required'].includes(observation.state);
    const activeRequest = !recoveryClosed && Number.isFinite(requestAge) && requestAge >= 0 && requestAge <= 15 * 60_000 ? priorRequest : null;
    const confirmedRecovery = confirmedAssignment &&
      activeRequest?.executionGeneration != null &&
      Number(job.execution_generation) >= Number(priorRequest.executionGeneration) &&
      Date.parse(job.heartbeat_at) > Date.parse(priorRequest.requestedAt) &&
      (job.lease_owner !== priorRequest.previousLeaseOwner ||
       Number(job.execution_generation) > Number(priorRequest.previousExecutionGeneration ?? priorRequest.executionGeneration));
    const recoveryRequest = confirmedRecovery || recoveryClosed ? null : activeRequest ?? (recoveryRequested
      ? {requestedAt:now.toISOString(),executionGeneration:Number(job.execution_generation) +
          (observation.action==='requeue'?1:0),previousExecutionGeneration:Number(job.execution_generation),previousLeaseOwner:job.lease_owner ?? job.monitor?.lastConfirmedLeaseOwner ?? null}
      : null);
    const monitor={...job.monitor,...observation,
      recoveryRequest,
      ...(confirmedRecovery ? {lastConfirmedRecoveryAt:now.toISOString(),
        lastConfirmedRecoveryOwner:job.lease_owner} : {}),
      ...(confirmedAssignment?{confirmedAssignments:(job.monitor.confirmedAssignments??0)+1,
        lastConfirmedWorkerHeartbeat:job.heartbeat_at,lastConfirmedLeaseOwner:job.lease_owner,
        lastConfirmedExecutionGeneration:job.execution_generation}:{}),
      reason:observation.reason ?? null,coordinator:'PARIS',agents:COURSE_AI_ROLES,checkedAt:now.toISOString(),
      recoveries:(job.monitor.recoveries??0)+(confirmedRecovery?1:0)};
    const target=new URL(root);target.searchParams.set('id','eq.'+job.id);
    target.searchParams.set('status','eq.'+job.status);
    target.searchParams.set('execution_generation','eq.'+job.execution_generation);
    target.searchParams.set('monitor','eq.'+JSON.stringify(job.monitor));
    const body={monitor};
    // An expired worker at its retry ceiling is not running. Fence the dead
    // execution and hand the preserved defect to the PARIS code-repair path,
    // which only accepts a failed job. Never reset attempts or replay work.
    const expiredExhausted=job.status==='running' &&
      Date.parse(job.lease_expires_at??'')<=now.getTime() &&
      Number(job.attempts)>=Number(job.max_attempts);
    if(expiredExhausted){
      target.searchParams.set('lease_expires_at','lt.'+now.toISOString());
      Object.assign(body,{status:'failed',lease_owner:null,lease_expires_at:null,
        last_error:job.last_error??'ULTIMATE_WORKER_LEASE_EXPIRED:retry_limit_reached',
        execution_generation:job.execution_generation+1,updated_at:now.toISOString()});
    }
    if(observation.action==='requeue'){
      // No attempts reset and no live-lease override. Preserve the aggregate
      // build profile and let the runtime resume its saved checkpoint.
      target.searchParams.set('or','(lease_expires_at.is.null,lease_expires_at.lt.'+now.toISOString()+')');
      Object.assign(body,{status:'queued',available_at:now.toISOString(),lease_owner:null,lease_expires_at:null,
        execution_generation:job.execution_generation+1,updated_at:now.toISOString()});
    }
    const changed=await request(target,{method:'PATCH',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    if(!changed.ok)throw Error('PARIS_MONITOR_WRITE_HTTP_'+changed.status);
    const saved=await changed.json();
    if(Array.isArray(saved)&&saved.length===0 && conflictRetries>0){
      const reconciled=await monitorCourseQueue({request,env,now,dispatchState,jobIds:[job.id],conflictRetries:conflictRetries-1});
      observations.push(...(reconciled.length?reconciled:[{jobId:job.id,state:'changed',action:'none',saved:false}]));
    }else{
      observations.push({jobId:job.id,...observation,saved:Array.isArray(saved)&&saved.length===1});
    }
  }
  return observations;
}
