/** Provider-independent dispatch of an already authorized durable receipt.
 * Supabase remains the queue/lease authority. Never retry an ambiguous submit
 * or move it to another provider: the first provider may still be working. */
export async function submitExecution(db, attemptId, providers) {
  const {data, error} = await db.rpc('begin_external_course_dispatch', {p_attempt: attemptId});
  if (error) throw error;
  const attempt = data?.[0];
  if (!attempt) return {dispatched: false, reason: 'ALREADY_DISPATCHED_OR_NOT_AUTHORIZED'};
  const provider = providers[attempt.provider];
  try {
    if (!provider) throw new Error('EXECUTION_PROVIDER_UNAVAILABLE');
    const result = await provider.submit({attemptId: attempt.id});
    if (!result?.executionId) throw new Error('PROVIDER_EXECUTION_ID_REQUIRED');
    const saved = await db.rpc('ack_external_course_dispatch', {
      p_attempt: attempt.id, p_execution: result.executionId,
    });
    if (saved.error) throw saved.error;
    return {dispatched: true, executionVerified: false, provider: attempt.provider,
      attemptId: attempt.id, executionId: result.executionId};
  } catch {
    const uncertain = await db.rpc('mark_external_course_uncertain', {p_attempt: attempt.id});
    if (uncertain.error) throw uncertain.error;
    throw new Error('EXTERNAL_SUBMISSION_UNCERTAIN_RECONCILIATION_REQUIRED');
  }
}

export async function readExecution(db, attemptId) {
  const {data, error} = await db.from('external_course_executions')
    .select('id,job_id,provider,provider_execution_id,state,started_at,finished_at,usage,estimated_cost_micros,actual_cost_micros,credits_reserved,credits_settled')
    .eq('id', attemptId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Provider acknowledgement alone is NOT lease release or a credit refund. */
export async function cancelExecution(db, attemptId, providers) {
  const {data, error} = await db.rpc('request_external_course_cancel', {p_attempt: attemptId});
  if (error) throw error;
  const row = data?.[0];
  if (!row) return {cancelRequested: false};
  if (!row.provider_execution_id) return {cancelRequested: true, reconciliationRequired: true};
  const provider = providers[row.provider];
  if (!provider) throw new Error('EXECUTION_PROVIDER_UNAVAILABLE');
  await provider.cancel({executionId: row.provider_execution_id});
  return {cancelRequested: true, reconciliationRequired: true};
}
