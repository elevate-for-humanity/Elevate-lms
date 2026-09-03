import type { AgenticProjectLifecycleStatus } from './types';

const TRANSITIONS: Record<AgenticProjectLifecycleStatus, readonly AgenticProjectLifecycleStatus[]> =
  {
    discovery: ['planned', 'blocked', 'cancelled', 'archived'],
    planned: ['approved', 'discovery', 'blocked', 'cancelled', 'archived'],
    approved: ['designing', 'building', 'blocked', 'cancelled', 'archived'],
    designing: ['building', 'planned', 'blocked', 'cancelled'],
    building: ['validating', 'repairing', 'blocked', 'cancelled'],
    validating: ['preview_ready', 'repairing', 'blocked', 'cancelled'],
    repairing: ['building', 'validating', 'blocked', 'cancelled'],
    preview_ready: ['awaiting_approval', 'repairing', 'blocked', 'cancelled'],
    awaiting_approval: ['publishing', 'repairing', 'cancelled'],
    publishing: ['live', 'publish_failed', 'rolling_back'],
    publish_failed: ['publishing', 'repairing', 'rolling_back', 'cancelled'],
    live: ['designing', 'building', 'rolling_back', 'archived'],
    rolling_back: ['rolled_back', 'publish_failed'],
    rolled_back: ['live', 'designing', 'building', 'archived'],
    blocked: [
      'discovery',
      'planned',
      'approved',
      'designing',
      'building',
      'validating',
      'repairing',
      'cancelled',
    ],
    cancelled: ['discovery', 'archived'],
    archived: [],
  };

export function allowedAgenticProjectTransitions(
  status: AgenticProjectLifecycleStatus,
): readonly AgenticProjectLifecycleStatus[] {
  return TRANSITIONS[status];
}

export function canTransitionAgenticProject(
  from: AgenticProjectLifecycleStatus,
  to: AgenticProjectLifecycleStatus,
): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertAgenticProjectTransition(
  from: AgenticProjectLifecycleStatus,
  to: AgenticProjectLifecycleStatus,
): void {
  if (!canTransitionAgenticProject(from, to)) {
    throw new Error(`Invalid agentic project lifecycle transition: ${from} -> ${to}`);
  }
}
