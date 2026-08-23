import 'server-only';

/**
 * Compatibility facade only.
 *
 * Canonical domain/agent tool authority: lib/ai/tools/registry.ts
 * Canonical low-level workflow primitive policy: lib/workflows/action-policy.ts
 */
export {
  WORKFLOW_ACTION_POLICIES as WORKFLOW_TOOL_REGISTRY,
  getWorkflowActionPolicy as getWorkflowToolDefinition,
  isWorkflowMutationTableAllowed,
  validateWorkflowWebhookUrl,
} from './action-policy';

export type {
  WorkflowActionPolicy as WorkflowToolDefinition,
  WorkflowActionRisk as WorkflowToolRisk,
} from './action-policy';
