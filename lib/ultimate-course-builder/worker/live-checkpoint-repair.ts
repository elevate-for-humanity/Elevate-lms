import { ULTIMATE_BUILD_STEPS } from '../core/types';

/** The dedicated wakeup column survives progress writes made with an older payload. */
export function checkpointRepairPayload(job: any, request: any, index: number) {
  const pending = job.pending_dependency_resume ?? job.payload ?? {};
  const previous = pending.pendingCheckpointRepairs?.[request.competencyId];
  const earliest = previous && ULTIMATE_BUILD_STEPS.indexOf(previous.fromStep) < ULTIMATE_BUILD_STEPS.indexOf(request.fromStep)
    ? { ...request, fromStep: previous.fromStep } : request;
  const repairs = { ...pending.pendingCheckpointRepairs, [request.competencyId]: earliest };
  const cursor = Math.min(Number.isInteger(pending.nextCompetencyIndex) ? pending.nextCompetencyIndex : index, index);
  return { ...pending, nextCompetencyIndex: cursor, pendingCheckpointRepairs: repairs,
    checkpointRepair: repairs[request.competencyId], requestedBy: request.requestedBy };
}

export function liveCheckpointRepairReader(db: any, job: any, workerId: string, generation: number, payload: any, competencyId: string) {
  return async (step: any) => {
    const { data, error } = await db.from('ultimate_build_jobs').select('pending_dependency_resume')
      .eq('id', job.id).eq('lease_owner', workerId).eq('execution_generation', generation).eq('status', 'running').single();
    if (error) throw error;
    const pending = data?.pending_dependency_resume;
    const request = pending?.pendingCheckpointRepairs?.[competencyId] ?? payload.pendingCheckpointRepairs?.[competencyId];
    if (!request || !ULTIMATE_BUILD_STEPS.includes(request.fromStep) ||
        ULTIMATE_BUILD_STEPS.indexOf(step) < ULTIMATE_BUILD_STEPS.indexOf(request.fromStep)) return null;
    if (pending?.pendingCheckpointRepairs?.[competencyId]) {
      const repairs = { ...pending.pendingCheckpointRepairs }; delete repairs[competencyId];
      const remaining = Object.values(repairs) as any[];
      const next = remaining.length ? { ...pending, pendingCheckpointRepairs: repairs, checkpointRepair: remaining[0] }
        : pending.dependencyResume ? { ...pending, pendingCheckpointRepairs: {}, checkpointRepair: undefined } : null;
      const changed = await db.from('ultimate_build_jobs').update({ pending_dependency_resume: next })
        .eq('id', job.id).eq('lease_owner', workerId).eq('execution_generation', generation).eq('status', 'running')
        .eq('pending_dependency_resume', JSON.stringify(pending)).select('id');
      if (changed.error) throw changed.error;
      if (changed.data?.length !== 1) return null; // A newer request remains durable for the next boundary.
    }
    if (payload.pendingCheckpointRepairs) delete payload.pendingCheckpointRepairs[competencyId];
    if (payload.checkpointRepair?.competencyId === competencyId) delete payload.checkpointRepair;
    return request.fromStep;
  };
}
