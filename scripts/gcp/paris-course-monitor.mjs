import {inspectCourseAutopilot,COURSE_AI_ROLES} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';

/** Resolve only the latest job generation for a build/role. UUID sort is not
 * chronological; an older completed producer cannot certify a newer failure.
 * Ambiguous duplicate chronology fails closed rather than waking a held QA job.
 */
export function latestRoleJobs(rows) {
  const latest = new Map();
  const ambiguous = new Set();
  for (const row of rows) {
    const key = row.build_id + '|' + row.job_type;
    if (ambiguous.has(key)) continue;
    const previous = latest.get(key);
    if (!previous) { latest.set(key, row); continue; }
    const a = Date.parse(previous.created_at ?? '');
    const b = Date.parse(row.created_at ?? '');
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      latest.delete(key);
      ambiguous.add(key);
      continue;
    }
    if (a !== b) { if (b > a) latest.set(key, row); continue; }
    const aGen = Number(previous.execution_generation);
    const bGen = Number(row.execution_generation);
    if (!Number.isSafeInteger(aGen) || !Number.isSafeInteger(bGen) || aGen === bGen) {
      latest.delete(key);
      ambiguous.add(key);
      continue;
    }
    if (bGen > aGen) latest.set(key, row);
  }
  return latest;
}

/** Runs outside Admin so a 503 in the dashboard cannot stop queue supervision. */
export async function monitorCourseQueue({request=fetch,env=process.env,now=new Date(),dispatchState,jobIds,conflictRetries=2}={}) {
  if(env.GITHUB_REPOSITORY!=='elevate-for-humanity/Elevate-lms'||!env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('PARIS_MONITOR_AUTHORITY_REQUIRED');
  const root='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/ultimate_build_jobs';
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const url=new URL(root);
  url.searchParams.set('select','id,build_id,job_type,status,created_at,available_at,payload,attempts,max_attempts,heartbeat_at,lease_owner,lease_expires_at,external_execution_id,execution_generation,last_error,monitor,ultimate_course_builds(status,findings,ownerPaused:profile->ownerPaused)');
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
  // Availability is now finite for every queued job. A timestamp being due
  // does NOT establish that media/quality prerequisites are satisfied. Ask the
  // same canonical readiness predicate used by worker claims, so PARIS does
  // not advertise or repeatedly dispatch an unready lesson stage.
  const savedPauseRecovered=job=>job.status==='failed' &&
    job.last_error==='OWNER_PAUSED_REFERENCE_BUILD' &&
    job.payload?.autopilot && job.attempts<job.max_attempts &&
    job.ultimate_course_builds?.status==='running' &&
    (job.ultimate_course_builds?.ownerPaused===false ||
     job.ultimate_course_builds?.ownerPaused==='false') &&
    job.monitor?.enabled && !job.monitor?.repairId && !job.external_execution_id &&
    !job.lease_owner && (!job.lease_expires_at || Date.parse(job.lease_expires_at)<=now.getTime());
  const readinessCandidates=rows.filter(job=>
    (job.status==='queued' && job.payload?.autopilot && job.available_at!=='infinity') ||
    savedPauseRecovered(job));
  const readyRoleIds=new Set();
  for(let i=0;i<readinessCandidates.length;i+=1000){
    const batch=readinessCandidates.slice(i,i+1000).map(job=>job.id);
    const result=await request(
      'https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/ultimate_autopilot_ready_jobs',
      {method:'POST',headers:{...headers,'Content-Type':'application/json'},
       body:JSON.stringify({p_jobs:batch}),signal:AbortSignal.timeout(15000)});
    if(!result.ok)throw Error('PARIS_ROLE_READINESS_HTTP_'+result.status);
    const ids=await result.json();
    const expected=new Set(batch);
    if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!expected.has(id))||
       new Set(ids).size!==ids.length)throw Error('PARIS_ROLE_READINESS_INVALID');
    for(const id of ids)readyRoleIds.add(id);
  }
  // Wake held media after its exact instruction completes, and held quality
  // only after instruction AND media complete. The latest stage generation
  // must be clean, and paused/unknown owners remain fenced. This is a
  // dependency wakeup, not a fabricated worker claim or completion.
  const siblingKeys=latestRoleJobs(rows);
  const observations=[];
  for(const job of rows){
    const match=/^lesson_autopilot:(.+):(media|quality)$/.exec(job.job_type??'');
    const build=job.ultimate_course_builds;
    if(job.status==='queued' && job.available_at==='infinity' && match &&
      (build?.ownerPaused===false || build?.ownerPaused==='false') && build?.status==='running' && job.monitor?.enabled){
      const prefix=job.build_id+'|lesson_autopilot:'+match[1]+':';
      const instruction=siblingKeys.get(prefix+'instruction');
      const media=siblingKeys.get(prefix+'media');
      const prerequisites=match[2]==='media'?[instruction]:[instruction,media];
      if(prerequisites.every(upstream=>upstream?.status==='completed' && !upstream.last_error)){
        const wake=new URL(root);
        wake.searchParams.set('id','eq.'+job.id);
        wake.searchParams.set('status','eq.queued');
        wake.searchParams.set('available_at','eq.infinity');
        wake.searchParams.set('execution_generation','eq.'+job.execution_generation);
        const response=await request(wake,{method:'PATCH',
          headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},
          body:JSON.stringify({available_at:now.toISOString(),updated_at:now.toISOString()}),
          signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error('PARIS_PREREQUISITE_WAKE_HTTP_'+response.status);
        const saved=await response.json();
        if(Array.isArray(saved)&&saved.length===1){
          observations.push({jobId:job.id,state:'prerequisites_verified',action:'dispatch',saved:true});
          continue;
        }
      }
    }
    
    let observation=inspectCourseAutopilot(job,job.ultimate_course_builds,now.getTime());
    // A previously owner-paused role may be recovered only after explicit
    // unpause persisted and the *same* SQL predicate as worker claim passes.
    // This requeues work; it does not mark a predecessor complete or reset history.
    if(savedPauseRecovered(job) && readyRoleIds.has(job.id))
      observation={state:'recovering',action:'requeue',
        reason:'Saved owner pause cleared; canonical prerequisite readiness verified'};
    if(job.status==='queued' && job.payload?.autopilot && job.available_at!=='infinity' &&
       observation.state==='awaiting_assignment' && !readyRoleIds.has(job.id))
      observation={state:'prerequisite_wait',action:'observe',
        reason:'Canonical prerequisite, active pool or worker-lease readiness is not satisfied'};
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='capacity_wait')
      observation={state:'capacity_wait',action:'wait_for_capacity',reason:dispatchState.reason || 'Google regional capacity is unavailable; saved work is preserved'};
    if(['awaiting_assignment','recovering'].includes(observation.state) && dispatchState?.status==='dispatch_failed')
      observation={state:'dispatch_failed',action:'none',reason:dispatchState.reason || 'Worker assignment failed; no execution is confirmed'};
    // Surface disabled jobs to PARIS rather than silently hiding failures.
    // Do not enable or requeue historical/paused work without explicit authority.
    if(observation.state==='disabled'){
      if(job.status==='failed' || job.status==='running' || job.status==='queued')
        observations.push({jobId:job.id,state:'unmonitored',action:'none',saved:false,
          reason:'PARIS monitoring is disabled; inspect build ownership and authorization before recovery'});
      continue;
    }
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
    const recoveryClosed = ['published','archived','cancelled','paused','checkpoint_complete','checkpoint_complete_with_prior_error','attention_required'].includes(observation.state);
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
