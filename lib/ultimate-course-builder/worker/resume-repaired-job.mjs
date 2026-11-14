/** Resume the original role/cursor only after PARIS verified its deployed fix. */
export async function resumeRepairedJob({db,source,repair,deploymentTargetSha=repair.release_sha,now=new Date()}) {
  if (!repair.release_sha || repair.verification?.exactRuntimeSha !== true)
    throw Error('PARIS_DEPLOYED_REPAIR_REQUIRED');
  if(source.payload?.codeRepairId===repair.id && source.payload?.codeRepairSha===deploymentTargetSha)
    return source;
  if(source.status!=='failed' || source.lease_owner || source.lease_expires_at)
    return null;
  const generation=Number(source.execution_generation);
  if(!Number.isSafeInteger(generation)||generation<1)throw Error('PARIS_SOURCE_GENERATION_REQUIRED');
  const payload={...source.payload,codeRepairId:repair.id,codeRepairSha:deploymentTargetSha,
    codeRepairSourceGeneration:generation};
  delete payload.progress;
  const result=await db.from('ultimate_build_jobs').update({
    status:'queued',payload,attempts:0,execution_generation:generation+1,
    last_error:null,available_at:now.toISOString(),updated_at:now.toISOString(),
    monitor:{...source.monitor,state:'repair_verification',repairId:repair.id,
      previousFailure:{error:source.last_error,attempts:source.attempts,generation},
      repairDeployedSha:deploymentTargetSha}
  }).eq('id',source.id).eq('status','failed').eq('execution_generation',generation)
    .is('lease_owner',null).is('lease_expires_at',null).select('*').maybeSingle();
  if(result.error)throw result.error;
  return result.data;
}
