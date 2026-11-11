// Only this provider-generated wait reason may be reconciled from fresh evidence.
// A policy approval, rejection, missing receipt or unrelated task stays gated.
export const PROVIDER_CONFIRMATION_REASON = 'OpenHands is waiting for confirmation. Elevate retains approval authority.';

export function isProviderConfirmationSnapshot(task) {
  return task?.tool_name === 'openhands.execute' &&
    (task.tenant_id ?? null) === null &&
    /^paris-repair:[a-f0-9-]{36}:attempt:[1-9][0-9]*$/.test(task.correlation_id ?? '') &&
    task.approval_status === 'pending' &&
    task.approval_reason === PROVIDER_CONFIRMATION_REASON &&
    typeof task.tool_output?.start_task_id === 'string' &&
    task.tool_output.start_task_id.length > 0;
}
