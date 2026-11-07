// A workflow lookup can outlive the active repair snapshot. Preserve any
// planner diagnosis or release transition committed while GitHub was queried.
export async function recordFailedRepairWorkflow(db, snapshot, run) {
  if (!['dispatched','patching','validating'].includes(snapshot?.status) ||
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
