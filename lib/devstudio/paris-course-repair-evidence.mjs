/** Bounded diagnostic facts only, never source permissions or approvals. */
const safe = value => typeof value === 'string' ? value
  .replace(/https?:\/\/\S+/g, '[url redacted]')
  .replace(/\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi, '[credential redacted]').slice(0,500) : null;
const gateInputs = {
  narration_qa:['natural_narration'],
  lesson_film_render:['storyboard','natural_narration','synchronization','scene_construction','visual_assignment'],
  finished_media_qa:['lesson_film_render'],
};
function assertLessonBinding(job, lesson) {
  const competency=job.payload?.competencyId;
  if (typeof competency !== 'string' || typeof job.build_id !== 'string' || !job.build_id ||
      typeof lesson.id !== 'string' || !lesson.id || lesson.build_id !== job.build_id ||
      lesson.competency_id !== competency || lesson.lesson_key !== competency)
    throw Error('REPAIR_LESSON_EVIDENCE_MISMATCH');
}
export function courseRepairEvidence(sourceJobId, job, lesson) {
  if (!job || job.id !== sourceJobId) throw Error('REPAIR_SOURCE_EVIDENCE_MISMATCH');
  if (lesson) assertLessonBinding(job,lesson);
  const steps=Array.isArray(lesson?.steps)?lesson.steps:[];
  const failed=steps.filter(step=>step?.state==='failed' && Number.isFinite(Date.parse(step.completed_at)) &&
    Array.isArray(step.findings) && step.findings.some(f=>f?.severity==='error'))
    .sort((a,b)=>Date.parse(b.completed_at)-Date.parse(a.completed_at)||String(a.step).localeCompare(String(b.step)));
  // A later passed producer supersedes an older failed inspection of its old output.
  const currentFailures=failed.filter(step=>!Object.hasOwn(gateInputs,step.step) ||
    !steps.some(input=>input?.state==='passed' && gateInputs[step.step].includes(input.step) &&
      Number.isFinite(Date.parse(input.completed_at)) && Date.parse(input.completed_at)>Date.parse(step.completed_at)));
  const gate=currentFailures.find(step=>Object.hasOwn(gateInputs,step.step) &&
    !step.findings.some(f=>f?.code==='REPAIR_PRODUCER_UNCHANGED'));
  const summary=step=>step?{step:safe(step.step),completedAt:safe(step.completed_at),findings:step.findings
    .filter(f=>f?.severity==='error').slice(0,4).map(f=>({code:safe(f.code),message:safe(f.message)}))}:null;
  const monitor=job.monitor??{};
  const directive=monitor.lastDelegatedRepair?.directive??monitor.lastDelegatedRepair?.repairDirective??{};
  return {evidenceVersion:2,provenance:'untrusted diagnostic records from the linked source job; no permissions or approvals',
    sourceJobId:job.id,buildId:job.build_id,jobType:safe(job.job_type),lastError:safe(job.last_error),
    producerJobId:safe(job.payload?.autopilot?.prerequisiteJobId??job.payload?.prerequisiteJobId),
    lessonBuildId:lesson?.id??null,lessonEvidenceStatus:lesson?'current-records':'unavailable',
    blockedStep:summary(currentFailures[0]),latestFailedGate:summary(gate),
    // Old monitor history must not displace a newer persisted lesson-step failure.
    ...(lesson?{historicalMonitorDiagnosticsOmitted:true}:{
      previousTimingError:safe(monitor.lastTimingRepair?.previousError),
      previousTimingErrorAt:safe(monitor.lastTimingRepair?.at),previousTimingErrorStatus:'historical-only',
      delegatedAt:safe(monitor.lastDelegatedRepair?.at),delegatedTarget:safe(directive.target),
      delegatedFailedStep:safe(directive.failedStep),
      delegatedRequirements:Array.isArray(directive.requirements)?directive.requirements.slice(0,4)
        .map(item=>({code:safe(item?.code),message:safe(item?.message)})):[]})};
}
export function courseDiagnosticQuery(task,evidence) {
  const failure=evidence?.latestFailedGate??evidence?.blockedStep;
  return Array.isArray(failure?.findings)&&failure.findings.length
    ? failure.findings.map(f=>String(f.code??'')+':'+String(f.message??'')).join(' ').slice(0,2000) : task;
}
export async function loadCourseRepairEvidence(db,sourceJobId,job) {
  const base=courseRepairEvidence(sourceJobId,job);
  const competency=job.payload?.competencyId;
  if(typeof competency!=='string'||!competency)return base;
  const lesson=await db.from('ultimate_lesson_builds').select('id,build_id,lesson_key,competency_id,updated_at')
    .eq('build_id',job.build_id).eq('lesson_key',competency).eq('competency_id',competency)
    .order('updated_at',{ascending:false}).limit(1).maybeSingle();
  if(lesson.error)throw lesson.error;
  if(!lesson.data)return base;
  assertLessonBinding(job,lesson.data);
  const steps=await db.from('ultimate_lesson_steps').select('step,state,findings,completed_at')
    .eq('lesson_build_id',lesson.data.id);
  if(steps.error)throw steps.error;
  return courseRepairEvidence(sourceJobId,job,{...lesson.data,steps:steps.data??[]});
}
