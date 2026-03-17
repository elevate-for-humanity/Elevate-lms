import type { ReturnLifecycleStatus } from './types';

/**
 * Valid status transitions for a tax return.
 * Enforced by transitionReturn.ts — no direct status writes bypass this.
 */
export const RETURN_STATUS_FLOW: Record<ReturnLifecycleStatus, ReturnLifecycleStatus[]> = {
  draft: ['in_preparation'],
  in_preparation: ['ready_for_review'],
  ready_for_review: ['review_changes_requested', 'ready_for_signature'],
  review_changes_requested: ['in_preparation'],
  ready_for_signature: ['ready_to_file'],
  ready_to_file: ['transmitted'],
  transmitted: ['accepted', 'rejected'],
  accepted: [],
  rejected: ['in_preparation', 'ready_to_file'],
  amended: [],
};

export function isTerminalStatus(status: ReturnLifecycleStatus): boolean {
  return RETURN_STATUS_FLOW[status].length === 0;
}

export function canTransitionTo(
  current: ReturnLifecycleStatus,
  next: ReturnLifecycleStatus
): boolean {
  return RETURN_STATUS_FLOW[current]?.includes(next) ?? false;
}
