// A workflow lookup can outlive the active repair snapshot. Preserve any
// planner diagnosis or release transition committed while GitHub was queried.
export async function recordFailedRepairWorkflow(db, snapshot, run) {
  // Only prepare can bind the current workflow while atomically claiming it.
  // A dispatched row may still carry a legacy association from an earlier
  // attempt; that failed run cannot decide the fate of an unclaimed retry.
  if (!['patching','validating'].includes(snapshot?.status) ||
      run?.status !== 'completed' || run.conclusion === 'success' ||
      !['failure','cancelled','timed_out','action_required','startup_failure','stale','skipped','neutral'].includes(run.conclusion)) return false;
  const {data,error}=await db.from('paris_code_repairs').update({
    status:'blocked',error_code:'REPAIR_WORKFLOW_'+run.conclusion,
    updated_at:new Date().toISOString(),
  }).eq('id',snapshot.id).eq('status',snapshot.status)
    .eq('updated_at',snapshot.updated_at).select('id').maybeSingle();
  if(error)throw error;
  return Boolean(data);
}

/** A new dispatch has no current workflow until signed prepare claims it.
 * Archive the old association without resetting the attempt budget or history.
 */
export function repairDispatchValues(repair, at=new Date().toISOString()) {
  if (!Number.isSafeInteger(repair?.attempt_count) || repair.attempt_count<0)
    throw Error('PARIS_REPAIR_ATTEMPT_INVALID');
  const history=repair.attempt_history??[];
  if (!Array.isArray(history)) throw Error('PARIS_REPAIR_HISTORY_INVALID');
  return {
    status:'dispatched',workflow_run_id:null,error_code:null,
    attempt_count:repair.attempt_count+1,dispatched_at:at,updated_at:at,
    attempt_history:repair.workflow_run_id==null ? history : [...history,{
      event:'prior-workflow-association-retired',runId:repair.workflow_run_id,
      attempt:repair.attempt_count,at,
    }],
  };
}
