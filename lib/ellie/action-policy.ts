import type { EllieActionType, ActionExecutionPolicy } from './actions';
import { getActionExecutionPolicy } from './actions';

export type ExecutionMode = 'autonomous' | 'human_approved';

export interface ActionExecutionContext {
  mode: ExecutionMode;
  preconditionsVerified?: boolean;
  actorId?: string | null;
  reason?: string;
}

export interface ActionPolicyDecision {
  allowed: boolean;
  policy: ActionExecutionPolicy;
  reason: string;
}

export function evaluateActionPolicy(
  actionType: EllieActionType,
  context: ActionExecutionContext,
): ActionPolicyDecision {
  const policy = getActionExecutionPolicy(actionType);

  if (context.mode === 'human_approved') {
    return {
      allowed: true,
      policy,
      reason: 'Authorized human approval supplied.',
    };
  }

  if (policy === 'AUTO') {
    return { allowed: true, policy, reason: 'Action is classified for autonomous execution.' };
  }

  if (policy === 'RULE_VERIFIED') {
    return context.preconditionsVerified
      ? { allowed: true, policy, reason: 'Deterministic preconditions were verified.' }
      : { allowed: false, policy, reason: 'Deterministic preconditions are required.' };
  }

  if (policy === 'APPROVAL') {
    return { allowed: false, policy, reason: 'Authorized human approval is required.' };
  }

  return {
    allowed: false,
    policy,
    reason: 'This action is prohibited from autonomous execution.',
  };
}

export class ActionPolicyError extends Error {
  readonly actionType: EllieActionType;
  readonly policy: ActionExecutionPolicy;

  constructor(actionType: EllieActionType, policy: ActionExecutionPolicy, message: string) {
    super(message);
    this.name = 'ActionPolicyError';
    this.actionType = actionType;
    this.policy = policy;
  }
}

export function assertActionPolicy(
  actionType: EllieActionType,
  context: ActionExecutionContext,
): ActionPolicyDecision {
  const decision = evaluateActionPolicy(actionType, context);
  if (!decision.allowed) {
    throw new ActionPolicyError(actionType, decision.policy, decision.reason);
  }
  return decision;
}
