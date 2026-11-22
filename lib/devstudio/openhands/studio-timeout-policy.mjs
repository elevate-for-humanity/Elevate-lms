/**
 * Studio's 360-minute timeout governs locally owned work, not an accepted
 * external OpenHands execution. Provider receipts and outstanding human
 * decisions must be reconciled through the existing supervised gateway.
 */
export function isOpenHandsManagedTask(task) {
  return task?.tool_name === 'openhands.execute';
}

export function shouldExpireOpenHandsWithoutReceipt(task, nowMs, timeoutMinutes) {
  if (task?.status !== 'running') return false;
  // A pending or inconsistent approval must not be converted to timeout failure.
  if (task.requires_approval === true && task.approval_status !== 'approved') return false;
  if (typeof task.tool_output?.start_task_id === 'string' &&
      task.tool_output.start_task_id.length > 0) return false;
  const startedAt = Date.parse(task.started_at ?? task.created_at ?? '');
  return Number.isFinite(startedAt) && startedAt < nowMs - timeoutMinutes * 60_000;
}
