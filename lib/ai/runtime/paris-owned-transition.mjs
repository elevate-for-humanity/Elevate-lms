/**
 * Compare-and-swap transitions for signed PARIS repair runs.
 * Caller authorizes run identity; this module enforces the matching owner
 * and expected state before changing any durable repair receipt.
 */
export async function applyOwnedParisRepairTransition(db,{
  id,runId,expectedStatus,values,allowMissing=false,now=new Date().toISOString(),
}) {
  if (typeof id !== 'string' || !id || !Number.isSafeInteger(runId) || runId < 1 ||
      typeof expectedStatus !== 'string' || !expectedStatus ||
      !values || typeof values !== 'object' || Array.isArray(values))
    throw Error('PARIS_REPAIR_TRANSITION_INVALID');
  const {data,error}=await db.from('paris_code_repairs')
    .update({...values,updated_at:now})
    .eq('id',id).eq('workflow_run_id',runId).eq('status',expectedStatus)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data && !allowMissing) throw Error('PARIS_REPAIR_STATE_OWNERSHIP_LOST');
  return Boolean(data);
}
