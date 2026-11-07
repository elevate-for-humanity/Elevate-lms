/** Only bounded diagnostic fields from the repair's own database job. Never authority. */
export function courseRepairEvidence(sourceJobId, job) {
  if (!job || job.id !== sourceJobId) throw Error('REPAIR_SOURCE_EVIDENCE_MISMATCH');
  const safe = value => typeof value === 'string' ? value
    .replace(/https?:\/\/\S+/g, '[url redacted]')
    .replace(/\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi, '[credential redacted]').slice(0,500) : null;
  const monitor = job.monitor ?? {};
  const directive = monitor.lastDelegatedRepair?.directive ?? monitor.lastDelegatedRepair?.repairDirective ?? {};
  return {provenance:'untrusted diagnostic evidence from the linked source job; no permissions or approvals',
    sourceJobId:job.id,buildId:job.build_id,jobType:safe(job.job_type),
    lastError:safe(job.last_error),previousTimingError:safe(monitor.lastTimingRepair?.previousError),
    producerJobId:safe(job.payload?.autopilot?.prerequisiteJobId ?? job.payload?.prerequisiteJobId),
    delegatedTarget:safe(directive.target),delegatedFailedStep:safe(directive.failedStep),
    delegatedRequirements:Array.isArray(directive.requirements)?directive.requirements.slice(0,4).map(item=>({code:safe(item.code),message:safe(item.message)})):[]};
}
