/**
 * An approved initial request does not automatically authorize a fresh
 * external Cloud execution after verification failure. Only a task that
 * explicitly required no approval may be retried unattended.
 */
export type OpenHandsRetryApprovalState = {
  requires_approval?: boolean | null;
  approval_status?: string | null;
};

export function mayAutoRetryOpenHandsTask(task: OpenHandsRetryApprovalState): boolean {
  return task.requires_approval === false && task.approval_status === 'not_required';
}
